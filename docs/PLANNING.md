# PromptFlow Studio — Planning Document

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────────────┐  ┌───────────────┐ │
│  │   Sidebar    │  │       Canvas         │  │  Properties   │ │
│  │   (Library)  │  │    (React Flow)      │  │    Panel      │ │
│  │              │  │                      │  │               │ │
│  │  - Assets    │  │  - Nodes             │  │  - Node       │ │
│  │  - Drag/Drop │  │  - Edges             │  │    editing    │ │
│  │  - Projects  │  │  - Zoom/Pan          │  │  - Context    │ │
│  └──────────────┘  └──────────────────────┘  └───────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                     State Management (Zustand)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ flowStore   │  │projectStore │  │      uiStore            │ │
│  │ - nodes     │  │ - name      │  │  - selectedNode         │ │
│  │ - edges     │  │ - assets    │  │  - sidebarOpen          │ │
│  │ - actions   │  │ - history   │  │  - panelOpen            │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                      Prompt Engine                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  assemblePrompt(outputNode) → traverses graph → string  │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                     Model Adapters                              │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│  │  DALL-E   │  │   SDXL    │  │   Flux    │  │   Mock    │   │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                      Persistence                                │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐  │
│  │    LocalStorage     │  │     JSON Export/Import          │  │
│  └─────────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure (Target)

```
client/
├── src/
│   ├── components/
│   │   ├── canvas/
│   │   │   └── Canvas.tsx           # React Flow wrapper
│   │   ├── nodes/
│   │   │   ├── BaseNode.tsx         # Shared node wrapper/styling
│   │   │   ├── CharacterNode.tsx    # blue
│   │   │   ├── SettingNode.tsx      # green
│   │   │   ├── PropNode.tsx         # amber
│   │   │   ├── StyleNode.tsx        # purple
│   │   │   ├── ExtrasNode.tsx       # slate
│   │   │   ├── ShotNode.tsx         # pink
│   │   │   ├── OutfitNode.tsx       # cyan (modifier)
│   │   │   ├── ActionNode.tsx       # orange
│   │   │   ├── NegativeNode.tsx     # rose
│   │   │   ├── ParametersNode.tsx   # teal
│   │   │   ├── EditNode.tsx         # gray
│   │   │   ├── OutputNode.tsx       # red
│   │   │   └── index.ts             # Node type registry
│   │   ├── sidebar/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── AssetList.tsx
│   │   │   └── ProjectSelector.tsx
│   │   ├── panels/
│   │   │   ├── PropertiesPanel.tsx
│   │   │   └── NodeEditor.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── TextArea.tsx
│   │       └── Select.tsx
│   ├── stores/
│   │   ├── flowStore.ts             # Nodes, edges, graph operations
│   │   ├── projectStore.ts          # Project metadata, saved assets
│   │   └── uiStore.ts               # UI state (selection, panels)
│   ├── engine/
│   │   ├── assembler.ts             # Prompt assembly logic
│   │   └── traversal.ts             # Graph traversal utilities
│   ├── adapters/
│   │   ├── types.ts                 # Common adapter interface
│   │   ├── mock.ts                  # Returns placeholder images
│   │   ├── dalle.ts                 # OpenAI DALL-E 3
│   │   └── sdxl.ts                  # Stable Diffusion XL
│   ├── hooks/
│   │   ├── useNodeDrag.ts
│   │   ├── usePromptAssembly.ts
│   │   └── useProjectPersistence.ts
│   ├── types/
│   │   ├── nodes.ts                 # Node data interfaces
│   │   ├── project.ts               # Project structure
│   │   └── generation.ts            # API request/response types
│   ├── utils/
│   │   ├── storage.ts               # LocalStorage helpers
│   │   └── export.ts                # JSON export/import
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── package.json
└── ...config files
```

---

## Data Models

### Node Data Types

```typescript
// Base for all nodes
interface BaseNodeData {
  label: string;
}

// ===== ASSET NODES =====

// Character node (blue)
interface CharacterNodeData extends BaseNodeData {
  name: string;
  description: string; // includes default outfit
}

// Setting node (green)
interface SettingNodeData extends BaseNodeData {
  name: string;
  description: string;
}

// Prop node (amber)
interface PropNodeData extends BaseNodeData {
  name: string;
  description: string;
}

// Style node (purple)
interface StyleNodeData extends BaseNodeData {
  name: string;
  description: string;
}

// Extras node (slate)
interface ExtrasNodeData extends BaseNodeData {
  name: string;
  description: string;
}

// ===== MODIFIER NODES =====

// Shot node (pink)
type ShotPreset =
  | 'establishing' | 'wide' | 'medium' | 'close-up' | 'extreme-close-up'
  | 'over-the-shoulder' | 'two-shot' | 'low-angle' | 'high-angle'
  | 'dutch-angle' | 'pov' | 'birds-eye' | 'tracking';

interface ShotNodeData extends BaseNodeData {
  name: string;
  preset: ShotPreset;
  description?: string; // additional framing notes
}

// Outfit node (cyan) — connects to Character, overrides appearance
interface OutfitNodeData extends BaseNodeData {
  name: string;
  description: string;
  forCharacterId?: string; // ID of connected Character node
}

// ===== SCENE NODES =====

// Action node (orange)
interface ActionNodeData extends BaseNodeData {
  content: string;
}

// ===== TECHNICAL NODES =====

// Negative node (rose)
interface NegativeNodeData extends BaseNodeData {
  name: string;
  content: string;
}

// Parameters node (teal)
interface ParametersNodeData extends BaseNodeData {
  model: 'dalle3' | 'sdxl' | 'flux' | 'mock';
  aspectRatio: '1:1' | '16:9' | '9:16' | '2:3' | '3:2';
  seed?: number;
}

// Edit/Refine node (gray)
interface EditNodeData extends BaseNodeData {
  refinement: string;
}

// ===== TERMINAL NODE =====

// Output node (red)
interface OutputNodeData extends BaseNodeData {
  promptPreview: string;
  generatedImageUrl?: string;
  status: 'idle' | 'generating' | 'complete' | 'error';
  error?: string;
}
```

