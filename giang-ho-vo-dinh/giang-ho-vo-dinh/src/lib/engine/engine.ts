import type { ActionRequest, BodyPart, CombatOutcome, EngineResult, GameEvent, GameSnapshot, Injury, NpcState, PlayerState } from '../core/types';
import { clamp, outcomeFromMargin, realmIndex, seededRandom } from '../core/utils';
import { capabilityFrom, attackScore, defenseScore, damageValue, sumItemModifiers } from './formula';
import { resolveWorldConsequences } from './world-tick';
import { remember } from '../memory/memory';

const DAY=86400;
const MINUTE=60;

function eventId(actionId:string, suffix:string){ return `evt_${actionId}_${suffix}`; }
function makeEvent(snapshot:GameSnapshot,action:ActionRequest,cause:string,before:unknown,change:unknown,after:unknown,targetId?:string):GameEvent{
 return {event_id:eventId(action.action_id,`${snapshot.world.event_log.length+1}`),timestamp:snapshot.world.world_time,actor_id:action.actor_id,action_type:action.action_type,target_id:targetId,location_id:snapshot.player.location_id,cause,before,change,after,visibility:'PLAYER'};
}
function currentInjuryModifier(player:PlayerState){ const weights:Record<string,number>={MINOR:.04,MODERATE:.09,SEVERE:.16,CRITICAL:.28}; return player.injuries.reduce((sum,i)=>sum+(weights[i.severity]??0),0); }
function equippedModifiers(snapshot:GameSnapshot, player:PlayerState){ return sumItemModifiers(player.equipment_ids.map(id=>snapshot.world.items[id]).filter(Boolean) as Array<{modifiers:Record<string,number>}>); }
function chooseResponse(npc:NpcState, player:PlayerState){
 const roll=seededRandom(npc.health+player.hp+player.qi.current);
 if(npc.health<30 && roll<0.4) return 'FLEE';
 if(roll<0.28) return 'DODGE';
 if(roll<0.6) return 'DEFEND';
 return 'COUNTER';
}
function addInjury(player:PlayerState, bodyPart:BodyPart, severity:any, modifier:number, recovery:number){
 const injury:Injury={id:`inj_${Date.now()}_${player.injuries.length}`,severity,body_part:bodyPart,combat_modifier:modifier,recovery_time_seconds:recovery};
 player.injuries.push(injury);
 player.meridian.damage=clamp(player.meridian.damage + (severity==='CRITICAL'?10:severity==='SEVERE'?6:severity==='MODERATE'?3:1),0,100);
 player.meridian.flow_modifier=clamp(player.meridian.flow_modifier - (severity==='SEVERE'?0.18:severity==='MODERATE'?0.08:0.03),-0.5,0);
}
function advanceTime(snapshot:GameSnapshot, seconds:number, sourceAction?:ActionRequest){
 const world=snapshot.world;
 const old=world.world_time; const next=old+Math.max(0,seconds);
 world.world_time=next;
 world.calendar.day=Math.floor(next/DAY)+1;
 world.calendar.month=Math.floor((world.calendar.day-1)/30)+1;
 world.calendar.year=Math.floor((world.calendar.day-1)/360)+1;
 const minutes=Math.floor((next%DAY)/MINUTE);
 if(Math.floor(old/DAY)!==Math.floor(next/DAY)) world.global_flags.day_changed=true;
 for(const npc of Object.values(world.npcs) as NpcState[]){
  if(!npc.alive) continue;
  const match=[...npc.schedule].reverse().find(s=>s.time_minute<=minutes);
  if(match?.location_id) npc.location_id=match.location_id;
 }
 if(Math.floor(next/(6*3600))!==Math.floor(old/(6*3600))){
  const cycle=Math.floor(next/(6*3600))%5;
  world.weather_state=(['CLEAR','RAIN','FOG','STORM','SNOW'] as const)[cycle];
 }
 const hours=next-old>=3600?Math.floor((next-old)/3600):0;
 if(hours>0){
  snapshot.player.qi.current=clamp(snapshot.player.qi.current+Math.round(hours*(3+snapshot.player.qi.control*.06)),0,snapshot.player.qi.capacity);
  snapshot.player.stamina=clamp(snapshot.player.stamina+hours*10,0,snapshot.player.max_stamina);
  snapshot.player.hp=clamp(snapshot.player.hp+Math.round(hours*(0.8+snapshot.player.attributes.the_chat*.02)*(snapshot.player.injuries.length?0.35:1)),1,snapshot.player.max_hp);
  for(const injury of snapshot.player.injuries) injury.recovery_time_seconds=Math.max(0,injury.recovery_time_seconds-(next-old));
  snapshot.player.injuries=snapshot.player.injuries.filter(i=>i.recovery_time_seconds>0);
  if(snapshot.player.injuries.length===0 && snapshot.player.meridian.damage>0) snapshot.player.meridian.damage=clamp(snapshot.player.meridian.damage-hours*0.12,0,100);
  if(snapshot.player.cooldowns) for(const [k,v] of Object.entries(snapshot.player.cooldowns)) snapshot.player.cooldowns[k]=Math.max(0,v-(next-old));
 }
 resolveWorldConsequences(snapshot,old,next);
 if(sourceAction && next>old){
  const ev=makeEvent(snapshot,sourceAction,'time_advance',{world_time:old},{seconds:next-old},{world_time:next,calendar:structuredClone(world.calendar),weather:world.weather_state},sourceAction.target_id);
  snapshot.world.event_log.push(ev);
 }
 world.global_flags.time_jumped=true;
}


