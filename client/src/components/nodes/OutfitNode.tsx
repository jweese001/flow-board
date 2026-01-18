import type { NodeProps } from '@xyflow/react';
import type { OutfitNode as OutfitNodeType } from '@/types/nodes';
import { BaseNode, NodeField } from './BaseNode';
import { ShirtIcon } from '../ui/Icons';

export function OutfitNode({ id, data, selected }: NodeProps<OutfitNodeType>) {
  return (
    <BaseNode
      nodeId={id}
      nodeType="outfit"
      name={data.name}
      selected={selected}
      icon={<ShirtIcon size={14} />}
    >
      <NodeField label="Description">
        <div className="line-clamp-3">{data.description}</div>
      </NodeField>
    </BaseNode>
  );
}
