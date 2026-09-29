CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS game_saves (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 world_id text NOT NULL,
 player_id text NOT NULL,
 version integer NOT NULL DEFAULT 1,
 snapshot jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS game_saves_player_idx ON game_saves(player_id, updated_at DESC);
CREATE TABLE IF NOT EXISTS event_log (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 world_id text NOT NULL,
 event_id text NOT NULL,
 actor_id text NOT NULL,
 action_type text NOT NULL,
 target_id text,
 location_id text,
 cause text NOT NULL,
 before_state jsonb NOT NULL,
 change jsonb NOT NULL,
 after_state jsonb NOT NULL,
 visibility text NOT NULL,
 occurred_at bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS event_log_world_idx ON event_log(world_id);
CREATE INDEX IF NOT EXISTS event_log_time_idx ON event_log(occurred_at);
CREATE TABLE IF NOT EXISTS ai_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 request_id text NOT NULL,
 scene_id text NOT NULL,
 task_type text NOT NULL,
 model text,
 latency_ms integer,
 input_tokens integer,
 output_tokens integer,
 fallback_used text,
 status text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
