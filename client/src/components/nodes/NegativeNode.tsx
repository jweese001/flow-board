import type { NodeProps } from '@xyflow/react';
import type { NegativeNode as NegativeNodeType } from '@/types/nodes';
import { BaseNode, NodeField } from './BaseNode';
import { BanIcon } from '../ui/Icons';

export function NegativeNode({ id, data, selected }: NodeProps<NegativeNodeType>) {
  return (
    <BaseNode
      nodeId={id}
      nodeType="negative"
      name={data.name}
      selected={selected}
      showTargetHandle={false}
      icon={<BanIcon size={14} />}
    >
      <NodeField label="Avoid">
        <div className="line-clamp-3">{data.content}</div>
      </NodeField>
    </BaseNode>
  );
}
