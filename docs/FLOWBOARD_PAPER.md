# FlowBoard: A Context Engineering Canvas for Visual Storytelling

**Version:** Alpha Release
**Date:** January 2025
**Author:** Jeff W33s3

---

## Abstract

FlowBoard is a visual node-based application designed to bring the power of context engineering to visual storytellers. By treating prompt components as modular, reusable assets—characters, settings, styles, and actions—FlowBoard enables creators to build consistent visual narratives with AI image generation, approaching the craft with the mindset of a director orchestrating a production.

---

## 1. Introduction

### The Problem

Creating consistent visual narratives with AI image generation presents a fundamental challenge: every prompt starts from scratch. A character described in one image may look entirely different in the next. Settings shift unexpectedly. Styles drift. For creators working on sequential art—comics, storyboards, illustrated stories—this inconsistency breaks the narrative thread.

Traditional prompt engineering treats each generation as an isolated event. You write a prompt, generate an image, and hope the AI interprets your intent correctly. For single images, this works. For storytelling across dozens or hundreds of panels, it becomes untenable.

### The Solution

FlowBoard reimagines prompt creation as a compositional system. Rather than writing monolithic prompts, creators build a library of modular components:

- **Characters** with defined appearances and personalities
- **Settings** with established visual characteristics
- **Styles** that encode aesthetic preferences
- **Props** that maintain consistency across scenes
- **Actions** that describe what's happening in each moment

These components connect visually on a canvas, flowing into an Output node that assembles them into a coherent prompt. The result is a non-destructive, visual workflow where changing a character's description propagates across every scene they appear in.

---

## 2. Inspiration and Philosophy

### Origins

FlowBoard emerged from practical experimentation with prompt chunking—the practice of breaking prompts into reusable segments and combining them strategically. Initial experiments focused on character development, discovering that defining characters as persistent entities dramatically improved visual consistency.

This evolved into a broader insight: the entire storytelling process could be modularized. Settings, styles, supporting characters, props—all could be treated as independent components that compose together. The approach mirrors how a screenwriter develops a bible for their production, or how a Dungeon Master maintains character sheets and world details for their campaign.

### Design Philosophy

Four principles guide FlowBoard's development:

1. **DM/Director Mindset** — Approach storytelling like directing actors on a set. You define your cast, establish your locations, set the mood, then orchestrate the action.

2. **Iterative Refinement** — Build rough, then polish. The non-destructive node-based workflow allows endless experimentation without losing previous work.

3. **Consistency Over Perfection** — A single stunning image matters less than maintaining visual coherence across an entire story. FlowBoard optimizes for narrative continuity.

4. **Tools Should Adapt** — Software should fit the creator's workflow, not the other way around. FlowBoard aims to feel intuitive and extend naturally as users develop new skills.

Above all, the tool must be **fun to use** and **reliable**. Creative tools that frustrate their users fail their fundamental purpose.

### Why Build It?

Existing tools like ComfyUI offer powerful node-based workflows, but they optimize for image generation pipelines rather than storytelling workflows. FlowBoard takes a different path: focused functionality for narrative creation, with the significant advantage that its creator understands its limitations and can extend its capabilities as needs arise.

---

## 3. Context Engineering

### Definition

Context engineering extends the practice of prompt engineering into a systematic discipline. Where prompt engineering focuses on crafting effective individual prompts, context engineering addresses how to structure, organize, and compose multiple contextual elements to consistently achieve desired outcomes.

In FlowBoard's domain, this means:

- **Defining intent** through structured component descriptions
- **Managing relationships** between story elements
- **Composing context** from multiple sources into coherent wholes
- **Maintaining state** across a body of work
- **Leveraging variety** with hooks for many asset types

### The Pull-Based Model

FlowBoard employs a pull-based assembly system. When you trigger generation from an Output node, it traverses backward through connected nodes, collecting only the components that are actually wired in. Free-floating nodes on the canvas have no effect—they're available assets, not active contributors.

