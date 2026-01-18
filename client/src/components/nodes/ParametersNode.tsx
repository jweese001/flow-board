import type { NodeProps } from '@xyflow/react';
import type { ParametersNode as ParametersNodeType } from '@/types/nodes';
import { BaseNode, NodeField } from './BaseNode';
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

const ASPECT_RATIO_LABELS: Record<string, string> = {
  '1:1': '1:1 Square',
  '16:9': '16:9 Landscape',
  '9:16': '9:16 Portrait',
  '2:3': '2:3 Portrait',
  '3:2': '3:2 Landscape',
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
      <NodeField label="Model">
        <div>{MODEL_LABELS[data.model] || data.model}</div>
      </NodeField>
      <NodeField label="Aspect Ratio">
        <div>{ASPECT_RATIO_LABELS[data.aspectRatio] || data.aspectRatio}</div>
      </NodeField>
      {data.seed !== undefined && data.seed !== null && (
        <NodeField label="Seed">
          <div>{data.seed}</div>
        </NodeField>
      )}
    </BaseNode>
  );
}
