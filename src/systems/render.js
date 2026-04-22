import {
  state, boss, mines, boats, missiles, rpgs, powerups,
  telegraphs, particles, marks, warnings, floatTexts,
} from '../state.js';
import { W, H, PLAY_L, PLAY_R, COAST_L, COAST_R } from '../config.js';
import { drawTanker } from '../entities/player.js';
import { drawMine } from '../entities/mine.js';
import { drawBoat } from '../entities/boat.js';
import { drawMissile } from '../entities/missile.js';
import { drawRpg } from '../entities/rpg.js';
import { drawPowerup } from '../entities/powerup.js';
import { drawTelegraph } from '../entities/telegraph.js';
import { drawParticle, drawFloat } from '../entities/particle.js';
import { drawBoss } from '../entities/boss.js';

export function render(ctx){
  ctx.save();
  if (state.shake > 0.2){
    ctx.translate((Math.random()-0.5)*state.shake, (Math.random()-0.5)*state.shake);
  }

  // water bg
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#091827'); g.addColorStop(0.6,'#0b1d30'); g.addColorStop(1,'#07121e');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

  ctx.strokeStyle = 'rgba(0,255,170,0.05)'; ctx.lineWidth=1;
  const gridY = (state.scroll*0.5) % 40;
  for (let y=-40; y<H+40; y+=40){
    ctx.beginPath(); ctx.moveTo(PLAY_L,y+gridY); ctx.lineTo(PLAY_R,y+gridY); ctx.stroke();
  }
  for (let x=PLAY_L; x<=PLAY_R; x+=40){
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(150,210,230,0.05)';
  for (let i=0;i<6;i++){
    const y = ((i*180 + state.scroll*0.7) % (H+200)) - 50;
    ctx.beginPath();
    for (let x=PLAY_L; x<=PLAY_R; x+=20){
      const yy = y + Math.sin((x+state.t)*0.04 + i)*3;
      if (x===PLAY_L) ctx.moveTo(x,yy); else ctx.lineTo(x,yy);
    }
    ctx.stroke();
  }

  drawCoast(ctx);

  for (const w of warnings){
    const a = w.life/50;
    ctx.fillStyle = `rgba(255,51,85,${a*0.7})`;
    const x = w.side==='L' ? 0 : W-COAST_R;
    ctx.fillRect(x, w.y-6, COAST_L, 12);
    ctx.fillStyle = `rgba(255,200,200,${a})`;
    ctx.fillRect(x+4, w.y-1, COAST_L-8, 2);
    ctx.fillStyle = `rgba(255,60,80,${a})`;
    ctx.beginPath();
    const ax = w.side==='L' ? COAST_L+4 : W-COAST_R-4;
    const dir = w.side==='L' ? 1 : -1;
    ctx.moveTo(ax, w.y); ctx.lineTo(ax+8*dir, w.y-6); ctx.lineTo(ax+8*dir, w.y+6);
    ctx.closePath(); ctx.fill();
  }

  if (boss.active) drawBoss(ctx);

  for (const m of mines) drawMine(ctx, m);
  for (const b of boats) drawBoat(ctx, b);
  for (const p of powerups) drawPowerup(ctx, p);
  for (const tg of telegraphs) drawTelegraph(ctx, tg);
  for (const ms of missiles) drawMissile(ctx, ms);
  for (const r of rpgs) drawRpg(ctx, r);

  drawTanker(ctx);

  for (const p of particles) drawParticle(ctx, p);
  for (const f of floatTexts) drawFloat(ctx, f);

  if (state.hp>0 && state.hp < 30){
    const pulse = 0.35 + Math.sin(state.t*0.15)*0.15;
    ctx.fillStyle = `rgba(255,51,85,${pulse*0.3})`;
    ctx.fillRect(0,0,W,8); ctx.fillRect(0,H-8,W,8);
    ctx.fillRect(0,0,8,H); ctx.fillRect(W-8,0,8,H);
  }

  ctx.restore();
}

function drawCoast(ctx){
  const lg = ctx.createLinearGradient(0,0,COAST_L,0);
  lg.addColorStop(0,'#1a1208'); lg.addColorStop(0.7,'#2a1f10'); lg.addColorStop(1,'#3b2c15');
  ctx.fillStyle = lg;
  ctx.beginPath(); ctx.moveTo(0,0);
  for (let y=0;y<=H;y+=20){
    const w = COAST_L + Math.sin((y+state.scroll)*0.03)*6 + Math.sin((y+state.scroll)*0.11)*3;
    ctx.lineTo(w,y);
  }
  ctx.lineTo(0,H); ctx.closePath(); ctx.fill();

  const rg = ctx.createLinearGradient(W-COAST_R,0,W,0);
  rg.addColorStop(0,'#3b2c15'); rg.addColorStop(0.3,'#2a1f10'); rg.addColorStop(1,'#1a1208');
  ctx.fillStyle = rg;
  ctx.beginPath(); ctx.moveTo(W,0);
  for (let y=0;y<=H;y+=20){
    const w = COAST_R - Math.sin((y+state.scroll)*0.03+1.2)*6 - Math.sin((y+state.scroll)*0.11+0.7)*3;
    ctx.lineTo(W-w,y);
  }
  ctx.lineTo(W,H); ctx.closePath(); ctx.fill();

  ctx.strokeStyle = 'rgba(180,220,230,0.15)'; ctx.lineWidth=1;
  ctx.beginPath();
  for (let y=0;y<=H;y+=8){
    const w = COAST_L + Math.sin((y+state.scroll)*0.03)*6 + Math.sin((y+state.scroll)*0.11)*3;
    if (y===0) ctx.moveTo(w,y); else ctx.lineTo(w,y);
  } ctx.stroke();
  ctx.beginPath();
  for (let y=0;y<=H;y+=8){
    const w = COAST_R - Math.sin((y+state.scroll)*0.03+1.2)*6 - Math.sin((y+state.scroll)*0.11+0.7)*3;
    if (y===0) ctx.moveTo(W-w,y); else ctx.lineTo(W-w,y);
  } ctx.stroke();

  for (const m of marks){
    const blink = Math.sin(state.t*0.2 + m.x) > 0.3;
    if (m.kind===0){
      ctx.fillStyle = '#4a3820'; ctx.fillRect(m.x-4, m.y-6, 8, 12);
      ctx.fillStyle = blink ? '#ff3355' : '#661820'; ctx.fillRect(m.x-1, m.y-8, 2, 2);
    } else if (m.kind===1){
      ctx.fillStyle = '#5a4424';
      ctx.beginPath(); ctx.arc(m.x,m.y,5,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(m.x+3,m.y+3,3,0,Math.PI*2); ctx.fill();
    } else {
      ctx.fillStyle = state.stageIdx >= 3 ? '#2a3a2a' : '#3a2f18';
      ctx.fillRect(m.x-5, m.y-5, 10, 10);
      if (state.stageIdx >= 3){
        ctx.fillStyle = blink ? '#ff6050' : '#3a1a1a'; ctx.fillRect(m.x-1, m.y-1, 2, 2);
      }
    }
  }
}
