# PromptFlow Studio - Project Guidelines

## Overview

PromptFlow Studio is a visual tool for crafting AI-generated images with the creative control of a Dungeon Master. Build a library of reusable characters, settings, props, and styles — then combine them with action descriptions to rapidly iterate on visual storytelling.

**Primary use case:** Creating comic books and illustrated stories with consistent characters, settings, and style across dozens or hundreds of panels.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, React Flow, Tailwind CSS, Zustand
- **Backend:** Node.js, Express, TypeScript
- **Storage:** LocalStorage (MVP), future migration to SQLite/Postgres
- **APIs:** OpenAI DALL-E 3, Stability AI

## Project Structure

```
prompt-nodes/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── nodes/         # React Flow node components
│   │   │   ├── panels/        # Sidebar, properties panel
│   │   │   └── ui/            # Buttons, inputs, etc.
│   │   ├── hooks/             # Custom React hooks
│   │   ├── stores/            # Zustand state stores
│   │   ├── types/             # TypeScript type definitions
│   │   ├── utils/             # Helper functions
│   │   ├── lib/               # External integrations
│   │   └── App.tsx
│   └── ...
├── server/                    # Express backend
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Express middleware
│   │   └── types/             # Shared types
│   └── ...
└── docs/                      # Documentation
    └── PRD.md                 # Product requirements
```

## Coding Conventions

### TypeScript

- Strict mode enabled
- Prefer `interface` over `type` for object shapes
- Use explicit return types on exported functions
- Avoid `any`; use `unknown` when type is truly unknown

### React Components

- Functional components only
- Named exports for components
- Props interface defined above component:

```tsx
interface NodeCardProps {
  title: string;
  children: React.ReactNode;
}

export function NodeCard({ title, children }: NodeCardProps) {
  // ...
}
```

### React Flow Nodes

Each node type lives in `client/src/components/nodes/`:

```tsx
// CharacterNode.tsx
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { CharacterNodeData } from '@/types/nodes';

export function CharacterNode({ data }: NodeProps<CharacterNodeData>) {
  return (
    <div className="node-card node-character">
      <Handle type="target" position={Position.Left} />
      <div className="node-header">
        <span className="node-icon">👤</span>
        <span className="node-title">{data.name}</span>
      </div>
      <div className="node-body">
        <div className="node-field">{data.description}</div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
```

### State Management (Zustand)

- One store per domain (e.g., `useFlowStore`, `useSettingsStore`)
- Keep stores in `client/src/stores/`
- Use immer middleware for complex state updates

```tsx
// stores/flowStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  addNode: (node: Node) => void;
}

export const useFlowStore = create<FlowState>()(
  immer((set) => ({
    nodes: [],
    edges: [],
    addNode: (node) => set((state) => { state.nodes.push(node); }),
  }))
);
```

### Styling (Tailwind CSS)

- Dark mode first (matches PRD aesthetic: Blender/Unreal Blueprints style)
- Use CSS variables for theme colors in `tailwind.config.ts`
- Component-specific styles via Tailwind classes, avoid separate CSS files

**Node colors by type:**
| Node | Color Name | Hex |
|------|------------|-----|
| Character | Blue | #3b82f6 |
| Setting | Green | #10b981 |
| Prop | Amber | #f59e0b |
| Style | Purple | #a855f7 |
| Extras | Slate | #64748b |
| Shot | Pink | #ec4899 |
| Outfit | Cyan | #06b6d4 |
| Action | Orange | #f97316 |
| Negative | Rose | #f43f5e |
| Parameters | Teal | #14b8a6 |
| Edit | Gray | #6b7280 |
| Output | Red | #ef4444 |

**Node states:**
- Idle: default border color
- Selected: `ring-2` with node color, glow effect
- Processing: `animate-pulse`
- Error: `ring-2 ring-red-500`

### File Naming

- Components: PascalCase (`TextNode.tsx`)
- Hooks: camelCase with `use` prefix (`useNodeDrag.ts`)
- Stores: camelCase with `Store` suffix (`flowStore.ts`)
- Utils: camelCase (`formatPrompt.ts`)
- Types: camelCase (`nodes.ts` exporting interfaces)

## Node Types Reference

| Category | Node | Purpose | Color |
|----------|------|---------|-------|
| Asset | Character | Who (named entity with appearance) | Blue |
| Asset | Setting | Where (location/environment) | Green |
| Asset | Prop | What (consistent objects) | Amber |
| Asset | Style | How it looks (visual aesthetic) | Purple |
| Asset | Extras | Background life (crowds, ambient) | Slate |
| Modifier | Shot | Camera framing (DP presets) | Pink |
| Modifier | Outfit | Character appearance override | Cyan |
| Scene | Action | What's happening (DM narration) | Orange |
| Technical | Negative | What to avoid | Rose |
| Technical | Parameters | Model, aspect ratio, seed | Teal |
| Technical | Edit/Refine | Iteration on previous output | Gray |
| Terminal | Output | Assemble prompt + generate | Red |

**Shot Presets:** establishing, wide, medium, close-up, extreme-close-up, over-the-shoulder, two-shot, low-angle, high-angle, dutch-angle, pov, birds-eye, tracking

## API Design

Backend endpoints follow REST conventions:

- `POST /api/generate` — Execute generation with workflow
- `GET /api/history` — Retrieve generation history
- `POST /api/workflows` — Save workflow
- `GET /api/workflows/:id` — Load workflow

## Testing

- Unit tests: Vitest for utilities and hooks
- Component tests: React Testing Library
- E2E tests: Playwright (when needed)
- Test files colocated: `Component.test.tsx` next to `Component.tsx`

## Git Workflow

- Branch naming: `feature/`, `fix/`, `refactor/`
- Commit messages: imperative mood ("Add text node", not "Added text node")
- Keep commits atomic and focused

## Development Commands

```bash
# Client
cd client
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint check

# Server (once set up)
cd server
npm run dev      # Start with hot reload
npm run build    # Compile TypeScript
```
