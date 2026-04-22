import { state } from '../state.js';

export function drawTelegraph(ctx, tg){
  const prog = 1 - tg.timer/90;
  ctx.save(); ctx.translate(tg.x, tg.y);
  ctx.strokeStyle = `rgba(255,60,80,${0.3 + prog*0.5})`;
  ctx.lineWidth = 3;
  ctx.setLineDash([10,6]);
  ctx.lineDashOffset = -state.t;
  ctx.beginPath(); ctx.arc(0,0, tg.maxR, 0, Math.PI*2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = `rgba(255,30,60,${0.15 + prog*0.25})`;
  ctx.beginPath(); ctx.arc(0,0, tg.maxR*prog, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = `rgba(255,180,180,${0.6 + prog*0.4})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-tg.maxR-8,0); ctx.lineTo(-tg.maxR*0.5,0);
  ctx.moveTo(tg.maxR+8,0);  ctx.lineTo(tg.maxR*0.5,0);
  ctx.moveTo(0,-tg.maxR-8); ctx.lineTo(0,-tg.maxR*0.5);
  ctx.moveTo(0,tg.maxR+8);  ctx.lineTo(0,tg.maxR*0.5);
  ctx.stroke();
  ctx.restore();
}
