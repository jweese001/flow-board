import { useCallback, useEffect, useRef } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { PageNode as PageNodeType, PageLayout, TransformNodeData, ImageAlignment } from '@/types/nodes';
import { NODE_COLORS, PAGE_LAYOUT_SLOTS } from '@/types/nodes';
import { BaseNode } from './BaseNode';
import { LayoutIcon, DownloadIcon } from '../ui/Icons';
import { useFlowStore } from '@/stores/flowStore';

// Panel data with optional transform
interface PanelData {
  imageUrl: string | null;
  transform?: {
    scale: number;
    offsetX: number;
    offsetY: number;
    rotation: number;
    flipH: boolean;
    flipV: boolean;
    alignment: ImageAlignment;
  };
}

// Layout definitions: each slot has x, y, width, height as percentages
type LayoutSlot = { x: number; y: number; w: number; h: number };
type LayoutDefinition = LayoutSlot[];

// Calculate optimal grid dimensions for N panels
function calculateGridDimensions(numPanels: number, pageWidth: number, pageHeight: number): { cols: number; rows: number; totalSlots: number } {
  if (numPanels <= 0) return { cols: 1, rows: 1, totalSlots: 1 };
  if (numPanels === 1) return { cols: 1, rows: 1, totalSlots: 1 };

  // Try different grid configurations and find the best fit
  let bestCols = 1;
  let bestRows = numPanels;
  let bestScore = Infinity;

  for (let cols = 1; cols <= numPanels; cols++) {
    const rows = Math.ceil(numPanels / cols);
    const totalSlots = cols * rows;

    // Calculate aspect ratio of each cell
    const cellWidth = pageWidth / cols;
    const cellHeight = pageHeight / rows;
    const cellRatio = cellWidth / cellHeight;

    // Score based on:
    // 1. How close cell ratio is to 1 (square-ish cells are often preferred)
    // 2. Minimize wasted slots
    const wastedSlots = totalSlots - numPanels;
    const ratioScore = Math.abs(Math.log(cellRatio)); // 0 when square
    const wasteScore = wastedSlots * 0.5;
    const score = ratioScore + wasteScore;

    if (score < bestScore) {
      bestScore = score;
      bestCols = cols;
      bestRows = rows;
    }
  }

  return { cols: bestCols, rows: bestRows, totalSlots: bestCols * bestRows };
}

// Generate a grid layout definition
function generateGridLayout(cols: number, rows: number): LayoutDefinition {
  const layout: LayoutDefinition = [];
  const cellW = 100 / cols;
  const cellH = 100 / rows;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      layout.push({
        x: col * cellW,
        y: row * cellH,
        w: cellW,
        h: cellH,
      });
    }
  }

  return layout;
}

