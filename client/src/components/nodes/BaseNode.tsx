import { type ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeType } from '@/types/nodes';
import { NODE_COLORS, NODE_LABELS } from '@/types/nodes';
import { useUIStore } from '@/stores/uiStore';
import { ChevronDownIcon } from '@/components/ui/Icons';

interface BaseNodeProps {
  nodeId: string;
  nodeType: NodeType;
  name: string;
  selected?: boolean;
  children: ReactNode;
  showSourceHandle?: boolean;
  showTargetHandle?: boolean;
  icon: ReactNode;
  additionalHandles?: ReactNode;
}

export function BaseNode({
  nodeId,
  nodeType,
  name,
  selected = false,
  children,
  showSourceHandle = true,
  showTargetHandle = true,
  icon,
  additionalHandles,
}: BaseNodeProps) {
  const color = NODE_COLORS[nodeType];
  const label = NODE_LABELS[nodeType];
  const toggleNodeCollapsed = useUIStore((state) => state.toggleNodeCollapsed);
  const collapsed = useUIStore((state) => !!state.collapsedNodes[nodeId]);

  const handleCollapseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNodeCollapsed(nodeId);
  };

  return (
    <div
      className="relative"
      style={{
        width: nodeType === 'output' ? 280 : 220,
      }}
    >
      {/* Target Handle (left side) */}
      {showTargetHandle && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            background: 'var(--color-bg-panel)',
            borderColor: color,
            borderWidth: 2,
          }}
        />
      )}

      {/* Node Container */}
      <div
        className="rounded-xl overflow-hidden transition-shadow duration-200"
        style={{
          background: 'var(--color-bg-panel)',
          border: `1px solid ${selected ? color : 'var(--color-border-medium)'}`,
          boxShadow: selected
            ? `var(--shadow-node), 0 0 30px ${color}40`
            : 'var(--shadow-node)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3"
          style={{
            background: `${color}14`,
            padding: '12px 16px',
          }}
        >
          {/* Icon */}
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{
              background: `${color}33`,
              color: color,
            }}
          >
            {icon}
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <div
              className="text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: color }}
            >
              {label}
            </div>
            <div className="text-xs font-semibold text-primary truncate">
              {name}
            </div>
          </div>

          {/* Collapse Toggle */}
          <button
            onClick={handleCollapseClick}
            className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
            style={{
              color: 'var(--color-text-muted)',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-bg-hover)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-muted)';
            }}
          >
            <ChevronDownIcon
              size={14}
              className={`transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
            />
          </button>
        </div>

        {/* Body - collapsible */}
        {!collapsed && (
          <div
            style={{
              borderTop: '1px solid var(--color-border-subtle)',
              padding: '16px',
            }}
          >
            {children}
          </div>
        )}
      </div>

      {/* Source Handle (right side) */}
      {showSourceHandle && (
        <Handle
          type="source"
          position={Position.Right}
          style={{
            background: 'var(--color-bg-panel)',
            borderColor: color,
            borderWidth: 2,
          }}
        />
      )}

      {/* Additional custom handles */}
      {additionalHandles}
    </div>
  );
}

// Reusable field component for node bodies
interface NodeFieldProps {
  label: string;
  children: ReactNode;
}

export function NodeField({ label, children }: NodeFieldProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        className="text-[10px] font-semibold uppercase tracking-wide text-muted"
        style={{ marginBottom: '8px', marginLeft: '8px' }}
      >
        {label}
      </div>
      <div
        className="font-mono text-[11px] leading-relaxed text-secondary rounded-lg"
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-subtle)',
          padding: '12px 16px',
        }}
      >
        {children}
      </div>
    </div>
  );
}
