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
| Pink | Shot | Camera framing |
| Red | Output | Generate image |

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

## Next Steps

- Read the full [FlowBoard Paper](./FLOWBOARD_PAPER.md) for deeper context
- Check the [PRD](./PRD.md) for detailed feature specifications
- Experiment with the Transform and Comp nodes for manual image manipulation and layout

Happy storytelling!
