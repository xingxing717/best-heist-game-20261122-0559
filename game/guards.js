// guards.js — the gallery guards: patrol AI, vision cones, suspicion and
// the chase. A guard walks its waypoint loop, pauses to look around at each
// stop, and watches a cone ahead of it. Spotting the thief raises the
// gallery alarm; a high alarm sends the guard hunting the last seen spot,
// and touching the thief ends the heist.
import { coneVisibility, angleDiff } from './vision.js';
import { GUARD_DEFS } from './level.js';

export const GUARD_RANGE = 190;
export const GUARD_HALF_ANGLE = 0.62; // ~35 degrees each side
export const GUARD_CATCH_RADIUS = 24;

/** Build a guard's live state from its level definition. */
export function makeGuard(def) {
  const start = def.waypoints[def.startIndex % def.waypoints.length];
  return {
    id: def.id,
    name: def.name,
    x: start[0],
    y: start[1],
    waypoints: def.waypoints,
    speed: def.speed,
    targetIndex: (def.startIndex + 1) % def.waypoints.length,
    facing: Math.PI / 2,
    pause: 0,
    state: 'patrol', // patrol | suspicious | chase
    lastSeenX: 0,
    lastSeenY: 0,
    lastSeenAt: -999,
    sweepPhase: Math.random() * Math.PI * 2,
  };
}

export function makeGuards() {
  return GUARD_DEFS.map(makeGuard);
}

/**
 * Step one guard. Returns how much alarm this guard adds this tick
 * (0 when it sees nothing). `now` is the mission clock in seconds.
 */
export function updateGuard(g, dt, player, smoke, now) {
  const seen = coneVisibility(g.x, g.y, g.facing, GUARD_HALF_ANGLE, GUARD_RANGE, player.x, player.y, smoke);
  let alarmGain = 0;
  if (seen > 0 && player.alive) {
    const sneakFactor = player.sneaking ? 0.45 : 1;
    alarmGain = seen * 26 * sneakFactor;
    g.lastSeenX = player.x;
    g.lastSeenY = player.y;
    g.lastSeenAt = now;
    // A staged (?shot) scene poses the thief for a photo: guards notice
    // and the alarm climbs, but nobody gives chase or makes the catch.
    if (!player.staged) {
      if (seen > 0.55 || now - g.lastSeenAt < 0.1) {
        g.state = 'chase';
      } else if (g.state === 'patrol') {
        g.state = 'suspicious';
      }
    }
  }

  // A guard that lost the trail calms down after a few seconds.
  if (g.state !== 'patrol' && now - g.lastSeenAt > 6) g.state = 'patrol';

  if (g.state === 'chase') {
    // Run at the last seen spot; keep hunting a little past it.
    const tx = g.lastSeenX, ty = g.lastSeenY;
    const dx = tx - g.x, dy = ty - g.y;
    const dist = Math.hypot(dx, dy);
    const speed = g.speed * 1.55;
    if (dist > 6) {
      g.x += (dx / dist) * speed * dt;
      g.y += (dy / dist) * speed * dt;
      g.facing = Math.atan2(dy, dx);
    }
    if (dist < 10 && now - g.lastSeenAt > 2.5) g.state = 'suspicious';
  } else if (g.state === 'suspicious') {
    // Walk to the last seen spot, then look around before resuming patrol.
    const tx = g.lastSeenX, ty = g.lastSeenY;
    const dx = tx - g.x, dy = ty - g.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 8) {
      g.x += (dx / dist) * g.speed * 1.15 * dt;
      g.y += (dy / dist) * g.speed * 1.15 * dt;
      g.facing = Math.atan2(dy, dx);
    } else {
      g.sweepPhase += dt * 1.6;
      g.facing += Math.sin(g.sweepPhase) * dt * 1.2;
    }
  } else {
    // Patrol: walk to the next waypoint, pause and scan at each stop.
    if (g.pause > 0) {
      g.pause -= dt;
      g.sweepPhase += dt * 2.2;
      g.facing += Math.sin(g.sweepPhase) * dt * 0.9;
    } else {
      const wp = g.waypoints[g.targetIndex];
      const dx = wp[0] - g.x, dy = wp[1] - g.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 8) {
        g.targetIndex = (g.targetIndex + 1) % g.waypoints.length;
        g.pause = 1.6;
      } else {
        g.x += (dx / dist) * g.speed * dt;
        g.y += (dy / dist) * g.speed * dt;
        g.facing = Math.atan2(dy, dx);
      }
    }
  }
  return alarmGain;
}

/** True when any guard is close enough to grab the thief. */
export function guardCaughtPlayer(guards, player) {
  for (const g of guards) {
    if (Math.hypot(g.x - player.x, g.y - player.y) < GUARD_CATCH_RADIUS) return g;
  }
  return null;
}

/** Draw one guard: vision cone, then the guard's body and facing tick. */
export function drawGuard(ctx, g, time) {
  const coneColor = g.state === 'chase' ? 'rgba(255, 70, 70, 0.30)'
    : g.state === 'suspicious' ? 'rgba(255, 176, 32, 0.28)'
    : 'rgba(255, 214, 90, 0.20)';
  ctx.fillStyle = coneColor;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.arc(g.x, g.y, GUARD_RANGE, g.facing - GUARD_HALF_ANGLE, g.facing + GUARD_HALF_ANGLE);
  ctx.closePath();
  ctx.fill();

  // Guard body: dark uniform, amber trim, white cap.
  ctx.fillStyle = '#1d2b53';
  ctx.strokeStyle = g.state === 'chase' ? '#ff4656' : '#ffb020';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(g.x, g.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f4f1e6';
  ctx.beginPath();
  ctx.arc(g.x, g.y - 4, 6, 0, Math.PI * 2);
  ctx.fill();
  // Facing tick.
  ctx.strokeStyle = '#ffd65a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.facing) * 20, g.y + Math.sin(g.facing) * 20);
  ctx.stroke();
  // "!" when hunting.
  if (g.state !== 'patrol') {
    ctx.fillStyle = g.state === 'chase' ? '#ff4656' : '#ffb020';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - 20 + Math.sin(time * 6) * 2);
  }
}
