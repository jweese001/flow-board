# Feature Plan: Scene Node & Three.js IDE Integration

> Use 3D blockouts as compositional guides for AI image generation — essentially bringing previsualization workflows from film/VFX into the AI image generation pipeline.

---

## Overview

The Scene Node allows users to reference 3D scenes built in the Three.js IDE, position a virtual camera, and use the rendered view as a compositional reference for AI image generation. The AI receives not just the visual reference, but also semantic information about what the primitives represent and their spatial relationships.

---

## Problem Statement

### Current Limitation

Text descriptions struggle to communicate:
- Precise camera angles and perspective
- Spatial relationships between objects
- Composition and framing
- Depth and layering

Users resort to:
- Finding reference photos (time-consuming, rarely exact match)
- Verbose text descriptions ("low angle shot looking up at 35 degrees with the subject positioned in the lower third...")
- Trial and error with regeneration

### Industry Precedent

Film and VFX studios use **previsualization** (previz):
1. Block out scenes with simple 3D geometry
2. Position cameras to plan shots
3. Use these as guides for final production

This workflow is proven but hasn't been applied to AI image generation.

---

## Solution: Scene Node

A new node type that:
1. Displays an interactive 3D viewport with a loaded scene
2. Allows camera manipulation (orbit, pan, zoom)
3. Renders the current view as a reference image
4. Auto-generates spatial descriptions from the scene graph
5. Outputs rich context to downstream Output nodes

---

## Design Reasoning

### Why Embed a Viewport vs. Just Import Images?

| Approach | Pros | Cons |
|----------|------|------|
| Import static images | Simple, no 3D dependency | Loses interactivity, clunky workflow |
| Link to external IDE only | Full 3D power | Context switching, manual export/import |
| **Embedded viewport** | Seamless, interactive, immediate | Adds Three.js dependency to FlowBoard |

**Decision:** Embedded viewport with "Edit in IDE" escape hatch.

**Reasoning:** The primary use case is quick camera adjustments between shots. Users shouldn't leave FlowBoard for a 5-second camera tweak. But complex scene building still happens in the full IDE.

### Why Auto-Generate Descriptions?

The AI sees a gray box. It doesn't know it's a building.

**Without description:**
> AI sees: gray rectangle
> AI generates: could be anything — a monolith, a wall, abstract art

**With description:**
> AI reads: "Tall rectangular mass tagged as 'building', approximately 40m height, positioned left of camera"
> AI generates: a building, correct scale, correct position

**Reasoning:** The scene graph contains semantic information (object names, tags, positions, camera data). Extracting this into natural language bridges the gap between 3D representation and AI understanding.

### Why Include Depth Maps?

Depth maps encode spatial relationships that flat images lose:
- What's in front vs. behind
- Relative distances
- Surface orientation

Some models (Stable Diffusion + ControlNet) use depth maps directly as conditioning. For models that don't (Gemini), including the depth map as a secondary reference with explanation still helps.

**Reasoning:** Depth is cheap to render and significantly improves spatial consistency in outputs.

### Why Object Tagging?

Raw geometry is ambiguous. A 2-meter cube could be:
- A crate
- A car (rough)
- A kiosk
- A robot

Tags disambiguate: `cube [tag: vehicle]` → "small form in foreground (vehicle)"

**Reasoning:** Minimal user effort (one-time tagging in IDE) yields significant improvement in AI understanding.

---

## Technical Architecture

### Scene Format

```typescript
interface SceneData {
  id: string;
  name: string;
  objects: SceneObject[];
  camera: CameraState;
  environment?: EnvironmentSettings;
}

interface SceneObject {
  id: string;
  name: string;
  type: 'box' | 'sphere' | 'cylinder' | 'plane' | 'mesh' | 'group';
  tag?: SemanticTag;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  children?: SceneObject[];
}

type SemanticTag =
  | 'building'
  | 'vehicle'
  | 'character'
  | 'prop'
  | 'ground'
  | 'sky'
  | 'furniture'
  | 'vegetation'
  | 'wall'
  | 'door'
  | 'window'
  | string; // custom tags

interface CameraState {
  position: [number, number, number];
  target: [number, number, number];  // look-at point
  fov: number;
  near: number;
  far: number;
}
```

### Scene Node Data

