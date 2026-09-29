# GIANG HỒ VÔ ĐỊNH

Single-player wuxia open-world text RPG built from `MASTER_PLAN.md`. The project follows the locked authority model: Database > Game Engine > AI > UI.

## Included

- Mobile-first SvelteKit + Svelte + TypeScript PWA.
- Deterministic Game Engine for movement, time, world tick, combat, injury, equipment, training, breakthrough, quests, relationships, reputation, knowledge, rumors and economy.
- Shared Combat Engine + Simulator.
- Structured memory with optional PostgreSQL/pgvector retrieval.
- PostgreSQL/Drizzle persistence with deterministic in-memory demo fallback.
- Natural-language intent parser with deterministic fallback.
- Optional live AI narrator/parser through the Vercel AI SDK provider layer.
- Debug endpoint, bounded observability metrics, contract/regression/E2E test suites.

## Vertical-slice content

1 region, 3 locations, 12 NPCs, 3 factions, 20 martial arts, 40 techniques, 65 items, 6 quests, 5 world events.

## Cách dùng đơn giản nhất

**Bản người chơi cuối cùng được thiết kế để dùng như website/PWA:** mở đúng **một địa chỉ HTTPS** trên Chrome/Safari rồi chơi. Không cần Node.js, terminal hay Docker. Sau khi website được deploy, người chơi có thể chọn **Thêm vào màn hình chính** để dùng như một ứng dụng.

Xem `ONE_WEB.md` để cấu hình deployment lần đầu.

## Local setup / development

1. Cài Node.js 24 LTS.
2. Copy `.env.example` thành `.env`.
3. `npm install`
4. Có PostgreSQL thì chạy `npm run db:migrate`.
5. `npm run dev`

Không có PostgreSQL, game vẫn có deterministic in-memory persistence cho local play/testing.

## Điện thoại

### Cách khuyến nghị — một địa chỉ web

Sau khi deploy, người chơi chỉ cần mở HTTPS URL trên Android/iPhone. Không cần chạy `RUN_PHONE.bat`. Có thể chọn **Thêm vào màn hình chính** để biến website thành PWA.

### Chạy LAN để debug

`RUN_PHONE.bat` vẫn được giữ cho trường hợp Product Owner muốn test máy tính + điện thoại cùng Wi-Fi.

### Website online

Dùng Vercel cho SvelteKit và PostgreSQL managed (khuyến nghị Neon). `vercel.json` đã cấu hình build + migration. Xem `ONE_WEB.md`.

## Admin — sửa game không cần code

Mở `/admin` để vào Developer Console. Cấu hình `ADMIN_PASSWORD` trước khi dùng. Admin có thể tìm, thêm, sửa và xóa các content record: NPC, võ công, chiêu thức, vật phẩm, quest, location, faction và world event. Save của Admin đi qua server và áp dụng vào world state; các dependency nguy hiểm được Engine chặn.

Phân biệt: thay đổi **content/data** làm trực tiếp trong `/admin`; thay đổi **game rule/Engine architecture** vẫn phải được AI developer triển khai thành code + test + migration theo `MASTER_PLAN.md`.

## AI configuration

By default AI is disabled; gameplay and template narration work without an API. To enable live parsing, set `AI_PARSER_ENABLED=true` and an API key. To enable live narration, also set `AI_NARRATION_ENABLED=true`. `AI_MODEL` accepts the provider/model identifier supported by the configured provider layer.

## Verification

The Engine source compiles independently of external npm packages, and runtime smoke tests cover travel, knowledge, training and the shared combat simulator. Full Svelte/Vitest/Playwright execution requires the dependencies to be installed in a network-enabled environment.

## Architecture

`src/lib/core` → shared contracts and game service  
`src/lib/engine` → deterministic gameplay rules  
`src/lib/ai` → intent/parser/narrator adapters  
`src/lib/db` → PostgreSQL/Drizzle persistence  
`src/lib/memory` → structured + vector retrieval  
`src/routes/api` → server endpoints  
`src/routes/+page.svelte` → mobile player UI
