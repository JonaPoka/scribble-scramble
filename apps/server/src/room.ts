import { randomUUID } from 'node:crypto';
import {
  AVATAR_LIMITS,
  CRAYONS,
  MAX_PLAYERS,
  NAME_MAX_LENGTH,
  sanitizeDrawing,
  type AckResult,
  type Drawing,
  type JoinResult,
  type MinigameContext,
  type MinigameInstance,
  type PublicPlayer,
  type RoomPhase,
  type RoomSettings,
  type RoomState,
  type RoundInfo,
} from '@scribble/shared';
import type { MinigameCatalog } from './minigames';
import type { GameServer, GameSocket } from './types';

const INTRO_MS = 3_000;
const RESULTS_MS = 4_500;
const DEFAULT_ROUNDS = 5;

export interface RoomOptions {
  /** Fewest connected players needed to start. 1 in development so one tab can test everything. */
  minPlayers: number;
}

interface Player extends Omit<PublicPlayer, 'isHost'> {
  socketId: string | null;
}

interface ActiveMinigame {
  id: string;
  playerIds: readonly string[];
  instance: MinigameInstance<unknown> | null;
  timers: Set<NodeJS.Timeout>;
  ended: boolean;
}

function cleanName(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, NAME_MAX_LENGTH);
}

export class Room {
  private readonly players = new Map<string, Player>();
  /** Drawn characters by player id. Sent separately from room state because they are large. */
  private readonly avatars = new Map<string, Drawing>();
  private hostId: string | null = null;
  private phase: RoomPhase = 'lobby';
  private round: RoundInfo | null = null;
  private lastRoundPoints: Record<string, number> = {};
  private readonly settings: RoomSettings = { rounds: DEFAULT_ROUNDS };
  private phaseTimer: NodeJS.Timeout | null = null;
  private active: ActiveMinigame | null = null;
  private recent: string[] = [];

  constructor(
    readonly code: string,
    private readonly io: GameServer,
    private readonly catalog: MinigameCatalog,
    private readonly options: RoomOptions,
    private readonly onEmpty: () => void,
  ) {}

  get isEmpty(): boolean {
    return ![...this.players.values()].some((p) => p.connected);
  }

  addPlayer(socket: GameSocket, payload: { name?: unknown; avatar?: unknown }): AckResult<JoinResult> {
    let name = cleanName(payload?.name);
    if (!name) return { ok: false, error: 'Pick a name first.' };
    if (this.players.size >= MAX_PLAYERS) return { ok: false, error: `This room is full (${MAX_PLAYERS} players).` };

    const taken = new Set([...this.players.values()].map((p) => p.name.toLowerCase()));
    for (let n = 2; taken.has(name.toLowerCase()); n++) {
      name = `${name.slice(0, NAME_MAX_LENGTH - String(n).length)}${n}`;
    }

    const usedColors = new Set([...this.players.values()].map((p) => p.color));
    const color = CRAYONS.find((c) => !usedColors.has(c)) ?? CRAYONS[0];
    // An invalid or oversized drawing is dropped; that player shows the fallback face instead.
    const avatar = sanitizeDrawing(payload?.avatar, AVATAR_LIMITS);

    const player: Player = { id: randomUUID(), socketId: socket.id, name, color, score: 0, connected: true };
    this.players.set(player.id, player);
    this.hostId ??= player.id;
    if (avatar) this.avatars.set(player.id, avatar);

    socket.join(this.code);
    socket.data.playerId = player.id;
    socket.data.roomCode = this.code;
    // Avatars go out before the state that lists the new player, so nobody sees a blank.
    socket.emit('room:avatars', Object.fromEntries(this.avatars));
    if (avatar) socket.to(this.code).emit('room:avatars', { [player.id]: avatar });
    this.broadcast();
    return { ok: true, data: { code: this.code, playerId: player.id } };
  }

  removePlayer(playerId: string, reason: 'left' | 'disconnected'): void {
    const player = this.players.get(playerId);
    if (!player) return;

    if (this.phase === 'lobby' || reason === 'left') {
      this.players.delete(playerId);
      this.avatars.delete(playerId);
    } else {
      // Keep their score on the board for the rest of the game.
      player.connected = false;
      player.socketId = null;
    }

    if (this.hostId === playerId) {
      this.hostId = [...this.players.values()].find((p) => p.connected)?.id ?? null;
    }

    if (this.isEmpty) {
      this.dispose();
      this.onEmpty();
      return;
    }
    this.broadcast();
  }

  /** Returns an error message, or null when the game started. */
  start(playerId: string): string | null {
    if (playerId !== this.hostId) return 'Only the host can start the game.';
    if (this.phase !== 'lobby' && this.phase !== 'finished') return 'The game is already running.';
    if (this.catalog.size === 0) return 'No minigames are installed. Add one to the minigames folder.';

    for (const [id, p] of this.players) {
      if (p.connected) continue;
      this.players.delete(id);
      this.avatars.delete(id);
    }
    if (this.players.size < this.options.minPlayers) return `You need at least ${this.options.minPlayers} players to start.`;

    for (const p of this.players.values()) p.score = 0;
    this.lastRoundPoints = {};
    this.recent = [];
    this.beginRound(1);
    return null;
  }

  handleInput(playerId: string, raw: unknown): void {
    const active = this.active;
    if (!active?.instance || active.ended || this.phase !== 'playing') return;
    if (typeof raw !== 'object' || raw === null) return;
    const { game, input } = raw as { game?: unknown; input?: unknown };
    if (game !== active.id || !active.playerIds.includes(playerId)) return;
    if (typeof input !== 'object' || input === null) return;
    this.guard(active, 'onInput', () => active.instance?.onInput(playerId, input));
  }

