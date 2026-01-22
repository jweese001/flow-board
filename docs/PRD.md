# PromptFlow Studio — Product Requirements Document

**Version:** 2.0
**Date:** January 18, 2026

---

## Vision

PromptFlow Studio is a visual tool for crafting AI-generated images with the creative control of a Dungeon Master. Build a library of reusable characters, settings, and styles — then combine them with action descriptions to rapidly iterate on visual storytelling.

**Primary use case:** Creating comic books and illustrated stories with consistent characters, settings, and style across dozens or hundreds of panels.

---

## Problem

Current image generation tools treat each prompt as isolated text. This causes:

- **Inconsistency** — Characters drift in appearance across generations
- **Repetition** — Copy-pasting the same descriptions endlessly
- **Slow iteration** — Rebuilding prompts from scratch to try variations
- **No persistence** — Can't return to a project months later with assets intact

---

## Solution

A node-based canvas where:

1. **Assets are saved once, reused forever** — Define "Mira Chen" once, use her in 200 panels
2. **Action is separate from description** — Characters stay fixed; you only write what's happening
3. **Iteration is instant** — Tweak one node, regenerate, compare
4. **Projects persist** — Save your entire comic "bible" and return for future issues
5. **Models are swappable** — Same workflow outputs to DALL-E, Stable Diffusion, Flux, etc.

---

## Core Concepts

### The Canvas

An open workspace (React Flow) where users place and connect nodes. No enforced structure — one output or fifty, organized however makes sense to the user.

### Projects

A project groups all assets for a body of work (e.g., "Neon Shadows Comic Series"). Contains:
- Characters (who)
- Settings (where)
- Props (consistent objects)
- Styles (visual aesthetic)
- Shots (camera presets)
- Extras (background elements)
- Outfits (character overrides)
- Negatives (what to avoid)
- Saved outputs with metadata

Projects can be exported/imported as JSON for backup or sharing.

### The Creative Loop

```
Define assets → Describe action → Generate → Refine → Save what works
```

---

## Node Types

### Core Asset Nodes

These define persistent elements that stay consistent throughout your story.

#### Character
Defines a named entity with a persistent appearance. Include default clothing/costume in the description.

| Field | Description |
|-------|-------------|
| Name | "Mira Chen" |
| Description | "Tall woman, short black hair, cybernetic left eye, worn leather jacket, confident stance" |

Characters are referenced by name in Action nodes.

#### Setting
Defines a location or environment.

| Field | Description |
|-------|-------------|
| Name | "The Undercity" |
| Description | "Crowded underground market, neon signs in foreign scripts, steam vents, perpetual rain, claustrophobic alleys" |

#### Prop
Defines an object that needs to remain consistent across panels. Items characters interact with, vehicles, weapons, important objects.

| Field | Description |
|-------|-------------|
| Name | "Mira's Pistol" |
| Description | "Custom chrome handgun, angular barrel, holographic sight, worn grip tape, faint blue glow from energy cell" |

#### Style
Defines the visual aesthetic.

| Field | Description |
|-------|-------------|
| Name | "Noir" |
| Description | "Noir comic art, high contrast, heavy black inks, muted colors with neon accents, cinematic lighting, dramatic shadows" |

#### Extras
Background elements that create realistic, lived-in environments. Crowds, vehicles, ambient objects.

| Field | Description |
|-------|-------------|
| Name | "Undercity Crowd" |
| Description | "Dense mix of workers in coveralls, street vendors, hooded figures, some with visible cybernetics, carrying bags and crates" |

### Modifier Nodes

These modify or override other nodes.

#### Outfit
Overrides a character's default appearance with alternate clothing/costume. **Connects to a Character node.** If no Outfit is connected, the Character's default description is used.

| Field | Description |
|-------|-------------|
| Name | "Mira Undercover" |
| For Character | (connected Character node) |
| Description | "Elegant black evening dress, hair down and styled, subtle makeup, hidden ankle holster, silver earrings" |

#### Shot
Cinematographic framing and camera direction. Uses familiar DP terminology.

| Field | Description |
|-------|-------------|
| Name | "Dramatic Reveal" |
| Shot Type | (see presets below) |
| Description | Additional framing notes |

**Shot Presets (DP terminology):**
- **Establishing Shot** — Wide view showing location and context
- **Wide/Full Shot** — Full body, environment visible
- **Medium Shot** — Waist up, standard dialogue framing
- **Close-up** — Face/head fills frame, emotional emphasis
- **Extreme Close-up** — Single feature (eye, hand, object)
- **Over-the-Shoulder (OTS)** — From behind one character toward another
- **Two-Shot** — Two characters in frame together
- **Low Angle** — Camera below subject, looking up (power, menace)
- **High Angle** — Camera above subject, looking down (vulnerability)
- **Dutch Angle** — Tilted frame (tension, unease)
- **POV Shot** — From character's perspective
- **Bird's Eye** — Directly overhead
- **Tracking/Following** — Implies motion, following subject

### Scene Nodes

#### Action
Describes what's happening in the scene. References characters by name.

