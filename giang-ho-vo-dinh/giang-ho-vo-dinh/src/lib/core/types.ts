export const ATTRIBUTE_NAMES = ['the_chat','luc_luong','than_phap','noi_luc','can_co','ngo_tinh','tam_canh','cam_giac'] as const;
export type AttributeName = typeof ATTRIBUTE_NAMES[number];

export type Realm = 'Phàm Nhân'|'Luyện Thể'|'Luyện Khí'|'Thông Mạch'|'Ngưng Khí'|'Tiểu Thành'|'Đại Thành'|'Tông Sư'|'Đại Tông Sư'|'Tuyệt Đỉnh';
export const REALMS: Realm[] = ['Phàm Nhân','Luyện Thể','Luyện Khí','Thông Mạch','Ngưng Khí','Tiểu Thành','Đại Thành','Tông Sư','Đại Tông Sư','Tuyệt Đỉnh'];

export type QiNature = 'CANG'|'NHU'|'HAN'|'NHIET'|'DOC'|'HO_THE'|'TA_LUC'|'XUYEN_THAU';
export type ActionType = 'ATTACK'|'DEFEND'|'DODGE'|'COUNTER'|'FEINT'|'FEINT_ATTACK'|'MOVE'|'USE_SKILL'|'USE_ITEM'|'FLEE'|'SURRENDER'|'TALK'|'OBSERVE';
export type IntentStatus = 'EXACT'|'PARTIAL'|'IMPLIED'|'AMBIGUOUS'|'IMPOSSIBLE'|'UNKNOWN';
export type EngineStatus = 'ACCEPTED'|'REJECTED';
export type CombatOutcome = 'CRITICAL_SUCCESS'|'SUCCESS'|'ADVANTAGE'|'NEUTRAL'|'DISADVANTAGE'|'FAILURE'|'CRITICAL_FAILURE';
export type FailureOutcome = 'WIN'|'SURVIVE'|'FAILURE'|'CAPTURE'|'DEATH';
export type InjurySeverity = 'MINOR'|'MODERATE'|'SEVERE'|'CRITICAL';
export type BodyPart = 'HEAD'|'TORSO'|'LEFT_ARM'|'RIGHT_ARM'|'LEFT_LEG'|'RIGHT_LEG';
export type QuestState = 'LOCKED'|'AVAILABLE'|'ACTIVE'|'PROGRESSING'|'COMPLETED'|'FAILED'|'ABANDONED'|'EXPIRED'|'TRANSFORMED';

