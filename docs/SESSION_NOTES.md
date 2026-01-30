# FlowBoard Session Notes

## Session: 2025-01-30

### Documentation Cleanup
- Removed stale "In Progress: InterceptNode" from `docs/feature-plan-motion.md` (feature is complete)
- Removed completed items from TASKS.md backlog (TimePeriodNode exists, InterceptNode done)
- Added earmark note to typography rendering features — pending AI text reliability testing
- Updated `FlowBoard_Dev/flow-board-roadmap.md` with earmark status

### Decisions Made
- **Typography rendering layer earmarked** — Testing whether AI (Gemini/Flux) reliably renders speech bubbles/captions via TextNode prompts before building manual overlay system
- InterceptNode confirmed complete (auto-assembly, editing, negative prompts, reset/refresh)

### Notes for Next Session
- Scene Node test protocol ready at `FlowBoard_Dev/scene-node-test-protocol.md`
- Script integration (ScriptNode) identified as key differentiator
- Undo/redo still pending

---

## Session: 2025-01-24 (Continued)

### Completed
- **Reference Node Sequence Mode** — Added multi-image support to Reference nodes:
  - Toggle checkbox to enable sequence mode
  - Multi-file upload/drop support
  - Thumbnail strip with frame selection
  - Playhead slider for scrubbing
  - Frame counter overlay
  - Individual frame removal
- **Timeline Node** — Full keyframe-based animation controller:
  - FPS selector (12/24/30/60)
  - Duration control
  - Loop toggle
  - Easing presets (linear, ease-in, ease-out, ease-in-out, spring)
  - Timeline track with keyframe diamonds
  - Add/remove keyframe at current time
  - Keyframe transform editor (scale, offset X/Y, rotation, opacity)
  - Play/pause/stop controls
  - Real-time playback with requestAnimationFrame
- **Animation Engine** — Transform interpolation system (`engine/animation.ts`):
  - Easing functions with spring support
  - Keyframe interpolation with rotation wrap-around
  - Frame generation utilities
- **Playback Preview** — Timeline transforms flow to Comp/Page nodes:
  - Comp and Page nodes detect Timeline inputs
  - Use interpolated currentTransforms for live preview
  - Animation updates in real-time during playback

### Technical Details
- Timeline stores `currentTransforms` in node data for downstream consumption
- Animation engine handles rotation shortest-path interpolation
- Both CompNode and PageNode updated with timeline type handling

---

## Session: 2025-01-24

### Completed
- **Page Node Export Flip Bug Fix** — Canvas transform was applying translate-back in flipped coordinate space, causing incorrect positioning. Fixed by drawing with coordinates relative to anchor point instead.
- **Motion Feature Plan** — Created comprehensive `docs/feature-plan-motion.md` documenting animation system architecture:
  - Reference Node sequence mode (multi-image)
  - Timeline Node (fps, duration, keyframes, easing)
  - Comp Node output handle for chaining
  - Transcode Node with FFmpeg integration
  - PNG sequence and video export modes

### Decisions Made
- **PNG sequence first, FFmpeg optional** — Browser-native PNG sequence export is priority; FFmpeg for video is optional enhancement requiring local install
- **Keyframe-based animation** — Timeline node controls transform interpolation (scale, offset, rotation, opacity) over time
- **Flip is instant, not animated** — flipH/flipV in Transform won't be interpolated

### Issues/Blockers Discovered
- **Canvas coordinate space** — When applying flip with `ctx.scale(-1, 1)`, subsequent translations are inverted. The original code did `translate → rotate → flip → translate-back → draw`, but translate-back went wrong direction. Fixed: `translate → rotate → flip → draw-relative-to-anchor`.

### Notes for Next Session
- **Stay on `motion` branch** — User explicitly requested staying here
- **Feature plan ready** — `docs/feature-plan-motion.md` has full implementation spec
- **Next implementation step** — Phase 1: Core Animation Framework (Timeline node, transform interpolation, basic playback preview)
- **Flip fix verified working** — User tested and confirmed

### Technical Details
- Bug fix location: `client/src/components/nodes/PageNode.tsx:460-475`
- Before: `ctx.translate(-anchorX, -anchorY)` then `ctx.drawImage(img, imgX, imgY, ...)`
- After: `ctx.drawImage(img, imgX - anchorX, imgY - anchorY, ...)` (no translate-back)

---

## Session: 2025-01-21

