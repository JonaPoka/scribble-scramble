import { BRUSH_SIZES, type DrawingTool } from '@scribble/shared';
import type { CSSProperties, ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { PENCIL_PALETTE } from './palette';

function ToolIcon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const EraserIcon = () => (
  <ToolIcon>
    <path d="M8.6 20.4h11.6" />
    <path d="M3.9 14.6l9.8-10a2 2 0 0 1 2.9 0l3 3a2 2 0 0 1 0 2.9l-9.6 9.9H8.4z" />
    <path d="M8.9 9.5l5.7 5.8" />
  </ToolIcon>
);
const UndoIcon = () => (
  <ToolIcon>
    <path d="M9.2 5.2L4.4 9.8l4.8 4.6" />
    <path d="M4.8 9.8h9.4a5.4 5.4 0 0 1 0 10.8h-2.6" />
  </ToolIcon>
);
const RedoIcon = () => (
  <ToolIcon>
    <path d="M14.8 5.2l4.8 4.6-4.8 4.6" />
    <path d="M19.2 9.8H9.8a5.4 5.4 0 0 0 0 10.8h2.6" />
  </ToolIcon>
);
const TrashIcon = () => (
  <ToolIcon>
    <path d="M4.2 6.6h15.6" />
    <path d="M9.4 6.4V4.2h5.2v2.2" />
    <path d="M6.2 6.8l1.1 13a1.6 1.6 0 0 0 1.6 1.4h6.2a1.6 1.6 0 0 0 1.6-1.4l1.1-13" />
  </ToolIcon>
);

export interface ColorPickerProps {
  color: string;
  onChange: (hex: string) => void;
}

/** The pencil colours as drawn swatches, plus a custom colour of the player's choice. */
export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const isCustom = !PENCIL_PALETTE.some((c) => c.hex === color);
  return (
    <div className="draw-colors" role="radiogroup" aria-label="Pencil colour">
      {PENCIL_PALETTE.map((c) => (
        <button
          key={c.hex}
          type="button"
          role="radio"
          aria-checked={c.hex === color}
          aria-label={c.name}
          title={c.name}
          className="draw-swatch"
          style={{ '--swatch': c.hex } as CSSProperties}
          onClick={() => onChange(c.hex)}
        />
      ))}
      <label
        className={isCustom ? 'draw-swatch draw-swatch--custom is-picked' : 'draw-swatch draw-swatch--custom'}
        title="Pick any colour"
        style={isCustom ? ({ '--swatch': color } as CSSProperties) : undefined}
      >
        <input type="color" aria-label="Pick any colour" value={color} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}

export interface DrawingToolsProps {
  tool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  color: string;
  onColorChange: (hex: string) => void;
  size: number;
  onSizeChange: (size: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onClear?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

/** Pencil and eraser, brush sizes, colours, and undo / redo / clear. */
export function DrawingTools(props: DrawingToolsProps) {
  const { tool, onToolChange, color, onColorChange, size, onSizeChange } = props;
  return (
    <div className="draw-tools">
      <div className="draw-tools__row">
        <div className="draw-tools__group" role="group" aria-label="Tool">
          <button
            type="button"
            className="draw-tool"
            aria-pressed={tool === 'pencil'}
            onClick={() => onToolChange('pencil')}
            title="Pencil"
            aria-label="Pencil"
          >
            <Icon name="pencil" />
          </button>
          <button
            type="button"
            className="draw-tool"
            aria-pressed={tool === 'eraser'}
            onClick={() => onToolChange('eraser')}
            title="Eraser"
            aria-label="Eraser"
          >
            <EraserIcon />
          </button>
        </div>

        <div className="draw-tools__group" role="radiogroup" aria-label="Brush size">
          {BRUSH_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={size === s}
              aria-label={`Brush size ${s}`}
              className="draw-tool draw-size"
              onClick={() => onSizeChange(s)}
            >
              <span
                className="draw-size__dot"
                style={{ width: 4 + s * 0.9, height: 4 + s * 0.9, background: tool === 'eraser' ? 'var(--panel)' : color }}
              />
            </button>
          ))}
        </div>

        {(props.onUndo || props.onRedo || props.onClear) && (
          <div className="draw-tools__group" role="group" aria-label="History">
            {props.onUndo && (
              <button type="button" className="draw-tool" onClick={props.onUndo} disabled={!props.canUndo} title="Undo" aria-label="Undo">
                <UndoIcon />
              </button>
            )}
            {props.onRedo && (
              <button type="button" className="draw-tool" onClick={props.onRedo} disabled={!props.canRedo} title="Redo" aria-label="Redo">
                <RedoIcon />
              </button>
            )}
            {props.onClear && (
              <button type="button" className="draw-tool" onClick={props.onClear} title="Clear" aria-label="Clear the drawing">
                <TrashIcon />
              </button>
            )}
          </div>
        )}
      </div>

      <ColorPicker
        color={color}
        onChange={(hex) => {
          onColorChange(hex);
          onToolChange('pencil');
        }}
      />
    </div>
  );
}