```typescript
interface SceneNodeData extends BaseNodeData {
  name: string;
  sceneId?: string;                    // Reference to IDE scene
  sceneData?: SceneData;               // Embedded scene (for portability)
  cameraState: CameraState;            // Current camera position
  savedCameras?: NamedCamera[];        // Preset camera positions

  // Render settings
  renderMode: 'solid' | 'edges' | 'depth' | 'solid+edges';
  includeDepthMap: boolean;
  includeEdgeMap: boolean;

  // Auto-description
  autoDescription: string;             // Generated from scene analysis
  descriptionOverride?: string;        // User can edit/override

  // Output
  renderedImageUrl?: string;           // Current view render
  depthMapUrl?: string;                // Depth buffer render
  edgeMapUrl?: string;                 // Edge detection render
}

interface NamedCamera {
  name: string;
  state: CameraState;
}
```

### Communication with IDE

**Option A: Shared Storage (Recommended for MVP)**

Both apps read/write to IndexedDB or localStorage:

```typescript
// FlowBoard writes
localStorage.setItem('flowboard-scene-request', JSON.stringify({
  action: 'open',
  sceneId: 'manhattan-block',
  returnTo: 'flowboard'
}));

// IDE reads, user edits, IDE writes
localStorage.setItem('flowboard-scene-response', JSON.stringify({
  sceneId: 'manhattan-block',
  sceneData: { /* updated scene */ },
  cameraState: { /* current camera */ }
}));

// FlowBoard polls or listens for storage events
window.addEventListener('storage', (e) => {
  if (e.key === 'flowboard-scene-response') {
    // Update Scene Node with new data
  }
});
```

**Reasoning:** Simple, works across tabs, no server needed. Good for MVP.

**Option B: Broadcast Channel (Better UX)**

```typescript
// FlowBoard
const channel = new BroadcastChannel('flowboard-ide');
channel.postMessage({ action: 'open', sceneId: 'manhattan-block' });
channel.onmessage = (e) => {
  if (e.data.action === 'update') {
    // Update Scene Node
  }
};

// IDE
const channel = new BroadcastChannel('flowboard-ide');
channel.onmessage = (e) => {
  if (e.data.action === 'open') {
    loadScene(e.data.sceneId);
  }
};
// On camera change or save:
channel.postMessage({ action: 'update', sceneData, cameraState });
```

**Reasoning:** Real-time sync, cleaner API, but requires same origin.

**Option C: File System Access API**

Watch a shared project folder. IDE saves `.scene.json` files, FlowBoard detects changes.

**Reasoning:** Works offline, familiar file-based workflow, but more complex setup.

---

## Auto-Description Generation

### Algorithm

```typescript
function generateSceneDescription(scene: SceneData): string {
  const { camera, objects } = scene;
  const parts: string[] = [];

  // 1. Camera description
  parts.push(describeCameraPosition(camera));

  // 2. Spatial layout (what's where relative to camera)
  const layout = analyzeLayout(objects, camera);
  parts.push(describeLayout(layout));

  // 3. Tagged objects
  const tagged = objects.filter(o => o.tag);
  for (const obj of tagged) {
    parts.push(describeObject(obj, camera));
  }

  // 4. Composition notes
  parts.push(describeComposition(camera, objects));

  return parts.join(' ');
}

function describeCameraPosition(camera: CameraState): string {
  const height = camera.position[1];
  const angle = calculatePitchAngle(camera);

  let heightDesc = 'eye level';
  if (height < 1) heightDesc = 'low angle (ground level)';
  else if (height < 1.5) heightDesc = 'low angle';
  else if (height > 3) heightDesc = 'elevated';
  else if (height > 10) heightDesc = 'high angle';
  else if (height > 50) heightDesc = "bird's eye view";

  let angleDesc = 'level';
  if (angle > 15) angleDesc = 'looking upward';
  if (angle > 45) angleDesc = 'looking steeply upward';
  if (angle < -15) angleDesc = 'looking downward';
  if (angle < -45) angleDesc = 'looking steeply downward';

  return `Camera at ${heightDesc}, ${angleDesc}.`;
}

function describeObject(obj: SceneObject, camera: CameraState): string {
  const relativePos = getRelativePosition(obj, camera); // 'left', 'right', 'center', 'foreground', 'background'
  const size = estimateSize(obj); // 'small', 'medium', 'large', 'massive'
  const tag = obj.tag || 'object';

  return `${size} ${tag} positioned ${relativePos}.`;
}
```

