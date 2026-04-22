import { state, player, resetRun, boss } from '../state.js';
import { getStage } from '../config.js';
import { LS } from '../util.js';
import { Board } from '../net/supabase.js';
import { TikTrix } from '../net/tiktrix.js';
import { addExplosion } from '../systems/fx.js';
import { setOnDead, hitPlayer } from '../entities/player.js';
import { setVictoryCallback } from '../entities/boss.js';
import { setStageIntroCallback } from '../systems/collision.js';

// User identity
export const User = {
  id:   LS.get('hormuz.userId', null) || TikTrix.ctx.userId || ('u_' + Math.random().toString(36).slice(2,10)),
  name: LS.get('hormuz.userName', null) || TikTrix.ctx.userName || null,
  save(name){
    this.name = name.trim().slice(0,18);
    LS.set('hormuz.userName', this.name);
    LS.set('hormuz.userId', this.id);
    document.getElementById('captainName').textContent = this.name;
  }
};

export function triggerStageIntro(){
  state.mode = 'stageIntro';
  const stage = getStage(state.stageIdx);
  const card = document.getElementById('stageCard');
  card.classList.remove('boss');
  document.getElementById('stageNum').textContent = 'STAGE ' + String(stage.id).padStart(2,'0');
  document.getElementById('stageName').textContent = stage.name;
  document.getElementById('stageDesc').textContent = stage.kr;
  document.getElementById('stageOverlay').classList.remove('hidden');
  setTimeout(()=>{
    document.getElementById('stageOverlay').classList.add('hidden');
    if (state.hp > 0) state.mode = 'playing';
  }, 1400);
}

export function startGame(){
  if (!User.name){
    document.getElementById('menuOverlay').classList.add('hidden');
    document.getElementById('nameOverlay').classList.remove('hidden');
    setTimeout(()=>document.getElementById('nameInput').focus(), 100);
    return;
  }
  resetRun();
  document.getElementById('menuOverlay').classList.add('hidden');
  document.getElementById('overOverlay').classList.add('hidden');
  document.getElementById('boardOverlay').classList.add('hidden');
  document.getElementById('nameOverlay').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('pauseBtn').style.display = 'flex';
  const hint = document.createElement('div');
  hint.className = 'control-hint';
  hint.textContent = '◄  DRAG TO STEER  ►';
  document.getElementById('gameWrap').appendChild(hint);
  setTimeout(()=>hint.remove(), 2400);
  TikTrix.start();
  state.mode = 'playing';
}

function gameOver(){
  if (state.mode === 'dead') return;
  state.mode = 'dead';
  addExplosion(player.x, player.y, 2.5, '255,90,50');
  addExplosion(player.x-20, player.y-30, 1.8, '255,200,100');
  addExplosion(player.x+15, player.y+20, 1.8, '255,160,80');
  document.getElementById('pauseBtn').style.display = 'none';
  document.getElementById('bossHud').classList.remove('active');
  setTimeout(()=>showResults(false), 1200);
}

function showVictory(){
  state.mode = 'victory';
  document.getElementById('pauseBtn').style.display = 'none';
  document.getElementById('bossHud').classList.remove('active');
  showResults(true);
}

async function showResults(isWin){
  document.getElementById('hud').classList.add('hidden');
  const finalScore = state.score;
  document.getElementById('finalScore').textContent = finalScore.toLocaleString();
  document.getElementById('finalDist').textContent = (state.totalDist/10).toFixed(0) + ' NM';
  document.getElementById('finalStage').textContent = state.stageIdx + (isWin ? ' ✓' : '');

  const t = document.getElementById('goverTitle');
  const s = document.getElementById('goverSub');
  if (isWin){
    t.textContent = 'ESCAPED'; t.classList.add('win');
    s.textContent = '// STRAIT CLEARED //';
  } else {
    t.textContent = 'SUNK'; t.classList.remove('win');
    s.textContent = '// MISSION FAILED //';
  }

  const best = LS.get('hormuz.best', 0);
  if (finalScore > best) LS.set('hormuz.best', finalScore);
  document.getElementById('bestScore').textContent = Math.max(best, finalScore).toLocaleString();

  TikTrix.end(finalScore, {
    stage: state.stageIdx,
    distance: Math.round(state.totalDist),
    durationSec: Math.round((Date.now()-state.startedAt)/1000),
    win: isWin,
  });

  document.getElementById('finalRank').textContent = '...';
  const submitResult = await Board.submit({
    user_id:    User.id,
    user_name:  User.name || 'ANONYMOUS',
    score:      finalScore,
    stage:      state.stageIdx,
    distance:   Math.round(state.totalDist),
    duration_s: Math.round((Date.now()-state.startedAt)/1000),
    meta:       { win: isWin, buffs_used: state.buffs }
  });

  if (submitResult.ok){
    const top = await Board.top(100);
    if (top){
      const above = top.filter(r => (r.score|0) > finalScore).length;
      document.getElementById('finalRank').textContent = '#' + (above+1);
    } else {
      document.getElementById('finalRank').textContent = '#--';
    }
  } else {
    document.getElementById('finalRank').textContent = submitResult.local ? 'LOCAL' : '--';
  }

  document.getElementById('overOverlay').classList.remove('hidden');
}

