export function drawRpg(ctx, r){
  for (let i=0;i<r.trail.length;i++){
    const t = r.trail[i], a = i/r.trail.length;
    ctx.fillStyle = `rgba(255,120,60,${a*0.6})`;
    ctx.beginPath(); ctx.arc(t.x,t.y,1.5+a*1.5,0,Math.PI*2); ctx.fill();
  }
  ctx.save(); ctx.translate(r.x, r.y);
  ctx.rotate(Math.atan2(r.vy, r.vx));
  ctx.fillStyle = '#3a2015'; ctx.fillRect(-8,-2,14,4);
  ctx.fillStyle = '#ff8844';
  ctx.beginPath(); ctx.moveTo(6,-2); ctx.lineTo(10,0); ctx.lineTo(6,2); ctx.closePath(); ctx.fill();
  ctx.restore();
}
