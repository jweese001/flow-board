# FlowBoard — Task Tracker

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
- [x] Keyboard shortcuts (delete, duplicate) — Backspace/Delete to delete, Cmd+D to duplicate
- [x] Minimap toggle — Cmd+M or click button near controls
- [x] Context menu (right-click on nodes) — Copy, Duplicate, Delete options
- [ ] Undo/redo support
- [ ] Node icons in drag palette (already implemented in LeftPanel)

#### Library Sidebar
- [ ] Display saved assets by category (Characters, Settings, Props, Styles, etc.)
- [ ] Drag asset from library to canvas (creates node)
- [ ] Save node as asset (right-click or button)
- [ ] Delete asset from library

#### Prompt Preview
- [x] Editable textarea showing assembled prompt (InterceptNode)
- [x] Edit before send capability (InterceptNode)
- [ ] Regenerate with same/different prompt

#### Page Layout Enhancements
- [ ] More layout presets
- [ ] Custom layout editor
- [ ] Speech bubble overlay support (earmarked — pending AI text rendering reliability testing)

---

## Backlog (Post-MVP)

- [ ] Image history panel with metadata
- [ ] Asset versioning (optional per-asset)
- [ ] Backend storage option (SQLite/Postgres)
- [ ] Collaboration / sharing
- [ ] Additional API providers (OpenAI DALL-E 3, Midjourney proxy)
- [ ] Expression/Pose nodes (experimental)
- [ ] Lighting node (separate from Setting)
- [ ] Batch generation across multiple Output nodes
- [ ] Story/sequence mode for comic creation
- [ ] **Scene Node** — 3D scene integration for camera angles and composition reference (spec: `docs/feature-plan-scene-node.md`, test protocol: `~/Documents/sandbox/FlowBoard_Dev/scene-node-test-protocol.md`)

---

## Motion/Animation System (Branch: `motion`)

Full spec: `docs/feature-plan-motion.md`

### Phase 1: Core Animation Framework
- [x] Timeline node with keyframe system
- [x] Transform interpolation engine
- [x] Basic playback preview in canvas
- [x] Reference node sequence mode

### Phase 2: PNG Sequence Export ✅
- [x] Frame-by-frame render pipeline
- [x] Export from Timeline node
- [x] ZIP archive generation
- [x] Progress indication
- [x] 2x supersampling for quality

### Phase 3: FFmpeg Integration
- [ ] Transcode node implementation
- [ ] FFmpeg command generation
- [ ] Local FFmpeg detection
- [ ] Render queue management

### Phase 4: Polish
- [ ] Easing curve editor
- [ ] Onion skinning for keyframes
- [ ] Copy/paste keyframes
- [ ] Timeline zoom/pan

---

## Recent Changes (Session Log)

### 2025-01-27 (Latest Session)
- **Project renamed:** `prompt-nodes` → `FlowBoard`
- **InterceptNode UI improvements:**
  - Increased textarea height to match Output node sizing
  - Added spacing between prompt and negative sections
  - Fixed textarea bottom gap with `display: block`
- **Scene Node feature spec:**
  - Created `docs/feature-plan-scene-node.md`
  - 3D IDE integration for compositional references
  - Auto-description generation from scene graph
  - Test protocol created for concept validation
- **Documentation:**
  - Created comprehensive roadmap (`FlowBoard_Dev/flow-board-roadmap.md`)
  - Created test protocol (`FlowBoard_Dev/scene-node-test-protocol.md`)

### 2025-01-24
- **Page Node Flip Bug Fix:**
  - Export now correctly respects flip transforms from Transform node
  - Fixed canvas coordinate space issue in `PageNode.tsx`
- **Motion Feature Plan:**
  - Created `docs/feature-plan-motion.md` with full animation system spec
  - Timeline node, Reference sequence mode, Comp output handle, Transcode node
  - PNG sequence export (browser-native) and video export (FFmpeg)
- **Branch: `motion`** — pushed to origin

### 2025-01-20
- **Camera Node (new):**
  - Lens type: standard, wide, ultra-wide, fisheye 180°, telephoto, anamorphic, tilt-shift
  - Depth of field: deep, shallow, very shallow
  - Camera feel: locked/tripod, handheld, steadicam
  - Film stock: digital, 35mm, 16mm vintage, large format
  - Exposure: balanced, high key, low key
  - Vignette: none, light, heavy
  - Prompt position: after-shot, after-subject, before-style (experimental)
  - Plugs into Shot node for reusable "camera rigs"
- **Comp Node (new):**
  - 4-layer image compositing: back, mid, fore, ext (back-to-front)
  - Compatible with Transform node for per-layer positioning
  - PNG export of composed result
  - Respects transparency in layers
- **Page Node Num Grid:**
  - Toggle between preset layouts and dynamic grid
  - Enter panel count (1-16), auto-calculates optimal grid
  - Rounds up if count doesn't divide evenly (11 → 12 slots)
- **Shot Node accepts inputs:**
  - Camera can now connect to Shot for organized node trees
- **Bug fixes:**
  - Node ID generation now uses timestamp+random to prevent collisions
  - Checkbox styling improved for visibility (border contrast, padding)
- **Roadmap updates:**
  - Phase 6 planned: WebGL Scene Node, Animatics support
  - User has existing Three.js IDE for potential future integration

### 2025-01-19
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
