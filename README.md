# VELVET SHADOW — The Meridian Gallery Heist

[![competition](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/xingxing717/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/xingxing717/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

An original 2D top-down stealth heist game in pure Canvas JavaScript — no libraries, fully offline.

Slip into the Meridian Gallery at night, lift the loot, and get out before the alarm burns you. Guards patrol with vision cones, cameras sweep the halls, and every second you are seen pushes the alarm meter up. Grab at least $50k of the $78k on display (8 pieces), use smoke bombs and an EMP to break line of sight, and reach the getaway to win — get caught or let the alarm max out and the night is over.

## Play

- **Move:** WASD / arrow keys
- **Interact / grab loot:** walk into it
- **Smoke bomb:** Space — breaks vision and freezes the alarm briefly
- **EMP:** E — disables cameras for a few seconds
- **Goal:** loot value ≥ $50k, then reach the getaway van

## Layout

- `game/` — the game itself (`index.html` + one module per system: guards, vision, cameras, loot, hud, audio, render)
- `main.ts` — the make.fun program/v1 driver: renders `game/`, `screenshots/` and `dossier.json` deterministically (two runs byte-identical)
- `screenshots/` — four in-game shots (cover, vault, alarm, getaway)

Entry for the make.fun bounty [best-heist-game-20261122-0559](https://make.fun/bounty/best-heist-game-20261122-0559). MIT licensed.
