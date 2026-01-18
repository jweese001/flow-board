import type { NodeProps } from '@xyflow/react';
import type { StyleNode as StyleNodeType } from '@/types/nodes';
import { BaseNode, NodeField } from './BaseNode';
import { PaletteIcon } from '../ui/Icons';

export function StyleNode({ id, data, selected }: NodeProps<StyleNodeType>) {
  return (
    <BaseNode
      nodeId={id}
      nodeType="style"
      name={data.name}
      selected={selected}
      showTargetHandle={false}
      icon={<PaletteIcon size={14} />}
    >
      <NodeField label="Description">
        <div className="line-clamp-3">{data.description}</div>
      </NodeField>
    </BaseNode>
  );
}
