import type { ClientToServerEvents, ServerToClientEvents } from '@scribble/shared';
import { io, type Socket } from 'socket.io-client';

export type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/** Same-origin connection: Vite proxies /socket.io in dev, the game server hosts the client in production. */
export const socket: ClientSocket = io();
