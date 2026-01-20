# PromptFlow Studio — Testing Checklist

## Pre-Testing Setup

Before testing, clear old data to ensure a clean state:

```javascript
// Run in browser console
localStorage.clear();
indexedDB.deleteDatabase('flowboard-images');
location.reload();
```

---

## Core Functionality

### Node Creation & Editing
- [ ] Can click node type in left panel to add to canvas
- [ ] New nodes appear at center of visible viewport (not fixed position)
- [ ] Can edit node properties in left panel when selected
- [ ] Can delete nodes (select + delete key or delete button)
- [ ] Can duplicate nodes (copy/paste)
- [ ] Node selection highlight works correctly

### Node Types to Test
- [ ] Character node - name and description fields
- [ ] Setting node - name and description fields
- [ ] Prop node - name and description fields
- [ ] Style node - name and description fields
- [ ] Extras node - name and description fields
- [ ] Shot node - preset dropdown and description
- [ ] Outfit node - name and description
- [ ] Action node - content textarea
- [ ] Negative node - content field
- [ ] Parameters node - model, aspect ratio, seed, temperature
- [ ] Edit node - refinement text
- [ ] Reference node - image upload (drag/drop/paste/click)
- [ ] Output node - generate button, image display
- [ ] Page node - layout selection, panel connections, name
- [ ] Transform node - scale, offset, rotation, flip, alignment

### Node Connections
- [ ] Can connect nodes via drag between handles
- [ ] Edges render correctly (bezier curves)
- [ ] Parameters/Negative nodes auto-route to config handle on Output
- [ ] Reference nodes auto-route to reference handle on asset nodes
- [ ] Can delete edges

---

## Persistence (IndexedDB)

### Save/Load
- [ ] Create a workflow with multiple nodes and connections
- [ ] Generate an image in Output node
- [ ] Refresh the page
- [ ] Verify workflow persists (nodes, edges, positions)
- [ ] Verify generated image persists in Output node
- [ ] Verify Reference node images persist

### Export/Import
- [ ] Create a workflow with generated images
- [ ] Export project (download .flowboard.json file)
- [ ] Create new project or clear storage
- [ ] Import the exported file
- [ ] Verify all nodes, edges, and images are restored
- [ ] Verify Output node shows generated images
- [ ] Verify Reference nodes show uploaded images

### Project Management
- [ ] Create new project
- [ ] Rename project
- [ ] Switch between projects
- [ ] Delete project (with confirmation)
- [ ] Auto-save triggers after changes (check console)

---

## Reference Images

### Upload Methods
- [ ] Click to browse and select image
- [ ] Drag and drop image onto Reference node
- [ ] Paste image from clipboard (Ctrl/Cmd+V while node focused)

### Reference Type Assignment
- [ ] Connect Reference to Character node → type becomes "character"
- [ ] Connect Reference to Setting node → type becomes "setting"
- [ ] Connect Reference to Prop node → type becomes "prop"
- [ ] Connect Reference to Style node → type becomes "style"
- [ ] Standalone Reference node → can manually set type in dropdown

### Reference to Page Node
- [ ] Connect Reference node to Page node panel slot
- [ ] Verify reference image appears in panel preview
- [ ] Verify reference image included in Page export

---

## Page Node

### Layout Selection
- [ ] Full page layout (1 panel)
- [ ] 2-up horizontal
- [ ] 2-up vertical
- [ ] 3-up layouts (left, right, top, bottom)
- [ ] 4-up grid
- [ ] 6-up grid
- [ ] Manga layouts (3, 4 panel)
- [ ] Inset layout

### Panel Connections
- [ ] All panel input handles accept connections (not just top one)
- [ ] Output node → Page panel works
- [ ] Reference node → Page panel works
- [ ] Images scale to fit panels (object-fit: cover)
- [ ] Gutter setting affects panel spacing

