# Scribble Scramble

A realtime browser party game. Up to 8 friends join a room with a 4-letter code, then race through short minigames that rotate every round: reflex tests, drawing, guessing, bluffing and button-mashing. Think skribbl.io meets WarioWare and Jackbox, drawn in a sketchbook.

**Playable now:** lobby with room codes and invite links, a 5-round game loop with random minigames, live scores, and two minigames: **Quick Draw** and **Color Clash**.

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
| `npm run typecheck` | Type-checks every package |
| `npm run build` | Builds the client to `apps/client/dist` and the server to `apps/server/dist` |
| `npm start` | Runs the built server, which also serves the built client on `PORT` (default 3001) |

## How it's built

```
packages/shared   Types shared by both sides: socket events, room state, minigame catalogue and protocols
apps/server       Node + Express + Socket.IO. Rooms, the round loop and each minigame's rules (server-authoritative)
apps/client       React + Vite. Screens, the design-system styles and each minigame's view
```

- The server owns all game state. Clients send inputs (`game:input`) and render what the server broadcasts (`room:state`, `game:event`).
- A round goes `intro` (3s splash) → `playing` (the minigame) → `results` (4.5s) → next round, then `finished`.
- Minigames are self-contained: a server definition in `apps/server/src/minigames/` and a React view in `apps/client/src/minigames/`, typed by a protocol in `packages/shared/src/minigames/`.

### Adding a minigame

1. **Protocol:** add `packages/shared/src/minigames/<name>.ts` with its `Input` and `Event` types, export it from `src/index.ts`, and add it to `MinigameProtocol` in `protocol.ts`.
2. **Make it playable:** add its id to `PLAYABLE_MINIGAMES` in `minigames/catalog.ts` (its name, crayon and rule are already there).
3. **Server:** write a `MinigameDefinition` in `apps/server/src/minigames/` and register it in `index.ts`. Use the `ctx` it gets to emit events, set timers and the countdown, and call `ctx.end(points)`. Validate every input.
4. **Client:** write a view in `apps/client/src/minigames/` that derives its state from `events` and calls `send(input)`. Register it in `index.ts`.

The compiler points at any registry you forgot. `quick-draw` is the smallest example to copy.

## Design

Everything looks hand-drawn: notebook paper, marker outlines, crayon fills, hard offset shadows and slightly tilted shapes. The tokens and component styles in `apps/client/src/styles/` come from the Scribble Scramble design sheet. It has a light Sketchbook theme and a dark Chalkboard theme that follows the OS setting. Fonts: Rubik Doodle Shadow (display), Shantell Sans (UI text) and Gochi Hand (scribbled notes), from Google Fonts.

## Roadmap

The hackathon runs four weekly builds.

- **Week 1: core loop and reflex games.** Rooms, lobby, round loop, scoring. Quick Draw ✓, Color Clash ✓, Whack-a-Thing, Typing Race, Tug of War.
- **Week 2: drawing.** A shared canvas synced over Socket.IO. Quick Sketch (draw and guess in chat), drawing version of Impostor Word.
- **Week 3: brains and bluffing.** Closest Guess, Zoom Out, Impostor Word (hints and voting), Memory Sequence.
- **Week 4: chaos and polish.** Hot Potato, Last One Standing, sound effects, rejoin after a disconnect, host settings (rounds, which minigames), mobile polish and deploy.
