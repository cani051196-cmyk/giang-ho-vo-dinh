# GIANG HỒ VÔ ĐỊNH
## MASTER PLAN — FINAL LOCKED v5.0
### AI Developer Handoff Specification

**Trạng thái:** LOCKED FOR DEVELOPMENT
**Mục tiêu:** Một AI coding agent có thể nhận tài liệu này, tạo repository, xây toàn bộ game, chạy test, sửa lỗi, triển khai và tiếp tục mở rộng game mà người chơi không cần trực tiếp viết code.
**Vai trò con người:** Product Owner / Player / Tester. Không yêu cầu người chơi biết lập trình.
**Vai trò AI Developer:** Architect + Programmer + QA + DevOps + Technical Writer.

---

# 0. MỆNH LỆNH CHO AI PHÁT TRIỂN

Tài liệu này là product specification và technical contract của GIANG HỒ VÔ ĐỊNH.

AI Developer phải:

1. Đọc toàn bộ tài liệu trước khi code.
2. Tạo repository và cấu trúc dự án theo tài liệu.
3. Không hỏi lại những quyết định đã được LOCKED.
4. Không tự ý thay đổi các invariant.
5. Có quyền chọn chi tiết implementation chưa được nêu, miễn không phá contract.
6. Khi một yêu cầu mới của Product Owner làm thay đổi một LOCKED DECISION, AI phải phát hiện xung đột, viết Change Proposal bằng ngôn ngữ dễ hiểu, sau khi Product Owner chấp thuận mới thay đổi kiến trúc.
7. Mọi thay đổi phải kèm code + test + documentation + changelog + migration nếu cần.
8. Không giao việc coding cho Product Owner.
9. Product Owner chỉ mô tả điều muốn thay đổi bằng ngôn ngữ tự nhiên và kiểm thử game.
10. Không gọi một module là hoàn thành nếu chưa đạt Definition of Done của module đó.

---

# 1. TẦM NHÌN SẢN PHẨM

GIANG HỒ VÔ ĐỊNH là một single-player wuxia open-world text RPG có Simulation Engine và AI Narrative Layer.

Người chơi tạo một nhân vật và sống trong một thế giới giang hồ có:

- NPC có mục tiêu, trí nhớ và quan hệ.
- Môn phái, bang hội, gia tộc, thương hội, triều đình và tổ chức bí mật.
- Võ công, nội công, chiêu thức, trang bị và thương tích.
- Thời gian thực trong game.
- Quest có thể thành công, thất bại, biến đổi hoặc tự tiến triển.
- Sự kiện thế giới.
- Danh tiếng, tin đồn, thông tin và bí mật.
- Kinh tế cơ bản.
- Người chơi có thể thắng, thua, bỏ chạy, bị bắt hoặc chết.
- Thế giới tiếp tục vận động dù người chơi không can thiệp.

Trải nghiệm chính:

PLAYER CHOOSES → GAME UNDERSTANDS → ENGINE RESOLVES → WORLD CHANGES → UI FEEDBACK → AI NARRATES → PLAYER CHOOSES AGAIN.

---

# 2. BẢN CHẤT CỦA GAME

Game không phải chatbot.

Game không phải visual novel tuyến tính.

Game không phải text adventure chỉ có lựa chọn A/B/C.

Game là một RPG thật với AI làm:

- natural-language interpreter;
- NPC dialogue actor;
- narrator;
- summarizer;
- presentation layer.

Game Engine làm:

- gameplay rules;
- calculations;
- state transitions;
- combat;
- simulation;
- validation.

Database làm:

- canonical truth.

---

# 3. AUTHORITY HIERARCHY

## LOCKED

**DATABASE > GAME ENGINE > AI > UI**

UI không phải nguồn sự thật.
AI không phải nguồn sự thật.
Game Engine là nơi quyết định gameplay.
Database là nơi lưu state đã được xác nhận.

AI không được:

- cấp item;
- tăng stat;
- giảm HP;
- hoàn thành quest;
- giết NPC;
- hồi sinh NPC;
- thay đổi realm;
- phát minh gameplay mechanic;
- tự ghi state vào DB.

---

# 4. MOBILE-FIRST

Nền tảng chính là Web App/PWA.

Phải chơi tốt trên:

- Android;
- iPhone;
- tablet;
- desktop.

Thiết kế ưu tiên màn hình nhỏ.

Các hành động quan trọng tối đa vài lần chạm.

Natural Language luôn có ô nhập nhanh.
Quick Actions luôn có khi thích hợp.

Không xây UI phụ thuộc hover.
Không dùng interaction chỉ có thể làm bằng chuột.

---

# 5. TECH STACK LOCKED

## Frontend / Application

- SvelteKit
- Svelte
- TypeScript
- PWA
- CSS responsive + native browser APIs

## Server

- SvelteKit server layer trong giai đoạn đầu
- Node.js runtime
- REST/JSON APIs cho command/query
- Server-Sent Events hoặc WebSocket khi streaming/realtime cần thiết

## Database

- PostgreSQL
- Drizzle ORM

## Client local persistence

- IndexedDB
- Dexie

## Vector search

- pgvector trong chính PostgreSQL

Không sử dụng một vector database riêng trong giai đoạn đầu.

## AI

- Vercel AI SDK làm abstraction layer
- Provider adapter interface
- Zod runtime validation
- JSON Schema làm wire contract

## Testing

- Unit tests
- Integration tests
- API tests
- Browser/E2E tests
- Simulation tests
- Regression suite

## Version control

- Git
- Mọi thay đổi phải có commit rõ ràng

## Deployment contract

Application phải có thể chạy:

- local development;
- staging;
- production.

Dependency versions không được hard-code trong Master Plan. AI phải chọn phiên bản stable/LTS phù hợp tại thời điểm triển khai, ghi trong lockfile và không tự ý nâng major version.

