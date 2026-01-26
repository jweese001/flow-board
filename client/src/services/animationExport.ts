import JSZip from 'jszip';
import GIF from 'gif.js';
import { useFlowStore } from '@/stores/flowStore';
import { interpolateTransforms } from '@/engine/animation';
import type { Keyframe, EasingType, TransformNodeData } from '@/types/nodes';

type RenderNodeType = 'page' | 'comp';

interface ExportOptions {
  timelineId: string;
  renderNodeId: string;
  renderNodeType: RenderNodeType;
  fps: number;
  duration: number;
  tracks: Record<string, Keyframe[]>;
  easing: EasingType;
  format: 'sequence' | 'gif';
  onProgress?: (progress: number, message: string) => void;
}

interface FrameData {
  frameNumber: number;
  time: number;
  dataUrl: string;
}

// Layer order for CompNode (back to front)
const LAYER_ORDER = ['back', 'mid', 'fore', 'ext'] as const;

// Cache for loaded images (prevents re-decoding which can cause variations)
const imageCache = new Map<string, HTMLImageElement>();

// Cache for pre-rendered layers at base size (prevents scaling variations)
const preRenderedCache = new Map<string, { canvas: HTMLCanvasElement; width: number; height: number }>();

// Load an image with caching
async function loadImageCached(url: string): Promise<HTMLImageElement> {
  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });

  imageCache.set(url, img);
  return img;
}

// Pre-render an image to a canvas at specified size (done ONCE per layer)
async function getPreRenderedImage(
  url: string,
  targetWidth: number,
  targetHeight: number
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  const cacheKey = `${url}:${targetWidth}x${targetHeight}`;

  if (preRenderedCache.has(cacheKey)) {
    return preRenderedCache.get(cacheKey)!;
  }

  const img = await loadImageCached(url);

  // Create intermediate canvas and render image ONCE at target size
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('Failed to create pre-render context');

  // High quality render ONCE
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const result = { canvas, width: targetWidth, height: targetHeight };
  preRenderedCache.set(cacheKey, result);
  return result;
}

// Clear image cache (call before starting export)
function clearImageCache() {
  imageCache.clear();
  preRenderedCache.clear();
}

// Pre-computed transform values for a frame
type TransformOverrides = Record<string, {
  scale: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  opacity: number;
}>;

// Supersampling factor - render at higher resolution to reduce scaling artifacts
const SUPERSAMPLE = 2;

// Persistent render context for consistent rendering across frames
interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  outputCanvas: HTMLCanvasElement;
  outputCtx: CanvasRenderingContext2D;
  width: number;
  height: number;
  backgroundColor: string;
}

// Create a persistent render context (call once per export)
function createRenderContext(nodeId: string): RenderContext | null {
  const { nodes } = useFlowStore.getState();
  const compNode = nodes.find((n) => n.id === nodeId);
  if (!compNode) return null;

  const compData = compNode.data as {
    outputWidth?: number;
    outputHeight?: number;
    backgroundColor?: string;
  };

  const width = compData.outputWidth || 1920;
  const height = compData.outputHeight || 1080;
  const backgroundColor = compData.backgroundColor || '#000000';

  // Create HIGH-RES canvas for rendering (2x supersampling)
  const canvas = document.createElement('canvas');
  canvas.width = width * SUPERSAMPLE;
  canvas.height = height * SUPERSAMPLE;

  const ctx = canvas.getContext('2d', {
    alpha: false,
    willReadFrequently: true
  });
  if (!ctx) return null;

  // Use high-quality smoothing for the supersampled render
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Create OUTPUT canvas at final resolution
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;

  const outputCtx = outputCanvas.getContext('2d', {
    alpha: false,
    willReadFrequently: true
  });
  if (!outputCtx) return null;

  // Use high-quality downsampling
  outputCtx.imageSmoothingEnabled = true;
  outputCtx.imageSmoothingQuality = 'high';

  return { canvas, ctx, outputCanvas, outputCtx, width, height, backgroundColor };
}

