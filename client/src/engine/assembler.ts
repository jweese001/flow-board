import type { Edge } from '@xyflow/react';
import type {
  AppNode,
  CharacterNodeData,
  SettingNodeData,
  PropNodeData,
  StyleNodeData,
  ShotNodeData,
  ActionNodeData,
  ExtrasNodeData,
  OutfitNodeData,
  NegativeNodeData,
  ParametersNodeData,
  EditNodeData,
  ModelType,
  AspectRatio,
} from '@/types/nodes';
import { SHOT_PRESET_LABELS } from '@/types/nodes';

interface AssembledPrompt {
  prompt: string;
  negativePrompt: string;
  parameters: {
    model: ModelType;
    aspectRatio: AspectRatio;
    seed?: number;
  };
  parts: {
    shot?: string;
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
 */
export function assemblePrompt(
  outputNodeId: string,
  nodes: AppNode[],
  edges: Edge[]
): AssembledPrompt {
  const visited = new Set<string>();

  // Collected elements
  const characters: CharacterNodeData[] = [];
  const settings: SettingNodeData[] = [];
  const props: PropNodeData[] = [];
  const styles: StyleNodeData[] = [];
  const extras: ExtrasNodeData[] = [];
  const outfits: OutfitNodeData[] = [];
  const actions: ActionNodeData[] = [];
  const edits: EditNodeData[] = [];
  const negatives: NegativeNodeData[] = [];
  let shot: ShotNodeData | null = null;
  let parameters: ParametersNodeData | null = null;

  // Build adjacency list for upstream traversal
  const upstreamMap = new Map<string, string[]>();
  for (const edge of edges) {
    const targets = upstreamMap.get(edge.target) || [];
    targets.push(edge.source);
    upstreamMap.set(edge.target, targets);
  }

  // Recursive traversal function
  function traverse(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    // Collect data based on node type
    switch (node.type) {
      case 'character':
        characters.push(node.data as CharacterNodeData);
        break;
      case 'setting':
        settings.push(node.data as SettingNodeData);
        break;
      case 'prop':
        props.push(node.data as PropNodeData);
        break;
      case 'style':
        styles.push(node.data as StyleNodeData);
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
      case 'negative':
        negatives.push(node.data as NegativeNodeData);
        break;
      case 'parameters':
        parameters = node.data as ParametersNodeData;
        break;
      case 'edit':
        edits.push(node.data as EditNodeData);
        break;
    }

    // Traverse upstream nodes
    const upstreamNodes = upstreamMap.get(nodeId) || [];
    for (const upstreamId of upstreamNodes) {
      traverse(upstreamId);
    }
  }

  // Start traversal from output node
  traverse(outputNodeId);

  // Format the prompt parts
  const parts: AssembledPrompt['parts'] = {
    shot: shot ? formatShot(shot) : undefined,
    characters: characters.map(formatCharacter),
    props: props.map(formatProp),
    settings: settings.map(formatSetting),
    extras: extras.map(formatExtras),
    outfits: outfits.map(formatOutfit),
    actions: actions.map(formatAction),
    styles: styles.map(formatStyle),
    edits: edits.map(formatEdit),
  };

  // Assemble final prompt in order
  const promptParts: string[] = [];

  if (parts.shot) {
    promptParts.push(parts.shot);
  }

  promptParts.push(...parts.characters);
  promptParts.push(...parts.outfits);
  promptParts.push(...parts.props);
  promptParts.push(...parts.settings);
  promptParts.push(...parts.extras);
  promptParts.push(...parts.actions);
  promptParts.push(...parts.styles);
  promptParts.push(...parts.edits);

  // Extract parameters with defaults
  const resolvedParams = parameters as ParametersNodeData | null;

  return {
    prompt: promptParts.join(' '),
    negativePrompt: negatives.map((n) => n.content).join(', '),
    parameters: {
      model: resolvedParams?.model || 'mock',
      aspectRatio: resolvedParams?.aspectRatio || '1:1',
      seed: resolvedParams?.seed,
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