---

# 6. KIẾN TRÚC REPOSITORY

```text
PROJECT/
├── MASTER_PLAN.md
├── PROJECT_STATE.md
├── DECISIONS.md
├── CHANGELOG.md
├── README.md
├── package.json
├── lockfile
├── drizzle.config.ts
├── svelte.config.js
├── vite.config.ts
│
├── src/
│   ├── routes/
│   └── lib/
│       ├── core/
│       ├── engine/
│       ├── world/
│       ├── player/
│       ├── npc/
│       ├── combat/
│       ├── martial-arts/
│       ├── items/
│       ├── quests/
│       ├── factions/
│       ├── economy/
│       ├── memory/
│       ├── ai/
│       ├── save/
│       ├── events/
│       ├── validation/
│       ├── db/
│       └── ui/
│
├── schemas/
├── prompts/
├── seeds/
├── migrations/
└── tests/
```

---

# 7. DOMAIN ARCHITECTURE

Các domain chính:

```text
Core
World
Player
NPC
Factions
Relationships
Reputation
Knowledge
Items
Martial Arts
Combat
Progression
Quest
Events
Economy
Memory
AI
Save
UI
```

Các domain giao tiếp qua typed contracts.

Không cho domain phụ thuộc ngược trực tiếp vào UI.

Combat không biết UI.
UI không tự tính combat.
AI không gọi DB trực tiếp.

---

# 8. WORLD STATE

Canonical WorldState gồm:

```text
world_id
world_time
calendar
regions
locations
npcs
factions
relationships
reputations
knowledge
rumors
quests
events
items
market_state
weather_state
global_flags
```

Mỗi state change phải có source/cause.

World state không được giữ trong chat history.

---

# 9. EVENT LOG

Mọi thay đổi quan trọng ghi:

```text
event_id
timestamp
actor_id
action_type
target_id
location_id
cause
before
change
after
visibility
```

Event log là immutable audit trail ở mức logic.

---

# 10. TIME SYSTEM — LOCKED

Đơn vị thời gian:

**giây → phút → giờ → ngày → tháng → năm**.

Gameplay không cần mô phỏng từng giây toàn thế giới.

Time advances bằng Action Duration hoặc Time Jump.

Ví dụ mặc định:

```text
Ăn: 10 phút
Nói chuyện: 5–60 phút
Quan sát: 5–30 phút
Luyện công: 1–8 giờ
Ngủ: 6–10 giờ
Đi đường: tính theo travel route
Chiến đấu: 1–10 phút
Chữa thương: nhiều giờ/ngày tùy thương tích
```

Các giá trị là base configuration trong database, không hard-code vào UI.

---

# 11. WORLD TICK — LOCKED

Không simulate từng frame.

World update là event-driven + time-jump.

Khi time advances từ T1 đến T2:

```text
resolve scheduled NPC activity
resolve eligible events
advance quests
advance faction activity
advance economy
advance weather
update temporary statuses
update memory timers
```

Chỉ mô phỏng đủ để state sau T2 đúng.

---

# 12. LOCATION

Location có:

```text
id
name
region_id
tags
connections
base_travel_time
danger_level
factions
resources
services
population
```

Travel time phụ thuộc:

```text
base distance
+ terrain modifier
+ weather modifier
+ route modifier
+ movement capability
+ injuries/status
+ transport
```

Không dùng level scaling theo player.

---

# 13. WEATHER — MVP LOCKED

Các trạng thái:

```text
CLEAR
RAIN
FOG
STORM
SNOW
```

Mỗi trạng thái chỉ có modifier gameplay nhỏ.

Weather không được trở thành subsystem khí tượng phức tạp ở MVP.

---

# 14. PLAYER CHARACTER

8 attributes cố định:

1. Thể chất
2. Lực lượng
3. Thân pháp
4. Nội lực
5. Căn cơ
6. Ngộ tính
7. Tâm cảnh
8. Cảm giác

Không thêm attribute thứ 9 nếu không có thay đổi kiến trúc được phê duyệt.

---

# 15. ATTRIBUTE MEANING

## Thể chất
HP, endurance, recovery, injury tolerance.

## Lực lượng
Physical force, breaking defense, strength scaling.

## Thân pháp
Speed, evasion, chase, escape.

## Nội lực
Qi capacity/control and internal-art scaling.

## Căn cơ
Long-term potential, foundation, breakthrough tolerance.

## Ngộ tính
Learning, comprehension, mastery growth.

## Tâm cảnh
Mental stability, resistance, internal deviation control.

## Cảm giác
Perception, ambush detection, reading combat cues.

---

# 16. COMBAT CAPABILITY VECTOR

Không tồn tại một Power Score duy nhất.

```text
Attack
Defense
Mobility
Control
Perception
Endurance
Recovery
```

Các Capability này được Engine tính động từ attributes + realm + martial arts + equipment + state + context.

---

# 17. REALM — LOCKED STRUCTURE

```text
Phàm Nhân
Luyện Thể
Luyện Khí
Thông Mạch
Ngưng Khí
Tiểu Thành
Đại Thành
Tông Sư
Đại Tông Sư
Tuyệt Đỉnh
```

Realm ảnh hưởng:

- baseline capability;
- Qi ceiling;
- requirements;
- breakthrough;
- access to techniques.

Realm không tự động quyết định thắng thua.

---

# 18. QI SYSTEM — LOCKED

Qi gồm:

```text
capacity
current
quality
purity
control
nature
```

Nature gồm các tag cơ bản:

```text
CANG
NHU
HAN
NHIET
DOC
HO_THE
TA_LUC
XUYEN_THAU
```

Một technique có thể scale với nhiều thành phần Qi.

---