### Completed
- **Visual Node Grouping** — Cmd+G to group nodes, Cmd+Shift+G to ungroup, bounding box visualization
- **Group Isolation Mode** — Double-click group border to isolate (fades non-group nodes), Escape to exit
- **Editable Group Labels** — Click group label to rename inline
- **Group Bounding Box Fixes** — Proper sizing using explicit node widths, pointer events pass through to nodes
- **Page Node Handle Fix** — Added `useUpdateNodeInternals` to fix wire alignment when layout changes
- **FlowBoard Alpha Documentation** — Created `FLOWBOARD_PAPER.md` and `QUICKSTART.md`
- **Roadmap Updates** — Added Animation Timeline, Typography, Script Integration, Local Models to private roadmap
- **Public Repo Sanitization** — Removed detailed feature specs from public docs, created `ROADMAP_PRIVATE.md` (gitignored)
- **Branch Merge** — Merged `node-updates` into `main`, pushed to origin

### Decisions Made
- **Commercial Potential** — User sees indie filmmaker market opportunity; detailed roadmap moved to private file
- **Script Integration** as key differentiator — Import scripts, bind scenes to nodes, bi-directional sync
- **Next Priorities** — Animation Timeline (parallax), Typography (word balloons, captions), then Script system
- **Keep public roadmap vague** — Only show "additional authoring tools" etc., protect competitive advantage

### Issues/Blockers Discovered
- **React Flow measurement quirks** — Output node width not captured correctly by native selection box either; worked around with explicit width values and Math.max
- **Group label re-select bug** — useEffect was re-selecting text on every keystroke; fixed by extracting groupId as dependency

### Notes for Next Session
- **Alpha Testing Phase** — User spending a few days testing, will return with bug reports
- **Graphic Novel Proof of Concept** — User has novel chapters to adapt; will demonstrate full workflow
- **Private Roadmap Location** — `ROADMAP_PRIVATE.md` in project root (gitignored)
- **Monetization Research** — User considering $10/month subscription for tool suite

### Technical Details
- Group store: `groupStore.ts` manages groups, isolation state, rename
- Group overlay: `GroupOverlay.tsx` renders SVG bounding boxes + HTML labels with viewport transform
- Grouped movement: `expandGroupedNodeChanges()` in `flowStore.ts` applies position delta to siblings
- Handle refresh: `useUpdateNodeInternals(id)` in PageNode when slotCount/layout changes

---

## Session: 2025-01-20

### Completed
- **Camera Node** — Full implementation with lens types (fisheye 180°, anamorphic, etc.), depth of field, camera feel, film stock, exposure, and vignette options
- **Comp Node** — 4-layer image compositing with Transform node compatibility and PNG export
- **Page Node Num Grid** — Dynamic panel layout mode (1-16 panels, auto-calculates grid)
- **Shot Node inputs** — Now accepts Camera connection for reusable camera rigs
- **Checkbox UI fix** — Improved contrast and padding for better visibility
- **Node ID fix** — Uses timestamp+random instead of counter to prevent collisions
- **Roadmap update** — Added Phase 6 with WebGL Scene Node and Animatics plans
- **Git commit and push** — All changes merged to main and deployed to GitHub Pages

### Decisions Made
- **Camera prompt position is configurable** — User can choose after-shot, after-subject, or before-style placement since optimal position varies by model
- **Keep FlowBoard lean** — Future 3D scene integration will connect to external Three.js IDE (user already has one at jweese001.github.io/threejs-ide-react) rather than embedding WebGL
- **Num Grid max is 16** — Keeps input handles manageable
- **Camera → Shot connection** — Enables organized "camera rig" node groups that can be saved and reused

### Issues/Blockers Discovered
- **Gemini 500 errors** — Transient API issues, not code bugs. Retry usually works.
- **"Comic" trigger word** — Including "comic art" in style prompts can trigger unwanted title text overlays. Workaround: use Negative node with "text, title, caption"
- **TypeScript closure narrowing** — Variables modified inside nested functions need type casts when accessed outside

### Notes for Next Session
- User interested in **prompt preview/edit before generation** to catch trigger words
- **Three.js IDE integration** is on the roadmap — user wants to eventually connect the tools but keep FlowBoard focused
- The **Camera Node prompt position** feature is experimental — user testing to see which position works best for different models
- **Stability AI** models (SDXL 1.0) don't follow style prompts as well as Gemini — this is model capability, not code issue

### Technical Details
- Camera node assembly: `formatCamera()` in `assembler.ts` only outputs non-default values
- Comp node layers: back (bottom) → mid → fore → ext (top)
- Num Grid calculation: `calculateGridDimensions()` in `PageNode.tsx` scores grid configs by cell squareness and wasted slots
