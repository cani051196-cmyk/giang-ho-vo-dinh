# CHANGELOG

## 0.1.0
- Created production-oriented SvelteKit/TypeScript repository.
- Implemented Phase 0 contracts and core engine.
- Added end-to-end vertical slice across character, travel, NPC, dialogue, natural language, combat, injury, trade, relationship, reputation, time, memory, event, quest, save/load and AI fallback.
- Added 3 locations, 12 NPCs, 3 factions, 20 martial arts, 40 techniques, 65 items, 6 quests and 5 world events.
- Added deterministic combat simulator using the same Combat Engine.
- Added player-knowledge visibility boundaries for hidden NPC facts.
- Added equipment modifiers, item ownership, market transactions and bounded economy behavior.
- Added structured memory plus optional pgvector retrieval layer.
- Added optional live AI routing with provider abstraction and template fallback.
- Added PWA shell caching for mobile/offline shell resilience.
- Added debug/observability scaffolding and expanded regression coverage.


## 2026-09-29 — Play/Admin Web Shell
- Added password-gated `/admin` console.
- Added admin CRUD API for NPC, martial arts, techniques, items, quests, locations, factions and events.
- Added dependency guards to prevent unsafe content deletion.
- Added `/api/health`.
- Enabled LAN access in `RUN_GAME.bat` / `RUN_PHONE.bat` for phone testing over the same Wi-Fi.
- Hardened Docker Compose startup with PostgreSQL healthcheck and deterministic migration init.
- Added Docker env configuration for Admin password/session secret.


## 2026-09-29 — One-Web Delivery
- Switched production adapter to `@sveltejs/adapter-vercel` with Node.js 24 runtime.
- Added Vercel build configuration and automatic migration step.
- Added PWA install prompt for supported browsers.
- Simplified README around the intended one-address web/PWA experience; LAN scripts remain only for development/debug.
