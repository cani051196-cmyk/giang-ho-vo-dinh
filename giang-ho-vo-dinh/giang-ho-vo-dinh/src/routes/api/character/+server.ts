import { json } from '@sveltejs/kit';
import { createNewCharacter } from '$lib/core/game-service';
const valid=new Set(['du_hiep','kiem_khach','noi_gia','ho_the']);
export async function POST({request}){
 const body=await request.json(); const name=String(body.name??'').trim(); const archetype=String(body.archetype??'du_hiep');
 if(!name) return json({error:'NAME_REQUIRED'},{status:400}); if(!valid.has(archetype)) return json({error:'ARCHETYPE_INVALID'},{status:400});
 return json({snapshot:await createNewCharacter(name,archetype as any)});
}
