# PromptFlow Studio — Node Prompt Examples

A collection of example descriptions and content for each node type to help you get started.

---

## Character Node

Describes WHO is in the scene. Focus on physical appearance, clothing, and presence.

**Example: Mira Chen**
```
Name: Mira Chen
Description: Tall woman, short black hair, cybernetic left eye, worn leather jacket, confident stance
```

**Example: Detective Marcus**
```
Name: Detective Marcus Webb
Description: Middle-aged man, salt-and-pepper stubble, tired eyes, rumpled trench coat, loosened tie, shoulder holster visible
```

**Example: Young Hero**
```
Name: Kai
Description: Teenage boy, messy brown hair, bright green eyes, oversized hoodie, worn sneakers, determined expression
```

**Example: Story Agent**
```
Name: Mido Washington
Description: Tall lanky dank skinned black man, with a combed out Afro, a nose ring and pierced ears. He has green irises vivid eyes and a small perfectly horizontal scar on his left cheek. He wears A Blue Adidas track suit and a single prominent but bodest gold chain around his neck. Bis shoes are Air Jordans. They look as if they were just unboxed today. 
```

---

## Setting Node

Describes WHERE the scene takes place. Focus on environment, atmosphere, and sensory details.

**Example: The Undercity**
```
Name: The Undercity
Description: Crowded underground market, neon signs in foreign scripts, steam vents, perpetual rain
```

**Example: Abandoned Laboratory**
```
Name: Abandoned Lab
Description: Dusty research facility, broken equipment, flickering fluorescent lights, papers scattered everywhere, vines growing through cracked windows
```

**Example: Rooftop at Sunset**
```
Name: City Rooftop
Description: High-rise rooftop, golden hour lighting, city skyline in background, water tower, scattered potted plants, string lights
```

---

## Style Node

Describes HOW the image should look. Focus on artistic style, color palette, and rendering technique.

**Example: Noir**
```
Name: Noir
Description: Noir comic art, high contrast, heavy black inks, muted colors with neon accents, dramatic shadows
```

**Example: Watercolor Dreams**
```
Name: Watercolor
Description: Soft watercolor illustration, bleeding edges, pastel palette, dreamy atmosphere, visible brush strokes, paper texture
```

**Example: Retro Anime**
```
Name: 90s Anime
Description: 1990s anime style, cel shading, bold outlines, limited color palette, VHS grain, nostalgic aesthetic
```

**Example: Photorealistic**
```
Name: Cinematic
Description: Photorealistic, cinematic lighting, shallow depth of field, film grain, anamorphic lens flare, 35mm photography
```

---

## Shot Node

Describes camera framing and angle. Use presets or add custom notes.

**Example: Dramatic Angle**
```
Name: Dramatic Angle
Preset: low-angle
Description: Looking up at subject, emphasizing power
```

**Example: Intimate Portrait**
```
Name: Intimate
Preset: close-up
Description: Soft focus on background, catch light in eyes
```

**Example: Epic Establishing**
```
Name: Epic Wide
Preset: establishing
Description: Vast scale, subject small in frame, emphasizing environment
```

---

## Action Node

Describes WHAT is happening. Write like a film director or novelist describing the scene.

**Example: Market Walk**
```
Mira walks through the crowded market, her cybernetic eye scanning the crowd. Rain drips from her jacket.
```

**Example: Tense Confrontation**
```
The two figures face each other across the empty warehouse, hands hovering near their weapons. Neither speaks. A single light swings overhead, casting moving shadows.
```

**Example: Discovery**
```
She pushes open the ancient door, dust swirling in the beam of her flashlight. The treasure chamber stretches before her, gold glinting in the darkness.
```

---

## Prop Node

Describes important OBJECTS in the scene. Focus on distinctive items that add story or visual interest.

**Example: Ancient Sword**
```
Name: Moonblade
Description: Curved silver blade, glowing blue runes along the edge, wrapped leather grip, ancient and weathered
```

**Example: Tech Device**
```
Name: Holo-Comm
Description: Wrist-mounted holographic communicator, blue projection, sleek black band, futuristic interface
```

---

## Extras Node

Describes background elements and ambient life. Adds depth without being the focus.

**Example: Market Crowd**
```
Name: Background Extras
Description: Crowd of people, busy street, vendors calling out, steam from food stalls, children running between legs
```

**Example: Office Workers**
```
Name: Office Background
Description: Cubicle workers typing, someone at water cooler, muffled phone conversations, fluorescent lighting
```

---

## Outfit Node

Overrides or specifies character clothing for a specific scene.

**Example: Formal Attire**
```
Name: Gala Outfit
Description: Elegant black evening gown, silver jewelry, hair pinned up, subtle makeup, confident posture
```

**Example: Combat Gear**
```
Name: Battle Ready
Description: Tactical vest, cargo pants, combat boots, utility belt, fingerless gloves, dirt and scratches
```

---

## Negative Node

Describes what to AVOID in the generation. Helps prevent common issues.

**Example: Quality Control**
```
Name: Negative Prompt
Content: blurry, low quality, distorted, extra limbs, bad anatomy, watermark, signature, text, logo
```

**Example: Style Exclusions**
```
Name: No Photorealism
Content: photorealistic, 3D render, CGI, uncanny valley, plastic skin, oversaturated
```

---

## Edit Node

Refinement instructions for iterating on a previous generation.

**Example: Color Adjustment**
```
Refinement: Make the colors more vibrant, increase the contrast in the shadows
```

**Example: Composition Fix**
```
Refinement: Move the character slightly to the left, add more breathing room on the right side
```

**Example: Mood Shift**
```
Refinement: Make the atmosphere more ominous, darken the sky, add distant lightning
```

---

## Tips for Writing Good Prompts

1. **Be Specific**: "worn leather jacket" is better than "jacket"
2. **Use Sensory Details**: Include what can be seen, heard, felt
3. **Layer Your Nodes**: Combine multiple nodes for richer results
4. **Iterate**: Use Edit nodes to refine generations
5. **Reference Real Art**: Mention specific artists or styles you admire
6. **Consider Lighting**: It dramatically affects mood
7. **Think Cinematically**: Describe scenes as a director would
