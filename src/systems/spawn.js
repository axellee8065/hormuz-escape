import { mines, boats, missiles, rpgs, powerups, warnings, state, player } from '../state.js';
import { PLAY_L, PLAY_R, COAST_L, COAST_R, W, H } from '../config.js';
import { rand } from '../util.js';
import { particles } from '../state.js';
import { sfx } from './audio.js';

export function spawnMine(){
  mines.push({x: rand(PLAY_L+30, PLAY_R-30), y:-40, r:rand(18,24), bob:rand(0,Math.PI*2), alive:true, counted:false});
}

export function spawnBoat(){
  const fromLeft = Math.random() < 0.5;
  boats.push({
    x: fromLeft ? PLAY_L+20 : PLAY_R-20, y:-50,
    vx: (fromLeft?1:-1)*rand(0.6,1.3), vy:rand(1.8,2.8),
    w:32, h:56, hp:1, fireCd: rand(2.0,3.5), isRpg:false, counted:false,
  });
  sfx.boatEngine();
}

export function spawnRpgBoat(){
  const fromLeft = Math.random() < 0.5;
  boats.push({
    x: fromLeft ? PLAY_L+16 : PLAY_R-16, y:-60,
    vx:(fromLeft?1:-1)*rand(0.4,1.0), vy:rand(1.2,2.0),
    w:34, h:60, hp:1, fireCd: rand(1.4,2.2), isRpg:true, counted:false,
  });
  sfx.boatEngine();
}

export function spawnCoastMissile(){
  const fromLeft = Math.random() < 0.5;
  const launchX  = fromLeft ? rand(4, COAST_L-8) : rand(W-COAST_R+8, W-4);
  const launchY  = rand(120, H-320);
  warnings.push({ y:launchY, side: fromLeft?'L':'R', life:50 });
  setTimeout(()=>{
    if (state.mode !== 'playing' && state.mode !== 'bossBattle') return;
    missiles.push({
      x:launchX, y:launchY,
      vx:(fromLeft?1:-1)*2.2, vy:0.6,
      life:360, homing:60, trail:[], fromBoss:false
    });
    sfx.missileLaunch(false);
  }, 800);
}

export function spawnRpgShot(from){
  const dx=player.x-from.x, dy=player.y-from.y, d=Math.hypot(dx,dy)||1, sp=4.6;
  rpgs.push({x:from.x, y:from.y, vx:dx/d*sp, vy:dy/d*sp, life:180, trail:[]});
  for (let i=0;i<8;i++){
    particles.push({x:from.x, y:from.y, vx:dx/d*2+rand(-1,1), vy:dy/d*2+rand(-1,1),
      r:rand(2,4), life:20, max:20, color:'255,160,80'});
  }
  sfx.rpg();
}

export function spawnPowerUp(){
  const kinds = ['shield','speed','repair'];
  let weights = [1, 1, 1];
  if (state.hp < 60) weights[2] = 2.5;
  if (state.hp < 30) weights[2] = 4;
  const sum = weights.reduce((a,b)=>a+b,0);
  let r = Math.random()*sum, pick = 0;
  for (let i=0;i<kinds.length;i++){ r -= weights[i]; if (r<=0){pick=i;break;} }
  powerups.push({
    x: rand(PLAY_L+40, PLAY_R-40), y: -40,
    r: 22, kind: kinds[pick], bob: rand(0,Math.PI*2), alive:true,
  });
}
