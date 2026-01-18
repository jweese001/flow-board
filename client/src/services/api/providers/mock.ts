import type { Provider, GenerationRequest, GenerationResponse } from '../types';

export const mockProvider: Provider = {
  name: 'mock',

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

    // Generate a placeholder image URL based on aspect ratio
    const dimensions = getImageDimensions(request.aspectRatio);
    const seed = request.seed || Math.floor(Math.random() * 10000);

    // Use picsum.photos for random placeholder images
    const imageUrl = `https://picsum.photos/seed/${seed}/${dimensions.width}/${dimensions.height}`;

    return {
      imageUrl,
      revisedPrompt: request.prompt,
      seed,
    };
  },

  isConfigured(): boolean {
    return true; // Mock is always available
  },
};

function getImageDimensions(aspectRatio: string): { width: number; height: number } {
  switch (aspectRatio) {
    case '16:9':
      return { width: 1024, height: 576 };
    case '9:16':
      return { width: 576, height: 1024 };
    case '2:3':
      return { width: 683, height: 1024 };
    case '3:2':
      return { width: 1024, height: 683 };
    case '1:1':
    default:
      return { width: 1024, height: 1024 };
  }
}