const LAYOUTS: Record<PageLayout, LayoutDefinition> = {
  'full': [
    { x: 0, y: 0, w: 100, h: 100 },
  ],
  '2-up-h': [
    { x: 0, y: 0, w: 50, h: 100 },
    { x: 50, y: 0, w: 50, h: 100 },
  ],
  '2-up-v': [
    { x: 0, y: 0, w: 100, h: 50 },
    { x: 0, y: 50, w: 100, h: 50 },
  ],
  '3-up-left': [
    { x: 0, y: 0, w: 60, h: 100 },
    { x: 60, y: 0, w: 40, h: 50 },
    { x: 60, y: 50, w: 40, h: 50 },
  ],
  '3-up-right': [
    { x: 0, y: 0, w: 40, h: 50 },
    { x: 0, y: 50, w: 40, h: 50 },
    { x: 40, y: 0, w: 60, h: 100 },
  ],
  '3-up-top': [
    { x: 0, y: 0, w: 100, h: 60 },
    { x: 0, y: 60, w: 50, h: 40 },
    { x: 50, y: 60, w: 50, h: 40 },
  ],
  '3-up-bottom': [
    { x: 0, y: 0, w: 50, h: 40 },
    { x: 50, y: 0, w: 50, h: 40 },
    { x: 0, y: 40, w: 100, h: 60 },
  ],
  '4-up': [
    { x: 0, y: 0, w: 50, h: 50 },
    { x: 50, y: 0, w: 50, h: 50 },
    { x: 0, y: 50, w: 50, h: 50 },
    { x: 50, y: 50, w: 50, h: 50 },
  ],
  '6-up': [
    { x: 0, y: 0, w: 33.33, h: 50 },
    { x: 33.33, y: 0, w: 33.33, h: 50 },
    { x: 66.66, y: 0, w: 33.34, h: 50 },
    { x: 0, y: 50, w: 33.33, h: 50 },
    { x: 33.33, y: 50, w: 33.33, h: 50 },
    { x: 66.66, y: 50, w: 33.34, h: 50 },
  ],
  'manga-3': [
    { x: 0, y: 0, w: 100, h: 40 },
    { x: 0, y: 40, w: 45, h: 60 },
    { x: 45, y: 40, w: 55, h: 60 },
  ],
  'manga-4': [
    { x: 0, y: 0, w: 55, h: 50 },
    { x: 55, y: 0, w: 45, h: 35 },
    { x: 55, y: 35, w: 45, h: 65 },
    { x: 0, y: 50, w: 55, h: 50 },
  ],
  'inset': [
    { x: 0, y: 0, w: 100, h: 100 },
    { x: 65, y: 5, w: 30, h: 30 },
  ],
};

// Helper to build inline styles for transformed image
// Without transform: object-fit cover (fills panel, may crop)
// With transform: object-fit contain + scale (scale 1 = full image, >1 = zoom in)
function getTransformedImageStyles(transform?: PanelData['transform']): React.CSSProperties {
  // No transform? Simple cover behavior (default)
  if (!transform) {
    return {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
      objectPosition: 'center',
    };
  }

  const scale = transform.scale ?? 1;
  const offsetX = transform.offsetX ?? 0;
  const offsetY = transform.offsetY ?? 0;
  const rotation = transform.rotation ?? 0;
  const flipH = transform.flipH ?? false;
  const flipV = transform.flipV ?? false;
  const alignment = transform.alignment ?? 'center';

  // Calculate translation based on alignment
  // Center = translate(-50%, -50%), edges anchor differently
  let translateX = -50;
  let translateY = -50;

  if (alignment.includes('left')) translateX = 0;
  else if (alignment.includes('right')) translateX = -100;

  if (alignment.includes('top')) translateY = 0;
  else if (alignment.includes('bottom')) translateY = -100;

  // Apply offset (percentage shift)
  translateX -= offsetX;
  translateY -= offsetY;

  // Build transform string
  const transforms: string[] = [];
  transforms.push(`translate(${translateX}%, ${translateY}%)`);
  transforms.push(`scale(${scale})`);
  if (rotation !== 0) {
    transforms.push(`rotate(${rotation}deg)`);
  }
  if (flipH || flipV) {
    transforms.push(`scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`);
  }

  // Calculate position based on alignment
  let top: string | number = '50%';
  let left: string | number = '50%';

  if (alignment.includes('top')) top = 0;
  else if (alignment.includes('bottom')) top = '100%';

  if (alignment.includes('left')) left = 0;
  else if (alignment.includes('right')) left = '100%';

  // Use contain so full image is visible at scale 1, then scale zooms in
  return {
    position: 'absolute' as const,
    top,
    left,
    width: '100%',
    height: '100%',
    objectFit: 'contain' as const,
    transform: transforms.join(' '),
    transformOrigin: 'center center',
  };
}

