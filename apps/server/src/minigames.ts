import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  CRAYONS,
  ICON_NAMES,
  MINIGAME_CATEGORIES,
  type MinigameInfo,
  type MinigameMeta,
  type ServerMinigame,
} from '@scribble/shared';

export const MINIGAMES_DIR = fileURLToPath(new URL('../../../minigames/', import.meta.url));

export interface LoadedMinigame {
  info: MinigameInfo;
  server: ServerMinigame<unknown, unknown>;
}

export type MinigameCatalog = ReadonlyMap<string, LoadedMinigame>;

const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

/** Returns a list of problems with a meta.ts default export (empty when it's fine). */
function checkMeta(meta: Partial<MinigameMeta> | undefined): string[] {
  if (!meta || typeof meta !== 'object') return ['meta.ts has no default export (use `export default defineMeta({...})`)'];
  const problems: string[] = [];
  for (const key of ['name', 'rule', 'blurb'] as const) {
    if (typeof meta[key] !== 'string' || !meta[key]) problems.push(`"${key}" must be a non-empty string`);
  }
  if (!CRAYONS.includes(meta.crayon as never)) problems.push(`"crayon" must be one of ${CRAYONS.join(', ')}`);
  if (!MINIGAME_CATEGORIES.includes(meta.category as never)) problems.push(`"category" must be one of ${MINIGAME_CATEGORIES.join(', ')}`);
  if (!ICON_NAMES.includes(meta.icon as never)) problems.push(`"icon" must be one of ${ICON_NAMES.join(', ')}`);
  if (meta.minPlayers !== undefined && !(Number.isInteger(meta.minPlayers) && meta.minPlayers >= 1)) {
    problems.push('"minPlayers" must be a whole number of 1 or more');
  }
  return problems;
}

/**
 * Loads every minigames/<id>/ folder that has a meta.ts and server.ts. Folders starting with
 * "_" or "." are skipped (the template lives in minigames/_template). A broken minigame is
 * reported and skipped so it can't take the whole server down.
 */
export async function loadMinigames(): Promise<MinigameCatalog> {
  const catalog = new Map<string, LoadedMinigame>();
  const folders = readdirSync(MINIGAMES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.') && d.name !== 'node_modules')
    .map((d) => d.name)
    .sort();

  for (const id of folders) {
    const dir = join(MINIGAMES_DIR, id);
    const skip = (why: string) => console.warn(`[minigames] Skipped "${id}": ${why}`);

    if (!ID_PATTERN.test(id)) {
      skip('folder names may only use lower-case letters, digits and dashes');
      continue;
    }
    const missing = ['meta.ts', 'server.ts', 'client.tsx'].filter((f) => !existsSync(join(dir, f)));
    if (missing.length) {
      skip(`missing ${missing.join(', ')}`);
      continue;
    }

    try {
      const [metaModule, serverModule] = await Promise.all([
        import(pathToFileURL(join(dir, 'meta.ts')).href),
        import(pathToFileURL(join(dir, 'server.ts')).href),
      ]);
      const meta = metaModule.default as MinigameMeta | undefined;
      const problems = checkMeta(meta);
      const server = serverModule.default as ServerMinigame<unknown, unknown> | undefined;
      if (typeof server?.create !== 'function') problems.push('server.ts has no default export (use `export default defineServer({...})`)');
      else if (!(server.maxDurationMs > 0)) problems.push('"maxDurationMs" in server.ts must be a positive number');
      if (problems.length) {
        skip(problems.join('; '));
        continue;
      }
      catalog.set(id, { info: { ...meta!, id, minPlayers: meta!.minPlayers ?? 1 }, server: server! });
    } catch (error) {
      skip(`it failed to load:\n${error instanceof Error ? (error.stack ?? error.message) : String(error)}`);
    }
  }

  console.log(`[minigames] Loaded ${catalog.size}: ${[...catalog.keys()].join(', ') || '(none)'}`);
  return catalog;
}
