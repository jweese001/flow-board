# FlowBoard Session Notes

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
