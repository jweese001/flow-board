import type { Provider, GenerationRequest, GenerationResponse, GeneratedImage } from '../types';

export const mockProvider: Provider = {
  name: 'mock',

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

    // Generate a placeholder image URL based on aspect ratio
    const dimensions = getImageDimensions(request.aspectRatio);
    const baseSeed = request.seed || Math.floor(Math.random() * 10000);
    const count = request.numberOfImages || 1;

    // Generate multiple images if requested
    const images: GeneratedImage[] = [];
    for (let i = 0; i < count; i++) {
      const seed = baseSeed + i;
      const imageUrl = `https://picsum.photos/seed/${seed}/${dimensions.width}/${dimensions.height}`;
      images.push({ imageUrl, seed });
    }

    return {
      imageUrl: images[0].imageUrl,
      images,
      revisedPrompt: request.prompt,
      seed: baseSeed,
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