export function PageNode({ id, data, selected }: NodeProps<PageNodeType>) {
  const { nodes, edges, updateNodeData } = useFlowStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate layout based on mode (preset or num-grid)
  const { slotCount, layoutDef } = (() => {
    if (data.useNumGrid && data.numPanels && data.numPanels > 0) {
      const { cols, rows, totalSlots } = calculateGridDimensions(
        data.numPanels,
        data.outputWidth || 1200,
        data.outputHeight || 1600
      );
      return {
        slotCount: totalSlots,
        layoutDef: generateGridLayout(cols, rows),
      };
    }
    return {
      slotCount: PAGE_LAYOUT_SLOTS[data.layout] || 1,
      layoutDef: LAYOUTS[data.layout] || LAYOUTS['full'],
    };
  })();

  // Find connected Output, Reference, or Transform nodes and their images
  const getConnectedPanels = useCallback(() => {
    const panels: PanelData[] = new Array(slotCount).fill(null).map(() => ({ imageUrl: null }));

    // Helper to get image from a node
    const getImageFromNode = (nodeId: string): { imageUrl: string | null; transform?: PanelData['transform'] } => {
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
        // Find what's connected to this transform's input
        const upstreamEdge = edges.find((e) => e.target === nodeId);
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
            },
          };
        }
        return { imageUrl: null };
      }

      return { imageUrl: null };
    };

    // Find edges connected to this node's panel handles
    for (const edge of edges) {
      if (edge.target === id && edge.targetHandle?.startsWith('panel-')) {
        const slotIndex = parseInt(edge.targetHandle.replace('panel-', ''), 10);
        if (slotIndex < slotCount) {
          const result = getImageFromNode(edge.source);
          panels[slotIndex] = {
            imageUrl: result.imageUrl,
            transform: result.transform,
          };
        }
      }
    }

    return panels;
  }, [id, edges, nodes, slotCount]);

  // Legacy getter for simple image array (for data.panelImages)
  const getConnectedImages = useCallback(() => {
    return getConnectedPanels().map((p) => p.imageUrl);
  }, [getConnectedPanels]);

  // Get full panel data with transforms
  const panelData = getConnectedPanels();

  // Update panel images when connections change
  useEffect(() => {
    const images = getConnectedImages();
    const currentImages = data.panelImages || [];

    // Only update if images changed
    if (JSON.stringify(images) !== JSON.stringify(currentImages)) {
      updateNodeData(id, { panelImages: images });
    }
  }, [id, edges, nodes, getConnectedImages, data.panelImages, updateNodeData]);

  // Render composite to canvas for export
  const renderToCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const width = data.outputWidth || 1200;
    const height = data.outputHeight || 1600;
    canvas.width = width;
    canvas.height = height;

    // Fill background
    ctx.fillStyle = data.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const gutter = data.gutter || 8;
    const currentPanels = getConnectedPanels();

    // Draw each panel
    for (let i = 0; i < layoutDef.length; i++) {
      const slot = layoutDef[i];
      const panel = currentPanels[i];
      const imgUrl = panel?.imageUrl;

      const x = (slot.x / 100) * width + gutter / 2;
      const y = (slot.y / 100) * height + gutter / 2;
      const w = (slot.w / 100) * width - gutter;
      const h = (slot.h / 100) * height - gutter;

      // Draw panel background
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(x, y, w, h);

      if (imgUrl) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = imgUrl;
          });

          // Save context for transforms
          ctx.save();

          // Clip to panel bounds
          ctx.beginPath();
          ctx.rect(x, y, w, h);
          ctx.clip();

          const transform = panel.transform;
          const scale = transform?.scale ?? 1;
          const offsetX = transform?.offsetX ?? 0;
          const offsetY = transform?.offsetY ?? 0;
          const rotation = transform?.rotation ?? 0;
          const flipH = transform?.flipH ?? false;
          const flipV = transform?.flipV ?? false;
          const alignment = transform?.alignment ?? 'center';

          const imgRatio = img.width / img.height;
          const slotRatio = w / h;

          let baseW: number;
          let baseH: number;

          if (transform) {
            // With transform: use CONTAIN behavior (full image visible at scale 1)
            if (imgRatio > slotRatio) {
              // Image is wider - fit to width
              baseW = w;
              baseH = w / imgRatio;
            } else {
              // Image is taller - fit to height
              baseH = h;
              baseW = h * imgRatio;
            }
          } else {
            // Without transform: use COVER behavior (fill panel)
            if (imgRatio > slotRatio) {
              baseW = h * imgRatio;
              baseH = h;
            } else {
              baseW = w;
              baseH = w / imgRatio;
            }
          }

          // Apply scale
          const drawW = baseW * scale;
          const drawH = baseH * scale;

          // Calculate anchor position based on alignment
          let anchorX = x + w / 2;
          let anchorY = y + h / 2;

          if (alignment.includes('left')) anchorX = x;
          else if (alignment.includes('right')) anchorX = x + w;

          if (alignment.includes('top')) anchorY = y;
          else if (alignment.includes('bottom')) anchorY = y + h;

          // Calculate image position relative to anchor
          let imgX = anchorX - drawW / 2;
          let imgY = anchorY - drawH / 2;

          if (alignment.includes('left')) imgX = anchorX;
          else if (alignment.includes('right')) imgX = anchorX - drawW;

          if (alignment.includes('top')) imgY = anchorY;
          else if (alignment.includes('bottom')) imgY = anchorY - drawH;

          // Apply offset as percentage of panel
          imgX -= (offsetX / 100) * w;
          imgY -= (offsetY / 100) * h;

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
          console.error('Failed to load image for panel', i, e);
        }
      }
    }

    return canvas;
  }, [data.backgroundColor, data.gutter, data.outputWidth, data.outputHeight, layoutDef, getConnectedPanels]);

  const handleDownload = async () => {
    const canvas = await renderToCanvas();
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `flowboard-page-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Generate input handles for each panel slot
  // Spread handles evenly from 20% to 80% of node height
  const panelHandles = Array.from({ length: slotCount }, (_, i) => {
    // Calculate position: evenly spaced from top to bottom
    const topPercent = slotCount === 1
      ? 50 // Single handle centered
      : 20 + (i * 60) / (slotCount - 1); // Multiple handles spread 20%-80%

    return (
      <Handle
        key={`panel-${i}`}
        type="target"
        position={Position.Left}
        id={`panel-${i}`}
        style={{
          top: `${topPercent}%`,
          background: NODE_COLORS.page,
          borderColor: NODE_COLORS.page,
          borderWidth: 2,
        }}
        title={`Panel ${i + 1}`}
      />
    );
  });

  const images = data.panelImages || [];

  return (
    <BaseNode
      nodeId={id}
      nodeType="page"
      name={data.name || 'Page Layout'}
      selected={selected}
      showTargetHandle={false}
      showSourceHandle={false}
      icon={<LayoutIcon size={14} />}
      additionalHandles={<>{panelHandles}</>}
    >
      {/* Layout Preview - aspect ratio matches output dimensions */}
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          width: '100%',
          aspectRatio: `${data.outputWidth || 1200} / ${data.outputHeight || 1600}`,
          background: data.backgroundColor || '#ffffff',
        }}
      >
        {layoutDef.map((slot, i) => (
          <div
            key={i}
            className="absolute overflow-hidden"
            style={{
              left: `${slot.x}%`,
              top: `${slot.y}%`,
              width: `${slot.w}%`,
              height: `${slot.h}%`,
              padding: `${(data.gutter || 8) / 4}px`,
            }}
          >
            <div
              className="w-full h-full rounded-sm flex items-center justify-center overflow-hidden"
              style={{
                backgroundColor: '#1a1a2e',
                position: 'relative',
              }}
            >
              {panelData[i]?.imageUrl && (
                <img
                  src={panelData[i].imageUrl!}
                  alt={`Panel ${i + 1}`}
                  style={getTransformedImageStyles(panelData[i].transform)}
                />
              )}
              {!panelData[i]?.imageUrl && (
                <span className="text-[8px] text-gray-500">{i + 1}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={!images.some(Boolean)}
        className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: images.some(Boolean)
            ? 'linear-gradient(135deg, #0ea5e9, #0284c7)'
            : 'var(--color-bg-hover)',
        }}
      >
        <DownloadIcon size={14} />
        Export Page
      </button>

      {/* Hidden canvas for rendering */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </BaseNode>
  );
}
