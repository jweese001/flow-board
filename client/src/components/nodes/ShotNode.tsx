import type { NodeProps } from '@xyflow/react';
import type { ShotNode as ShotNodeType, ShotPreset } from '@/types/nodes';
import { SHOT_PRESET_LABELS } from '@/types/nodes';
import { BaseNode, NodeField } from './BaseNode';
import { CameraIcon } from '../ui/Icons';

export function ShotNode({ id, data, selected }: NodeProps<ShotNodeType>) {
  return (
    <BaseNode
      nodeId={id}
      nodeType="shot"
      name={data.name}
      selected={selected}
      showTargetHandle={true}
      icon={<CameraIcon size={14} />}
    >
      <NodeField label="Shot Type">
        {SHOT_PRESET_LABELS[data.preset as ShotPreset]}
      </NodeField>
      {data.description && (
        <NodeField label="Notes">
          <div className="line-clamp-2">{data.description}</div>
        </NodeField>
      )}
    </BaseNode>
  );
}
