import { state, boss } from '../state.js';

export function updateHUD(){
  const hpPct = (state.hp / state.maxHp) * 100;
  const fill = document.getElementById('hpFill');
  fill.style.width = hpPct + '%';
  fill.classList.toggle('low',  hpPct < 30);
  fill.classList.toggle('mid',  hpPct >= 30 && hpPct < 60);
  document.getElementById('hpText').textContent = Math.round(hpPct) + '%';
  document.getElementById('scoreText').textContent = state.score.toLocaleString();
  document.getElementById('stageText').textContent = 'STAGE ' + state.stageIdx;
  document.getElementById('distText').textContent = (state.totalDist/10).toFixed(0) + ' NM';

  const row = document.getElementById('buffRow');
  let html = '';
  if (state.buffs.shield > 0){
    const s = (state.buffs.shield/60).toFixed(1);
    html += `<div class="buff-pill shield"><span class="buff-icon">◆</span> SHIELD ${s}s</div>`;
  }
  if (state.buffs.speed > 0){
    const s = (state.buffs.speed/60).toFixed(1);
    html += `<div class="buff-pill speed"><span class="buff-icon">⚡</span> BOOST ${s}s</div>`;
  }
  row.innerHTML = html;

  if (boss.active && (state.mode==='bossBattle' || state.mode==='bossIncoming')){
    document.getElementById('bossHud').classList.add('active');
    const pct = Math.max(0, boss.hp*100);
    document.getElementById('bossFill').style.width = pct + '%';
    const outPct = Math.min(100, Math.round((boss.outrun/boss.outrunMax)*100));
    document.getElementById('outrunText').textContent = 'OUTRUN ' + outPct + '%';
  } else {
    document.getElementById('bossHud').classList.remove('active');
  }
}