function updateQuestProgress(snapshot:GameSnapshot,trigger:string,action?:ActionRequest){
 const p=snapshot.player;
 for(const id of [...p.active_quests]){
  const q=snapshot.world.quests[id]; if(!q||q.state==='COMPLETED'||q.state==='FAILED') continue;
  if(trigger===id||q.objectives[0]?.description.includes(trigger)){
   const before=structuredClone(q);
   q.objectives[0].progress=Math.min(q.objectives[0].target,q.objectives[0].progress+1); q.state='PROGRESSING';
   if(q.objectives[0].progress>=q.objectives[0].target){ q.state='COMPLETED'; p.active_quests=p.active_quests.filter(x=>x!==id); p.completed_quests=[...p.completed_quests,id]; p.reputation+=3; p.money+=30; }
   if(action){ const ev=makeEvent(snapshot,action,'quest_progress',before,{quest_id:id,progress:q.objectives[0].progress,state:q.state},{quest:structuredClone(q),reputation:p.reputation,money:p.money},id); snapshot.world.event_log.push(ev); }
  }
 }
}

function resolveTravel(snapshot:GameSnapshot,action:ActionRequest):EngineResult{
 const player=snapshot.player;
 const destId=String(action.parameters?.location_id??'');
 const dest=snapshot.world.locations[destId];
 const from=snapshot.world.locations[player.location_id];
 if(!dest || !from || !from.connections.includes(destId)) return reject(action,'INVALID_ROUTE','Không có tuyến đường hợp lệ đến địa điểm đó.');
 const cap=capabilityFrom(player.attributes,player.realm,player.qi,player.injuries.length,equippedModifiers(snapshot,player));
 const injuryFactor=1+currentInjuryModifier(player);
 const seconds=Math.max(300,Math.round((dest.base_travel_time*(1+dest.danger_level*.04)*injuryFactor)/(1+cap.mobility/160)));
 const before=player.location_id; advanceTime(snapshot,seconds,action); player.location_id=destId;
 if(destId==='mist_valley') updateQuestProgress(snapshot,'q_trade',action); if(destId==='jade_cliff') { updateQuestProgress(snapshot,'q_missing',action); updateQuestProgress(snapshot,'q_escort',action); }
 const ev=makeEvent(snapshot,action,'travel',before,destId,destId,destId);
 snapshot.world.event_log.push(ev);
 return ok(action,'SUCCESS',seconds,[{field:'player.location_id',from:before,to:destId}], [ev], [`Ngươi đã tới ${dest.name}.`]);
}

