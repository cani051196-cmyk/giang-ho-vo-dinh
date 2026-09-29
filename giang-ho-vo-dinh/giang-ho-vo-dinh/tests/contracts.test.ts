import { describe, expect, it } from 'vitest';
import { actionRequestSchema, engineResultSchema, intentParserOutputSchema } from '../src/lib/validation/contracts';
import { parseIntent } from '../src/lib/ai/parser';
import { createSeedSnapshot } from '../seeds/content';
import { buildNarrationContext } from '../src/lib/ai/narration-context';
import { buildPlayerView } from '../src/lib/core/player-view';

describe('protocol contracts',()=>{
 it('accepts a strict ActionRequest',()=>{
  expect(actionRequestSchema.safeParse({schema_version:'1.0',action_id:'a',actor_id:'p',action_type:'ATTACK',source:'QUICK_ACTION'}).success).toBe(true);
 });
 it('rejects extra fields',()=>{
  expect(actionRequestSchema.safeParse({schema_version:'1.0',action_id:'a',actor_id:'p',action_type:'ATTACK',source:'QUICK_ACTION',oops:1}).success).toBe(false);
 });
 it('validates EngineResult',()=>{
  expect(engineResultSchema.safeParse({schema_version:'1.0',action_id:'a',status:'ACCEPTED',outcome:'SUCCESS',time_elapsed_seconds:1,state_changes:[],events:[],narration_hints:[]}).success).toBe(true);
 });
 it('enforces confidence 0..1',()=>{
  expect(intentParserOutputSchema.safeParse({schema_version:'1.0',intent_status:'UNKNOWN',confidence:2}).success).toBe(false);
 });
 it('maps Vietnamese natural language into structured intents',()=>{
  const s=createSeedSnapshot();
  const parsed=parseIntent('luyện công 3 giờ',s); expect(parsed.action_type).toBe('OBSERVE'); expect(parsed.parameters?.mode).toBe('TRAIN'); expect(parsed.parameters?.hours).toBe(3);
  const faction=parseIntent('gia nhập Vạn Lộ Thương Hội',s); expect(faction.action_type).toBe('TALK'); expect(faction.target_id).toBe('npc_yue');
 });
 it('player view strips hidden world data',()=>{
  const s=createSeedSnapshot(); const view=buildPlayerView(s);
  expect(view.world.npcs.npc_he.visible_realm).toBe('???');
  expect(view.world.npcs.npc_he.secrets).toHaveLength(0);
  expect(Object.keys(view.world.npcs.npc_he.schedule)).toHaveLength(0);
  expect(view.world.scheduled_events).toHaveLength(0);
  expect(view.world.global_flags['event:event_2']).toBeUndefined();
 });
 it('narration context excludes raw world state and NPC secrets',()=>{
  const s=createSeedSnapshot(); const result={schema_version:'1.0',action_id:'x',status:'ACCEPTED',outcome:'SUCCESS',time_elapsed_seconds:1,state_changes:[],events:[],narration_hints:['Ngươi quan sát thấy điều gì đó.']} as any;
  const ctx=buildNarrationContext(s,result);
  const serialized=JSON.stringify(ctx);
  expect(serialized).not.toContain('từng dùng tên giả'); expect(serialized).not.toContain('biết một lối đi bí mật'); expect((ctx as any).world).toBeUndefined();
 });
});