# 19. MERIDIAN SYSTEM — MVP LOCKED

MVP chỉ dùng:

```text
health
capacity_modifier
flow_modifier
damage
```

Meridian damage tác động đến:

- Qi flow;
- training safety;
- technique availability trong trường hợp nặng.

Không mô phỏng hàng nghìn huyệt ở MVP.

Schema phải mở rộng được sau này.

---

# 20. PROGRESSION

Progression đến từ:

```text
training
martial_art_mastery
insight
Qi development
meridian development
realm breakthrough
equipment
experience
```

Không có level grind bắt buộc.

---

# 21. MASTERY

Mỗi Martial Art và Technique có mastery.

Mastery tăng thông qua:

- practice;
- successful usage;
- instruction;
- insight;
- appropriate training.

Mastery có diminishing return ở mức cao.

Mastery phải có ceiling theo quality/realm/insight.

---

# 22. BREAKTHROUGH — LOCKED MODEL

Breakthrough kiểm tra:

```text
foundation
Qi
meridian_health
comprehension
mental_state
manual_requirements
training_time
conditions
risk
```

Kết quả:

```text
SUCCESS
PARTIAL
FAILURE
BACKLASH
```

Breakthrough không cần XP threshold duy nhất.

---

# 23. MARTIAL ART DATA MODEL

```text
id
name
type
style
quality
origin
realm_requirement
attribute_scaling
qi_requirements
mastery
passives
technique_ids
compatibility
synergy_tags
conflict_tags
counter_profile
requirements
```

Type có thể gồm:

```text
INTERNAL
SWORD
SABER
SPEAR
STAFF
PALM
FIST
MOVEMENT
HIDDEN_WEAPON
POISON
DEFENSE
CONTROL
```

Không hard-code từng martial art vào combat engine.

---

# 24. TECHNIQUE

```text
id
martial_art_id
name
order
base_power
scaling
qi_cost
stamina_cost
cooldown
accuracy
speed
range
targeting
effects
counter_profile
injury_profile
risk
requirements
```

Technique phải mô tả rõ mục đích gameplay.

---

# 25. COMBAT ACTION TYPES

```text
ATTACK
DEFEND
DODGE
COUNTER
FEINT
FEINT_ATTACK
MOVE
USE_SKILL
USE_ITEM
FLEE
SURRENDER
TALK
OBSERVE
```

Các action khác được xem xét như extension, không tạo riêng trong Engine nếu có thể map vào action hiện hữu.

---

# 26. COMBAT PIPELINE — LOCKED

```text
RAW ATTRIBUTES
→ REALM
→ CAPABILITY
→ QI
→ MARTIAL ART
→ MASTERY
→ TECHNIQUE
→ POSITION
→ TIMING
→ INFORMATION
→ ATTACK
→ DEFENSE
→ COUNTER
→ RESULT
→ DAMAGE
→ STATUS
→ INJURY
→ OUTCOME
```

---

# 27. COMBAT OUTCOME

```text
CRITICAL_SUCCESS
SUCCESS
ADVANTAGE
NEUTRAL
DISADVANTAGE
FAILURE
CRITICAL_FAILURE
```

Không public một công thức duy nhất kiểu "power x random".

Engine dùng nhiều factor có trọng số.

---

# 28. COMBAT RESOLUTION MODEL

Base success probability được tạo từ:

```text
attacker_action_score
-
defender_response_score
+
context_modifier
```

Trong đó:

```text
attacker_action_score = capability + technique scaling + mastery + timing + information + position

defender_response_score = defense/mobility/control + relevant counter + perception + timing + information
```

Các factor phải nằm trong một config/versioned formula để balance mà không sửa code.

Randomness chỉ tạo độ dao động, không đảo ngược logic thường xuyên.

---

# 29. DAMAGE

Damage phụ thuộc:

```text
base power
+ offensive scaling
+ technique multiplier
+ Qi quality contribution
+ mastery
+ counter modifier
+ armor/defense
+ injury/state
+ critical modifier
```

Damage có thể là:

- physical;
- internal;
- poison;
- special.

Combat engine phải hỗ trợ nhiều damage channel nhưng MVP chỉ cần channel cần thiết cho content hiện tại.

---

# 30. INJURY

Injury là state thật.

MVP:

```text
severity
body_part
combat_modifier
recovery_time
```

Body part cơ bản:

```text
HEAD
TORSO
LEFT_ARM
RIGHT_ARM
LEFT_LEG
RIGHT_LEG
```

Severity:

```text
MINOR
MODERATE
SEVERE
CRITICAL
```

---

# 31. DEATH / FAILURE

Failure outcomes:

```text
WIN
SURVIVE
FAILURE
CAPTURE
DEATH
```

Death chỉ xảy ra khi Engine xác định điều kiện tử vong đã đạt.

Không có protagonist immunity.

Không được giảm sức mạnh NPC chỉ để bảo vệ player.

---

# 32. ESCAPE

Escape dựa trên:

```text
mobility
injury
terrain
distance
opponent mobility
opponent perception
surprise
```

Không phải nút "auto escape".

---

# 33. COUNTER SYSTEM

Không dùng vòng khắc chế cứng.

Counter dựa trên:

- style;
- range;
- speed;
- Qi nature;
- defense interaction;
- terrain;
- status;
- information;
- timing;
- position;
- injury.

---

# 34. ITEM SYSTEM

Item categories:

```text
WEAPON
ARMOR
MEDICINE
MATERIAL
MANUAL
QUEST_ITEM
SPECIAL
NARRATIVE_OBJECT
```

Mỗi item có identity duy nhất khi cần.

Unique item tồn tại thật trong world state.

---

# 35. PROCEDURAL ITEM GENERATION

```text
Template
+
Quality
+
Rarity
+
Region
+
Faction
+
Modifiers
```

