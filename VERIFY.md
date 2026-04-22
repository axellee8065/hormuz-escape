# HORMUZ ESCAPE — 리팩터링 후 수동 검증 체크리스트

목적: `index.html` 단일 파일 → Vite 모듈 구조로 분리 후 기능 동등성을 확인.

## 준비
```bash
cp .env.example .env     # VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 채움 (또는 URL 파라미터 주입)
npm install
npm run dev              # http://localhost:5173
```

DevTools Console 열어두기 — Supabase 403/RLS 에러, import 오류, TypeError를 즉시 감지.

---

## A. 부팅 & UI 연결
- [ ] 접속 시 **HORMUZ ESCAPE** 메뉴 오버레이 표시 (`#menuOverlay`)
- [ ] 좌하단 `BACKEND` pill 이 `SUPABASE · LIVE` (환경변수 세팅 시) 또는 `OFFLINE` (안 세팅 시) 로 뜸
- [ ] BEST 점수가 localStorage에서 복원됨 (이전 플레이 있다면)
- [ ] `CAPTAIN · 이름` 클릭 시 이름 변경 오버레이 진입

## B. 플레이 진입 플로우
- [ ] **START MISSION** → 이름 없으면 `nameOverlay` 진입, 있으면 바로 게임 시작
- [ ] 이름 입력 후 `Enter` 또는 `CONFIRM` → 게임 시작
- [ ] HUD 표시: HP 100%, SCORE 0, STAGE 1
- [ ] "◄  DRAG TO STEER  ►" 조작 힌트 ~2.4초 노출 후 사라짐
- [ ] 드래그/키보드 좌우로 탱커 조향 가능

## C. 스테이지 전환 카드
- [ ] Stage 1 (dist 600) 완료 → 화면 중앙에 `STAGE 02 / PATROL ZONE / 초계 구역` 카드 슬라이드 인
- [ ] 같은 방식으로 Stage 2→3, 3→4, 4→5 각각 전환 확인
- [ ] 카드 1.4초 후 자동 사라짐, 게임 계속됨

## D. 엔티티 스폰 & 충돌
- [ ] Stage 1: 기뢰만 떠내려옴
- [ ] Stage 2: 초계정(녹색 육각형) 양측에서 등장
- [ ] Stage 3: 해안 측면에서 경고 프레임 + 0.8s 뒤 **미사일 발사**, 플레이어 호밍
- [ ] Stage 4: RPG 보트(적색)가 조준 발사 (플레이어 방향 + 트레일)
- [ ] Stage 5: 위 전부 동시 등장 (화력 집중)

## E. 파워업 3종
- [ ] **Shield 🛡** 픽업 → 탱커 주변 파란 링 표시 + HUD에 `SHIELD 8.0s` pill
- [ ] **Speed ⚡** 픽업 → 후미 엔진 노란색 + HUD에 `BOOST 10.0s` pill + 조향 빠름
- [ ] **Repair ✚** 픽업 → HP +30 즉시 (HUD HP바 증가) + `+30 HULL` float text
- [ ] HP 30 미만에서 파워업 풀 시 Repair 등장 빈도 체감 증가
- [ ] 파워업 획득 시 Score +200 증가
- [ ] Shield/Speed 타이머 만료 시 pill 사라짐

## F. 경고 배너
- [ ] Stage 3+에서 해안 미사일 발사 전 측면 경고 삼각형 표시

## G. 보스 플로우 (Stage 5 END)
- [ ] Stage 5 거리 1800 근처 도달 → **⚠ WARSHIP ⚠** 대형 경고 + `WARNING / WARSHIP INTERCEPT` 카드
- [ ] 1.8초 뒤 보스가 화면 상단에서 하강 (entry phase)
- [ ] 보스 HUD 활성: **HULL** 바 + `OUTRUN 0%` 게이지
- [ ] 보스 레이더/연돌/터렛 애니메이션 작동 (radar 회전, smoke 배출)
- [ ] 보스 터렛 3개가 플레이어 방향 추적

