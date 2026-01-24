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

// ===== CAMERA NODE =====

export type DepthOfField = 'deep' | 'shallow' | 'very-shallow';
export type LensType = 'standard' | 'wide' | 'ultra-wide' | 'fisheye-180' | 'telephoto' | 'anamorphic' | 'tilt-shift';
export type CameraFeel = 'locked' | 'handheld' | 'steadicam';
export type FilmStock = 'digital' | '35mm' | '16mm' | 'large-format';
export type ExposureStyle = 'balanced' | 'high-key' | 'low-key';
export type VignetteStyle = 'none' | 'light' | 'heavy';
export type CameraPromptPosition = 'after-shot' | 'after-subject' | 'before-style';

export const DEPTH_OF_FIELD_LABELS: Record<DepthOfField, string> = {
  'deep': 'Deep Focus',
  'shallow': 'Shallow DoF',
  'very-shallow': 'Very Shallow DoF',
};

export const LENS_TYPE_LABELS: Record<LensType, string> = {
  'standard': 'Standard 50mm',
  'wide': 'Wide 24mm',
  'ultra-wide': 'Ultra-Wide 14mm',
  'fisheye-180': 'Fisheye 180°',
  'telephoto': 'Telephoto 85mm+',
  'anamorphic': 'Anamorphic',
  'tilt-shift': 'Tilt-Shift',
};

export const CAMERA_FEEL_LABELS: Record<CameraFeel, string> = {
  'locked': 'Locked/Tripod',
  'handheld': 'Handheld',
  'steadicam': 'Steadicam',
};

export const FILM_STOCK_LABELS: Record<FilmStock, string> = {
  'digital': 'Digital Clean',
  '35mm': '35mm Film',
  '16mm': '16mm Vintage',
  'large-format': 'Large Format',
};

export const EXPOSURE_STYLE_LABELS: Record<ExposureStyle, string> = {
  'balanced': 'Balanced',
  'high-key': 'High Key',
  'low-key': 'Low Key',
};

export const VIGNETTE_LABELS: Record<VignetteStyle, string> = {
  'none': 'None',
  'light': 'Light Vignette',
  'heavy': 'Heavy Vignette',
};

export const CAMERA_POSITION_LABELS: Record<CameraPromptPosition, string> = {
  'after-shot': 'After Shot',
  'after-subject': 'After Subject',
  'before-style': 'Before Style',
};

export interface CameraNodeData extends BaseNodeData {
  name: string;
  depthOfField: DepthOfField;
  lensType: LensType;
  cameraFeel: CameraFeel;
  filmStock: FilmStock;
  exposure: ExposureStyle;
  vignette: VignetteStyle;
  promptPosition: CameraPromptPosition;
}

// ===== SCENE NODES =====

export interface ActionNodeData extends BaseNodeData {
  content: string;
}

// ===== TECHNICAL NODES =====

// ----- Time Period Node -----

export type EraPreset =
  | 'custom'
  | 'prehistoric'
  | 'ancient-egypt'
  | 'ancient-greece'
  | 'ancient-rome'
  | 'medieval'
  | 'renaissance'
  | 'colonial'
  | 'victorian'
  | 'edwardian'
  | 'roaring-20s'
  | '1930s-40s'
  | '1950s'
  | '1960s'
  | '1970s'
  | '1980s'
  | '1990s'
  | '2000s'
  | '2010s'
  | 'contemporary'
  | 'near-future'
  | 'far-future';

export const ERA_PRESET_LABELS: Record<EraPreset, string> = {
  'custom': 'Custom',
  'prehistoric': 'Prehistoric',
  'ancient-egypt': 'Ancient Egypt',
  'ancient-greece': 'Ancient Greece',
  'ancient-rome': 'Ancient Rome',
  'medieval': 'Medieval (500-1400)',
  'renaissance': 'Renaissance (1400-1600)',
  'colonial': 'Colonial (1600-1800)',
  'victorian': 'Victorian (1837-1901)',
  'edwardian': 'Edwardian (1901-1910)',
  'roaring-20s': 'Roaring 20s (1920-1929)',
  '1930s-40s': '1930s-40s',
  '1950s': '1950s',
  '1960s': '1960s',
  '1970s': '1970s',
  '1980s': '1980s',
  '1990s': '1990s',
  '2000s': '2000s',
  '2010s': '2010s',
  'contemporary': 'Contemporary (2020s)',
  'near-future': 'Near Future',
  'far-future': 'Far Future',
};

