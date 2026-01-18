import type { ModelType, AspectRatio } from '@/types/nodes';

export interface GenerationRequest {
  prompt: string;
  negativePrompt?: string;
  model: ModelType;
  aspectRatio: AspectRatio;
  seed?: number;
}

export interface GenerationResponse {
  imageUrl: string;
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