## H. 보스 공격 패턴 3종
- [ ] **Volley**: 보스에서 5발 미사일 팬 발사 + 머즐 플래시
- [ ] **Minefield**: 보스 하단에서 기뢰 4개 살포
- [ ] **Deck gun**: 플레이어 예상 위치에 조준원(점선 대시 회전) + 1.5s 뒤 AoE 폭발
- [ ] 피격 시 HP 데미지 (볼리 50, deckgun 55), 실드 있으면 흡수

## I. 보스 승/패
- [ ] `OUTRUN 100%` 도달 → 보스가 상단으로 후퇴
- [ ] 후퇴 완료 → `ESCAPED` 빅토리 화면 (녹색), `// STRAIT CLEARED //`
- [ ] 빅토리 화면에 FINAL SCORE / DISTANCE / STAGE REACHED(5 ✓) / RANK 표시

## J. 게임 오버
- [ ] HP 0 → 탱커 위치 3-layer explosion
- [ ] 1.2초 뒤 `SUNK / MISSION FAILED` 오버레이
- [ ] Result grid: FINAL SCORE, DISTANCE, STAGE REACHED, RANK

## K. Supabase 제출 & 랭크
- [ ] Game Over / Victory 시 Console에 Supabase insert 실패 없음 (네트워크 탭 확인: `POST /rest/v1/scores` → 201)
- [ ] RANK 필드가 `#숫자` 로 대체됨 (또는 오프라인 모드에서 `LOCAL`)
- [ ] BEST 점수가 최고 점수로 갱신됨

## L. 리더보드
- [ ] 메뉴 → `LEADERBOARD` 버튼 → 실 데이터 rows 표시
- [ ] 본인 행은 녹색 하이라이트 (`.me` 클래스)
- [ ] 상위 3명 rank 숫자 노란색
- [ ] BACK 버튼으로 메뉴 복귀

## M. Pause 버튼
- [ ] 게임 중 상단 `II` 버튼 클릭 → 일시정지 + 버튼이 `▶` 로 변경
- [ ] 다시 클릭 → 재개

## N. 디버그 단축키
- [ ] `G` 키 — 즉시 HP 0 → Game Over 플로우 (playing/bossBattle 에서만)
- [ ] `B` 키 — Stage 5 끝 근처로 점프 → 보스 트리거 가능 (playing 에서만)

## O. 모듈/빌드 헬스
- [ ] DevTools Console 에 `import` 오류나 `undefined is not a function` 없음
- [ ] `npm run build` 성공 → `dist/index.html` + `dist/assets/*.js` + `dist/assets/*.css` 생성
- [ ] `npm run preview` 로 빌드본 서빙 시 동일하게 작동

## P. 모바일 터치 (옵션, 실기 또는 DevTools 에뮬레이션)
- [ ] 터치 드래그로 조향 작동
- [ ] 세로 9:16 비율 유지, 스크롤/줌 안 됨

---

## 회귀 주의 포인트 (분리 과정에서 깨지기 쉬운 부분)

| 항목 | 확인 |
|---|---|
| `state` 공유 (모든 모듈이 동일 인스턴스 참조) | 게임 시작→종료→재시작 시 state가 깨끗하게 리셋 |
| `spawnCoastMissile` setTimeout 안에서 state 접근 | boss 트리거 이후 stage5 미사일 경고가 그대로 보스배틀로 이어지는지 |
| cross-module callback (`setOnDead`/`setVictoryCallback`/`setStageIntroCallback`) | 각 이벤트 트리거 시 정상 호출 |
| Supabase env 치환 | `import.meta.env.VITE_SUPABASE_URL` 이 빌드 결과물에 실제 URL로 치환됐는지 (DevTools Network 탭에서 실제 호출 URL 확인) |
| DOM id 유지 | HUD 업데이트 대상 모든 id 가 `index.html` shell 에 존재 |
