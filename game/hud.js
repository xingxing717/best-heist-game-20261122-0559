// hud.js — the heads-up display, painted on the canvas above the gallery:
// the haul against its target, the alarm bar, the mission timer, the
// tool counts and the current objective. Everything the thief needs to
// decide the next move, readable in one glance.
import { LOOT_TARGET } from './level.js';

/** Format seconds as M:SS. */
export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** The alarm's word: calm, watched, or hunted. */
export function alarmWord(alarm) {
  if (alarm >= 70) return 'HUNTED';
  if (alarm >= 35) return 'SUSPICIOUS';
  return 'CALM';
}

/** Draw the full HUD bar across the top of the screen. */
export function drawHud(ctx, state) {
  const W = 960;
  ctx.fillStyle = 'rgba(8, 11, 22, 0.92)';
  ctx.fillRect(0, 0, W, 46);
  ctx.fillStyle = '#e9c46a';
  ctx.fillRect(0, 46, W, 2);

  // Haul.
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  const lootText = `LOOT $${state.lootValue.toLocaleString('en-US')} / $${LOOT_TARGET.toLocaleString('en-US')}`;
  ctx.fillText(lootText, 14, 20);
  ctx.fillStyle = state.lootValue >= LOOT_TARGET ? '#3ddc97' : '#8b98a8';
  ctx.font = '12px sans-serif';
  ctx.fillText(
    state.lootValue >= LOOT_TARGET ? 'TARGET MET — REACH THE GETAWAY!' : 'Steal $50,000, then reach the getaway van.',
    14, 38,
  );

  // Alarm bar.
  const barX = 400, barW = 220, barY = 12, barH = 16;
  ctx.fillStyle = '#1d2b53';
  ctx.fillRect(barX, barY, barW, barH);
  const frac = Math.max(0, Math.min(1, state.alarm / 100));
  const alarmColor = state.alarm >= 70 ? '#ff4656' : state.alarm >= 35 ? '#ffb020' : '#3ddc97';
  ctx.fillStyle = alarmColor;
  ctx.fillRect(barX, barY, barW * frac, barH);
  ctx.strokeStyle = '#e9c46a';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`ALARM ${Math.round(state.alarm)}% — ${alarmWord(state.alarm)}`, barX, 42);

  // Timer.
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`TIME ${formatTime(state.time)}`, W - 14, 20);

  // Tools.
  ctx.font = '12px sans-serif';
  ctx.fillStyle = state.player.smokeLeft > 0 ? '#b8c7e0' : '#5a6472';
  ctx.fillText(`[Click] Smoke x${state.player.smokeLeft}`, W - 14, 38);
  ctx.fillStyle = state.player.empLeft > 0 ? '#b8c7e0' : '#5a6472';
  ctx.fillText(`[2] EMP x${state.player.empLeft}`, W - 170, 38);

  // Controls hint, bottom-left, small.
  ctx.fillStyle = 'rgba(233, 196, 106, 0.75)';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('WASD / arrows move · Shift sneak · Click: smoke · 2: EMP · R: restart', 14, 632);
}

/** Draw a centred message panel (title, win and caught screens). */
export function drawPanel(ctx, lines, accent) {
  ctx.fillStyle = 'rgba(5, 8, 18, 0.78)';
  ctx.fillRect(0, 0, 960, 640);
  const cx = 480;
  let y = 190;
  ctx.textAlign = 'center';
  for (const line of lines) {
    ctx.fillStyle = line.color || '#f4f1e6';
    ctx.font = line.font || '16px sans-serif';
    ctx.fillText(line.text, cx, y);
    y += line.gap || 30;
  }
  ctx.strokeStyle = accent || '#e9c46a';
  ctx.lineWidth = 2;
  ctx.strokeRect(170, 150, 620, y - 150 + 10);
}
