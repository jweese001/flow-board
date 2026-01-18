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

    const { width, height } = getDimensions(request.aspectRatio);

    // Submit the request
    const submitResponse = await fetch(`https://queue.fal.run/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: request.prompt,
        negative_prompt: request.negativePrompt || '',
        image_size: { width, height },
        seed: request.seed,
        num_images: 1,
        enable_safety_checker: false,
      }),
    });

    if (!submitResponse.ok) {
      const error = await submitResponse.json().catch(() => ({}));
      throw new Error(error.detail || `fal.ai API error: ${submitResponse.status}`);
    }

    const submitData = await submitResponse.json();

    // If we got images directly (sync response)
    if (submitData.images && submitData.images.length > 0) {
      return {
        imageUrl: submitData.images[0].url,
        seed: submitData.seed,
      };
    }

    // Otherwise poll for result
    const requestId = submitData.request_id;
    if (!requestId) {
      throw new Error('No request ID returned from fal.ai');
    }

    const result = await pollForResult(endpoint, requestId, apiKey);

    return {
      imageUrl: result.images[0].url,
      seed: result.seed,
    };
  },

  isConfigured(): boolean {
    const apiKey = useSettingsStore.getState().apiKeys.fal;
    return !!apiKey && apiKey.length > 0;
  },
};

async function pollForResult(
  endpoint: string,
  requestId: string,
  apiKey: string,
  maxAttempts = 120
): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(
      `https://queue.fal.run/${endpoint}/requests/${requestId}/status`,
      {
        headers: {
          'Authorization': `Key ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to check status: ${response.status}`);
    }

    const status = await response.json();

    if (status.status === 'COMPLETED') {
      // Fetch the result
      const resultResponse = await fetch(
        `https://queue.fal.run/${endpoint}/requests/${requestId}`,
        {
          headers: {
            'Authorization': `Key ${apiKey}`,
          },
        }
      );

      if (!resultResponse.ok) {
        throw new Error(`Failed to fetch result: ${resultResponse.status}`);
      }

      return resultResponse.json();
    }

    if (status.status === 'FAILED') {
      throw new Error(status.error || 'Image generation failed');
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error('Image generation timed out');
}

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
