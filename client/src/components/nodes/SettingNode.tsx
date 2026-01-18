import type { NodeProps } from '@xyflow/react';
import type { SettingNode as SettingNodeType } from '@/types/nodes';
import { BaseNode, NodeField } from './BaseNode';
import { HomeIcon } from '../ui/Icons';

export function SettingNode({ id, data, selected }: NodeProps<SettingNodeType>) {
  return (
    <BaseNode
      nodeId={id}
      nodeType="setting"
      name={data.name}
      selected={selected}
      showTargetHandle={false}
      icon={<HomeIcon size={14} />}
    >
      <NodeField label="Description">
        <div className="line-clamp-3">{data.description}</div>
      </NodeField>
    </BaseNode>
  );
}
