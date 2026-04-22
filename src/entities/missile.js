export function drawMissile(ctx, m){
  for (let i=0;i<m.trail.length;i++){
    const t = m.trail[i], a = i/m.trail.length;
    ctx.fillStyle = `rgba(255,180,80,${a*0.5})`;
    ctx.beginPath(); ctx.arc(t.x,t.y,2+a*2,0,Math.PI*2); ctx.fill();
  }
  ctx.save(); ctx.translate(m.x, m.y);
  ctx.rotate(Math.atan2(m.vy, m.vx));
  ctx.fillStyle = m.fromBoss ? '#e0c4c4' : '#c8c8d0'; ctx.fillRect(-14,-3,24,6);
  ctx.fillStyle = '#ff5566';
  ctx.beginPath(); ctx.moveTo(10,-3); ctx.lineTo(16,0); ctx.lineTo(10,3); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8a8a90';
  ctx.beginPath(); ctx.moveTo(-14,-3); ctx.lineTo(-18,-6); ctx.lineTo(-10,-3); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-14,3);  ctx.lineTo(-18,6);  ctx.lineTo(-10,3);  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffb040';
  ctx.beginPath(); ctx.moveTo(-14,-2); ctx.lineTo(-22,0); ctx.lineTo(-14,2); ctx.closePath(); ctx.fill();
  ctx.restore();
}
