# Drawing system

One drawing system for everything that's drawn: player characters, the sketchpad, and drawing minigames like Quick Sketch. Minigames import it from `@scribble/client/kit`.

## Drawings are strokes

A drawing is a list of strokes, not pixels (`Drawing` and `Stroke` in `packages/shared/src/drawing.ts`):

```ts
{ width: 256, height: 256, strokes: [
  { tool: 'pencil', color: '#ff5d4f', size: 6, points: [x0, y0, x1, y1, ...] },
  { tool: 'eraser', color: '#2b1d14', size: 12, points: [...] },
] }
```

- Small to send over Socket.IO, and sharp at any size.
- Coordinates are in drawing units (`width` × `height`), not screen pixels, so the same drawing works on any screen.
- The eraser is a stroke too, so templates can be erased and every change can be undone.
- **On the server, always pass drawings from players through `sanitizeDrawing(raw, limits)`** (or `sanitizeStroke` for single strokes). It checks the shape, colours, sizes and point counts, and returns a clean copy or `null`.

## The pencil brush

`StrokePainter` (`render.ts`) paints a stroke as thousands of tiny, semi-transparent grains, denser in the middle than at the edges, so lines look like graphite. The grain comes from a seeded random generator (`strokeSeed(index)`), so a drawing looks exactly the same every time and on every screen. The same painter draws while you drag and when a whole drawing is re-rendered, so finished strokes don't shift.

## Pieces

| Export | What it does |
| --- | --- |
| `DrawingCanvas` | The drawing surface. Pointer input (mouse, touch, pen), live painting, brush cursor. Controlled: pass `drawing`, get the new drawing in `onChange` after each stroke. Optional `underlay`: a drawing painted underneath on its own layer, which the eraser can't touch |
| `useDrawingHistory(initial)` | A drawing with `commit`, `undo`, `redo`, `clear`, `canUndo`, `canRedo` |
| `DrawingTools` | Pencil/eraser, brush sizes, colour picker, undo/redo/clear |
| `ColorPicker` | The 16 pencil colours plus a custom colour |
| `DrawingView` | Shows a drawing as an image, optionally over an `underlay` (cached per drawing, size and underlay). Use it for avatars, thumbnails, galleries |
| `renderDrawing(ctx, drawing, scale)` | Paints a drawing onto any canvas |
| `Sketch` | Builds drawings from code: lines, outlines, scribbled fills. Used for the avatar body |
| `AVATAR_BODY` | The base body every character is drawn on |
| `CharacterEditor`, `CharacterDialog` | The character creator, and the same in a popup with Save and Cancel |

## A drawing area in five lines

```tsx
const history = useDrawingHistory({ width: 800, height: 560, strokes: [] });
const [tool, setTool] = useState<DrawingTool>('pencil');
const [color, setColor] = useState<string>(DEFAULT_PENCIL_COLOR);
const [size, setSize] = useState(6);

<DrawingCanvas drawing={history.drawing} onChange={history.commit} tool={tool} color={color} size={size} label="Your drawing" />
<DrawingTools tool={tool} onToolChange={setTool} color={color} onColorChange={setColor} size={size} onSizeChange={setSize}
  onUndo={history.undo} onRedo={history.redo} onClear={history.clear} canUndo={history.canUndo} canRedo={history.canRedo} />
```

`screens/Sketchpad.tsx` (open `/sketchpad`) is exactly this.

## Live drawing for multiplayer games

For a game where one player draws and the others watch:

- **Drawer:** `onStrokeProgress(stroke)` fires as the current stroke grows. Send its new points to the server (throttle to every ~50 ms), and send the finished stroke from `onChange`.
- **Server:** run each stroke through `sanitizeStroke`, then forward it with `ctx.emit`.
- **Watchers:** add finished strokes to their drawing and pass it to a `DrawingCanvas` with `disabled`. It repaints when `drawing` changes. To show a stroke while it's still being drawn, render the drawing plus that stroke.

Set `maxStrokes` and `maxPoints` on `DrawingCanvas` to the same limits the server checks, so players can't draw something the server will reject.

## Player characters

- Everyone draws on the same base body, `AVATAR_BODY` (`body.ts`): a head with ears, a neck and shoulders in a neutral colour. Players add the face, hair, clothes and anything else.
- The body is an `underlay`: it's painted on its own layer, so the eraser only removes the player's strokes. It's never sent over the network. Every client builds the same body, and `Avatar` and `DrawingView` paint it under each player's drawing.
- A player's drawing holds only their own strokes: `AVATAR_SIZE` (256) squares, checked against `AVATAR_LIMITS` on the server and shown in a circle (the editor's dashed ring).
- The server sends avatars once per player with the `room:avatars` event, not inside every room state, because they're the largest thing a client receives.
- The home screen shows your character and opens `CharacterDialog` to change it. It's saved in `localStorage` when you press Save.

To change the body, edit `body.ts` (fill shapes first, then outlines). Changing it changes every player's character, so keep the head where it is or faces drawn on the old body will no longer line up.