### Dynamic Dimensions
- [ ] Changing outputWidth/outputHeight updates preview aspect ratio
- [ ] Portrait dimensions (e.g., 1200x1600) show tall preview
- [ ] Landscape dimensions (e.g., 1920x1080) show wide preview
- [ ] Square dimensions (e.g., 1080x1080) show square preview

### Page Node Name
- [ ] Can edit page name in left panel
- [ ] Name displays in node header

---

## Transform Node

### Basic Setup
- [ ] Can drag Transform node from left panel
- [ ] Transform node has both input (left) and output (right) handles
- [ ] Can chain: Reference → Transform → Page
- [ ] Can chain: Output → Transform → Page

### Transform Controls (Left Panel)
- [ ] Name field editable
- [ ] Scale slider (0.1 to 3.0)
- [ ] Offset X slider (-100 to 100)
- [ ] Offset Y slider (-100 to 100)
- [ ] Rotation slider (0 to 360)
- [ ] Alignment dropdown (9 options)
- [ ] Flip Horizontal checkbox
- [ ] Flip Vertical checkbox

### Transform Preview (Page Node)
- [ ] Without Transform: image uses cover (fills panel, may crop)
- [ ] With Transform at scale 1.0: full image visible (contain behavior)
- [ ] Scale > 1.0 zooms in (image fills panel, may crop)
- [ ] Offset X/Y shifts image position
- [ ] Rotation rotates image
- [ ] Flip H mirrors image horizontally
- [ ] Flip V mirrors image vertically
- [ ] Alignment positions image (top, bottom, left, right, corners)

### Transform Export
- [ ] Exported PNG includes all transformations
- [ ] Scale applied correctly
- [ ] Offset applied correctly
- [ ] Rotation applied correctly
- [ ] Flip applied correctly
- [ ] Alignment applied correctly

### Transform Persistence
- [ ] Transform node saves with project
- [ ] Transform settings persist after refresh
- [ ] Transform included in project export
- [ ] Transform restored on project import

### Transform Edge Cases
- [ ] Scale at minimum (0.1) shows tiny image
- [ ] Scale at 1.0 shows full image (contain)
- [ ] Scale at ~1.5 fills panel (varies by aspect ratio)
- [ ] Scale at maximum (3.0) zooms in significantly
- [ ] Full rotation (360°) same as 0°
- [ ] Combined flip H + flip V works
- [ ] All 9 alignments render correctly
- [ ] Extreme offset values clip properly

### Export
- [ ] Export button enabled when panels have images
- [ ] Downloads PNG file
- [ ] Output dimensions respected (outputWidth/outputHeight)
- [ ] Background color applied

---

## API Integration

### Settings
- [ ] Can enter Gemini API key
- [ ] Can enter fal.ai API key
- [ ] API keys persist across sessions
- [ ] Can set default model
- [ ] Can set default aspect ratio

### Generation (requires API keys)
- [ ] Mock model works without API key
- [ ] Gemini Flash generates images (with valid key)
- [ ] Gemini Pro generates images (with valid key)
- [ ] fal.ai Flux Schnell generates images (with valid key)
- [ ] fal.ai Flux Dev generates images (with valid key)
- [ ] Error messages display for invalid keys or API errors
- [ ] Loading state shows during generation
- [ ] Generated image displays in Output node
- [ ] Multiple images (batch) selectable in Output node

### Reference Image Support
- [ ] Gemini models receive reference images in request
- [ ] Reference images influence generation output

---

## Prompt Assembly

### Basic Assembly
- [ ] Shot preset text appears in prompt
- [ ] Character name + description in prompt
- [ ] Setting description in prompt
- [ ] Prop description in prompt
- [ ] Style description in prompt
- [ ] Extras description in prompt
- [ ] Action content in prompt
- [ ] Edit refinement in prompt

### Negative Prompts
- [ ] Negative node content passed as negativePrompt

### Parameters
- [ ] Model from Parameters node used
- [ ] Aspect ratio from Parameters node used
- [ ] Seed from Parameters node used
- [ ] Falls back to settings defaults when no Parameters node

