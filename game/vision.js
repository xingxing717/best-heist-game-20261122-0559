// vision.js — line-of-sight and vision-cone geometry. A watcher sees the
// thief when the thief is inside the watcher's cone, within range, and no
// wall or sight-blocking cover crosses the segment between them. Smoke
// clouds also break the segment. Pure geometry, no rendering here.
import { WALLS, COVER } from './level.js';

/** Smallest absolute difference between two angles, in radians. */
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

/** True when segments (x1,y1)-(x2,y2) and (x3,y3)-(x4,y4) cross. */
export function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
  const d2 = (x4 - x3) * (y2 - y3) - (y4 - y3) * (x2 - x3);
  const d3 = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
  const d4 = (x2 - x1) * (y4 - y1) - (y2 - y1) * (x4 - x1);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/** True when the segment (x1,y1)-(x2,y2) touches rectangle r. */
export function segmentHitsRect(x1, y1, x2, y2, r) {
  if (x1 >= r.x && x1 <= r.x + r.w && y1 >= r.y && y1 <= r.y + r.h) return true;
  if (x2 >= r.x && x2 <= r.x + r.w && y2 >= r.y && y2 <= r.y + r.h) return true;
  const left = r.x, right = r.x + r.w, top = r.y, bottom = r.y + r.h;
  return (
    segmentsCross(x1, y1, x2, y2, left, top, right, top) ||
    segmentsCross(x1, y1, x2, y2, right, top, right, bottom) ||
    segmentsCross(x1, y1, x2, y2, right, bottom, left, bottom) ||
    segmentsCross(x1, y1, x2, y2, left, bottom, left, top)
  );
}

/** Every rectangle that blocks sight: all walls plus sight-blocking cover. */
export function sightBlockers() {
  const out = WALLS.slice();
  for (const c of COVER) if (c.blocksSight) out.push(c);
  return out;
}

/**
 * True when nothing blocks sight between (x1,y1) and (x2,y2).
 * `smoke` is a list of {x, y, r} clouds that also block sight.
 */
export function hasLineOfSight(x1, y1, x2, y2, smoke = []) {
  for (const r of sightBlockers()) {
    if (segmentHitsRect(x1, y1, x2, y2, r)) return false;
  }
  for (const cloud of smoke) {
    // A segment through a smoke disc is blocked: distance from the cloud
    // centre to the segment below the radius means the line passes through it.
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((cloud.x - x1) * dx + (cloud.y - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = x1 + dx * t, cy = y1 + dy * t;
    const dist = Math.hypot(cloud.x - cx, cloud.y - cy);
    if (dist < cloud.r) return false;
  }
  return true;
}

/**
 * How strongly a watcher at (wx, wy), facing `facing` with a cone of
 * `halfAngle` and `range`, sees a target at (tx, ty). Returns 0 when the
 * target is outside the cone or range or behind cover, otherwise a 0..1
 * score: 1 up close and dead-centre, fading with distance and angle.
 */
export function coneVisibility(wx, wy, facing, halfAngle, range, tx, ty, smoke = []) {
  const dx = tx - wx, dy = ty - wy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return 0;
  if (dist < 14) return 1; // Bumped into the watcher: always seen.
  const angle = Math.atan2(dy, dx);
  if (angleDiff(angle, facing) > halfAngle) return 0;
  if (!hasLineOfSight(wx, wy, tx, ty, smoke)) return 0;
  const distScore = 1 - (dist / range) * 0.65;
  const angleScore = 1 - (angleDiff(angle, facing) / halfAngle) * 0.35;
  return Math.max(0, Math.min(1, distScore * angleScore));
}

/** True when a circle of radius r at (x, y) overlaps rectangle r2. */
export function circleHitsRect(x, y, r, r2) {
  const cx = Math.max(r2.x, Math.min(x, r2.x + r2.w));
  const cy = Math.max(r2.y, Math.min(y, r2.y + r2.h));
  return (x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r;
}

/** True when a circle of radius r at (x, y) overlaps any movement blocker. */
export function circleHitsSolid(x, y, r) {
  for (const w of WALLS) if (circleHitsRect(x, y, r, w)) return true;
  for (const c of COVER) if (c.blocksMove && circleHitsRect(x, y, r, c)) return true;
  return false;
}
