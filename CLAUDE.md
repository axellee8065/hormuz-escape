# CLAUDE.md — HORMUZ ESCAPE

호르무즈 해협을 돌파하는 HTML5 세로형(9:16) 랭킹 아케이드 게임. 장르: 탑다운 회피 슈터(닷지 + 파워업 + 보스). 목표 플랫폼: 모바일 웹 (TikTrix iframe 임베드 + 직접 접속), 정적 호스팅으로 배포.

---

## 1. Tech stack

| 레이어 | 선택 |
|---|---|
| 렌더링 | Vanilla JS + Canvas 2D (외부 애셋 0개, 전부 프로시저럴) |
| 번들러 | Vite (dev 서버 + `build` → `dist/`) |
| 리더보드 | Supabase (Postgres + PostgREST, RLS로 write 검증) |
| 호스팅 | Railway (정적 `dist/` 서빙) |
| 플랫폼 브릿지 | TikTrix postMessage SDK (옵셔널, iframe 임베드 시 활성) |

---

## 2. 디렉토리 구조

```
.
├── CLAUDE.md                  # 이 파일
├── README.md                  # 사용자 가이드 (배포/셋업)
├── schema.sql                 # Supabase 스키마 (한 번만 실행)
├── package.json               # deps + npm scripts
├── vite.config.js             # Vite 설정 (base, outDir)
├── .env.example               # VITE_SUPABASE_URL/ANON_KEY 템플릿
├── nixpacks.toml              # Railway 빌드/실행 지시
├── index.html                 # shell: canvas + overlays, <script type="module" src="/src/main.js">
├── styles.css                 # 전체 UI (HUD, 오버레이, 보스바, 파워업 필)
└── src/
    ├── main.js                # bootstrap + requestAnimationFrame 루프
    ├── state.js               # state, player, 컬렉션 배열(mines/boats/...)
    ├── config.js              # W, H, COAST_L/R, PLAY_L/R, STAGES 테이블, getStage()
    ├── input.js               # pointer(touch+mouse) + keyboard 래핑
    ├── util.js                # rand, randi, clamp, dist2, roundRect, LS
    ├── entities/
    │   ├── player.js          # 탱커 업데이트 + 피격 판정
    │   ├── mine.js            # 해상 기뢰 (폭발/근접회피)
    │   ├── boat.js            # 초계정 + RPG 변형 (같은 배열 공유)
    │   ├── missile.js         # 해안 발사 호밍 미사일 + 보스 볼리
    │   ├── rpg.js             # RPG 직진 탄
    │   ├── powerup.js         # 3종 보급 컨테이너
    │   ├── boss.js            # FSM: enter → fight → retreat + 3 패턴
    │   ├── telegraph.js       # 보스 함포 조준원 (1.5s lead)
    │   └── particle.js        # 폭발/연기/웨이크/링
    ├── systems/
    │   ├── spawn.js           # 스테이지 기반 스폰 클럭 + 적 생성 함수
    │   ├── collision.js       # (현재 update.js에 인라인 — 추후 분리 훅)
    │   ├── render.js          # drawCoast, drawTanker, drawBoss 등 모든 draw 디스패처
    │   ├── hud.js             # DOM HUD 업데이트 (HP, score, buff pill, boss bar)
    │   ├── fx.js              # addExplosion, addWake, addFloatText
    │   └── audio.js           # Web Audio 프로시저럴 SFX + BGM(normal/boss 2-track) + M 키 뮤트
    ├── net/
    │   ├── supabase.js        # Board 어댑터 (submit/top)
    │   └── tiktrix.js         # postMessage 어댑터 (ready/start/end)
    └── ui/
        └── overlays.js        # menu / stage / over / board / name 오버레이 와이어링
```

각 파일 책임:
- `main.js`: DOM ready → 모듈 import → `requestAnimationFrame(loop)`. `update(dt)` 콜 + `render()` 콜.
- `state.js`: 모든 런타임 가변 상태. 리셋은 `resetRun()`.
- `config.js`: 게임 수치 테이블. **밸런스 변경은 여기서만.**
- `systems/render.js`: canvas draw 분기. 스크롤/쉐이크/비네트는 여기서 적용.
- `systems/hud.js`: `updateHUD()` — DOM id를 읽어 값 설정. CSS 클래스명/id 의존.
- `net/supabase.js`: `Board.submit(row)` / `Board.top(limit)`. URL 파라미터 오버라이드 허용.
- `net/tiktrix.js`: `TikTrix.ready()/start()/end(score, meta)`. iframe 감지.
- `ui/overlays.js`: 버튼 이벤트 바인딩 + 오버레이 열고 닫기. 게임 흐름 진입점 (`startGame`).

---

## 3. 핵심 게임 루프

