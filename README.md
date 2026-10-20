# Scribble Scramble

A realtime browser party game. Up to 8 friends join a room with a 4-letter code, then race through short minigames that rotate every round: reflex tests, drawing, guessing, bluffing and button-mashing. Think skribbl.io meets WarioWare and Jackbox, drawn in a sketchbook.

**Playable now:** lobby with room codes and invite links, a 5-round game loop with random minigames, live scores, and two minigames: **Quick Draw** and **Color Clash**. New minigames are drop-in folders. Players draw their own character, starting from a template or a blank page.

## Getting started

Needs Node.js 22 or newer (24 recommended, see `.nvmrc`).

```bash
npm install
npm run dev
```

Open http://localhost:5173. In development you can start a game alone; open a second browser window to test with two players.

| Script | What it does |
| --- | --- |
| `npm run dev` | Game server on :3001 and the Vite client on :5173 (proxies Socket.IO to the server), both with reload |
| `npm run new-minigame <id>` | Creates `minigames/<id>/` from the template |
| `npm run typecheck` | Type-checks every package and every minigame |
| `npm run build` | Builds the client to `apps/client/dist` |
| `npm start` | Runs the server, which also serves the built client on `PORT` (default 3001). Needs at least 2 players per game |

## How it's built

```
minigames/        One folder per minigame, loaded automatically (see below)
packages/shared   Types shared by both sides: socket events, room state and the minigame SDK
apps/server       Node + Express + Socket.IO. Rooms, the round loop and the minigame loader
apps/client       React + Vite. Screens, the design-system styles, the drawing system and the UI kit minigames use
```

- The server owns all game state. Clients send inputs (`game:input`) and render what the server broadcasts (`room:state`, `game:event`).
- A round goes `intro` (3s splash) → `playing` (the minigame) → `results` (4.5s) → next round, then `finished`.
- The server runs on `tsx`, so minigame `.ts` files load straight from their folders with no build step.

### Adding a minigame

Each minigame is a self-contained folder: `minigames/<id>/` with `meta.ts`, `protocol.ts`, `server.ts`, `client.tsx` and an optional `style.css`. The server scans the folder on startup (and restarts when you add or change one in dev), and the client picks up every `client.tsx` automatically. No registration anywhere.

```bash
npm run new-minigame hot-potato
```

That copies `minigames/_template`, a small working game, so you can play it right away and change it from there. Folders starting with `_` are skipped. The full guide is [docs/creating-minigames.md](docs/creating-minigames.md).

## Drawing

Player characters, the `/sketchpad` page and future drawing minigames share one drawing system: a pencil brush, eraser, colour picker and undo, with drawings stored as strokes. See [apps/client/src/drawing/README.md](apps/client/src/drawing/README.md).

## Design

Everything looks hand-drawn: notebook paper, marker outlines, crayon fills, hard offset shadows and slightly tilted shapes. The tokens and component styles in `apps/client/src/styles/` come from the Scribble Scramble design sheet. The game uses the light Sketchbook theme (white paper) on every device. Fonts: Rubik Doodle Shadow (display), Shantell Sans (UI text) and Gochi Hand (scribbled notes), from Google Fonts.

## Roadmap

The hackathon runs four weekly builds.

- **Week 1: core loop and reflex games.** Rooms, lobby, round loop, scoring. Quick Draw ✓, Color Clash ✓, Whack-a-Thing, Typing Race, Tug of War.
- **Week 2: drawing.** A shared canvas synced over Socket.IO. Quick Sketch (draw and guess in chat), drawing version of Impostor Word.
- **Week 3: brains and bluffing.** Closest Guess, Zoom Out, Impostor Word (hints and voting), Memory Sequence.
- **Week 4: chaos and polish.** Hot Potato, Last One Standing, sound effects, rejoin after a disconnect, host settings (rounds, which minigames), mobile polish and deploy.
