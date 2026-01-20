import { fal } from '@fal-ai/client';
import type { Provider, GenerationRequest, GenerationResponse } from '../types';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ModelType } from '@/types/nodes';

// fal.ai model endpoints
const MODEL_ENDPOINTS: Record<string, string> = {
  'flux-schnell': 'fal-ai/flux/schnell',
  'flux-dev': 'fal-ai/flux/dev',
  'turbo': 'fal-ai/fast-turbo-diffusion',
  'sdxl-turbo': 'fal-ai/fast-sdxl',
};

export const falProvider: Provider = {
  name: 'fal',

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const apiKey = useSettingsStore.getState().apiKeys.fal;

    if (!apiKey) {
      throw new Error('fal.ai API key not configured');
    }

    const endpoint = MODEL_ENDPOINTS[request.model];
    if (!endpoint) {
      throw new Error(`Unsupported fal.ai model: ${request.model}`);
    }

    // Configure the client with the API key
    fal.config({
      credentials: apiKey,
    });

    const { width, height } = getDimensions(request.aspectRatio);

    // Use the SDK's subscribe method which handles polling properly
    const result = await fal.subscribe(endpoint, {
      input: {
        prompt: request.prompt,
        negative_prompt: request.negativePrompt || '',
        image_size: { width, height },
        seed: request.seed,
        num_images: request.numberOfImages || 1,
        enable_safety_checker: false,
      },
    });

    const data = result.data as {
      images?: Array<{ url: string }>;
      seed?: number;
    };

    if (!data.images || data.images.length === 0) {
      throw new Error('No images returned from fal.ai');
    }

    return {
      imageUrl: data.images[0].url,
      images: data.images.map((img) => ({ imageUrl: img.url, seed: data.seed })),
      seed: data.seed,
    };
  },

  isConfigured(): boolean {
    const apiKey = useSettingsStore.getState().apiKeys.fal;
    return !!apiKey && apiKey.length > 0;
  },
};

function getDimensions(aspectRatio: string): { width: number; height: number } {
  switch (aspectRatio) {
    case '16:9':
      return { width: 1344, height: 768 };
    case '9:16':
      return { width: 768, height: 1344 };
    case '2:3':
      return { width: 832, height: 1216 };
    case '3:2':
      return { width: 1216, height: 832 };
    case '1:1':
    default:
      return { width: 1024, height: 1024 };
  }
}

// Helper to check if a model uses fal.ai
export function isFalModel(model: ModelType): boolean {
  return model in MODEL_ENDPOINTS;
}
