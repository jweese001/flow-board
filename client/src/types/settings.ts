import type { ModelType, AspectRatio } from './nodes';

export interface APIKeys {
  gemini?: string;   // Google AI Studio API key
  fal?: string;      // fal.ai API key
}

export interface GenerationDefaults {
  model: ModelType;
  aspectRatio: AspectRatio;
}

export interface AppSettings {
  apiKeys: APIKeys;
  defaults: GenerationDefaults;
  autoSaveEnabled: boolean;
  autoSaveIntervalMs: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiKeys: {},
  defaults: {
    model: 'mock',
    aspectRatio: '1:1',
  },
  autoSaveEnabled: true,
  autoSaveIntervalMs: 30000, // 30 seconds
};
