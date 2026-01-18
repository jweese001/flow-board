# PromptFlow Studio — Task Tracker

## Current Phase: 1 — Foundation

---

## Phase 1: Foundation

### Setup & Configuration
- [ ] Install dependencies (React Flow, Zustand, Tailwind CSS)
- [ ] Configure Tailwind with dark mode
- [ ] Set up path aliases (@/ for src/)
- [ ] Create directory structure per PLANNING.md

### Canvas & Layout
- [ ] Create main App layout (sidebar + canvas + properties panel)
- [ ] Integrate React Flow canvas with zoom/pan
- [ ] Implement dark theme base styles
- [ ] Add basic responsive behavior (collapsible sidebar)

### Node Types (Visual Only)
- [ ] Create base node wrapper component (consistent styling)
- [ ] CharacterNode — name + description fields (blue)
- [ ] SettingNode — name + description fields (green)
- [ ] PropNode — name + description fields (amber)
- [ ] StyleNode — name + description fields (purple)
- [ ] ShotNode — name + preset dropdown + description (pink)
- [ ] ActionNode — content textarea (orange)
- [ ] OutputNode — prompt preview + generate button (red)

### Node Connections
- [ ] Define handle positions (inputs left, outputs right)
- [ ] Implement connection validation (type checking)
- [ ] Style edges (bezier curves, dark theme colors)

### State Management
- [ ] Create flowStore (nodes, edges, CRUD operations)
- [ ] Create uiStore (selected node, panel visibility)
- [ ] Wire React Flow to Zustand store

### Prompt Assembly
- [ ] Implement graph traversal (upstream from Output)
- [ ] Implement prompt concatenation logic
- [ ] Display assembled prompt in Output node
- [ ] Unit tests for traversal edge cases

### Mock Generation
- [ ] Create mock adapter (returns placeholder image after delay)
- [ ] Wire Output node generate button to mock adapter
- [ ] Show loading state during "generation"
- [ ] Display result image in Output node

---

## Phase 2: Real Generation

### Additional Nodes
- [ ] NegativeNode — name + content field (rose)
- [ ] ParametersNode — model select, aspect ratio, seed (teal)
- [ ] ExtrasNode — name + description for background elements (slate)
- [ ] Include all nodes in assembly

### API Integration
- [ ] Create adapter interface (types.ts)
- [ ] Implement DALL-E 3 adapter
- [ ] API key input UI (stored in sessionStorage)
- [ ] Error handling and display

### Prompt Preview
- [ ] Editable textarea showing assembled prompt
- [ ] Edit before send capability
- [ ] Regenerate with same/different prompt

---

## Phase 3: Persistence & Modifiers

### Project Management
- [ ] Create projectStore
- [ ] New project / rename / delete
- [ ] Auto-save to LocalStorage on changes
- [ ] Load project on app start

### Library Sidebar
- [ ] Display saved assets by category (Characters, Settings, Props, Styles, Shots, Extras)
- [ ] Drag asset from library to canvas (creates node)
- [ ] Save node as asset (right-click or button)
- [ ] Delete asset from library

### Export/Import
- [ ] Export project as .promptflow JSON
- [ ] Import project from file
- [ ] Validate imported data structure

### Modifier Nodes
- [ ] OutfitNode — connects to Character, overrides appearance (cyan)
- [ ] Implement override logic in prompt assembly
- [ ] EditNode — connects to Output, adds refinement (gray)
- [ ] Chain multiple edits

---

## Phase 4: Polish

### UI Refinements
- [ ] Node icons by type
- [ ] Keyboard shortcuts (delete, duplicate, undo)
- [ ] Minimap toggle
- [ ] Context menu (right-click on nodes)
- [ ] Undo/redo support

### Additional Adapters
- [ ] SDXL adapter
- [ ] Flux adapter
- [ ] Model-specific parameter handling

---

## Backlog (Post-MVP)

- [ ] Image history panel with metadata
- [ ] Asset versioning (optional per-asset)
- [ ] Panel/page layout system
- [ ] Backend storage option
- [ ] Collaboration / sharing
- [ ] Midjourney adapter (proxy required)
- [ ] Expression/Pose nodes (experimental — may tie to Character or be standalone)
- [ ] Lighting node (separate from Setting for more control)
- [ ] Composition node (rule of thirds, golden ratio guides)

---

## Completed

_Nothing yet — let's get started!_
