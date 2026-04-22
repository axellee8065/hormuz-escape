const q = new URLSearchParams(location.search);
const ctx = {
  providerId: q.get('providerId') || null,
  gameId:     q.get('gameId')     || 'hormuz-escape',
  userId:     q.get('userId')     || null,
  userName:   q.get('userName')   || null,
  token:      q.get('token')      || null,
  sessionId:  q.get('sessionId')  || ('local-' + Math.random().toString(36).slice(2, 10)),
  inFrame:    window.parent !== window,
};

function post(type, payload){
  const msg = { type, source: 'hormuz-escape', ...ctx, ...payload };
  try { if (ctx.inFrame) window.parent.postMessage(msg, '*'); } catch(e){}
  try { window.dispatchEvent(new CustomEvent('tiktrix:event',{detail:msg})); } catch(e){}
}

export const TikTrix = {
  ctx, enabled: ctx.inFrame,
  ready(){ post('TIKTRIX_READY'); },
  start(){ post('TIKTRIX_GAME_START', { startedAt: Date.now() }); },
  end(score, meta){
    post('TIKTRIX_GAME_END', { score, meta, endedAt: Date.now() });
    post('TIKTRIX_SCORE',    { score, meta });
  }
};