AI không quyết định stat.

---

# 36. CONTENT TIERS

## CANON
Nội dung độc nhất và cốt lõi.

## HANDCRAFTED
NPC, quest, locations, martial arts quan trọng.

## PROCEDURAL
NPC phụ, item thường, encounter, market content.

## AI-NARRATIVE
Mô tả, thoại, atmosphere.

---

# 37. NPC SYSTEM

NPC data:

```text
id
identity
personality
goals
fears
secrets
faction_id
location_id
health
martial_arts
equipment
resources
knowledge
memory
relationships
reputation
schedule
status
```

NPC không cần LLM để quyết định mọi hành động.

---

# 38. NPC DECISION MODEL

Engine chấm các action ứng viên theo:

```text
goal relevance
need/urgency
risk
relationship
knowledge
faction interest
location feasibility
time
resources
```

Chọn action có utility cao nhất trong giới hạn rule.

LLM chỉ được dùng ở layer diễn giải hoặc những decision scene đặc biệt đã được Engine cho phép.

---

# 39. NPC SCHEDULE

Schedule là ưu tiên mềm, không phải script chết.

Ví dụ:

```text
08:00 training
12:00 work
18:00 social
22:00 rest
```

World event có thể override.

---

# 40. RELATIONSHIP

Các trục:

```text
trust
respect
fear
hatred
debt
affection
suspicion
```

Không có một friendship score duy nhất.

---

# 41. REPUTATION

Các tầng:

```text
GLOBAL
REGIONAL
FACTION
PERSONAL
```

Reputation thay đổi từ các event đã xác nhận, không từ lời kể của AI.

---

# 42. KNOWLEDGE

Ba tầng:

```text
WORLD_TRUTH
NPC_KNOWLEDGE
PLAYER_KNOWLEDGE
```

Mỗi knowledge record có:

```text
subject
claim
confidence
source
timestamp
visibility
```

---

# 43. RUMOR

Rumor có:

```text
content_claim
truth_source
distortion_level
confidence
origin_location
origin_actor
spread_rate
```

Rumor có thể sai nhưng tạo hậu quả thật.

---

# 44. QUEST SYSTEM

Quest là state machine.

```text
LOCKED
AVAILABLE
ACTIVE
PROGRESSING
COMPLETED
FAILED
ABANDONED
EXPIRED
TRANSFORMED
```

Quest có:

```text
objectives
conditions
participants
rewards
fail_conditions
deadlines
consequences
branches
```

Quest không đứng yên khi player rời khu vực.

---

# 45. EVENT SYSTEM

Event definition:

```text
id
trigger
conditions
participants
priority
cooldown
outcomes
consequences
visibility
```

Event engine chọn event hợp lệ.

AI chỉ mô tả.

---

# 46. ECONOMY — MVP

Economy dùng:

```text
Supply
Demand
Base Price
Location
Faction
```

Giá có floor/ceiling để tránh phá kinh tế.

Đồng tiền dùng cho:

- food;
- lodging;
- medicine;
- travel;
- equipment;
- information;
- services;
- trade.

---

# 47. PLAYER AGENCY

Người chơi có thể:

- làm quest;
- bỏ quest;
- không nhận quest;
- gia nhập hoặc từ chối faction;
- luyện võ;
- buôn bán;
- điều tra;
- đánh nhau;
- chạy trốn;
- kết giao;
- phản bội;
- giết NPC;
- cứu NPC;
- lang thang.

Không có tuyến bắt buộc để xem hết game.

---

# 48. FAST ACTION PATH

Không gọi AI cho:

- xem character;
- xem inventory;
- equip;
- use known item;
- move theo route đã chọn;
- basic combat action;
- known technique;
- save/load.

---

# 49. NATURAL LANGUAGE PATH

```text
Input
→ Preprocess
→ Fast Intent Parser
→ ActionRequest
→ Engine
→ UI Result
→ Narration Context
→ Narrator
```

Parser chỉ hiểu intent.

---

# 50. INTENT STATUS

```text
EXACT
PARTIAL
IMPLIED
AMBIGUOUS
IMPOSSIBLE
UNKNOWN
```

Không dùng VALID/INVALID đơn thuần.

---

# 51. INTENT JSON CONTRACT

```json
{
  "schema_version": "1.0",
  "action_type": "FEINT_ATTACK",
  "target_id": "npc_beggar_01",
  "parameters": {
    "body_part": "knee",
    "force_level": "medium"
  },
  "confidence": 0.95
}
```

Strict JSON.
No prose.
No markdown.

---

# 52. ACTION REQUEST CONTRACT

```json
{
  "schema_version": "1.0",
  "action_id": "act_123",
  "actor_id": "player_001",
  "action_type": "FEINT_ATTACK",
  "target_id": "npc_beggar_01",
  "parameters": {
    "body_part": "knee"
  },
  "source": "NATURAL_LANGUAGE"
}
```

Schema phải có `additionalProperties: false` ở mức protocol envelope.

---

# 53. ENGINE RESULT CONTRACT

```json
{
  "schema_version": "1.0",
  "action_id": "act_123",
  "status": "ACCEPTED",
  "outcome": "SUCCESS",
  "time_elapsed_seconds": 20,
  "state_changes": [],
  "events": [],
  "narration_hints": []
}
```

`state_changes` là record về những gì Engine đã xác nhận.

---

# 54. NARRATION BOUNDARY

Engine tạo `NarrationContext`.

Narrator chỉ nhận:

```text
current scene
player-visible engine result
player knowledge
relevant NPC knowledge
relevant memory
style
narration level
```

Không bao giờ gửi raw WorldState cho Narrator.

---

# 55. NARRATOR CONTRACT

Narrator được phép:

- mô tả;
- hội thoại;
- cảm xúc;
- atmosphere;
- diễn đạt hậu quả đã xác nhận.

