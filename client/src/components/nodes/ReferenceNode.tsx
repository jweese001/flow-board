import { useCallback, useState } from 'react';
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
  const [isDragging, setIsDragging] = useState(false);

  const isSequence = data.isSequence ?? false;
  const sequenceImages = data.sequenceImages ?? [];
  const sequenceIndex = data.sequenceIndex ?? 0;

  // Get the current display image (single mode or current sequence frame)
  const currentImage = isSequence
    ? sequenceImages[sequenceIndex] ?? null
    : data.imageUrl ?? null;

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (isSequence) {
      // Multi-file upload for sequence mode
      const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
      if (imageFiles.length === 0) return;

      Promise.all(
        imageFiles.map(file => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsDataURL(file);
        }))
      ).then((newImages) => {
        // Sort by filename for predictable order
        const sortedImages = [...sequenceImages, ...newImages];
        updateNodeData(id, {
          sequenceImages: sortedImages,
          sequenceIndex: sequenceImages.length === 0 ? 0 : sequenceIndex,
        });
      });
    } else {
      // Single file for normal mode
      const file = files[0];
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        updateNodeData(id, { imageUrl: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [id, isSequence, sequenceImages, sequenceIndex, updateNodeData]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    if (isSequence) {
      Promise.all(
        files.map(file => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsDataURL(file);
        }))
      ).then((newImages) => {
        const sortedImages = [...sequenceImages, ...newImages];
        updateNodeData(id, {
          sequenceImages: sortedImages,
          sequenceIndex: sequenceImages.length === 0 ? 0 : sequenceIndex,
        });
      });
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateNodeData(id, { imageUrl: event.target?.result as string });
      };
      reader.readAsDataURL(files[0]);
    }
  }, [id, isSequence, sequenceImages, sequenceIndex, updateNodeData]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
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
          if (isSequence) {
            updateNodeData(id, {
              sequenceImages: [...sequenceImages, base64],
              sequenceIndex: sequenceImages.length === 0 ? 0 : sequenceIndex,
            });
          } else {
            updateNodeData(id, { imageUrl: base64 });
          }
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  }, [id, isSequence, sequenceImages, sequenceIndex, updateNodeData]);

  const handleToggleSequence = useCallback(() => {
    const newIsSequence = !isSequence;
    if (newIsSequence && data.imageUrl && sequenceImages.length === 0) {
      // Convert single image to first sequence frame
      updateNodeData(id, {
        isSequence: true,
        sequenceImages: [data.imageUrl],
        sequenceIndex: 0,
      });
    } else {
      updateNodeData(id, { isSequence: newIsSequence });
    }
  }, [id, isSequence, data.imageUrl, sequenceImages, updateNodeData]);

  const handleSequenceIndexChange = useCallback((newIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(newIndex, sequenceImages.length - 1));
    updateNodeData(id, { sequenceIndex: clampedIndex });
  }, [id, sequenceImages.length, updateNodeData]);

  const handleRemoveFrame = useCallback((index: number) => {
    const newImages = sequenceImages.filter((_, i) => i !== index);
    const newIndex = Math.min(sequenceIndex, Math.max(0, newImages.length - 1));
    updateNodeData(id, {
      sequenceImages: newImages,
      sequenceIndex: newIndex,
    });
  }, [id, sequenceImages, sequenceIndex, updateNodeData]);

  const handleClearSequence = useCallback(() => {
    updateNodeData(id, {
      sequenceImages: [],
      sequenceIndex: 0,
    });
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
        onDragLeave={handleDragLeave}
        onPaste={handlePaste}
        tabIndex={0}
      >
        {/* Header row: type badge + sequence toggle */}
        <div className="flex items-center justify-between gap-2">
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

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isSequence}
              onChange={handleToggleSequence}
              className="w-3 h-3 rounded border-2 border-gray-500 bg-transparent checked:bg-violet-500 checked:border-violet-500"
            />
            <span className="text-[10px] text-muted">Sequence</span>
          </label>
        </div>

        {/* Image preview or upload area */}
        {currentImage ? (
          <div className="relative group">
            <img
              src={currentImage}
              alt={data.name || 'Reference'}
              className="w-full rounded-lg"
              style={{
                maxHeight: '150px',
                objectFit: 'cover',
                border: isDragging ? '2px solid var(--color-node-reference)' : 'none',
              }}
            />
            {/* Frame counter for sequence */}
            {isSequence && sequenceImages.length > 0 && (
              <div
                className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                style={{ background: 'rgba(0, 0, 0, 0.7)', color: 'white' }}
              >
                {sequenceIndex + 1}/{sequenceImages.length}
              </div>
            )}
            {/* Overlay to change/add image */}
            <label
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg"
              style={{ background: 'rgba(0, 0, 0, 0.6)' }}
            >
              <div className="text-white text-[10px] font-medium">
                {isSequence ? 'Add frames' : 'Click to replace'}
              </div>
              <input
                type="file"
                accept="image/*"
                multiple={isSequence}
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <label
            className="flex flex-col items-center justify-center gap-2 py-6 rounded-lg cursor-pointer transition-colors hover:bg-bg-hover"
            style={{
              border: isDragging
                ? '2px solid var(--color-node-reference)'
                : '2px dashed var(--color-border-medium)',
              background: isDragging
                ? 'rgba(139, 92, 246, 0.1)'
                : 'var(--color-bg-elevated)',
            }}
          >
            <UploadIcon size={24} className="text-muted" />
            <div className="text-[10px] text-muted text-center">
              <div className="font-medium">
                {isSequence ? 'Drop images here' : 'Drop image here'}
              </div>
              <div>or click to browse</div>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple={isSequence}
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        )}

        {/* Sequence thumbnail strip and controls */}
        {isSequence && sequenceImages.length > 1 && (
          <div className="space-y-2">
            {/* Thumbnail strip */}
            <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
              {sequenceImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative flex-shrink-0 cursor-pointer group/thumb"
                  onClick={() => handleSequenceIndexChange(idx)}
                >
                  <img
                    src={img}
                    alt={`Frame ${idx + 1}`}
                    className="h-10 w-10 object-cover rounded"
                    style={{
                      border: idx === sequenceIndex
                        ? '2px solid var(--color-node-reference)'
                        : '2px solid transparent',
                      opacity: idx === sequenceIndex ? 1 : 0.6,
                    }}
                  />
                  {/* Remove frame button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFrame(idx);
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                    title="Remove frame"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Playhead slider */}
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={sequenceImages.length - 1}
                value={sequenceIndex}
                onChange={(e) => handleSequenceIndexChange(parseInt(e.target.value, 10))}
                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                style={{
                  accentColor: 'var(--color-node-reference)',
                }}
              />
              <button
                onClick={handleClearSequence}
                className="text-[10px] text-red-400 hover:text-red-300"
                title="Clear all frames"
              >
                Clear
              </button>
            </div>
          </div>
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