### Example Output

**Scene:** Simple city block with camera at street level

```
Camera at street level (1.7m), looking slightly upward (20°).
Tall rectangular masses flanking left and right (tagged: building, ~35m and ~28m).
Small form in center foreground (tagged: vehicle, ~2m).
Ground plane extends to horizon.
Composition: urban canyon with strong converging perspective lines,
subject (vehicle) positioned in lower third.
```

**Reasoning:** This text helps the AI understand what the gray boxes represent and what kind of image to generate.

---

## Render Modes

### Solid (Default)
- Basic shaded geometry
- Good for overall composition
- Can confuse AI if primitives look too "real"

### Edges
- Wireframe or edge-detected render
- Clear structure without surface detail
- Good for pure composition reference

### Depth
- Grayscale depth buffer (white = near, black = far)
- Encodes spatial relationships
- Useful for models that support depth conditioning

### Solid + Edges
- Shaded with edge overlay
- Best of both: form and structure

**Reasoning:** Different render modes serve different purposes. Users can choose based on their needs and what works best with their preferred AI model.

---

## User Experience Flow

### Flow 1: Quick Camera Adjustment

```
1. User has Scene Node with loaded scene
2. Drags to orbit camera in viewport
3. Auto-description updates in real-time
4. Clicks "Capture" or it auto-captures on mouse release
5. Downstream Output Node receives updated reference
6. Generate → image matches new camera angle
```

**Time:** 5 seconds

### Flow 2: Building a New Scene

```
1. User clicks "Create Scene" in Scene Node
2. Opens Three.js IDE in new tab with blank scene
3. User builds blockout (boxes for buildings, cylinders for columns, etc.)
4. User tags objects (right-click → Set Tag → "building")
5. User clicks "Send to FlowBoard"
6. Scene Node updates with new scene
7. User returns to FlowBoard tab, scene is ready
```

**Time:** 2-10 minutes depending on complexity

### Flow 3: Reusing Scenes Across Shots

```
1. User has scene "city-block"
2. Shot 1: Position camera at street level → Generate "busy NYC street"
3. Shot 2: Move camera to rooftop → Generate "aerial view of NYC"
4. Shot 3: Low angle looking up → Generate "imposing skyscrapers"
5. Same scene, three different outputs, consistent spatial relationships
```

**Reasoning:** The scene is an asset, the camera position is the variable. This mirrors real filmmaking.

---

## Integration with Existing Nodes

### Scene Node Connections

**Inputs:**
- Setting Node → Provides text description context
- Style Node → Could influence render style (toon, sketch, etc.)

**Outputs:**
- Reference handle → Sends rendered view + depth map + description
- Can connect to Output Node or other nodes expecting references

### Prompt Assembly

When assembling prompt for an Output Node with Scene Node upstream:

```typescript
// In assembler.ts
case 'scene':
  const sceneData = node.data as SceneNodeData;

  // Add to prompt text
  if (sceneData.autoDescription || sceneData.descriptionOverride) {
    const desc = sceneData.descriptionOverride || sceneData.autoDescription;
    promptParts.push(`[Composition Reference: ${desc}]`);
  }

  // Add to reference images
  if (sceneData.renderedImageUrl) {
    referenceImages.push({
      imageUrl: sceneData.renderedImageUrl,
      imageType: 'scene',
      description: 'Compositional reference showing camera angle and spatial layout',
    });
  }

  if (sceneData.includeDepthMap && sceneData.depthMapUrl) {
    referenceImages.push({
      imageUrl: sceneData.depthMapUrl,
      imageType: 'scene',
      description: 'Depth map showing spatial relationships (white=near, black=far)',
    });
  }
  break;
```

---

## Implementation Phases

### Phase 1: Basic Scene Node (MVP)

- [ ] Scene Node component with embedded Three.js canvas
- [ ] Load scene from JSON file (manual import)
- [ ] Orbit/pan/zoom camera controls
- [ ] Render to PNG on capture
- [ ] Basic auto-description (camera position only)
- [ ] Output as reference image

**Scope:** ~2-3 days work

### Phase 2: IDE Integration

- [ ] "Edit in IDE" button with round-trip sync
- [ ] Storage-based communication (localStorage/BroadcastChannel)
- [ ] Scene browser (list available scenes)
- [ ] Named camera presets per scene

