import type { Node } from '@xyflow/react';

// ===== BASE =====

export interface BaseNodeData {
  label: string;
  [key: string]: unknown;
}

// ===== ASSET NODES =====

export interface CharacterNodeData extends BaseNodeData {
  name: string;
  description: string;
}

export interface SettingNodeData extends BaseNodeData {
  name: string;
  description: string;
}

export interface PropNodeData extends BaseNodeData {
  name: string;
  description: string;
}

export interface StyleNodeData extends BaseNodeData {
  name: string;
  description: string;
}

export interface ExtrasNodeData extends BaseNodeData {
  name: string;
  description: string;
}

// ===== MODIFIER NODES =====

export type ShotPreset =
  | 'establishing'
  | 'wide'
  | 'medium'
  | 'close-up'
  | 'extreme-close-up'
  | 'over-the-shoulder'
  | 'two-shot'
  | 'low-angle'
  | 'high-angle'
  | 'dutch-angle'
  | 'pov'
  | 'birds-eye'
  | 'tracking';

export const SHOT_PRESET_LABELS: Record<ShotPreset, string> = {
  'establishing': 'Establishing Shot',
  'wide': 'Wide Shot',
  'medium': 'Medium Shot',
  'close-up': 'Close-up',
  'extreme-close-up': 'Extreme Close-up',
  'over-the-shoulder': 'Over-the-Shoulder',
  'two-shot': 'Two-Shot',
  'low-angle': 'Low Angle',
  'high-angle': 'High Angle',
  'dutch-angle': 'Dutch Angle',
  'pov': 'POV Shot',
  'birds-eye': "Bird's Eye",
  'tracking': 'Tracking Shot',
};

export interface ShotNodeData extends BaseNodeData {
  name: string;
  preset: ShotPreset;
  description?: string;
}

export interface OutfitNodeData extends BaseNodeData {
  name: string;
  description: string;
}

// ===== SCENE NODES =====

export interface ActionNodeData extends BaseNodeData {
  content: string;
}

// ===== TECHNICAL NODES =====

export interface NegativeNodeData extends BaseNodeData {
  name: string;
  content: string;
}

export type ModelType =
  | 'mock'
  | 'gemini-pro'       // Gemini 3 Pro image generation
  | 'gemini-flash'     // Gemini 2 Flash image generation
  | 'flux-schnell'     // fal.ai Flux Schnell (fast)
  | 'flux-dev'         // fal.ai Flux Dev (quality)
  | 'turbo'            // fal.ai Turbo (very fast)
  | 'sdxl-turbo';      // fal.ai SDXL Turbo
export type AspectRatio = '1:1' | '16:9' | '9:16' | '2:3' | '3:2';
export type ImageResolution = '1K' | '2K' | '4K';

export interface ParametersNodeData extends BaseNodeData {
  model: ModelType;
  aspectRatio: AspectRatio;
  resolution?: ImageResolution;
  seed?: number;
  temperature?: number; // 0.0 - 2.0, controls creativity
  numberOfImages?: number; // 1-4, batch generation
}

export interface EditNodeData extends BaseNodeData {
  refinement: string;
}

export type ReferenceImageType = 'character' | 'object' | 'style';

export interface ReferenceNodeData extends BaseNodeData {
  name: string;
  imageUrl?: string; // Base64 data URL or uploaded image URL
  imageType: ReferenceImageType; // For Gemini's reference image categories
  description?: string; // Optional description of what's in the reference
}

// ===== TERMINAL NODE =====

export type OutputStatus = 'idle' | 'generating' | 'complete' | 'error';

export interface GeneratedImageData {
  imageUrl: string;
  seed?: number;
}

export interface OutputNodeData extends BaseNodeData {
  promptPreview: string;
  generatedImageUrl?: string;
  generatedImages?: GeneratedImageData[];
  selectedImageIndex?: number;
  status: OutputStatus;
  error?: string;
}

// ===== LAYOUT NODE =====

export type PageLayout =
  | 'full'           // Single full-page panel
  | '2-up-h'         // 2 panels horizontal
  | '2-up-v'         // 2 panels vertical
  | '3-up-left'      // 1 large left, 2 stacked right
  | '3-up-right'     // 2 stacked left, 1 large right
  | '3-up-top'       // 1 large top, 2 below
  | '3-up-bottom'    // 2 above, 1 large bottom
  | '4-up'           // 2x2 grid
  | '6-up'           // 2x3 grid
  | 'manga-3'        // Manga-style irregular 3 panel
  | 'manga-4'        // Manga-style irregular 4 panel
  | 'inset';         // Large panel with small inset

