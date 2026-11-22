// main.js — VELVET SHADOW: The Meridian Gallery Heist. Boots the canvas,
// runs the frame loop, reads keyboard and mouse, and paints the title,
// playing, caught and won screens. The ?shot=cover|loot|alarm|win query
// stages a scene for screenshots: it starts the heist mid-action with the
// thief, guards, cameras and loot already in frame.
import { WORLD_W, WORLD_H, LOOT_TARGET } from './level.js';
import { makeState, startHeist, updateState } from './state.js';
import { drawScene } from './render.js';
import { drawGuard } from './guards.js';
import { drawCamera } from './cameras.js';
import { drawLootItem } from './loot.js';
import { drawPlayer, drawSmoke } from './player.js';
import { drawHud, drawPanel, formatTime } from './hud.js';
import { ensureAudio, toggleMute, isMuted, markGesture } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = WORLD_W;
canvas.height = WORLD_H;

const state = makeState();
const keys = new Set();
let clicks = [];
let tools = [];
let mouse = { x: WORLD_W / 2, y: WORLD_H / 2 };
let lastTime = performance.now();

// Test hook: puppeteer play-tests read window.__heist for live state.
window.__heist = { state, keys };

/** Canvas pixel coordinates of a mouse event, scaled to world pixels. */
function eventWorldPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * WORLD_W,
    y: ((e.clientY - rect.top) / rect.height) * WORLD_H,
  };
}

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  markGesture();
  ensureAudio();
  if (k === 'r' && state.phase !== 'title') startHeist(state);
  if (k === 'm') toggleMute();
  if (k === '2') tools.push('emp');
  if (k === 'enter' && state.phase === 'title') startHeist(state);
  if (k === 'enter' && (state.phase === 'caught' || state.phase === 'won')) startHeist(state);
  keys.add(k);
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
canvas.addEventListener('mousemove', (e) => { mouse = eventWorldPos(e); });
canvas.addEventListener('mousedown', (e) => {
  markGesture();
  ensureAudio();
  const pos = eventWorldPos(e);
  if (state.phase === 'title') { startHeist(state); return; }
  if (state.phase === 'caught' || state.phase === 'won') { startHeist(state); return; }
  clicks.push(pos);
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

/** Paint the title screen over the gallery. */
function drawTitle(time) {
  drawScene(ctx, false, time);
  for (const item of state.loot) drawLootItem(ctx, item, time);
  drawPanel(ctx, [
    { text: 'VELVET SHADOW', font: 'bold 44px sans-serif', color: '#e9c46a', gap: 52 },
    { text: 'The Meridian Gallery Heist', font: 'bold 20px sans-serif', color: '#ffe9a8', gap: 34 },
    { text: 'Slip in after dark. Pocket $50,000 of the gallery\u2019s treasures.', color: '#f4f1e6', gap: 26 },
    { text: 'Dodge the guards\u2019 cones and the sweeping cameras —', color: '#f4f1e6', gap: 26 },
    { text: 'if the alarm hits 100%, the night is over.', color: '#f4f1e6', gap: 26 },
    { text: 'WASD / arrows move · Shift sneak · Click: smoke pellet · 2: EMP · M: mute', color: '#b8c7e0', gap: 40 },
    { text: 'CLICK OR PRESS ENTER TO BEGIN', font: 'bold 18px sans-serif', color: '#3ddc97', gap: 26 },
  ], '#e9c46a');
}

/** Paint the caught screen. */
function drawCaught() {
  drawPanel(ctx, [
    { text: 'CAUGHT!', font: 'bold 40px sans-serif', color: '#ff4656', gap: 48 },
    { text: state.caughtBy || 'The gallery guards closed in.', color: '#f4f1e6', gap: 30 },
    { text: `Haul: $${state.lootValue.toLocaleString('en-US')} of $${LOOT_TARGET.toLocaleString('en-US')} · Time ${formatTime(state.time)}`, color: '#ffe9a8', gap: 40 },
    { text: 'Press R or click to try the gallery again.', color: '#b8c7e0', gap: 26 },
  ], '#ff4656');
}

/** Paint the win screen. */
function drawWon() {
  drawPanel(ctx, [
    { text: 'CLEAN GETAWAY!', font: 'bold 40px sans-serif', color: '#3ddc97', gap: 48 },
    { text: 'Wren slips into the night with the gallery\u2019s finest.', color: '#f4f1e6', gap: 30 },
    { text: `Haul: $${state.lootValue.toLocaleString('en-US')} · Time ${formatTime(state.time)}`, color: '#ffe9a8', gap: 30 },
    { text: `SCORE: ${state.score.toLocaleString('en-US')}`, font: 'bold 22px sans-serif', color: '#e9c46a', gap: 40 },
    { text: 'Press R or click to run it again — faster, quieter.', color: '#b8c7e0', gap: 26 },
  ], '#3ddc97');
}

/** Paint one frame for the current phase. */
function draw(time) {
  const lootReady = state.lootValue >= LOOT_TARGET;
  if (state.phase === 'title') { drawTitle(time); return; }
  drawScene(ctx, lootReady, time);
  for (const c of state.cameras) drawCamera(ctx, c, state.time, time);
  for (const item of state.loot) drawLootItem(ctx, item, time);
  for (const g of state.guards) drawGuard(ctx, g, time);
  for (const cloud of state.smoke) drawSmoke(ctx, cloud);
  if (state.player.alive) drawPlayer(ctx, state.player, time);
  drawHud(ctx, state);
  if (isMuted()) {
    ctx.fillStyle = '#8b98a8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('MUTED (M)', 946, 632);
  }
  if (state.phase === 'caught') drawCaught();
  if (state.phase === 'won') drawWon();
}

/** The frame loop: fixed small steps, then paint. */
function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  const time = now / 1000;
  if (state.phase === 'playing') {
    updateState(state, dt, keys, clicks, tools);
  }
  clicks = [];
  tools = [];
  draw(time);
  requestAnimationFrame(frame);
}

// --- Screenshot staging (?shot=...) -------------------------------------
// Each staged scene starts the heist mid-action so the frame already shows
// the thief crossing a room, guard cones, a camera, loot and the alarm bar.
function stageShot(kind) {
  startHeist(state);
  state.staged = true;
  state.player.staged = true;
  const p = state.player;
  if (kind === 'cover') {
    // Mid-gallery crossing: thief between the statues, hall guard sweeping
    // across, vault camera in frame, ruby glowing, alarm already warm.
    p.x = 470; p.y = 350; p.facing = -Math.PI / 2;
    state.guards[0].x = 420; state.guards[0].y = 280; state.guards[0].facing = 0.6; state.guards[0].pause = 2;
    state.guards[3].x = 590; state.guards[3].y = 210; state.guards[3].facing = Math.PI * 0.75; state.guards[3].pause = 2;
    state.alarm = 15;
    state.lootValue = 12000;
    state.loot[1].taken = true; // Jade Idol already pocketed.
  } else if (kind === 'loot') {
    // At the vault door, reaching for the Sunheart Ruby.
    p.x = 480; p.y = 250; p.facing = -Math.PI / 2;
    state.guards[3].x = 600; state.guards[3].y = 60; state.guards[3].facing = Math.PI; state.guards[3].pause = 2;
    state.alarm = 12;
    state.lootValue = 29000;
    state.loot[1].taken = true; state.loot[2].taken = true; state.loot[5].taken = true;
  } else if (kind === 'alarm') {
    // Hunted: alarm nearly full, a guard chasing, smoke down as cover.
    p.x = 480; p.y = 420; p.facing = Math.PI / 2;
    state.guards[0].x = 480; state.guards[0].y = 280; state.guards[0].facing = Math.PI / 2;
    state.guards[0].state = 'chase'; state.guards[0].lastSeenX = 480; state.guards[0].lastSeenY = 420;
    state.guards[0].lastSeenAt = state.time;
    state.alarm = 70;
    state.lootValue = 46000;
    state.smoke.push({ x: 480, y: 380, r: 72, left: 6, max: 6 });
    state.loot[1].taken = true; state.loot[2].taken = true; state.loot[3].taken = true; state.loot[4].taken = true;
  } else if (kind === 'win') {
    // On the getaway pad with the target met.
    p.x = 480; p.y = 598; p.facing = Math.PI / 2;
    state.lootValue = 54000;
    for (const item of state.loot) item.taken = true;
    state.phase = 'won';
    state.score = state.lootValue + 1200;
    state.time = 183;
  }
}

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) stageShot(shot);

requestAnimationFrame(frame);