### Project Structure

```typescript
interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;

  // Saved assets (appear in library sidebar)
  assets: {
    characters: SavedAsset[];
    settings: SavedAsset[];
    props: SavedAsset[];
    styles: SavedAsset[];
    shots: SavedAsset[];
    extras: SavedAsset[];
    outfits: SavedAsset[];
    negatives: SavedAsset[];
  };

  // Current canvas state
  canvas: {
    nodes: Node[];
    edges: Edge[];
    viewport: { x: number; y: number; zoom: number };
  };

  // Generation history
  history: GenerationRecord[];
}

interface SavedAsset {
  id: string;
  name: string;
  nodeType: NodeType;
  data: Record<string, unknown>;
  createdAt: string;
}

interface GenerationRecord {
  id: string;
  timestamp: string;
  prompt: string;
  negativePrompt?: string;
  imageUrl: string;
  nodeSnapshot: string[]; // IDs of nodes used
  parameters: ParametersNodeData;
}

type NodeType =
  | 'character' | 'setting' | 'prop' | 'style' | 'extras'
  | 'shot' | 'outfit' | 'action' | 'negative' | 'parameters'
  | 'edit' | 'output';
```

---

## Prompt Assembly Algorithm

```
function assemblePrompt(outputNode):
    visited = Set()

    // Collected elements
    shot = null
    characters = []          // { data, outfitOverride? }
    props = []
    settings = []
    extras = []
    actions = []
    styles = []
    negatives = []
    parameters = default

    // Track outfit-to-character connections
    outfitOverrides = Map()  // characterId -> outfitData

    function traverse(node):
        if node.id in visited: return
        visited.add(node.id)

        switch node.type:
            case 'shot':       shot = node.data
            case 'character':  characters.push({ id: node.id, data: node.data })
            case 'prop':       props.push(node.data)
            case 'setting':    settings.push(node.data)
            case 'extras':     extras.push(node.data)
            case 'style':      styles.push(node.data)
            case 'action':     actions.push(node.data)
            case 'negative':   negatives.push(node.data)
            case 'parameters': parameters = node.data
            case 'outfit':
                // Find connected character and store override
                connectedChar = findConnectedCharacter(node)
                if connectedChar:
                    outfitOverrides.set(connectedChar.id, node.data)

        for each upstream node connected to this node:
            traverse(upstream)

    traverse(outputNode)

    // Apply outfit overrides to characters
    finalCharacters = characters.map(char => {
        if outfitOverrides.has(char.id):
            return mergeCharacterWithOutfit(char.data, outfitOverrides.get(char.id))
        return char.data
    })

    return {
        prompt: formatPrompt({
            shot,
            characters: finalCharacters,
            props,
            settings,
            extras,
            actions,
            styles
        }),
        negativePrompt: formatNegative(negatives),
        parameters: parameters
    }

function formatPrompt({ shot, characters, props, settings, extras, actions, styles }):
    parts = []

    if shot:
        parts.push(shotPresetToText(shot.preset) + (shot.description || ''))

    for char in characters:
        parts.push(char.name + ', ' + char.description)

    for prop in props:
        parts.push(prop.description)

    for setting in settings:
        parts.push('Setting: ' + setting.description)

    for extra in extras:
        parts.push(extra.description)

    for action in actions:
        parts.push(action.content)

    for style in styles:
        parts.push(style.description)

    return parts.join('. ')
```

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State management | Zustand | Lightweight, no boilerplate, works well with React Flow |
| Node library | React Flow | Industry standard, handles zoom/pan/connections |
| Styling | Tailwind CSS | Rapid iteration, dark mode support, consistent design |
| Persistence (MVP) | LocalStorage | No backend needed, instant save |
| API calls | Client-side | Simpler MVP; user provides own API keys |
| TypeScript | Strict mode | Catch errors early, better DX |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| LocalStorage size limits (~5MB) | Warn user when approaching limit; export functionality |
| API key security | Keys stored in sessionStorage, cleared on tab close; never logged |
| React Flow performance with many nodes | Virtualization is built-in; test with 100+ nodes |
| Prompt assembly edge cases | Unit test the traversal algorithm thoroughly |
| Model API changes | Adapter pattern isolates changes to one file |

---

## Development Principles

1. **Get something on screen fast** — Ugly but working beats perfect but unbuilt
2. **Test the graph logic early** — Traversal bugs are hard to debug visually
3. **Dark mode from day one** — Retrofitting themes is painful
4. **Type everything** — Node data shapes will evolve; types catch mismatches
5. **Commit working states** — Small, frequent commits over big bangs