function resolveItem(snapshot:GameSnapshot,action:ActionRequest):EngineResult{
 const itemId=String(action.target_id??action.parameters?.item_id??'');
 const item=snapshot.world.items[itemId];
 if(!item || !snapshot.player.inventory_ids.includes(itemId) || item.quantity<1) return reject(action,'ITEM_UNAVAILABLE','Vật phẩm không có trong túi.');
 const mode=String(action.parameters?.mode??'USE');
 const before=structuredClone({hp:snapshot.player.hp,qi:snapshot.player.qi.current,equipment:[...snapshot.player.equipment_ids],inventory:[...snapshot.player.inventory_ids]});
 if(mode==='EQUIP' || ['WEAPON','ARMOR'].includes(item.category)){
  if(!['WEAPON','ARMOR','DEFENSE'].includes(item.category)) return reject(action,'ITEM_NOT_EQUIPPABLE','Vật phẩm này không thể trang bị.');
  const sameCategory=snapshot.player.equipment_ids.find(id=>snapshot.world.items[id]?.category===item.category);
  snapshot.player.equipment_ids=snapshot.player.equipment_ids.filter(id=>id!==sameCategory);
  if(!snapshot.player.equipment_ids.includes(itemId)) snapshot.player.equipment_ids.push(itemId);
  advanceTime(snapshot,30,action);
  const ev=makeEvent(snapshot,action,'equip_item',before,{item:itemId},{equipment:[...snapshot.player.equipment_ids]},itemId); snapshot.world.event_log.push(ev);
  return ok(action,'SUCCESS',30,[{field:'equipment',value:[...snapshot.player.equipment_ids]}],[ev],[`Ngươi trang bị ${item.name}.`]);
 }
 if(item.category==='MEDICINE'){
  const heal=Number(item.modifiers.heal??0); snapshot.player.hp=clamp(snapshot.player.hp+heal,0,snapshot.player.max_hp); item.quantity--;
  if(/thảo dược|huyết sâm|linh chi|nấm hàn vụ/i.test(item.name)) updateQuestProgress(snapshot,'q_medicine',action);
  advanceTime(snapshot,300,action);
  const ev=makeEvent(snapshot,action,'use_item',before,{hp:snapshot.player.hp-before.hp},{hp:snapshot.player.hp,qi:snapshot.player.qi.current},itemId); snapshot.world.event_log.push(ev);
  return ok(action,'SUCCESS',300,[{field:'player.hp',from:before.hp,to:snapshot.player.hp}],[ev],[`Dùng ${item.name}, hồi ${snapshot.player.hp-before.hp} HP.`]);
 }
 return reject(action,'ITEM_NOT_USABLE','Vật phẩm này chưa có cách sử dụng nhanh trong vertical slice.');
}

