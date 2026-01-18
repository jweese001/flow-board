import type { NodeProps } from '@xyflow/react';
import type { ExtrasNode as ExtrasNodeType } from '@/types/nodes';
import { BaseNode, NodeField } from './BaseNode';
import { UsersIcon } from '../ui/Icons';

export function ExtrasNode({ id, data, selected }: NodeProps<ExtrasNodeType>) {
  return (
    <BaseNode
      nodeId={id}
      nodeType="extras"
      name={data.name}
      selected={selected}
      showTargetHandle={false}
      icon={<UsersIcon size={14} />}
    >
      <NodeField label="Description">
        <div className="line-clamp-3">{data.description}</div>
      </NodeField>
    </BaseNode>
  );
}
