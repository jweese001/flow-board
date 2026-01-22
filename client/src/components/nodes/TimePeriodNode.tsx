import type { NodeProps } from '@xyflow/react';
import type { TimePeriodNode as TimePeriodNodeType } from '@/types/nodes';
import { ERA_PRESET_LABELS } from '@/types/nodes';
import { BaseNode, NodeField } from './BaseNode';
import { CalendarClockIcon } from '../ui/Icons';

export function TimePeriodNode({ id, data, selected }: NodeProps<TimePeriodNodeType>) {
  const eraLabel = data.eraPreset === 'custom'
    ? data.customEra || 'Custom Era'
    : ERA_PRESET_LABELS[data.eraPreset];

  return (
    <BaseNode
      nodeId={id}
      nodeType="timeperiod"
      name={data.name}
      selected={selected}
      showTargetHandle={false}
      icon={<CalendarClockIcon size={14} />}
    >
      <div className="space-y-2 text-[11px]">
        {/* Era */}
        <div className="flex justify-between">
          <span className="text-muted">Era</span>
          <span className="text-secondary font-medium">{eraLabel}</span>
        </div>

        {/* Region (if set) */}
        {data.region && (
          <div className="flex justify-between">
            <span className="text-muted">Region</span>
            <span className="text-secondary font-medium">{data.region}</span>
          </div>
        )}

        {/* Auto-negatives indicator */}
        <div className="flex justify-between">
          <span className="text-muted">Auto-Negatives</span>
          <span className={`font-medium ${data.useAutoNegatives ? 'text-green-400' : 'text-muted'}`}>
            {data.useAutoNegatives ? 'On' : 'Off'}
          </span>
        </div>

        {/* Description preview */}
        {data.description && (
          <NodeField label="Notes">
            <div className="line-clamp-2">{data.description}</div>
          </NodeField>
        )}
      </div>
    </BaseNode>
  );
}
