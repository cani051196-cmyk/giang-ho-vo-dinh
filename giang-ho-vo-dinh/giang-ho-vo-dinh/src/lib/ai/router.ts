import { generateText } from 'ai';
import { templateNarration } from './narrator';
import { buildNarrationContext } from './narration-context';
import type { EngineResult, GameSnapshot, IntentParserOutput } from '../core/types';
import { parseIntent } from './parser';
import { intentParserOutputSchema } from '../validation/contracts';

export interface AiRouter {
  parse(input:string,snapshot:GameSnapshot):Promise<IntentParserOutput>;
  narrate(snapshot:GameSnapshot,result:EngineResult):Promise<string>;
}

function aiEnabled(){ return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.AI_API_KEY); }

export class FallbackAiRouter implements AiRouter{
 async parse(input:string,snapshot:GameSnapshot){
  const deterministic=parseIntent(input,snapshot);
  if(!process.env.AI_PARSER_ENABLED || process.env.AI_PARSER_ENABLED!=='true' || !aiEnabled()) return deterministic;
  try{
   const { text }=await generateText({
    model: process.env.AI_MODEL || 'openai/gpt-5.5',
    system: 'Bạn là Intent Parser của Giang Hồ Vô Định. Chỉ chuyển câu người chơi thành JSON theo schema. Không tính gameplay. Không tạo lore. Không thêm prose.',
    prompt: `Action types: ATTACK, DEFEND, DODGE, COUNTER, FEINT, FEINT_ATTACK, MOVE, USE_SKILL, USE_ITEM, FLEE, SURRENDER, TALK, OBSERVE.\n\nInput: ${input}\n\nChỉ JSON strict theo schema: ${JSON.stringify({schema_version:'1.0',intent_status:'EXACT',action_type:'OBSERVE',confidence:0.8})}`,
    temperature: 0
   });
   const parsed=JSON.parse(text);
   const checked=intentParserOutputSchema.safeParse(parsed);
   if(checked.success) return checked.data;
  }catch{ /* deterministic parser is the required fallback */ }
  return deterministic;
 }
 async narrate(snapshot:GameSnapshot,result:EngineResult){
  if(process.env.AI_NARRATION_ENABLED !== 'true' || !aiEnabled()) return templateNarration(snapshot,result);
  try{
   const context=buildNarrationContext(snapshot,result,'normal');
   const { text }=await generateText({
    model: process.env.AI_MODEL || 'openai/gpt-5.5',
    system: `Bạn là Narrator của GIANG HỒ VÔ ĐỊNH. Engine Result là sự thật tuyệt đối. Chỉ kể những gì context cho phép. Không tự thêm item, damage, NPC, quest result, realm change, death hay hidden information. Văn phong võ hiệp nguyên bản, giàu không khí nhưng ngắn gọn, tối ưu mobile.`,
    prompt: JSON.stringify(context),
    temperature: 0.7,
    maxOutputTokens: 450
   });
   const clean=text.trim();
   return clean || templateNarration(snapshot,result);
  }catch{ return templateNarration(snapshot,result); }
 }
}
