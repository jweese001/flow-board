# FlowBoard Quick Start Guide

Get up and running with FlowBoard in minutes.

---

## Setup

### 1. Access FlowBoard

Visit the live application at: **https://jweese001.github.io/flow-board/**

Or run locally:
```bash
git clone https://github.com/jweese001/flow-board.git
cd flow-board/client
npm install
npm run dev
```

### 2. Configure API Keys

Click **Settings** in the left sidebar to add your API keys:

| Provider | Where to Get Key |
|----------|------------------|
| Google Gemini | [Google AI Studio](https://aistudio.google.com/apikey) |
| fal.ai | [fal.ai Dashboard](https://fal.ai/dashboard/keys) |

You need at least one API key to generate images.

---

## Your First Scene

### Step 1: Add a Character

1. Find **Character** in the left sidebar under "Add Nodes"
2. Click the **+** button to add it to the canvas
3. Click the node to select it
4. In the Properties panel (right side), fill in:
   - **Name:** "Detective Marcus Cole"
   - **Description:** "A weathered detective in his 50s, graying hair, worn trench coat, world-weary eyes"

### Step 2: Add a Setting

1. Add a **Setting** node from the sidebar
2. Configure:
   - **Name:** "City Streets"
   - **Description:** "Rain-slicked city streets at night, neon signs reflecting in puddles, 1940s urban atmosphere"

### Step 3: Add Style

1. Add a **Style** node
2. Configure:
   - **Name:** "Noir"
   - **Description:** "High contrast black and white, dramatic shadows, film noir cinematography, moody lighting"

### Step 4: Add Action

1. Add an **Action** node
2. Configure:
   - **Description:** "Standing under a streetlight, lighting a cigarette, watching the entrance to a jazz club across the street"

### Step 5: Add Output

1. Add an **Output** node
2. This is where you'll generate your image

### Step 6: Connect Everything

Drag from the **right handle** (output) of each node to the **left handle** (input) of the next:

```
Character ─┐
Setting ───┼──→ Action ──→ Output
Style ─────┘
```

### Step 7: Generate

1. Click the Output node to select it
2. Add a **Parameters** node and connect it to Output (to the "config" handle)
3. Choose your model (Gemini or Flux)
4. Click **Generate** on the Output node

---

## Key Concepts

### Pull-Based Assembly

Only nodes **connected** to an Output contribute to the prompt. Unconnected nodes on the canvas are just available assets—they don't affect generation.

### Node Colors

| Color | Node Type | Purpose |
|-------|-----------|---------|
| Blue | Character | Who |
| Green | Setting | Where |
| Purple | Style | How it looks |
| Amber | Prop | Consistent objects |
| Orange | Action | What's happening |
| Lime | Text | Dialogue & captions |
| Pink | Shot | Camera framing |
| Teal | Parameters | Generation settings |
| Rose | Negative | What to avoid |
| Red | Output | Generate image |
| Cyan | Reference | Import images |
| Indigo | Transform | Position/scale/rotate |
| Violet | Timeline | Animation control |
| Sky | Comp | Layer compositing |
| Emerald | Page | Comic layouts |

### Grouping Nodes

Select multiple nodes and press **Cmd+G** (Mac) or **Ctrl+G** (Windows) to group them. Groups:
- Move together when dragged
- Display a labeled bounding box
- Can be renamed by clicking the label

Press **Cmd+Shift+G** to ungroup.

### Isolation Mode

Double-click a group's border to **isolate** it—other nodes fade out so you can focus. Press **Escape** or double-click again to exit.

---

## Building a Comic Page

### 1. Create Multiple Scenes

Build several complete node trees, each ending in an Output node. Generate an image for each.

### 2. Add a Page Node

Add a **Page** node from the sidebar.

### 3. Connect Outputs to Page

Wire each Output node to a panel slot on the Page node. The Page shows a preview of your layout.

### 4. Configure Layout

In the Page properties:
- Choose a preset layout (2-up, 4-up, manga styles, etc.)
- Or enable "Use Num Grid" for custom panel counts
- Adjust gutter spacing
- Set output dimensions

### 5. Export

Click **Export Page** to download your composed comic page as a PNG.

---

## Tips

- **Reuse Assets** — The same Character node can connect to multiple Action nodes for different scenes
- **Collapse Nodes** — Click the chevron in a node header to collapse it and save space
- **Copy/Paste** — Select nodes and use Cmd+C / Cmd+V to duplicate
- **Save Often** — Click Save in the top bar, or use Cmd+S
- **Try Different Models** — Gemini and Flux have different strengths; experiment

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+G | Group selected nodes |
| Cmd+Shift+G | Ungroup |
| Cmd+C | Copy selected nodes |
| Cmd+V | Paste |
| Cmd+S | Save project |
| Escape | Exit isolation mode |
| Delete/Backspace | Delete selected nodes |

---

## Troubleshooting

**"API key not configured"**
→ Go to Settings and add your API key for the model you're trying to use

**Wire connects to wrong spot**
→ If you changed a Page node's panel count, the handles may need to refresh. Try deselecting and reselecting the node.

**Image not appearing in Page**
→ Make sure the Output node has a generated image (shows in the Output preview) before connecting to Page

---

---

## Animation Basics

FlowBoard can animate your generated images using the **Timeline** and **Transform** nodes.

### Creating an Animation

#### Step 1: Set Up Your Image

Start with an image you want to animate:
- Generate an image using an Output node, OR
- Import an existing image using a **Reference** node

#### Step 2: Add a Transform Node

1. Add a **Transform** node from the Animation section in the sidebar
2. Connect your image source (Output or Reference) to the Transform's input
3. The Transform controls: **Scale**, **Offset X/Y**, **Rotation**, and **Opacity**

#### Step 3: Add a Timeline Node

1. Add a **Timeline** node
2. Connect the Timeline's output to the Transform's "timeline-in" handle
3. Configure the Timeline:
   - **FPS**: 24, 30, or 60 frames per second
   - **Duration**: Length in seconds
   - **Easing**: How keyframes interpolate (linear, ease-in, ease-out, ease-in-out)

#### Step 4: Add Keyframes

1. Check the Transform in the Timeline's "TRANSFORMS" list
2. Set the playhead to time 0s
3. Adjust the Transform values (e.g., Scale = 1.0)
4. Click **+ Add** to add a keyframe
5. Move playhead to end (e.g., 1.0s)
6. Change Transform values (e.g., Scale = 1.2)
7. Click **+ Add** again

#### Step 5: Preview

Click the **Play** button on the Timeline to preview your animation.

#### Step 6: Export

1. Click **Export Frames** on the Timeline node
2. A ZIP file downloads containing PNG frames
3. Convert to video using ffmpeg:

```bash
# Basic conversion (30fps)
ffmpeg -framerate 30 -i frames/frame_%05d.png -c:v libx264 -pix_fmt yuv420p output.mp4

# High quality
ffmpeg -framerate 30 -i frames/frame_%05d.png -c:v libx264 -preset slow -crf 15 -pix_fmt yuv420p output.mp4
```

### Animation Tips

- **Ease-in-out** produces smoother, more natural motion
- **30fps** is a good balance of smoothness and file size
- Keep animations short (1-3 seconds) for best results
- Use the **Comp node** to animate multiple layers independently

---

## Compositing with Comp Node

The **Comp** node layers multiple images together, perfect for parallax effects or compositing characters over backgrounds.

### Layer Order (back to front)

| Handle | Layer | Typical Use |
|--------|-------|-------------|
| back | Background | Sky, distant scenery |
| mid | Midground | Main environment |
| fore | Foreground | Characters, main subjects |
| ext | Extension | Overlays, effects |

### Basic Compositing

1. Add a **Comp** node
2. Connect images to the layer inputs (back, mid, fore, ext)
3. Optionally add **Transform** nodes between sources and Comp for positioning
4. Set output dimensions in Comp properties
5. The Comp preview shows your layered result

### Animated Compositing

Connect each layer through its own Transform node, then connect all Transforms to the same Timeline. This enables:
- **Parallax scrolling** - Background moves slower than foreground
- **Character animation** - Move characters independently of background
- **Zoom effects** - Scale layers at different rates

---

## Working with Files

### Opening Projects from Files

1. Click the **folder icon** in the Projects section
2. Select a `.flowboard.json` file
3. The project loads with all images intact

### Saving to Files

- **Save** (Cmd+S): Saves to the current file if opened from file, otherwise to browser storage
- **Save As**: Click the **download icon** to save as a new file

File-based projects are better for:
- Large projects with many images
- Sharing projects between computers
- Version control with git

### Import/Export (Legacy)

- **Export**: Downloads project as JSON (works in all browsers)
- **Import**: Upload a previously exported JSON file

---

## Reference Images

The **Reference** node lets you use existing images in your workflow.

### Adding a Reference Image

1. Add a **Reference** node from the sidebar
2. Click **Choose File** or drag an image onto the node
3. The image appears in the node preview

### Uses for Reference Images

- **Compositing**: Layer reference images in a Comp node
- **Animation**: Animate imported images with Transform + Timeline
- **Style reference**: Connect to Output as visual context (model-dependent)

---

## Next Steps

- Read the full [FlowBoard Paper](./FLOWBOARD_PAPER.md) for deeper context
- Check the [PRD](./PRD.md) for detailed feature specifications
- Explore the Animation feature plan in [feature-plan-motion.md](./feature-plan-motion.md)

Happy storytelling!
