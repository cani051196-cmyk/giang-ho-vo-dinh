<script lang="ts">
 import { onMount } from 'svelte';

 type EntityType = 'npcs'|'factions'|'locations'|'martial_arts'|'techniques'|'items'|'quests'|'events';
 type Field = [key: string, label: string, type?: 'number'|'json'|'checkbox'|'text'];

 const tabs:[EntityType,string][] = [
  ['npcs','NPC'],['martial_arts','Võ công'],['techniques','Chiêu thức'],['items','Vật phẩm'],['quests','Nhiệm vụ'],['locations','Địa điểm'],['factions','Phe phái'],['events','Sự kiện']
 ];
 const fieldConfig:Record<EntityType,Field[]>={
  npcs:[['name','Tên'],['title','Danh xưng'],['personality','Tính cách · cách nhau bằng dấu phẩy'],['goals','Mục tiêu · CSV'],['fears','Điểm sợ · CSV'],['secrets','Bí mật · CSV'],['location_id','Địa điểm'],['faction_id','Phe phái'],['realm','Cảnh giới'],['health','HP','number'],['max_health','Max HP','number'],['money','Bạc','number']],
  martial_arts:[['name','Tên'],['type','Loại'],['style','Phong cách'],['quality','Chất lượng','number'],['origin','Nguồn gốc'],['realm_requirement','Cảnh giới yêu cầu'],['attribute_scaling','Scaling JSON','json'],['qi_requirements','Yêu cầu Qi JSON','json'],['passives','Nội tại · CSV'],['technique_ids','Chiêu thức ID · CSV'],['synergy_tags','Synergy · CSV'],['conflict_tags','Xung đột · CSV'],['counter_profile','Counter profile · CSV'],['requirements','Điều kiện · CSV']],
  techniques:[['martial_art_id','Võ công cha'],['name','Tên'],['order','Thứ tự','number'],['base_power','Base Power','number'],['scaling','Scaling JSON','json'],['qi_cost','Chi phí nội lực','number'],['stamina_cost','Chi phí thể lực','number'],['cooldown','Cooldown phút','number'],['accuracy','Độ chính xác','number'],['speed','Tốc độ','number'],['range','Tầm đánh','number'],['targeting','Mục tiêu'],['effects','Hiệu ứng · CSV'],['counter_profile','Counter · CSV'],['risk','Rủi ro','number'],['requirements','Điều kiện · CSV']],
  items:[['name','Tên'],['category','Loại'],['quality','Chất lượng','number'],['rarity','Độ hiếm'],['region_id','Khu vực'],['faction_id','Phe phái'],['modifiers','Modifier JSON','json'],['quantity','Số lượng','number'],['unique','Unique','checkbox'],['owner_id','Chủ sở hữu']],
  quests:[['name','Tên'],['description','Mô tả'],['state','Trạng thái'],['objective_description','Mục tiêu'],['objective_target','Số mục tiêu','number'],['conditions','Điều kiện · CSV'],['participants','NPC tham gia · CSV'],['rewards','Phần thưởng · CSV'],['fail_conditions','Fail condition · CSV'],['deadline','Hạn tuyệt đối (world time)','number'],['consequences','Hậu quả · CSV'],['branches','Nhánh · CSV']],
  locations:[['name','Tên'],['region_id','Khu vực'],['tags','Tags · CSV'],['connections','Kết nối · CSV'],['base_travel_time','Thời gian đi cơ sở (s)','number'],['danger_level','Nguy hiểm 1–10','number'],['factions','Phe phái · CSV'],['resources','Tài nguyên · CSV'],['services','Dịch vụ · CSV'],['population','Dân số','number']],
  factions:[['name','Tên'],['type','Loại'],['reputation','Danh vọng cơ sở','number'],['treasury','Ngân khố','number'],['resources','Tài nguyên JSON','json']],
  events:[['trigger','Trigger'],['conditions','Điều kiện · CSV'],['participants','Người tham gia · CSV'],['priority','Ưu tiên','number'],['cooldown','Cooldown (s)','number'],['outcomes','Kết quả · CSV'],['consequences','Hậu quả · CSV'],['visibility','Visibility']]
 };

 let authenticated=false; let configured=false; let password=''; let data:any=null; let selected:EntityType='npcs';
 let query=''; let selectedId=''; let form:Record<string,any>={}; let busy=false; let message=''; let error='';
 let showRaw=false;

 async function api(url:string, options?:RequestInit){ const r=await fetch(url,options); const body=await r.json().catch(()=>({})); if(!r.ok) throw new Error(body.message||body.error||`HTTP ${r.status}`); return body; }
 async function status(){ try{ const s=await api('/api/admin/login'); authenticated=s.authenticated; configured=s.configured; if(authenticated) await loadData(); }catch(e){ error=String(e);} }
 async function login(){ busy=true; error=''; try{ await api('/api/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password})}); authenticated=true; password=''; await loadData(); }catch(e){ error=String(e);}finally{busy=false;} }
 async function logout(){ await api('/api/admin/logout',{method:'POST'}); authenticated=false; data=null; }
 async function loadData(){ busy=true; try{ data=await api('/api/admin/content'); if(!selectedId) newEntity(); }catch(e){ error=String(e);}finally{busy=false;} }
 function list(type:EntityType){ const source=data?.world?.[type]; return Array.isArray(source)?source:source?Object.values(source):[]; }
 $: records=list(selected).filter((item:any)=>!query.trim() || String(item.name||item.id||'').toLowerCase().includes(query.toLowerCase()));
 $: selectedRecord=list(selected).find((item:any)=>item.id===selectedId);
 function serializeValue(key:string,value:any,type?:string){ if(type==='checkbox') return Boolean(value); if(type==='json') return JSON.stringify(value??{},null,2); if(Array.isArray(value)) return value.join(', '); return value ?? ''; }
 function newEntity(){ selectedId=''; const defaults:Record<string,any>={}; for(const f of fieldConfig[selected]) defaults[f[0]]=f[0]==='state'?'AVAILABLE':f[0]==='visibility'?'PUBLIC':f[0]==='quality'?50:f[2]==='number'?0:f[2]==='checkbox'?false:''; form=defaults; message=''; }
 function edit(item:any){ selectedId=item.id; const next:Record<string,any>={}; for(const f of fieldConfig[selected]) next[f[0]]=serializeValue(f[0],item[f[0]],f[2]); if(selected==='npcs' && item.resources?.money!=null) next.money=item.resources.money; form=next; message=''; }
 function cleanForm(){ const out:any={}; for(const f of fieldConfig[selected]){ let value=form[f[0]]; if(f[2]==='number') out[f[0]]=value===''?0:Number(value); else if(f[2]==='checkbox') out[f[0]]=Boolean(value); else if(f[2]==='json'){ try{ out[f[0]]=value?JSON.parse(value):{}; }catch{ throw new Error(`${f[1]} không phải JSON hợp lệ.`); } } else out[f[0]]=value; }
  if(selected==='npcs') out.money=Number(form.money||0); return out; }
 async function save(){ busy=true; error=''; message=''; try{ const payload={type:selected,id:selectedId||`${selected.slice(0,-1)}_${Date.now()}`,op:'upsert',data:cleanForm()}; await api('/api/admin/content',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}); await loadData(); edit(list(selected).find((x:any)=>x.id===payload.id)||{id:payload.id,...payload.data}); message='Đã lưu và áp dụng ngay vào world state.'; }catch(e){error=String(e);}finally{busy=false;} }
 async function remove(){ if(!selectedId) return; if(!confirm(`Xóa ${selectedId}? Chỉ xóa được record không còn dependency.`)) return; busy=true; error=''; try{ await api('/api/admin/content',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:selected,id:selectedId,op:'delete'})}); await loadData(); newEntity(); message='Đã xóa.'; }catch(e){error=String(e);}finally{busy=false;} }
 function display(value:any){ if(value===undefined) return '—'; if(typeof value==='object') return JSON.stringify(value); return String(value); }
 $: counts=data?.counts??{};
 onMount(status);
