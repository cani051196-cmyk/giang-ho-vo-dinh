import { randomUUID } from 'node:crypto';
import { createSeedSnapshot } from '../../../seeds/content';
import { GameEngine } from '../engine/engine';
import { actionRequestSchema, engineResultSchema } from '../validation/contracts';
import { DurableSaveRepository } from '../save/repository';
import { FallbackAiRouter } from '../ai/router';
import { createCharacter } from './character';
import { recordAiMetric, recordEngineMetric } from '../observability/metrics';
import type { ActionRequest, GameSnapshot, EngineResult } from './types';
import { buildPlayerView } from './player-view';

const repository=new DurableSaveRepository();
const engine=new GameEngine();
const ai=new FallbackAiRouter();
let snapshot:GameSnapshot=createSeedSnapshot();
let mutationQueue:Promise<unknown>=Promise.resolve();

async function locked<T>(job:()=>Promise<T>):Promise<T>{ const run=mutationQueue.then(job,job); mutationQueue=run.then(()=>undefined,()=>undefined); return run; }

export async function getGameSnapshot(playerId='player_001'){
 const saved=await repository.load(playerId); if(saved) snapshot=saved;
 return structuredClone(snapshot);
}

export async function getPlayerView(){ await getGameSnapshot(); return buildPlayerView(snapshot); }

export async function resolveAction(action:ActionRequest){
 return locked(async()=>{
  const parsed=actionRequestSchema.safeParse(action); if(!parsed.success) throw new Error(`ActionRequest schema invalid: ${parsed.error.message}`);
  const before=structuredClone(snapshot);
  const candidate=structuredClone(snapshot);
  const start=Date.now();
  const result:EngineResult=engine.resolve(candidate,parsed.data);
  const resolutionMs=Date.now()-start;
  const valid=engineResultSchema.safeParse(result); if(!valid.success) throw new Error(`EngineResult schema invalid: ${valid.error.message}`);
  recordEngineMetric({action_id:action.action_id,resolution_ms:resolutionMs,state_changes_count:result.state_changes.length,event_count:result.events.length});
  if(result.status==='ACCEPTED'){ await repository.save(action.actor_id,candidate,result.events); snapshot=candidate; }
  return {result:valid.data,snapshot:buildPlayerView(snapshot),before};
 });
}

export async function handleNaturalLanguage(input:string){
 const started=Date.now();
 const intent=await ai.parse(input,snapshot);
 recordAiMetric({request_id:randomUUID(),scene_id:snapshot.player.location_id,task_type:'intent_parser',latency_ms:Date.now()-started,status:intent.action_type?'SUCCESS':'UNKNOWN',fallback_used:process.env.AI_PARSER_ENABLED==='true'?'deterministic-or-model':'deterministic'});
 if(!intent.action_type) return {intent,result:null,snapshot:buildPlayerView(snapshot),narration:'Ta chưa hiểu rõ ý định này. Hãy thử mô tả ngắn gọn hơn.'};
 const action:ActionRequest={schema_version:'1.0',action_id:randomUUID(),actor_id:snapshot.player.id,action_type:intent.action_type,target_id:intent.target_id,parameters:intent.parameters,source:'NATURAL_LANGUAGE'};
 const resolved=await resolveAction(action);
 const narrationStarted=Date.now();
 const narration=await ai.narrate(snapshot,resolved.result);
 recordAiMetric({request_id:randomUUID(),scene_id:resolved.snapshot.player.location_id,task_type:'narrator',latency_ms:Date.now()-narrationStarted,model:process.env.AI_MODEL,status:'SUCCESS',fallback_used:process.env.AI_GATEWAY_API_KEY?'template-on-error':'template'});
 return {...resolved,intent,narration,action};
}

export async function createNewCharacter(name:string, archetype:'du_hiep'|'kiem_khach'|'noi_gia'|'ho_the'){ return locked(async()=>{ if(snapshot.world.global_flags.character_created===true) throw new Error('CHARACTER_ALREADY_CREATED'); const candidate=structuredClone(snapshot); createCharacter(candidate,name,archetype); await repository.save(candidate.player.id,candidate,[]); snapshot=candidate; return buildPlayerView(snapshot); }); }
export async function saveGame(){ return locked(async()=>{ await repository.save(snapshot.player.id,snapshot,[]); return {ok:true}; }); }
export async function loadGame(){ return locked(async()=>{ const s=await repository.load(snapshot.player.id); if(s) snapshot=s; return buildPlayerView(snapshot); }); }

export async function saveAdminWorld(world: GameSnapshot['world']) {
 return locked(async()=>{
  const candidate = structuredClone(snapshot);
  candidate.world = structuredClone(world);
  await repository.save(candidate.player.id, candidate, []);
  snapshot = candidate;
  return buildPlayerView(snapshot);
 });
}
