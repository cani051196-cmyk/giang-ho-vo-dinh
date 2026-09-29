import { json } from '@sveltejs/kit';
import { isAdmin } from '$lib/admin/auth';
import { getGameSnapshot, saveAdminWorld } from '$lib/core/game-service';
import type { Faction, Item, Location, MartialArt, NpcState, Quest, Technique, WorldEvent } from '$lib/core/types';

const types = ['npcs', 'factions', 'locations', 'martial_arts', 'techniques', 'items', 'quests', 'events'] as const;
type EntityType = typeof types[number];

function unauthorized() { return json({ error: 'ADMIN_REQUIRED' }, { status: 401 }); }
function bad(message: string) { return json({ error: 'BAD_REQUEST', message }, { status: 400 }); }
function notFound() { return json({ error: 'NOT_FOUND' }, { status: 404 }); }

function asCsv(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function asJsonObject(value: unknown, fallback: Record<string, number> = {}) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, number>;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, number>;
    } catch {}
  }
  return fallback;
}


const arrayFields = new Set([
  'tags','connections','factions','services','personality','goals','fears','secrets','martial_art_ids','equipment_ids',
  'passives','technique_ids','compatibility','synergy_tags','conflict_tags','counter_profile','requirements','effects','conditions',
  'participants','rewards','fail_conditions','consequences','branches','outcomes'
]);

function normaliseField(key: string, value: unknown) {
  if (arrayFields.has(key)) return asCsv(value);
  if (key === 'unique') return Boolean(value);
  if (['quality','quantity','population','danger_level','base_travel_time','reputation','treasury','health','max_health','money','order','base_power','qi_cost','stamina_cost','cooldown','accuracy','speed','range','risk','priority','objective_target','deadline'].includes(key)) return value === '' || value == null ? 0 : Number(value);
  if (['attribute_scaling','qi_requirements','scaling','modifiers','resources'].includes(key)) return asJsonObject(value);
  return value == null ? '' : String(value);
}

function patchEntity(type: EntityType, existing: any, data: Record<string, unknown>, world: Awaited<ReturnType<typeof getGameSnapshot>>['world']) {
  const entity = structuredClone(existing);
  for (const key of Object.keys(data)) {
    if (key === 'money' && type === 'npcs') {
      entity.resources = { ...(entity.resources ?? {}), money: Number(data[key] ?? 0) };
      continue;
    }
    const value = normaliseField(key, data[key]);
    if (key === 'region_id' && type === 'locations') entity.region_id = String(value);
    else if (key === 'faction_id' && (type === 'npcs' || type === 'items')) entity.faction_id = value ? String(value) : undefined;
    else entity[key] = value;
  }
  if (type === 'npcs') {
    entity.resources = entity.resources ?? { money: 100 };
    entity.alive = entity.alive ?? true;
    entity.status = entity.status ?? [];
    entity.cooldowns = entity.cooldowns ?? {};
  }
  return entity;
}

