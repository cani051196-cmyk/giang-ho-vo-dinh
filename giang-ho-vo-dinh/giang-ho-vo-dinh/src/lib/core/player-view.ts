import type { Faction, GameSnapshot, Item, KnowledgeRecord, MemoryRecord, NpcState, Quest, WorldEvent } from './types';

export interface PlayerView {
  player: GameSnapshot['player'];
  world: Omit<GameSnapshot['world'], 'npcs'|'factions'|'knowledge'|'memories'|'items'|'martial_arts'|'techniques'|'quests'|'events'|'scheduled_events'|'global_flags'> & {
    npcs: Record<string, Omit<NpcState, 'realm'> & {
      realm: string;
      visible_realm: string;
      goals: string[];
      fears: string[];
      secrets: string[];
      resources: Record<string, number>;
      knowledge_ids: string[];
      memory_ids: string[];
      schedule: NpcState['schedule'];
      cooldowns: Record<string, number>;
    }>;
    factions: Record<string, Faction & { treasury: number; resources: Record<string, number> }>;
    knowledge: Record<string, KnowledgeRecord>;
    memories: Record<string, MemoryRecord>;
    items: Record<string, Item>;
    martial_arts: GameSnapshot['world']['martial_arts'];
    techniques: GameSnapshot['world']['techniques'];
    quests: Record<string, Quest>;
    events: WorldEvent[];
    scheduled_events: [];
    global_flags: Record<string, boolean|number|string>;
  };
}

/**
 * Creates a client-safe projection. The canonical GameSnapshot never crosses the player API boundary.
 * Hidden NPC facts, other actors' knowledge/memory, hidden event definitions and NPC-only equipment are stripped.
 */
export function buildPlayerView(snapshot: GameSnapshot): PlayerView {
  const player = structuredClone(snapshot.player);
  const playerKnowledgeIds = new Set(player.knowledge_ids);
  const knownNpcIds = new Set(
    Object.values(snapshot.world.knowledge)
      .filter((k) => k.owner_id === player.id && k.visibility === 'PLAYER')
      .map((k) => k.subject)
  );
  const npcs = Object.fromEntries(Object.values(snapshot.world.npcs).map((npc) => {
    const known = knownNpcIds.has(npc.id);
    return [npc.id, {
      ...structuredClone(npc),
      faction_id: npc.faction_id === 'f_hidden' && !known ? undefined : npc.faction_id,
      realm: known ? npc.realm : '???',
      visible_realm: known ? npc.realm : '???',
      martial_art_ids: [],
      equipment_ids: [],
      goals: [],
      fears: [],
      secrets: [],
      resources: {},
      knowledge_ids: [],
      memory_ids: [],
      schedule: [],
      cooldowns: {}
    }];
  }));

  const factions = Object.fromEntries(Object.values(snapshot.world.factions).map((f) => [f.id, {
    ...structuredClone(f),
    treasury: 0,
    resources: {}
  }]));

  const knowledge = Object.fromEntries(Object.values(snapshot.world.knowledge)
    .filter((k) => k.owner_id === player.id && playerKnowledgeIds.has(k.id))
    .map((k) => [k.id, structuredClone(k)]));
  const memories = Object.fromEntries(Object.values(snapshot.world.memories)
    .filter((m) => m.owner_id === player.id)
    .map((m) => [m.memory_id, structuredClone(m)]));

  const visibleItemIds = new Set(player.inventory_ids);
  for (const item of Object.values(snapshot.world.items)) {
    if (!item.unique && item.owner_id === 'npc_yue') visibleItemIds.add(item.id);
  }
  const items = Object.fromEntries([...visibleItemIds]
    .map((id) => snapshot.world.items[id]).filter(Boolean)
    .map((item) => [item.id, structuredClone(item!)]));

  const martialArts = Object.fromEntries(player.martial_art_ids
    .map((id) => snapshot.world.martial_arts[id]).filter(Boolean)
    .map((ma) => [ma.id, structuredClone(ma!)]));
  const techniqueIds = new Set(Object.values(martialArts).flatMap((ma) => ma.technique_ids));
  const techniques = Object.fromEntries([...techniqueIds]
    .map((id) => snapshot.world.techniques[id]).filter(Boolean)
    .map((t) => [t.id, structuredClone(t!)]));

  const quests = Object.fromEntries(Object.values(snapshot.world.quests)
    .filter((q) => q.state === 'AVAILABLE' || player.active_quests.includes(q.id) || player.completed_quests.includes(q.id))
    .map((q) => [q.id, { ...structuredClone(q), branches: [] }]));

  const publicEvents: WorldEvent[] = [];
  const globalFlags = Object.fromEntries(Object.entries(snapshot.world.global_flags)
    .filter(([key]) => !key.startsWith('event:')));

  return {
    player,
    world: {
      world_id: snapshot.world.world_id,
      world_time: snapshot.world.world_time,
      calendar: structuredClone(snapshot.world.calendar),
      regions: structuredClone(snapshot.world.regions),
      locations: structuredClone(snapshot.world.locations),
      npcs,
      factions,
      relationships: Object.fromEntries(Object.values(snapshot.world.relationships)
        .filter((r) => r.actor_id === player.id)
        .map((r) => [`rel_${r.actor_id}_${r.target_id}`, structuredClone(r)])),
      reputations: structuredClone(snapshot.world.reputations),
      knowledge,
      rumors: structuredClone(snapshot.world.rumors),
      memories,
      quests,
      events: publicEvents,
      items,
      martial_arts: martialArts,
      techniques,
      market_state: structuredClone(snapshot.world.market_state),
      weather_state: snapshot.world.weather_state,
      global_flags: globalFlags,
      scheduled_events: [],
      event_log: snapshot.world.event_log.filter((e) => e.visibility === 'PLAYER').slice(-50).map((e) => structuredClone(e))
    }
  };
}
