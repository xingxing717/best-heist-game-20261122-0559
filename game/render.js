// render.js — draws the gallery itself: the night floor, walls, cover
// furniture and the getaway zone. Safe floor, danger cones (drawn by the
// guard/camera modules) and golden loot are told apart at a glance.
import { WORLD_W, WORLD_H, WALLS, COVER, EXIT_ZONE } from './level.js';

/** Paint the floor: dark blue-grey tiles with a faint checker. */
export function drawFloor(ctx) {
  ctx.fillStyle = '#141a2b';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.fillStyle = '#171e33';
  const tile = 40;
  for (let y = 0; y < WORLD_H / tile; y++) {
    for (let x = 0; x < WORLD_W / tile; x++) {
      if ((x + y) % 2 === 0) ctx.fillRect(x * tile, y * tile, tile, tile);
    }
  }
  // Faint gold carpet runner down the central hall.
  ctx.fillStyle = 'rgba(233, 196, 106, 0.07)';
  ctx.fillRect(400, 24, 160, 446);
}

/** Paint every wall as a raised teal slab with a lighter top edge. */
export function drawWalls(ctx) {
  for (const w of WALLS) {
    ctx.fillStyle = '#232c44';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#31406b';
    ctx.fillRect(w.x, w.y, w.w, 4);
    ctx.strokeStyle = '#0d1220';
    ctx.lineWidth = 1;
    ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
  }
}

/** Paint one piece of cover furniture by kind. */
export function drawCoverPiece(ctx, c, time) {
  if (c.kind === 'case') {
    ctx.fillStyle = '#2c3a5e';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = 'rgba(140, 200, 255, 0.25)';
    ctx.fillRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
    ctx.strokeStyle = '#8cc8ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1);
  } else if (c.kind === 'statue') {
    ctx.fillStyle = '#4a5468';
    ctx.beginPath();
    ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6b7a94';
    ctx.beginPath();
    ctx.arc(c.x + c.w / 2 - 4, c.y + c.h / 2 - 4, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2c3547';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  } else if (c.kind === 'curtain') {
    // Heavy velvet curtain: deep red folds that block sight, not feet.
    ctx.fillStyle = '#6e1423';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = '#8e1f30';
    for (let y = c.y + 4; y < c.y + c.h - 4; y += 12) {
      ctx.fillRect(c.x + 2, y, c.w - 4, 5);
    }
    ctx.fillStyle = '#d4a017';
    ctx.fillRect(c.x, c.y, c.w, 4);
  } else {
    // Packing crate.
    ctx.fillStyle = '#6b4f2a';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = '#4a3520';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + c.w, c.y + c.h);
    ctx.moveTo(c.x + c.w, c.y);
    ctx.lineTo(c.x, c.y + c.h);
    ctx.stroke();
  }
}

export function drawCover(ctx, time) {
  for (const c of COVER) drawCoverPiece(ctx, c, time);
}

/** Paint the getaway zone: a green van pad at the south door. */
export function drawExit(ctx, lootReady, time) {
  const pulse = lootReady ? 0.5 + Math.sin(time * 4) * 0.2 : 0.25;
  ctx.fillStyle = lootReady ? `rgba(61, 220, 151, ${pulse})` : 'rgba(61, 220, 151, 0.18)';
  ctx.fillRect(EXIT_ZONE.x, EXIT_ZONE.y, EXIT_ZONE.w, EXIT_ZONE.h);
  ctx.strokeStyle = lootReady ? '#3ddc97' : '#2a7a58';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(EXIT_ZONE.x, EXIT_ZONE.y, EXIT_ZONE.w, EXIT_ZONE.h);
  ctx.setLineDash([]);
  ctx.fillStyle = lootReady ? '#b8ffdd' : '#7fb89c';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(lootReady ? 'GETAWAY — GO!' : 'GETAWAY VAN', EXIT_ZONE.x + EXIT_ZONE.w / 2, EXIT_ZONE.y + 22);
}

/** Paint small room labels so the wings read at a glance. */
export function drawRoomLabels(ctx) {
  ctx.fillStyle = 'rgba(233, 196, 106, 0.5)';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WEST WING', 172, 60);
  ctx.fillText('EAST WING', 788, 60);
  ctx.fillText('THE VAULT', 480, 112);
  ctx.fillText('ENTRY HALL', 480, 505);
}

/** Paint the whole static scene in order. */
export function drawScene(ctx, lootReady, time) {
  drawFloor(ctx);
  drawExit(ctx, lootReady, time);
  drawRoomLabels(ctx);
  drawCover(ctx, time);
  drawWalls(ctx);
}