// Render a frame directly from flow state (bypasses React render cycle)
async function renderFrameDirectly(
  nodeId: string,
  _nodeType: RenderNodeType,
  transformOverrides?: TransformOverrides,
  renderCtx?: RenderContext
): Promise<string | null> {
  const { nodes, edges } = useFlowStore.getState();

  // Use provided context or create new one (for backwards compatibility)
  let ctx: CanvasRenderingContext2D;
  let canvas: HTMLCanvasElement;
  let outputCanvas: HTMLCanvasElement;
  let outputCtx: CanvasRenderingContext2D;
  let width: number;
  let height: number;
  let backgroundColor: string;
  let ssWidth: number;
  let ssHeight: number;

  if (renderCtx) {
    ctx = renderCtx.ctx;
    canvas = renderCtx.canvas;
    outputCanvas = renderCtx.outputCanvas;
    outputCtx = renderCtx.outputCtx;
    width = renderCtx.width;
    height = renderCtx.height;
    ssWidth = width * SUPERSAMPLE;
    ssHeight = height * SUPERSAMPLE;
    backgroundColor = renderCtx.backgroundColor;
  } else {
    const compNode = nodes.find((n) => n.id === nodeId);
    if (!compNode) return null;
    const compData = compNode.data as {
      outputWidth?: number;
      outputHeight?: number;
      backgroundColor?: string;
    };
    width = compData.outputWidth || 1920;
    height = compData.outputHeight || 1080;
    ssWidth = width;
    ssHeight = height;
    backgroundColor = compData.backgroundColor || '#000000';
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const newCtx = canvas.getContext('2d');
    if (!newCtx) return null;
    ctx = newCtx;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    outputCanvas = canvas;
    outputCtx = ctx;
  }

  // Clear and fill background (at supersampled resolution)
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, ssWidth, ssHeight);

  // Helper to get image URL and transform node ID from a source
  const getLayerInfo = (sourceId: string): { imageUrl: string | null; transformId: string | null } => {
    const node = nodes.find((n) => n.id === sourceId);
    if (!node) return { imageUrl: null, transformId: null };

    if (node.type === 'output') {
      return {
        imageUrl: (node.data as { generatedImageUrl?: string }).generatedImageUrl || null,
        transformId: null
      };
    }
    if (node.type === 'reference') {
      return {
        imageUrl: (node.data as { imageUrl?: string }).imageUrl || null,
        transformId: null
      };
    }
    if (node.type === 'transform') {
      // Find upstream image
      const upstreamEdge = edges.find((e) => e.target === sourceId && e.targetHandle !== 'timeline-in');
      const upstream = upstreamEdge ? getLayerInfo(upstreamEdge.source) : { imageUrl: null, transformId: null };
      return {
        imageUrl: upstream.imageUrl,
        transformId: sourceId, // This transform controls the image
      };
    }
    return { imageUrl: null, transformId: null };
  };

  // Get layers connected to this comp node
  type LayerInfo = { imageUrl: string | null; transformId: string | null };
  const layers: Record<string, LayerInfo> = {};

  for (const edge of edges) {
    if (edge.target === nodeId && edge.targetHandle) {
      layers[edge.targetHandle] = getLayerInfo(edge.source);
    }
  }

  // Draw layers in order (back to front)
  for (const layerName of LAYER_ORDER) {
    const layer = layers[layerName];
    if (!layer?.imageUrl) continue;

    try {
      // Load original image to get dimensions
      const img = await loadImageCached(layer.imageUrl);

      ctx.save();

      // Get transform - prefer override (pre-computed), fall back to node data
      let scale = 1, offsetX = 0, offsetY = 0, rotation = 0, opacity = 100;

      if (layer.transformId) {
        // Use pre-computed override if available (more deterministic)
        const override = transformOverrides?.[layer.transformId];
        if (override) {
          scale = override.scale;
          offsetX = override.offsetX;
          offsetY = override.offsetY;
          rotation = override.rotation;
          opacity = override.opacity;
        } else {
          // Fall back to node data
          const transformNode = nodes.find((n) => n.id === layer.transformId);
          if (transformNode) {
            const tData = transformNode.data as TransformNodeData;
            scale = tData.scale ?? 1;
            offsetX = tData.offsetX ?? 0;
            offsetY = tData.offsetY ?? 0;
            rotation = tData.rotation ?? 0;
            opacity = tData.opacity ?? 100;
          }
        }
      }

      ctx.globalAlpha = opacity / 100;

      // Calculate BASE dimensions at SUPERSAMPLED resolution
      const imgRatio = img.width / img.height;
      const canvasRatio = ssWidth / ssHeight;
      let baseW: number, baseH: number;

      if (imgRatio > canvasRatio) {
        baseW = ssWidth;
        baseH = ssWidth / imgRatio;
      } else {
        baseH = ssHeight;
        baseW = ssHeight * imgRatio;
      }

      // Round base dimensions to integers
      baseW = Math.round(baseW);
      baseH = Math.round(baseH);

      // Get PRE-RENDERED image at supersampled base size
      const preRendered = await getPreRenderedImage(layer.imageUrl, baseW, baseH);

      // Calculate center position with offset (at supersampled resolution)
      const centerX = ssWidth / 2 - (offsetX / 100) * ssWidth;
      const centerY = ssHeight / 2 - (offsetY / 100) * ssHeight;

      // Use canvas transform for animation scaling
      ctx.translate(centerX, centerY);

      // Apply rotation
      if (rotation !== 0) {
        ctx.rotate((rotation * Math.PI) / 180);
      }

      // Apply scale transform
      ctx.scale(scale, scale);

      // Draw PRE-RENDERED canvas at 1:1
      ctx.drawImage(preRendered.canvas, -baseW / 2, -baseH / 2);
      ctx.restore();
    } catch (e) {
      console.error(`Failed to load image for layer ${layerName}`, e);
    }
  }

  // Downsample from supersampled canvas to output canvas
  if (renderCtx && outputCanvas !== canvas) {
    outputCtx.drawImage(canvas, 0, 0, width, height);
    return outputCanvas.toDataURL('image/png');
  }

  return canvas.toDataURL('image/png');
}


