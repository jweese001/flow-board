import { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  nodeId: string | null;
  onClose: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onCopy: () => void;
}

export function ContextMenu({
  x,
  y,
  nodeId,
  onClose,
  onDelete,
  onDuplicate,
  onCopy,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu in viewport
  const adjustedX = Math.min(x, window.innerWidth - 180);
  const adjustedY = Math.min(y, window.innerHeight - 200);

  if (!nodeId) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] rounded-lg shadow-xl overflow-hidden"
      style={{
        left: adjustedX,
        top: adjustedY,
        background: 'var(--color-bg-panel)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="p-2">
        <ContextMenuItem
          label="Copy"
          shortcut="Cmd+C"
          onClick={onCopy}
        />
        <ContextMenuItem
          label="Duplicate"
          shortcut="Cmd+D"
          onClick={onDuplicate}
        />
        <ContextMenuDivider />
        <ContextMenuItem
          label="Delete"
          shortcut="Del"
          onClick={onDelete}
          danger
        />
      </div>
    </div>
  );
}

interface ContextMenuItemProps {
  label: string;
  shortcut?: string;
  onClick: () => void;
  danger?: boolean;
}

function ContextMenuItem({ label, shortcut, onClick, danger }: ContextMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between text-sm transition-colors hover:bg-bg-hover text-left rounded-md"
      style={{
        color: danger ? 'var(--color-node-negative)' : 'var(--color-text-primary)',
        padding: '10px 14px',
      }}
    >
      <span>{label}</span>
      {shortcut && (
        <span className="text-xs text-muted ml-8">{shortcut}</span>
      )}
    </button>
  );
}

function ContextMenuDivider() {
  return (
    <div
      className="my-1.5 mx-2"
      style={{
        borderTop: '1px solid var(--color-border-subtle)',
      }}
    />
  );
}
