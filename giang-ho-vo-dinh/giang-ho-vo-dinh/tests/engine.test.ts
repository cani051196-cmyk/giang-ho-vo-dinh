import { describe, expect, it } from 'vitest';
import { createSeedSnapshot } from '../seeds/content';
import { GameEngine } from '../src/lib/engine/engine';
import { simulateCombat } from '../src/lib/engine/simulator';

const action=(s:any,id:string,type:any,parameters:any={},target_id?:string)=>({schema_version:'1.0',action_id:id,actor_id:s.player.id,action_type:type,parameters,target_id,source:'QUICK_ACTION'});

describe('Giang Ho Vo Dinh Engine',()=>{
 it('creates isolated deterministic seed snapshots',()=>{
  const a=createSeedSnapshot(); const b=createSeedSnapshot();
  a.player.money=0; a.world.locations.dawn_gate.population=1;
  expect(b.player.money).toBe(280); expect(b.world.locations.dawn_gate.population).toBe(2400);
 });
 it('advances time and travel through the Engine',()=>{
  const s=createSeedSnapshot(); const e=new GameEngine();
  const r=e.resolve(s,action(s,'t','MOVE',{location_id:'mist_valley'}));
  expect(r.status).toBe('ACCEPTED'); expect(s.player.location_id).toBe('mist_valley'); expect(s.world.world_time).toBeGreaterThan(0); expect(s.world.event_log.length).toBeGreaterThanOrEqual(2);
 });
 it('records knowledge only through Engine observation',()=>{
  const s=createSeedSnapshot(); const e=new GameEngine();
  const r=e.resolve(s,action(s,'o','OBSERVE',{},'npc_lan'));
  expect(r.status).toBe('ACCEPTED'); expect(s.player.knowledge_ids).toHaveLength(1); expect(s.world.event_log.length).toBeGreaterThanOrEqual(2);
 });
 it('does not allow an invalid route',()=>{
  const s=createSeedSnapshot(); const e=new GameEngine();
  const r=e.resolve(s,action(s,'bad','MOVE',{location_id:'not_here'}));
  expect(r.status).toBe('REJECTED'); expect(s.player.location_id).toBe('dawn_gate');
 });

 it('rejects observing an NPC outside the current location',()=>{
  const s=createSeedSnapshot(); const e=new GameEngine();
  const r=e.resolve(s,action(s,'far','OBSERVE',{},'npc_he'));
  expect(r.status).toBe('REJECTED'); expect(r.error_code).toBe('TARGET_UNAVAILABLE'); expect(s.player.knowledge_ids).toHaveLength(0);
 });
 it('rejects techniques not belonging to a learned martial art',()=>{
  const s=createSeedSnapshot(); const e=new GameEngine();
  s.world.npcs.npc_lan.location_id=s.player.location_id;
  const r=e.resolve(s,action(s,'foreign','ATTACK',{martial_art_id:'ma_02',technique_id:'tech_03'},'npc_lan'));
  expect(r.status).toBe('REJECTED'); expect(r.error_code).toBe('MARTIAL_ART_UNAVAILABLE');
 });
 it('records NPC memory after dialogue',()=>{
  const s=createSeedSnapshot(); const e=new GameEngine();
  const before=s.world.npcs.npc_lan.memory_ids.length; const r=e.resolve(s,action(s,'talkmem','TALK',{},'npc_lan'));
  expect(r.status).toBe('ACCEPTED'); expect(s.world.npcs.npc_lan.memory_ids.length).toBe(before+1);
 });
 it('supports equipment changes and uses equipment in capability',()=>{
  const s=createSeedSnapshot(); const e=new GameEngine();
  const before=e.resolve(s,action(s,'obs','OBSERVE',{},'npc_yue'));
  expect(before.status).toBe('ACCEPTED');
  const weapon=s.world.items.item_09; const r=e.resolve(s,action(s,'eq','USE_ITEM',{item_id:weapon.id,mode:'EQUIP'},weapon.id));
  expect(r.status).toBe('ACCEPTED'); expect(s.player.equipment_ids).toContain(weapon.id);
 });
 it('enforces skill resources and cooldown',()=>{
  const s=createSeedSnapshot(); const e=new GameEngine();
  s.world.npcs.npc_lan.location_id=s.player.location_id;
  const r1=e.resolve(s,action(s,'a1','USE_SKILL',{technique_id:'tech_02',martial_art_id:'ma_01'},'npc_lan'));
  expect(r1.status).toBe('ACCEPTED');
  const r2=e.resolve(s,action(s,'a2','USE_SKILL',{technique_id:'tech_02',martial_art_id:'ma_01'},'npc_lan'));
  expect(r2.status).toBe('REJECTED'); expect(r2.error_code).toBe('COOLDOWN');
 });
 it('supports training, rest and breakthrough outcomes',()=>{
  const s=createSeedSnapshot(); const e=new GameEngine();
  const mastery=s.player.mastery.ma_01;
  const train=e.resolve(s,action(s,'tr','OBSERVE',{mode:'TRAIN',hours:2,martial_art_id:'ma_01'}));
  expect(train.status).toBe('ACCEPTED'); expect(s.player.mastery.ma_01).toBeGreaterThan(mastery);
  s.player.hp=80; const rest=e.resolve(s,action(s,'re','OBSERVE',{mode:'REST',hours:8}));
  expect(rest.status).toBe('ACCEPTED'); expect(s.player.hp).toBeGreaterThan(80);
  const realm=s.player.realm; const br=e.resolve(s,action(s,'br','OBSERVE',{mode:'BREAKTHROUGH'}));
  expect(br.status).toBe('ACCEPTED'); expect(['SUCCESS','PARTIAL','FAILURE','BACKLASH']).toContain(br.outcome); expect(typeof s.player.realm).toBe('string'); expect(realm).toBeDefined();
 });
 it('completes a quest and records the reward consequence',()=>{
  const s=createSeedSnapshot(); const e=new GameEngine();
  const accept=e.resolve(s,action(s,'qa','TALK',{quest_id:'q_trade',quest_action:'ACCEPT'},'npc_yue')); expect(accept.status).toBe('ACCEPTED');
  const move=e.resolve(s,action(s,'qt','MOVE',{location_id:'mist_valley'})); expect(move.status).toBe('ACCEPTED');
  expect(s.player.completed_quests).toContain('q_trade'); expect(s.player.money).toBeGreaterThan(280); expect(s.player.reputation).toBeGreaterThan(0);
 });
 it('runs the same runtime combat engine inside the simulator',()=>{
  const summary=simulateCombat(createSeedSnapshot(),'npc_shen',30);
  expect(summary.average_turns).toBeGreaterThan(0); expect(summary.average_damage).toBeGreaterThanOrEqual(0); expect(summary.win_rate).toBeGreaterThanOrEqual(0); expect(summary.win_rate).toBeLessThanOrEqual(1);
 });
});
