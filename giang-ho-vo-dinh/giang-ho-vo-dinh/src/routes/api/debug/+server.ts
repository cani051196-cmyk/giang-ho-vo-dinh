import { json } from '@sveltejs/kit';
import { getGameSnapshot } from '$lib/core/game-service';
import { getMetrics } from '$lib/observability/metrics';
export async function GET({url}){
 if(process.env.DEBUG_MODE!=='true' || url.searchParams.get('token')!==process.env.DEBUG_TOKEN) return json({error:'FORBIDDEN'},{status:403});
 return json({snapshot:await getGameSnapshot(),metrics:getMetrics()});
}
