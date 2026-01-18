import type { NodeProps } from '@xyflow/react';
import type { CharacterNode as CharacterNodeType } from '@/types/nodes';
import { BaseNode, NodeField } from './BaseNode';
import { UserIcon } from '../ui/Icons';

export function CharacterNode({ id, data, selected }: NodeProps<CharacterNodeType>) {
  return (
    <BaseNode
      nodeId={id}
      nodeType="character"
      name={data.name}
      selected={selected}
      showTargetHandle={false}
      icon={<UserIcon size={14} />}
    >
      <NodeField label="Description">
        <div className="line-clamp-3">{data.description}</div>
      </NodeField>
    </BaseNode>
  );
}