// Auto-generated negative prompts per era (anachronistic elements to avoid)
export const ERA_AUTO_NEGATIVES: Record<EraPreset, string[]> = {
  'custom': [],
  'prehistoric': [
    'metal tools', 'clothing', 'buildings', 'domesticated animals',
    'pottery', 'written text', 'modern elements',
  ],
  'ancient-egypt': [
    'modern clothing', 'glass windows', 'firearms', 'printed text',
    'electric lights', 'modern architecture', 'plastic',
  ],
  'ancient-greece': [
    'medieval armor', 'firearms', 'printed books', 'modern clothing',
    'electric lights', 'glass windows', 'concrete buildings',
  ],
  'ancient-rome': [
    'medieval elements', 'firearms', 'printed text', 'modern materials',
    'electric lighting', 'contemporary fashion',
  ],
  'medieval': [
    'firearms', 'printed books', 'glass windows', 'modern clothing',
    'electric lights', 'concrete', 'plastic', 'refined sugar',
    'potatoes', 'tomatoes', 'accurate maps',
  ],
  'renaissance': [
    'electric lights', 'modern weapons', 'industrial machinery',
    'photography', 'modern clothing', 'cars', 'plastic',
  ],
  'colonial': [
    'electric lights', 'automobiles', 'modern weapons', 'photography',
    'industrial factories', 'modern clothing', 'plastic',
  ],
  'victorian': [
    'electric lights', 'automobiles', 'airplanes', 'modern weapons',
    'color photography', 'plastic', 'modern clothing', 'computers',
  ],
  'edwardian': [
    'modern cars', 'airplanes', 'plastic', 'modern electronics',
    'contemporary fashion', 'color photography', 'television',
  ],
  'roaring-20s': [
    'television', 'plastic', 'jet aircraft', 'modern cars',
    'color photography', 'computers', 'contemporary fashion',
    'post-1930 vehicles', 'air conditioning',
  ],
  '1930s-40s': [
    'television', 'plastic consumer goods', 'jet aircraft', 'modern cars',
    'color photography', 'computers', 'contemporary fashion', 'smartphones',
  ],
  '1950s': [
    'modern computers', 'smartphones', 'flat screen TV', 'modern cars',
    'contemporary fashion', 'internet', 'digital displays', 'LED lighting',
  ],
  '1960s': [
    'personal computers', 'smartphones', 'flat screens', 'modern cars',
    'contemporary fashion', 'internet', 'digital cameras', 'LED lighting',
  ],
  '1970s': [
    'personal computers', 'smartphones', 'flat screen TV', 'modern cars',
    'contemporary fashion', 'internet', 'digital cameras', 'CDs', 'DVDs',
  ],
  '1980s': [
    'smartphones', 'flat screen TV', 'modern laptops', 'LCD monitors',
    'contemporary fashion', 'streaming', 'Wi-Fi', 'hybrid cars',
  ],
  '1990s': [
    'smartphones', 'flat screen TV', 'social media', 'streaming services',
    'contemporary fashion', 'modern laptops', 'hybrid cars', 'LED lighting',
  ],
  '2000s': [
    'modern smartphones post-2010', 'contemporary 2020s fashion',
    'streaming dominance', 'social media saturation', 'electric vehicles',
  ],
  '2010s': [
    'contemporary 2020s fashion', 'AI assistants', 'modern electric vehicles',
    'TikTok-era social media', 'current streaming interfaces', 'foldable phones',
  ],
  'contemporary': [
    'futuristic technology', 'sci-fi elements', 'holographic displays',
    'flying cars', 'robot servants', 'space colonies',
  ],
  'near-future': [
    'historical elements', 'outdated technology', 'vintage aesthetics',
  ],
  'far-future': [
    'contemporary technology', 'current fashion', 'present-day vehicles',
    'modern architecture', 'today\'s electronics',
  ],
};

