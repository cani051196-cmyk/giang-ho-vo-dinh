import type { ActionType, IntentParserOutput } from '../core/types';

function pickNpcTarget(input:string,npcs:Record<string,{name:string}>){
 const lower=input.toLowerCase();
 for(const [id,n] of Object.entries(npcs)) if(lower.includes(n.name.toLowerCase())) return id;
 return undefined;
}
export function parseIntent(input:string,snapshot:{player?:{location_id:string};world:{npcs:Record<string,{name:string;faction_id?:string;location_id?:string}>;locations:Record<string,{id:string;name:string}>;items?:Record<string,{name:string}>;factions?:Record<string,{name:string}>;quests?:Record<string,{name:string;participants?:string[]}>}}):IntentParserOutput{
 const text=input.trim().toLowerCase();
 let targetId=pickNpcTarget(text,snapshot.world.npcs);
 const loc=Object.values(snapshot.world.locations).find(l=>text.includes(l.name.toLowerCase()));
 let action_type:ActionType|undefined;
 const params:Record<string,unknown>={};
 if(/chạy|bỏ chạy|trốn|thoát/.test(text)) action_type='FLEE';
 else if(/đầu hàng|xin hàng|quỳ xuống/.test(text)) action_type='SURRENDER';
 else if(/gia nhập|bái nhập|tham gia/.test(text) && snapshot.world.factions){ action_type='TALK'; const faction=Object.entries(snapshot.world.factions).find(([_,f])=>text.includes(f.name.toLowerCase())); if(faction){ params.faction_id=faction[0]; params.faction_action='JOIN'; const nearby=Object.entries(snapshot.world.npcs).find(([_,n])=>n.faction_id===faction[0] && (!snapshot.player || n.location_id===snapshot.player.location_id)); if(nearby && !targetId) targetId=nearby[0]; } }
 else if(/rời|thoát khỏi/.test(text) && snapshot.world.factions){ action_type='TALK'; const faction=Object.entries(snapshot.world.factions).find(([_,f])=>text.includes(f.name.toLowerCase())); if(faction){ params.faction_id=faction[0]; params.faction_action='LEAVE'; const nearby=Object.entries(snapshot.world.npcs).find(([_,n])=>n.faction_id===faction[0] && (!snapshot.player || n.location_id===snapshot.player.location_id)); if(nearby && !targetId) targetId=nearby[0]; } }
 else if(/nhận nhiệm vụ|nhận quest|tiếp nhận/.test(text) && snapshot.world.quests){ action_type='TALK'; const q=Object.entries(snapshot.world.quests).find(([_,v])=>text.includes(v.name.toLowerCase())); if(q){ params.quest_id=q[0]; params.quest_action='ACCEPT'; const npcId=q[1].participants?.find(id=>{ const n=snapshot.world.npcs[id]; return !snapshot.player || n?.location_id===snapshot.player.location_id; }); if(npcId && !targetId) targetId=npcId; } }
 else if(/đột phá|phá cảnh|đột cảnh/.test(text)) { action_type='OBSERVE'; params.mode='BREAKTHROUGH'; }
 else if(/luyện công|luyện võ|tu luyện|tĩnh tọa/.test(text)) { action_type='OBSERVE'; params.mode='TRAIN'; const hours=text.match(/(\d+(?:[.,]\d+)?)\s*giờ/); if(hours) params.hours=Number(hours[1].replace(',','.')); }
 else if(/ngủ|nghỉ ngơi|nghỉ một chút|hồi phục/.test(text)) { action_type='OBSERVE'; params.mode='REST'; }
 else if(/quan sát|nhìn kỹ|do thám/.test(text)) action_type='OBSERVE';
 else if(/nói|hỏi|trò chuyện|trao đổi/.test(text)) action_type='TALK';
 else if(/đi tới|đến |đi về|hành quân|đi sang/.test(text)) action_type='MOVE';
 else if(/trang bị|mặc|đeo/.test(text)) { action_type='USE_ITEM'; params.mode='EQUIP'; }
 else if(/uống|dùng|ăn|bôi|sử dụng/.test(text)) action_type='USE_ITEM';
 else if(/phòng thủ|đỡ|thủ thế/.test(text)) action_type='DEFEND';
 else if(/né|tránh/.test(text)) action_type='DODGE';
 else if(/phản công|phản kích/.test(text)) action_type='COUNTER';
 else if(/giả vờ|hư chiêu/.test(text)) action_type='FEINT';
 else if(/đánh lừa|giả công/.test(text)) action_type='FEINT_ATTACK';
 else if(/đánh|tấn công|ra đòn|chém|đấm|đâm|vỗ/.test(text)) action_type='ATTACK';
 if(action_type==='MOVE'&&loc) params.location_id=loc.id;
 if(action_type==='USE_ITEM') params.item_id=Object.entries(snapshot.world.items??{}).find(([_,i])=>text.includes(i.name.toLowerCase()))?.[0];
 const intent_status=!action_type?'UNKNOWN':(targetId||loc||Object.keys(params).length?'EXACT':'PARTIAL');
 return {schema_version:'1.0',intent_status,action_type,target_id:targetId,parameters:Object.keys(params).length?params:undefined,confidence:action_type?0.82:0.12};
}
