import { state } from '../state.js';

export function drawMine(ctx, m){
  const by = Math.sin(m.bob)*2;
  ctx.save(); ctx.translate(m.x, m.y+by);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(2, m.r+2, m.r*0.8, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#2a2014'; ctx.lineWidth=3;
  for (let i=0;i<8;i++){
    const a = (i/8)*Math.PI*2 + state.t*0.01;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a)*m.r*0.9, Math.sin(a)*m.r*0.9);
    ctx.lineTo(Math.cos(a)*(m.r+7), Math.sin(a)*(m.r+7));
    ctx.stroke();
  }
  const mg = ctx.createRadialGradient(-m.r*0.3,-m.r*0.3,0,0,0,m.r);
  mg.addColorStop(0,'#3a2f1f'); mg.addColorStop(1,'#0a0a0a');
  ctx.fillStyle = mg;
  ctx.beginPath(); ctx.arc(0,0,m.r,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  for (let i=0;i<6;i++){
    const a=(i/6)*Math.PI*2;
    ctx.beginPath(); ctx.arc(Math.cos(a)*m.r*0.6, Math.sin(a)*m.r*0.6, 1.5, 0, Math.PI*2); ctx.fill();
  }
  const blink = (state.t|0)%30 < 10;
  ctx.fillStyle = blink ? '#ff3355' : '#441020';
  ctx.beginPath(); ctx.arc(0,-m.r*0.2, 2.5, 0, Math.PI*2); ctx.fill();
  if (blink){
    const gg = ctx.createRadialGradient(0,-m.r*0.2,0,0,-m.r*0.2,10);
    gg.addColorStop(0,'rgba(255,60,80,0.6)'); gg.addColorStop(1,'rgba(255,60,80,0)');
    ctx.fillStyle = gg; ctx.fillRect(-10,-m.r*0.2-10,20,20);
  }
  ctx.restore();
}
