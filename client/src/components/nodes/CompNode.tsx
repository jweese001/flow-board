import { useCallback, useRef, useEffect } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { CompNode as CompNodeType, TransformNodeData, ImageAlignment } from '@/types/nodes';
import { NODE_COLORS } from '@/types/nodes';
import { BaseNode } from './BaseNode';
import { LayersIcon, DownloadIcon } from '../ui/Icons';
import { useFlowStore } from '@/stores/flowStore';

// Layer names in rendering order (bottom to top)
const LAYER_ORDER = ['back', 'mid', 'fore', 'ext'] as const;
type LayerName = typeof LAYER_ORDER[number];

// Layer display labels
const LAYER_LABELS: Record<LayerName, string> = {
  back: 'Back',
  mid: 'Mid',
  fore: 'Fore',
  ext: 'Ext',
};

// Layer handle positions (evenly spaced)
const LAYER_POSITIONS: Record<LayerName, number> = {
  back: 80,  // Bottom layer at bottom
  mid: 60,
  fore: 40,
  ext: 20,   // Top layer at top
};

// Layer data with transform
interface LayerData {
  imageUrl: string | null;
  transform?: {
    scale: number;
    offsetX: number;
    offsetY: number;
    rotation: number;
    flipH: boolean;
    flipV: boolean;
    alignment: ImageAlignment;
    opacity: number;
  };
}

