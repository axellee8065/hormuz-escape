import { state, player, particles } from '../state.js';
import { rand } from '../util.js';
import { addFloatText } from '../systems/fx.js';
import { sfx } from '../systems/audio.js';

export function applyPowerup(kind){
  if (kind === 'shield'){
    state.buffs.shield = 480;    // 8s
    addFloatText(player.x, player.y-20, '+SHIELD', '#58c8ff');
  } else if (kind === 'speed'){
    state.buffs.speed = 600;     // 10s
    addFloatText(player.x, player.y-20, '+SPEED', '#ffd84a');
  } else if (kind === 'repair'){
    state.hp = Math.min(state.maxHp, state.hp + 30);
    addFloatText(player.x, player.y-20, '+30 HULL', '#5aff8a');
  }
  state.score += 200;
  sfx.pickup(kind);
  for (let i=0;i<14;i++){
    const a=rand(0,Math.PI*2), s=rand(1,3);
    const color = kind==='shield'?'120,200,255':kind==='speed'?'255,216,74':'120,255,160';
    particles.push({x:player.x, y:player.y, vx:Math.cos(a)*s, vy:Math.sin(a)*s,
      r:rand(2,4), life:28, max:28, color});
  }
}

export function drawPowerup(ctx, p){
  const yBob = Math.sin(p.bob)*3;
  ctx.save(); ctx.translate(p.x, p.y + yBob);
  const col = p.kind==='shield' ? '88,200,255' : p.kind==='speed' ? '255,216,74' : '120,255,150';

  const gg = ctx.createRadialGradient(0,0,0,0,0,p.r+16);
  gg.addColorStop(0, `rgba(${col},0.4)`); gg.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = gg; ctx.fillRect(-p.r-16,-p.r-16,(p.r+16)*2,(p.r+16)*2);

  ctx.fillStyle = `rgba(${col},0.18)`;
  ctx.strokeStyle = `rgba(${col},1)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i=0;i<6;i++){
    const a = i*Math.PI/3 + state.t*0.02;
    const x = Math.cos(a)*p.r, y = Math.sin(a)*p.r;
    if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();

  ctx.fillStyle = `rgba(${col},0.35)`;
  ctx.beginPath();
  for (let i=0;i<6;i++){
    const a = i*Math.PI/3 + state.t*0.02;
    const x = Math.cos(a)*p.r*0.6, y = Math.sin(a)*p.r*0.6;
    if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  } ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  if (p.kind === 'shield'){
    ctx.beginPath();
    ctx.moveTo(0,-9);
    ctx.bezierCurveTo(9,-9, 9,0, 0,10);
    ctx.bezierCurveTo(-9,0, -9,-9, 0,-9);
    ctx.closePath(); ctx.fill();
  } else if (p.kind === 'speed'){
    ctx.beginPath();
    ctx.moveTo(-3,-10); ctx.lineTo(4,-2); ctx.lineTo(-1,-1); ctx.lineTo(3,10);
    ctx.lineTo(-4,1); ctx.lineTo(1,0); ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(-2,-10, 4, 20);
    ctx.fillRect(-10,-2, 20, 4);
  }
  ctx.restore();
}
