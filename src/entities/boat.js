import { player } from '../state.js';

export function drawBoat(ctx, b){
  ctx.save(); ctx.translate(b.x, b.y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(1, b.h/2+2, b.w/2, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = b.isRpg ? '#3a1a1a' : '#1c2a1a';
  ctx.beginPath();
  ctx.moveTo(0, -b.h/2);
  ctx.lineTo(b.w/2, b.h/2-6); ctx.lineTo(b.w/2-4, b.h/2);
  ctx.lineTo(-b.w/2+4, b.h/2); ctx.lineTo(-b.w/2, b.h/2-6);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = b.isRpg ? '#5a2a2a' : '#2a3a22';
  ctx.fillRect(-b.w/2+5, -b.h/2+12, b.w-10, b.h-20);
  ctx.fillStyle = '#2a2a2a'; ctx.fillRect(-6, -b.h/2+16, 12, 12);
  if (b.isRpg){
    const angle = Math.atan2(player.y - b.y, player.x - b.x) - Math.PI/2;
    ctx.save(); ctx.translate(0, -4); ctx.rotate(angle);
    ctx.fillStyle = '#222'; ctx.fillRect(-2, -14, 4, 18);
    ctx.fillStyle = '#551'; ctx.fillRect(-3, -16, 6, 4);
    ctx.restore();
  } else {
    ctx.fillStyle = '#222'; ctx.fillRect(-1, -b.h/2+6, 2, 8);
  }
  ctx.strokeStyle = 'rgba(200,230,240,0.25)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(-b.w/2+3, b.h/2-2); ctx.lineTo(b.w/2-3, b.h/2-2); ctx.stroke();
  ctx.restore();
}
