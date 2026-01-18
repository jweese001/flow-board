import type { NodeProps } from '@xyflow/react';
import type { ParametersNode as ParametersNodeType } from '@/types/nodes';
import { BaseNode } from './BaseNode';
import { SlidersIcon } from '../ui/Icons';

const MODEL_LABELS: Record<string, string> = {
  mock: 'Mock',
  'gemini-pro': 'Gemini 3 Pro',
  'gemini-flash': 'Gemini 2.5 Flash',
  'flux-schnell': 'Flux Schnell',
  'flux-dev': 'Flux Dev',
  'turbo': 'Turbo',
  'sdxl-turbo': 'SDXL Turbo',
};

export function ParametersNode({ id, data, selected }: NodeProps<ParametersNodeType>) {
  return (
    <BaseNode
      nodeId={id}
      nodeType="parameters"
      name="Parameters"
      selected={selected}
      showTargetHandle={false}
      icon={<SlidersIcon size={14} />}
    >
      <div className="space-y-2 text-[11px]">
        {/* Row 1: Model */}
        <div className="flex justify-between">
          <span className="text-muted">Model</span>
          <span className="text-secondary font-medium">{MODEL_LABELS[data.model] || data.model}</span>
        </div>

        {/* Row 2: Aspect & Resolution */}
        <div className="flex justify-between">
          <span className="text-muted">Output</span>
          <span className="text-secondary font-medium">
            {data.aspectRatio || '1:1'} @ {data.resolution || '1K'}
          </span>
        </div>

        {/* Row 3: Temperature */}
        {data.temperature !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted">Temperature</span>
            <span className="text-secondary font-medium">{data.temperature.toFixed(1)}</span>
          </div>
        )}

        {/* Row 4: Count & Seed */}
        <div className="flex justify-between">
          <span className="text-muted">Images</span>
          <span className="text-secondary font-medium">
            {data.numberOfImages || 1}
            {data.seed !== undefined && data.seed !== null && (
              <span className="text-muted ml-2">seed: {data.seed}</span>
            )}
          </span>
        </div>
      </div>
    </BaseNode>
  );
}
