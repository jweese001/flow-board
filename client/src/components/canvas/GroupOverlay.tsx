import { useCallback } from 'react';
import { useStore, useViewport } from '@xyflow/react';
import { useGroupStore } from '@/stores/groupStore';

const PADDING = 16; // Padding around nodes
const BORDER_RADIUS = 12;

export function GroupOverlay() {
  const groups = useGroupStore((state) => state.groups);
  const isolatedGroupId = useGroupStore((state) => state.isolatedGroupId);
  const isolateGroup = useGroupStore((state) => state.isolateGroup);
  // Use nodeLookup for accurate measured dimensions
  const nodeLookup = useStore((state) => state.nodeLookup);
  const { x, y, zoom } = useViewport();

  const handleDoubleClick = (groupId: string) => {
    // Toggle isolation
    if (isolatedGroupId === groupId) {
      isolateGroup(null);
    } else {
      isolateGroup(groupId);
    }
  };

  // Calculate bounding box for a group using nodeLookup for accurate dimensions
  const getGroupBounds = useCallback(
    (nodeIds: string[]) => {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const nodeId of nodeIds) {
        // Get node from nodeLookup which has accurate measured dimensions
        const node = nodeLookup.get(nodeId);
        if (!node) continue;

        // Use measured dimensions from React Flow's internal state
        const width = node.measured?.width ?? (node.type === 'output' ? 280 : 220);
        const height = node.measured?.height ?? (node.type === 'output' ? 400 : 180);

        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + width);
        maxY = Math.max(maxY, node.position.y + height);
      }

      if (minX === Infinity) return null;

      return {
        x: minX - PADDING,
        y: minY - PADDING,
        width: maxX - minX + PADDING * 2,
        height: maxY - minY + PADDING * 2,
      };
    },
    [nodeLookup]
  );

  // Don't render anything if no groups
  if (groups.length === 0) return null;

  return (
    <svg
      className="react-flow__group-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      <g transform={`translate(${x}, ${y}) scale(${zoom})`}>
        {groups.map((group) => {
        const bounds = getGroupBounds(group.nodeIds);
        if (!bounds) return null;

        const isIsolated = isolatedGroupId === group.id;

        return (
          <g key={group.id}>
            {/* Clickable background */}
            <rect
              x={bounds.x}
              y={bounds.y}
              width={bounds.width}
              height={bounds.height}
              rx={BORDER_RADIUS}
              ry={BORDER_RADIUS}
              fill={isIsolated ? `${group.color}15` : `${group.color}08`}
              stroke={group.color}
              strokeWidth={isIsolated ? 3 : 2}
              strokeDasharray={isIsolated ? 'none' : '8 4'}
              strokeOpacity={isIsolated ? 0.8 : 0.5}
              style={{ pointerEvents: 'all', cursor: 'pointer' }}
              onDoubleClick={() => handleDoubleClick(group.id)}
            />
            {/* Group label */}
            <text
              x={bounds.x + 8}
              y={bounds.y - 6}
              fill={group.color}
              fontSize={11}
              fontWeight={600}
              fontFamily="system-ui, sans-serif"
              style={{ pointerEvents: 'none' }}
            >
              {group.name}
            </text>
          </g>
        );
        })}
      </g>
    </svg>
  );
}