```
requestAnimationFrame → loop(now)
  dt = min(2.5, (now - lastT) / (1000/60))   // 60fps 기준 정규화
  if (mode in [playing, stageIntro, bossIncoming, bossBattle, victory])
    update(dt)
      ├─ buffs 카운트다운 (shield/speed frames)
      ├─ player steering (input.x / keys → lerp)
      ├─ scroll/distance/score 누적
      ├─ spawn clocks 증가 → 스테이지 rate 초과 시 spawnX()
      ├─ stage advance (stageDist ≥ stage.dist → triggerStageIntro 또는 triggerBoss)
      ├─ updateBoss(dt)  (FSM)
      ├─ 엔티티 업데이트 + 충돌: mines → boats → missiles → rpgs → powerups → telegraphs → particles → floatTexts → warnings
      ├─ shake 감쇠
      └─ updateHUD()   (DOM 업데이트)
  render()
    ├─ shake translate
    ├─ water grad + grid + horizon lines
    ├─ drawCoast (양측 해안선 + 마크)
    ├─ warnings
    ├─ drawBoss (active 시)
    ├─ mines / boats / powerups / telegraphs / missiles / rpgs
    ├─ drawTanker (플레이어)
    ├─ particles / floatTexts
    └─ low-HP edge pulse
```

Mode 전이:
```
menu → (startGame) → playing
playing ⇄ stageIntro (1.4s 카드)
playing → bossIncoming (stage5 dist 도달) → bossBattle (1.8s 뒤)
bossBattle → victory (boss retreats) → showResults(true)
playing|bossBattle → dead (hp<=0) → showResults(false)
playing|bossBattle ⇄ paused
```

---

## 4. 엔티티 목록

| 엔티티 | 역할 |
|---|---|
| **Player** | 고정 위치 탱커. 좌우 조향만. `w=58, h=130`, HP 100 |
| **Mine** | 위→아래 스크롤 기뢰. 접촉 dmg 28, r=18~24 |
| **Boat (일반)** | 양측 끝에서 하강. 접촉 dmg 18 |
| **Boat (RPG)** | 접촉 dmg + `spawnRpgShot(from)` 으로 조준 발사 |
| **CoastMissile** | 해안 측면에서 발사되는 호밍 미사일. 0.8s warning 이후 homing frames=60, dmg 40 |
| **RPG** | Boat(RPG)에서 발사된 직진 탄. dmg 22 |
| **PowerUp(Shield)** | 8초 피격 무시 + 실드 링 (8s) |
| **PowerUp(Speed)** | 조향 1.9배 + 엔진 글로우 색 변경 (10s) |
| **PowerUp(Repair)** | 즉시 HP +30. HP<60/<30 시 등장 가중치 증가 |
| **Boss (IRGC Destroyer)** | 220×280. FSM(enter/fight/retreat). HP대신 OUTRUN 게이지(2800 dist) |
| **Telegraph** | 보스 함포 조준원. 1.5s 후 폭발 (maxR=80, dmg 55) |
| **Particle** | 폭발/연기/웨이크/링/raw fleck. life 기반 fade |

Warnings / FloatTexts / Marks는 시각 이펙트로만 존재 (충돌 없음).

---

## 5. 밸런스 테이블

> **수정 규칙: 이 테이블의 수치는 `src/config.js`에만 존재한다. 다른 파일에서 하드코딩 금지.**

### STAGES (src/config.js)
`dist` 는 scroll 유닛. 시간(초) ≈ `dist / scroll / 60`. 아래 표는 각 스테이지의 목표 지속시간을 역산해 뽑은 값.

| # | name | dist | ≈duration | mineRate | boatRate | missileRate | rpgRate | powerRate | scroll | boss |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | STRAIT ENTRY    |  5760 | 30s | 1.3 | 0   | 0   | 0   | 0.15 | 3.2 | - |
| 2 | PATROL ZONE     |  7560 | 35s | 1.6 | 0.6 | 0   | 0   | 0.20 | 3.6 | - |
| 3 | COASTAL BATTERY |  9600 | 40s | 1.5 | 0.7 | 0.5 | 0   | 0.22 | 4.0 | - |
| 4 | RPG STRIKE      | 11880 | 45s | 1.8 | 0.9 | 0.5 | 0.7 | 0.22 | 4.4 | - |
| 5 | GAUNTLET        | 15000 | 50s | 2.2 | 1.1 | 0.7 | 0.9 | 0.25 | 5.0 | ✅ |
| 6+ | OPEN WATER · k | `(50+5k)·60·scroll` | 55s+ | 2.4+k·0.2 | 1.3+k·0.1 | 0.8+k·0.1 | 1.0+k·0.1 | 0.30 | 5.2+k·0.25 | - |

Rate 단위: 초당 스폰 1회 기준 (프레임당 tick ≥ 60/rate 일 때 스폰).

### 파워업
- Shield: 480 frames (8s)
- Speed: 600 frames (10s), `speedMul=1.9`, `lerpK=0.35`
- Repair: +30 HP 즉시. 가중치 HP<60→2.5, HP<30→4

