import type { NodeProps } from '@xyflow/react';
import type { PropNode as PropNodeType } from '@/types/nodes';
import { BaseNode, NodeField } from './BaseNode';
import { BoxIcon } from '../ui/Icons';

export function PropNode({ id, data, selected }: NodeProps<PropNodeType>) {
  return (
    <BaseNode
      nodeId={id}
      nodeType="prop"
      name={data.name}
      selected={selected}
      showTargetHandle={false}
      icon={<BoxIcon size={14} />}
    >
      <NodeField label="Description">
        <div className="line-clamp-3">{data.description}</div>
      </NodeField>
    </BaseNode>
  );
}