function resolveObserve(snapshot:GameSnapshot,action:ActionRequest):EngineResult{
 const mode=String(action.parameters?.mode??'');
 if(mode==='TRAIN'){ const hours=Number(action.parameters?.hours??2); const seconds=Math.round(clamp(hours,1,8)*3600); const maId=String(action.parameters?.martial_art_id??snapshot.player.martial_art_ids[0]); const before={qi:snapshot.player.qi.current,mastery:snapshot.player.mastery[maId]??0,flow:snapshot.player.meridian.flow_modifier}; const safe=snapshot.player.meridian.health>35&&snapshot.player.meridian.damage<50&&snapshot.player.qi.current>=Math.min(snapshot.player.qi.capacity,20); advanceTime(snapshot,seconds,action); if(!safe){ snapshot.player.meridian.damage=clamp(snapshot.player.meridian.damage+3,0,100); snapshot.player.hp=clamp(snapshot.player.hp-6,1,snapshot.player.max_hp); } else { snapshot.player.mastery[maId]=clamp((snapshot.player.mastery[maId]??0)+Math.round(hours*2+(snapshot.player.attributes.ngo_tinh+snapshot.player.attributes.can_co)/40),0,100); snapshot.player.qi.current=clamp(snapshot.player.qi.current+Math.round(hours*4),0,snapshot.player.qi.capacity); } const ev=makeEvent(snapshot,action,'training',before,{safe,maId},{qi:snapshot.player.qi.current,mastery:snapshot.player.mastery[maId]??0,flow:snapshot.player.meridian.flow_modifier}); snapshot.world.event_log.push(ev); return ok(action,safe?'SUCCESS':'FAILURE',seconds,[{field:'training',safe},{field:'mastery',to:snapshot.player.mastery[maId]??0},{field:'qi',to:snapshot.player.qi.current}],[ev],[safe?`Ngươi tĩnh tọa luyện ${hours} giờ, võ học có tiến bộ.`:'Căn cơ và kinh mạch chưa ổn; ngươi cưỡng ép luyện công và phải trả giá.']); }
 if(mode==='REST'){ const hours=Number(action.parameters?.hours??8); const seconds=Math.round(clamp(hours,1,10)*3600); const before={hp:snapshot.player.hp,qi:snapshot.player.qi.current,stamina:snapshot.player.stamina,injuries:snapshot.player.injuries.length}; advanceTime(snapshot,seconds,action); const ev=makeEvent(snapshot,action,'rest',before,{hours},{hp:snapshot.player.hp,qi:snapshot.player.qi.current,stamina:snapshot.player.stamina,injuries:snapshot.player.injuries.length}); snapshot.world.event_log.push(ev); return ok(action,'SUCCESS',seconds,[{field:'rest_hours',value:hours},{field:'injuries',from:before.injuries,to:snapshot.player.injuries.length}],[ev],[`Ngươi nghỉ ${hours} giờ; khí huyết và thể lực dần hồi phục.`]); }
 if(mode==='BREAKTHROUGH'){ const targetRealm=String(action.parameters?.target_realm??''); const curr=realmIndex(snapshot.player.realm); const next=curr+1; const threshold=Math.round(48+curr*3); const score=snapshot.player.attributes.can_co+snapshot.player.attributes.ngo_tinh+snapshot.player.attributes.tam_canh+snapshot.player.qi.quality+(snapshot.player.meridian.health-snapshot.player.meridian.damage)*0.4; const risk=snapshot.player.meridian.damage>45||snapshot.player.qi.current<snapshot.player.qi.capacity*.45; const before=snapshot.player.realm; advanceTime(snapshot,3600*4,action); let out='FAILURE'; if(next>=0&&next<10&&score>=threshold){ snapshot.player.realm=['Phàm Nhân','Luyện Thể','Luyện Khí','Thông Mạch','Ngưng Khí','Tiểu Thành','Đại Thành','Tông Sư','Đại Tông Sư','Tuyệt Đỉnh'][next] as any; out=risk?'PARTIAL':'SUCCESS'; if(risk) snapshot.player.meridian.damage=clamp(snapshot.player.meridian.damage+6,0,100); } else if(score>=threshold-10&&risk){ out='BACKLASH'; snapshot.player.hp=clamp(snapshot.player.hp-15,1,snapshot.player.max_hp); snapshot.player.meridian.damage=clamp(snapshot.player.meridian.damage+10,0,100); } const ev=makeEvent(snapshot,action,'breakthrough',before,{score,risk,targetRealm},snapshot.player.realm); snapshot.world.event_log.push(ev); return ok(action,out,14400,[{field:'realm',from:before,to:snapshot.player.realm},{field:'breakthrough_score',value:score}],[ev],[out==='SUCCESS'?`Ngươi đột phá thành công, bước vào ${snapshot.player.realm}.`:out==='PARTIAL'?`Ngươi chạm tới ${snapshot.player.realm}, nhưng nền móng còn tổn thương.`:out==='BACKLASH'?'Kinh mạch phản chấn; khí huyết đảo lộn.':'Đột phá thất bại, cảnh giới chưa đổi.']); }
 const target=action.target_id?snapshot.world.npcs[action.target_id]:undefined;
 if(target && (!target.alive || target.location_id!==snapshot.player.location_id)) return reject(action,'TARGET_UNAVAILABLE','Mục tiêu không ở cùng địa điểm.');
 advanceTime(snapshot,300,action);
 if(target){
  const id=`kn_${snapshot.player.id}_${target.id}_${snapshot.world.world_time}`;
  snapshot.world.knowledge[id]={id,subject:target.id,claim:`${target.name}: khí tức ${target.realm}, hành vi ${target.personality[0] ?? 'khó đoán'}.`,confidence:.55,source:'observation',timestamp:snapshot.world.world_time,visibility:'PLAYER',owner_id:snapshot.player.id}; snapshot.player.knowledge_ids.push(id); remember(snapshot,snapshot.player.id,`Quan sát ${target.name}: ${target.realm}.`,target.id,'MEDIUM');
  if(target.id==='npc_jia') updateQuestProgress(snapshot,'q_rumor',action);
  const ev=makeEvent(snapshot,action,'observe_npc',null,{knowledge_id:id},snapshot.world.knowledge[id],target.id); snapshot.world.event_log.push(ev);
  return ok(action,'SUCCESS',300,[{field:'knowledge',added:id}], [ev], [`Ngươi quan sát ${target.name}: chỉ chắc rằng đối phương ở cảnh giới ${target.realm}.`]);
 }
 const loc=snapshot.world.locations[snapshot.player.location_id];
 return ok(action,'SUCCESS',300,[],[],[`Ngươi dành thời gian quan sát ${loc.name}, ghi nhớ địa hình và những con đường có thể rút lui.`]);
}