| Field | Description |
|-------|-------------|
| Content | "Mira grabs K-7 by the arm, pulling him into a dark alley. She glances over her shoulder, expression tense. Rain drips from her jacket." |

This is where the "DM narration" happens — the creative, variable part of each generation.

### Technical Nodes

#### Time Period
Defines the historical era for the scene, automatically preventing anachronistic elements.

| Field | Description |
|-------|-------------|
| Name | "1970s America" |
| Era Preset | (see presets below) |
| Region | Geographic qualifier (e.g., "United States", "Japan") |
| Notes | Additional period context |
| Auto-Negatives | Toggle to automatically avoid anachronistic elements |
| Custom Negatives | Additional things to avoid for this era |

**Era Presets:**
- **Prehistoric** — Before recorded history
- **Ancient Egypt/Greece/Rome** — Classical antiquity
- **Medieval** — 500-1400 AD
- **Renaissance** — 1400-1600
- **Colonial** — 1600-1800
- **Victorian** — 1837-1901
- **Edwardian** — 1901-1910
- **Roaring 20s** — 1920-1929
- **1930s-40s, 1950s, 1960s, 1970s, 1980s, 1990s, 2000s, 2010s** — Decade-specific
- **Contemporary** — 2020s
- **Near Future / Far Future** — Speculative

When Auto-Negatives is enabled, the system automatically adds era-appropriate negative prompts (e.g., "smartphones, modern cars" for 1970s).

#### Negative
Defines what to avoid in generation.

| Field | Description |
|-------|-------------|
| Name | "Quality fixes" |
| Content | "Blurry, low quality, extra limbs, malformed hands, watermark, signature, anime style" |

#### Parameters
Technical settings for generation.

| Field | Options |
|-------|---------|
| Model | DALL-E 3, SDXL, Flux, etc. |
| Aspect Ratio | 1:1, 16:9, 9:16, 2:3, 3:2 |
| Seed | Number (optional, for reproducibility) |

#### Edit/Refine
Applies modifications to a previous output. Enables iteration without rebuilding.

| Field | Description |
|-------|-------------|
| Input | Connection from a previous Output node |
| Refinement | "More dramatic lighting, tighter crop on faces" |

### Terminal Node

#### Output
The terminal node. Collects all upstream inputs, assembles the prompt, shows preview, triggers generation.

| Features |
|----------|
| Prompt preview (editable before send) |
| Generate button |
| Result display |
| Save to history |

---

## Node Summary

| Category | Node | Purpose | Color |
|----------|------|---------|-------|
| Asset | Character | Who | Blue |
| Asset | Setting | Where | Green |
| Asset | Prop | What (objects) | Amber |
| Asset | Style | How it looks | Fuchsia |
| Asset | Extras | Background life | Slate |
| Modifier | Outfit | Character override | Cyan |
| Modifier | Shot | Camera framing | Pink |
| Scene | Action | What's happening | Orange |
| Technical | Time Period | Historical era | Yellow |
| Technical | Negative | What to avoid | Rose |
| Technical | Parameters | Generation settings | Teal |
| Technical | Edit/Refine | Iteration | Gray |
| Terminal | Output | Assemble + generate | Red |

---

## Prompt Assembly

The Output node traverses upstream and assembles elements in this order:

```
[Time Period] — era context (if present, e.g., "1970s, United States")
[Shot] — camera framing (if present)
[Characters] — with Outfit overrides applied if connected
[Props] — objects in the scene
[Setting] — location description
[Extras] — background elements
[Action] — what's happening
[Style] — visual aesthetic
[Negative] — sent separately to API as negative prompt (includes Time Period auto-negatives)
[Parameters] — sent as API parameters, not in prompt text
```

### Override Behavior

**Outfit → Character:** When an Outfit node connects to a Character node, the Outfit's description replaces the character's default appearance for that generation only. The base Character node remains unchanged for other uses.

```
[Character: Mira Chen] ← default: "worn leather jacket"
        ↑
[Outfit: Undercover] → "elegant black dress, hair down"

Result: "Mira Chen, tall woman, short black hair, cybernetic left eye, elegant black dress, hair down"
```

### Example Assembled Prompt

**Nodes connected:**
- Shot: Low Angle Close-up
- Character: Mira Chen (with Outfit: Undercover)
- Prop: Mira's Pistol
- Setting: The Undercity
- Extras: Undercity Crowd
- Action: "Mira draws her weapon, eyes locked on a figure in the crowd"
- Style: Noir

**Output:**
> Low angle close-up shot. Mira Chen, tall woman, short black hair, cybernetic left eye, elegant black evening dress, hair down and styled. Custom chrome handgun with holographic sight drawn and ready. Undercity market, neon signs, steam vents, rain. Dense crowd of workers and hooded figures in background. Mira draws her weapon, eyes locked on a figure in the crowd. Noir comic art, high contrast, heavy black inks, dramatic shadows.

User can edit the preview before generating.

---

## Model Adapter Layer

Prompts are stored as structured data. On generation, an adapter formats for the target API:

