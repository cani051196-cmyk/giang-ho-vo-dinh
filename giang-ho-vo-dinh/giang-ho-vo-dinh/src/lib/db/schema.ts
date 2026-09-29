import { pgTable, uuid, text, integer, bigint, jsonb, timestamp, index, vector } from 'drizzle-orm/pg-core';

export const gameSaves=pgTable('game_saves',{
 id:uuid('id').defaultRandom().primaryKey(),
 worldId:text('world_id').notNull(),
 playerId:text('player_id').notNull(),
 version:integer('version').notNull().default(1),
 snapshot:jsonb('snapshot').notNull(),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp('updated_at',{withTimezone:true}).notNull().defaultNow()
});
export const eventLog=pgTable('event_log',{
 id:uuid('id').defaultRandom().primaryKey(),
 worldId:text('world_id').notNull(),
 eventId:text('event_id').notNull(),
 actorId:text('actor_id').notNull(),
 actionType:text('action_type').notNull(),
 targetId:text('target_id'),
 locationId:text('location_id'),
 cause:text('cause').notNull(),
 beforeState:jsonb('before_state').notNull(),
 change:jsonb('change').notNull(),
 afterState:jsonb('after_state').notNull(),
 visibility:text('visibility').notNull(),
 occurredAt:bigint('occurred_at',{mode:'number'}).notNull()
},t=>({worldIdx:index('event_log_world_idx').on(t.worldId), timeIdx:index('event_log_time_idx').on(t.occurredAt)}));
export const aiRequests=pgTable('ai_requests',{
 id:uuid('id').defaultRandom().primaryKey(),
 requestId:text('request_id').notNull(),
 sceneId:text('scene_id').notNull(),
 taskType:text('task_type').notNull(),
 model:text('model'),
 latencyMs:integer('latency_ms'),
 inputTokens:integer('input_tokens'),
 outputTokens:integer('output_tokens'),
 fallbackUsed:text('fallback_used'),
 status:text('status').notNull(),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow()
});

export const memoryRecords=pgTable('memory_records',{
 id:uuid('id').defaultRandom().primaryKey(),
 memoryId:text('memory_id').notNull(),
 ownerId:text('owner_id').notNull(),
 subject:text('subject').notNull(),
 content:text('content').notNull(),
 importance:text('importance').notNull(),
 confidence:integer('confidence').notNull().default(100),
 worldTime:bigint('world_time',{mode:'number'}).notNull(),
 locationId:text('location_id'),
 tags:jsonb('tags').notNull().default([]),
 embedding:vector('embedding',{dimensions:1536}),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow()
},t=>[index('memory_records_owner_idx').on(t.ownerId),index('memory_records_subject_idx').on(t.subject),index('memory_records_embedding_hnsw').using('hnsw',t.embedding.op('vector_cosine_ops'))]);