export function CompNode({ id, data, selected }: NodeProps<CompNodeType>) {
  const { nodes, edges, updateNodeData } = useFlowStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get image and transform data from a connected node
  const getImageFromNode = useCallback((nodeId: string): LayerData => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { imageUrl: null };

    if (node.type === 'output') {
      const outputData = node.data as { generatedImageUrl?: string };
      return { imageUrl: outputData.generatedImageUrl || null };
    }

    if (node.type === 'reference') {
      const refData = node.data as { imageUrl?: string };
      return { imageUrl: refData.imageUrl || null };
    }

    if (node.type === 'transform') {
      const transformData = node.data as TransformNodeData;
      // Find what's connected to this transform's main input (not timeline-in)
      const upstreamEdge = edges.find((e) => e.target === nodeId && e.targetHandle !== 'timeline-in');
      if (upstreamEdge) {
        const upstream = getImageFromNode(upstreamEdge.source);
        return {
          imageUrl: upstream.imageUrl,
          transform: {
            scale: transformData.scale ?? 1,
            offsetX: transformData.offsetX ?? 0,
            offsetY: transformData.offsetY ?? 0,
            rotation: transformData.rotation ?? 0,
            flipH: transformData.flipH ?? false,
            flipV: transformData.flipV ?? false,
            alignment: transformData.alignment ?? 'center',
            opacity: transformData.opacity ?? 100,
          },
        };
      }
      return { imageUrl: null };
    }

    if (node.type === 'timeline') {
      const timelineData = node.data as {
        currentTransforms?: {
          scale: number;
          offsetX: number;
          offsetY: number;
          rotation: number;
          opacity: number;
        };
      };
      // Find what's connected to this timeline's input
      const upstreamEdge = edges.find((e) => e.target === nodeId);
      if (upstreamEdge) {
        const upstream = getImageFromNode(upstreamEdge.source);
        const t = timelineData.currentTransforms;
        return {
          imageUrl: upstream.imageUrl,
          transform: t ? {
            scale: t.scale ?? 1,
            offsetX: t.offsetX ?? 0,
            offsetY: t.offsetY ?? 0,
            rotation: t.rotation ?? 0,
            flipH: false, // Timeline doesn't animate flip
            flipV: false,
            alignment: 'center' as const,
            opacity: t.opacity ?? 100,
          } : upstream.transform,
        };
      }
      return { imageUrl: null };
    }

    return { imageUrl: null };
  }, [nodes, edges]);

  // Get all connected layers
  const getConnectedLayers = useCallback(() => {
    const layers: Record<LayerName, LayerData> = {
      back: { imageUrl: null },
      mid: { imageUrl: null },
      fore: { imageUrl: null },
      ext: { imageUrl: null },
    };

    for (const edge of edges) {
      if (edge.target === id && edge.targetHandle) {
        const layerName = edge.targetHandle as LayerName;
        if (LAYER_ORDER.includes(layerName)) {
          layers[layerName] = getImageFromNode(edge.source);
        }
      }
    }

    return layers;
  }, [id, edges, getImageFromNode]);

  const layers = getConnectedLayers();

  // Check if any layers have images
  const hasImages = LAYER_ORDER.some((layer) => layers[layer].imageUrl);

  // Render composite to canvas
  const renderToCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const width = data.outputWidth || 1920;
    const height = data.outputHeight || 1080;
    canvas.width = width;
    canvas.height = height;

    // Clear and fill background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = data.backgroundColor || '#000000';
    ctx.fillRect(0, 0, width, height);

    // Draw layers in order (back to front)
    for (const layerName of LAYER_ORDER) {
      const layer = layers[layerName];
      if (!layer.imageUrl) continue;

      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = layer.imageUrl!;
        });

        ctx.save();

        const transform = layer.transform;
        const scale = transform?.scale ?? 1;
        const offsetX = transform?.offsetX ?? 0;
        const offsetY = transform?.offsetY ?? 0;
        const rotation = transform?.rotation ?? 0;
        const flipH = transform?.flipH ?? false;
        const flipV = transform?.flipV ?? false;
        const alignment = transform?.alignment ?? 'center';
        const opacity = transform?.opacity ?? 100;

        // Set opacity
        ctx.globalAlpha = opacity / 100;

        // Calculate image dimensions to maintain aspect ratio
        const imgRatio = img.width / img.height;
        const canvasRatio = width / height;

        let drawW: number;
        let drawH: number;

        // Use contain behavior (full image visible at scale 1)
        if (imgRatio > canvasRatio) {
          drawW = width;
          drawH = width / imgRatio;
        } else {
          drawH = height;
          drawW = height * imgRatio;
        }

        // Apply scale
        drawW *= scale;
        drawH *= scale;

        // Calculate anchor position based on alignment
        let anchorX = width / 2;
        let anchorY = height / 2;

        if (alignment.includes('left')) anchorX = 0;
        else if (alignment.includes('right')) anchorX = width;

        if (alignment.includes('top')) anchorY = 0;
        else if (alignment.includes('bottom')) anchorY = height;

        // Calculate image position
        let imgX = anchorX - drawW / 2;
        let imgY = anchorY - drawH / 2;

        if (alignment.includes('left')) imgX = anchorX;
        else if (alignment.includes('right')) imgX = anchorX - drawW;

        if (alignment.includes('top')) imgY = anchorY;
        else if (alignment.includes('bottom')) imgY = anchorY - drawH;

        // Apply offset as percentage of canvas
        imgX -= (offsetX / 100) * width;
        imgY -= (offsetY / 100) * height;

        // Apply rotation/flip around anchor
        ctx.translate(anchorX, anchorY);

        if (rotation !== 0) {
          ctx.rotate((rotation * Math.PI) / 180);
        }

        if (flipH || flipV) {
          ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        }

        ctx.translate(-anchorX, -anchorY);

        // Draw image
        ctx.drawImage(img, imgX, imgY, drawW, drawH);
        ctx.restore();
      } catch (e) {
        console.error(`Failed to load image for layer ${layerName}`, e);
      }
    }

    return canvas;
  }, [data.backgroundColor, data.outputWidth, data.outputHeight, layers]);

  // Build a stable key from layer image URLs AND transforms to detect actual changes
  const layerKey = LAYER_ORDER.map(name => {
    const layer = layers[name];
    const t = layer.transform;
    const transformKey = t
      ? `${t.scale}-${t.offsetX}-${t.offsetY}-${t.rotation}-${t.flipH}-${t.flipV}-${t.alignment}-${t.opacity}`
      : '';
    return `${layer.imageUrl || ''}:${transformKey}`;
  }).join('|');
  const prevLayerKeyRef = useRef<string>('');

  // Update composedImageUrl when layers actually change
  useEffect(() => {
    // Skip if layers haven't changed
    if (layerKey === prevLayerKeyRef.current) {
      return;
    }
    prevLayerKeyRef.current = layerKey;

    if (!hasImages) {
      updateNodeData(id, { composedImageUrl: undefined });
      return;
    }

    // Render immediately (layerKey check prevents unnecessary work)
    (async () => {
      const canvas = await renderToCanvas();
      if (canvas) {
        const composedUrl = canvas.toDataURL('image/png');
        updateNodeData(id, { composedImageUrl: composedUrl });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, layerKey, hasImages]);

  const handleDownload = async () => {
    const canvas = await renderToCanvas();
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `flowboard-comp-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Build CSS transform for preview layers
  const getPreviewLayerStyle = (layer: LayerData): React.CSSProperties => {
    const transform = layer.transform;
    if (!transform) {
      return {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        objectPosition: 'center center',
      };
    }

    const { scale, offsetX, offsetY, rotation, flipH, flipV, alignment, opacity } = transform;

    // Calculate object-position based on alignment
    let objectPosX = '50%';
    let objectPosY = '50%';

    if (alignment.includes('left')) objectPosX = '0%';
    else if (alignment.includes('right')) objectPosX = '100%';

    if (alignment.includes('top')) objectPosY = '0%';
    else if (alignment.includes('bottom')) objectPosY = '100%';

    // Calculate transform-origin to match alignment
    const transformOrigin = `${objectPosX} ${objectPosY}`;

    // Build transform string
    const transforms: string[] = [];

    // Apply offset as percentage translation
    if (offsetX !== 0 || offsetY !== 0) {
      transforms.push(`translate(${-offsetX}%, ${-offsetY}%)`);
    }

    if (scale !== 1) transforms.push(`scale(${scale})`);
    if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
    if (flipH || flipV) transforms.push(`scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`);

    return {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      objectPosition: `${objectPosX} ${objectPosY}`,
      transform: transforms.length > 0 ? transforms.join(' ') : undefined,
      transformOrigin,
      opacity: opacity / 100,
    };
  };

  // Layer input handles
  const layerHandles = LAYER_ORDER.map((layerName) => (
    <Handle
      key={layerName}
      type="target"
      position={Position.Left}
      id={layerName}
      style={{
        top: `${LAYER_POSITIONS[layerName]}%`,
        background: layers[layerName].imageUrl ? NODE_COLORS.comp : '#374151',
        borderColor: NODE_COLORS.comp,
        borderWidth: 2,
      }}
      title={`${LAYER_LABELS[layerName]} layer`}
    />
  ));

  return (
    <BaseNode
      nodeId={id}
      nodeType="comp"
      name={data.name || 'Composition'}
      selected={selected}
      showTargetHandle={false}
      showSourceHandle={true}
      icon={<LayersIcon size={14} />}
      additionalHandles={<>{layerHandles}</>}
    >
      {/* Layer Labels */}
      <div
        className="absolute text-[8px] font-mono text-muted"
        style={{ left: '-36px', top: '17%' }}
      >
        Ext
      </div>
      <div
        className="absolute text-[8px] font-mono text-muted"
        style={{ left: '-36px', top: '37%' }}
      >
        Fore
      </div>
      <div
        className="absolute text-[8px] font-mono text-muted"
        style={{ left: '-36px', top: '57%' }}
      >
        Mid
      </div>
      <div
        className="absolute text-[8px] font-mono text-muted"
        style={{ left: '-36px', top: '77%' }}
      >
        Back
      </div>

      {/* Composition Preview */}
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          width: '100%',
          aspectRatio: `${data.outputWidth || 1920} / ${data.outputHeight || 1080}`,
          background: data.backgroundColor || '#000000',
        }}
      >
        {/* Render layers from back to front */}
        {LAYER_ORDER.map((layerName) => {
          const layer = layers[layerName];
          if (!layer.imageUrl) return null;
          return (
            <img
              key={layerName}
              src={layer.imageUrl}
              alt={`${layerName} layer`}
              style={getPreviewLayerStyle(layer)}
            />
          );
        })}

        {/* Empty state */}
        {!hasImages && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
            Connect images to layers
          </div>
        )}
      </div>

      {/* Resolution indicator */}
      <div className="text-[10px] text-muted mt-2 text-center">
        {data.outputWidth || 1920} × {data.outputHeight || 1080}
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={!hasImages}
        className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: hasImages
            ? `linear-gradient(135deg, ${NODE_COLORS.comp}, #16a34a)`
            : 'var(--color-bg-hover)',
        }}
      >
        <DownloadIcon size={14} />
        Export Comp
      </button>

      {/* Hidden canvas for rendering */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </BaseNode>
  );
}
