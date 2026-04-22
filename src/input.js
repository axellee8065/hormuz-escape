import { W } from './config.js';

export const input = { x: W/2, active: false };
export const keys = {};

export function installInput(canvas){
  function pointerXY(e){
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {
      x: ((t.clientX - rect.left) / rect.width)  * W,
      y: ((t.clientY - rect.top)  / rect.height) * 960,
    };
  }
  canvas.addEventListener('mousedown', e=>{ const p=pointerXY(e); input.x=p.x; input.active=true; e.preventDefault?.(); });
  canvas.addEventListener('mousemove', e=>{ if(!input.active) return; const p=pointerXY(e); input.x=p.x; e.preventDefault?.(); });
  canvas.addEventListener('mouseup',   ()=>{input.active=false;});
  canvas.addEventListener('touchstart', e=>{const p=pointerXY(e); input.x=p.x; input.active=true; e.preventDefault();},{passive:false});
  canvas.addEventListener('touchmove',  e=>{if(!input.active) return; const p=pointerXY(e); input.x=p.x; e.preventDefault();},{passive:false});
  canvas.addEventListener('touchend',   ()=>{input.active=false;});

  addEventListener('keydown', e=>{keys[e.code]=true;});
  addEventListener('keyup',   e=>{keys[e.code]=false;});
}
