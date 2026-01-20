# PromptFlow Studio — Task Tracker

## Current Phase: 3 — Polish & Enhancements

---

## Completed

### Phase 1: Foundation ✅

#### Setup & Configuration
- [x] Install dependencies (React Flow, Zustand, Tailwind CSS)
- [x] Configure Tailwind with dark mode
- [x] Set up path aliases (@/ for src/)
- [x] Create directory structure per PLANNING.md

#### Canvas & Layout
- [x] Create main App layout (sidebar + canvas + properties panel)
- [x] Integrate React Flow canvas with zoom/pan
- [x] Implement dark theme base styles
- [x] Add basic responsive behavior (collapsible sidebar)

#### Node Types (Visual Only)
- [x] Create base node wrapper component (consistent styling)
- [x] CharacterNode — name + description fields (blue)
- [x] SettingNode — name + description fields (green)
- [x] PropNode — name + description fields (amber)
- [x] StyleNode — name + description fields (purple)
- [x] ShotNode — name + preset dropdown + description (pink)
- [x] ActionNode — content textarea (orange)
- [x] OutputNode — prompt preview + generate button (red)

#### Node Connections
- [x] Define handle positions (inputs left, outputs right)
- [x] Implement connection validation (type checking)
- [x] Style edges (bezier curves, dark theme colors)

#### State Management
- [x] Create flowStore (nodes, edges, CRUD operations)
- [x] Create uiStore (selected node, panel visibility)
- [x] Wire React Flow to Zustand store

#### Prompt Assembly
- [x] Implement graph traversal (upstream from Output)
- [x] Implement prompt concatenation logic
- [x] Display assembled prompt in Output node

#### Mock Generation
- [x] Create mock adapter (returns placeholder image after delay)
- [x] Wire Output node generate button to mock adapter
- [x] Show loading state during "generation"
- [x] Display result image in Output node

---

### Phase 2: Real Generation & Persistence ✅

#### Additional Nodes
- [x] NegativeNode — name + content field (rose)
- [x] ParametersNode — model select, aspect ratio, seed, temperature (teal)
- [x] ExtrasNode — name + description for background elements (slate)
- [x] OutfitNode — connects to Character, overrides appearance (cyan)
- [x] EditNode — refinement instructions (gray)
- [x] ReferenceNode — image upload with type categorization (purple)
- [x] PageNode — comic page layout with multiple panels (sky blue)
- [x] Include all nodes in prompt assembly

#### API Integration
- [x] Create adapter interface (types.ts)
- [x] Implement Mock provider
- [x] Implement Gemini provider (Gemini 2 Flash, Gemini 3 Pro)
- [x] Implement fal.ai provider (Flux Schnell, Flux Dev, Turbo, SDXL)
- [x] API key input UI in Settings section
- [x] Error handling and display

#### Project Management
- [x] Create projectStore
- [x] New project / rename / delete
- [x] Auto-save with debouncing (30s or on changes)
- [x] Load project on app start
- [x] IndexedDB storage for large images (overcomes localStorage 5MB limit)

#### Export/Import
- [x] Export project as .flowboard.json
- [x] Import project from file
- [x] Validate imported data structure
- [x] Preserve images in export/import

#### Reference Images
- [x] Reference node with drag/drop/paste image upload
- [x] Reference type categorization (character, setting, prop, style, scene, mood)
- [x] Auto-assign reference type when connected to asset nodes
- [x] Reference images passed to API for supported models (Gemini)
- [x] Connect Reference nodes to Page nodes for layouts

---

## In Progress

### Phase 3: Polish & Enhancements

#### UI Refinements
- [ ] Keyboard shortcuts (delete, duplicate, undo)
- [ ] Minimap toggle
- [ ] Context menu (right-click on nodes)
- [ ] Undo/redo support
- [ ] Node icons in drag palette

#### Library Sidebar
- [ ] Display saved assets by category (Characters, Settings, Props, Styles, etc.)
- [ ] Drag asset from library to canvas (creates node)
- [ ] Save node as asset (right-click or button)
- [ ] Delete asset from library

#### Prompt Preview
- [ ] Editable textarea showing assembled prompt
- [ ] Edit before send capability
- [ ] Regenerate with same/different prompt

#### Page Layout Enhancements
- [ ] More layout presets
- [ ] Custom layout editor
- [ ] Speech bubble overlay support

---

## Backlog (Post-MVP)

- [ ] Image history panel with metadata
- [ ] Asset versioning (optional per-asset)
- [ ] Backend storage option (SQLite/Postgres)
- [ ] Collaboration / sharing
- [ ] Additional API providers (OpenAI DALL-E 3, Midjourney proxy)
- [ ] Expression/Pose nodes (experimental)
- [ ] Lighting node (separate from Setting)
- [ ] Composition node (rule of thirds, golden ratio guides)
- [ ] Batch generation across multiple Output nodes
- [ ] Story/sequence mode for comic creation
- [ ] **Time Period node (experimental)** — injects temporal context (1970s, Victorian era, 1800s, etc.) to give actions/settings a period-appropriate feel

---

## Recent Changes (Session Log)

### 2025-01-19 (Latest Session)
- **Transform node scale behavior improved:**
  - Without Transform: images use object-fit cover (fill panel, crop excess)
  - With Transform: images use object-fit contain as base
  - Scale 1.0 = full image visible (may have letterboxing)
  - Scale > 1.0 = zoom in (eventually fills and crops)
  - Offset pans the image, Alignment sets anchor point
- **New nodes spawn at viewport center:**
  - Nodes now appear in the center of the visible canvas area
  - Small random offset prevents exact stacking when adding multiple nodes
  - Uses React Flow's screenToFlowPosition for accurate placement

### 2025-01-18
- Expanded ReferenceImageType to include: character, setting, prop, style, scene, mood
- Fixed assembler to correctly assign 'setting' and 'prop' types (was using 'object')
- Added Reference node support to Page node (can now use reference images in page layouts)
- IndexedDB implementation for storing generated images (overcomes localStorage quota)
- Fixed Page node handle positioning and image scaling
- Added editable output dimensions to Page node
- Made Page node preview aspect ratio dynamic (reflects actual output dimensions)
- Added editable name field to Page node
- **New Transform node** for image manipulation:
  - Scale (10% to 300%)
  - Offset X/Y (pan image within panel)
  - Rotation (0-360 degrees)
  - Flip horizontal/vertical
  - Alignment (9 positions: center, edges, corners)
  - Works between image sources (Output/Reference) and Page node
  - Transforms applied in both preview and export
