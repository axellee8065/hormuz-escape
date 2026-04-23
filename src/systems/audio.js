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
  if (!AC){ console.warn('[audio] AudioContext unsupported'); return null; }
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : MASTER_VOL;
  master.connect(ctx.destination);
  console.info('[audio] ctx created, state:', ctx.state, 'sr:', ctx.sampleRate, 'muted:', muted);
  return ctx;
}

export function initAudioOnFirstGesture(){
  const start = () => {
    const c = ensureCtx();
    if (c && c.state === 'suspended') {
      c.resume().then(() => console.info('[audio] resumed, state:', c.state));
    }
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

// ---------- BGM ----------
// Procedural looping track. Two modes: 'normal' (exploration) and 'boss'
// (driving). Uses Web Audio scheduling with a setInterval lookahead.

const BGM_VOL = 0.20;
let bgmMode = null;
let bgmGain = null;
let bgmTimerId = null;
let bgmNextT = 0;
let bgmStep = 0;

function ensureBgmGain(){
  if (bgmGain) return bgmGain;
  if (!ensureCtx()) return null;
  bgmGain = ctx.createGain();
  bgmGain.gain.value = 0;
  bgmGain.connect(master);
  return bgmGain;
}

function noteFreq(midi){ return 440 * Math.pow(2, (midi - 69) / 12); }

// [bassMidi, arpMidi[]] per bar. Arp length == stepsPerBar (8).
const BGM = {
  normal: {
    bpm: 102, stepsPerBar: 8,
    chords: [
      [ 45, [57, 60, 64, 67, 64, 60, 64, 57] ],  // Am
      [ 41, [53, 57, 60, 65, 60, 57, 60, 53] ],  // F
      [ 43, [55, 59, 62, 67, 62, 59, 62, 55] ],  // G
      [ 40, [52, 55, 59, 64, 59, 55, 59, 52] ],  // Em
    ],
  },
  boss: {
    bpm: 132, stepsPerBar: 8,
    chords: [
      [ 33, [57, 60, 64, 69, 72, 69, 64, 60] ],  // Am (driving)
      [ 28, [52, 56, 59, 64, 68, 64, 59, 56] ],  // E7
    ],
  },
};

function bgmNote(time, freq, dur, type, vol){
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0005, time + dur);
  osc.connect(gain); gain.connect(bgmGain);
  osc.start(time);
  osc.stop(time + dur + 0.05);
}

function bgmKick(time, vol = 0.42){
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(130, time);
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.13);
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.0005, time + 0.18);
  osc.connect(gain); gain.connect(bgmGain);
  osc.start(time); osc.stop(time + 0.2);
}

function bgmHat(time, vol = 0.09){
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(0.05);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass'; filter.frequency.value = 7000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.0005, time + 0.04);
  src.connect(filter); filter.connect(gain); gain.connect(bgmGain);
  src.start(time); src.stop(time + 0.06);
}

function pumpBgm(){
  if (!ctx || !bgmMode) return;
  const pat = BGM[bgmMode];
  const stepDur = (60 / pat.bpm) / 2;   // 8th notes
  const SPB = pat.stepsPerBar;

  while (bgmNextT < ctx.currentTime + 0.25){
    const chordIdx = Math.floor(bgmStep / SPB) % pat.chords.length;
    const inBar = bgmStep % SPB;
    const [bassMidi, arp] = pat.chords[chordIdx];

    // Arpeggio every 8th
    bgmNote(bgmNextT, noteFreq(arp[inBar]), stepDur * 0.85, 'triangle', 0.09);

    // Bass at start of each chord (hold for full bar)
    if (inBar === 0){
      bgmNote(bgmNextT, noteFreq(bassMidi), stepDur * SPB * 0.95, 'sawtooth', 0.13);
    }

    // Kick: normal on beats 1 & 3; boss on every beat (0,2,4,6)
    if (bgmMode === 'normal'){
      if (inBar === 0 || inBar === 4) bgmKick(bgmNextT);
    } else {
      if (inBar % 2 === 0) bgmKick(bgmNextT, 0.36);
    }

    // Hi-hat on off-beats (odd steps)
    if (inBar % 2 === 1) bgmHat(bgmNextT);

    bgmNextT += stepDur;
    bgmStep++;
  }
}

export function startBgm(mode){
  if (!ensureCtx()) return;
  if (bgmMode === mode) return;
  const bg = ensureBgmGain();
  if (!bg) return;
  const switching = bgmMode !== null;
  bgmMode = mode;
  bgmStep = 0;
  bgmNextT = ctx.currentTime + (switching ? 0.2 : 0.05);

  const now = ctx.currentTime;
  bg.gain.cancelScheduledValues(now);
  bg.gain.setValueAtTime(bg.gain.value, now);
  if (switching){
    // dip + back up to hide mode change
    bg.gain.linearRampToValueAtTime(0, now + 0.15);
    bg.gain.linearRampToValueAtTime(muted ? 0 : BGM_VOL, now + 0.7);
  } else {
    bg.gain.linearRampToValueAtTime(muted ? 0 : BGM_VOL, now + 1.1);
  }

  if (!bgmTimerId) bgmTimerId = setInterval(pumpBgm, 50);
}

export function stopBgm(fadeSec = 1.2){
  if (!bgmMode) return;
  if (bgmGain && ctx){
    const now = ctx.currentTime;
    bgmGain.gain.cancelScheduledValues(now);
    bgmGain.gain.setValueAtTime(bgmGain.gain.value, now);
    bgmGain.gain.linearRampToValueAtTime(0, now + fadeSec);
  }
  bgmMode = null;
  if (bgmTimerId){
    const tid = bgmTimerId;
    bgmTimerId = null;
    setTimeout(() => clearInterval(tid), fadeSec * 1000 + 50);
  }
}

export function pauseBgm(){
  if (!bgmMode || !ctx || !bgmGain) return;
  if (bgmTimerId){ clearInterval(bgmTimerId); bgmTimerId = null; }
  const now = ctx.currentTime;
  bgmGain.gain.cancelScheduledValues(now);
  bgmGain.gain.setValueAtTime(bgmGain.gain.value, now);
  bgmGain.gain.linearRampToValueAtTime(0, now + 0.12);
}

export function resumeBgm(){
  if (!bgmMode || bgmTimerId || !ctx || !bgmGain) return;
  bgmNextT = ctx.currentTime + 0.05;
  const now = ctx.currentTime;
  bgmGain.gain.cancelScheduledValues(now);
  bgmGain.gain.setValueAtTime(bgmGain.gain.value, now);
  bgmGain.gain.linearRampToValueAtTime(muted ? 0 : BGM_VOL, now + 0.25);
  bgmTimerId = setInterval(pumpBgm, 50);
}
