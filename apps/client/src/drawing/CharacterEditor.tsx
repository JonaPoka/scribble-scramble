import { AVATAR_LIMITS, type Drawing, type DrawingTool } from '@scribble/shared';
import { useEffect, useRef, useState } from 'react';
import { AVATAR_BODY } from './body';
import { DrawingCanvas } from './DrawingCanvas';
import { DrawingTools } from './DrawingTools';
import { DEFAULT_PENCIL_COLOR } from './palette';
import { useDrawingHistory } from './useDrawingHistory';

/** Draw on the shared base body. The body is its own layer, so the eraser only removes the player's strokes. */
export function CharacterEditor({ initial, onChange }: { initial: Drawing; onChange: (drawing: Drawing) => void }) {
  const history = useDrawingHistory(initial);
  const [tool, setTool] = useState<DrawingTool>('pencil');
  const [color, setColor] = useState<string>(DEFAULT_PENCIL_COLOR);
  const [size, setSize] = useState(6);

  useEffect(() => {
    onChange(history.drawing);
  }, [history.drawing, onChange]);

  return (
    <div className="char-editor">
      <div className="char-editor__canvas">
        <DrawingCanvas
          drawing={history.drawing}
          underlay={AVATAR_BODY}
          onChange={history.commit}
          tool={tool}
          color={color}
          size={size}
          maxStrokes={AVATAR_LIMITS.maxStrokes}
          maxPoints={AVATAR_LIMITS.maxPoints}
          label="Your character. Draw a face, hair and clothes on it."
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
        onClear={history.clear}
        canUndo={history.canUndo}
      />
    </div>
  );
}

/**
 * The character editor in a popup. Changes only count when the player presses Save;
 * Cancel and Esc throw them away.
 */
export function CharacterDialog({
  open,
  value,
  onSave,
  onClose,
}: {
  open: boolean;
  value: Drawing;
  onSave: (drawing: Drawing) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const draft = useRef(value);
  const setDraft = useRef((d: Drawing) => {
    draft.current = d;
  }).current;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      draft.current = value;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, value]);

  return (
    <dialog
      ref={ref}
      className="ss-panel char-dialog"
      aria-labelledby="char-dialog-title"
      onCancel={(e) => {
        // Esc: close through React state so the popup and `open` stay in sync.
        e.preventDefault();
        onClose();
      }}
    >
      <h2 className="ss-panel__title" id="char-dialog-title">
        Draw your character
      </h2>
      <p className="note">give them a face, hair, a hat, clothes… the body stays put</p>
      {/* Only mounted while open, so every opening starts a fresh editor and undo history. */}
      {open && <CharacterEditor initial={value} onChange={setDraft} />}
      <div className="char-dialog__actions">
        <button type="button" className="ss-btn ss-btn--ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="ss-btn ss-btn--go" onClick={() => onSave(draft.current)}>
          Save character
        </button>
      </div>
    </dialog>
  );
}