// Capture all frames of the animation
async function captureFrames(options: ExportOptions): Promise<FrameData[]> {
  const { fps, duration, tracks, easing, renderNodeId, renderNodeType, onProgress } = options;
  const totalFrames = Math.ceil(fps * duration);
  const frames: FrameData[] = [];

  // Create persistent render context (reused for all frames)
  const renderCtx = createRenderContext(renderNodeId);
  if (!renderCtx) {
    throw new Error('Failed to create render context');
  }

  // Store original transform values to restore later
  const originalTransforms: Record<string, Partial<TransformNodeData>> = {};
  const nodes = useFlowStore.getState().nodes;

  for (const transformId of Object.keys(tracks)) {
    const node = nodes.find((n) => n.id === transformId);
    if (node && node.type === 'transform') {
      const data = node.data as TransformNodeData;
      originalTransforms[transformId] = {
        scale: data.scale,
        offsetX: data.offsetX,
        offsetY: data.offsetY,
        rotation: data.rotation,
        opacity: data.opacity,
      };
    }
  }

  try {
    for (let frame = 0; frame <= totalFrames; frame++) {
      const time = (frame / fps);
      const progress = (frame / totalFrames) * 100;

      onProgress?.(progress, `Capturing frame ${frame + 1} of ${totalFrames + 1}`);

      // Compute transforms directly (no store updates - more deterministic)
      const transformOverrides: TransformOverrides = {};
      for (const [transformId, keyframes] of Object.entries(tracks)) {
        if (keyframes.length > 0) {
          const transforms = interpolateTransforms(keyframes, time, easing);
          transformOverrides[transformId] = {
            scale: transforms.scale,
            offsetX: transforms.offsetX,
            offsetY: transforms.offsetY,
            rotation: transforms.rotation,
            opacity: transforms.opacity,
          };
        }
      }

      // Render frame with pre-computed transforms using persistent context
      const dataUrl = await renderFrameDirectly(renderNodeId, renderNodeType, transformOverrides, renderCtx);
      if (dataUrl) {
        frames.push({
          frameNumber: frame,
          time,
          dataUrl,
        });
      }
    }
  } finally {
    // Restore original transforms
    const updateNodeData = useFlowStore.getState().updateNodeData;
    for (const [transformId, data] of Object.entries(originalTransforms)) {
      updateNodeData(transformId, data);
    }
  }

  return frames;
}

// Export as PNG sequence in a ZIP file
async function exportAsSequence(
  frames: FrameData[],
  onProgress?: (progress: number, message: string) => void
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('frames');

  if (!folder) {
    throw new Error('Failed to create ZIP folder');
  }

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const progress = 50 + (i / frames.length) * 40;
    onProgress?.(progress, `Packaging frame ${i + 1} of ${frames.length}`);

    // Convert data URL to blob
    const base64 = frame.dataUrl.split(',')[1];
    const paddedNumber = String(frame.frameNumber).padStart(5, '0');
    folder.file(`frame_${paddedNumber}.png`, base64, { base64: true });
  }

  onProgress?.(95, 'Generating ZIP file...');

  const blob = await zip.generateAsync({ type: 'blob' });

  // Download the ZIP
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `animation_${Date.now()}.zip`;
  link.click();
  URL.revokeObjectURL(link.href);

  onProgress?.(100, 'Export complete!');
}