function resolveTalk(snapshot:GameSnapshot,action:ActionRequest):EngineResult{
 const npc=action.target_id?snapshot.world.npcs[action.target_id]:undefined;
 if(!npc||!npc.alive||npc.location_id!==snapshot.player.location_id) return reject(action,'TARGET_UNAVAILABLE','Không có NPC phù hợp ở đây.');
 const questId=String(action.parameters?.quest_id??''); const questAction=String(action.parameters?.quest_action??'');
 const trade=String(action.parameters?.trade??''); const tradeItemId=String(action.parameters?.item_id??'');
 if(questId && questAction){ const q=snapshot.world.quests[questId]; if(!q) return reject(action,'QUEST_INVALID','Nhiệm vụ không tồn tại.'); if(questAction==='ACCEPT'&&q.state==='AVAILABLE'){ const beforeQuest=structuredClone(q); q.state='ACTIVE'; q.participants=[npc.id]; snapshot.player.active_quests=[...snapshot.player.active_quests,questId]; advanceTime(snapshot,120,action); const ev=makeEvent(snapshot,action,'quest_accept',beforeQuest,{state:'ACTIVE'},q,npc.id); snapshot.world.event_log.push(ev); return ok(action,'SUCCESS',120,[{field:'quest',id:questId,state:'ACTIVE'}],[ev],[`Ngươi nhận nhiệm vụ ${q.name}.`]); } if(questAction==='ABANDON'&&(q.state==='ACTIVE'||q.state==='PROGRESSING')){ const beforeQuest=structuredClone(q); q.state='ABANDONED'; snapshot.player.active_quests=snapshot.player.active_quests.filter(x=>x!==questId); advanceTime(snapshot,60,action); const ev=makeEvent(snapshot,action,'quest_abandon',beforeQuest,{quest_id:questId,state:'ABANDONED'},q,npc.id); snapshot.world.event_log.push(ev); return ok(action,'SUCCESS',60,[{field:'quest',id:questId,state:'ABANDONED'}],[ev],[`Ngươi từ bỏ ${q.name}.`]); } }
 const factionId=String(action.parameters?.faction_id??''); const factionAction=String(action.parameters?.faction_action??'');
 if(factionId&&factionAction){ const faction=snapshot.world.factions[factionId]; if(!faction) return reject(action,'FACTION_INVALID','Tổ chức không tồn tại.'); if(factionAction==='JOIN'&&!snapshot.player.faction_ids.includes(factionId)){ snapshot.player.faction_ids=[...snapshot.player.faction_ids,factionId]; snapshot.world.reputations[`faction:${factionId}`]=clamp((snapshot.world.reputations[`faction:${factionId}`]??0)+10,-100,100); advanceTime(snapshot,300,action); const ev=makeEvent(snapshot,action,'faction_join',null,{faction_id:factionId,state:'JOINED'},snapshot.player.faction_ids,factionId); snapshot.world.event_log.push(ev); return ok(action,'SUCCESS',300,[{field:'faction_membership',faction_id:factionId,state:'JOINED'}],[ev],[`Ngươi gia nhập ${faction.name}.`]); } if(factionAction==='LEAVE'&&snapshot.player.faction_ids.includes(factionId)){ snapshot.player.faction_ids=snapshot.player.faction_ids.filter(id=>id!==factionId); advanceTime(snapshot,120,action); const ev=makeEvent(snapshot,action,'faction_leave',null,{faction_id:factionId,state:'LEFT'},snapshot.player.faction_ids,factionId); snapshot.world.event_log.push(ev); return ok(action,'SUCCESS',120,[{field:'faction_membership',faction_id:factionId,state:'LEFT'}],[ev],[`Ngươi rời ${faction.name}.`]); } }
 if(trade==='SELL' && tradeItemId){ const item=snapshot.world.items[tradeItemId]; if(npc.faction_id!=='f_trade') return reject(action,'TRADE_NOT_AVAILABLE','Người này không thu mua hàng.'); if(!item||!snapshot.player.inventory_ids.includes(tradeItemId)||item.quantity<1) return reject(action,'ITEM_UNAVAILABLE','Vật phẩm không có để bán.'); if(snapshot.player.equipment_ids.includes(tradeItemId)) return reject(action,'ITEM_EQUIPPED','Không thể bán vật đang trang bị.'); const price=Math.max(1,Math.floor((snapshot.world.market_state.base_price[tradeItemId]??50)*.6*item.quantity)); snapshot.player.money+=price; snapshot.player.inventory_ids=snapshot.player.inventory_ids.filter(id=>id!==tradeItemId); item.owner_id=npc.id; snapshot.world.market_state.supply[tradeItemId]=clamp((snapshot.world.market_state.supply[tradeItemId]??20)+item.quantity,0,10000); advanceTime(snapshot,180,action); const ev=makeEvent(snapshot,action,'trade_sell',item.name,price,snapshot.player.money,npc.id); snapshot.world.event_log.push(ev); return ok(action,'SUCCESS',180,[{field:'money',delta:price},{field:'inventory_removed',item:tradeItemId}],[ev],[`Ngươi bán toàn bộ ${item.name} với giá ${price} bạc.`]); }
 if(trade==='BUY' && tradeItemId){ if(npc.faction_id!=='f_trade') return reject(action,'TRADE_NOT_AVAILABLE','Người này không bán hàng.'); const item=snapshot.world.items[tradeItemId]; const price=Math.max(1,Math.floor((snapshot.world.market_state.base_price[tradeItemId]??50)*(1+(snapshot.world.market_state.demand[tradeItemId]??0)*.01))); if(!item) return reject(action,'ITEM_INVALID','Món hàng không tồn tại.'); if(snapshot.player.money<price) return reject(action,'INSUFFICIENT_FUNDS','Không đủ bạc.'); snapshot.player.money-=price; if(!snapshot.player.inventory_ids.includes(tradeItemId)) snapshot.player.inventory_ids.push(tradeItemId); item.owner_id=snapshot.player.id; item.quantity=Math.max(1,item.quantity); advanceTime(snapshot,180,action); const ev=makeEvent(snapshot,action,'trade_buy',price,item.name,snapshot.player.money,npc.id); snapshot.world.event_log.push(ev); return ok(action,'SUCCESS',180,[{field:'money',delta:-price},{field:'inventory',item:tradeItemId}],[ev],[`Ngươi mua ${item.name} với giá ${price} bạc.`]); }
 advanceTime(snapshot,300,action);
 const relKey=`rel_${snapshot.player.id}_${npc.id}`; const rel=snapshot.world.relationships[relKey]??{actor_id:snapshot.player.id,target_id:npc.id,trust:0,respect:0,fear:0,hatred:0,debt:0,affection:0,suspicion:0};
 rel.trust=clamp(rel.trust+1,-100,100); remember(snapshot,snapshot.player.id,`Đã trò chuyện với ${npc.name}; mức tin cậy hiện tại ${rel.trust}.`,npc.id,'MEDIUM'); remember(snapshot,npc.id,`Đã tiếp chuyện với ${snapshot.player.name}; mức tin cậy đối với người này ${rel.trust}.`,snapshot.player.id,'MEDIUM',snapshot.player.location_id); if(npc.id==='npc_he') updateQuestProgress(snapshot,'q_secret',action); snapshot.world.relationships[relKey]=rel;
 const ev=makeEvent(snapshot,action,'dialogue',null,{trust:+1},rel,npc.id); snapshot.world.event_log.push(ev);
 return ok(action,'SUCCESS',300,[{field:`relationships.${relKey}.trust`,delta:1}], [ev],[`Ngươi trò chuyện với ${npc.name}. Người kia không lập tức tin tưởng, nhưng đã chịu nghe ngươi nói.`]);
}

