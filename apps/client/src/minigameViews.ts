import type { MinigameViewProps } from '@scribble/shared';
import type { ComponentType } from 'react';

type View = ComponentType<MinigameViewProps<any, any>>;

/**
 * Every minigames/<id>/client.tsx, found at build time. Adding a folder is enough: Vite picks
 * new files up while the dev server runs. Folders starting with "_" (the template) are skipped.
 */
const modules = import.meta.glob<{ default?: View }>('../../../minigames/*/client.tsx', { eager: true });

export const MINIGAME_VIEWS: Record<string, View> = {};
for (const [path, module] of Object.entries(modules)) {
  const id = /minigames\/([^/]+)\/client\.tsx$/.exec(path)?.[1];
  if (!id || id.startsWith('_')) continue;
  if (module.default) MINIGAME_VIEWS[id] = module.default;
  else console.warn(`[minigames] ${path} has no default export, so "${id}" can't be shown.`);
}
