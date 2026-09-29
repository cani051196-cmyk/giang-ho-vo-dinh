<script lang="ts">
 import { onMount } from 'svelte';
 import type { ActionType, GameSnapshot, NpcState } from '$lib/core/types';
 import { cacheSnapshot, getCachedSnapshot } from '$lib/ui/local-store';

 let snapshot:GameSnapshot|null=null;
 let narration=''; let input=''; let busy=false; let error='';
 let messages:{role:'player'|'narrator';text:string}[]=[];
 let panel:'status'|'inventory'|'skills'|'quests'|'people'|'market'='status';
 let charName=''; let archetype:'du_hiep'|'kiem_khach'|'noi_gia'|'ho_the'='du_hiep';
 let installPrompt: any = null;
 let isStandalone = false;

 async function api(url:string,opts?:RequestInit){ const response=await fetch(url,opts); if(!response.ok) throw new Error(await response.text()); return response.json(); }
 async function load(){
  try { snapshot=await api('/api/state'); await cacheSnapshot(snapshot!); }
  catch(e){ const cached=await getCachedSnapshot(); if(cached) snapshot=cached; else error=String(e); }
 }
 async function action(body:unknown){
  if(busy || !snapshot) return;
  const requestBody=body as Record<string,unknown>;
  if(requestBody.mode==='NATURAL_LANGUAGE' && typeof requestBody.input==='string') messages=[...messages,{role:'player',text:requestBody.input}];
  busy=true; error='';
  try{
   const out=await api('/api/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
   if(out.snapshot){ snapshot=out.snapshot; await cacheSnapshot(snapshot!); }
   if(out.narration) { narration=out.narration; messages=[...messages,{role:'narrator',text:out.narration}]; }
   else if(out.result?.narration_hints) { narration=out.result.narration_hints.join(' '); messages=[...messages,{role:'narrator',text:narration}]; }
   if(out.result?.status==='REJECTED') error=out.result.error_message??'Hành động bị từ chối';
  } catch(e){ error=String(e); }
  finally{ busy=false; }
 }
 async function quick(action_type:ActionType,parameters:Record<string,unknown>={},target_id?:string){
  if(!snapshot) return;
  const labels:Partial<Record<ActionType,string>>={OBSERVE:'Quan sát',MOVE:'Di chuyển',ATTACK:'Tấn công',DEFEND:'Phòng thủ',DODGE:'Né',COUNTER:'Phản công',FLEE:'Bỏ chạy',SURRENDER:'Đầu hàng',TALK:'Nói chuyện',USE_SKILL:'Dùng chiêu',USE_ITEM:'Dùng vật phẩm',FEINT:'Hư chiêu',FEINT_ATTACK:'Giả công'};
  messages=[...messages,{role:'player',text:labels[action_type]??action_type}];
  await action({schema_version:'1.0',action_id:crypto.randomUUID(),actor_id:snapshot.player.id,action_type,parameters,target_id,source:'QUICK_ACTION'});
 }
 async function submit(){ const text=input.trim(); if(!text||busy) return; input=''; await action({mode:'NATURAL_LANGUAGE',input:text}); }
 async function createChar(){
  if(!charName.trim()||busy) return; busy=true; error='';
  try { const out=await api('/api/character',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:charName,archetype})}); snapshot=out.snapshot; await cacheSnapshot(snapshot!); narration='Danh tính của ngươi đã được ghi vào giang hồ.'; }
  catch(e){ error=String(e); }
  finally{ busy=false; }
 }
 async function save(){ try{ await api('/api/save',{method:'POST'}); narration='Đã lưu trạng thái.'; }catch(e){ error=String(e); } }
 async function loadSaved(){ try{ snapshot=await api('/api/save'); await cacheSnapshot(snapshot!); narration='Đã tải trạng thái lưu.'; }catch(e){ error=String(e); } }
 function knownRealm(npc:NpcState){ return (npc as NpcState & {visible_realm?:string}).visible_realm ?? '???'; }
 function relationFor(npcId:string){ return snapshot?.world.relationships[`rel_${snapshot.player.id}_${npcId}`]; }
 function priceFor(itemId:string){
  if(!snapshot) return 0;
  return Math.max(1,Math.floor((snapshot.world.market_state.base_price[itemId]??50)*(1+(snapshot.world.market_state.demand[itemId]??0)*.01)));
 }

 onMount(()=>{
  load();
  isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
  const handler = (event: Event) => { event.preventDefault(); installPrompt = event; };
  window.addEventListener('beforeinstallprompt', handler as EventListener);
  return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
 });
 async function installApp(){
  if(!installPrompt) return;
  await installPrompt.prompt();
  installPrompt = null;
 }
 $: player=snapshot?.player;
 $: world=snapshot?.world;
 $: location=player&&world?world.locations[player.location_id]:undefined;
 $: nearby=world&&player?Object.values(world.npcs).filter(n=>n.alive&&n.location_id===player.location_id):[];
 $: routes=location?location.connections.map(id=>world?.locations[id]).filter(Boolean):[];
 $: visibleAvailable=world?Object.values(world.quests).filter(q=>q.state==='AVAILABLE'):[];
 $: activeQuestObjects=world&&player?player.active_quests.map(id=>world.quests[id]).filter(Boolean):[];
 $: trader=nearby.find(n=>n.faction_id==='f_trade');
 $: shopItems=trader&&world?Object.values(world.items).filter(i=>i.owner_id!=='player_001'&&!i.unique).slice(0,10):[];
 $: inventory=player&&world?player.inventory_ids.map(id=>world.items[id]).filter(Boolean):[];
 $: techniques=player&&world?player.martial_art_ids.flatMap(id=>world.martial_arts[id]?.technique_ids??[]).map(id=>world.techniques[id]).filter(Boolean):[];
 $: currentCombat=player?.status.find(s=>s.startsWith('COMBAT:'))?.split(':')[1];
 $: foe=currentCombat&&world?world.npcs[currentCombat]:undefined;
 $: nearbyFactionIds=[...new Set(nearby.map(n=>n.faction_id).filter(Boolean))] as string[];
