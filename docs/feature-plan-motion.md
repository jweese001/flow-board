# Motion/Animation System Feature Plan

## Overview

Add animation capabilities to PromptFlow Studio, enabling the creation of animated sequences from generated images. The system will support keyframe-based motion with export to PNG sequences and optional FFmpeg integration for video encoding.

## Core Concepts

### Animation Workflow
1. **Reference Node** (enhanced) - Can mark images as part of a sequence
2. **Timeline Node** - Defines animation parameters (fps, duration, keyframes)
3. **Comp Node** (enhanced) - Gains output handle for chaining to Page or Transcode
4. **Transcode Node** (new) - FFmpeg hook for video encoding

## Node Specifications

### 1. Reference Node Enhancement

Add sequence mode to existing Reference node:

```typescript
interface ReferenceNodeData extends BaseNodeData {
  // Existing fields...
  imageUrl: string;

  // New sequence fields
  isSequence: boolean;        // Toggle for sequence mode
  sequenceImages: string[];   // Array of image URLs for sequence
  sequenceIndex: number;      // Current frame being previewed (for UI)
}
```

**UI Changes:**
- Checkbox: "Sequence" toggle
- When enabled: Multi-image upload/import
- Thumbnail strip showing sequence frames
- Playhead/scrubber for preview

### 2. Timeline Node (New)

Central controller for animation timing and keyframes.

```typescript
interface TimelineNodeData extends BaseNodeData {
  name: string;
  fps: number;                // 24, 30, 60
  duration: number;           // Total duration in seconds
  keyframes: Keyframe[];      // Transform states at specific times
  loop: boolean;              // Whether animation loops
  easing: EasingType;         // Default easing between keyframes
}

interface Keyframe {
  time: number;               // Time in seconds
  transforms: {
    scale: number;
    offsetX: number;
    offsetY: number;
    rotation: number;
    opacity: number;
    // Note: flipH/flipV are instant, not animated
  };
  easing?: EasingType;        // Override easing for this keyframe
}

type EasingType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
```

**Inputs:**
- Single target handle for Transform or Reference node

**Outputs:**
- Animated sequence output (connects to Comp or Transcode)

**UI:**
- Timeline ruler with time markers
- Keyframe diamonds on timeline
- Add/remove keyframe buttons
- FPS dropdown (24/30/60)
- Duration input
- Loop toggle
- Easing curve selector
- Playback preview controls (play/pause/scrub)

### 3. Comp Node Enhancement

Add output handle for downstream composition.

```typescript
interface CompNodeData extends BaseNodeData {
  // Existing fields...
  composedImageUrl: string;

  // Animation support
  isAnimated: boolean;        // True if any input is animated
  frameCount: number;         // Total frames when animated
}
```

**New Output Handle:**
- Source handle on right side
- Can connect to: another Comp, Page, or Transcode node

### 4. Transcode Node (New)

FFmpeg integration for video encoding.

```typescript
interface TranscodeNodeData extends BaseNodeData {
  name: string;
  format: VideoFormat;
  codec: VideoCodec;
  quality: number;            // 1-100, maps to CRF
  outputPath: string;         // Suggested filename
  status: 'idle' | 'rendering' | 'complete' | 'error';
  progress: number;           // 0-100 during render
  errorMessage?: string;
}

type VideoFormat = 'mp4' | 'webm' | 'gif' | 'mov';
type VideoCodec = 'h264' | 'h265' | 'vp9' | 'prores';
```

**Inputs:**
- Single target handle for Timeline or animated Comp

**UI:**
- Format dropdown (mp4, webm, gif, mov)
- Codec dropdown (context-dependent on format)
- Quality slider
- Output filename input
- Render button
- Progress bar during render

## Data Flow

```
Reference (sequence) ─┬─→ Timeline ─→ Comp ─→ Transcode ─→ video.mp4
                      │
Reference (static) ───┘

OR

Reference ─→ Transform ─→ Timeline ─→ Page ─→ PNG sequence
```

## Export Modes

### 1. PNG Sequence Export
- Renders each frame as individual PNG
- Filename pattern: `{name}-{frame:04d}.png`
- Triggered from Page node "Export Sequence" button
- Creates ZIP archive for download

### 2. Video Export (via FFmpeg)
- Requires FFmpeg installed locally
- Uses Transcode node
- Supports mp4, webm, gif, mov
- Quality presets map to codec-specific settings

## Implementation Phases

### Phase 1: Core Animation Framework ✅
- [x] Timeline node with keyframe system
- [x] Transform interpolation engine
- [x] Basic playback preview in canvas
- [x] Multi-track support (multiple transforms per timeline)
- [ ] Reference node sequence mode

### Phase 2: PNG Sequence Export ✅
- [x] Frame-by-frame render pipeline
- [x] Export from Timeline node (Export Frames button)
- [x] ZIP archive generation
- [x] Progress indication
- [x] 2x supersampling for quality
- [x] Pre-rendered layer caching
- [x] ffmpeg helper script (scripts/sequence-to-video.sh)

### Phase 3: FFmpeg Integration (Deferred)
- [ ] Transcode node implementation
- [x] FFmpeg command generation (via helper script)
- [ ] Local FFmpeg detection
- [ ] Render queue management
- [ ] Progress streaming from FFmpeg