function resolveCombat(snapshot:GameSnapshot,action:ActionRequest):EngineResult{
 const player=snapshot.player; const npc=action.target_id?snapshot.world.npcs[action.target_id]:undefined;
 if(!npc||!npc.alive||npc.location_id!==player.location_id) return reject(action,'COMBAT_TARGET_INVALID','Không có mục tiêu chiến đấu hợp lệ.');
 if(action.action_type==='SURRENDER'){
  player.status=player.status.filter(s=>!s.startsWith('COMBAT:')); player.status.push('CAPTURED'); advanceTime(snapshot,120,action); return ok(action,'CAPTURE',120,[{field:'player.status',value:'CAPTURED'}],[],['Ngươi buông vũ khí. Kẻ địch áp giải ngươi đi.']);
 }
 if(action.action_type==='FLEE'){
  const pc=capabilityFrom(player.attributes,player.realm,player.qi,player.injuries.length,equippedModifiers(snapshot,player)); const nc=capabilityFrom(npc.attributes,npc.realm,npc.qi,0,sumItemModifiers(npc.equipment_ids.map(id=>snapshot.world.items[id]).filter(Boolean) as Array<{modifiers:Record<string,number>}>)); const terrain= snapshot.world.locations[player.location_id].danger_level>=5?-6:2; const margin=pc.mobility-nc.mobility+terrain+(player.qi.current>npc.qi.current?3:-3);
  const roll=seededRandom(snapshot.world.world_time+player.hp); const success=margin+(roll-.5)*10>0;
  advanceTime(snapshot,90,action);
  if(success){ player.status=player.status.filter(s=>!s.startsWith('COMBAT:')); const ev=makeEvent(snapshot,action,'escape',null,'escaped',player.status,npc.id); snapshot.world.event_log.push(ev); return ok(action,'SURVIVE',90,[{field:'combat',value:'ended'}],[ev],['Ngươi lợi dụng khoảng cách và địa hình, thoát khỏi vòng vây.']); }
  return ok(action,'FAILURE',90,[],[],['Ngươi không thoát được; đối thủ đã bám sát.']);
 }
 const response=chooseResponse(npc,player);
 const pmaId=String(action.parameters?.martial_art_id??player.martial_art_ids[0]); const ma=snapshot.world.martial_arts[pmaId]; const techId=String(action.parameters?.technique_id??ma?.technique_ids[0]??'');
 const tech=snapshot.world.techniques[techId]; const mastery=player.mastery[techId]??player.mastery[pmaId]??0;
 if(!ma || !player.martial_art_ids.includes(pmaId)) return reject(action,'MARTIAL_ART_UNAVAILABLE','Ngươi chưa học môn võ này.');
 if(!tech || tech.martial_art_id!==pmaId || !ma.technique_ids.includes(techId)) return reject(action,'TECHNIQUE_INVALID','Chiêu thức không thuộc võ công đã học.');
 if(realmIndex(player.realm) < realmIndex(ma.realm_requirement)) return reject(action,'REALM_REQUIREMENT','Cảnh giới chưa đủ để vận dụng võ công này.');
 const requiredQiCapacity=Number(ma.qi_requirements.capacity??0);
 if(player.qi.capacity<requiredQiCapacity) return reject(action,'QI_REQUIREMENT','Khí hải chưa đủ để vận dụng võ công này.');
 const cooldown=player.cooldowns?.[tech.id]??0; if(cooldown>0) return reject(action,'COOLDOWN','Chiêu thức chưa hồi.');
 const staminaCost=action.action_type==='DEFEND'||action.action_type==='DODGE'||action.action_type==='COUNTER'?4:tech.stamina_cost;
 const qiCost=action.action_type==='DEFEND'||action.action_type==='DODGE'||action.action_type==='COUNTER'?0:tech.qi_cost;
 if(player.stamina<staminaCost) return reject(action,'INSUFFICIENT_STAMINA','Thể lực không đủ.');
 if(player.qi.current<qiCost) return reject(action,'INSUFFICIENT_QI','Nội lực không đủ.');
 const pcap=capabilityFrom(player.attributes,player.realm,player.qi,player.injuries.length,equippedModifiers(snapshot,player)); const ncap=capabilityFrom(npc.attributes,npc.realm,npc.qi,0,sumItemModifiers(npc.equipment_ids.map(id=>snapshot.world.items[id]).filter(Boolean) as Array<{modifiers:Record<string,number>}>));
 const timing=Number(action.parameters?.timing_bonus??0); const info=player.knowledge_ids.some((k:string)=>snapshot.world.knowledge[k]?.subject===npc.id)?4:0; const pos=Number(action.parameters?.position_bonus??0);
 const pScore=attackScore(pcap,tech,mastery,timing,info,pos);
 const counterBonus=response==='COUNTER'?8:response==='DODGE'?4:0;
 const nScore=defenseScore(ncap,response,counterBonus,0,0,0);
 const roll=seededRandom(snapshot.world.world_time + player.hp + npc.health + (action.action_id.length*13));
 const outcome:CombatOutcome=outcomeFromMargin(pScore-nScore,roll);
 const critical=outcome==='CRITICAL_SUCCESS'?1.5:outcome==='CRITICAL_FAILURE'?1:1;
 const counterModifier=outcome==='ADVANTAGE'?1.12:outcome==='SUCCESS'?1.0:outcome==='CRITICAL_SUCCESS'?1.35:outcome==='NEUTRAL'?.65:outcome==='DISADVANTAGE'?.45:.25;
 const rawScaling=tech? (Object.entries(tech.scaling) as [string,number][]).reduce((sum,[k,v])=>sum+((player.attributes as any)[k]??0)*v*.12,0) : pcap.attack*.15;
 const playerDamage=action.action_type==='DEFEND'||action.action_type==='DODGE'||action.action_type==='COUNTER'?0:damageValue(tech?.base_power??16,rawScaling,player.qi.quality,mastery,counterModifier,Number(equippedModifiers(snapshot,player).armor??4),currentInjuryModifier(player),critical);
 let npcDamage=0;
 if(outcome==='CRITICAL_FAILURE'||response==='COUNTER'||response==='DODGE'){
  const ntech=snapshot.world.techniques[snapshot.world.martial_arts[npc.martial_art_ids[0]]?.technique_ids[0] ?? ''];
  const nd=attackScore(ncap,ntech,snapshot.world.martial_arts[npc.martial_art_ids[0]]?.mastery??15,0,0,0);
  const pd=defenseScore(pcap,action.action_type,0,0,info,0);
  const nOutcome=outcomeFromMargin(nd-pd,seededRandom(npc.health+player.hp+19));
  const mod=nOutcome==='CRITICAL_SUCCESS'?1.3:nOutcome==='SUCCESS'?.9:nOutcome==='ADVANTAGE'?.65:.35;
  npcDamage=damageValue(ntech?.base_power??15,nd*.06,npc.qi.quality,15,mod,2,currentInjuryModifier(player),1);
 }
 const before={player_hp:player.hp,npc_hp:npc.health,player_qi:player.qi.current,npc_qi:npc.qi.current,stamina:player.stamina};
 npc.health=clamp(npc.health-playerDamage,0,npc.max_health);
 player.hp=clamp(player.hp-npcDamage,0,player.max_hp);
 player.qi.current=clamp(player.qi.current-qiCost,0,player.qi.capacity);
 player.stamina=clamp(player.stamina-staminaCost,0,player.max_stamina);
 player.cooldowns[tech.id]=tech.cooldown*MINUTE;
 advanceTime(snapshot,60,action);
 let hints:string[]=[];
 if(playerDamage>0) hints.push(`Ngươi gây ${playerDamage} sát thương lên ${npc.name}.`);
 if(npcDamage>0) hints.push(`${npc.name} phản kích, gây ${npcDamage} sát thương.`);
 if(outcome==='CRITICAL_SUCCESS') hints.push('Đòn đánh trúng đúng thời cơ, tạo thương thế nặng.');
 if(outcome==='CRITICAL_FAILURE') hints.push('Nhịp xuất thủ hỏng; thế trận lập tức nguy hiểm.');
 if(npc.health<=0){ npc.alive=false; npc.status.push('DEAD'); player.status=player.status.filter(s=>!s.startsWith('COMBAT:')); hints.push(`${npc.name} đã ngã xuống.`); }
 else if(player.hp<=0){ player.alive=false; player.status=player.status.filter(s=>!s.startsWith('COMBAT:')); hints.push('Sinh mệnh của ngươi đã cạn.'); }
 else player.status=[...player.status.filter(s=>!s.startsWith('COMBAT:')),`COMBAT:${npc.id}`];
 if(npcDamage>=30) addInjury(player,['TORSO','LEFT_ARM','RIGHT_ARM','LEFT_LEG','RIGHT_LEG'][Math.floor(roll*5)] as BodyPart,npcDamage>=55?'SEVERE':npcDamage>=40?'MODERATE':'MINOR',npcDamage>=55?.18:npcDamage>=40?.1:.05,npcDamage>=55?DAY*3:npcDamage>=40?DAY:DAY/2);
 const ev=makeEvent(snapshot,action,'combat_resolution',before,{outcome,playerDamage,npcDamage},{player_hp:player.hp,npc_hp:npc.health,player_qi:player.qi.current,npc_qi:npc.qi.current},npc.id); snapshot.world.event_log.push(ev);
 remember(snapshot,npc.id,`Giao tranh với ${player.name}: kết quả ${outcome}, đối phương gây ${npcDamage} và chịu ${playerDamage} sát thương.`,player.id,'HIGH',snapshot.player.location_id);
 const finalOutcome=npc.health<=0?'WIN':player.hp<=0?'DEATH':outcome;
 return ok(action,finalOutcome,60,[{field:'combat.outcome',value:outcome},{field:'player.hp',to:player.hp},{field:'npc.hp',to:npc.health},{field:'player.qi',to:player.qi.current}], [ev], hints);
}

