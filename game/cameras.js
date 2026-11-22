// cameras.js — the gallery's wall cameras: fixed mounts that sweep a red
// cone back and forth. A camera that sees the thief raises the alarm fast,
// but an EMP burst shuts every camera down for a while.
import { coneVisibility, angleDiff } from './vision.js';
import { CAMERA_DEFS } from './level.js';

export const CAMERA_HALF_ANGLE = 0.5; // ~29 degrees each side

/** Build a camera's live state from its level definition. */
export function makeCamera(def) {
  return {
    id: def.id,
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    speed: def.speed,
    range: def.range,
    phase: 0,
    facing: def.baseAngle,
    disabledUntil: -999,
  };
}

export function makeCameras() {
  return CAMERA_DEFS.map(makeCamera);
}

/** Step one camera's sweep. Returns alarm gained this tick (0 when blind). */
export function updateCamera(c, dt, player, smoke, now) {
  c.phase += dt * c.speed;
  c.facing = c.baseAngle + Math.sin(c.phase) * c.sweep;
  if (now < c.disabledUntil) return 0;
  if (!player.alive) return 0;
  const seen = coneVisibility(c.x, c.y, c.facing, CAMERA_HALF_ANGLE, c.range, player.x, player.y, smoke);
  if (seen <= 0) return 0;
  const sneakFactor = player.sneaking ? 0.5 : 1;
  return seen * 34 * sneakFactor;
}

/** Shut every camera down for `seconds` (the EMP burst). */
export function disableAllCameras(cameras, now, seconds) {
  for (const c of cameras) c.disabledUntil = now + seconds;
}

/** Draw one camera: mount, red sweep cone, blinking lens. */
export function drawCamera(ctx, c, now, time) {
  if (now < c.disabledUntil) {
    // Disabled: grey mount, no cone, faint sparks.
    ctx.fillStyle = '#5a6472';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8b98a8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EMP', c.x, c.y - 14);
    return;
  }
  ctx.fillStyle = 'rgba(255, 60, 60, 0.20)';
  ctx.beginPath();
  ctx.moveTo(c.x, c.y);
  ctx.arc(c.x, c.y, c.range, c.facing - CAMERA_HALF_ANGLE, c.facing + CAMERA_HALF_ANGLE);
  ctx.closePath();
  ctx.fill();
  // Mount.
  ctx.fillStyle = '#2b2f38';
  ctx.beginPath();
  ctx.arc(c.x, c.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ff3c3c';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Blinking lens.
  const blink = Math.sin(time * 5) > 0;
  ctx.fillStyle = blink ? '#ff3c3c' : '#7a1f1f';
  ctx.beginPath();
  ctx.arc(c.x + Math.cos(c.facing) * 5, c.y + Math.sin(c.facing) * 5, 3, 0, Math.PI * 2);
  ctx.fill();
}
