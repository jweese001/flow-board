import { useCallback } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { ReferenceNode as ReferenceNodeType } from '@/types/nodes';
import { BaseNode } from './BaseNode';
import { ImageIcon, UploadIcon } from '../ui/Icons';
import { useFlowStore } from '@/stores/flowStore';

const IMAGE_TYPE_LABELS: Record<string, string> = {
  character: 'Character',
  setting: 'Setting',
  prop: 'Prop',
  style: 'Style',
  scene: 'Scene',
  mood: 'Mood',
};

export function ReferenceNode({ id, data, selected }: NodeProps<ReferenceNodeType>) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('Please select an image file');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateNodeData(id, { imageUrl: base64 });
    };
    reader.readAsDataURL(file);
  }, [id, updateNodeData]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateNodeData(id, { imageUrl: base64 });
    };
    reader.readAsDataURL(file);
  }, [id, updateNodeData]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          updateNodeData(id, { imageUrl: base64 });
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  }, [id, updateNodeData]);

  return (
    <BaseNode
      nodeId={id}
      nodeType="reference"
      name={data.name || 'Reference Image'}
      selected={selected}
      showTargetHandle={false}
      showSourceHandle={true}
      icon={<ImageIcon size={14} />}
    >
      <div
        className="space-y-3"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onPaste={handlePaste}
        tabIndex={0}
      >
        {/* Image type badge */}
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-semibold px-2 py-1 rounded"
            style={{
              background: 'var(--color-node-reference)',
              color: 'white',
              opacity: 0.9,
            }}
          >
            {IMAGE_TYPE_LABELS[data.imageType] || 'Reference'}
          </span>
        </div>

        {/* Image preview or upload area */}
        {data.imageUrl ? (
          <div className="relative group">
            <img
              src={data.imageUrl}
              alt={data.name || 'Reference'}
              className="w-full rounded-lg"
              style={{
                maxHeight: '150px',
                objectFit: 'cover',
              }}
            />
            {/* Overlay to change image */}
            <label
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg"
              style={{ background: 'rgba(0, 0, 0, 0.6)' }}
            >
              <div className="text-white text-[10px] font-medium">
                Click to replace
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <label
            className="flex flex-col items-center justify-center gap-2 py-6 rounded-lg cursor-pointer transition-colors hover:bg-bg-hover"
            style={{
              border: '2px dashed var(--color-border-medium)',
              background: 'var(--color-bg-elevated)',
            }}
          >
            <UploadIcon size={24} className="text-muted" />
            <div className="text-[10px] text-muted text-center">
              <div className="font-medium">Drop image here</div>
              <div>or click to browse</div>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        )}

        {/* Description if present */}
        {data.description && (
          <p className="text-[10px] text-muted line-clamp-2">
            {data.description}
          </p>
        )}
      </div>
    </BaseNode>
  );
}