function makeEntity(type: EntityType, id: string, data: Record<string, unknown>, world: Awaited<ReturnType<typeof getGameSnapshot>>['world']) {
  if (type === 'locations') {
    return {
      id,
      name: String(data.name ?? id), region_id: String(data.region_id ?? 'southern_jianghu'),
      tags: asCsv(data.tags), connections: asCsv(data.connections), base_travel_time: Number(data.base_travel_time ?? 1800),
      danger_level: Number(data.danger_level ?? 1), factions: asCsv(data.factions), resources: asCsv(data.resources),
      services: asCsv(data.services), population: Number(data.population ?? 100)
    } satisfies Location;
  }
  if (type === 'factions') {
    return { id, name: String(data.name ?? id), type: String(data.type ?? 'guild'), reputation: Number(data.reputation ?? 0), treasury: Number(data.treasury ?? 1000), resources: asJsonObject(data.resources) } satisfies Faction;
  }
  if (type === 'npcs') {
    return {
      id, name: String(data.name ?? id), title: String(data.title ?? ''), personality: asCsv(data.personality), goals: asCsv(data.goals), fears: asCsv(data.fears),
      secrets: asCsv(data.secrets), faction_id: data.faction_id ? String(data.faction_id) : undefined,
      location_id: String(data.location_id ?? Object.keys(world.locations)[0]), health: Number(data.health ?? 100), max_health: Number(data.max_health ?? data.health ?? 100),
      qi: { capacity: 100, current: 100, quality: 50, purity: 50, control: 50, nature: ['CANG'] },
      attributes: { the_chat: 40, luc_luong: 40, than_phap: 40, noi_luc: 40, can_co: 40, ngo_tinh: 40, tam_canh: 40, cam_giac: 40 },
      realm: String(data.realm ?? 'Luyện Thể') as NpcState['realm'], martial_art_ids: asCsv(data.martial_art_ids), equipment_ids: asCsv(data.equipment_ids),
      resources: { money: Number(data.money ?? 100) }, knowledge_ids: [], memory_ids: [], relationship_ids: [], reputation: Number(data.reputation ?? 0),
      schedule: [], status: [], alive: true, cooldowns: {}
    } satisfies NpcState;
  }
  if (type === 'martial_arts') {
    return {
      id, name: String(data.name ?? id), type: String(data.type ?? 'SWORD'), style: String(data.style ?? 'BIẾN HÓA'), quality: Number(data.quality ?? 50),
      origin: String(data.origin ?? 'giang_ho'), realm_requirement: String(data.realm_requirement ?? 'Luyện Thể') as MartialArt['realm_requirement'],
      attribute_scaling: asJsonObject(data.attribute_scaling), qi_requirements: asJsonObject(data.qi_requirements), mastery: 0,
      passives: asCsv(data.passives), technique_ids: asCsv(data.technique_ids), compatibility: asCsv(data.compatibility), synergy_tags: asCsv(data.synergy_tags),
      conflict_tags: asCsv(data.conflict_tags), counter_profile: asCsv(data.counter_profile), requirements: asCsv(data.requirements)
    } satisfies MartialArt;
  }
  if (type === 'techniques') {
    return {
      id, martial_art_id: String(data.martial_art_id ?? Object.keys(world.martial_arts)[0]), name: String(data.name ?? id), order: Number(data.order ?? 1),
      base_power: Number(data.base_power ?? 20), scaling: asJsonObject(data.scaling), qi_cost: Number(data.qi_cost ?? 10), stamina_cost: Number(data.stamina_cost ?? 8),
      cooldown: Number(data.cooldown ?? 0), accuracy: Number(data.accuracy ?? 75), speed: Number(data.speed ?? 50), range: Number(data.range ?? 1),
      targeting: String(data.targeting ?? 'single'), effects: asCsv(data.effects), counter_profile: asCsv(data.counter_profile), injury_profile: { MINOR: .05, MODERATE: .03, SEVERE: .01, CRITICAL: .005 },
      risk: Number(data.risk ?? 0.05), requirements: asCsv(data.requirements)
    } satisfies Technique;
  }
  if (type === 'items') {
    return {
      id, name: String(data.name ?? id), category: String(data.category ?? 'SPECIAL'), quality: Number(data.quality ?? 50), rarity: String(data.rarity ?? 'COMMON'),
      region_id: String(data.region_id ?? 'southern_jianghu'), faction_id: data.faction_id ? String(data.faction_id) : undefined,
      modifiers: asJsonObject(data.modifiers), quantity: Math.max(1, Number(data.quantity ?? 1)), unique: Boolean(data.unique), owner_id: data.owner_id ? String(data.owner_id) : undefined
    } satisfies Item;
  }
  if (type === 'quests') {
    return {
      id, name: String(data.name ?? id), description: String(data.description ?? ''), state: String(data.state ?? 'AVAILABLE') as Quest['state'],
      objectives: [{ id: `${id}_o1`, description: String(data.objective_description ?? 'Hoàn thành mục tiêu đầu tiên'), progress: 0, target: Number(data.objective_target ?? 1) }],
      conditions: asCsv(data.conditions), participants: asCsv(data.participants), rewards: asCsv(data.rewards), fail_conditions: asCsv(data.fail_conditions),
      deadline: data.deadline ? Number(data.deadline) : undefined, consequences: asCsv(data.consequences), branches: asCsv(data.branches)
    } satisfies Quest;
  }
  return {
    id, trigger: String(data.trigger ?? 'time_advance'), conditions: asCsv(data.conditions), participants: asCsv(data.participants), priority: Number(data.priority ?? 1),
    cooldown: Number(data.cooldown ?? 3600), outcomes: asCsv(data.outcomes), consequences: asCsv(data.consequences), visibility: String(data.visibility ?? 'PUBLIC') as WorldEvent['visibility']
  } satisfies WorldEvent;
}

