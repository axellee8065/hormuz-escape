import { state, player, boss, mines, missiles, telegraphs, particles } from '../state.js';
import { W, H, PLAY_L, PLAY_R, getStage } from '../config.js';
import { rand, clamp } from '../util.js';

let victoryCallback = null;
export function setVictoryCallback(cb){ victoryCallback = cb; }

export function triggerBoss(){
  state.bossTriggered = true;
  state.mode = 'bossIncoming';
  boss.active = true;
  boss.x = W/2; boss.y = -220;
  boss.hp = 1; boss.maxHp = 1;
  boss.outrun = 0; boss.outrunMax = 2800;
  boss.phase = 'enter'; boss.phaseTimer = 180;
  boss.attackTimer = 0; boss.attackPick = 0;
  boss.entryT = 0;

  const bw = document.getElementById('bossWarn');
  bw.classList.add('show');
  setTimeout(()=>bw.classList.remove('show'), 2900);

  const card = document.getElementById('stageCard');
  card.classList.add('boss');
  document.getElementById('stageNum').textContent  = 'WARNING';
  document.getElementById('stageName').textContent = 'WARSHIP INTERCEPT';
  document.getElementById('stageDesc').textContent = '적 구축함 조우 · 탈출 기동 개시';
  document.getElementById('stageOverlay').classList.remove('hidden');
  setTimeout(()=>{
    document.getElementById('stageOverlay').classList.add('hidden');
    card.classList.remove('boss');
    if (state.hp > 0) state.mode = 'bossBattle';
    document.getElementById('bossHud').classList.add('active');
  }, 1800);
}

function bossPickAttack(){
  const r = Math.random();
  if (boss.outrun / boss.outrunMax > 0.75){
    if (r < 0.4) return 'volley';
    if (r < 0.75) return 'deckgun';
    return 'minefield';
  }
  if (r < 0.45) return 'volley';
  if (r < 0.8)  return 'minefield';
  return 'deckgun';
}

function bossFireVolley(){
  const count = 7;
  for (let i=0;i<count;i++){
    const spread = (i - (count-1)/2) * 0.20;
    const ang = Math.PI/2 + spread + rand(-0.05,0.05);
    missiles.push({
      x: boss.x + (i - (count-1)/2)*18, y: boss.y + boss.h/2 - 10,
      vx: Math.cos(ang)*3.2, vy: Math.sin(ang)*3.2,
      life: 320, homing: 75, trail: [], fromBoss:true
    });
  }
  for (let i=0;i<24;i++){
    const a = rand(Math.PI*0.3, Math.PI*0.7);
    particles.push({x: boss.x+rand(-40,40), y: boss.y+boss.h/2-10, vx:Math.cos(a)*rand(1,4), vy:Math.sin(a)*rand(1,4),
      r:rand(2,5), life:20, max:20, color:'255,180,80'});
  }
  state.shake = Math.min(14, state.shake+3);
}

function bossFireMinefield(){
  const n = 4;
  for (let i=0;i<n;i++){
    mines.push({
      x: rand(PLAY_L+30, PLAY_R-30),
      y: boss.y + boss.h/2,
      r: rand(18, 22),
      bob: rand(0, Math.PI*2),
      alive: true, counted:false, fromBoss:true,
    });
  }
}

function bossFireDeckgun(){
  const tx = clamp(player.x + player.vx*12, PLAY_L+30, PLAY_R-30);
  const ty = clamp(player.y + rand(-40,40), 200, H-120);
  telegraphs.push({ x:tx, y:ty, r:0, maxR:80, timer:90, exploded:false });
}

export function updateBoss(dt){
  if (!boss.active) return;

  if (boss.phase === 'enter'){
    boss.entryT += dt;
    boss.y += (140 - boss.y) * 0.04;
    boss.x = W/2 + Math.sin(boss.entryT*0.02)*10;
    boss.phaseTimer -= dt;
    if (boss.phaseTimer <= 0 && Math.abs(boss.y - 140) < 5){
      boss.phase = 'fight';
      boss.attackTimer = 40;
    }
    return;
  }

  if (boss.phase === 'retreat'){
    boss.retreatTimer -= dt;
    boss.y -= 1.6;
    boss.x += Math.sin(state.t*0.04)*0.5;
    if (boss.y < -boss.h/2 - 40){
      boss.active = false;
      state.mode = 'victory';
      if (victoryCallback) setTimeout(victoryCallback, 600);
    }
    return;
  }

  // FIGHT phase
  boss.x += (W/2 + Math.sin(state.t*0.01)*80 - boss.x) * 0.01;
  boss.x = clamp(boss.x, PLAY_L+boss.w/2, PLAY_R-boss.w/2);

  const dx = player.x - boss.x, dy = player.y - (boss.y+boss.h/2);
  boss.turretAngle = Math.atan2(dy, dx);

  boss.outrun += getStage(state.stageIdx).scroll * 0.45;
  state.score += Math.round(getStage(state.stageIdx).scroll * 1.2);
  boss.hp = 1 - (boss.outrun / boss.outrunMax);
  if (boss.outrun >= boss.outrunMax){
    boss.phase = 'retreat';
    boss.retreatTimer = 200;
    state.score += 5000;
    return;
  }

  boss.attackTimer -= dt;
  if (boss.attackTimer <= 0){
    const kind = bossPickAttack();
    if      (kind === 'volley')    { bossFireVolley();    boss.attackTimer = rand(130, 170); }
    else if (kind === 'minefield') { bossFireMinefield(); boss.attackTimer = rand(110, 150); }
    else                           { bossFireDeckgun();   boss.attackTimer = rand( 90, 130); }
  }
}

