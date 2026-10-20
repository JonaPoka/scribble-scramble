import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Server } from 'socket.io';
import { ROOM_CODE_LENGTH } from '@scribble/shared';
import { loadMinigames } from './minigames';
import { RoomManager } from './rooms';
import type { GameServer, GameSocket } from './types';

const PORT = Number(process.env.PORT ?? 3001);
/** `npm run dev` passes --dev: solo games are allowed so one tab can test everything. */
const DEV = process.argv.includes('--dev');

const app = express();
const httpServer = createServer(app);
const io: GameServer = new Server(httpServer);
const catalog = await loadMinigames();
const rooms = new RoomManager(io, catalog, { minPlayers: DEV ? 1 : 2 });

app.get('/health', (_req, res) => {
  res.json({ ok: true, rooms: rooms.size });
});

// In production the server also hosts the built client (npm run build first).
const clientDist = fileURLToPath(new URL('../../client/dist', import.meta.url));
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((_req, res) => res.sendFile('index.html', { root: clientDist }));
}

function leaveCurrentRoom(socket: GameSocket, reason: 'left' | 'disconnected'): void {
  const { roomCode, playerId } = socket.data;
  if (!roomCode || !playerId) return;
  rooms.get(roomCode)?.removePlayer(playerId, reason);
  socket.leave(roomCode);
  socket.data.roomCode = undefined;
  socket.data.playerId = undefined;
}

io.on('connection', (socket) => {
  socket.on('room:create', (payload, ack) => {
    if (typeof ack !== 'function') return;
    leaveCurrentRoom(socket, 'left');
    const room = rooms.create();
    const result = room.addPlayer(socket, payload);
    if (!result.ok) rooms.discardIfEmpty(room);
    ack(result);
  });

  socket.on('room:join', (payload, ack) => {
    if (typeof ack !== 'function') return;
    const code = String(payload?.code ?? '').trim().toUpperCase().slice(0, ROOM_CODE_LENGTH);
    const room = rooms.get(code);
    if (!room) {
      ack({ ok: false, error: `No room called ${code || '(blank)'}. Check the code and try again.` });
      return;
    }
    leaveCurrentRoom(socket, 'left');
    ack(room.addPlayer(socket, payload));
  });

  socket.on('room:leave', () => leaveCurrentRoom(socket, 'left'));

  socket.on('game:start', (ack) => {
    if (typeof ack !== 'function') return;
    const { roomCode, playerId } = socket.data;
    const room = roomCode ? rooms.get(roomCode) : undefined;
    if (!room || !playerId) {
      ack({ ok: false, error: 'Join a room first.' });
      return;
    }
    const error = room.start(playerId);
    ack(error ? { ok: false, error } : { ok: true, data: null });
  });

  socket.on('game:input', (input) => {
    const { roomCode, playerId } = socket.data;
    if (!roomCode || !playerId) return;
    rooms.get(roomCode)?.handleInput(playerId, input);
  });

  socket.on('disconnect', () => leaveCurrentRoom(socket, 'disconnected'));
});

httpServer.listen(PORT, () => {
  console.log(`Scribble Scramble server listening on http://localhost:${PORT}${DEV ? ' (dev mode)' : ''}`);
});
