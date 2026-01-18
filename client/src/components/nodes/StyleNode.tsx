import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { StyleNode as StyleNodeType } from '@/types/nodes';
import { NODE_COLORS } from '@/types/nodes';
import { BaseNode, NodeField } from './BaseNode';
import { PaletteIcon } from '../ui/Icons';

export function StyleNode({ id, data, selected }: NodeProps<StyleNodeType>) {
  // Reference handle on left for connecting Reference nodes
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
      nodeType="style"
      name={data.name}
      selected={selected}
      showTargetHandle={false}
      icon={<PaletteIcon size={14} />}
      additionalHandles={referenceHandle}
    >
      <NodeField label="Description">
        <div className="line-clamp-3">{data.description}</div>
      </NodeField>
    </BaseNode>
  );
}