async function openLeaderboard(){
  document.getElementById('menuOverlay').classList.add('hidden');
  document.getElementById('overOverlay').classList.add('hidden');
  document.getElementById('boardOverlay').classList.remove('hidden');
  const list = document.getElementById('boardList');
  list.innerHTML = `<div class="board-head"><span>#</span><span>CAPTAIN</span><span>SCORE</span></div>
                    <div class="board-empty">Loading...</div>`;
  let rows = await Board.top(30);
  if (!rows){
    const best = LS.get('hormuz.best', 0);
    rows = [
      { user_name:'KIM, MINSOO',  score: Math.max(best+2400, 8400) },
      { user_name:'NAVIGATOR-07', score: Math.max(best+1200, 6800) },
      { user_name:'TANG, WEI',    score: Math.max(best+800,  5600) },
      { user_name: User.name || 'YOU', user_id: User.id, score: best },
      { user_name:'AHMED, R.',    score: Math.max(best-500,  2400) },
      { user_name:'LEE, SH',      score: Math.max(best-1200, 1800) },
    ].sort((a,b)=>b.score-a.score);
  }
  list.innerHTML = `<div class="board-head"><span>#</span><span>CAPTAIN</span><span>SCORE</span></div>`;
  if (!rows.length){
    list.innerHTML += `<div class="board-empty">No scores yet — set the first!</div>`;
  } else {
    rows.forEach((r,i)=>{
      const rankClass = i<3 ? ' top' : '';
      const meClass = (r.user_id && r.user_id === User.id) ? ' me' : '';
      const name = (r.user_name || 'ANON').toString().slice(0,18);
      list.innerHTML += `
        <div class="board-row${meClass}">
          <span class="rank${rankClass}">${String(i+1).padStart(2,'0')}</span>
          <span>${name}</span>
          <span class="score">${(r.score|0).toLocaleString()}</span>
        </div>`;
    });
  }
}

export function wireUI(){
  if (User.name) document.getElementById('captainName').textContent = User.name;
  LS.set('hormuz.userId', User.id);

  // connection pill
  const pill = document.getElementById('txPill');
  const parts = [];
  parts.push('SUPABASE · <b' + (Board.enabled ? '' : ' class="err"') + '>' + (Board.enabled?'LIVE':'OFFLINE') + '</b>');
  if (TikTrix.enabled) parts.push('TIKTRIX · <b>EMBED</b>');
  pill.innerHTML = parts.join(' · ');

  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('retryBtn').addEventListener('click', startGame);
  document.getElementById('boardBtn').addEventListener('click', openLeaderboard);
  document.getElementById('showBoardBtn').addEventListener('click', openLeaderboard);
  document.getElementById('closeBoardBtn').addEventListener('click', ()=>{
    document.getElementById('boardOverlay').classList.add('hidden');
    if (state.mode === 'dead' || state.mode === 'victory') document.getElementById('overOverlay').classList.remove('hidden');
    else document.getElementById('menuOverlay').classList.remove('hidden');
  });
  document.getElementById('pauseBtn').addEventListener('click', ()=>{
    if (state.mode === 'playing' || state.mode === 'bossBattle'){
      state._paused = state.mode; state.mode = 'paused';
      document.getElementById('pauseBtn').textContent = '▶';
    } else if (state.mode === 'paused'){
      state.mode = state._paused || 'playing';
      document.getElementById('pauseBtn').textContent = 'II';
    }
  });
  document.getElementById('nameSaveBtn').addEventListener('click', ()=>{
    const v = (document.getElementById('nameInput').value || '').trim();
    if (!v){ document.getElementById('nameInput').focus(); return; }
    User.save(v);
    document.getElementById('nameOverlay').classList.add('hidden');
    startGame();
  });
  document.getElementById('captainName').addEventListener('click', ()=>{
    document.getElementById('menuOverlay').classList.add('hidden');
    document.getElementById('nameOverlay').classList.remove('hidden');
    document.getElementById('nameInput').value = User.name || '';
    setTimeout(()=>document.getElementById('nameInput').focus(), 100);
  });
  document.getElementById('nameInput').addEventListener('keydown', e=>{
    if (e.key === 'Enter') document.getElementById('nameSaveBtn').click();
  });
  document.getElementById('bestScore').textContent = (LS.get('hormuz.best', 0)).toLocaleString();

  // cross-module callbacks
  setOnDead(gameOver);
  setVictoryCallback(showVictory);
  setStageIntroCallback(triggerStageIntro);

  // Dev hotkeys
  addEventListener('keydown', e=>{
    if (e.code==='KeyG' && (state.mode==='playing' || state.mode==='bossBattle')) hitPlayer(999);
    if (e.code==='KeyB' && state.mode==='playing'){
      state.stageIdx=5; state.stageDist = getStage(5).dist - 20;
    }
  });

  TikTrix.ready();
}
