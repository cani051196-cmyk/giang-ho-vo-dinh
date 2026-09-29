# BUILD STATUS

## Delivered in this source snapshot

The repository contains the locked architecture foundation plus a playable end-to-end vertical slice. It is not represented as fully verified in this sandbox because the npm registry was unavailable, so external dependencies could not be installed here.

### Verified locally without npm dependencies
- Core Engine TypeScript compilation: PASS.
- Player View TypeScript compilation: PASS.
- Seed/content reference integrity: PASS.
- Runtime smoke: travel, observation, training, quest completion, NPC memory and shared combat simulator: PASS.
- JSON protocol files parse and use strict `additionalProperties: false`: PASS.
- Player View secret-boundary smoke: PASS.

### Verification that still requires a normal development machine
- `npm install`
- `npm run check`
- `npm test`
- `npm run test:e2e`
- `npm run build`
- PostgreSQL/pgvector migration execution

Run those commands after installing dependencies.

## What is implemented

Phase 0 foundation and the full Phase 1 vertical slice are implemented, plus the core Phase 2 systems. The project includes character creation, movement/time, combat, injury, training, breakthrough, martial arts, items/equipment, NPC relationships/memory, factions/reputation, player knowledge, quests, events, economy, save/load, natural language input, AI fallback/live routing, PWA/mobile shell, debug/metrics and regression test scaffolding.

The remaining Master Plan roadmap is deeper content and simulation: advanced meridian/injury/breakthrough depth, deeper faction politics/war, larger world content, legacy/descendants, and production operational hardening.

## Admin Console (new)
- `/admin` mobile/desktop Developer Console with password gate.
- CRUD for NPC, martial art, technique, item, quest, location, faction and world event.
- Server-side validation and dependency checks.
- Changes persist through the existing durable save repository and affect the active world immediately.
- `/api/health` added for deployment health checks.
- Local dev server exposes LAN via `RUN_GAME.bat` so a phone on the same Wi-Fi can open the game.

## Important limitation
This is still a single-player world architecture, as specified. The admin console changes that single canonical world. It is not yet a multi-account SaaS admin with role management. Production auth/operational hardening remains Phase 5 work.