export interface PageNodeData extends BaseNodeData {
  layout: PageLayout;
  gutter: number;        // Gap between panels in pixels
  backgroundColor: string;
  panelImages: (string | null)[]; // Array of image URLs for each slot
}

// ===== NODE TYPE UNION =====

export type NodeType =
  | 'character'
  | 'setting'
  | 'prop'
  | 'style'
  | 'extras'
  | 'shot'
  | 'outfit'
  | 'action'
  | 'negative'
  | 'parameters'
  | 'edit'
  | 'reference'
  | 'output'
  | 'page';

export type AppNodeData =
  | CharacterNodeData
  | SettingNodeData
  | PropNodeData
  | StyleNodeData
  | ExtrasNodeData
  | ShotNodeData
  | OutfitNodeData
  | ActionNodeData
  | NegativeNodeData
  | ParametersNodeData
  | EditNodeData
  | ReferenceNodeData
  | OutputNodeData
  | PageNodeData;

// Use BuiltInNode pattern for React Flow compatibility
export type CharacterNode = Node<CharacterNodeData, 'character'>;
export type SettingNode = Node<SettingNodeData, 'setting'>;
export type PropNode = Node<PropNodeData, 'prop'>;
export type StyleNode = Node<StyleNodeData, 'style'>;
export type ExtrasNode = Node<ExtrasNodeData, 'extras'>;
export type ShotNode = Node<ShotNodeData, 'shot'>;
export type OutfitNode = Node<OutfitNodeData, 'outfit'>;
export type ActionNode = Node<ActionNodeData, 'action'>;
export type NegativeNode = Node<NegativeNodeData, 'negative'>;
export type ParametersNode = Node<ParametersNodeData, 'parameters'>;
export type EditNode = Node<EditNodeData, 'edit'>;
export type ReferenceNode = Node<ReferenceNodeData, 'reference'>;
export type OutputNode = Node<OutputNodeData, 'output'>;
export type PageNode = Node<PageNodeData, 'page'>;

export type AppNode =
  | CharacterNode
  | SettingNode
  | PropNode
  | StyleNode
  | ExtrasNode
  | ShotNode
  | OutfitNode
  | ActionNode
  | NegativeNode
  | ParametersNode
  | EditNode
  | ReferenceNode
  | OutputNode
  | PageNode;

// ===== NODE COLORS =====

export const NODE_COLORS: Record<NodeType, string> = {
  character: '#3b82f6',
  setting: '#10b981',
  prop: '#f59e0b',
  style: '#a855f7',
  extras: '#64748b',
  shot: '#ec4899',
  outfit: '#06b6d4',
  action: '#f97316',
  negative: '#f43f5e',
  parameters: '#14b8a6',
  edit: '#6b7280',
  reference: '#8b5cf6',
  output: '#ef4444',
  page: '#0ea5e9', // Sky blue for page layout
};

// ===== NODE ICONS =====

export const NODE_LABELS: Record<NodeType, string> = {
  character: 'Character',
  setting: 'Setting',
  prop: 'Prop',
  style: 'Style',
  extras: 'Extras',
  shot: 'Shot',
  outfit: 'Outfit',
  action: 'Action',
  negative: 'Negative',
  parameters: 'Parameters',
  edit: 'Edit',
  reference: 'Reference',
  output: 'Output',
  page: 'Page',
};

// Layout preset labels for UI
export const PAGE_LAYOUT_LABELS: Record<PageLayout, string> = {
  'full': 'Full Page',
  '2-up-h': '2-Up Horizontal',
  '2-up-v': '2-Up Vertical',
  '3-up-left': '3-Up (Large Left)',
  '3-up-right': '3-Up (Large Right)',
  '3-up-top': '3-Up (Large Top)',
  '3-up-bottom': '3-Up (Large Bottom)',
  '4-up': '4-Up Grid',
  '6-up': '6-Up Grid',
  'manga-3': 'Manga 3-Panel',
  'manga-4': 'Manga 4-Panel',
  'inset': 'Inset Panel',
};

// Number of panel slots for each layout
export const PAGE_LAYOUT_SLOTS: Record<PageLayout, number> = {
  'full': 1,
  '2-up-h': 2,
  '2-up-v': 2,
  '3-up-left': 3,
  '3-up-right': 3,
  '3-up-top': 3,
  '3-up-bottom': 3,
  '4-up': 4,
  '6-up': 6,
  'manga-3': 3,
  'manga-4': 4,
  'inset': 2,
};
