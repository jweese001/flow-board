import type { NodeProps } from '@xyflow/react';
import type { OutputNode as OutputNodeType } from '@/types/nodes';
import { BaseNode } from './BaseNode';
import { ImageIcon, PlayIcon, Loader2Icon } from '../ui/Icons';
import { useFlowStore } from '@/stores/flowStore';
import { assemblePrompt } from '@/engine/assembler';
import { generateImage } from '@/services/api';

export function OutputNode({ id, data, selected }: NodeProps<OutputNodeType>) {
  const { nodes, edges, updateNodeData } = useFlowStore();

  const handleGenerate = async () => {
    // Assemble the prompt from connected nodes
    const result = assemblePrompt(id, nodes, edges);

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
      model: result.parameters.model,
      aspectRatio: result.parameters.aspectRatio,
      seed: result.parameters.seed,
    });

    if (response.success) {
      updateNodeData(id, {
        status: 'complete',
        generatedImageUrl: response.data.imageUrl,
        error: undefined,
      });
    } else {
      updateNodeData(id, {
        status: 'error',
        error: response.error.message,
      });
    }
  };

  return (
    <BaseNode
      nodeId={id}
      nodeType="output"
      name="Output"
      selected={selected}
      showSourceHandle={false}
      icon={<ImageIcon size={14} />}
    >
      {/* Prompt Preview */}
      <div style={{ marginBottom: '16px' }}>
        <div
          className="text-[10px] font-semibold uppercase tracking-wide text-muted"
          style={{ marginBottom: '8px', marginLeft: '8px' }}
        >
          Assembled Prompt
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

      {/* Generated Image */}
      {data.generatedImageUrl && (
        <div style={{ marginBottom: '12px' }}>
          <img
            src={data.generatedImageUrl}
            alt="Generated"
            className="w-full rounded-lg"
            style={{
              background: 'var(--color-bg-elevated)',
              display: 'block',
            }}
          />
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
