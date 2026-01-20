import type { Edge } from '@xyflow/react';
import type {
  AppNode,
  CharacterNodeData,
  SettingNodeData,
  PropNodeData,
  StyleNodeData,
  ShotNodeData,
  CameraNodeData,
  ActionNodeData,
  ExtrasNodeData,
  OutfitNodeData,
  NegativeNodeData,
  ParametersNodeData,
  EditNodeData,
  ReferenceNodeData,
  OutputNodeData,
  ReferenceImageType,
  ModelType,
  AspectRatio,
  ImageResolution,
} from '@/types/nodes';
import {
  SHOT_PRESET_LABELS,
  LENS_TYPE_LABELS,
  DEPTH_OF_FIELD_LABELS,
  CAMERA_FEEL_LABELS,
  FILM_STOCK_LABELS,
  EXPOSURE_STYLE_LABELS,
  VIGNETTE_LABELS,
} from '@/types/nodes';
import { useSettingsStore } from '@/stores/settingsStore';

export interface ReferenceImage {
  imageUrl: string;
  imageType: ReferenceImageType;
  name?: string;
  description?: string;
}

interface AssembledPrompt {
  prompt: string;
  negativePrompt: string;
  referenceImages: ReferenceImage[];
  parameters: {
    model: ModelType;
    aspectRatio: AspectRatio;
    resolution?: ImageResolution;
    seed?: number;
    temperature?: number;
    numberOfImages?: number;
  };
  parts: {
    shot?: string;
    camera?: string;
    characters: string[];
    props: string[];
    settings: string[];
    extras: string[];
    outfits: string[];
    actions: string[];
    styles: string[];
    edits: string[];
  };
}

/**
 * Traverses the graph upstream from an output node and assembles
 * all connected node data into a formatted prompt string.
 *
 * The Output node has two input handles:
 * - "config" (top): For Parameters and Negative nodes
 * - default (left): For all prompt content nodes
 */
