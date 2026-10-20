import { type DrawingTool } from '@scribble/shared';
import { useState } from 'react';
import { DEFAULT_PENCIL_COLOR, DEFAULT_PENCIL_OPACITY, DrawingCanvas, DrawingTools, countPoints, useDrawingHistory } from '../drawing';

/**
 * A free drawing page, and a demo of the drawing system at a different size than avatars.
 * Drawing minigames (Quick Sketch) will use the same canvas, tools and history.
 */
export function Sketchpad() {
  const history = useDrawingHistory({ width: 800, height: 560, strokes: [] });
  const [tool, setTool] = useState<DrawingTool>('pencil');
  const [color, setColor] = useState<string>(DEFAULT_PENCIL_COLOR);
  const [size, setSize] = useState(6);
  const [opacity, setOpacity] = useState(DEFAULT_PENCIL_OPACITY);

  return (
    <main className="screen sketchpad">
      <header className="sketchpad__head">
        <h1 className="h1">Sketchpad</h1>
        <a className="ss-btn ss-btn--ghost" href="/">
          Back to the game
        </a>
      </header>
      <div className="sketchpad__body">
        <DrawingCanvas drawing={history.drawing} onChange={history.commit} tool={tool} color={color} size={size} opacity={opacity} label="Sketchpad" />
        <aside className="ss-panel sketchpad__tools">
          <DrawingTools
            tool={tool}
            onToolChange={setTool}
            color={color}
            onColorChange={setColor}
            size={size}
            onSizeChange={setSize}
            opacity={opacity}
            onOpacityChange={setOpacity}
            onUndo={history.undo}
            onRedo={history.redo}
            onClear={history.clear}
            canUndo={history.canUndo}
            canRedo={history.canRedo}
          />
          <p className="note">
            {history.drawing.strokes.length} {history.drawing.strokes.length === 1 ? 'stroke' : 'strokes'},{' '}
            {countPoints(history.drawing).toLocaleString()} points
          </p>
        </aside>
      </div>
    </main>
  );
}