</script>

<svelte:head><title>Admin · Giang Hồ Vô Định</title><meta name="robots" content="noindex,nofollow" /></svelte:head>

{#if !authenticated}
 <main class="auth-page">
  <div class="auth-card">
   <div class="seal">江湖</div>
   <div class="eyebrow">DEVELOPER CONSOLE</div>
   <h1>Giang Hồ Vô Định</h1>
   <p>Đăng nhập Admin để sửa NPC, võ công, chiêu thức, item, quest và world content.</p>
   {#if !configured}<div class="warning">Chưa cấu hình <code>ADMIN_PASSWORD</code>. Hãy đặt biến môi trường trước khi mở Admin.</div>{/if}
   <input type="password" bind:value={password} placeholder="Mật khẩu Admin" onkeydown={(e)=>e.key==='Enter'&&login()} />
   <button class="primary wide" onclick={login} disabled={!configured||busy}>Đăng nhập</button>
   {#if error}<div class="error">{error}</div>{/if}
   <a href="/">← Quay lại game</a>
  </div>
 </main>
{:else}
 <main class="admin-shell">
  <header class="admin-top">
   <div><div class="eyebrow">DEVELOPER CONSOLE</div><h1>GIANG HỒ VÔ ĐỊNH</h1><span>Chỉnh data → lưu → Engine dùng ngay.</span></div>
   <div class="top-actions"><a href="/">Chơi game</a><button onclick={logout}>Đăng xuất</button></div>
  </header>

  <section class="overview">
   <div class="hero"><div class="seal small">⚔</div><div><strong>World: {data?.world?.id}</strong><p>{data?.world?.calendar?.day}/{data?.world?.calendar?.month}/{data?.world?.calendar?.year} · {data?.world?.weather}</p></div></div>
   <div class="stats">{#each Object.entries(counts) as [k,v]}<div><span>{k}</span><b>{v}</b></div>{/each}</div>
  </section>

  <div class="tabs">{#each tabs as [key,label]}<button class:active={selected===key} onclick={()=>{selected=key;query='';newEntity();}}>{label}<small>{counts[key]??0}</small></button>{/each}</div>

  <section class="workspace">
   <aside class="list-card">
    <div class="list-head"><input bind:value={query} placeholder="Tìm..." /><button class="primary" onclick={newEntity}>＋ Thêm</button></div>
    <div class="records">{#each records as item}<button class:chosen={item.id===selectedId} class="record" onclick={()=>edit(item)}><strong>{item.name||item.id}</strong><small>{item.id} · {display(item.type||item.state||item.category||item.trigger)}</small></button>{:else}<p class="empty">Không có record.</p>{/each}</div>
   </aside>

   <section class="editor-card">
    <div class="editor-head"><div><div class="eyebrow">{selectedId?'EDIT':'NEW'} · {selected.toUpperCase()}</div><h2>{form.name || form.trigger || selectedId || 'Record mới'}</h2></div><div class="editor-actions"><button class="primary" onclick={save} disabled={busy}>Lưu & áp dụng</button>{#if selectedId}<button class="danger" onclick={remove} disabled={busy}>Xóa</button>{/if}</div></div>
    <div class="form-grid">
     {#each fieldConfig[selected] as field}
      <label class:full={field[2]==='json' || field[0]==='description' || field[0]==='secrets'}>
       <span>{field[1]}</span>
       {#if field[2]==='checkbox'}<input type="checkbox" bind:checked={form[field[0]]} />
       {:else if field[2]==='json'}<textarea rows="7" bind:value={form[field[0]]}></textarea>
       {:else if field[0]==='description'}<textarea rows="5" bind:value={form[field[0]]}></textarea>
       {:else}<input type={field[2]||'text'} bind:value={form[field[0]]} />{/if}
      </label>
     {/each}
    </div>
    {#if message}<div class="success">{message}</div>{/if}
    {#if error}<div class="error">{error}</div>{/if}

    <details class="raw"><summary>Raw JSON của record hiện tại</summary><pre>{showRaw ? JSON.stringify(selectedRecord ?? cleanForm(),null,2) : 'Mở mục này để xem.'}</pre><button onclick={()=>showRaw=!showRaw}>Hiện/ẩn</button></details>
   </section>
  </section>

  <footer>Admin chỉ sửa content/state qua API server. Player client không có quyền gọi các Admin API.</footer>
 </main>
{/if}

<style>
 :global(*){box-sizing:border-box}:global(body){margin:0;background:#080b10;color:#e9e1d0;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}:global(button),:global(input),:global(textarea){font:inherit}
 .auth-page{min-height:100vh;display:grid;place-items:center;padding:20px;background:radial-gradient(circle at top,#192231 0,#080b10 52%)}.auth-card{width:min(520px,100%);padding:28px;background:#101721;border:1px solid #263142;border-radius:24px;box-shadow:0 24px 80px #0008}.auth-card h1{margin:4px 0 8px}.auth-card p{color:#929cad;line-height:1.5}.auth-card input{width:100%;background:#090d13;border:1px solid #2a3544;color:#f4f6f8;padding:13px;border-radius:12px;margin:12px 0}.auth-card a{display:block;color:#aab8ca;margin-top:14px;text-decoration:none}.seal{font-size:56px}.seal.small{font-size:28px}.eyebrow{font-size:.7rem;letter-spacing:.13em;color:#8f9aaa;text-transform:uppercase}.warning,.error,.success{padding:11px 12px;border-radius:12px;margin-top:10px}.warning{background:#2b2415;color:#dfc37b}.error{background:#2c1719;color:#ffaaa0}.success{background:#13261d;color:#9fddb7}.wide{width:100%}
 .admin-shell{max-width:1400px;margin:0 auto;padding:16px 16px 80px}.admin-top{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;padding:8px 0 18px}.admin-top h1{margin:3px 0}.admin-top span{color:#7f8a9a}.top-actions{display:flex;gap:8px;align-items:center}.top-actions a,.top-actions button,.tabs button,.primary,.danger,.list-head button{border:1px solid #2b3747;border-radius:11px;padding:10px 12px;background:#121a25;color:#e0e7ef;text-decoration:none;cursor:pointer}.primary{background:#d4b06b;color:#17130c;border-color:#d4b06b;font-weight:800}.danger{background:#35191b;border-color:#643236;color:#ffb8ae}
 .overview{display:grid;grid-template-columns:minmax(240px,1fr) 2fr;gap:10px;margin-bottom:10px}.hero,.stats>div,.list-card,.editor-card{background:#101721;border:1px solid #222d3a;border-radius:16px}.hero{display:flex;align-items:center;gap:12px;padding:14px}.hero p{margin:4px 0 0;color:#8994a2}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.stats>div{padding:12px}.stats span{display:block;color:#808b9c;font-size:.75rem}.stats b{display:block;margin-top:4px;font-size:1.2rem}
 .tabs{display:flex;overflow:auto;gap:6px;padding:4px 0 10px}.tabs button{flex:0 0 auto;background:#0e141d}.tabs button.active{border-color:#d4b06b;background:#1a202a}.tabs small{margin-left:7px;color:#8994a2}
 .workspace{display:grid;grid-template-columns:330px 1fr;gap:10px}.list-card{padding:10px;min-height:560px}.list-head{display:flex;gap:6px;margin-bottom:10px}.list-head input{flex:1;min-width:0;background:#090d13;border:1px solid #2a3544;color:#eef2f5;padding:10px;border-radius:10px}.records{display:grid;gap:5px}.record{width:100%;text-align:left;padding:11px;border:1px solid transparent;border-radius:10px;background:transparent;color:#e0e6ec;cursor:pointer}.record:hover,.record.chosen{background:#171f2b;border-color:#2e3d50}.record strong,.record small{display:block}.record small{margin-top:3px;color:#7f8998}.empty{color:#727d8c;text-align:center;padding:30px 5px}
 .editor-card{padding:16px}.editor-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}.editor-head h2{margin:4px 0}.editor-actions{display:flex;gap:6px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.form-grid label{display:block}.form-grid label.full{grid-column:1/-1}.form-grid label>span{display:block;font-size:.78rem;color:#8e98a8;margin-bottom:5px}.form-grid input,.form-grid textarea{width:100%;background:#090d13;border:1px solid #293545;border-radius:10px;color:#eef2f4;padding:10px}.form-grid textarea{resize:vertical;min-height:84px}.form-grid input[type=checkbox]{width:auto}.raw{margin-top:16px;color:#9aa4b0}.raw pre{white-space:pre-wrap;word-break:break-word;background:#090d13;padding:12px;border-radius:10px;max-height:340px;overflow:auto}.raw button{padding:7px 9px;border-radius:9px;background:#151d27;color:#d8e0e8;border:1px solid #2b3948}
 footer{margin-top:20px;text-align:center;color:#657080;font-size:.76rem}
 @media(max-width:900px){.overview,.workspace{grid-template-columns:1fr}.list-card{min-height:0}.admin-top{flex-direction:column}.top-actions{width:100%}.top-actions>*{flex:1;text-align:center}.form-grid{grid-template-columns:1fr}}
 @media(max-width:560px){.admin-shell{padding:10px 8px 70px}.editor-head{flex-direction:column}.editor-actions{width:100%}.editor-actions>*{flex:1}.stats{grid-template-columns:1fr 1fr}.tabs{margin-inline:-4px;padding-inline:4px}.auth-card{padding:20px}}
</style>
