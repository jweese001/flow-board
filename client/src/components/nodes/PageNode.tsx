import { useCallback, useEffect, useRef } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { PageNode as PageNodeType, PageLayout } from '@/types/nodes';
import { NODE_COLORS, PAGE_LAYOUT_SLOTS } from '@/types/nodes';
import { BaseNode } from './BaseNode';
import { LayoutIcon, DownloadIcon } from '../ui/Icons';
import { useFlowStore } from '@/stores/flowStore';

// Layout definitions: each slot has x, y, width, height as percentages
type LayoutSlot = { x: number; y: number; w: number; h: number };
type LayoutDefinition = LayoutSlot[];

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

export function PageNode({ id, data, selected }: NodeProps<PageNodeType>) {
  const { nodes, edges, updateNodeData } = useFlowStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slotCount = PAGE_LAYOUT_SLOTS[data.layout] || 1;
  const layoutDef = LAYOUTS[data.layout] || LAYOUTS['full'];

  // Find connected Output nodes and their images
  const getConnectedImages = useCallback(() => {
    const images: (string | null)[] = new Array(slotCount).fill(null);

    // Find edges connected to this node's panel handles
    for (const edge of edges) {
      if (edge.target === id && edge.targetHandle?.startsWith('panel-')) {
        const slotIndex = parseInt(edge.targetHandle.replace('panel-', ''), 10);
        const sourceNode = nodes.find((n) => n.id === edge.source);

        if (sourceNode?.type === 'output') {
          const outputData = sourceNode.data as { generatedImageUrl?: string };
          if (outputData.generatedImageUrl && slotIndex < slotCount) {
            images[slotIndex] = outputData.generatedImageUrl;
          }
        }
      }
    }

    return images;
  }, [id, edges, nodes, slotCount]);

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

    const width = 1200;
    const height = 1600; // Standard comic page ratio
    canvas.width = width;
    canvas.height = height;

    // Fill background
    ctx.fillStyle = data.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const gutter = data.gutter || 8;
    const images = data.panelImages || [];

    // Draw each panel
    for (let i = 0; i < layoutDef.length; i++) {
      const slot = layoutDef[i];
      const imgUrl = images[i];

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

          // Cover fit
          const imgRatio = img.width / img.height;
          const slotRatio = w / h;
          let sx = 0, sy = 0, sw = img.width, sh = img.height;

          if (imgRatio > slotRatio) {
            sw = img.height * slotRatio;
            sx = (img.width - sw) / 2;
          } else {
            sh = img.width / slotRatio;
            sy = (img.height - sh) / 2;
          }

          ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
        } catch (e) {
          console.error('Failed to load image for panel', i, e);
        }
      }
    }

    return canvas;
  }, [data.backgroundColor, data.gutter, data.panelImages, layoutDef]);

  const handleDownload = async () => {
    const canvas = await renderToCanvas();
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `flowboard-page-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Generate input handles for each panel slot
  const panelHandles = Array.from({ length: slotCount }, (_, i) => (
    <Handle
      key={`panel-${i}`}
      type="target"
      position={Position.Left}
      id={`panel-${i}`}
      style={{
        background: NODE_COLORS.page,
        borderColor: NODE_COLORS.page,
        borderWidth: 2,
        top: `${15 + (i * 70) / Math.max(slotCount - 1, 1)}%`,
      }}
      title={`Panel ${i + 1}`}
    />
  ));

  const images = data.panelImages || [];

  return (
    <BaseNode
      nodeId={id}
      nodeType="page"
      name="Page Layout"
      selected={selected}
      showTargetHandle={false}
      showSourceHandle={false}
      icon={<LayoutIcon size={14} />}
      additionalHandles={<>{panelHandles}</>}
    >
      {/* Layout Preview */}
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          width: '100%',
          aspectRatio: '3/4',
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
              className="w-full h-full rounded-sm flex items-center justify-center"
              style={{
                background: images[i] ? 'transparent' : '#1a1a2e',
                backgroundImage: images[i] ? `url(${images[i]})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!images[i] && (
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
