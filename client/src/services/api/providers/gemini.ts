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

    // Build the prompt with reference image context
    let fullPrompt = request.prompt;

    // Add reference image descriptions to prompt context
    if (request.referenceImages && request.referenceImages.length > 0) {
      const imageDescriptions = request.referenceImages
        .filter(img => img.description || img.name)
        .map((img, idx) => {
          const label = img.name || `Reference ${idx + 1}`;
          const desc = img.description ? `: ${img.description}` : '';
          const type = img.imageType ? ` (${img.imageType})` : '';
          return `${label}${type}${desc}`;
        });

      if (imageDescriptions.length > 0) {
        fullPrompt = `Reference images provided: ${imageDescriptions.join('; ')}. ${fullPrompt}`;
      }
    }

    if (request.negativePrompt) {
      fullPrompt += ` Avoid: ${request.negativePrompt}`;
    }

    // Build parts array with reference images first, then text prompt
    const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [];

    // Add reference images as inline_data parts
    if (request.referenceImages && request.referenceImages.length > 0) {
      for (const refImage of request.referenceImages) {
        if (refImage.imageUrl) {
          // Parse data URL to extract mime type and base64 data
          const match = refImage.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            const mimeType = match[1];
            const base64Data = match[2];
            parts.push({
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            });
          }
        }
      }
    }

    // Add the text prompt
    parts.push({ text: fullPrompt });

    const requestBody = {
      contents: [
        {
          parts,
        },
      ],
      generationConfig: {
        responseModalities: ['Text', 'Image'],
        ...(request.seed !== undefined && { seed: request.seed }),
        ...(request.temperature !== undefined && { temperature: request.temperature }),
        ...(request.numberOfImages !== undefined && request.numberOfImages > 1 && {
          candidateCount: request.numberOfImages
        }),
        // Image config for aspect ratio and resolution
        ...((request.aspectRatio || request.resolution) && {
          imageConfig: {
            ...(request.aspectRatio && { aspectRatio: request.aspectRatio }),
            ...(request.resolution && { imageSize: request.resolution }),
          },
        }),
      },
    };

    console.log('Gemini request:', { modelId, requestBody });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      try {
        const error = JSON.parse(errorText);
        throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
      } catch {
        throw new Error(`Gemini API error (${response.status}): ${errorText.slice(0, 200)}`);
      }
    }

    const data = await response.json();

    // Extract images from all candidates
    const candidates = data.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No response from Gemini');
    }

    // Collect all images from all candidates
    const images: Array<{ imageUrl: string }> = [];
    let textResponse: string | undefined;

    for (const candidate of candidates) {
      const responseParts = candidate.content?.parts;
      if (!responseParts) continue;

      for (const part of responseParts) {
        if (part.inlineData) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          const imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
          images.push({ imageUrl });
        } else if (part.text && !textResponse) {
          textResponse = part.text;
        }
      }
    }

    if (images.length === 0) {
      // No images found - check if there's text explaining why
      if (textResponse) {
        throw new Error(`Gemini response: ${textResponse}`);
      }
      throw new Error('No image in Gemini response');
    }

    return {
      imageUrl: images[0].imageUrl,
      images,
      revisedPrompt: request.prompt,
    };
  },

  isConfigured(): boolean {
    const apiKey = useSettingsStore.getState().apiKeys.gemini;
    return !!apiKey && apiKey.length > 0;
  },
};
