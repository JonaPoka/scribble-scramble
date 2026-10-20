import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '@scribble/shared';
import type { MinigameCatalog } from './minigames';
import { Room, type RoomOptions } from './room';
import type { GameServer } from './types';

export class RoomManager {
  private readonly rooms = new Map<string, Room>();

  constructor(
    private readonly io: GameServer,
    private readonly catalog: MinigameCatalog,
    private readonly options: RoomOptions,
  ) {}

  create(): Room {
    let code: string;
    do {
      code = Array.from(
        { length: ROOM_CODE_LENGTH },
        () => ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)],
      ).join('');
    } while (this.rooms.has(code));

    const room = new Room(code, this.io, this.catalog, this.options, () => this.rooms.delete(code));
    this.rooms.set(code, room);
    return room;
  }

  get(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  /** Drops a room that never got a player (for example, when the host's name was invalid). */
  discardIfEmpty(room: Room): void {
    if (room.isEmpty) {
      room.dispose();
      this.rooms.delete(room.code);
    }
  }

  get size(): number {
    return this.rooms.size;
  }
}
