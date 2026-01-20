import type { NodeProps } from '@xyflow/react';
import type { CameraNode as CameraNodeType } from '@/types/nodes';
import {
  LENS_TYPE_LABELS,
  DEPTH_OF_FIELD_LABELS,
  FILM_STOCK_LABELS,
  VIGNETTE_LABELS,
} from '@/types/nodes';
import { BaseNode, NodeField } from './BaseNode';
import { ApertureIcon } from '../ui/Icons';

export function CameraNode({ id, data, selected }: NodeProps<CameraNodeType>) {
  // Build a compact summary of active settings
  const activeTags: string[] = [];

  if (data.lensType && data.lensType !== 'standard') {
    activeTags.push(LENS_TYPE_LABELS[data.lensType]);
  }
  if (data.depthOfField && data.depthOfField !== 'deep') {
    activeTags.push(DEPTH_OF_FIELD_LABELS[data.depthOfField]);
  }
  if (data.filmStock && data.filmStock !== 'digital') {
    activeTags.push(FILM_STOCK_LABELS[data.filmStock]);
  }
  if (data.vignette && data.vignette !== 'none') {
    activeTags.push(VIGNETTE_LABELS[data.vignette]);
  }

  return (
    <BaseNode
      nodeId={id}
      nodeType="camera"
      name={data.name}
      selected={selected}
      showTargetHandle={false}
      icon={<ApertureIcon size={14} />}
    >
      <NodeField label="Lens">
        {LENS_TYPE_LABELS[data.lensType] || 'Standard 50mm'}
      </NodeField>
      {activeTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {activeTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300"
            >
              {tag}
            </span>
          ))}
          {activeTags.length > 3 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400">
              +{activeTags.length - 3}
            </span>
          )}
        </div>
      )}
    </BaseNode>
  );
}
