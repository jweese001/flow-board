import type {
  GenerationRequest,
  GenerationResult,
  Provider,
} from './types';
import { mockProvider } from './providers/mock';
import { geminiProvider } from './providers/gemini';
import { falProvider } from './providers/fal';
import { stabilityProvider } from './providers/stability';

const providers: Record<string, Provider> = {
  mock: mockProvider,
  'gemini-pro': geminiProvider,
  'gemini-flash': geminiProvider,
  'flux-schnell': falProvider,
  'flux-dev': falProvider,
  'turbo': falProvider,
  'sdxl-turbo': falProvider,
  'sd3-large': stabilityProvider,
  'sd3-large-turbo': stabilityProvider,
  'sd3-medium': stabilityProvider,
  'sdxl-1.0': stabilityProvider,
};

export async function generateImage(request: GenerationRequest): Promise<GenerationResult> {
  const provider = providers[request.model];

  if (!provider) {
    return {
      success: false,
      error: { message: `Unknown model: ${request.model}` },
    };
  }

  if (!provider.isConfigured()) {
    const keyNames: Record<string, string> = {
      gemini: 'Gemini',
      fal: 'fal.ai',
      stability: 'Stability AI',
    };
    const keyName = keyNames[provider.name] || provider.name;
    return {
      success: false,
      error: { message: `${keyName} API key not configured. Add it in Settings.` },
    };
  }

  try {
    const response = await provider.generate(request);
    return { success: true, data: response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image generation failed';
    return {
      success: false,
      error: { message },
    };
  }
}

export function isProviderConfigured(model: string): boolean {
  const provider = providers[model];
  return provider?.isConfigured() ?? false;
}

export type { GenerationRequest, GenerationResult, GenerationResponse } from './types';
