import { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { OutputNode as OutputNodeType } from '@/types/nodes';
import { NODE_COLORS } from '@/types/nodes';
import { BaseNode } from './BaseNode';
import { ImageIcon, PlayIcon, Loader2Icon, ClipboardIcon, ClipboardCheckIcon, DownloadIcon } from '../ui/Icons';
import { useFlowStore } from '@/stores/flowStore';
import { useHistoryStore } from '@/stores/historyStore';
import { assemblePrompt } from '@/engine/assembler';
import { generateImage } from '@/services/api';

const MODEL_LABELS: Record<string, string> = {
  mock: 'Mock (Test)',
  'gemini-pro': 'Gemini 3 Pro',
  'gemini-flash': 'Gemini 2.5 Flash',
  'flux-schnell': 'Flux Schnell',
  'flux-dev': 'Flux Dev',
  'turbo': 'Turbo',
  'sdxl-turbo': 'SDXL Turbo',
};

export function OutputNode({ id, data, selected }: NodeProps<OutputNodeType>) {
  const { nodes, edges, updateNodeData } = useFlowStore();
  const addHistoryEntry = useHistoryStore((s) => s.addEntry);
  const [copied, setCopied] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>('');

  const handleAssemble = () => {
    const result = assemblePrompt(id, nodes, edges);
    updateNodeData(id, {
      promptPreview: result.prompt,
    });
    setCurrentModel(result.parameters.model);
    return result;
  };

  const handleCopyPrompt = async () => {
    const result = handleAssemble();
    try {
      await navigator.clipboard.writeText(result.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get the currently displayed image
  const selectedIndex = data.selectedImageIndex ?? 0;
  const images = data.generatedImages ?? [];
  const currentImageUrl = images.length > 0
    ? images[selectedIndex]?.imageUrl
    : data.generatedImageUrl;

  const handleSelectImage = (index: number) => {
    updateNodeData(id, {
      selectedImageIndex: index,
      generatedImageUrl: images[index]?.imageUrl,
    });
  };

  const handleDownload = () => {
    if (!currentImageUrl) return;

    // Create a link element and trigger download
    const link = document.createElement('a');
    link.href = currentImageUrl;

    // Generate filename with timestamp and index
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const indexSuffix = images.length > 1 ? `-${selectedIndex + 1}` : '';
    link.download = `flowboard-${timestamp}${indexSuffix}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerate = async () => {
    // Assemble the prompt from connected nodes
    const result = handleAssemble();

    // Update node with preview and set generating state
    updateNodeData(id, {
      promptPreview: result.prompt,
      status: 'generating',
      error: undefined,
    });

    // Call the API
    const response = await generateImage({
      prompt: result.prompt,
      negativePrompt: result.negativePrompt || undefined,
      referenceImages: result.referenceImages.length > 0 ? result.referenceImages : undefined,
      model: result.parameters.model,
      aspectRatio: result.parameters.aspectRatio,
      resolution: result.parameters.resolution,
      seed: result.parameters.seed,
      temperature: result.parameters.temperature,
      numberOfImages: result.parameters.numberOfImages,
    });

    if (response.success) {
      // Store all generated images
      const generatedImages = response.data.images.map(img => ({
        imageUrl: img.imageUrl,
        seed: img.seed,
      }));

      updateNodeData(id, {
        status: 'complete',
        generatedImageUrl: response.data.imageUrl,
        generatedImages,
        selectedImageIndex: 0,
        error: undefined,
      });

      // Save first image to history
      addHistoryEntry({
        imageUrl: response.data.imageUrl,
        prompt: result.prompt,
        negativePrompt: result.negativePrompt || undefined,
        model: result.parameters.model,
        aspectRatio: result.parameters.aspectRatio,
        seed: response.data.seed,
      });
    } else {
      updateNodeData(id, {
        status: 'error',
        error: response.error.message,
      });
    }
  };

  // Additional handles for Output node
  const additionalHandles = (
    <>
      {/* Reference handle for direct Reference node connections */}
      <Handle
        type="target"
        position={Position.Left}
        id="reference"
        style={{
          background: NODE_COLORS.reference,
          borderColor: NODE_COLORS.reference,
          borderWidth: 2,
          top: '60%',
        }}
        title="Connect reference images"
      />
      {/* Config handle for Parameters/Negative nodes */}
      <Handle
        type="target"
        position={Position.Left}
        id="config"
        style={{
          background: NODE_COLORS.parameters,
          borderColor: NODE_COLORS.parameters,
          borderWidth: 2,
          top: '80%',
        }}
        title="Connect parameters or negative prompts"
      />
    </>
  );

  return (
    <BaseNode
      nodeId={id}
      nodeType="output"
      name="Output"
      selected={selected}
      showSourceHandle={data.generatedImageUrl ? true : false}
      icon={<ImageIcon size={14} />}
      additionalHandles={additionalHandles}
    >
      {/* Prompt Preview */}
      <div style={{ marginBottom: '16px' }}>
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: '8px', marginLeft: '8px', marginRight: '8px' }}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Assembled Prompt
          </span>
          <button
            onClick={handleCopyPrompt}
            className="flex items-center gap-1 text-[10px] text-muted hover:text-primary transition-colors"
            title="Copy prompt to clipboard"
          >
            {copied ? (
              <>
                <ClipboardCheckIcon size={12} />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <ClipboardIcon size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <div
          className="font-mono text-[10px] leading-relaxed text-secondary rounded-lg max-h-24 overflow-y-auto"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-subtle)',
            padding: '12px 16px',
          }}
        >
          {data.promptPreview || (
            <span className="text-muted italic">Connect nodes to see preview...</span>
          )}
        </div>
      </div>

      {/* Model indicator */}
      {currentModel && (
        <div
          className="text-[10px] text-muted mb-3"
          style={{ marginLeft: '8px' }}
        >
          Using: <span className="text-secondary">{MODEL_LABELS[currentModel] || currentModel}</span>
        </div>
      )}

      {/* Generated Image */}
      {currentImageUrl && (
        <div style={{ marginBottom: '12px' }}>
          <div className="relative group">
            <img
              src={currentImageUrl}
              alt="Generated"
              className="w-full rounded-lg"
              style={{
                background: 'var(--color-bg-elevated)',
                display: 'block',
              }}
            />
            {/* Download overlay button */}
            <button
              onClick={handleDownload}
              className="absolute top-2 right-2 p-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(4px)',
              }}
              title="Download image"
            >
              <DownloadIcon size={16} className="text-white" />
            </button>
          </div>

          {/* Pagination dots for multiple images */}
          {images.length > 1 && (
            <div className="flex justify-center gap-2 mt-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectImage(index)}
                  className="transition-all duration-150"
                  style={{
                    width: index === selectedIndex ? '20px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: index === selectedIndex
                      ? 'var(--color-node-output)'
                      : 'var(--color-border-subtle)',
                  }}
                  title={`Image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={data.status === 'generating'}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: data.status === 'generating'
            ? 'var(--color-bg-hover)'
            : 'linear-gradient(135deg, var(--color-node-output), #dc2626)',
          boxShadow: data.status === 'generating'
            ? 'none'
            : '0 0 20px rgba(239, 68, 68, 0.3)',
        }}
      >
        {data.status === 'generating' ? (
          <>
            <Loader2Icon size={14} className="animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <PlayIcon size={14} />
            Generate
          </>
        )}
      </button>

      {/* Error */}
      {data.error && (
        <div className="mt-2 text-[10px] text-error">
          {data.error}
        </div>
      )}
    </BaseNode>
  );
}
