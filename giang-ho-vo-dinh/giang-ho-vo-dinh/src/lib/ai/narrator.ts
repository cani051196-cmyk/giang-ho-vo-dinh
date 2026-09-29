import type { EngineResult, GameSnapshot } from '../core/types';
export function templateNarration(snapshot:GameSnapshot,result:EngineResult){
 if(result.status==='REJECTED') return `Engine từ chối hành động: ${result.error_message ?? 'không hợp lệ'}`;
 const hints=result.narration_hints.filter(Boolean);
 const place=snapshot.world.locations[snapshot.player.location_id]?.name ?? 'giang hồ';
 return `${hints.join(' ')}${hints.length?' ':''}[${place} — ${snapshot.world.weather_state}]`;
}
