// Procedural audio — no external assets. Single shared AudioContext,
// initialized lazily on first user gesture (browser autoplay policy).
import { LS } from '../util.js';

const MASTER_VOL = 0.35;
let ctx = null;
let master = null;
let muted = !!LS.get('hormuz.muted', false);
let lastBoatAt = 0;

function ensureCtx(){
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : MASTER_VOL;
  master.connect(ctx.destination);
  return ctx;
}

export function initAudioOnFirstGesture(){
  const start = () => {
    const c = ensureCtx();
    if (c && c.state === 'suspended') c.resume();
  };
  document.addEventListener('pointerdown', start, { passive: true });
  document.addEventListener('keydown', start, { passive: true });
  document.addEventListener('touchstart', start, { passive: true });
}

export function toggleMute(){
  muted = !muted;
  LS.set('hormuz.muted', muted);
  if (master) master.gain.value = muted ? 0 : MASTER_VOL;
  return muted;
}

export function isMuted(){ return muted; }

// ---------- primitives ----------

function noiseBuffer(duration){
  const len = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i=0;i<len;i++) data[i] = Math.random()*2 - 1;
  return buf;
}

function playNoise({ duration = 0.3, filterFreq = 1000, filterQ = 1, filterType = 'lowpass', volume = 0.4, sweep = 0 }){
  if (!ensureCtx()) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(duration);
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.Q.value = filterQ;
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  filter.frequency.setValueAtTime(filterFreq, now);
  if (sweep) filter.frequency.exponentialRampToValueAtTime(Math.max(40, filterFreq * sweep), now + duration);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0005, now + duration);
  src.connect(filter); filter.connect(gain); gain.connect(master);
  src.start(now);
  src.stop(now + duration + 0.02);
}

function playTone({ freq = 440, duration = 0.2, type = 'sine', volume = 0.2, attack = 0.005, release = null, pitchEnd = null, delay = 0 }){
  if (!ensureCtx()) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime + delay;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (pitchEnd !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, pitchEnd), now + duration);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + Math.min(attack, duration * 0.5));
  const rel = release ?? Math.max(0.01, duration - attack);
  gain.gain.exponentialRampToValueAtTime(0.0005, now + attack + rel);
  osc.connect(gain); gain.connect(master);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

// ---------- catalog ----------

export const sfx = {
  explosion(intensity = 1){
    if (!ensureCtx()) return;
    playNoise({
      duration: 0.22 + 0.18 * intensity,
      filterType: 'lowpass',
      filterFreq: 2800 / Math.max(1, intensity),
      filterQ: 1.3,
      volume: Math.min(0.9, 0.35 * intensity),
      sweep: 0.15,
    });
    if (intensity >= 0.9){
      playTone({ freq: 90, pitchEnd: 32, duration: 0.22 + intensity * 0.05, type: 'sine', volume: 0.35, attack: 0.003 });
    }
  },

  mineBoom(intensity = 1){
    if (!ensureCtx()) return;
    playNoise({
      duration: 0.45 + intensity * 0.15,
      filterType: 'lowpass',
      filterFreq: 700,
      filterQ: 2.2,
      volume: Math.min(0.9, 0.45 * intensity),
      sweep: 0.1,
    });
    playTone({ freq: 60, pitchEnd: 26, duration: 0.38, type: 'sine', volume: 0.5, attack: 0.004 });
  },

  missileLaunch(fromBoss = false){
    if (!ensureCtx()) return;
    playNoise({
      duration: fromBoss ? 0.38 : 0.26,
      filterType: 'bandpass',
      filterFreq: fromBoss ? 800 : 1600,
      filterQ: 1.8,
      volume: fromBoss ? 0.32 : 0.22,
      sweep: fromBoss ? 3.2 : 2.2,
    });
    playTone({
      freq: fromBoss ? 140 : 220,
      pitchEnd: fromBoss ? 560 : 880,
      duration: fromBoss ? 0.24 : 0.18,
      type: 'sawtooth',
      volume: 0.10,
    });
  },

  rpg(){
    if (!ensureCtx()) return;
    playNoise({ duration: 0.22, filterType: 'bandpass', filterFreq: 600, filterQ: 2.2, volume: 0.38, sweep: 2.5 });
    playTone({ freq: 180, pitchEnd: 55, duration: 0.18, type: 'square', volume: 0.13 });
  },

  shield(){
    if (!ensureCtx()) return;
    playTone({ freq: 880, pitchEnd: 1320, duration: 0.15, type: 'sine', volume: 0.26 });
    playTone({ freq: 660, pitchEnd: 990, duration: 0.13, type: 'triangle', volume: 0.14, delay: 0.01 });
  },

  pickup(kind){
    if (!ensureCtx()) return;
    const notes = kind === 'shield' ? [523, 659, 784]      // C-E-G
                : kind === 'speed'  ? [523, 698, 880]       // C-F-A
                :                      [392, 523, 659];     // G-C-E (repair)
    notes.forEach((n, i) => playTone({
      freq: n, duration: 0.14, type: 'triangle', volume: 0.22, delay: i * 0.06,
    }));
  },

  deckgunCharge(){
    if (!ensureCtx()) return;
    playTone({ freq: 320, pitchEnd: 780, duration: 1.3, type: 'triangle', volume: 0.12, attack: 0.05 });
  },

  deckgunBoom(){
    if (!ensureCtx()) return;
    // Heavy impact: scaled explosion + sub-bass
    playNoise({
      duration: 0.55,
      filterType: 'lowpass',
      filterFreq: 1200,
      filterQ: 1.5,
      volume: 0.85,
      sweep: 0.1,
    });
    playTone({ freq: 45, pitchEnd: 22, duration: 0.55, type: 'sine', volume: 0.6, attack: 0.003 });
  },

  bossWarn(){
    if (!ensureCtx()) return;
    const tick = 0.14;
    for (let i=0;i<5;i++){
      playTone({
        freq: i % 2 === 0 ? 660 : 440,
        duration: tick,
        type: 'square',
        volume: 0.18,
        delay: i * tick,
      });
    }
  },

  boatEngine(){
    if (!ensureCtx()) return;
    const now = performance.now();
    if (now - lastBoatAt < 350) return;
    lastBoatAt = now;
    playNoise({ duration: 0.26, filterType: 'lowpass', filterFreq: 320, filterQ: 2.8, volume: 0.15 });
    playTone({ freq: 62, duration: 0.22, type: 'sawtooth', volume: 0.08 });
  },

  gameOver(){
    if (!ensureCtx()) return;
    const notes = [440, 370, 294, 247]; // A4-F#4-D4-B3 descending
    notes.forEach((n, i) => playTone({
      freq: n, duration: 0.36, type: 'sawtooth', volume: 0.22, delay: i * 0.18,
    }));
  },

  victory(){
    if (!ensureCtx()) return;
    const notes = [523, 659, 784, 1046]; // C-E-G-C ascending
    notes.forEach((n, i) => playTone({
      freq: n, duration: 0.30, type: 'triangle', volume: 0.25, delay: i * 0.12,
    }));
  },
};
