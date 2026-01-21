import { useCallback, useState, useRef, useEffect } from 'react';
import { useStore, useViewport } from '@xyflow/react';
import { useGroupStore } from '@/stores/groupStore';

const PADDING = 16; // Padding around nodes
const BORDER_RADIUS = 12;
const HANDLE_BUFFER = 8; // Extra buffer for handles that extend beyond node bounds

interface EditingState {
  groupId: string;
  value: string;
}

export function GroupOverlay() {
  const groups = useGroupStore((state) => state.groups);
  const isolatedGroupId = useGroupStore((state) => state.isolatedGroupId);
  const isolateGroup = useGroupStore((state) => state.isolateGroup);
  const renameGroup = useGroupStore((state) => state.renameGroup);
  // Use nodeLookup for accurate measured dimensions
  const nodeLookup = useStore((state) => state.nodeLookup);
  const { x, y, zoom } = useViewport();

  const [editing, setEditing] = useState<EditingState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts (only when groupId changes, not on every keystroke)
  const editingGroupId = editing?.groupId;
  useEffect(() => {
    if (editingGroupId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingGroupId]);

  const handleDoubleClick = (groupId: string) => {
    // Toggle isolation
    if (isolatedGroupId === groupId) {
      isolateGroup(null);
    } else {
      isolateGroup(groupId);
    }
  };

  const handleLabelClick = (e: React.MouseEvent, groupId: string, currentName: string) => {
    e.stopPropagation();
    setEditing({ groupId, value: currentName });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editing) {
      setEditing({ ...editing, value: e.target.value });
    }
  };

  const handleInputBlur = () => {
    if (editing && editing.value.trim()) {
      renameGroup(editing.groupId, editing.value.trim());
    }
    setEditing(null);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setEditing(null);
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

        // Known explicit widths from BaseNode.tsx - use these as the authoritative source
        const expectedWidth = node.type === 'output' ? 280 : 220;
        const width = Math.max(node.measured?.width ?? expectedWidth, expectedWidth);

        // For height, use measured if available, otherwise use a small default
        // The actual height will be determined by content
        const height = node.measured?.height ?? 80;

        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + width);
        maxY = Math.max(maxY, node.position.y + height);
      }

      if (minX === Infinity) return null;

      return {
        x: minX - PADDING,
        y: minY - PADDING,
        width: maxX - minX + PADDING * 2 + HANDLE_BUFFER,
        height: maxY - minY + PADDING * 2,
      };
    },
    [nodeLookup]
  );

  // Don't render anything if no groups
  if (groups.length === 0) return null;

  return (
    <>
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
                {/* Background fill - no pointer events so clicks pass through to nodes */}
                <rect
                  x={bounds.x}
                  y={bounds.y}
                  width={bounds.width}
                  height={bounds.height}
                  rx={BORDER_RADIUS}
                  ry={BORDER_RADIUS}
                  fill={isIsolated ? `${group.color}15` : `${group.color}08`}
                  stroke="none"
                  style={{ pointerEvents: 'none' }}
                />
                {/* Border stroke - captures double-click for isolation toggle */}
                <rect
                  x={bounds.x}
                  y={bounds.y}
                  width={bounds.width}
                  height={bounds.height}
                  rx={BORDER_RADIUS}
                  ry={BORDER_RADIUS}
                  fill="none"
                  stroke={group.color}
                  strokeWidth={isIsolated ? 3 : 2}
                  strokeDasharray={isIsolated ? 'none' : '8 4'}
                  strokeOpacity={isIsolated ? 0.8 : 0.5}
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  onDoubleClick={() => handleDoubleClick(group.id)}
                />
              </g>
            );
          })}
        </g>
      </svg>

      {/* HTML overlay for group labels - easier to handle input editing */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'visible',
          zIndex: 10,
        }}
      >
        {groups.map((group) => {
          const bounds = getGroupBounds(group.nodeIds);
          if (!bounds) return null;

          const isEditing = editing?.groupId === group.id;

          // Transform bounds to screen coordinates
          const screenX = (bounds.x + 8) * zoom + x;
          const screenY = (bounds.y - 18) * zoom + y;

          return (
            <div
              key={group.id}
              style={{
                position: 'absolute',
                left: screenX,
                top: screenY,
                pointerEvents: 'auto',
              }}
            >
              {isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editing.value}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onKeyDown={handleInputKeyDown}
                  style={{
                    background: 'var(--color-bg-panel)',
                    border: `1px solid ${group.color}`,
                    borderRadius: 4,
                    padding: '2px 6px',
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: 'system-ui, sans-serif',
                    color: group.color,
                    outline: 'none',
                    minWidth: 60,
                  }}
                />
              ) : (
                <span
                  onClick={(e) => handleLabelClick(e, group.id, group.name)}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: 'system-ui, sans-serif',
                    color: group.color,
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: 4,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${group.color}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {group.name}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