export interface TimePeriodNodeData extends BaseNodeData {
  name: string;
  eraPreset: EraPreset;
  customEra?: string;         // Used when preset is 'custom'
  region?: string;            // Geographic qualifier (e.g., "United States", "Japan")
  description?: string;       // Additional period notes
  useAutoNegatives: boolean;  // Whether to inject auto negatives
  customNegatives?: string;   // User-added negatives for this period
}

// ----- Other Technical Nodes -----

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
  | 'sdxl-turbo'       // fal.ai SDXL Turbo
  | 'sd3-large'        // Stability AI SD3 Large
  | 'sd3-large-turbo'  // Stability AI SD3 Large Turbo (faster)
  | 'sd3-medium'       // Stability AI SD3 Medium
  | 'sdxl-1.0';        // Stability AI SDXL 1.0
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

export type ReferenceImageType = 'image' | 'character' | 'setting' | 'prop' | 'style' | 'scene' | 'mood';

export interface ReferenceNodeData extends BaseNodeData {
  name: string;
  imageUrl?: string; // Base64 data URL or uploaded image URL
  imageType: ReferenceImageType; // For Gemini's reference image categories
  description?: string; // Optional description of what's in the reference
  // Sequence mode fields
  isSequence?: boolean; // Toggle for sequence mode
  sequenceImages?: string[]; // Array of image URLs for sequence
  sequenceIndex?: number; // Current frame being previewed (for UI)
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
  name: string;          // Editable page title
  layout: PageLayout;
  gutter: number;        // Gap between panels in pixels
  backgroundColor: string;
  panelImages: (string | null)[]; // Array of image URLs for each slot
  outputWidth: number;   // Export width in pixels
  outputHeight: number;  // Export height in pixels
  useNumGrid?: boolean;  // Use dynamic grid instead of preset layout
  numPanels?: number;    // Number of panels for dynamic grid (1-16)
}

// ===== TIMELINE NODE =====

export type EasingType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';

export const EASING_LABELS: Record<EasingType, string> = {
  'linear': 'Linear',
  'ease-in': 'Ease In',
  'ease-out': 'Ease Out',
  'ease-in-out': 'Ease In-Out',
  'spring': 'Spring',
};

export interface KeyframeTransforms {
  scale: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  opacity: number;
  // Note: flipH/flipV are instant, not animated
}

export interface Keyframe {
  id: string; // Unique ID for React keys
  time: number; // Time in seconds
  transforms: KeyframeTransforms;
  easing?: EasingType; // Override easing for this keyframe
}

export type TimelineFPS = 12 | 24 | 30 | 60;

export const FPS_OPTIONS: TimelineFPS[] = [12, 24, 30, 60];

export type PlayDirection = 1 | -1;

export interface TimelineNodeData extends BaseNodeData {
  name: string;
  fps: TimelineFPS;
  duration: number; // Total duration in seconds
  keyframes: Keyframe[];
  loop: boolean;
  easing: EasingType; // Default easing between keyframes
  currentTime: number; // Current playhead position (for preview)
  isPlaying: boolean; // Playback state
  playDirection: PlayDirection; // 1 = forward, -1 = reverse
  currentTransforms?: KeyframeTransforms; // Interpolated transforms at currentTime (for downstream nodes)
}

// ===== COMP NODE =====

export interface CompLayerData {
  imageUrl?: string;
  // Transform properties (can be overridden by connected Transform node)
  scale: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  opacity: number;  // 0-100 for layer opacity
}

export interface CompNodeData extends BaseNodeData {
  name: string;
  outputWidth: number;
  outputHeight: number;
  backgroundColor: string;
  // Layers from back to front: back -> mid -> fore -> ext
  layers: {
    back: CompLayerData;
    mid: CompLayerData;
    fore: CompLayerData;
    ext: CompLayerData;
  };
  composedImageUrl?: string;  // The final composed result
}

// ===== TRANSFORM NODE =====

