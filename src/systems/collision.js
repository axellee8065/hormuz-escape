import {
  state, player, mines, boats, missiles, rpgs, powerups,
  telegraphs, particles, marks, warnings, floatTexts,
} from '../state.js';
import { W, H, PLAY_L, PLAY_R, COAST_L, COAST_R, getStage } from '../config.js';
import { clamp, dist2, rand, randi } from '../util.js';
import { input, keys } from '../input.js';
import { hitPlayer, addCombo } from '../entities/player.js';
import { addExplosion, addWake } from './fx.js';
import { applyPowerup } from '../entities/powerup.js';
import { spawnMine, spawnBoat, spawnRpgBoat, spawnCoastMissile, spawnRpgShot, spawnPowerUp } from './spawn.js';
import { updateBoss, triggerBoss } from '../entities/boss.js';
import { updateHUD } from './hud.js';

let stageIntroCallback = null;
export function setStageIntroCallback(cb){ stageIntroCallback = cb; }

export function update(dt){
  state.t += dt;
  const stage = getStage(state.stageIdx);

  const isBattle = state.mode === 'playing' || state.mode === 'bossBattle' || state.mode === 'bossIncoming';
  if (!isBattle) return;

  if (state.buffs.shield > 0) state.buffs.shield = Math.max(0, state.buffs.shield - dt);
  if (state.buffs.speed  > 0) state.buffs.speed  = Math.max(0, state.buffs.speed  - dt);

  const speedMul = state.buffs.speed > 0 ? 1.9 : 1.0;
  const lerpK = state.buffs.speed > 0 ? 0.35 : 0.22;
  const targetX = input.active ? input.x
                : (keys.ArrowLeft ? player.x-6*speedMul
                : keys.ArrowRight ? player.x+6*speedMul : player.x);
  const dx = targetX - player.x;
  player.vx = clamp(dx * lerpK, -12*speedMul, 12*speedMul);
  player.x = clamp(player.x + player.vx, PLAY_L + player.w/2, PLAY_R - player.w/2);

  if (state.t % 3 < 1) { addWake(player.x-10, player.y+player.h/2); addWake(player.x+10, player.y+player.h/2); }

  const dd = stage.scroll;
  state.scroll += dd;
  if (state.mode === 'playing'){
    state.totalDist += dd;
    state.stageDist += dd;
    state.score += Math.round(dd * 0.6 * (1 + state.combo*0.05));
  } else {
    state.totalDist += dd * 0.3;
  }
  if (state.invFrames > 0) state.invFrames--;
  if (player.flash > 0) player.flash--;
  if (state.comboTimer > 0){
    state.comboTimer--;
    if (state.comboTimer===0){
      state.combo=0;
      document.getElementById('comboBadge').classList.remove('show');
    }
  }

  if (state.mode === 'playing'){
    const sc = state.spawnClocks;
    sc.mine += dt;    if (stage.mineRate>0     && sc.mine    > 60/stage.mineRate)    { sc.mine=0;    spawnMine(); }
    sc.boat += dt;    if (stage.boatRate>0     && sc.boat    > 60/stage.boatRate)    { sc.boat=0;    spawnBoat(); }
    sc.missile += dt; if (stage.missileRate>0  && sc.missile > 60/stage.missileRate) { sc.missile=0; spawnCoastMissile(); }
    sc.rpg += dt;     if (stage.rpgRate>0      && sc.rpg     > 60/stage.rpgRate)     { sc.rpg=0;     spawnRpgBoat(); }
    sc.power += dt;   if (stage.powerRate>0    && sc.power   > 60/stage.powerRate)   { sc.power=0;   spawnPowerUp(); }

    if (state.stageDist >= stage.dist){
      if (stage.boss && !state.bossTriggered){
        triggerBoss();
      } else {
        state.stageIdx++;
        state.stageDist = 0;
        state.score += 500 * stage.id;
        if (stageIntroCallback) stageIntroCallback();
      }
    }
  } else if (state.mode === 'bossBattle'){
    const sc = state.spawnClocks;
    sc.power += dt;
    if (sc.power > 60 * 5){ sc.power = 0; spawnPowerUp(); }
  }

  updateBoss(dt);

  // mines
  for (const m of mines){
    m.y += getStage(state.stageIdx).scroll * 0.9 + 0.4;
    m.bob += 0.05;
    const dsq = dist2(m.x, m.y, player.x, player.y);
    const rr = m.r + 22;
    if (dsq < rr*rr){
      m.alive = false;
      addExplosion(m.x, m.y, 1.2, '255,80,60');
      hitPlayer(28);
    } else if (dsq < 80*80 && !m.nearMiss) m.nearMiss = true;
    if (m.y > H+40 && !m.counted){
      m.counted = true;
      if (m.alive && state.mode==='playing'){
        state.score += m.nearMiss ? 80 : 30;
        if (m.nearMiss) addCombo(1);
      }
    }
  }
  for (let i=mines.length-1;i>=0;i--) if (!mines[i].alive || mines[i].y > H+80) mines.splice(i,1);

  // boats
  for (const b of boats){
    b.vx += clamp((player.x-b.x)*0.0006, -0.02, 0.02);
    b.vx = clamp(b.vx, -2.4, 2.4);
    b.x += b.vx;
    b.y += b.vy + getStage(state.stageIdx).scroll*0.35;
    if (b.x < PLAY_L+18){ b.x=PLAY_L+18; b.vx*=-0.6; }
    if (b.x > PLAY_R-18){ b.x=PLAY_R-18; b.vx*=-0.6; }
    if ((state.t|0)%4===0) addWake(b.x, b.y+b.h/2-4);
    if (b.isRpg){
      b.fireCd -= dt/60;
      if (b.fireCd<=0 && b.y>40 && b.y<H-60){ spawnRpgShot(b); b.fireCd = rand(1.6,2.6); }
    }
    const dsq = dist2(b.x, b.y, player.x, player.y);
    if (dsq < 48*48){
      b.hp = 0;
      addExplosion(b.x, b.y, 0.9, '255,110,60');
      hitPlayer(18);
    } else if (dsq < 100*100 && !b.nearMiss) b.nearMiss = true;
    if (b.y > H+60 && !b.counted){
      b.counted = true;
      if (b.hp>0 && state.mode==='playing'){
        state.score += b.nearMiss ? 150 : 60;
        if (b.nearMiss) addCombo(1);
      }
    }
  }
  for (let i=boats.length-1;i>=0;i--) if (boats[i].hp<=0 || boats[i].y > H+80) boats.splice(i,1);

  // missiles
  for (const ms of missiles){
    if (ms.homing > 0){
      const d = Math.hypot(player.x-ms.x, player.y-ms.y)||1;
      const steer  = ms.fromBoss ? 0.18 : 0.12;
      const maxSpd = ms.fromBoss ? 3.8  : 3.0;
      ms.vx = ms.vx*(1-steer) + ((player.x-ms.x)/d)*maxSpd*steer;
      ms.vy = ms.vy*(1-steer) + ((player.y-ms.y)/d)*maxSpd*steer;
      ms.homing--;
    } else ms.vy += 0.03;
    ms.x += ms.vx; ms.y += ms.vy;
    ms.trail.push({x:ms.x, y:ms.y}); if (ms.trail.length>14) ms.trail.shift();
    ms.life--;
    if (ms.life % 2 === 0){
      particles.push({x:ms.x+rand(-2,2), y:ms.y+rand(-2,2), vx:rand(-0.3,0.3), vy:rand(-0.3,0.3),
        r:rand(2,4), life:24, max:24, color:'200,200,210', smoke:true});
    }
    if (dist2(ms.x,ms.y,player.x,player.y) < 28*28){
      ms.life = 0; addExplosion(ms.x, ms.y, 1.5, '255,70,60'); hitPlayer(ms.fromBoss?50:40);
    }
  }
  for (let i=missiles.length-1;i>=0;i--) if (missiles[i].life<=0 || missiles[i].x<-40 || missiles[i].x>W+40 || missiles[i].y>H+40) missiles.splice(i,1);

  // rpgs
  for (const r of rpgs){
    r.x += r.vx; r.y += r.vy;
    r.trail.push({x:r.x,y:r.y}); if (r.trail.length>10) r.trail.shift();
    r.life--;
    if (dist2(r.x,r.y,player.x,player.y) < 22*22){
      r.life=0; addExplosion(r.x,r.y, 0.9, '255,150,60'); hitPlayer(22);
    }
  }
  for (let i=rpgs.length-1;i>=0;i--){const r=rpgs[i]; if (r.life<=0 || r.y>H+30 || r.y<-30 || r.x<-30 || r.x>W+30) rpgs.splice(i,1);}

  // powerups
  for (const p of powerups){
    p.y += getStage(state.stageIdx).scroll * 0.85;
    p.bob += 0.08;
    if (dist2(p.x,p.y,player.x,player.y) < (p.r+26)*(p.r+26)){
      p.alive = false;
      applyPowerup(p.kind);
    }
  }
  for (let i=powerups.length-1;i>=0;i--) if (!powerups[i].alive || powerups[i].y > H+50) powerups.splice(i,1);

  // telegraphs
  for (const tg of telegraphs){
    tg.timer -= dt;
    if (!tg.exploded){
      tg.r = tg.maxR * (1 - tg.timer/90);
      if (tg.timer <= 0){
        tg.exploded = true;
        addExplosion(tg.x, tg.y, 2.2, '255,80,50');
        if (dist2(tg.x, tg.y, player.x, player.y) < (tg.maxR+18)*(tg.maxR+18)){
          hitPlayer(55);
        }
      }
    }
  }
  for (let i=telegraphs.length-1;i>=0;i--) if (telegraphs[i].exploded) telegraphs.splice(i,1);

  // warnings
  for (const w of warnings) w.life--;
  for (let i=warnings.length-1;i>=0;i--) if (warnings[i].life<=0) warnings.splice(i,1);

  // particles
  for (const p of particles){
    p.x += p.vx; p.y += p.vy;
    if (!p.ring){ p.vx*=0.96; p.vy*=0.96; }
    if (p.wake) p.y += 1.2;
    p.life--;
    if (p.ring) p.r += (p.maxR-p.r)*0.15;
  }
  for (let i=particles.length-1;i>=0;i--) if (particles[i].life<=0) particles.splice(i,1);

  // float texts
  for (const f of floatTexts){ f.y -= 0.6; f.life--; }
  for (let i=floatTexts.length-1;i>=0;i--) if (floatTexts[i].life<=0) floatTexts.splice(i,1);

  // coast marks
  const sc2 = getStage(state.stageIdx).scroll;
  for (const m of marks){
    m.y += sc2;
    if (m.y > H+20){ m.y=-20; m.x = m.side==='L' ? rand(6,COAST_L-10) : rand(W-COAST_R+10,W-6); m.kind=randi(0,3); }
  }

  state.shake *= 0.82;
  updateHUD();
}