</script>

<svelte:head><title>Giang Hồ Vô Định</title></svelte:head>

{#if !snapshot}
 <main class="boot"><div class="seal">江湖</div><h1>GIANG HỒ VÔ ĐỊNH</h1><p>Đang khởi động giang hồ…</p>{#if error}<pre>{error}</pre>{/if}</main>
{:else if !world.global_flags.character_created}
 <main class="boot"><div class="seal">江湖</div><h1>GIANG HỒ VÔ ĐỊNH</h1><p>Trước khi bước vào giang hồ, hãy lập danh tính.</p>
  <div class="creator card">
   <input bind:value={charName} maxlength="32" placeholder="Tên nhân vật" />
   <div class="archetypes">
    {#each [['du_hiep','Du Hiệp','Thân pháp + Cảm giác'],['kiem_khach','Kiếm Khách','Lực lượng + Ngộ tính'],['noi_gia','Nội Gia','Nội lực + Tâm cảnh'],['ho_the','Hộ Thể','Thể chất + Căn cơ']] as [id,label,desc]}
     <button class:chosen={archetype===id} onclick={()=>archetype=id as typeof archetype}><strong>{label}</strong><small>{desc}</small></button>
    {/each}
   </div>
   <button class="create-btn" onclick={createChar} disabled={!charName.trim()||busy}>Bước vào giang hồ</button>
   {#if error}<div class="error">{error}</div>{/if}
  </div>
 </main>
{:else}
 <main class="app-shell">
  <header class="topbar">
   <div><strong>GIANG HỒ VÔ ĐỊNH</strong><span class="muted">{player.name} · Năm {world.calendar.year} · Tháng {world.calendar.month} · Ngày {world.calendar.day}</span></div>
   <div class="top-actions">{#if installPrompt && !isStandalone}<button onclick={installApp}>Cài app</button>{/if}<button onclick={save} disabled={busy}>Lưu</button><button onclick={loadSaved} disabled={busy}>Tải</button></div>
  </header>

  <section class="scene-card">
   <div class="scene-head"><div><div class="eyebrow">{world.weather_state}</div><h2>{location?.name}</h2><p>{location?.tags.join(' · ')}</p></div><div class="danger">Nguy hiểm {location?.danger_level}/10</div></div>
   <div class="chat-feed">
    {#if !messages.length}<div class="narration">Mây thấp phủ ngang phố trấn. Không khí bình lặng, nhưng giang hồ chưa bao giờ thật sự yên.</div>{/if}
    {#each messages as msg}<div class:player-bubble={msg.role==='player'} class="bubble"><span>{msg.role==='player'?'NGƯƠI':'GIANG HỒ'}</span><p>{msg.text}</p></div>{/each}
   </div>
  </section>

  <section class="stat-grid">
   <div class="stat"><span>HP</span><b>{player.hp}/{player.max_hp}</b><i style={`--pct:${player.hp/player.max_hp*100}%`}></i></div>
   <div class="stat"><span>Nội lực</span><b>{player.qi.current}/{player.qi.capacity}</b><i style={`--pct:${player.qi.current/player.qi.capacity*100}%`}></i></div>
   <div class="stat"><span>Thể lực</span><b>{player.stamina}/{player.max_stamina}</b><i style={`--pct:${player.stamina/player.max_stamina*100}%`}></i></div>
   <div class="stat"><span>Cảnh giới</span><b>{player.realm}</b></div>
  </section>

  {#if foe}
   <section class="combat-card">
    <div class="combat-title"><span>ĐỐI ĐẦU</span><strong>{foe.name}</strong><small>{knownRealm(foe)} · HP {foe.health}/{foe.max_health}</small></div>
    <div class="actions-row"><button class="danger-btn" onclick={()=>quick('ATTACK',{technique_id:techniques[0]?.id},foe.id)}>Đánh</button><button onclick={()=>quick('DEFEND',{},foe.id)}>Thủ</button><button onclick={()=>quick('COUNTER',{},foe.id)}>Phản</button><button onclick={()=>quick('DODGE',{},foe.id)}>Né</button><button onclick={()=>quick('FLEE',{},foe.id)}>Chạy</button><button onclick={()=>quick('SURRENDER',{},foe.id)}>Đầu hàng</button></div>
    <div class="tech-scroll">{#each techniques as t}<button class="skill-btn" onclick={()=>quick('USE_SKILL',{technique_id:t.id,martial_art_id:t.martial_art_id},foe.id)}>{t.name}<small>NL {t.qi_cost} · TL {t.stamina_cost} · CD {t.cooldown}p</small></button>{/each}</div>
   </section>
  {:else}
   <section class="panel-grid">
    <div class="card"><div class="card-title">Người gần đây</div>
     {#if nearby.length}{#each nearby as npc}<div class="row"><div><strong>{npc.name}</strong><small>{npc.title} · Cảnh giới: {knownRealm(npc)}</small></div><div class="row-actions"><button onclick={()=>quick('TALK',{},npc.id)}>Nói</button><button onclick={()=>quick('OBSERVE',{},npc.id)}>Nhìn</button><button class="attack-link" onclick={()=>quick('ATTACK',{technique_id:techniques[0]?.id},npc.id)}>Đánh</button></div></div>{/each}{:else}<p class="muted">Không có ai đáng chú ý.</p>{/if}
    </div>
    <div class="card"><div class="card-title">Đường đi</div>{#each routes as dest}<div class="row"><div><strong>{dest?.name}</strong><small>nguy hiểm {dest?.danger_level}/10</small></div><button onclick={()=>dest&&quick('MOVE',{location_id:dest.id})}>Đi</button></div>{/each}</div>
   </section>
  {/if}

  <section class="command-card">
   <div class="quickbar">
    <button onclick={()=>quick('OBSERVE')}>Quan sát</button>
    <button onclick={()=>quick('OBSERVE',{mode:'REST',hours:8})}>Nghỉ 8h</button>
    <button onclick={()=>quick('OBSERVE',{mode:'TRAIN',hours:2,martial_art_id:player.martial_art_ids[0]})}>Luyện 2h</button>
    <button onclick={()=>quick('OBSERVE',{mode:'BREAKTHROUGH'})}>Đột phá</button>
    {#each inventory.filter(i=>i.category==='MEDICINE').slice(0,3) as item}<button onclick={()=>quick('USE_ITEM',{item_id:item.id},item.id)}>Dùng {item.name}</button>{/each}
   </div>
   <div class="input-row"><input bind:value={input} onkeydown={(e)=>e.key==='Enter'&&submit()} placeholder="Ví dụ: 'Ta bước vào Hàn Vụ Cốc và quan sát xung quanh…'" /><button onclick={submit} disabled={busy}>Ra lệnh</button></div>
   {#if busy}<small class="muted">Engine đang xử lý…</small>{/if}
   {#if error}<div class="error">{error}</div>{/if}
  </section>

  <nav class="bottom-nav">{#each [['status','Tổng quan'],['inventory','Túi đồ'],['skills','Võ học'],['quests','Nhiệm vụ'],['people','Quan hệ'],['market','Chợ']] as [key,label]}<button class:active={panel===key} onclick={()=>panel=key as typeof panel}>{label}</button>{/each}</nav>

  {#if panel==='status'}
   <section class="detail card"><h3>Thân thể & nền tảng</h3><div class="attrs">{#each Object.entries(player.attributes) as [key,val]}<div><span>{({the_chat:'Thể chất',luc_luong:'Lực lượng',than_phap:'Thân pháp',noi_luc:'Nội lực',can_co:'Căn cơ',ngo_tinh:'Ngộ tính',tam_canh:'Tâm cảnh',cam_giac:'Cảm giác'} as Record<string,string>)[key]}</span><b>{val}</b></div>{/each}</div><p>Thương tích: {player.injuries.length?player.injuries.map(i=>`${i.body_part} ${i.severity}`).join(', '):'Không có'}</p><p>Kinh mạch: {player.meridian.health}/100 · tổn thương {player.meridian.damage.toFixed(0)} · dòng khí {player.meridian.flow_modifier.toFixed(2)}</p><p>Danh vọng: {player.reputation} · Bạc: {player.money}</p></section>
  {/if}
  {#if panel==='inventory'}
   <section class="detail card"><h3>Túi đồ</h3>{#each inventory as item}<div class="row"><div><strong>{item.name}</strong><small>{item.category} · Q{item.quality} · {item.rarity}</small></div><div class="row-actions"><span>x{item.quantity}</span>{#if item.category==='WEAPON'||item.category==='ARMOR'}<button onclick={()=>quick('USE_ITEM',{item_id:item.id,mode:'EQUIP'},item.id)}>{player.equipment_ids.includes(item.id)?'Đang dùng':'Trang bị'}</button>{/if}{#if item.category!=='MEDICINE'&&item.category!=='WEAPON'&&item.category!=='ARMOR'&&trader}<button onclick={()=>quick('TALK',{trade:'SELL',item_id:item.id},trader.id)}>Bán</button>{/if}</div></div>{/each}</section>
  {/if}
  {#if panel==='skills'}
   <section class="detail card"><h3>Võ học đã biết</h3>{#each player.martial_art_ids as id}<div class="skill-block"><div class="skill-line"><strong>{world.martial_arts[id]?.name}</strong><span>Mastery {player.mastery[id]??world.martial_arts[id]?.mastery??0}</span></div>{#each world.martial_arts[id]?.technique_ids??[] as tid}{#if world.techniques[tid]}<div class="tech-line"><span>{world.techniques[tid].name}</span><small>NL {world.techniques[tid].qi_cost} · TL {world.techniques[tid].stamina_cost} · CD {world.techniques[tid].cooldown}p</small></div>{/if}{/each}<button onclick={()=>quick('OBSERVE',{mode:'TRAIN',hours:2,martial_art_id:id})}>Luyện 2h</button></div>{/each}</section>
  {/if}
  {#if panel==='quests'}
   <section class="detail card"><h3>Nhiệm vụ</h3>{#each activeQuestObjects as q}<div class="row"><div><strong>{q.name}</strong><small>{q.state} · {q.objectives[0]?.progress}/{q.objectives[0]?.target} · hạn {q.deadline?`${Math.max(0,Math.ceil((q.deadline-world.world_time)/86400))} ngày`:'—'}</small></div>{#if q.participants[0]&&world.npcs[q.participants[0]]}<button onclick={()=>quick('TALK',{quest_id:q.id,quest_action:'ABANDON'},q.participants[0])}>Bỏ</button>{/if}</div>{/each}{#each visibleAvailable as q}<div class="row"><div><strong>{q.name}</strong><small>{q.description}</small></div>{#if q.participants[0]&&world.npcs[q.participants[0]]&&world.npcs[q.participants[0]].location_id===player.location_id}<button onclick={()=>quick('TALK',{quest_id:q.id,quest_action:'ACCEPT'},q.participants[0])}>Nhận</button>{:else}<span class="muted">Chưa gặp người giao</span>{/if}</div>{/each}</section>
  {/if}
  {#if panel==='people'}
   <section class="detail card"><h3>Quan hệ & tổ chức</h3>{#each Object.values(world.relationships).filter(r=>r.actor_id===player.id) as rel}{#if world.npcs[rel.target_id]}<div class="row"><div><strong>{world.npcs[rel.target_id].name}</strong><small>Tin {rel.trust} · Kính {rel.respect} · Nghi {rel.suspicion}</small></div><span>{world.npcs[rel.target_id].alive?'Còn sống':'Đã chết'}</span></div>{/if}{/each}
    {#each nearbyFactionIds as factionId}{#if world.factions[factionId]}<div class="row faction"><div><strong>{world.factions[factionId].name}</strong><small>{world.factions[factionId].type}</small></div>{#if player.faction_ids.includes(factionId)}<button onclick={()=>quick('TALK',{faction_id:factionId,faction_action:'LEAVE'},nearby.find(n=>n.faction_id===factionId)?.id)}>Rời</button>{:else}<button onclick={()=>quick('TALK',{faction_id:factionId,faction_action:'JOIN'},nearby.find(n=>n.faction_id===factionId)?.id)}>Gia nhập</button>{/if}</div>{/if}{/each}
   </section>
  {/if}
  {#if panel==='market'}
   <section class="detail card"><h3>Vạn Lộ Thương Hội</h3>{#if trader}<p class="muted">{trader.name} đang có mặt · Bạc: {player.money}</p>{#each shopItems as item}<div class="row"><div><strong>{item.name}</strong><small>{item.category} · Q{item.quality}</small></div><button onclick={()=>quick('TALK',{trade:'BUY',item_id:item.id},trader.id)}>Mua {priceFor(item.id)} bạc</button></div>{/each}{:else}<p class="muted">Hãy gặp Yến Tử Yên hoặc thương nhân thuộc Vạn Lộ Thương Hội.</p>{/if}</section>
  {/if}

  <footer class="footer">Fast Path luôn khả dụng · AI chỉ kể lại state Engine đã xác nhận · Sự kiện: {world.event_log.length}</footer>
 </main>
{/if}

<style>
 :global(*){box-sizing:border-box} :global(body){margin:0;background:#0a0e14;color:#e8e0ce;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}button,input{font:inherit}
 .app-shell{max-width:1100px;margin:0 auto;padding:12px 12px 86px}.topbar{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 0 14px;position:sticky;top:0;background:#0a0e14ee;backdrop-filter:blur(10px);z-index:5}.topbar strong{display:block;letter-spacing:.08em}.muted{color:#8c95a4;font-size:.84rem}.top-actions{display:flex;gap:6px}.top-actions button,.row button,.quickbar button,.actions-row button,.bottom-nav button,.skill-block>button{border:1px solid #293241;background:#121925;color:#dce6f5;border-radius:10px;padding:8px 10px;cursor:pointer}.top-actions button:hover,.row button:hover,.quickbar button:hover,.actions-row button:hover,.skill-block>button:hover{background:#182230}
 .scene-card,.combat-card,.card,.command-card{background:#0f151f;border:1px solid #222c39;border-radius:16px;box-shadow:0 10px 30px #0003}.scene-card{padding:16px}.scene-head{display:flex;justify-content:space-between;gap:12px}.eyebrow{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:#8c95a4}.scene-card h2{margin:4px 0}.scene-card p{margin:4px 0;color:#9aa4b2}.danger{font-size:.75rem;color:#ffb4a6}.narration{margin-top:14px;line-height:1.65;color:#ddd5c3;min-height:52px}
 .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}.stat{background:#0f151f;border:1px solid #222c39;padding:10px;border-radius:12px}.stat span,.stat b{display:block}.stat span{font-size:.72rem;color:#8c95a4}.stat b{margin-top:4px}.stat i{display:block;height:4px;background:#28313f;margin-top:7px;border-radius:4px;overflow:hidden;position:relative}.stat i:after{content:"";display:block;height:100%;width:var(--pct);background:#91a6c3}
 .panel-grid{display:grid;grid-template-columns:1.25fr .85fr;gap:10px;margin:10px 0}.card{padding:14px}.card-title,h3{margin:0 0 10px}.row{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 0;border-top:1px solid #1d2631}.row:first-of-type{border-top:0}.row strong{display:block}.row small{display:block;color:#8c95a4;margin-top:2px}.row-actions{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;align-items:center}.attack-link{color:#ffb4a6!important}.command-card{padding:10px;margin:10px 0}.quickbar{display:flex;gap:6px;overflow:auto;padding-bottom:8px}.input-row{display:flex;gap:8px}.input-row input{flex:1;min-width:0;background:#0a0e14;border:1px solid #2a3542;border-radius:12px;padding:11px 12px;color:#f2f5f7}.input-row button{background:#d6b26e;color:#18130d;border:0;border-radius:12px;padding:0 16px;font-weight:700}.error{margin-top:8px;color:#ff9b8b;background:#2a1718;padding:8px;border-radius:10px}
 .combat-card{padding:14px;border-color:#533236}.combat-title span,.combat-title small{display:block;color:#9aa4b2}.combat-title strong{display:block;font-size:1.2rem;margin:4px 0}.actions-row{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}.actions-row .danger-btn{background:#4a2022;border-color:#714044}.tech-scroll{display:flex;gap:6px;overflow:auto}.skill-btn{min-width:210px;text-align:left}.skill-btn small{display:block;color:#8c95a4;margin-top:4px}.bottom-nav{position:fixed;left:0;right:0;bottom:0;background:#0a0e14ee;border-top:1px solid #202b38;display:flex;justify-content:center;gap:4px;padding:8px env(safe-area-inset-right) calc(8px + env(safe-area-inset-bottom)) env(safe-area-inset-left);backdrop-filter:blur(12px);z-index:6}.bottom-nav button{flex:1;max-width:180px;background:transparent}.bottom-nav button.active{background:#171f2b;border-color:#394657}.detail{margin-top:10px}.attrs{display:grid;grid-template-columns:1fr 1fr;gap:8px}.attrs div{display:flex;justify-content:space-between;padding:8px;background:#0a0e14;border-radius:10px}.skill-line{display:flex;justify-content:space-between;padding:10px 0}.skill-block{border-top:1px solid #1d2631;padding:6px 0 10px}.tech-line{display:flex;justify-content:space-between;gap:8px;padding:7px 0;background:#0a0e14;border-radius:8px;margin:3px 0;padding-left:8px;padding-right:8px}.tech-line small{color:#8c95a4}.boot{min-height:100vh;display:grid;place-content:center;text-align:center;padding:20px}.seal{font-size:64px;opacity:.8}.creator{width:min(620px,100%);text-align:left}.creator input{width:100%;background:#0a0e14;border:1px solid #2a3542;border-radius:12px;padding:12px;color:#f2f5f7}.archetypes{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}.archetypes button{text-align:left;padding:12px;background:#121925;border:1px solid #293241;border-radius:12px;color:#dce6f5}.archetypes button.chosen{border-color:#d6b26e}.archetypes strong,.archetypes small{display:block}.archetypes small{color:#8c95a4;margin-top:4px}.create-btn{width:100%;padding:12px;background:#d6b26e;border:0;border-radius:12px;font-weight:800}.footer{text-align:center;color:#687383;font-size:.75rem;margin-top:20px}
 @media(max-width:700px){.app-shell{padding:8px 8px 90px}.topbar strong{font-size:.9rem}.stat-grid{grid-template-columns:1fr 1fr}.panel-grid{grid-template-columns:1fr}.scene-head{align-items:flex-start}.input-row{flex-direction:column}.input-row button{padding:11px}.row-actions{width:100%}.bottom-nav button{font-size:.72rem;padding:9px 4px}.archetypes{grid-template-columns:1fr}}
</style>