### Phase 4: Polish
- [x] Easing options (linear, ease-in, ease-out, ease-in-out)
- [ ] Easing curve editor
- [ ] Onion skinning for keyframes
- [ ] Copy/paste keyframes
- [ ] Timeline zoom/pan
- [ ] Keyboard shortcuts for animation

## Technical Considerations

### Keyframe Interpolation
```typescript
function interpolateTransform(
  keyframes: Keyframe[],
  time: number,
  easing: EasingType
): TransformState {
  // Find surrounding keyframes
  // Apply easing function
  // Return interpolated transform values
}
```

### Frame Rendering Pipeline
```typescript
async function renderSequence(
  timeline: TimelineNodeData,
  source: ImageSource,
  outputWidth: number,
  outputHeight: number
): Promise<Blob[]> {
  const frames: Blob[] = [];
  const frameCount = timeline.fps * timeline.duration;

  for (let i = 0; i < frameCount; i++) {
    const time = i / timeline.fps;
    const transform = interpolateTransform(timeline.keyframes, time, timeline.easing);
    const frame = await renderFrame(source, transform, outputWidth, outputHeight);
    frames.push(frame);
  }

  return frames;
}
```

### FFmpeg Command Generation
```typescript
function buildFFmpegCommand(settings: TranscodeNodeData, inputPattern: string): string {
  const codecFlags = {
    'h264': '-c:v libx264 -preset medium',
    'h265': '-c:v libx265 -preset medium',
    'vp9': '-c:v libvpx-vp9',
    'prores': '-c:v prores_ks -profile:v 3',
  };

  // CRF 0-51 (lower = better quality, bigger file)
  const crf = Math.round(51 - (settings.quality / 100) * 51);

  return `ffmpeg -framerate ${fps} -i ${inputPattern} ${codecFlags[settings.codec]} -crf ${crf} ${settings.outputPath}`;
}
```

## UI/UX Notes

### Timeline Node Visual Design
- Dark background matching node aesthetic
- Ruler with major/minor tick marks
- Keyframe diamonds in node accent color
- Draggable playhead
- Hover tooltips showing exact time/values

### Animation Preview
- Preview plays in connected Page or Comp node
- Low-res preview for performance
- Full-res on export
- Play/pause button on Timeline node

### Sequence Import
- Drag-drop multiple images
- File picker with multi-select
- Auto-sort by filename
- Preview thumbnails in strip

## File Format for Animated Projects

Extend `.flowboard.json` to include animation data:

```json
{
  "project": {
    "id": "...",
    "name": "My Animation",
    "nodes": [...],
    "edges": [...]
  },
  "images": {
    "ref-123": "data:image/png;base64,...",
    "seq-456-0": "data:image/png;base64,...",
    "seq-456-1": "data:image/png;base64,...",
    "seq-456-2": "data:image/png;base64,..."
  }
}
```

## Dependencies

- **None for PNG sequence** - Pure browser implementation
- **FFmpeg for video** - Optional, user-installed
  - Detection: Check if `ffmpeg` command exists
  - Fallback: Show "Install FFmpeg" instructions, disable video export

## Open Questions

1. **WebCodecs API** - Should we explore browser-native video encoding as alternative to FFmpeg?
2. **Cloud rendering** - Future option for server-side FFmpeg without local install?
3. **Audio support** - Add audio track node in future iteration?
4. **Motion paths** - Bezier curves for position animation beyond linear X/Y?

---

## Current Tasks / Bugs

### Completed
- [x] **File handling debug** - Fixed import/export bugs with large files
  - Strip embedded image data after storing to IndexedDB
  - Preserve existing `_imageRefs` when saving projects without new images
  - Hydrate images from IndexedDB after opening files
  - Fixed localStorage quota issues (5MB limit)
- [x] **Animation memory leak** - Fixed by throttling store updates during playback
- [x] **Bad animation loops** - Fixed playback direction and loop restart timing
- [x] **PNG sequence export** - Full implementation with 2x supersampling
  - Pre-rendered layer caching for consistency
  - Export Frames button on Timeline node
  - ZIP download with progress indicator
- [x] **File-backed auto-save** - Skip localStorage for file-backed projects
  - Eliminates quota exceeded errors for large projects

### In Progress
- [ ] **Finish Intercept node** - Complete the InterceptNode implementation
  - UI for editing assembled prompt before generation
  - Negative prompt editing support
  - Pass-through mode vs edit mode

### Known Limitations
- **Scale animation flicker** - Slight variations visible in frame-by-frame comparison during scale animations
  - Mitigated by 2x supersampling
  - Not noticeable at 30fps playback
  - Inherent to canvas scaling behavior

### Backlog
- [ ] **Move history to IndexedDB** - History storage is bloating localStorage (was 4.7MB)
  - Similar pattern to image storage
  - Keep recent history in memory, persist to IndexedDB
- [ ] **GIF export** - Re-implement with better approach (gif.js had issues)

---

*Created: 2025-01-24*
*Updated: 2025-01-25*
*Status: Active Development*
*Branch: motion*
