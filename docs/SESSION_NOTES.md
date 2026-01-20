# FlowBoard Session Notes

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