function reject(action:ActionRequest,error_code:string,error_message:string):EngineResult{return {schema_version:'1.0',action_id:action.action_id,status:'REJECTED',time_elapsed_seconds:0,state_changes:[],events:[],narration_hints:[],error_code,error_message};}
function ok(action:ActionRequest,outcome:string,time_elapsed_seconds:number,state_changes:unknown[],events:GameEvent[],narration_hints:string[]):EngineResult{return {schema_version:'1.0',action_id:action.action_id,status:'ACCEPTED',outcome,time_elapsed_seconds,state_changes,events,narration_hints};}

export class GameEngine{
 resolve(snapshot:GameSnapshot,action:ActionRequest):EngineResult{
  if(!snapshot.player.alive && action.action_type!=='OBSERVE') return reject(action,'PLAYER_DEAD','Nhân vật đã chết.');
  if(action.actor_id!==snapshot.player.id) return reject(action,'ACTOR_MISMATCH','Actor không phải player hiện tại.');
  switch(action.action_type){
   case 'MOVE': return resolveTravel(snapshot,action);
   case 'USE_ITEM': return resolveItem(snapshot,action);
   case 'OBSERVE': return resolveObserve(snapshot,action);
   case 'TALK': return resolveTalk(snapshot,action);
   case 'ATTACK': case 'DEFEND': case 'DODGE': case 'COUNTER': case 'FEINT': case 'FEINT_ATTACK': case 'USE_SKILL': case 'FLEE': case 'SURRENDER': return resolveCombat(snapshot,action);
   default: return reject(action,'UNKNOWN_ACTION','Action chưa được Engine hỗ trợ.');
  }
 }
}
