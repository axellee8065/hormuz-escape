import { particles, floatTexts, state } from '../state.js';
import { rand, randi } from '../util.js';

export function addExplosion(x, y, size=1, color='255,120,60'){
  const n = Math.floor(18*size);
  for (let i=0;i<n;i++){
    const a = rand(0, Math.PI*2), s=rand(1,5)*size;
    particles.push({x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s,
      r:rand(2,5)*size, life:randi(22,42), max:42, color});
  }
  particles.push({x, y, vx:0, vy:0, r:4*size, life:18, max:18, color:'255,220,180', ring:true, maxR:50*size});
  state.shake = Math.min(14, state.shake + 4*size);
}

export function addWake(x, y){
  particles.push({x:x+rand(-8,8), y, vx:rand(-0.3,0.3), vy:rand(0.2,0.8),
    r:rand(3,6), life:24, max:24, color:'230,240,255', wake:true});
}

export function addFloatText(x, y, txt, color){
  floatTexts.push({x, y, txt, color: color || '#e8f4ff', life:60, max:60});
}
