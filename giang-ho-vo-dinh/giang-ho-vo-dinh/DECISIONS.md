# DECISIONS

- Database > Game Engine > AI > UI.
- Gameplay never depends on AI availability.
- Natural Language and Quick Actions use the same Engine.
- No artificial NPC scaling to player.
- No protagonist immunity.
- Time advances by action duration/time jump.
- Event log is immutable at logical level.
- Player Knowledge is separate from World Truth and NPC Knowledge.
- Combat Simulator uses the same Combat Engine as runtime.
- Content is data-driven, not UI hard-coded.
- SvelteKit 2.70.3 is used because SvelteKit 3 remains on `next` while 2.70.3 is the current stable tag at project bootstrap.
- Svelte 5.57.1, TypeScript 5.8.3, Drizzle ORM 0.45.3, Drizzle Kit 0.31.11, Vitest 5.0.2, Playwright 1.63.0, Dexie 4.4.6, AI SDK 7.0.118 were selected from current stable package tags at project bootstrap.


## WEB PLAY + ADMIN
- Player experience lives at `/` and is designed as a mobile-first PWA.
- Developer Console lives at `/admin`.
- `/admin` is server-gated by `ADMIN_PASSWORD`; the browser never receives canonical WorldState.
- Content CRUD is server-side and reuses the same canonical world snapshot + persistence path.
- Content edits are intended for the single-player canonical world; multi-account admin roles remain future production hardening.
