import type { EngineResult, GameSnapshot, MemoryRecord } from '../core/types';
import { retrieveMemories } from '../memory/memory';

export interface NarrationContext {
  current_scene: { location: string; time: number; weather: string; visible_npcs: string[] };
  player_visible_engine_result: { status: string; outcome?: string; hints: string[]; time_elapsed_seconds: number };
  player_knowledge: string[];
  relevant_memory: Array<Pick<MemoryRecord, 'subject'|'content'|'importance'|'confidence'>>;
  style: 'wuxia_original';
  narration_level: 'short'|'normal'|'dramatic';
}

export function buildNarrationContext(snapshot: GameSnapshot, result: EngineResult, level: NarrationContext['narration_level']='normal'): NarrationContext {
  const location = snapshot.world.locations[snapshot.player.location_id];
  const visibleNpcs = Object.values(snapshot.world.npcs)
    .filter(n => n.alive && n.location_id === snapshot.player.location_id)
    .slice(0, 8)
    .map(n => `${n.name}${n.title ? ` (${n.title})` : ''}`);
  const knowledge = snapshot.player.knowledge_ids
    .map(id => snapshot.world.knowledge[id])
    .filter(Boolean)
    .slice(-8)
    .map(k => k.claim);
  const memories = retrieveMemories(snapshot, snapshot.player.id, undefined, 5)
    .map(m => ({ subject: m.subject, content: m.content, importance: m.importance, confidence: m.confidence }));

  return {
    current_scene: {
      location: location?.name ?? 'vùng vô danh',
      time: snapshot.world.world_time,
      weather: snapshot.world.weather_state,
      visible_npcs: visibleNpcs
    },
    player_visible_engine_result: {
      status: result.status,
      outcome: result.outcome,
      hints: result.narration_hints.slice(0, 8),
      time_elapsed_seconds: result.time_elapsed_seconds
    },
    player_knowledge: knowledge,
    relevant_memory: memories,
    style: 'wuxia_original',
    narration_level: level
  };
}
