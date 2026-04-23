import { W, H } from './config.js';
import { state } from './state.js';
import { installInput } from './input.js';
import { update } from './systems/collision.js';
import { render } from './systems/render.js';
import { wireUI } from './ui/overlays.js';
import { initAudioOnFirstGesture } from './systems/audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let DPR = 1;

function resize(){
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width  = W * DPR; canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
resize(); window.addEventListener('resize', resize);

installInput(canvas);
initAudioOnFirstGesture();
wireUI();

let lastT = performance.now();
function loop(now){
  const dt = Math.min(2.5, (now - lastT) / (1000/60));
  lastT = now;
  if (['playing','stageIntro','bossIncoming','bossBattle','victory'].includes(state.mode)) update(dt);
  render(ctx);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
