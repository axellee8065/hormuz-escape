import { state, player, particles } from '../state.js';
import { rand, roundRect } from '../util.js';
import { sfx } from '../systems/audio.js';

let onDeadCallback = null;
export function setOnDead(cb){ onDeadCallback = cb; }

export function hitPlayer(dmg){
  if (state.invFrames > 0) return;
  if (state.buffs.shield > 0){
    state.shake = Math.min(12, state.shake+4);
    sfx.shield();
    for (let i=0;i<16;i++){
      const a=rand(0,Math.PI*2);
      particles.push({x:player.x+Math.cos(a)*34, y:player.y+Math.sin(a)*60, vx:Math.cos(a)*2, vy:Math.sin(a)*2,
        r:rand(2,3), life:22, max:22, color:'120,200,255'});
    }
    return;
  }
  state.hp = Math.max(0, state.hp - dmg);
  state.invFrames = 70;
  state.shake = Math.min(14, state.shake + 6);
  player.flash = 20;
  const el = document.getElementById('dmgFlash');
  el.classList.add('hit'); setTimeout(()=>el.classList.remove('hit'), 120);
  state.combo = 0; state.comboTimer = 0;
  if (state.hp <= 0 && onDeadCallback) onDeadCallback();
}

export function addCombo(n=1){
  state.combo += n; state.comboTimer = 120;
  const b = document.getElementById('comboBadge');
  if (state.combo >= 2){ b.textContent='×'+state.combo+' COMBO'; b.classList.add('show'); }
}

export function drawTanker(ctx){
  const p = player;
  ctx.save();
  ctx.translate(p.x, p.y);
  if (state.invFrames > 0 && (state.invFrames|0)%8 < 4) ctx.globalAlpha = 0.4;

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(2, p.h/2+4, p.w/2+2, 8, 0, 0, Math.PI*2); ctx.fill();

  const hullG = ctx.createLinearGradient(-p.w/2,0,p.w/2,0);
  hullG.addColorStop(0,'#1a2230'); hullG.addColorStop(0.5,'#2a3548'); hullG.addColorStop(1,'#1a2230');
  ctx.fillStyle = hullG;
  roundRect(ctx, -p.w/2, -p.h/2, p.w, p.h, 10); ctx.fill();

  ctx.fillStyle = '#2a3548';
  ctx.beginPath();
  ctx.moveTo(-p.w/2+2, -p.h/2); ctx.lineTo(0, -p.h/2-14); ctx.lineTo(p.w/2-2, -p.h/2); ctx.closePath(); ctx.fill();

  ctx.strokeStyle = '#4a5a70'; ctx.lineWidth=1;
  ctx.strokeRect(-p.w/2+4, -p.h/2+6, p.w-8, p.h-14);

  ctx.fillStyle = '#8a4a20';
  for (let i=0;i<4;i++){
    const ty = -p.h/2 + 20 + i*22;
    ctx.fillRect(-p.w/2+8, ty, p.w-16, 14);
    ctx.strokeStyle = '#5a2a10'; ctx.strokeRect(-p.w/2+8, ty, p.w-16, 14);
  }

  ctx.fillStyle = '#d8d0c4';
  ctx.fillRect(-p.w/2+10, p.h/2-28, p.w-20, 18);
  ctx.fillStyle = '#2a3548';
  ctx.fillRect(-p.w/2+14, p.h/2-24, p.w-28, 6);
  ctx.strokeStyle = '#d8d0c4'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(0, p.h/2-28); ctx.lineTo(0, p.h/2-40); ctx.stroke();
  ctx.fillStyle = '#ff5566'; ctx.fillRect(-1, p.h/2-42, 2, 2);

  if (player.flash > 0){
    ctx.fillStyle = `rgba(255,60,60,${player.flash/20 * 0.6})`;
    roundRect(ctx, -p.w/2, -p.h/2, p.w, p.h, 10); ctx.fill();
  }

  const eg = ctx.createRadialGradient(0, p.h/2+2, 0, 0, p.h/2+2, state.buffs.speed>0?26:18);
  const egColor = state.buffs.speed>0 ? 'rgba(255,216,74,0.8)' : 'rgba(120,220,255,0.6)';
  eg.addColorStop(0, egColor); eg.addColorStop(1, egColor.replace(/[\d.]+\)$/,'0)'));
  ctx.fillStyle = eg;
  ctx.fillRect(-24, p.h/2-4, 48, 34);

  if (state.buffs.shield > 0){
    const sa = state.buffs.shield < 60 ? (Math.sin(state.t*0.5) > 0 ? 0.8 : 0.3) : 1;
    ctx.strokeStyle = `rgba(120,200,255,${0.8*sa})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 10, p.w/2+12, p.h/2+14, 0, 0, Math.PI*2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(180,220,255,${0.25*sa})`;
    ctx.lineWidth = 1;
    for (let a=0; a<Math.PI*2; a+=Math.PI/6){
      const r1 = p.w/2+6, r2 = p.w/2+14;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*r1, 10+Math.sin(a)*(p.h/2+6));
      ctx.lineTo(Math.cos(a)*r2, 10+Math.sin(a)*(p.h/2+12));
      ctx.stroke();
    }
  }

  ctx.restore();
}
