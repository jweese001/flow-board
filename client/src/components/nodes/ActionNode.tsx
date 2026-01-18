import type { NodeProps } from '@xyflow/react';
import type { ActionNode as ActionNodeType } from '@/types/nodes';
import { BaseNode, NodeField } from './BaseNode';
import { BoltIcon } from '../ui/Icons';

export function ActionNode({ id, data, selected }: NodeProps<ActionNodeType>) {
  return (
    <BaseNode
      nodeId={id}
      nodeType="action"
      name="Scene Action"
      selected={selected}
      icon={<BoltIcon size={14} />}
    >
      <NodeField label="Action">
        <div className="line-clamp-4">{data.content}</div>
      </NodeField>
    </BaseNode>
  );
}
