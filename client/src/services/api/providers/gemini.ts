import type { Provider, GenerationRequest, GenerationResponse } from '../types';
import { useSettingsStore } from '@/stores/settingsStore';

// Gemini model endpoints for image generation
const GEMINI_MODELS: Record<string, string> = {
  'gemini-pro': 'gemini-3-pro-image-preview',
  'gemini-flash': 'gemini-2.5-flash-image',
};

export const geminiProvider: Provider = {
  name: 'gemini',

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const apiKey = useSettingsStore.getState().apiKeys.gemini;

    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const modelId = GEMINI_MODELS[request.model] || 'gemini-2.0-flash-exp-image-generation';

    // Build the prompt
    let fullPrompt = request.prompt;
    if (request.negativePrompt) {
      fullPrompt += ` Avoid: ${request.negativePrompt}`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: fullPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error?.message || `Gemini API error: ${response.status}`
      );
    }

    const data = await response.json();

    // Extract image from response
    const candidates = data.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No response from Gemini');
    }

    const parts = candidates[0].content?.parts;
    if (!parts) {
      throw new Error('No content in Gemini response');
    }

    // Find the image part (inlineData with base64)
    for (const part of parts) {
      if (part.inlineData) {
        const mimeType = part.inlineData.mimeType || 'image/png';
        const imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
        return {
          imageUrl,
          revisedPrompt: request.prompt,
        };
      }
    }

    // Check if there's text explaining why no image
    for (const part of parts) {
      if (part.text) {
        throw new Error(`Gemini response: ${part.text}`);
      }
    }

    throw new Error('No image in Gemini response');
  },

  isConfigured(): boolean {
    const apiKey = useSettingsStore.getState().apiKeys.gemini;
    return !!apiKey && apiKey.length > 0;
  },
};