export function assemblePrompt(
  outputNodeId: string,
  nodes: AppNode[],
  edges: Edge[]
): AssembledPrompt {
  const visited = new Set<string>();

  // Collected elements (with node IDs for reference tracking)
  const characters: Array<{ id: string; data: CharacterNodeData }> = [];
  const settings: Array<{ id: string; data: SettingNodeData }> = [];
  const props: Array<{ id: string; data: PropNodeData }> = [];
  const styles: Array<{ id: string; data: StyleNodeData }> = [];
  const extras: ExtrasNodeData[] = [];
  const outfits: OutfitNodeData[] = [];
  const actions: ActionNodeData[] = [];
  const edits: EditNodeData[] = [];
  const negatives: NegativeNodeData[] = [];
  const standaloneReferences: ReferenceNodeData[] = [];
  let shot: ShotNodeData | null = null;
  let camera: CameraNodeData | null = null;
  let parameters: ParametersNodeData | null = null;

  // Build map of reference nodes connected to asset nodes (via "reference" handle)
  const referenceToAsset = new Map<string, string>(); // referenceNodeId -> assetNodeId
  for (const edge of edges) {
    if (edge.targetHandle === 'reference') {
      referenceToAsset.set(edge.source, edge.target);
    }
  }

  // Build adjacency list for upstream traversal (for prompt content)
  const upstreamMap = new Map<string, string[]>();
  for (const edge of edges) {
    // Skip config and reference edges - they don't need standard traversal
    if (edge.targetHandle === 'config' || edge.targetHandle === 'reference') continue;

    const targets = upstreamMap.get(edge.target) || [];
    targets.push(edge.source);
    upstreamMap.set(edge.target, targets);
  }

  // First, collect config nodes (Parameters, Negative) connected to config handle
  for (const edge of edges) {
    if (edge.target === outputNodeId && edge.targetHandle === 'config') {
      const node = nodes.find((n) => n.id === edge.source);
      if (!node) continue;

      if (node.type === 'parameters') {
        parameters = node.data as ParametersNodeData;
      } else if (node.type === 'negative') {
        negatives.push(node.data as NegativeNodeData);
      }
    }
  }

  // Collect Reference nodes connected directly to Output's reference handle
  const directOutputReferences: ReferenceNodeData[] = [];
  for (const edge of edges) {
    if (edge.target === outputNodeId && edge.targetHandle === 'reference') {
      const node = nodes.find((n) => n.id === edge.source);
      if (node?.type === 'reference') {
        const refData = node.data as ReferenceNodeData;
        if (refData.imageUrl) {
          directOutputReferences.push(refData);
        }
      }
    }
  }

  // Recursive traversal function for prompt content
  function traverse(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    // Collect data based on node type (only prompt content nodes)
    switch (node.type) {
      case 'character':
        characters.push({ id: node.id, data: node.data as CharacterNodeData });
        break;
      case 'setting':
        settings.push({ id: node.id, data: node.data as SettingNodeData });
        break;
      case 'prop':
        props.push({ id: node.id, data: node.data as PropNodeData });
        break;
      case 'style':
        styles.push({ id: node.id, data: node.data as StyleNodeData });
        break;
      case 'extras':
        extras.push(node.data as ExtrasNodeData);
        break;
      case 'outfit':
        outfits.push(node.data as OutfitNodeData);
        break;
      case 'action':
        actions.push(node.data as ActionNodeData);
        break;
      case 'shot':
        shot = node.data as ShotNodeData;
        break;
      case 'camera':
        camera = node.data as CameraNodeData;
        break;
      case 'edit':
        edits.push(node.data as EditNodeData);
        break;
      case 'reference':
        // Only add as standalone if not connected to an asset node
        const refData = node.data as ReferenceNodeData;
        if (refData.imageUrl && !referenceToAsset.has(node.id)) {
          standaloneReferences.push(refData);
        }
        break;
      // Parameters and Negative are now handled via config handle
      // But also support legacy connections (direct to left handle)
      case 'negative':
        if (!negatives.some(n => n.content === (node.data as NegativeNodeData).content)) {
          negatives.push(node.data as NegativeNodeData);
        }
        break;
      case 'parameters':
        if (!parameters) {
          parameters = node.data as ParametersNodeData;
        }
        break;
    }

    // Traverse upstream nodes
    const upstreamNodes = upstreamMap.get(nodeId) || [];
    for (const upstreamId of upstreamNodes) {
      traverse(upstreamId);
    }
  }

  // Start traversal from output node (for prompt content)
  traverse(outputNodeId);

  // Store camera position (cast needed because TS doesn't track mutations in closures)
  const cameraData = camera as CameraNodeData | null;
  const cameraPosition = cameraData?.promptPosition || 'after-shot';

  // Format the prompt parts
  const parts: AssembledPrompt['parts'] = {
    shot: shot ? formatShot(shot) : undefined,
    camera: camera ? formatCamera(camera) : undefined,
    characters: characters.map((c) => formatCharacter(c.data)),
    props: props.map((p) => formatProp(p.data)),
    settings: settings.map((s) => formatSetting(s.data)),
    extras: extras.map(formatExtras),
    outfits: outfits.map(formatOutfit),
    actions: actions.map(formatAction),
    styles: styles.map((s) => formatStyle(s.data)),
    edits: edits.map(formatEdit),
  };

  // Assemble final prompt in order
  const promptParts: string[] = [];

  if (parts.shot) {
    promptParts.push(parts.shot);
  }

  // Insert camera after shot if position is 'after-shot'
  if (parts.camera && cameraPosition === 'after-shot') {
    promptParts.push(parts.camera);
  }

  promptParts.push(...parts.characters);
  promptParts.push(...parts.outfits);

  // Insert camera after subject if position is 'after-subject'
  if (parts.camera && cameraPosition === 'after-subject') {
    promptParts.push(parts.camera);
  }

  promptParts.push(...parts.props);
  promptParts.push(...parts.settings);
  promptParts.push(...parts.extras);
  promptParts.push(...parts.actions);

  // Insert camera before style if position is 'before-style'
  if (parts.camera && cameraPosition === 'before-style') {
    promptParts.push(parts.camera);
  }

  promptParts.push(...parts.styles);
  promptParts.push(...parts.edits);

  // Extract parameters with defaults from settings store
  const resolvedParams = parameters as ParametersNodeData | null;
  const settingsDefaults = useSettingsStore.getState().defaults;

  // Collect reference images from all sources
  const referenceImages: ReferenceImage[] = [];

  // Helper to find reference image connected to an asset node (from Reference or Output node)
  const getConnectedReferenceImage = (assetNodeId: string): { imageUrl: string; name?: string } | null => {
    for (const [sourceId, targetId] of referenceToAsset.entries()) {
      if (targetId === assetNodeId) {
        const sourceNode = nodes.find((n) => n.id === sourceId);

        // Reference node as source
        if (sourceNode?.type === 'reference') {
          const refData = sourceNode.data as ReferenceNodeData;
          if (refData.imageUrl) {
            return { imageUrl: refData.imageUrl, name: refData.name };
          }
        }

        // Output node as source (use its generated image)
        if (sourceNode?.type === 'output') {
          const outputData = sourceNode.data as OutputNodeData;
          if (outputData.generatedImageUrl) {
            return { imageUrl: outputData.generatedImageUrl, name: 'Previous generation' };
          }
        }
      }
    }
    return null;
  };

  // Add reference images from connected Reference/Output nodes (with contextual descriptions)
  for (const char of characters) {
    const ref = getConnectedReferenceImage(char.id);
    if (ref) {
      referenceImages.push({
        imageUrl: ref.imageUrl,
        imageType: 'character',
        name: char.data.name,
        description: `Reference for character: ${char.data.name}. ${char.data.description}`,
      });
    }
  }

  for (const setting of settings) {
    const ref = getConnectedReferenceImage(setting.id);
    if (ref) {
      referenceImages.push({
        imageUrl: ref.imageUrl,
        imageType: 'setting',
        name: setting.data.name,
        description: `Reference for setting/environment: ${setting.data.name}. ${setting.data.description}`,
      });
    }
  }

  for (const prop of props) {
    const ref = getConnectedReferenceImage(prop.id);
    if (ref) {
      referenceImages.push({
        imageUrl: ref.imageUrl,
        imageType: 'prop',
        name: prop.data.name,
        description: `Reference for prop/object: ${prop.data.name}. ${prop.data.description}`,
      });
    }
  }

  for (const style of styles) {
    const ref = getConnectedReferenceImage(style.id);
    if (ref) {
      referenceImages.push({
        imageUrl: ref.imageUrl,
        imageType: 'style',
        name: style.data.name,
        description: `Style reference: ${style.data.name}. ${style.data.description}`,
      });
    }
  }

  // Add standalone reference node images (not connected to any asset)
  for (const ref of standaloneReferences) {
    referenceImages.push({
      imageUrl: ref.imageUrl!,
      imageType: ref.imageType,
      name: ref.name,
      description: ref.description,
    });
  }

  // Add reference images connected directly to Output node
  for (const ref of directOutputReferences) {
    referenceImages.push({
      imageUrl: ref.imageUrl!,
      imageType: ref.imageType,
      name: ref.name,
      description: ref.description,
    });
  }

  return {
    prompt: promptParts.join(' '),
    negativePrompt: negatives.map((n) => n.content).join(', '),
    referenceImages,
    parameters: {
      model: resolvedParams?.model || settingsDefaults.model,
      aspectRatio: resolvedParams?.aspectRatio || settingsDefaults.aspectRatio,
      resolution: resolvedParams?.resolution,
      seed: resolvedParams?.seed,
      temperature: resolvedParams?.temperature,
      numberOfImages: resolvedParams?.numberOfImages,
    },
    parts,
  };
}