### 보스 파라미터
- `outrunMax`: 2800 (탈출 기준 거리)
- entry phase: 180 frames, 목표 y=140
- fight: 0.45×scroll/tick 씩 outrun 증가, 1.2×score 승수
- 공격 cadence:
  - volley: **7발** 팬 (spread 0.20, missile vx/vy 3.2, homing 75 frames), interval 130~170 frames, missile dmg 50 (fromBoss)
  - minefield: 4개, interval 110~150 frames
  - deckgun: telegraph 90 frames 후 AoE, interval 90~130 frames, dmg 55
- 보스 미사일 호밍 (systems/collision.js): `fromBoss` 시 steer 0.18, maxSpd 3.8 (일반 미사일은 0.12 / 3.0). 해안 미사일과 구분되는 추적력.
- endgame(>75% outrun): volley 0.40 / deckgun 0.35 / minefield 0.25
- 보스 처치(탈출): +5000 score
- retreat: 200 frames, y 축으로 상승 이탈

### 스코어
- 주행: `scroll × 0.6 × (1 + combo×0.05)` / tick
- 스테이지 클리어: `500 × stage.id`
- 기뢰 통과: 30 (근접회피 80)
- 보트 통과: 60 (근접회피 150)
- 파워업 획득: 200
- 보스 fight 중: `scroll × 1.2` 보너스 / tick
- 보스 처치: 5000

---

## 6. Supabase 스키마 요약

테이블: `public.scores`
- `id` bigserial PK
- `user_id` text, `user_name` text, `score` int, `stage` int, `distance` int, `duration_s` int
- `meta` jsonb, `created_at` timestamptz

인덱스: `(score desc)`, `(user_id)`, `(created_at desc)`

**RLS 정책 요점**:
- SELECT: 공개(`using (true)`). anon 키로 리더보드 읽기 가능.
- INSERT: `with check` 가드 — score ∈ [0, 10M), stage 1~50, distance ≤ 10M, duration ≤ 10h, user_name 1~18자, user_id 1~64자. 범위 밖이면 rejected.
- UPDATE/DELETE: 정책 없음 → 차단.

뷰: `scores_top100`, `scores_best_by_user`, `scores_today` (24h).

anon key 노출돼도 악의적 쓰기는 RLS 가드로 차단. 강화 필요 시 Edge Function HMAC 서명(v2).

---

## 7. 개발 / 빌드 / 배포

### 로컬
```
cp .env.example .env        # VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 채움
npm install
npm run dev                 # http://localhost:5173
```

### 프로덕션 빌드
```
npm run build               # → dist/
npm run preview             # dist/ 로컬 서빙 (검증용)
```

### Railway 배포
- Root: GitHub repo 자체
- Build: `npm run build`
- Start: `npx serve dist -l $PORT`
- Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (빌드 타임 주입)
- `nixpacks.toml` 참조

---

## 8. 필수 환경변수

| Key | 용도 | 예시 |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | 공개 anon 키 (RLS로 보호됨) | `eyJhbGci...` |

URL 파라미터 오버라이드도 지원 (로컬 디버그용):
```
?supabaseUrl=...&supabaseKey=...
```

---

## 9. 디버그 단축키

| Key | 동작 |
|---|---|
| `G` | 즉사 (게임 오버 플로우 테스트). `playing` / `bossBattle` 에서만 작동 |
| `B` | 스테이지 5 끝으로 점프 (보스 트리거 테스트). `playing` 에서만 |
| `M` | 사운드 뮤트 토글 (localStorage 저장, 언제든지) |

---

## 10. Do not touch

다음 항목은 **밸런스 영향** 범주. 별도 PR에서만 수정하며, CLAUDE.md §5 테이블과 동기화할 것:
- `src/config.js` STAGES 배열 모든 수치
- `src/entities/boss.js` outrunMax / phaseTimer / attackTimer 범위
- `src/entities/missile.js` homing frames, vx/vy 상수, dmg
- `src/entities/mine.js` r 범위, dmg
- `src/entities/powerup.js` shield/speed duration, repair amount, HP 가중치
- `src/state.js` player.w/h, maxHp, invFrames

DOM id와 CSS 클래스명은 HUD 업데이트 코드(`systems/hud.js`)가 참조하므로 리팩터링 시에도 **그대로 유지**:
- id: `hpFill, hpText, scoreText, stageText, distText, buffRow, comboBadge, bossHud, bossFill, outrunText, dmgFlash, warnBanner, bossWarn, stageCard, stageNum, stageName, stageDesc, finalScore, finalDist, finalStage, finalRank, goverTitle, goverSub, boardList, bestScore, captainName, nameInput, pauseBtn, txPill, menuOverlay, nameOverlay, stageOverlay, overOverlay, boardOverlay, startBtn, retryBtn, boardBtn, showBoardBtn, closeBoardBtn, nameSaveBtn`
- class: `hud-panel, hp-block, hp-label, hp-bar, hp-fill (.mid/.low), buff-pill (.shield/.speed), boss-hud (.active), stage-card (.boss), overlay (.hidden), btn (.secondary/.danger), board-row (.me), warn-banner (.show), boss-warn (.show)`