Narrator không được:

- đổi damage;
- tạo item;
- thay đổi realm;
- tạo NPC;
- giết/hồi sinh NPC;
- hoàn thành quest;
- tiết lộ hidden information.

---

# 56. PROMPT INTENT PARSER — LOCKED CORE

```text
Bạn là INTENT PARSER của Giang Hồ Vô Định.

Nhiệm vụ duy nhất: chuyển ngôn ngữ tự nhiên của player thành structured intent.

Không tính damage.
Không quyết định thắng thua.
Không tạo item.
Không tạo võ công.
Không sửa world.
Không tự suy ra capability.

Nếu hiểu một phần, trả intent gần nhất.
Nếu có thể suy luận an toàn, không hỏi lại.
Nếu không thể xác định, dùng UNKNOWN.
Nếu action rõ nhưng vượt capability, vẫn biểu diễn intent; Engine sẽ quyết định IMPOSSIBLE.

Chỉ trả strict JSON theo IntentParserOutput v1.0.
Không markdown.
Không giải thích.
```

---

# 57. PROMPT NARRATOR — LOCKED CORE

```text
Bạn là NARRATOR của Giang Hồ Vô Định.

Engine Result là nguồn sự thật tuyệt đối.
Bạn chỉ được kể những gì Engine đã xác nhận và Player được phép biết.

Không tự tạo gameplay state.
Không tự tạo damage, item, skill, realm, death, quest result.
Không tiết lộ hidden information.

Ưu tiên:
1. Đúng Engine Result.
2. Đúng Player Knowledge.
3. Đúng personality.
4. Dễ đọc trên mobile.
5. Văn phong võ hiệp nguyên bản.

Có thể lấy cảm hứng từ không khí wuxia kinh điển nhưng không sao chép nhân vật/cốt truyện/văn bản có bản quyền.
```

---

# 58. AI ROUTING

## Tier 0 — No AI
Deterministic actions.

## Tier 1 — Fast AI
Intent parser, short NPC, short narration.

## Tier 2 — Normal AI
Longer dialogue, investigation, negotiation.

## Tier 3 — Strong AI
Major NPC scenes, conspiracy, cinematic duel.

AI Router chọn model theo:

```text
task
importance
latency_budget
cost_budget
player_setting
provider_health
```

---

# 59. AI FALLBACK

Nếu AI lỗi:

```text
Primary model
→ fallback model
→ template narration
→ no narration but gameplay continues
```

AI outage không được làm mất save hoặc gameplay state.

---

# 60. LATENCY CONTRACT

Mỗi action có:

```text
acknowledgement latency
engine latency
narration latency
```

UI không chờ narration mới cập nhật state.

---

# 61. OPTIMISTIC UI — RULE

UI có thể hiển thị:

- action acknowledgement;
- animation;
- pending status.

UI không được hiển thị một gameplay outcome chưa được Engine xác nhận như thể đã chắc chắn xảy ra.

Sau Engine Result:

```text
state update
→ visual event
→ narration stream
```

---

# 62. STREAMING

Narration có thể stream qua SSE/WebSocket.

Gameplay resolution phải là atomic.

Streaming không sửa state.

---

# 63. MEMORY ARCHITECTURE

```text
L0 Current State
L1 Short-term Memory
L2 Structured Long-term Facts
L3 Episodic Memory
```

---

# 64. CURRENT STATE MEMORY

Direct lookup:

```text
location
time
HP
Qi
combat state
current NPC
current quest
```

Không vector search.

---

# 65. SHORT-TERM MEMORY

Mặc định 3–5 lượt dialogue gần nhất.

Mục tiêu là continuity.

---

# 66. STRUCTURED MEMORY

Ví dụ:

```text
killed_brother = true
debt_amount = 500
saved_my_life = true
promised_help = true
```

Đây là source ưu tiên hơn vector memory.

---

# 67. EPISODIC MEMORY

Memory có:

```text
memory_id
subject
participants
content
timestamp
importance
confidence
location
tags
embedding
```

---

# 68. MEMORY RETRIEVAL

Thứ tự:

```text
Current State
→ Structured Facts
→ tag/keyword retrieval
→ vector search
```

Mặc định chỉ lấy 2–5 episodic memories.

---

# 69. MEMORY CONSOLIDATION

Có thể chạy khi:

- kết thúc scene;
- chuyển cảnh;
- ngủ;
- autosave.

Worker tóm tắt event cũ.

Summary luôn là derived data.

---

# 70. MEMORY PRIORITY

```text
CRITICAL
HIGH
MEDIUM
LOW
```

Sự kiện phá vỡ quan hệ hoặc lịch sử không được tự động quên vì decay.

---

# 71. NPC MEMORY

NPC có memory riêng.

Player không tự động có NPC memory.

NPC không tự động biết World Truth.

---

# 72. VISUAL DESIGN

Game text-first nhưng không text-only.

UI có:

- bars;
- icons;
- cards;
- effects;
- micro-animation;
- sound;
- background art nếu có.

Visual chỉ phản ánh state.

---

# 73. CORE UI

Màn hình chính gồm:

```text
Time / Location
Scene
Nearby NPC
Important status
Quick Actions
Natural Language input
Navigation
```

---

# 74. COMBAT UI

Luôn hiển thị:

```text
Player HP
Player Qi
Player status
Opponent visible information
Quick actions
Known techniques
Combat log
```

Hidden information chỉ hiển thị theo Player Knowledge.

---

# 75. AUDIO

Engine emit semantic sound events.

Client map event → SFX.

Ví dụ:

```text
SWORD_DRAW
IMPACT
CRITICAL
BLEEDING
RARE_ITEM
QUEST_UPDATE
DEATH
RAIN
```

---

