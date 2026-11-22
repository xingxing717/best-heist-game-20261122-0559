// level.js — the Meridian Gallery floor plan: walls, cover, loot spawns,
// guard patrol routes, cameras and the getaway exit. All coordinates are
// world pixels on a 960 x 640 floor. Nothing here is copied from any game:
// the gallery, its wings and its exhibits are invented for this heist.
export const WORLD_W = 960;
export const WORLD_H = 640;

export const LOOT_TARGET = 50000;

// Walls: solid rectangles that block movement and sight.
export const WALLS = [
  // Outer shell (thick border walls).
  { x: 0, y: 0, w: 960, h: 24 }, // north wall
  { x: 0, y: 616, w: 960, h: 24 }, // south wall
  { x: 0, y: 0, w: 24, h: 640 }, // west wall
  { x: 936, y: 0, w: 24, h: 640 }, // east wall
  // West / central partition with two door gaps.
  { x: 320, y: 24, w: 16, h: 150 },
  { x: 320, y: 254, w: 16, h: 226 },
  // East / central partition with two door gaps.
  { x: 624, y: 24, w: 16, h: 150 },
  { x: 624, y: 254, w: 16, h: 226 },
  // Vault room (top centre): walls with a single door at the bottom.
  { x: 400, y: 130, w: 16, h: 130 },
  { x: 544, y: 130, w: 16, h: 130 },
  { x: 400, y: 130, w: 80, h: 16 },
  { x: 480, y: 130, w: 80, h: 16 },
  // Entry hall divider with a wide central gap (the hall mouth).
  { x: 24, y: 470, w: 380, h: 16 },
  { x: 556, y: 470, w: 380, h: 16 },
];

// Cover: furniture that blocks sight, and usually movement too.
// kind: 'case' (glass display case), 'statue', 'curtain' (blocks sight only),
// 'crate' (packing crate). Curtains let the thief slip behind them.
export const COVER = [
  // West wing exhibits.
  { kind: 'case', x: 70, y: 120, w: 90, h: 46, blocksMove: true, blocksSight: true },
  { kind: 'statue', x: 200, y: 300, w: 44, h: 44, blocksMove: true, blocksSight: true },
  { kind: 'case', x: 70, y: 380, w: 90, h: 46, blocksMove: true, blocksSight: true },
  { kind: 'curtain', x: 250, y: 90, w: 16, h: 120, blocksMove: false, blocksSight: true },
  // Central hall exhibits.
  { kind: 'statue', x: 400, y: 320, w: 44, h: 44, blocksMove: true, blocksSight: true },
  { kind: 'statue', x: 520, y: 320, w: 44, h: 44, blocksMove: true, blocksSight: true },
  { kind: 'case', x: 430, y: 420, w: 100, h: 40, blocksMove: true, blocksSight: true },
  { kind: 'curtain', x: 620, y: 330, w: 14, h: 110, blocksMove: false, blocksSight: true },
  // East wing exhibits.
  { kind: 'case', x: 800, y: 120, w: 90, h: 46, blocksMove: true, blocksSight: true },
  { kind: 'statue', x: 700, y: 300, w: 44, h: 44, blocksMove: true, blocksSight: true },
  { kind: 'case', x: 800, y: 380, w: 90, h: 46, blocksMove: true, blocksSight: true },
  { kind: 'curtain', x: 690, y: 90, w: 16, h: 120, blocksMove: false, blocksSight: true },
  // Entry hall crates (low cover near the getaway).
  { kind: 'crate', x: 120, y: 540, w: 60, h: 40, blocksMove: true, blocksSight: true },
  { kind: 'crate', x: 780, y: 540, w: 60, h: 40, blocksMove: true, blocksSight: true },
];

// Loot: name, position, value in dollars, glow colour.
export const LOOT_DEFS = [
  { id: 'ruby', name: 'Sunheart Ruby', x: 480, y: 200, value: 25000, color: '#ff4d6d' },
  { id: 'idol', name: 'Jade Idol', x: 115, y: 190, value: 12000, color: '#3ddc97' },
  { id: 'mask', name: 'Golden Mask', x: 845, y: 190, value: 12000, color: '#ffd166' },
  { id: 'tiara', name: 'Sapphire Tiara', x: 115, y: 450, value: 8000, color: '#6ea8fe' },
  { id: 'brooch', name: 'Emerald Brooch', x: 845, y: 450, value: 8000, color: '#2fd6a3' },
  { id: 'chalice', name: 'Silver Chalice', x: 480, y: 340, value: 5000, color: '#d7dee8' },
  { id: 'pearls', name: 'Pearl Necklace', x: 260, y: 400, value: 4000, color: '#f4e8ff' },
  { id: 'coins', name: 'Coin Hoard', x: 700, y: 400, value: 4000, color: '#ffb703' },
];

// Guard patrol routes: loops of waypoints, with a walking speed.
export const GUARD_DEFS = [
  {
    id: 'g1', name: 'Hall Guard',
    waypoints: [[370, 280], [590, 280], [590, 400], [370, 400]],
    speed: 62, startIndex: 0,
  },
  {
    id: 'g2', name: 'West Guard',
    waypoints: [[180, 70], [300, 70], [300, 440], [180, 440]],
    speed: 55, startIndex: 1,
  },
  {
    id: 'g3', name: 'East Guard',
    waypoints: [[780, 70], [660, 70], [660, 440], [780, 440]],
    speed: 55, startIndex: 2,
  },
  {
    id: 'g4', name: 'Vault Guard',
    waypoints: [[360, 60], [600, 60], [600, 280], [360, 280]],
    speed: 70, startIndex: 3,
  },
];

// Wall cameras: fixed mount, sweeping cone.
export const CAMERA_DEFS = [
  { id: 'c1', x: 40, y: 40, baseAngle: Math.PI / 4, sweep: 0.9, speed: 0.55, range: 230 },
  { id: 'c2', x: 920, y: 40, baseAngle: Math.PI * 3 / 4, sweep: 0.9, speed: 0.55, range: 230 },
  { id: 'c3', x: 480, y: 150, baseAngle: Math.PI / 2, sweep: 0.7, speed: 0.8, range: 210 },
];

// The getaway: reach this zone with the target loot to win.
export const EXIT_ZONE = { x: 420, y: 580, w: 120, h: 36 };

// Where the thief slips in.
export const PLAYER_START = { x: 480, y: 600 };
