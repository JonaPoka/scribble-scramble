import { AVATAR_LIMITS, emptyDrawing, type Drawing, type DrawingTool } from '@scribble/shared';
import { useEffect, useState } from 'react';
import { DrawingCanvas } from './DrawingCanvas';
import { DrawingTools } from './DrawingTools';
import { DrawingView } from './DrawingView';
import { DEFAULT_PENCIL_COLOR } from './palette';
import { CHARACTER_TEMPLATES } from './templates';
import { useDrawingHistory } from './useDrawingHistory';

/** Lets a player pick a starting character and change it by drawing and erasing. */
export function CharacterEditor({ value, onChange }: { value: Drawing; onChange: (drawing: Drawing) => void }) {
  const history = useDrawingHistory(value);
  const [tool, setTool] = useState<DrawingTool>('pencil');
  const [color, setColor] = useState<string>(DEFAULT_PENCIL_COLOR);
  const [size, setSize] = useState(6);

  useEffect(() => {
    onChange(history.drawing);
  }, [history.drawing, onChange]);

  return (
    <div className="char-editor">
      <div className="char-editor__templates" role="group" aria-label="Start from a character">
        {CHARACTER_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            className="char-template"
            title={t.name}
            aria-label={`Start from the ${t.name.toLowerCase()}`}
            onClick={() => history.commit(t.drawing)}
          >
            <DrawingView drawing={t.drawing} size={44} alt="" />
          </button>
        ))}
        <button
          type="button"
          className="char-template char-template--blank"
          title="Blank"
          aria-label="Start from a blank page"
          onClick={() => history.commit(emptyDrawing())}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>

      <div className="char-editor__canvas">
        <DrawingCanvas
          drawing={history.drawing}
          onChange={history.commit}
          tool={tool}
          color={color}
          size={size}
          maxStrokes={AVATAR_LIMITS.maxStrokes}
          maxPoints={AVATAR_LIMITS.maxPoints}
          label="Your character. Draw on it to change it."
        />
        {/* Avatars are shown in a circle: this ring shows what will be visible. */}
        <span className="char-editor__guide" aria-hidden="true" />
      </div>

      <DrawingTools
        tool={tool}
        onToolChange={setTool}
        color={color}
        onColorChange={setColor}
        size={size}
        onSizeChange={setSize}
        onUndo={history.undo}
        onRedo={history.redo}
        onClear={history.clear}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
      />
    </div>
  );
}