# 76. NPC DETAIL UI

Hiển thị:

- known identity;
- known relationship;
- known information;
- known martial arts;
- recent relevant memories.

Không leak hidden truth.

---

# 77. SAVE SYSTEM

Save gồm:

```text
World Snapshot
Player State
NPC State
Faction State
Quest State
Event State
Relationship State
Knowledge State
Inventory
Martial Arts
Time
Event Log pointer/version
```

Save phải transactional.

---

# 78. SAVE INTEGRITY

Sau save/load:

```text
state must be equivalent
```

Không được mất:

- item;
- injury;
- time;
- NPC death;
- quest progress;
- relationship;
- reputation;
- knowledge.

---

# 79. WORLD PERSISTENCE

Nếu một unique item được lấy:

owner đổi.

Nếu NPC chết:

NPC state đổi.

Nếu quest fail:

quest state đổi.

Nếu player rời game:

world vẫn ở state cuối cùng và tiếp tục simulation theo time jump khi quay lại.

---

# 80. ECONOMIC SAFETY

Economy phải có floor/ceiling và anti-explosion guards.

Một event không được làm giá thành infinity hoặc âm vô hạn.

Money transactions phải atomic.

---

# 81. SECURITY

Không tin:

- client;
- player input;
- AI output.

Server validation là bắt buộc.

API keys không hard-code vào client public bundle.

AI output phải schema-validate trước khi Engine sử dụng.

---

# 82. ERROR HANDLING

Nếu Parser lỗi:

```text
retry → fallback → UNKNOWN/PARTIAL
```

Nếu Narrator lỗi:

```text
fallback model → template
```

Nếu Memory retrieval lỗi:

```text
structured facts → no episodic memory
```

Nếu provider chết:

gameplay vẫn hoạt động.

---

# 83. AI COST CONTROL

Mặc định:

```text
0 AI càng nhiều càng tốt.
```

Không có quy tắc "mỗi turn bắt buộc 2 LLM calls".

AI narration được coi là optional presentation enhancement.

---

# 84. OBSERVABILITY

Mỗi AI request ghi:

```text
request_id
scene_id
task_type
model
latency_ms
input_tokens
output_tokens
fallback_used
status
```

Engine ghi:

```text
action_id
resolution_ms
state_changes_count
event_count
```

---

# 85. TESTING PYRAMID

```text
Unit Tests
Integration Tests
Contract Tests
Simulation Tests
E2E Tests
Manual Play Tests
```

Không thay Unit Test bằng E2E toàn bộ.

---

# 86. CONTRACT TESTS

Test:

- valid JSON;
- missing field;
- wrong enum;
- wrong type;
- extra field;
- invalid schema version;
- malformed AI output.

---

# 87. AI SAFETY TESTS

Test:

- hallucinated item;
- hallucinated damage;
- fake NPC death;
- hidden identity leak;
- wrong target;
- troll command;
- impossible command;
- ambiguous command;
- prompt injection in game text.

---

# 88. COMBAT REGRESSION SUITE

Ít nhất:

```text
Equal Fight
Strength Difference
Speed Difference
Qi Difference
Mastery Difference
Realm +1
Realm +3
Counter
Low Qi
Injury
Terrain
Ambush
Knowledge
Escape
No Infinite Combat
No Single-Stat Domination
```

---

# 89. WORLD REGRESSION

Test:

```text
NPC death
NPC movement
Faction reaction
Quest failure
Quest expiry
Rumor spread
Time jump
Unique item transfer
Relationship change
Reputation change
Save/load
```

---

# 90. PERFORMANCE TARGET

Mục tiêu UX:

- local UI acknowledgement gần như tức thời;
- deterministic resolution nhanh;
- không block UI bởi AI narration;
- memory retrieval ngắn và bounded;
- không simulate toàn thế giới từng frame.

Metrics phải được thu thập thay vì chỉ đo cảm tính.

---

# 91. VERTICAL SLICE

Phiên bản đầu tiên:

```text
1 Region
3 Locations
10–20 NPC
20–30 Martial Arts
50 Items
5–10 Quests
5 Events
```

Nhưng phải có end-to-end:

```text
Character creation
Travel
NPC
Dialogue
Natural Language
Quick Action
Martial Art
Technique
Combat
Injury
Trade
Relationship
Reputation
Time
Memory
Event
Quest
Save/Load
AI fallback
Template narration
```

---

# 92. PHASE 0

Foundation phải hoàn thành:

1. Repository.
2. SvelteKit app.
3. TypeScript.
4. PostgreSQL.
5. Drizzle schema/migration.
6. WorldState.
7. PlayerState.
8. Time.
9. Location.
10. ActionRequest.
11. EngineResult.
12. Validation.
13. Save/load.
14. Basic UI shell.
15. Test infrastructure.

---

# 93. PHASE 1

Vertical Slice hoàn chỉnh.

Không mở rộng world trước khi slice chơi được.

---

# 94. PHASE 2

Mở rộng:

- factions;
- relationships;
- reputation;
- knowledge;
- quests;
- events;
- economy.

---

# 95. PHASE 3

Mở rộng:

- meridian depth;
- advanced injury;
- breakthrough depth;
- advanced progression;
- rumor;
- advanced NPC simulation.

---

# 96. PHASE 4

Mở rộng:

- faction politics;
- war;
- advanced economy;
- large world events;
- large-scale NPC scheduling.

---

# 97. PHASE 5

Mở rộng content:

- regions;
- cities;
- NPCs;
- martial arts;
- items;
- quests;
- factions;
- locations;
- lore.

---

# 98. DEFINITION OF DONE

Module chỉ DONE khi:

```text
Schema
Implementation
Validation
Tests
UI/API
Save/Load
Performance check
Documentation
```

AI phải cập nhật:

