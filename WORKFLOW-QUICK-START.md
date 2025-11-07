# FL Studio Workflow UX - Quick Start Guide

## Quick Integration

### 1. Import Styles
The styles are automatically imported in `src/index.tsx`. If you need to import manually:

```typescript
import './styles/index.css';
```

### 2. Use Keyboard Shortcuts

```typescript
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

function MyComponent() {
  const shortcuts = useKeyboardShortcuts({ context: 'global' });
  
  useEffect(() => {
    shortcuts.registerShortcut(
      'my-action',
      'My Action',
      'Does something cool',
      { key: 'KeyK', modifiers: ['ctrl'] },
      () => {
        // Your action
      }
    );
  }, [shortcuts]);
}
```

### 3. Use Context Menus

```typescript
import { useContextMenu } from '../hooks/useContextMenu';
import { contextMenuService } from '../services/ContextMenuService';

function MyTrack({ track }) {
  const contextMenu = useContextMenu();
  const trackRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (trackRef.current) {
      const items = contextMenuService.getChannelRackTrackMenu(track, {
        onRename: () => console.log('Rename'),
        onDelete: () => console.log('Delete'),
      });
      contextMenu.attach(trackRef.current, items);
    }
  }, [track, contextMenu]);
  
  return <div ref={trackRef}>Track Content</div>;
}
```

### 4. Use Hint Panels

```typescript
import { useHintPanel, HintPanel } from '../components/ui/HintPanel';

function MyComponent() {
  const hintPanel = useHintPanel();
  
  return (
    <>
      <button
        onMouseEnter={(e) => hintPanel.showHint({
          name: 'Volume',
          description: 'Adjust track volume',
          value: '75%',
          min: 0,
          max: 100,
        }, e.clientX + 10, e.clientY + 10)}
        onMouseLeave={() => hintPanel.hideHint()}
      >
        Volume
      </button>
      <HintPanel
        data={hintPanel.hintData}
        x={hintPanel.hintPosition.x}
        y={hintPanel.hintPosition.y}
      />
    </>
  );
}
```

### 5. Use Window Management

```typescript
import { useWindowManager } from '../hooks/useWindowManager';
import { Window } from '../components/windows/Window';

function MyApp() {
  const windows = useWindowManager();
  
  return (
    <>
      <button onClick={() => windows.toggleWindowByType('piano-roll')}>
        Toggle Piano Roll
      </button>
      {windows.windows.map(window => (
        <Window
          key={window.id}
          window={window}
          onUpdate={windows.updateWindow}
          onClose={windows.closeWindow}
          // ... other handlers
        >
          Window Content
        </Window>
      ))}
    </>
  );
}
```

### 6. Use Tools

```typescript
import { useTools } from '../hooks/useTools';

function Toolbar() {
  const tools = useTools();
  
  return (
    <div>
      <button
        onClick={() => tools.setTool('draw')}
        className={tools.currentTool === 'draw' ? 'active' : ''}
      >
        Draw
      </button>
      <button
        onClick={() => tools.setTool('select')}
        className={tools.currentTool === 'select' ? 'active' : ''}
      >
        Select
      </button>
    </div>
  );
}
```

### 7. Use UI Components

```typescript
import { Button, Panel, Knob, Fader, LED, StepButton } from '../components/ui';

function MyPanel() {
  const [volume, setVolume] = useState(75);
  
  return (
    <Panel title="Mixer" variant="raised">
      <Fader
        value={volume}
        min={0}
        max={100}
        label="Volume"
        unit="%"
        onChange={setVolume}
      />
      <Knob
        value={50}
        min={0}
        max={100}
        label="Pan"
        onChange={(v) => console.log(v)}
      />
      <LED color="green" active={true} label="Active" />
      <StepButton active={true} beatMarker={true} />
    </Panel>
  );
}
```

### 8. Use Mouse Interactions

```typescript
import { useMouseInteractions } from '../hooks/useMouseInteractions';

function PianoRoll() {
  const mouse = useMouseInteractions();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (canvasRef.current) {
      mouse.registerScrollZoom(canvasRef.current, (delta) => {
        // Handle zoom
        console.log('Zoom:', delta);
      });
      
      mouse.registerMiddleMousePan(canvasRef.current, (state) => {
        // Handle pan
        console.log('Pan:', state.deltaX, state.deltaY);
      });
    }
  }, [mouse]);
  
  return <canvas ref={canvasRef} />;
}
```

## Default Keyboard Shortcuts

- **F5**: Toggle Browser
- **F6**: Toggle Channel Rack
- **F7**: Toggle Playlist
- **F8**: Toggle Mixer
- **F9**: Toggle Piano Roll
- **L**: Toggle Pattern/Song Mode
- **1-7**: Switch Tools (Draw, Paint, Select, Slip, Delete, Mute, Slice)

## Services Available

- `keyboardShortcutService` - Keyboard shortcuts
- `mouseInteractionService` - Mouse interactions
- `windowManagerService` - Window management
- `toolManagerService` - Tool switching
- `contextMenuService` - Context menu generation
- `ghostNotesService` - Ghost notes
- `automationService` - Automation clips
- `themeService` - Theme management
- `userPreferencesService` - User preferences

## Example Components

See `src/components/examples/` for complete integration examples:
- `ChannelRackExample` - Shows context menus, hint panels, and step buttons
- `ToolbarExample` - Shows tool switching UI

## Next Steps

1. Replace existing UI elements with new components
2. Add context menus to interactive elements
3. Integrate hint panels for parameter controls
4. Connect mouse interactions to canvas/editor components
5. Customize themes and preferences

