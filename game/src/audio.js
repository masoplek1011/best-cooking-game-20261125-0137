// Hearthrow Hustle — tiny WebAudio bleeps. No audio files, no network:
// a handful of oscillator blips for chop, sizzle-ready, serve and error.
// The context is created lazily on first user gesture, so the title screen
// stays silent until the player interacts.

let ctx = null;
let muted = false;

export function initAudio() {
  if (ctx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  } catch {
    ctx = null;
  }
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function blip(freq, seconds, type, gainValue, when) {
  if (!ctx || muted) return;
  try {
    if (ctx.state === 'suspended') void ctx.resume();
    const t0 = ctx.currentTime + (when || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(gainValue || 0.08, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.05);
  } catch {
    // Sound is garnish: a failed blip never breaks the game.
  }
}

export const sfx = {
  chop() { blip(220, 0.07, 'triangle', 0.12); },
  pickup() { blip(520, 0.08, 'sine', 0.07); },
  place() { blip(340, 0.06, 'sine', 0.07); },
  ready() { blip(660, 0.12, 'sine', 0.09); blip(880, 0.16, 'sine', 0.09, 0.09); },
  serve() { blip(523, 0.1, 'sine', 0.1); blip(659, 0.1, 'sine', 0.1, 0.08); blip(784, 0.18, 'sine', 0.1, 0.16); },
  error() { blip(140, 0.15, 'square', 0.05); },
  tick() { blip(980, 0.04, 'sine', 0.04); },
  burnt() { blip(110, 0.3, 'sawtooth', 0.06); },
};
