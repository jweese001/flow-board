import type { NodeProps } from '@xyflow/react';
import type { TextNode as TextNodeType, TextType } from '@/types/nodes';
import { TEXT_TYPE_LABELS } from '@/types/nodes';
import { BaseNode, NodeField } from './BaseNode';
import { MessageCircleIcon } from '../ui/Icons';

export function TextNode({ id, data, selected }: NodeProps<TextNodeType>) {
  return (
    <BaseNode
      nodeId={id}
      nodeType="text"
      name={data.name}
      selected={selected}
      showTargetHandle={true}
      icon={<MessageCircleIcon size={14} />}
    >
      <NodeField label="Type">
        {TEXT_TYPE_LABELS[data.textType as TextType]}
      </NodeField>
      {data.content && (
        <NodeField label="Text">
          <div className="line-clamp-3 text-xs italic">"{data.content}"</div>
        </NodeField>
      )}
      {data.mode === 'reserve-space' && (
        <div className="text-[10px] text-muted mt-1">(Space reserved)</div>
      )}
    </BaseNode>
  );
}