**Scope:** ~3-4 days work

### Phase 3: Enhanced Description

- [ ] Object tagging support
- [ ] Full spatial description generation
- [ ] Composition analysis (rule of thirds, leading lines, etc.)
- [ ] User can edit/override description

**Scope:** ~2-3 days work

### Phase 4: Advanced Rendering

- [ ] Depth map rendering
- [ ] Edge detection rendering
- [ ] Render mode selector
- [ ] Quality/resolution settings

**Scope:** ~2-3 days work

### Phase 5: IDE Enhancements

- [ ] Object tagging UI in IDE
- [ ] "Send to FlowBoard" button in IDE
- [ ] Scene templates (city block, interior room, etc.)
- [ ] Import from glTF/OBJ for more complex blockouts

**Scope:** ~5-7 days work (IDE side)

---

## Technical Considerations

### Three.js in FlowBoard

FlowBoard would need Three.js as a dependency. Options:

1. **Bundle Three.js** — Adds ~500KB to bundle, full control
2. **Dynamic import** — Load only when Scene Node is used
3. **iframe embed** — Run Three.js in iframe, communicate via postMessage

**Recommendation:** Dynamic import. Most users may not use Scene Node, so lazy-load it.

```typescript
// SceneNode.tsx
const ThreeViewport = lazy(() => import('./ThreeViewport'));

function SceneNode({ ... }) {
  return (
    <Suspense fallback={<div>Loading 3D viewport...</div>}>
      <ThreeViewport scene={data.sceneData} camera={data.cameraState} />
    </Suspense>
  );
}
```

### Performance

- Render on demand (not every frame)
- Lower resolution for preview, higher for capture
- Throttle auto-description regeneration
- Consider WebGL context limits (browsers limit total contexts)

### WebGPU Future

When IDE upgrades to WebGPU:
- Better rendering quality (PBR materials)
- Larger scenes
- Potentially: real-time style transfer in viewport

The Scene Node could have a "renderer" option: WebGL (compatible) vs WebGPU (quality).

---

## Open Questions

1. **Scene ownership** — Are scenes stored in IDE, FlowBoard, or both?
   - *Recommendation:* IDE is source of truth, FlowBoard caches for offline use

2. **Version sync** — What if user edits scene in IDE but FlowBoard has old version?
   - *Recommendation:* Show "scene modified" indicator, offer to refresh

3. **Complex geometry** — Support imported meshes or primitives only?
   - *Recommendation:* Start with primitives, add glTF import in Phase 5

4. **Lighting** — Should scene lighting affect the reference?
   - *Recommendation:* Yes, lighting direction is valuable composition info

5. **Multiple Scene Nodes** — Same scene, different cameras?
   - *Recommendation:* Yes, Scene Node stores its own camera state, references shared scene

---

## Success Metrics

- Users can go from "I want this camera angle" to generated image in <30 seconds
- Spatial relationships in generated images match 3D blockout
- Repeat shots with same scene maintain consistency
- Users report faster iteration than text-only workflow

---

## Appendix: Example Workflows

### Workflow A: Comic Panel Sequence

```
Scene: "alley-confrontation" (two characters in alley)

Panel 1: Wide establishing shot
- Camera: High, wide angle
- Generate: "Dark alley at night, two figures facing each other"

Panel 2: Over-the-shoulder
- Camera: Behind character A, looking at character B
- Generate: "Over shoulder view, mysterious figure in shadow"

Panel 3: Close-up reaction
- Camera: Low, close to character B's face position
- Generate: "Extreme close-up, fearful expression, sweat"

Panel 4: Action shot
- Camera: Dutch angle, ground level
- Generate: "Dynamic action pose, fist flying toward camera"
```

Same scene, four camera positions, four consistent panels.

### Workflow B: Environment Concept Art

```
Scene: "sci-fi-city" (futuristic cityscape blockout)

Iteration 1: Camera at street level
Style: "Blade Runner, neon, rain"
→ Generate, review

Iteration 2: Same camera, adjust Style
Style: "Clean utopia, white, bright"
→ Generate, compare

Iteration 3: Move camera to aerial view
Style: "Blade Runner, neon, rain"
→ Generate aerial establishing shot
```

Explore style variations while maintaining spatial consistency.

---

*Created: 2025-01-27*
*Status: Draft*
*Target Phase: 8 (Advanced Composition)*
