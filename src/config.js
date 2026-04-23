// Logical canvas + coast + stage table. Balance numbers live here.
export const W = 540;
export const H = 960;

export const COAST_L = 60;
export const COAST_R = 60;
export const PLAY_L = COAST_L;
export const PLAY_R = W - COAST_R;

// dist is measured in scroll-units. A stage advances when stageDist >= dist.
// Per-tick progress equals `scroll`, so time-in-seconds ≈ dist / scroll / 60.
// Values below target: s1=30s, s2=35s, s3=40s, s4=45s, s5=50s (boss stage).
export const STAGES = [
  { id:1, name:'STRAIT ENTRY',    kr:'해협 진입 · 기뢰 지대',          dist: 5760,  mineRate: 1.3, boatRate: 0,   missileRate: 0,   rpgRate: 0,   powerRate: 0.15, scroll: 3.2 },
  { id:2, name:'PATROL ZONE',     kr:'초계 구역 · 적 함선 접근',        dist: 7560,  mineRate: 1.6, boatRate: 0.6, missileRate: 0,   rpgRate: 0,   powerRate: 0.2,  scroll: 3.6 },
  { id:3, name:'COASTAL BATTERY', kr:'해안 포대 · 대함 미사일 발사',   dist: 9600,  mineRate: 1.5, boatRate: 0.7, missileRate: 0.5, rpgRate: 0,   powerRate: 0.22, scroll: 4.0 },
  { id:4, name:'RPG STRIKE',      kr:'RPG 교전 · 적 고속정 화력 개방', dist: 11880, mineRate: 1.8, boatRate: 0.9, missileRate: 0.5, rpgRate: 0.7, powerRate: 0.22, scroll: 4.4 },
  { id:5, name:'GAUNTLET',        kr:'최후의 관문 · 전 화력 집중',      dist: 15000, mineRate: 2.2, boatRate: 1.1, missileRate: 0.7, rpgRate: 0.9, powerRate: 0.25, scroll: 5.0, boss: true },
];

export function getStage(n){
  if (n <= STAGES.length) return STAGES[n-1];
  const k = n - STAGES.length;
  const scroll = 5.2 + k*0.25;
  const targetSec = 50 + k*5;
  return {
    id:n, name:'OPEN WATER · ' + k, kr:'미지의 해역 · 난이도 ' + k,
    dist: Math.round(targetSec * 60 * scroll),
    mineRate: 2.4 + k*0.2, boatRate: 1.3 + k*0.1,
    missileRate: 0.8 + k*0.1, rpgRate: 1.0 + k*0.1,
    powerRate: 0.3, scroll,
  };
}