- PROJECT_STATE.md;
- CHANGELOG.md.

---

# 99. CHANGE MANAGEMENT

Khi Product Owner nói:

> "Tôi muốn kiếm pháp này có thêm một chiêu phản công."

AI phải:

1. hiểu yêu cầu;
2. xác định module ảnh hưởng;
3. kiểm tra invariant;
4. cập nhật design data;
5. code;
6. test;
7. migrate nếu cần;
8. cập nhật docs;
9. chạy regression;
10. trả lời bằng mô tả thay đổi và cách test.

Product Owner không sửa code.

---

# 100. CHANGE REQUEST NATURAL LANGUAGE

Người chơi có thể mô tả rất tự nhiên:

> "Tôi muốn NPC này khó tin người khác hơn."

AI developer phải chuyển thành:

```text
Product Intent
→ Design Change
→ Data/Rule Change
→ Implementation
→ Tests
```

AI không cần Product Owner biết tên file hay class.

---

# 101. CONFLICT POLICY

Nếu yêu cầu mới trái Master Plan:

AI phải nói bằng ngôn ngữ bình thường:

```text
Yêu cầu mới đang xung đột với quyết định X.
Tôi đề xuất thay đổi A vì B.
```

Không âm thầm phá architecture.

Nếu yêu cầu chỉ là content tuning:

AI tự implement.

---

# 102. NO CODE FOR PRODUCT OWNER

Product Owner không cần:

- mở IDE;
- sửa TypeScript;
- sửa SQL;
- chỉnh JSON trực tiếp;
- chạy terminal để sửa game.

Nếu cần cấu hình, AI phải tạo UI/admin/config/data layer phù hợp.

---

# 103. AI DEVELOPMENT LOOP

```text
Read Master Plan
↓
Inspect Project State
↓
Select smallest coherent task
↓
Implement
↓
Run tests
↓
Run app
↓
Fix
↓
Update docs
↓
Commit
↓
Report result
```

Không làm một giant rewrite nếu task không yêu cầu.

---

# 104. PROJECT MEMORY FILES

## MASTER_PLAN.md
Luật và architecture ổn định.

## DECISIONS.md
Những quyết định cụ thể đã khóa.

## PROJECT_STATE.md
Trạng thái hiện tại.

## CHANGELOG.md
Lịch sử thay đổi.

AI phải đọc ít nhất:

```text
MASTER_PLAN.md
DECISIONS.md
PROJECT_STATE.md
```

trước task lớn.

---

# 105. ADMIN / DEBUG MODE

Game phải có developer-only debug mode.

Có thể xem:

- raw WorldState;
- event log;
- NPC state;
- combat calculations;
- AI calls;
- memory retrieval;
- quest state.

Debug UI không xuất hiện trong player mode.

---

# 106. CONTENT AUTHORING

AI developer phải tạo format dễ mở rộng:

```text
martial-art data
technique data
item data
npc data
quest data
event data
location data
```

Không hard-code content trong component UI.

---

# 107. DATA VALIDATION

Tất cả content data phải validate khi load/build.

Một item invalid không được khiến toàn game khởi động thất bại nếu không cần thiết; hệ thống phải báo lỗi rõ và cô lập record lỗi.

---

# 108. PROCEDURAL CONTENT RULE

Procedural generator phải deterministic khi có seed.

```text
seed + template + modifiers → content
```

Mục đích:

- reproducible bugs;
- testing;
- save stability.

---

# 109. UNIQUE CONTENT RULE

Unique content có global identity.

Không duplicate nếu schema đánh dấu unique.

---

# 110. COMBAT SIMULATOR

Simulator dùng chính Combat Engine.

Không được viết công thức combat phụ.

Có thể chạy hàng nghìn trận để kiểm tra balance.

Output tối thiểu:

```text
win_rate
average_turns
average_damage
escape_rate
injury_rate
resource_usage
```

Không biến simulator thành game runtime.

---

# 111. BALANCE PHILOSOPHY

Không tối ưu một build duy nhất.

Mục tiêu:

- nhiều archetype khả dụng;
- counters không tuyệt đối;
- realm gap có ý nghĩa;
- knowledge/timing có giá trị;
- resources matter;
- one-stat builds có trade-off.

---

# 112. PLAYER INFORMATION MODEL

Player UI chỉ hiển thị:

```text
Known
Estimated
Unknown
```

Ví dụ:

```text
Realm: ???
Observation: Khí tức rất mạnh
Estimate: Tông Sư trở lên
```

---

# 113. NO ARTIFICIAL WORLD SCALING

Không scale NPC theo player level.

World strength là thuộc tính thực.

---

# 114. NO ARTIFICIAL QUEST RAILS

Quest có thể tự kết thúc ngoài ý muốn player.

Player không phải trung tâm tuyệt đối.

---

# 115. LEGACY

Death/Legacy là Phase 5 feature.

Khi triển khai:

```text
Character death
→ world memory
→ historical record
→ rumors
→ possible descendants/influence
```

Không cần trong MVP.

---

# 116. NON-GOALS

Không làm trong MVP:

- multiplayer;
- PvP;
- real-time action combat;
- voice-first interaction;
- MMO-scale simulation;
- hàng triệu NPC;
- offline full AI guarantee;
- photorealistic 3D world.

---

# 117. FINAL PRODUCT MODEL

Game hoàn chỉnh gồm:

```text
PLAYER EXPERIENCE
├── Character
├── World
├── NPC
├── Martial Arts
├── Combat
├── Items
├── Quest
├── Faction
├── Relationship
├── Reputation
├── Knowledge
├── Economy
├── Memory
├── Events
├── Progression
└── Legacy

TECHNICAL FOUNDATION
├── SvelteKit
├── TypeScript
├── PostgreSQL
├── Drizzle
├── pgvector
├── Dexie
├── Vercel AI SDK
├── Zod
├── JSON Schema
├── Git
└── Test Suite
```

