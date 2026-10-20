import type { Drawing } from '@scribble/shared';
import { useCallback, useState } from 'react';

interface History {
  past: Drawing[];
  present: Drawing;
  future: Drawing[];
}

/**
 * A drawing with undo and redo. Every `commit` (a finished stroke, a cleared canvas, a drawing
 * loaded from elsewhere) is one undo step.
 */
export function useDrawingHistory(initial: Drawing | (() => Drawing), limit = 80) {
  const [history, setHistory] = useState<History>(() => ({
    past: [],
    present: typeof initial === 'function' ? initial() : initial,
    future: [],
  }));

  const commit = useCallback(
    (next: Drawing) => setHistory((h) => ({ past: [...h.past, h.present].slice(-limit), present: next, future: [] })),
    [limit],
  );
  const undo = useCallback(
    () =>
      setHistory((h) =>
        h.past.length ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1]!, future: [h.present, ...h.future] } : h,
      ),
    [],
  );
  const redo = useCallback(
    () => setHistory((h) => (h.future.length ? { past: [...h.past, h.present], present: h.future[0]!, future: h.future.slice(1) } : h)),
    [],
  );
  const clear = useCallback(
    () =>
      setHistory((h) =>
        h.present.strokes.length ? { past: [...h.past, h.present].slice(-limit), present: { ...h.present, strokes: [] }, future: [] } : h,
      ),
    [limit],
  );

  return {
    drawing: history.present,
    commit,
    undo,
    redo,
    clear,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
