import type { NodeProps } from '@xyflow/react';
import type { EditNode as EditNodeType } from '@/types/nodes';
import { BaseNode, NodeField } from './BaseNode';
import { PencilIcon } from '../ui/Icons';

export function EditNode({ id, data, selected }: NodeProps<EditNodeType>) {
  return (
    <BaseNode
      nodeId={id}
      nodeType="edit"
      name="Edit"
      selected={selected}
      icon={<PencilIcon size={14} />}
    >
      <NodeField label="Refinement">
        <div className="line-clamp-3">{data.refinement}</div>
      </NodeField>
    </BaseNode>
  );
}
