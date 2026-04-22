export function drawParticle(ctx, p){
  const a = p.life / p.max;
  if (p.ring){
    ctx.strokeStyle = `rgba(${p.color},${a*0.7})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.stroke();
  } else if (p.wake){
    ctx.fillStyle = `rgba(${p.color},${a*0.3})`;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r*1.4, p.r*0.4, 0, 0, Math.PI*2); ctx.fill();
  } else if (p.smoke){
    ctx.fillStyle = `rgba(${p.color},${a*0.3})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r*(1.2-a+1), 0, Math.PI*2); ctx.fill();
  } else {
    ctx.fillStyle = `rgba(${p.color},${a})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
  }
}

export function drawFloat(ctx, f){
  const a = f.life / f.max;
  ctx.fillStyle = f.color.startsWith('#') ? f.color : '#e8f4ff';
  ctx.globalAlpha = a;
  ctx.font = 'bold 13px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;
  ctx.fillText(f.txt, f.x, f.y);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}
