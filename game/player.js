// player.js — Wren, the thief: WASD / arrow-key movement, Shift to sneak,
// mouse-aimed smoke pellets and the EMP burst. Tools cost alarm (noise),
// so every gadget is a trade-off against being heard.
import { circleHitsSolid } from './vision.js';
import { PLAYER_START } from './level.js';

export const PLAYER_RADIUS = 12;
export const WALK_SPEED = 175;
export const SNEAK_SPEED = 95;
export const SMOKE_RANGE = 280;
export const SMOKE_RADIUS = 72;
export const SMOKE_DURATION = 6;
export const EMP_DURATION = 8;
export const TOOL_ALARM_COST = 5;

/** Fresh thief state at the gallery door. */
export function makePlayer() {
  return {
    x: PLAYER_START.x,
    y: PLAYER_START.y,
    facing: -Math.PI / 2,
    sneaking: false,
    alive: true,
    smokeLeft: 3,
    empLeft: 2,
    moving: false,
    stepPhase: 0,
  };
}

/**
 * Move the thief from the held keys. `keys` is a Set of lowercase key names.
 * Movement is axis-separated so the thief slides along walls.
 */
export function updatePlayer(player, dt, keys) {
  let dx = 0, dy = 0;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;
  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  player.sneaking = keys.has('shift');
  player.moving = dx !== 0 || dy !== 0;
  if (!player.moving) return;
  const len = Math.hypot(dx, dy);
  dx /= len; dy /= len;
  const speed = player.sneaking ? SNEAK_SPEED : WALK_SPEED;
  const nx = player.x + dx * speed * dt;
  const ny = player.y + dy * speed * dt;
  if (!circleHitsSolid(nx, player.y, PLAYER_RADIUS)) player.x = nx;
  if (!circleHitsSolid(player.x, ny, PLAYER_RADIUS)) player.y = ny;
  player.facing = Math.atan2(dy, dx);
  player.stepPhase += dt * (player.sneaking ? 7 : 11);
}

/**
 * Throw a smoke pellet at the mouse position. Returns the new cloud, or
 * null when out of pellets or out of throwing range.
 */
export function throwSmoke(player, mx, my) {
  if (player.smokeLeft <= 0) return null;
  if (Math.hypot(mx - player.x, my - player.y) > SMOKE_RANGE) return null;
  player.smokeLeft -= 1;
  return { x: mx, y: my, r: SMOKE_RADIUS, left: SMOKE_DURATION, max: SMOKE_DURATION };
}

/** Fire the EMP burst. Returns true when a charge was spent. */
export function fireEmp(player) {
  if (player.empLeft <= 0) return false;
  player.empLeft -= 1;
  return true;
}

/** Age smoke clouds; drops the ones that have blown away. */
export function updateSmoke(smoke, dt) {
  for (let i = smoke.length - 1; i >= 0; i--) {
    smoke[i].left -= dt;
    if (smoke[i].left <= 0) smoke.splice(i, 1);
  }
}

/** Draw the thief: hooded cloak, mask, and a soft sneak glow. */
export function drawPlayer(ctx, player, time) {
  const bob = player.moving ? Math.sin(player.stepPhase) * 2 : Math.sin(time * 2) * 1;
  // Soft shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 10, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cloak.
  ctx.fillStyle = player.sneaking ? '#5b2a86' : '#7b2fbe';
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob * 0.3, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e9c46a';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Hood point in the facing direction.
  ctx.fillStyle = '#5b2a86';
  ctx.beginPath();
  ctx.moveTo(player.x + Math.cos(player.facing) * 18, player.y + Math.sin(player.facing) * 18);
  ctx.lineTo(player.x + Math.cos(player.facing + 2.4) * 10, player.y + Math.sin(player.facing + 2.4) * 10);
  ctx.lineTo(player.x + Math.cos(player.facing - 2.4) * 10, player.y + Math.sin(player.facing - 2.4) * 10);
  ctx.closePath();
  ctx.fill();
  // Mask: two pale eyes.
  const ex = Math.cos(player.facing), ey = Math.sin(player.facing);
  const px = -ey, py = ex;
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(player.x + ex * 4 + px * 4, player.y + ey * 4 + py * 4, 2.2, 0, Math.PI * 2);
  ctx.arc(player.x + ex * 4 - px * 4, player.y + ey * 4 - py * 4, 2.2, 0, Math.PI * 2);
  ctx.fill();
}

/** Draw a smoke cloud: layered grey puffs, fading as it blows away. */
export function drawSmoke(ctx, cloud) {
  const alpha = Math.max(0, Math.min(1, cloud.left / cloud.max)) * 0.85;
  ctx.fillStyle = `rgba(180, 190, 205, ${alpha})`;
  for (const [ox, oy, r] of [[0, 0, 34], [-24, 10, 24], [24, -8, 26], [-10, -20, 22], [16, 18, 20]]) {
    ctx.beginPath();
    ctx.arc(cloud.x + ox, cloud.y + oy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = `rgba(120, 130, 145, ${alpha * 0.7})`;
  ctx.beginPath();
  ctx.arc(cloud.x, cloud.y, 20, 0, Math.PI * 2);
  ctx.fill();
}