---

# 118. MASTER LOOP

```text
PLAYER SEES STATE
↓
PLAYER CHOOSES
↓
QUICK ACTION / NATURAL LANGUAGE
↓
ACTION REQUEST
↓
ENGINE VALIDATES
↓
ENGINE RESOLVES
↓
DATABASE TRANSACTION
↓
UI UPDATES IMMEDIATELY
↓
WORLD/QUEST/NPC CONSEQUENCES
↓
MEMORY UPDATE
↓
NARRATION CONTEXT
↓
AI NARRATES
↓
PLAYER LEARNS
↓
NEXT CHOICE
```

---

# 119. FINAL ARCHITECTURAL INVARIANTS

1. Database > Engine > AI > UI.
2. Gameplay must not depend on AI.
3. Natural Language và Quick Action dùng cùng Engine.
4. Narrator không được sửa state.
5. Player Knowledge khác World Truth.
6. NPC Knowledge khác Player Knowledge.
7. Time luôn tiến theo action/time jump.
8. World không scale giả theo player.
9. NPC không phải chatbot chạy vô hạn.
10. Memory không phải toàn bộ chat history.
11. Vector DB chỉ là retrieval layer.
12. Unique item phải có canonical identity.
13. Save phải transactional.
14. AI failure không được phá gameplay.
15. Mọi state change quan trọng phải audit được.
16. Mọi module hoàn thành phải có test.
17. Product Owner không cần sửa code.
18. Feature mới chỉ thêm khi tạo gameplay mới đáng kể.
19. Không âm thầm phá locked decision.
20. Game phải luôn có một đường Fast Path.

---

# 120. QUY TẮC CHO MỌI AI CODING AGENT SAU NÀY

Khi nhận repository này:

### BƯỚC 1
Đọc MASTER_PLAN.md.

### BƯỚC 2
Đọc DECISIONS.md.

### BƯỚC 3
Đọc PROJECT_STATE.md.

### BƯỚC 4
Kiểm tra code hiện tại có vi phạm invariant không.

### BƯỚC 5
Không sửa kiến trúc lớn chỉ để hoàn thành một task nhỏ.

### BƯỚC 6
Viết test trước hoặc cùng lúc với implementation.

### BƯỚC 7
Chạy test.

### BƯỚC 8
Chạy game.

### BƯỚC 9
Cập nhật docs.

### BƯỚC 10
Cập nhật PROJECT_STATE và CHANGELOG.

---

# 121. QUY TẮC CHO PRODUCT OWNER

Product Owner chỉ cần nói:

> Tôi muốn game làm X.

hoặc:

> NPC này nên có tính cách Y.

hoặc:

> Combat này đang quá chậm.

hoặc:

> Tôi muốn map khu vực này rộng hơn.

AI developer chịu trách nhiệm chuyển mô tả đó thành:

```text
Requirement
→ Design
→ Code
→ Test
→ Build
```

Product Owner không cần viết code.

---

# 122. ACCEPTANCE STANDARD CỦA TOÀN BỘ GAME

Game chỉ được coi là hoàn chỉnh khi một người chơi có thể:

1. tạo nhân vật;
2. khám phá thế giới;
3. nói chuyện bằng natural language;
4. dùng quick actions;
5. học và sử dụng võ công;
6. chiến đấu;
7. chịu thương tích;
8. chạy trốn hoặc bị bắt;
9. kiếm và tiêu tiền;
10. tạo quan hệ;
11. tạo danh tiếng;
12. thu thập thông tin;
13. làm hoặc bỏ quest;
14. chứng kiến world events;
15. quay lại sau nhiều ngày và thấy thế giới thay đổi;
16. save/load;
17. chơi tiếp mà không cần biết code;
18. gặp tình huống AI lỗi mà gameplay vẫn không sập.

---

# 123. ĐỊNH NGHĨA CỦA GAME "HOÀN THIỆN"

Game hoàn thiện không có nghĩa là đã có hàng nghìn thành phố.

Game hoàn thiện nghĩa là:

```text
Architecture ổn định
+
Vertical gameplay loop hoàn chỉnh
+
World simulation nhất quán
+
Combat có chiều sâu
+
NPC có trí nhớ/quan hệ
+
Quest có hậu quả
+
AI bị giới hạn đúng quyền
+
Memory không tràn context
+
UI mobile tốt
+
Save/Load đáng tin
+
Tests bảo vệ hệ thống
+
Content có thể mở rộng
```

Sau đó việc mở rộng chủ yếu là:

**THÊM CONTENT VÀ RULES MỚI VÀO MỘT NỀN TẢNG ĐÃ ỔN ĐỊNH.**

---

# 124. FINAL MISSION

GIANG HỒ VÔ ĐỊNH phải tạo cảm giác:

> "Ta đang sống trong một giang hồ thực sự."

Người chơi có thể hành động tự nhiên.

Engine phải trả lời bằng luật chơi nhất quán.

NPC phải nhớ.

Thế giới phải thay đổi.

AI phải kể chuyện hấp dẫn.

Nhưng không AI nào được quyền phá vỡ sự thật của thế giới.

---

# 125. FINAL FORMULA

```text
DATABASE
= TRUTH

ENGINE
= RULES

SIMULATION
= WORLD

AI
= LANGUAGE + CHARACTER + NARRATION

UI
= EXPERIENCE

PLAYER
= AGENCY
```

Vòng lặp cuối:

```text
ACTION
→ CONSEQUENCE
→ WORLD CHANGE
→ INFORMATION
→ NEW CHOICE
→ ACTION
```

Đây là specification nền tảng cuối cùng của GIANG HỒ VÔ ĐỊNH.