export async function GET({ cookies }) {
  if (!isAdmin(cookies)) return unauthorized();
  const snapshot = await getGameSnapshot();
  const world = snapshot.world;
  return json({
    world: {
      id: world.world_id,
      time: world.world_time,
      weather: world.weather_state,
      calendar: world.calendar,
      regions: world.regions,
      locations: world.locations,
      npcs: world.npcs,
      factions: world.factions,
      martial_arts: world.martial_arts,
      techniques: world.techniques,
      items: world.items,
      quests: world.quests,
      events: world.events
    },
    counts: {
      locations: Object.keys(world.locations).length,
      npcs: Object.keys(world.npcs).length,
      factions: Object.keys(world.factions).length,
      martial_arts: Object.keys(world.martial_arts).length,
      techniques: Object.keys(world.techniques).length,
      items: Object.keys(world.items).length,
      quests: Object.keys(world.quests).length,
      events: world.events.length
    }
  });
}

export async function POST({ cookies, request }) {
  if (!isAdmin(cookies)) return unauthorized();
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return bad('Body phải là JSON object.');
  const type = String((body as any).type) as EntityType;
  if (!types.includes(type)) return bad(`Entity type không hợp lệ: ${type}`);
  const id = String((body as any).id || '').trim();
  if (!id || !/^[a-zA-Z0-9_-]{2,80}$/.test(id)) return bad('ID phải gồm 2–80 ký tự chữ, số, _ hoặc -.');
  const op = String((body as any).op || 'upsert');
  const data = ((body as any).data || {}) as Record<string, unknown>;
  const snapshot = await getGameSnapshot();
  const world = structuredClone(snapshot.world);
  const table = world[type] as any;

  if (op === 'delete') {
    if (type === 'events') {
      const before = world.events.length;
      world.events = world.events.filter((e) => e.id !== id);
      if (world.events.length === before) return notFound();
    } else {
      if (!table[id]) return notFound();
      if (type === 'npcs' && (snapshot.player.active_quests.some((q) => snapshot.world.quests[q]?.participants.includes(id)))) return json({ error: 'DEPENDENCY', message: 'NPC đang tham gia quest đang active.' }, { status: 409 });
      if (type === 'martial_arts' && snapshot.player.martial_art_ids.includes(id)) return json({ error: 'DEPENDENCY', message: 'Người chơi đang học võ công này.' }, { status: 409 });
      if (type === 'techniques' && Object.values(world.martial_arts).some((m) => m.technique_ids.includes(id))) return json({ error: 'DEPENDENCY', message: 'Technique đang được Martial Art tham chiếu.' }, { status: 409 });
      if (type === 'locations' && snapshot.player.location_id === id) return json({ error: 'DEPENDENCY', message: 'Không thể xóa địa điểm hiện tại của người chơi.' }, { status: 409 });
      delete table[id];
      if (type === 'locations') for (const loc of Object.values(world.locations)) loc.connections = loc.connections.filter((x) => x !== id);
      if (type === 'martial_arts') for (const t of Object.values(world.techniques)) { if (t.martial_art_id === id) delete world.techniques[t.id]; }
    }
    await saveAdminWorld(world);
    return json({ ok: true, op: 'delete', id });
  }

  const existing = type === 'events' ? world.events.find((e) => e.id === id) : table[id];
  const entity = existing && typeof existing === 'object' ? patchEntity(type, existing, data, world) : makeEntity(type, id, data, world) as any;
  if (type === 'events') {
    if (existing) world.events = world.events.map((e) => e.id === id ? entity : e);
    else world.events.push(entity);
  } else {
    table[id] = entity;
  }

  // Keep reference integrity when assigning core links.
  if (type === 'techniques' && !world.martial_arts[entity.martial_art_id]) return bad('martial_art_id không tồn tại.');
  if (type === 'npcs' && !world.locations[entity.location_id]) return bad('location_id không tồn tại.');
  if (type === 'npcs' && entity.faction_id && !world.factions[entity.faction_id]) return bad('faction_id không tồn tại.');
  if (type === 'items' && entity.owner_id && entity.owner_id !== snapshot.player.id && !world.npcs[entity.owner_id]) return bad('owner_id không tồn tại.');

  await saveAdminWorld(world);
  return json({ ok: true, op: existing ? 'update' : 'create', id, entity });
}
