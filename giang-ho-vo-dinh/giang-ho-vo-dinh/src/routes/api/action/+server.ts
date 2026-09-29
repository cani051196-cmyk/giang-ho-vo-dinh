import { json } from '@sveltejs/kit';
import { handleNaturalLanguage, resolveAction } from '$lib/core/game-service';
import { actionRequestSchema } from '$lib/validation/contracts';
export async function POST({request}){
 const body=await request.json();
 if(body?.mode==='NATURAL_LANGUAGE') return json(await handleNaturalLanguage(String(body.input??'')));
 const parsed=actionRequestSchema.safeParse(body);
 if(!parsed.success) return json({error:'INVALID_ACTION_REQUEST',details:parsed.error.flatten()}, {status:400});
 return json(await resolveAction(parsed.data));
}
