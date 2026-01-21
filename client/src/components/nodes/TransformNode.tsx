import type { NodeProps } from '@xyflow/react';
import type { TransformNode as TransformNodeType } from '@/types/nodes';
import { BaseNode } from './BaseNode';
import { TransformIcon } from '../ui/Icons';

export function TransformNode({ id, data, selected }: NodeProps<TransformNodeType>) {
  return (
    <BaseNode
      nodeId={id}
      nodeType="transform"
      name={data.name || 'Transform'}
      selected={selected}
      showTargetHandle={true}
      showSourceHandle={true}
      icon={<TransformIcon size={14} />}
    >
      <div className="space-y-2 text-[10px]">
        {/* Scale indicator */}
        <div className="flex items-center justify-between">
          <span className="text-muted">Scale</span>
          <span className="font-mono">{((data.scale || 1) * 100).toFixed(0)}%</span>
        </div>

        {/* Offset indicator */}
        {(data.offsetX !== 0 || data.offsetY !== 0) && (
          <div className="flex items-center justify-between">
            <span className="text-muted">Offset</span>
            <span className="font-mono">
              {data.offsetX || 0}, {data.offsetY || 0}
            </span>
          </div>
        )}

        {/* Rotation indicator */}
        {data.rotation !== 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted">Rotation</span>
            <span className="font-mono">{data.rotation || 0}°</span>
          </div>
        )}

        {/* Flip indicators */}
        {(data.flipH || data.flipV) && (
          <div className="flex items-center justify-between">
            <span className="text-muted">Flip</span>
            <span className="font-mono">
              {data.flipH && 'H'}
              {data.flipH && data.flipV && ' '}
              {data.flipV && 'V'}
            </span>
          </div>
        )}

        {/* Alignment indicator */}
        <div className="flex items-center justify-between">
          <span className="text-muted">Align</span>
          <span className="font-mono capitalize">{data.alignment || 'center'}</span>
        </div>

        {/* Opacity indicator */}
        {(data.opacity ?? 100) !== 100 && (
          <div className="flex items-center justify-between">
            <span className="text-muted">Opacity</span>
            <span className="font-mono">{data.opacity ?? 100}%</span>
          </div>
        )}
      </div>
    </BaseNode>
  );
}