// Formatting helpers

function formatShot(data: ShotNodeData): string {
  const presetLabel = SHOT_PRESET_LABELS[data.preset];
  let text = `${presetLabel}.`;
  if (data.description) {
    text += ` ${data.description}`;
  }
  return text;
}

function formatCamera(data: CameraNodeData): string {
  const parts: string[] = [];

  // Lens type (only add if not standard)
  if (data.lensType && data.lensType !== 'standard') {
    parts.push(LENS_TYPE_LABELS[data.lensType]);
  }

  // Depth of field (only add if not deep/default)
  if (data.depthOfField && data.depthOfField !== 'deep') {
    parts.push(DEPTH_OF_FIELD_LABELS[data.depthOfField]);
  }

  // Camera feel (only add if not locked/default)
  if (data.cameraFeel && data.cameraFeel !== 'locked') {
    parts.push(CAMERA_FEEL_LABELS[data.cameraFeel] + ' camera');
  }

  // Film stock (only add if not digital/default)
  if (data.filmStock && data.filmStock !== 'digital') {
    parts.push(FILM_STOCK_LABELS[data.filmStock] + ' look');
  }

  // Exposure (only add if not balanced/default)
  if (data.exposure && data.exposure !== 'balanced') {
    parts.push(EXPOSURE_STYLE_LABELS[data.exposure] + ' lighting');
  }

  // Vignette (only add if present)
  if (data.vignette && data.vignette !== 'none') {
    parts.push(VIGNETTE_LABELS[data.vignette].toLowerCase());
  }

  if (parts.length === 0) {
    return '';
  }

  return parts.join(', ') + '.';
}

function formatCharacter(data: CharacterNodeData): string {
  return `${data.name}, ${data.description}.`;
}

function formatProp(data: PropNodeData): string {
  return `${data.description}.`;
}

function formatSetting(data: SettingNodeData): string {
  return `Setting: ${data.description}.`;
}

function formatExtras(data: ExtrasNodeData): string {
  return data.description + '.';
}

function formatAction(data: ActionNodeData): string {
  return data.content;
}

function formatStyle(data: StyleNodeData): string {
  return `Style: ${data.description}.`;
}

function formatOutfit(data: OutfitNodeData): string {
  return `Wearing ${data.description}.`;
}

function formatEdit(data: EditNodeData): string {
  return data.refinement;
}
