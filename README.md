# HORMUZ ESCAPE

호르무즈 해협을 탈출하는 HTML5 세로형(9:16) 랭킹 게임.
기뢰 · 미사일 · RPG 보트 · 보스 구축함 + 실드/가속/수리 파워업.

- **프론트엔드**: Vite + Vanilla JS + Canvas 2D (외부 자산 0개)
- **리더보드 DB**: Supabase (Postgres + REST 자동)
- **호스팅**: Railway (`npm run build` → `dist/` 정적 서빙)
- **플랫폼 연동**: TikTrix postMessage SDK (옵셔널, 이미 포함)

프로젝트 구조 · 밸런스 테이블 · 엔티티 상세는 [CLAUDE.md](./CLAUDE.md) 참고.

---

## 1. Supabase 셋업 (5분)

1. [supabase.com](https://supabase.com) 에서 새 프로젝트 생성.
2. **SQL Editor** → New query → `schema.sql` 내용 전체 붙여넣고 **Run**.
3. **Settings → API**에서 아래 두 값을 복사해 `.env` 에 저장:
   ```
   cp .env.example .env
   # VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 를 실제 값으로 교체
   ```

### 보안 모델
- 리더보드 **읽기**는 공개 (anon 가능).
- **쓰기**는 RLS policy가 범위 검증 (score ≤ 1천만, stage ≤ 50, 이름 1~18자 등).
- anon key가 노출돼도 스키마상 악의적 쓰기는 policy로 차단됨.
- 필요시 Edge Function에서 서명된 스코어만 받도록 강화 가능 (v2).

### 로컬 테스트
`.env` 편집 없이 URL 파라미터로도 주입 가능:
```
http://localhost:5173/?supabaseUrl=https://xxx.supabase.co&supabaseKey=eyJhb...
```

---

## 2. 로컬 개발

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # dist/ 로 빌드
npm run preview      # 빌드 결과 로컬 서빙 (검증용)
```

---

## 3. Railway 배포

이 레포에는 `nixpacks.toml` 과 `package.json.scripts` 가 준비돼 있어 Railway에 바로 연결하면 됩니다.

### 순서
1. 이 폴더를 GitHub 레포로 푸시.
2. Railway → **New Project** → **Deploy from GitHub repo** 선택.
3. Service → **Variables** 에 추가:
   - `VITE_SUPABASE_URL` = `https://xxxxx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhb...`
4. Deploy 트리거. Railway가 자동으로:
   - `npm ci`
   - `npm run build` → `dist/`
   - `npx serve dist -l $PORT` 로 서빙
5. 생성된 `*.up.railway.app` 도메인으로 접속.

### 왜 환경변수로?
Vite는 `VITE_` 접두어 환경변수를 **빌드 타임**에 번들로 치환합니다. 즉 Railway Variables에 키를 넣으면 그 값이 `dist/assets/*.js` 에 박혀 나옵니다. 키를 바꾸면 재빌드가 필요합니다.

> anon key는 공개돼도 RLS로 보호되므로, Railway variables로 관리하는 것은 "키 로테이션 / staging-prod 분리" 편의 목적입니다.

---

## 4. 파일 구조

```
.
├── CLAUDE.md                 프로젝트 맵 + 밸런스 테이블 (읽어보기)
├── README.md                 (이 파일)
├── schema.sql                Supabase 스키마 (한 번만 실행)
├── package.json              npm scripts + deps
├── vite.config.js            Vite 설정 (base '/', outDir 'dist')
├── nixpacks.toml             Railway 빌드 파이프라인
├── .env.example              VITE_SUPABASE_URL / _KEY 템플릿
├── index.html                shell HTML (canvas + overlays)
├── styles.css                전체 UI 스타일
└── src/
    ├── main.js               bootstrap + requestAnimationFrame 루프
    ├── state.js              state, player, 컬렉션 배열들
    ├── config.js             W, H, COAST, STAGES, getStage
    ├── input.js              pointer + keyboard
    ├── util.js               rand/clamp/dist2/roundRect/LS
    ├── entities/             player/mine/boat/missile/rpg/powerup/telegraph/particle/boss
    ├── systems/              spawn · collision(update tick) · render · hud · fx
    ├── net/                  supabase · tiktrix 어댑터
    └── ui/                   overlays (menu/name/stage/over/board 와이어링)
```

---

## 5. 게임 구성

### 스테이지
| # | 이름 | 추가 위협 |
|---|---|---|
| 1 | Strait Entry    | 기뢰 |
| 2 | Patrol Zone     | + 초계함 (접촉 데미지) |
| 3 | Coastal Battery | + 해안 홈잉 미사일 |
| 4 | RPG Strike      | + RPG 발사 보트 |
| 5 | Gauntlet        | 전 화력 집중 |
| 5 END | **Boss: IRGC Destroyer** | 미사일 볼리 / 기뢰 살포 / 함포 조준사격 |
| 6+ | Open Water      | 무한 진행 (난이도 선형 증가) |

### 파워업 (보급 컨테이너)
| 종류 | 효과 | 지속 |
|---|---|---|
| 🛡 Shield | 피격 무시 (에너지 방어막) | 8초 |
| ⚡ Speed  | 조작 속도 1.9배 + 가속 후미엔진 | 10초 |
| ✚ Repair | 선체 +30 HP | 즉시 |

HP 60/30 이하에서 수리 컨테이너 등장 확률 가중치 증가.

### 보스 전투
- Boss HP바 + **OUTRUN %** 게이지 표시.
- HP 고갈이 아니라 **거리 탈출** 승리 조건 — 생존하며 2,800 거리 단위를 주행하면 보스 후퇴.
- 공격 패턴 3종: volley (5발 팬) / minefield (기뢰 4개 살포) / deck gun (조준원 1.5초 후 AoE 폭발).

### 스코어 설계
- 기본: 주행거리 × (1 + 콤보 × 0.05)
- 기뢰/보트 **근접 회피**: 추가 보너스 + 콤보 누적
- 스테이지 클리어: `500 × stage_id`
- 파워업 획득: +200
- 보스 처치: +5,000
- 보스 전투 중: 거리 누적 스코어 1.2배

전체 수치는 `src/config.js` 에 통일. 변경은 CLAUDE.md §5 테이블과 동기화.

---

## 6. 개발자 단축키 (디버그)

- `G` — 즉사 (게임 오버 플로우 테스트)
- `B` — 스테이지 5 끝으로 점프 (보스 테스트)

---

## 7. 다음 반복 후보

- 🔊 사운드 (muffled explosion, radar ping, shield hum) — Tone.js로 프로시저럴 생성
- 🏅 일간 리더보드 (`scores_today` view 이미 제공됨)
- 🎯 데일리 챌린지 (고정 시드로 동일 해역 경쟁)
- 💥 보스 2종 추가 (Stage 10 submarine, Stage 15 aircraft carrier)
- 💰 `$TRIX` 토큰 리워드 훅 — 상위 10% 진입 시 `TIKTRIX_REWARD_CLAIM` 이벤트 발송
- 📊 히트맵 분석 (어디서 가장 많이 죽는지 집계)
- 🧪 서명된 스코어 (Supabase Edge Function + HMAC)