| Model | Adapter handles |
|-------|-----------------|
| DALL-E 3 | Prompt length limits, no negative prompt support (bake into positive) |
| Stable Diffusion | Separate negative prompt, CFG scale, sampler |
| Flux | Prompt formatting, parameter mapping |
| Midjourney (future) | `--ar`, `--style`, `--no` flags |

Users don't think about this — they pick a model, the adapter does the rest.

---

## Data Persistence

### MVP: LocalStorage + File Export
- Projects saved to browser LocalStorage
- Manual export/import as `.promptflow` (JSON) files

### Future: Backend Storage
- SQLite or Postgres
- User accounts
- Cloud sync

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Project: Neon Shadows v1]              [Save] [Export]    │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│   Library    │                 Canvas                       │
│              │                                              │
│  Characters  │    ┌─────┐      ┌─────┐      ┌─────┐        │
│  + Mira      │    │Mira │─────▶│Action│─────▶│Output│       │
│  + K-7       │    └─────┘      └─────┘      └─────┘        │
│              │                     ▲                        │
│  Settings    │    ┌─────┐          │                        │
│  + Undercity │    │Under│──────────┘                        │
│              │    │city │                                   │
│  Styles      │    └─────┘                                   │
│  + Noir      │                                              │
│              │                                              │
│  [+ New]     │                                              │
│              │                                              │
├──────────────┴──────────────────────────────────────────────┤
│  Properties Panel (context-sensitive, shows selected node)  │
└─────────────────────────────────────────────────────────────┘
```

- **Library sidebar** — All saved assets, drag onto canvas
- **Canvas** — Node graph workspace
- **Properties panel** — Edit selected node's fields

---

## MVP Scope

### In

- Canvas with zoom/pan
- Core nodes: Character, Setting, Prop, Style, Action, Output
- Shot node with DP presets
- Negative and Parameters nodes
- Basic prompt assembly and preview
- One model integration (likely DALL-E 3 or SDXL via API)
- Project save/load (LocalStorage)
- Export/import project as JSON
- Basic dark UI theme

### Phase 2

- Outfit node (character override behavior)
- Extras node
- Edit/Refine node
- Full prompt assembly with override logic

### Out (Future)

- Extended authoring tools
- Additional model integrations
- Backend storage / accounts
- Collaboration features

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite, React Flow, Zustand, Tailwind CSS |
| Backend (MVP) | Minimal — could be client-side API calls with CORS proxy |
| Backend (Future) | Node.js, Express for API proxying and storage |
| Storage (MVP) | LocalStorage + JSON export |
| Storage (Future) | SQLite / Postgres |

---

## Success Criteria

1. User can define a character once and use it in 10+ generations with consistent appearance
2. Changing an Action node and regenerating takes < 5 seconds of user effort
3. User can close browser, return next week, and resume with all assets intact
4. Same project can generate to multiple AI models without rework

---

## Development Phases

### Phase 1: Foundation ✅
- [x] React Flow canvas with zoom/pan
- [x] Core asset nodes: Character, Setting, Prop, Style
- [x] Action and Output nodes
- [x] Shot node with preset dropdown
- [x] Basic prompt assembly (ordered concatenation)
- [x] Hardcoded mock "generation" (returns placeholder)

### Phase 2: Real Generation ✅
- [x] API integration (Gemini Pro/Flash)
- [x] Parameters node
- [x] Negative prompt node
- [x] Prompt preview editing
- [x] Extras node

### Phase 3: Persistence & Modifiers ✅
- [x] Project save/load
- [x] Library sidebar
- [x] Export/import JSON
- [x] Outfit node with override behavior
- [x] Edit/Refine node

### Phase 4: Polish ✅
- [x] Gemini model adapter (Pro/Flash)
- [x] Stability AI adapter (SD3 Large/Medium/Turbo, SDXL 1.0)
- [x] fal.ai model adapter (Flux Schnell, Flux Dev)
- [x] Visual node grouping — Cmd+G grouping, bounding boxes, editable labels
- [x] Group isolation mode — double-click to focus on a group
- [ ] UI refinements
- [ ] Keyboard shortcuts (partial — copy/paste, grouping done)
- [ ] Undo/redo
- [ ] Improve precision of Transforms — finer control for positioning/scaling

### Phase 5: Extended Features ✅
- [x] Reference Node — attach reference images to assets for visual consistency
- [x] Page Node — comic page layouts (full, 2-up, 3-up, 4-up, 6-up, manga, inset)
- [x] Page Node Num Grid — dynamic grid layout by panel count
- [x] Transform Node — scale, offset, rotation, flip controls for images
- [x] Comp Node — 4-layer image compositing (back/mid/fore/ext)
- [x] Camera Node — lens type, DoF, film stock, vignette, exposure settings
- [x] Copy/paste — clipboard support for duplicating nodes
- [x] Batch generation — generate multiple images at once (1-4)
- [x] Temperature control — creativity slider for generation
- [x] Resolution presets — 1K, 2K, 4K output options
- [x] Auto-save — automatic project persistence
- [x] History tracking — generation history with metadata

### Future Development
- Additional authoring tools
- Extended model support
- Documentation and tutorials
- UI/UX refinements
