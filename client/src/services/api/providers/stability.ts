import type { Provider, GenerationRequest, GenerationResponse } from '../types';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ModelType } from '@/types/nodes';

// Stability AI model configurations
const MODEL_CONFIG: Record<string, { endpoint: string; model?: string }> = {
  'sd3-large': {
    endpoint: 'https://api.stability.ai/v2beta/stable-image/generate/sd3',
    model: 'sd3-large',
  },
  'sd3-large-turbo': {
    endpoint: 'https://api.stability.ai/v2beta/stable-image/generate/sd3',
    model: 'sd3-large-turbo',
  },
  'sd3-medium': {
    endpoint: 'https://api.stability.ai/v2beta/stable-image/generate/sd3',
    model: 'sd3-medium',
  },
  'sdxl-1.0': {
    endpoint: 'https://api.stability.ai/v2beta/stable-image/generate/core',
  },
};

export const stabilityProvider: Provider = {
  name: 'stability',

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const apiKey = useSettingsStore.getState().apiKeys.stability;

    if (!apiKey) {
      throw new Error('Stability AI API key not configured');
    }

    const config = MODEL_CONFIG[request.model];
    if (!config) {
      throw new Error(`Unsupported Stability AI model: ${request.model}`);
    }

    const aspectRatio = mapAspectRatio(request.aspectRatio);

    // Build form data (Stability API uses multipart/form-data)
    const formData = new FormData();
    formData.append('prompt', request.prompt);
    formData.append('output_format', 'png');
    formData.append('aspect_ratio', aspectRatio);

    if (config.model) {
      formData.append('model', config.model);
    }

    if (request.negativePrompt) {
      formData.append('negative_prompt', request.negativePrompt);
    }

    if (request.seed !== undefined) {
      formData.append('seed', request.seed.toString());
    }

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'image/*',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Stability AI API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.errors?.[0] || errorMessage;
      } catch {
        if (errorText) {
          errorMessage = errorText;
        }
      }
      throw new Error(errorMessage);
    }

    // Response is the image directly
    const imageBlob = await response.blob();
    const imageUrl = await blobToDataUrl(imageBlob);

    // Extract seed from response headers if available
    const seedHeader = response.headers.get('x-seed');
    const seed = seedHeader ? parseInt(seedHeader, 10) : undefined;

    return {
      imageUrl,
      images: [{ imageUrl, seed }],
      seed,
    };
  },

  isConfigured(): boolean {
    const apiKey = useSettingsStore.getState().apiKeys.stability;
    return !!apiKey && apiKey.length > 0;
  },
};

function mapAspectRatio(aspectRatio: string): string {
  // Stability AI supports: 16:9, 1:1, 21:9, 2:3, 3:2, 4:5, 5:4, 9:16, 9:21
  switch (aspectRatio) {
    case '16:9':
      return '16:9';
    case '9:16':
      return '9:16';
    case '2:3':
      return '2:3';
    case '3:2':
      return '3:2';
    case '1:1':
    default:
      return '1:1';
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Helper to check if a model uses Stability AI
export function isStabilityModel(model: ModelType): boolean {
  return model in MODEL_CONFIG;
}