export type ImageAlignment =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface TransformNodeData extends BaseNodeData {
  name: string;
  scale: number;         // 0.1 to 3.0 (1 = 100%)
  offsetX: number;       // -100 to 100 (percentage)
  offsetY: number;       // -100 to 100 (percentage)
  rotation: number;      // 0 to 360 degrees
  flipH: boolean;        // Flip horizontal
  flipV: boolean;        // Flip vertical
  alignment: ImageAlignment;
  opacity: number;       // 0 to 100 (percentage)
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
  | 'camera'
  | 'action'
  | 'negative'
  | 'parameters'
  | 'timeperiod'
  | 'edit'
  | 'reference'
  | 'output'
  | 'page'
  | 'transform'
  | 'comp'
  | 'timeline';

export type AppNodeData =
  | CharacterNodeData
  | SettingNodeData
  | PropNodeData
  | StyleNodeData
  | ExtrasNodeData
  | ShotNodeData
  | OutfitNodeData
  | CameraNodeData
  | ActionNodeData
  | NegativeNodeData
  | ParametersNodeData
  | TimePeriodNodeData
  | EditNodeData
  | ReferenceNodeData
  | OutputNodeData
  | PageNodeData
  | TransformNodeData
  | CompNodeData
  | TimelineNodeData;

// Use BuiltInNode pattern for React Flow compatibility
export type CharacterNode = Node<CharacterNodeData, 'character'>;
export type SettingNode = Node<SettingNodeData, 'setting'>;
export type PropNode = Node<PropNodeData, 'prop'>;
export type StyleNode = Node<StyleNodeData, 'style'>;
export type ExtrasNode = Node<ExtrasNodeData, 'extras'>;
export type ShotNode = Node<ShotNodeData, 'shot'>;
export type OutfitNode = Node<OutfitNodeData, 'outfit'>;
export type CameraNode = Node<CameraNodeData, 'camera'>;
export type ActionNode = Node<ActionNodeData, 'action'>;
export type NegativeNode = Node<NegativeNodeData, 'negative'>;
export type ParametersNode = Node<ParametersNodeData, 'parameters'>;
export type TimePeriodNode = Node<TimePeriodNodeData, 'timeperiod'>;
export type EditNode = Node<EditNodeData, 'edit'>;
export type ReferenceNode = Node<ReferenceNodeData, 'reference'>;
export type OutputNode = Node<OutputNodeData, 'output'>;
export type PageNode = Node<PageNodeData, 'page'>;
export type TransformNode = Node<TransformNodeData, 'transform'>;
export type CompNode = Node<CompNodeData, 'comp'>;
export type TimelineNode = Node<TimelineNodeData, 'timeline'>;

export type AppNode =
  | CharacterNode
  | SettingNode
  | PropNode
  | StyleNode
  | ExtrasNode
  | ShotNode
  | OutfitNode
  | CameraNode
  | ActionNode
  | NegativeNode
  | ParametersNode
  | TimePeriodNode
  | EditNode
  | ReferenceNode
  | OutputNode
  | PageNode
  | TransformNode
  | CompNode
  | TimelineNode;

// ===== NODE COLORS =====

export const NODE_COLORS: Record<NodeType, string> = {
  character: '#3b82f6',
  setting: '#10b981',
  prop: '#f59e0b',
  style: '#d946ef',  // Fuchsia - distinct from Reference violet
  extras: '#64748b',
  shot: '#ec4899',
  outfit: '#06b6d4',
  camera: '#6366f1',    // Indigo for camera
  action: '#f97316',
  negative: '#f43f5e',
  parameters: '#14b8a6',
  timeperiod: '#eab308', // Yellow/gold for time period
  edit: '#6b7280',
  reference: '#8b5cf6',
  output: '#ef4444',
  page: '#0ea5e9',      // Sky blue for page layout
  transform: '#f472b6', // Pink for transform
  comp: '#22c55e',      // Green for composition
  timeline: '#a855f7',  // Purple for timeline/animation
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
  camera: 'Camera',
  action: 'Action',
  negative: 'Negative',
  parameters: 'Parameters',
  timeperiod: 'Time Period',
  edit: 'Edit',
  reference: 'Reference',
  output: 'Output',
  page: 'Page',
  transform: 'Transform',
  comp: 'Comp',
  timeline: 'Timeline',
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
