// loot.js — the gallery's exhibits worth stealing: each piece has a name,
// a value and a glow. Walk over a piece to pocket it; the take adds to the
// haul shown in the HUD. The Sunheart Ruby in the vault is the big prize.
import { LOOT_DEFS } from './level.js';

export const LOOT_PICKUP_RADIUS = 26;

/** Fresh loot state: every piece still on its pedestal. */
export function makeLoot() {
  return LOOT_DEFS.map((d) => ({ ...d, taken: false, bobPhase: Math.random() * Math.PI * 2 }));
}

/**
 * Pick up any loot within reach. Returns the value pocketed this tick
 * (0 when nothing was in reach).
 */
export function updateLoot(loot, player) {
  let gained = 0;
  for (const item of loot) {
    if (item.taken) continue;
    if (Math.hypot(item.x - player.x, item.y - player.y) < LOOT_PICKUP_RADIUS) {
      item.taken = true;
      gained += item.value;
    }
  }
  return gained;
}

/** Total value of everything still on display. */
export function remainingLootValue(loot) {
  return loot.reduce((sum, item) => sum + (item.taken ? 0 : item.value), 0);
}

/** Draw one loot piece: pedestal, pulsing glow and a coloured gem. */
export function drawLootItem(ctx, item, time) {
  if (item.taken) return;
  const bob = Math.sin(time * 2 + item.bobPhase) * 3;
  const pulse = 0.55 + Math.sin(time * 3 + item.bobPhase) * 0.25;
  // Glow halo.
  const glow = ctx.createRadialGradient(item.x, item.y + bob, 2, item.x, item.y + bob, 34);
  glow.addColorStop(0, item.color);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = pulse * 0.55;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(item.x, item.y + bob, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // Pedestal.
  ctx.fillStyle = '#3a4152';
  ctx.fillRect(item.x - 12, item.y + 8, 24, 10);
  ctx.fillStyle = '#232936';
  ctx.fillRect(item.x - 12, item.y + 8, 24, 3);
  // The piece itself: a faceted gem.
  ctx.fillStyle = item.color;
  ctx.beginPath();
  ctx.moveTo(item.x, item.y - 14 + bob);
  ctx.lineTo(item.x + 9, item.y - 4 + bob);
  ctx.lineTo(item.x + 5, item.y + 6 + bob);
  ctx.lineTo(item.x - 5, item.y + 6 + bob);
  ctx.lineTo(item.x - 9, item.y - 4 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.beginPath();
  ctx.moveTo(item.x - 3, item.y - 12 + bob);
  ctx.lineTo(item.x + 2, item.y - 8 + bob);
  ctx.lineTo(item.x - 1, item.y - 3 + bob);
  ctx.closePath();
  ctx.fill();
  // Value tag.
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`$${(item.value / 1000).toFixed(0)}k`, item.x, item.y + 30);
}
