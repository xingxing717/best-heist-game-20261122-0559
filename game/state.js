// state.js — the heist's state machine: title, playing, caught and won.
// Owns the alarm, the haul, the clock and the win/lose checks; the update
// step in main.js drives it once per frame.
import { LOOT_TARGET, EXIT_ZONE } from './level.js';
import { makeGuards, updateGuard, guardCaughtPlayer } from './guards.js';
import { makeCameras, updateCamera, disableAllCameras } from './cameras.js';
import { makeLoot, updateLoot } from './loot.js';
import { makePlayer, updatePlayer, updateSmoke, throwSmoke, fireEmp, TOOL_ALARM_COST, EMP_DURATION } from './player.js';
import { playPickup, playAlarmTick, playSmoke, playEmp, playCaught, playWin } from './audio.js';

export const ALARM_DECAY = 3; // points per second while unseen
export const ALARM_MAX = 100;

/** Fresh heist state. */
export function makeState() {
  return {
    phase: 'title', // title | playing | caught | won
    time: 0,
    alarm: 0,
    lootValue: 0,
    player: makePlayer(),
    guards: makeGuards(),
    cameras: makeCameras(),
    loot: makeLoot(),
    smoke: [],
    caughtBy: null,
    score: 0,
    lastAlarmNotch: 0,
    staged: false, // ?shot=... poses a scene: alarm climbs, but no catch.
  };
}

/** Start (or restart) the heist from the title screen. */
export function startHeist(state) {
  const fresh = makeState();
  Object.assign(state, fresh, { phase: 'playing' });
}

/** The final score: haul plus a speed bonus for a quick getaway. */
export function computeScore(state) {
  const timeBonus = Math.max(0, Math.round((300 - state.time) * 20));
  return state.lootValue + timeBonus;
}

/**
 * One frame of the heist. `keys` is the set of held keys; `clicks` is a
 * list of {x, y} mouse clicks consumed this frame (world coordinates);
 * `tools` is a list of tool names queued this frame ('emp').
 */
export function updateState(state, dt, keys, clicks, tools = []) {
  if (state.phase !== 'playing') return;
  state.time += dt;

  // Tools first: clicks throw smoke, queued tool presses fire the EMP.
  // (EMP is queued, not read from the held-keys set, so a quick tap of
  // the key can never fall between two frames.)
  for (const click of clicks) {
    const cloud = throwSmoke(state.player, click.x, click.y);
    if (cloud) {
      state.smoke.push(cloud);
      state.alarm = Math.min(ALARM_MAX, state.alarm + TOOL_ALARM_COST);
      playSmoke();
    }
  }
  for (const tool of tools) {
    if (tool !== 'emp') continue;
    if (fireEmp(state.player)) {
      disableAllCameras(state.cameras, state.time, EMP_DURATION);
      state.alarm = Math.min(ALARM_MAX, state.alarm + TOOL_ALARM_COST);
      playEmp();
    }
  }

  updatePlayer(state.player, dt, keys);
  updateSmoke(state.smoke, dt);

  // Loot.
  const gained = updateLoot(state.loot, state.player);
  if (gained > 0) {
    state.lootValue += gained;
    playPickup();
  }

  // Alarm: guards and cameras add, silence decays it.
  let gain = 0;
  for (const g of state.guards) gain += updateGuard(g, dt, state.player, state.smoke, state.time);
  for (const c of state.cameras) gain += updateCamera(c, dt, state.player, state.smoke, state.time);
  if (gain > 0) {
    state.alarm = Math.min(ALARM_MAX, state.alarm + gain * dt);
  } else {
    state.alarm = Math.max(0, state.alarm - ALARM_DECAY * dt);
  }
  const notch = Math.floor(state.alarm / 25);
  if (notch > state.lastAlarmNotch) playAlarmTick();
  state.lastAlarmNotch = notch;

  // Caught: a guard's hands on the thief, or the alarm maxing out.
  // (Staged screenshot scenes never end: they are posed, not played.)
  const catcher = state.staged ? null : guardCaughtPlayer(state.guards, state.player);
  if (!state.staged && (catcher || state.alarm >= ALARM_MAX)) {
    state.phase = 'caught';
    state.caughtBy = catcher ? catcher.name : 'Lockdown — the alarm hit 100%';
    state.player.alive = false;
    playCaught();
    return;
  }

  // Won: target haul in hand and standing on the getaway pad.
  if (state.lootValue >= LOOT_TARGET) {
    const p = state.player;
    if (p.x > EXIT_ZONE.x && p.x < EXIT_ZONE.x + EXIT_ZONE.w &&
        p.y > EXIT_ZONE.y && p.y < EXIT_ZONE.y + EXIT_ZONE.h) {
      state.phase = 'won';
      state.score = computeScore(state);
      playWin();
    }
  }
}
