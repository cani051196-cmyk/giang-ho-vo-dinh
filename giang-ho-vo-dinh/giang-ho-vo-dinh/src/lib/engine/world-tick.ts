import type { GameSnapshot, Quest } from '../core/types';
import { clamp } from '../core/utils';

const DAY=86400;
export function resolveWorldConsequences(snapshot:GameSnapshot,oldTime:number,newTime:number){
 const crossedDay=Math.floor(oldTime/DAY)!==Math.floor(newTime/DAY);
 if(crossedDay){
  snapshot.world.global_flags.day_changed=true;
  for(const faction of Object.values(snapshot.world.factions)) faction.treasury=Math.max(0,faction.treasury+Math.floor(faction.treasury*0.005));
  for(const itemId of Object.keys(snapshot.world.items)){
   const supply=snapshot.world.market_state.supply[itemId]??20;
   const demand=snapshot.world.market_state.demand[itemId]??0;
   snapshot.world.market_state.supply[itemId]=clamp(supply+(demand>40?-2:1),0,10000);
   snapshot.world.market_state.demand[itemId]=clamp(demand+(supply<10?5:-1),0,1000);
  }
 }
 const eveningOld=oldTime%(DAY)>=18*3600, eveningNew=newTime%(DAY)>=18*3600;
 if(!eveningOld&&eveningNew&&snapshot.world.weather_state==='RAIN'){
  snapshot.world.rumors.rain_rumor={id:'rain_rumor',content_claim:'Mưa xuống, đường núi Hàn Vụ Cốc trở nên nguy hiểm.',truth_source:'weather',distortion_level:.1,confidence:.95,origin_location:snapshot.player.location_id,origin_actor:snapshot.player.id,spread_rate:.7};
  snapshot.world.market_state.demand['item_28']=clamp((snapshot.world.market_state.demand['item_28']??0)+12,0,1000);
 }
 for(const q of Object.values(snapshot.world.quests) as Quest[]){
  if(q.deadline && q.state!=='COMPLETED' && q.state!=='FAILED' && newTime>q.deadline){ q.state='EXPIRED'; snapshot.player.active_quests=snapshot.player.active_quests.filter(id=>id!==q.id); }
 }
 for(const scheduled of snapshot.world.scheduled_events.filter(e=>e.at>oldTime&&e.at<=newTime)) snapshot.world.global_flags[`event:${scheduled.id}`]=true;
}
