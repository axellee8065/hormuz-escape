import { W, H, COAST_L, COAST_R } from './config.js';
import { rand, randi } from './util.js';

export const state = {
  mode: 'menu',       // menu | playing | stageIntro | bossIncoming | bossBattle | paused | dead | victory
  t: 0,
  stageIdx: 1,
  stageDist: 0,
  totalDist: 0,
  score: 0,
  hp: 100, maxHp: 100,
  invFrames: 0,
  combo: 0, comboTimer: 0,
  shake: 0, scroll: 0,
  spawnClocks: { mine:0, boat:0, missile:0, rpg:0, power:0 },
  buffs: { shield:0, speed:0 },
  bossTriggered: false,
  bossPhase: null,
  startedAt: 0,
  _paused: null,
};

export const player = {
  x: W/2, y: H - 170, w: 58, h: 130, vx: 0, flash: 0,
};

export const mines      = [];
export const boats      = [];
export const missiles   = [];
export const rpgs       = [];
export const powerups   = [];
export const telegraphs = [];
export const particles  = [];
export const marks      = [];
export const warnings   = [];
export const floatTexts = [];

for (let i=0; i<14; i++){
  marks.push({ x: rand(6, COAST_L-10),   y: rand(0, H), side:'L', kind: randi(0,3) });
  marks.push({ x: rand(W-COAST_R+10, W-6), y: rand(0, H), side:'R', kind: randi(0,3) });
}

export const boss = {
  active:false, x:W/2, y:-200, w:220, h:280,
  hp:0, maxHp:1,
  outrun:0, outrunMax:2800,
  phase:'enter',
  phaseTimer:0,
  attackTimer:0,
  attackPick:0,
  turretAngle:0,
  retreatTimer:0,
  entryT:0,
};

export function resetRun(){
  state.t = 0;
  state.stageIdx = 1; state.stageDist = 0; state.totalDist = 0; state.score = 0;
  state.hp = state.maxHp = 100;
  state.invFrames = 0;
  state.combo = 0; state.comboTimer = 0;
  state.shake = 0; state.scroll = 0;
  state.spawnClocks = { mine:0, boat:0, missile:0, rpg:0, power:0 };
  state.buffs = { shield:0, speed:0 };
  state.bossTriggered = false;
  state.startedAt = Date.now();
  player.x = W/2; player.y = H - 170; player.flash = 0;
  mines.length=0; boats.length=0; missiles.length=0; rpgs.length=0;
  particles.length=0; warnings.length=0; powerups.length=0; telegraphs.length=0; floatTexts.length=0;
  boss.active = false;
}