This model provides clean separation between your asset library (everything on the canvas) and your active scene (what's connected to the Output). You can maintain extensive character galleries without polluting individual scenes.

---

## 4. Architecture

### Node Types

FlowBoard organizes nodes into three categories:

**Asset Nodes** — Persistent story elements
- Character (blue) — Named entities with defined appearances
- Setting (green) — Locations and environments
- Prop (amber) — Consistent objects
- Style (purple) — Visual aesthetics
- Extras (slate) — Background elements, crowds

**Modifier Nodes** — Scene-specific adjustments
- Shot (pink) — Camera framing and composition
- Outfit (cyan) — Character appearance overrides
- Action (orange) — What's happening in the scene

**Technical Nodes** — Generation control
- Parameters (teal) — Model selection, aspect ratio, seed
- Negative (rose) — What to avoid
- Output (red) — Prompt assembly and generation
- Page (sky) — Multi-panel composition
- Transform — Image positioning and adjustment
- Comp — Layer composition

### Visual Grouping

Nodes can be grouped (Cmd+G) to move together as units. Groups display as bounding boxes with editable labels, helping organize complex projects. Double-clicking a group isolates it, fading other nodes for focused work.

### Data Flow

Connections flow left-to-right, from asset nodes through modifiers to outputs. The Output node's assembler walks this graph, collecting and formatting component contributions into the final prompt structure expected by the target model.

---

## 5. Technical Specification

### Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite |
| UI Framework | Tailwind CSS |
| Node System | React Flow (@xyflow/react) |
| State Management | Zustand with Immer |
| Storage | LocalStorage (browser) |
| Deployment | GitHub Pages (static) |

### Supported Models

| Provider     | Models                                     |
| ------------ | ------------------------------------------ |
| Google       | Gemini 2.0 Flash, Gemini 3 Pro             |
| fal.ai       | Flux Schnell, Flux Dev                     |
| Stability.ai | Stable Diffusion                           |
| In the pipe  | More to come as we work through the design |

Models can be mixed within a single project, selected per-Output node via the Parameters node.

### Requirements

**For Users:**
- Modern web browser (Chrome, Firefox, Safari, Edge)
- API key for at least one provider:
  - Google AI Studio API key (for Gemini models)
  - fal.ai API key (for Flux models)

**For Development:**
- Node.js 18+
- npm or yarn

### Local Development

```bash
# Clone repository
git clone https://github.com/jweese1/flow-board.git
cd flow-board/client

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 6. Workflow Example

A typical FlowBoard workflow for creating a comic page:

1. **Build Your Cast** — Create Character nodes for your protagonist, supporting characters, and antagonists. Define their visual appearance, personality traits, and any distinguishing features.

2. **Establish Settings** — Create Setting nodes for your locations. A noir story might have "Rain-slicked city streets," "Smoky detective office," and "Abandoned warehouse."

3. **Define Your Style** — Create a Style node encoding your visual aesthetic: "High contrast black and white, heavy shadows, 1940s film noir cinematography."

4. **Compose a Scene** — Wire your character into an Action node describing what they're doing. Connect the relevant Setting. Add a Shot node for camera framing. Connect your Style.

5. **Generate** — Click Generate on the Output node. The assembled prompt captures all your connected context.

6. **Build the Page** — Wire multiple Output nodes (with their generated images) into a Page node. Choose a layout. Export your completed comic page.

7. **Iterate** — Adjust any component and regenerate. The node structure preserves your decisions while allowing refinement.

---

## 7. Roadmap

### Current (Alpha) ✅
- Core node types for storytelling
- Multi-model support (Gemini, Flux, Stability AI)
- Page composition with layouts
- Visual grouping system with isolation mode
- Project save/load
- Transform and Comp nodes for image manipulation

### In Development
- Additional authoring and composition tools
- Extended model support
- Documentation and learning resources

---

## 8. Conclusion

FlowBoard represents a focused approach to AI-assisted visual storytelling. By treating prompts as composable systems rather than isolated strings, it enables the kind of iterative, consistent narrative development that sequential art demands.

The tool embodies a simple premise: creative software should amplify human intent, not constrain it. By providing structure without rigidity, FlowBoard aims to be a canvas where stories come together—one node at a time.

---

## References

- React Flow: https://reactflow.dev
- Zustand: https://zustand-demo.pmnd.rs
- Google AI Studio: https://aistudio.google.com
- fal.ai: https://fal.ai

---

*FlowBoard is open source software developed by J. Weese with assistance from Claude (Anthropic).*