export interface Attributes { the_chat:number; luc_luong:number; than_phap:number; noi_luc:number; can_co:number; ngo_tinh:number; tam_canh:number; cam_giac:number; }
export interface QiState { capacity:number; current:number; quality:number; purity:number; control:number; nature:QiNature[]; }
export interface MeridianState { health:number; capacity_modifier:number; flow_modifier:number; damage:number; }
export interface Injury { id:string; severity:InjurySeverity; body_part:BodyPart; combat_modifier:number; recovery_time_seconds:number; }
export interface MartialArt { id:string; name:string; type:string; style:string; quality:number; origin:string; realm_requirement:Realm; attribute_scaling:Partial<Record<AttributeName,number>>; qi_requirements:Partial<Record<string,number>>; mastery:number; passives:string[]; technique_ids:string[]; compatibility:string[]; synergy_tags:string[]; conflict_tags:string[]; counter_profile:string[]; requirements:string[]; }
export interface Technique { id:string; martial_art_id:string; name:string; order:number; base_power:number; scaling:Partial<Record<AttributeName,number>>; qi_cost:number; stamina_cost:number; cooldown:number; accuracy:number; speed:number; range:number; targeting:string; effects:string[]; counter_profile:string[]; injury_profile:Partial<Record<InjurySeverity,number>>; risk:number; requirements:string[]; }
export interface Item { id:string; name:string; category:string; quality:number; rarity:string; region_id:string; faction_id?:string; modifiers:Record<string,number>; quantity:number; unique:boolean; owner_id?:string; }
export interface Location { id:string; name:string; region_id:string; tags:string[]; connections:string[]; base_travel_time:number; danger_level:number; factions:string[]; resources:string[]; services:string[]; population:number; }
export interface Relationship { actor_id:string; target_id:string; trust:number; respect:number; fear:number; hatred:number; debt:number; affection:number; suspicion:number; }
export interface KnowledgeRecord { id:string; subject:string; claim:string; confidence:number; source:string; timestamp:number; visibility:'PLAYER'|'NPC'|'WORLD'; owner_id:string; }
export interface MemoryRecord { memory_id:string; subject:string; participants:string[]; content:string; timestamp:number; importance:'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'; confidence:number; location:string; tags:string[]; embedding?:number[]; owner_id:string; }
export interface Rumor { id:string; content_claim:string; truth_source:string; distortion_level:number; confidence:number; origin_location:string; origin_actor:string; spread_rate:number; }
export interface NpcState { id:string; name:string; title?:string; personality:string[]; goals:string[]; fears:string[]; secrets:string[]; faction_id?:string; location_id:string; health:number; max_health:number; qi:QiState; attributes:Attributes; realm:Realm; martial_art_ids:string[]; equipment_ids:string[]; resources:Record<string,number>; knowledge_ids:string[]; memory_ids:string[]; relationship_ids:string[]; reputation:number; schedule:{time_minute:number; activity:string; location_id?:string}[]; status:string[]; alive:boolean; cooldowns:Record<string,number>; }
export interface Quest { id:string; name:string; description:string; state:QuestState; objectives:{id:string; description:string; progress:number; target:number}[]; conditions:string[]; participants:string[]; rewards:string[]; fail_conditions:string[]; deadline?:number; consequences:string[]; branches:string[]; }
export interface WorldEvent { id:string; trigger:string; conditions:string[]; participants:string[]; priority:number; cooldown:number; outcomes:string[]; consequences:string[]; visibility:'PUBLIC'|'HIDDEN'; }
export interface Faction { id:string; name:string; type:string; reputation:number; treasury:number; resources:Record<string,number>; }
export interface MarketState { supply:Record<string,number>; demand:Record<string,number>; base_price:Record<string,number>; }
export interface ScheduledEvent { id:string; at:number; event_type:string; payload:Record<string,unknown>; }
export interface WorldState { world_id:string; world_time:number; calendar:{year:number; month:number; day:number}; regions:Record<string,{id:string;name:string;tags:string[]}>; locations:Record<string,Location>; npcs:Record<string,NpcState>; factions:Record<string,Faction>; relationships:Record<string,Relationship>; reputations:Record<string,number>; knowledge:Record<string,KnowledgeRecord>; rumors:Record<string,Rumor>; memories:Record<string,MemoryRecord>; quests:Record<string,Quest>; events:WorldEvent[]; items:Record<string,Item>; martial_arts:Record<string,MartialArt>; techniques:Record<string,Technique>; market_state:MarketState; weather_state:'CLEAR'|'RAIN'|'FOG'|'STORM'|'SNOW'; global_flags:Record<string,boolean|number|string>; scheduled_events:ScheduledEvent[]; event_log:GameEvent[]; }
export interface PlayerState { id:string; name:string; location_id:string; attributes:Attributes; realm:Realm; qi:QiState; meridian:MeridianState; hp:number; max_hp:number; stamina:number; max_stamina:number; injuries:Injury[]; inventory_ids:string[]; martial_art_ids:string[]; mastery:Record<string,number>; equipment_ids:string[]; faction_ids:string[]; money:number; reputation:number; knowledge_ids:string[]; memory_ids:string[]; active_quests:string[]; completed_quests:string[]; status:string[]; alive:boolean; cooldowns:Record<string,number>; }
export interface GameEvent { event_id:string; timestamp:number; actor_id:string; action_type:string; target_id?:string; location_id?:string; cause:string; before:unknown; change:unknown; after:unknown; visibility:string; }

export interface ActionRequest { schema_version:'1.0'; action_id:string; actor_id:string; action_type:ActionType; target_id?:string; parameters?:Record<string,unknown>; source:'NATURAL_LANGUAGE'|'QUICK_ACTION'; }
export interface EngineResult { schema_version:'1.0'; action_id:string; status:EngineStatus; outcome?:CombatOutcome|FailureOutcome|string; time_elapsed_seconds:number; state_changes:unknown[]; events:GameEvent[]; narration_hints:string[]; error_code?:string; error_message?:string; }
export interface IntentParserOutput { schema_version:'1.0'; intent_status:IntentStatus; action_type?:ActionType; target_id?:string; parameters?:Record<string,unknown>; confidence:number; }

export interface GameSnapshot { player:PlayerState; world:WorldState; }
