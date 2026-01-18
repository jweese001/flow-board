import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { CharacterNode as CharacterNodeType } from '@/types/nodes';
import { NODE_COLORS } from '@/types/nodes';
import { BaseNode, NodeField } from './BaseNode';
import { UserIcon } from '../ui/Icons';

export function CharacterNode({ id, data, selected }: NodeProps<CharacterNodeType>) {
  // Reference handle on left side for connecting Reference nodes
  const referenceHandle = (
    <Handle
      type="target"
      position={Position.Left}
      id="reference"
      style={{
        background: NODE_COLORS.reference,
        borderColor: NODE_COLORS.reference,
        borderWidth: 2,
      }}
      title="Connect reference image"
    />
  );

  return (
    <BaseNode
      nodeId={id}
      nodeType="character"
      name={data.name}
      selected={selected}
      showTargetHandle={false}
      icon={<UserIcon size={14} />}
      additionalHandles={referenceHandle}
    >
      <NodeField label="Description">
        <div className="line-clamp-3">{data.description}</div>
      </NodeField>
    </BaseNode>
  );
}
