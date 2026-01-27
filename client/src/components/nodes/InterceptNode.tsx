import { useCallback, useEffect, useRef, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { InterceptNode as InterceptNodeType } from '@/types/nodes';
import { NODE_COLORS } from '@/types/nodes';
import { BaseNode } from './BaseNode';
import { useFlowStore } from '@/stores/flowStore';
import { assemblePrompt } from '@/engine/assembler';

// Icon for intercept node
function InterceptIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M4.93 4.93l2.83 2.83" />
      <path d="M16.24 16.24l2.83 2.83" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <path d="M4.93 19.07l2.83-2.83" />
      <path d="M16.24 7.76l2.83-2.83" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

export function InterceptNode({ id, data, selected }: NodeProps<InterceptNodeType>) {
  const { nodes, edges, updateNodeData } = useFlowStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevUpstreamRef = useRef<{ prompt: string; negative: string }>({ prompt: '', negative: '' });
  const [showNegative, setShowNegative] = useState(false);

  const assembledPrompt = data.assembledPrompt ?? '';
  const editedPrompt = data.editedPrompt ?? '';
  const isEdited = data.isEdited ?? false;
  const assembledNegative = data.assembledNegative ?? '';
  const editedNegative = data.editedNegative ?? '';
  const isNegativeEdited = data.isNegativeEdited ?? false;

  const accentColor = NODE_COLORS.intercept;
  const negativeColor = NODE_COLORS.negative;

  // Assemble prompt from upstream nodes
  const doAssemble = useCallback(() => {
    const result = assemblePrompt(id, nodes, edges);
    return { prompt: result.prompt, negative: result.negativePrompt };
  }, [id, nodes, edges]);

  // Auto-assemble when upstream changes (but don't overwrite user edits)
  useEffect(() => {
    const newAssembled = doAssemble();

    // Only update if something actually changed
    const promptChanged = newAssembled.prompt !== prevUpstreamRef.current.prompt;
    const negativeChanged = newAssembled.negative !== prevUpstreamRef.current.negative;

    if (promptChanged || negativeChanged) {
      prevUpstreamRef.current = newAssembled;

      const updates: Record<string, unknown> = {};

      if (promptChanged) {
        updates.assembledPrompt = newAssembled.prompt;
        if (!isEdited) {
          updates.editedPrompt = newAssembled.prompt;
        }
      }

      if (negativeChanged) {
        updates.assembledNegative = newAssembled.negative;
        if (!isNegativeEdited) {
          updates.editedNegative = newAssembled.negative;
        }
      }

      if (Object.keys(updates).length > 0) {
        updateNodeData(id, updates);
      }
    }
  }, [id, doAssemble, isEdited, isNegativeEdited, updateNodeData]);

  // Handle prompt text changes
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      updateNodeData(id, {
        editedPrompt: newText,
        isEdited: newText !== assembledPrompt,
      });
    },
    [id, assembledPrompt, updateNodeData]
  );

  // Handle negative text changes
  const handleNegativeChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      updateNodeData(id, {
        editedNegative: newText,
        isNegativeEdited: newText !== assembledNegative,
      });
    },
    [id, assembledNegative, updateNodeData]
  );

  // Reset prompt to assembled
  const handleReset = useCallback(() => {
    updateNodeData(id, {
      editedPrompt: assembledPrompt,
      isEdited: false,
    });
  }, [id, assembledPrompt, updateNodeData]);

  // Reset negative to assembled
  const handleResetNegative = useCallback(() => {
    updateNodeData(id, {
      editedNegative: assembledNegative,
      isNegativeEdited: false,
    });
  }, [id, assembledNegative, updateNodeData]);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    const newAssembled = doAssemble();
    prevUpstreamRef.current = newAssembled;
    updateNodeData(id, {
      assembledPrompt: newAssembled.prompt,
      editedPrompt: newAssembled.prompt,
      isEdited: false,
      assembledNegative: newAssembled.negative,
      editedNegative: newAssembled.negative,
      isNegativeEdited: false,
    });
  }, [id, doAssemble, updateNodeData]);

  // Display the edited prompt (which may be same as assembled)
  const displayPrompt = editedPrompt || assembledPrompt || 'Connect nodes upstream to assemble prompt...';
  const displayNegative = editedNegative || assembledNegative || '';
  const hasContent = assembledPrompt.length > 0;
  const hasNegative = assembledNegative.length > 0 || editedNegative.length > 0;

  // Additional handles matching Output node
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
      nodeType="intercept"
      name={data.name || 'Intercept'}
      selected={selected}
      showTargetHandle={true}
      showSourceHandle={true}
      icon={<InterceptIcon size={14} />}
      additionalHandles={additionalHandles}
    >
      <div className="space-y-3 nodrag">
        {/* Status indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isEdited ? (
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium"
                style={{ background: `${accentColor}30`, color: accentColor }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
                Edited
              </div>
            ) : hasContent ? (
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium"
                style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Auto
              </div>
            ) : (
              <div className="text-[10px] text-muted">No input</div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              className="px-2 py-1 rounded text-[10px] text-muted hover:text-primary hover:bg-white/10 transition-colors"
              title="Refresh from upstream"
            >
              ↻
            </button>
            {isEdited && (
              <button
                onClick={handleReset}
                className="px-2 py-1 rounded text-[10px] transition-colors"
                style={{ color: accentColor }}
                title="Reset to auto-assembled"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Editable prompt area */}
        <div
          className="relative rounded-lg overflow-hidden"
          style={{
            border: `1px solid ${isEdited ? accentColor : 'var(--color-border-subtle)'}`,
          }}
        >
          <textarea
            ref={textareaRef}
            value={displayPrompt}
            onChange={handleTextChange}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Connect nodes upstream to assemble prompt..."
            className="w-full min-h-[240px] max-h-[360px] text-[11px] font-mono leading-relaxed resize-y outline-none"
            style={{
              display: 'block',
              background: 'var(--color-bg-elevated)',
              color: hasContent ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
              padding: '12px 12px 12px 16px',
            }}
          />
        </div>

        {/* Character count */}
        <div className="flex items-center justify-between text-[9px] text-muted px-1">
          <span>{editedPrompt.length} chars</span>
          {isEdited && assembledPrompt && (
            <span>
              {editedPrompt.length - assembledPrompt.length > 0 ? '+' : ''}
              {editedPrompt.length - assembledPrompt.length} from original
            </span>
          )}
        </div>

        {/* Negative Prompt Section */}
        {(hasNegative || showNegative) && (
          <div
            className="space-y-2 border-t border-white/10"
            style={{ marginTop: '12px', paddingTop: '10px' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium" style={{ color: negativeColor }}>
                  Negative
                </span>
                {isNegativeEdited && (
                  <div
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium"
                    style={{ background: `${negativeColor}30`, color: negativeColor }}
                  >
                    Edited
                  </div>
                )}
              </div>
              {isNegativeEdited && (
                <button
                  onClick={handleResetNegative}
                  className="px-2 py-0.5 rounded text-[9px] transition-colors"
                  style={{ color: negativeColor }}
                  title="Reset negative to auto-assembled"
                >
                  Reset
                </button>
              )}
            </div>
            <div
              className="relative rounded-lg overflow-hidden"
              style={{
                border: `1px solid ${isNegativeEdited ? negativeColor : 'var(--color-border-subtle)'}`,
              }}
            >
              <textarea
                value={displayNegative}
                onChange={handleNegativeChange}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                placeholder="No negative prompt"
                className="w-full min-h-[60px] max-h-[150px] text-[10px] font-mono leading-relaxed resize-y outline-none"
                style={{
                  display: 'block',
                  background: 'var(--color-bg-elevated)',
                  color: hasNegative ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
                  padding: '8px 8px 8px 16px',
                }}
              />
            </div>
            <div className="text-[9px] text-muted px-1">
              {editedNegative.length} chars
            </div>
          </div>
        )}

        {/* Toggle negative section if hidden */}
        {!hasNegative && !showNegative && (
          <button
            onClick={() => setShowNegative(true)}
            className="w-full py-1.5 text-[10px] text-muted hover:text-primary border border-dashed border-white/10 rounded hover:border-white/20 transition-colors"
          >
            + Add Negative Prompt
          </button>
        )}
      </div>
    </BaseNode>
  );
}
