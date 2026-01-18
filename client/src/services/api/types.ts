import type { ModelType, AspectRatio, ImageResolution, ReferenceImageType } from '@/types/nodes';

export interface ReferenceImageInput {
  imageUrl: string; // Base64 data URL
  imageType: ReferenceImageType;
  name?: string;
  description?: string;
}

export interface GenerationRequest {
  prompt: string;
  negativePrompt?: string;
  referenceImages?: ReferenceImageInput[];
  model: ModelType;
  aspectRatio: AspectRatio;
  resolution?: ImageResolution;
  seed?: number;
  temperature?: number;
  numberOfImages?: number;
}

export interface GeneratedImage {
  imageUrl: string;
  seed?: number;
}

export interface GenerationResponse {
  imageUrl: string; // Primary image (first in array)
  images: GeneratedImage[]; // All generated images
  revisedPrompt?: string;
  seed?: number;
}

export interface GenerationError {
  message: string;
  code?: string;
}

export interface Provider {
  name: string;
  generate(request: GenerationRequest): Promise<GenerationResponse>;
  isConfigured(): boolean;
}

export type GenerationResult =
  | { success: true; data: GenerationResponse }
  | { success: false; error: GenerationError };