// Export as animated GIF
async function exportAsGif(
  frames: FrameData[],
  fps: number,
  onProgress?: (progress: number, message: string) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Get dimensions from first frame by loading it
    const firstImg = new Image();

    firstImg.onload = async () => {
      const width = firstImg.width;
      const height = firstImg.height;

      console.log(`Creating GIF: ${width}x${height}, ${frames.length} frames at ${fps}fps`);

      // Create a canvas for drawing frames (more reliable than Image elements)
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Use single-threaded mode (workers: 0) to avoid worker loading issues
      const gif = new GIF({
        workers: 0,
        quality: 10,
        width,
        height,
      });

      const delay = Math.round(1000 / fps);

      // Add timeout in case GIF render hangs (120s for single-threaded mode)
      const timeout = setTimeout(() => {
        console.error('GIF render timed out after 120 seconds');
        gif.abort();
        reject(new Error('GIF encoding timed out. Try reducing duration or FPS.'));
      }, 120000);

      // Add each frame using canvas
      console.log(`Adding ${frames.length} frames to GIF...`);
      for (let i = 0; i < frames.length; i++) {
        const progress = 50 + (i / frames.length) * 30;
        onProgress?.(progress, `Encoding frame ${i + 1} of ${frames.length}`);

        // Load frame image
        const frameImg = new Image();
        await new Promise<void>((res, rej) => {
          frameImg.onload = () => res();
          frameImg.onerror = () => rej(new Error(`Failed to load frame ${i}`));
          frameImg.src = frames[i].dataUrl;
        });

        // Draw to canvas and add frame
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(frameImg, 0, 0);

        // Add canvas as frame (copy: true creates a snapshot)
        gif.addFrame(ctx, { copy: true, delay });
        console.log(`Added frame ${i + 1}/${frames.length}`);
      }
      console.log('All frames added, calling render()...');

      gif.on('progress', (p: number) => {
        const progress = 80 + p * 20;
        onProgress?.(progress, 'Finalizing GIF...');
      });

      gif.on('finished', (blob: Blob) => {
        clearTimeout(timeout);
        console.log('GIF finished, size:', blob.size);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `animation_${Date.now()}.gif`;
        link.click();
        URL.revokeObjectURL(link.href);

        onProgress?.(100, 'Export complete!');
        resolve();
      });

      console.log('Starting GIF render...');
      gif.render();
    };

    firstImg.onerror = () => reject(new Error('Failed to load first frame'));
    firstImg.src = frames[0].dataUrl;
  });
}

// Main export function
export async function exportAnimation(options: ExportOptions): Promise<void> {
  const { format, fps, onProgress } = options;

  // Clear image cache to ensure fresh load, then images stay consistent
  clearImageCache();

  try {
    onProgress?.(0, 'Starting export...');

    // Capture all frames
    const frames = await captureFrames(options);

    if (frames.length === 0) {
      throw new Error('No frames captured. Make sure a Comp or Page node is connected.');
    }

    onProgress?.(50, `Captured ${frames.length} frames`);

    // Export in requested format
    if (format === 'sequence') {
      await exportAsSequence(frames, onProgress);
    } else {
      await exportAsGif(frames, fps, onProgress);
    }
  } catch (error) {
    console.error('Animation export failed:', error);
    throw error;
  }
}

// Find connected render node (CompNode or PageNode) from Timeline
export function findConnectedRenderNode(timelineId: string): { id: string; type: RenderNodeType } | null {
  const { nodes, edges } = useFlowStore.getState();

  // Timeline -> Transform -> ... -> CompNode/PageNode
  // We need to traverse the graph to find a render node that receives from transforms
  // controlled by this timeline

  // First, find transforms connected to this timeline
  const timelineOutEdges = edges.filter(
    (e) => e.source === timelineId && e.sourceHandle === 'timeline-out'
  );

  const connectedTransformIds = new Set<string>();
  for (const edge of timelineOutEdges) {
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (targetNode?.type === 'transform') {
      connectedTransformIds.add(edge.target);
    }
  }

  // Helper to check if a node is connected to our transforms
  const isConnectedToTransforms = (nodeId: string): boolean => {
    const inputEdges = edges.filter((e) => e.target === nodeId);
    for (const edge of inputEdges) {
      if (connectedTransformIds.has(edge.source)) {
        return true;
      }
      // Check if source is one of our transforms
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (sourceNode?.type === 'transform' && connectedTransformIds.has(sourceNode.id)) {
        return true;
      }
    }
    return false;
  };

  // First, look for CompNodes (preferred)
  for (const node of nodes) {
    if (node.type === 'comp' && isConnectedToTransforms(node.id)) {
      return { id: node.id, type: 'comp' };
    }
  }

  // Then look for PageNodes
  for (const node of nodes) {
    if (node.type === 'page' && isConnectedToTransforms(node.id)) {
      return { id: node.id, type: 'page' };
    }
  }

  // Fallback: find any CompNode first, then PageNode
  const compNode = nodes.find((n) => n.type === 'comp');
  if (compNode) {
    return { id: compNode.id, type: 'comp' };
  }

  const pageNode = nodes.find((n) => n.type === 'page');
  if (pageNode) {
    return { id: pageNode.id, type: 'page' };
  }

  return null;
}