---

## Workflow Integration Tests

### Basic Generation Flow
- [ ] Character + Setting + Action → Output generates image
- [ ] Add Style node → affects generation
- [ ] Add Shot node → affects framing description
- [ ] Add Props → appears in prompt

### Reference Image Flow
- [ ] Reference → Character node → influences character appearance
- [ ] Reference → Setting node → influences environment
- [ ] Reference → Style node → influences aesthetic
- [ ] Multiple references to same Output → all included

### Page Layout Flow
- [ ] Output → Page panel displays generated image
- [ ] Reference → Page panel displays reference image
- [ ] Output → Transform → Page applies transformations
- [ ] Reference → Transform → Page applies transformations
- [ ] Multiple panels with different sources
- [ ] Mix of transformed and non-transformed panels

### Complex Workflows
- [ ] Single character in multiple outputs (reuse)
- [ ] Multiple characters in single output
- [ ] Outfit override on character works
- [ ] Parameters node affects all connected outputs
- [ ] Negative prompts excluded from generation

---

## Known Issues to Verify Fixed

- [x] Page node: Only top handle accepts connections → Fixed (all handles work)
- [x] Page node: Images don't scale to fit panels → Fixed (uses object-fit: cover)
- [x] localStorage quota exceeded with images → Fixed (uses IndexedDB)
- [x] Reference type 'object' for Settings → Fixed (uses 'setting')
- [x] Import gives blank canvas → Fixed (async loading)
- [x] Output stuck in 'generating' after import → Fixed (status reset)

---

## Browser Compatibility

- [ ] Chrome (primary target)
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

## Performance

- [ ] App loads quickly
- [ ] Canvas zoom/pan is smooth
- [ ] No lag when dragging nodes
- [ ] Large images don't freeze UI
- [ ] Auto-save doesn't cause jank

---

## Canvas Interactions

### Zoom & Pan
- [ ] Mouse wheel zooms in/out
- [ ] Middle mouse button pans
- [ ] Right mouse button pans
- [ ] Zoom centers on cursor position
- [ ] Fit view on initial load

### Selection
- [ ] Click node to select
- [ ] Click canvas to deselect
- [ ] Drag to multi-select (selection box)
- [ ] Selected nodes show highlight ring

### Node Manipulation
- [ ] Drag node to move
- [ ] Drag multiple selected nodes together
- [ ] Copy selected nodes (Ctrl/Cmd+C)
- [ ] Paste nodes (Ctrl/Cmd+V)
- [ ] Delete selected nodes (Delete/Backspace)

---

## UI Components

### Left Panel
- [ ] Panel collapses/expands
- [ ] Accordion sections toggle
- [ ] Search filters node list
- [ ] Properties panel shows for selected node
- [ ] Close button deselects node

### Sliders
- [ ] Drag to change value
- [ ] Shows current value
- [ ] Respects min/max bounds
- [ ] Step increment works

### Checkboxes
- [ ] Click toggles state
- [ ] Visual feedback on checked state

### Dropdowns
- [ ] Click opens options
- [ ] Selection updates value
- [ ] Shows current selection

---

## Edge Cases & Error Handling

### Empty States
- [ ] New project shows empty canvas
- [ ] No crash with zero nodes
- [ ] Page node with no connections shows placeholders

### Invalid Data
- [ ] Handles missing image URLs gracefully
- [ ] Handles corrupted project data
- [ ] Shows error for failed API calls

### Boundary Conditions
- [ ] Very long node names truncate properly
- [ ] Very long descriptions don't break layout
- [ ] Many nodes (50+) don't crash app
- [ ] Large images (4K+) handled without freeze

---

## Accessibility

- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast sufficient
- [ ] Screen reader friendly labels (where applicable)

---

## Test Results Log

| Date | Tester | Area Tested | Pass/Fail | Notes |
|------|--------|-------------|-----------|-------|
| | | | | |