export function drawBoss(ctx){
  const b = boss;
  ctx.save();
  ctx.translate(b.x, b.y);

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(4, b.h/2+10, b.w/2+6, 14, 0, 0, Math.PI*2); ctx.fill();

  ctx.fillStyle = '#1a1f26';
  ctx.beginPath();
  ctx.moveTo(-b.w/2+8, -b.h/2);
  ctx.lineTo(b.w/2-8, -b.h/2);
  ctx.lineTo(b.w/2, -b.h/2+40);
  ctx.lineTo(b.w/2-6, b.h/2-30);
  ctx.lineTo(0, b.h/2);
  ctx.lineTo(-b.w/2+6, b.h/2-30);
  ctx.lineTo(-b.w/2, -b.h/2+40);
  ctx.closePath(); ctx.fill();

  ctx.strokeStyle = '#3a4550'; ctx.lineWidth = 1.5; ctx.stroke();

  ctx.fillStyle = '#252d36';
  ctx.fillRect(-b.w/2+16, -b.h/2+12, b.w-32, 26);
  ctx.fillRect(-b.w/2+20, -b.h/2+50, b.w-40, 70);
  ctx.fillRect(-b.w/2+24, b.h/2-80, b.w-48, 50);

  ctx.strokeStyle = '#d4b020'; ctx.lineWidth = 2; ctx.setLineDash([6,4]);
  ctx.strokeRect(-b.w/2+28, -b.h/2+16, b.w-56, 18);
  ctx.setLineDash([]);
  ctx.fillStyle = '#d4b020';
  ctx.font = 'bold 10px "Share Tech Mono"';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('H', 0, -b.h/2+25);

  ctx.fillStyle = '#4a5560';
  ctx.fillRect(-36, -30, 72, 50);
  ctx.fillStyle = '#2e3840';
  ctx.fillRect(-30, -24, 60, 14);
  ctx.fillStyle = '#5a6a78';
  ctx.fillRect(-10, -44, 20, 14);
  ctx.fillStyle = '#7a8a98';
  ctx.fillRect(-4, -60, 8, 18);
  ctx.strokeStyle = '#b0c0d0'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0,-60); ctx.lineTo(0,-72); ctx.stroke();

  const radAng = state.t*0.04;
  ctx.save(); ctx.translate(0, -48); ctx.rotate(radAng);
  ctx.fillStyle = '#8a9aa8';
  ctx.beginPath(); ctx.ellipse(0, 0, 12, 3, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#4a5a68'; ctx.fillRect(-1,-1, 2, 8);
  ctx.restore();

  for (const sx of [-14, 14]){
    ctx.fillStyle = '#2a3038'; ctx.fillRect(sx-5, 20, 10, 14);
    ctx.fillStyle = '#1a1d22'; ctx.fillRect(sx-4, 20, 8, 2);
    if ((state.t|0)%6===0){
      particles.push({x: b.x+sx, y: b.y+22, vx:rand(-0.2,0.2), vy:rand(-0.6,-0.2),
        r:rand(4,7), life:50, max:50, color:'90,95,100', smoke:true});
    }
  }

  const turrets = [
    { x:0,  y:-b.h/2+70, size:1.1, tracking:false, fixed:Math.PI/2 },
    { x:0,  y:b.h/2-60,  size:1.3, tracking:true },
    { x:-28,y:b.h/2-30,  size:0.8, tracking:true },
    { x:28, y:b.h/2-30,  size:0.8, tracking:true },
  ];
  for (const t of turrets){
    ctx.save(); ctx.translate(t.x, t.y);
    ctx.fillStyle = '#363f4a';
    ctx.beginPath(); ctx.arc(0,0, 11*t.size, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#1a1d22'; ctx.lineWidth = 1; ctx.stroke();
    let ang;
    if (t.tracking){
      const ptx = player.x - b.x - t.x;
      const pty = player.y - b.y - t.y;
      ang = Math.atan2(pty, ptx);
    } else {
      ang = t.fixed;
    }
    ctx.rotate(ang - Math.PI/2);
    ctx.fillStyle = '#1a1d22';
    ctx.fillRect(-2*t.size, 0, 4*t.size, 20*t.size);
    ctx.fillStyle = '#2a2f36';
    ctx.fillRect(-3*t.size, 4*t.size, 6*t.size, 4*t.size);
    ctx.restore();
  }

  ctx.strokeStyle = 'rgba(255,60,80,0.6)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8,4]); ctx.lineDashOffset = state.t*0.4;
  ctx.beginPath();
  ctx.moveTo(-b.w/2+18, -b.h/2+8); ctx.lineTo(b.w/2-18, -b.h/2+8);
  ctx.stroke();
  ctx.setLineDash([]);

  if (b.outrun/b.outrunMax > 0.6 && Math.random() < 0.3){
    const ex = rand(-b.w/2+20, b.w/2-20), ey = rand(-b.h/2+20, b.h/2-20);
    for (let i=0;i<3;i++){
      const a = rand(0,Math.PI*2);
      particles.push({x:b.x+ex, y:b.y+ey, vx:Math.cos(a)*rand(0.5,2), vy:Math.sin(a)*rand(0.5,2),
        r:rand(1,3), life:Math.floor(rand(10,20)), max:20, color:'255,200,80'});
    }
  }

  ctx.strokeStyle = 'rgba(200,230,240,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x=-b.w/2+8; x<=b.w/2-8; x+=6){
    const yy = -b.h/2 + 2 + Math.sin((x+state.t*2)*0.1)*1.5;
    if (x===-b.w/2+8) ctx.moveTo(x,yy); else ctx.lineTo(x,yy);
  }
  ctx.stroke();

  ctx.restore();
}
