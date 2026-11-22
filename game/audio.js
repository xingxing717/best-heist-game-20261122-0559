// audio.js — tiny synthesized sounds, no audio files: a WebAudio blip
// for pocketing loot, a low pulse while the alarm climbs, and a short
// getaway jingle on the win. Silent until the first user gesture.
let audioCtx = null;
let muted = false;
let gestured = false;

/** Mark that the player has interacted: sounds stay silent until then. */
export function markGesture() {
  gestured = true;
}

/** Create (or reuse) the audio context after a user gesture. */
export function ensureAudio() {
  if (!gestured) return null;
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
    return audioCtx;
  } catch {
    return null;
  }
}

/** Toggle the mute; returns the new muted state. */
export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

/** One short oscillator note. */
function note(freq, seconds, type, gainValue, when = 0) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const t = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(gainValue, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + seconds);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + seconds + 0.02);
}

/** Bright coin blip when loot is pocketed. */
export function playPickup() {
  note(880, 0.12, 'sine', 0.12);
  note(1318, 0.16, 'sine', 0.1, 0.07);
}

/** Low alarm thud, called as the alarm climbs past a notch. */
export function playAlarmTick() {
  note(196, 0.18, 'square', 0.06);
}

/** Dull thud when a smoke pellet lands. */
export function playSmoke() {
  note(140, 0.25, 'triangle', 0.1);
  note(90, 0.3, 'triangle', 0.08, 0.05);
}

/** Electric zap for the EMP burst. */
export function playEmp() {
  note(1200, 0.08, 'sawtooth', 0.05);
  note(500, 0.14, 'sawtooth', 0.05, 0.06);
}

/** Harsh sting when the thief is caught. */
export function playCaught() {
  note(220, 0.3, 'sawtooth', 0.12);
  note(110, 0.5, 'sawtooth', 0.12, 0.15);
}

/** Little getaway jingle on the win. */
export function playWin() {
  const seq = [523, 659, 784, 1046];
  seq.forEach((f, i) => note(f, 0.22, 'sine', 0.12, i * 0.12));
}