  dispose(): void {
    if (this.phaseTimer) clearTimeout(this.phaseTimer);
    this.phaseTimer = null;
    if (this.active) this.stopActive(this.active);
  }

  private connectedPlayers(): Player[] {
    return [...this.players.values()].filter((p) => p.connected);
  }

  private publicPlayers(): PublicPlayer[] {
    return [...this.players.values()].map(({ socketId: _socketId, ...p }) => ({ ...p, isHost: p.id === this.hostId }));
  }

  private beginRound(number: number): void {
    const minigame = this.pickMinigame();
    this.round = { number, total: this.settings.rounds, minigame, deadline: Date.now() + INTRO_MS };
    this.phase = 'intro';
    this.broadcast();
    this.schedule(() => this.startMinigame(minigame), INTRO_MS);
  }

  /** Random minigame that fits the player count, avoiding the most recent ones so games don't repeat back to back. */
  private pickMinigame(): string {
    const playerCount = this.connectedPlayers().length;
    let options = [...this.catalog.values()].filter((m) => (m.info.minPlayers ?? 1) <= playerCount).map((m) => m.info.id);
    if (options.length === 0) options = [...this.catalog.keys()];

    const avoid = new Set(this.recent.slice(-Math.floor(options.length / 2)));
    const fresh = options.filter((id) => !avoid.has(id));
    const pool = fresh.length ? fresh : options;
    const id = pool[Math.floor(Math.random() * pool.length)] ?? options[0]!;
    this.recent.push(id);
    return id;
  }

  /** Runs minigame code; if it throws, logs it and ends the round with no points instead of crashing the server. */
  private guard(active: ActiveMinigame, where: string, fn: () => void): void {
    try {
      fn();
    } catch (error) {
      console.error(`[minigames] "${active.id}" threw in ${where}. Ending the round with no points.`, error);
      this.finishMinigame(active, {});
    }
  }

  private startMinigame(id: string): void {
    const def = this.catalog.get(id)?.server;
    const active: ActiveMinigame = {
      id,
      playerIds: this.connectedPlayers().map((p) => p.id),
      instance: null,
      timers: new Set(),
      ended: false,
    };

    const ctx: MinigameContext<unknown> = {
      playerIds: active.playerIds,
      players: this.publicPlayers(),
      emit: (event) => {
        if (active.ended) return;
        this.io.to(this.code).emit('game:event', { game: id, event });
      },
      emitTo: (playerId, event) => {
        const socketId = this.players.get(playerId)?.socketId;
        if (active.ended || !socketId) return;
        this.io.to(socketId).emit('game:event', { game: id, event });
      },
      setTimeout: (fn, ms) => {
        const timer = setTimeout(() => {
          active.timers.delete(timer);
          if (!active.ended) this.guard(active, 'a setTimeout callback', fn);
        }, ms);
        active.timers.add(timer);
      },
      setDeadline: (ms) => {
        if (active.ended || !this.round) return;
        this.round.deadline = Date.now() + ms;
        this.broadcast();
      },
      end: (points) => this.finishMinigame(active, points),
    };

    this.phase = 'playing';
    if (this.round) this.round.deadline = null;
    this.active = active;
    // Clients mount the minigame on this state, before its first event arrives.
    this.broadcast();

    if (!def) {
      this.finishMinigame(active, {});
      return;
    }
    this.schedule(() => this.finishMinigame(active, {}), def.maxDurationMs);
    this.guard(active, 'create/start', () => {
      active.instance = def.create(ctx);
      active.instance.start();
    });
  }

  private finishMinigame(active: ActiveMinigame, rawPoints: Record<string, number>): void {
    if (active.ended || this.active !== active) return;
    this.stopActive(active);
    this.active = null;

    const points: Record<string, number> = {};
    for (const id of active.playerIds) {
      const value = Math.max(0, Math.round(Number(rawPoints?.[id] ?? 0)));
      const player = this.players.get(id);
      if (!player || !Number.isFinite(value)) continue;
      points[id] = value;
      player.score += value;
    }
    this.lastRoundPoints = points;

    this.phase = 'results';
    const round = this.round;
    if (round) round.deadline = Date.now() + RESULTS_MS;
    this.broadcast();

    this.schedule(() => {
      if (!round || round.number >= round.total) this.finishGame();
      else this.beginRound(round.number + 1);
    }, RESULTS_MS);
  }

  private finishGame(): void {
    this.phase = 'finished';
    if (this.round) this.round.deadline = null;
    this.broadcast();
  }

  private stopActive(active: ActiveMinigame): void {
    active.ended = true;
    for (const timer of active.timers) clearTimeout(timer);
    active.timers.clear();
  }

  private schedule(fn: () => void, ms: number): void {
    if (this.phaseTimer) clearTimeout(this.phaseTimer);
    this.phaseTimer = setTimeout(() => {
      this.phaseTimer = null;
      fn();
    }, ms);
  }

  private toState(): RoomState {
    return {
      code: this.code,
      phase: this.phase,
      players: this.publicPlayers(),
      round: this.round ? { ...this.round } : null,
      lastRoundPoints: this.lastRoundPoints,
      settings: this.settings,
      minigames: [...this.catalog.values()].map((m) => m.info),
      serverNow: Date.now(),
    };
  }

  private broadcast(): void {
    this.io.to(this.code).emit('room:state', this.toState());
  }
}
