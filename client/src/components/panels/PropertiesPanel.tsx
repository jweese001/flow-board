import { useFlowStore } from '@/stores/flowStore';
import { useUIStore } from '@/stores/uiStore';
import { NODE_COLORS, NODE_LABELS, SHOT_PRESET_LABELS, type NodeType } from '@/types/nodes';
import { XIcon } from '@/components/ui/Icons';

export function PropertiesPanel() {
  const { nodes, updateNodeData } = useFlowStore();
  const { selectedNodeId, selectNode, propertiesPanelOpen } = useUIStore();

  if (!propertiesPanelOpen || !selectedNodeId) {
    return null;
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  if (!selectedNode) {
    return null;
  }

  const nodeType = selectedNode.type as NodeType;
  const color = NODE_COLORS[nodeType];
  const label = NODE_LABELS[nodeType];

  const handleChange = (field: string, value: string | number) => {
    updateNodeData(selectedNodeId, { [field]: value });
  };

  return (
    <aside
      className="h-full flex flex-col"
      style={{
        width: 'var(--panel-width)',
        background: 'var(--color-bg-panel)',
        borderLeft: '1px solid var(--color-border-subtle)',
        boxShadow: 'var(--shadow-panel)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: `${color}20`,
            color: color,
          }}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: color }}
          />
        </div>
        <div className="flex-1">
          <div
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color }}
          >
            {label}
          </div>
          <div className="text-sm font-semibold text-primary">
            {(selectedNode.data as any).name || 'Node Properties'}
          </div>
        </div>
        <button
          onClick={() => selectNode(null)}
          className="w-7 h-7 rounded-md flex items-center justify-center text-muted hover:text-primary hover:bg-bg-hover transition-colors"
        >
          <XIcon size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Render fields based on node type */}
        {renderNodeFields(nodeType, selectedNode.data as any, handleChange)}
      </div>
    </aside>
  );
}

function renderNodeFields(
  nodeType: NodeType,
  data: any,
  onChange: (field: string, value: string | number) => void
) {
  switch (nodeType) {
    case 'character':
    case 'setting':
    case 'prop':
    case 'style':
    case 'extras':
      return (
        <>
          <FieldInput
            label="Name"
            value={data.name || ''}
            onChange={(v) => onChange('name', v)}
          />
          <FieldTextarea
            label="Description"
            value={data.description || ''}
            onChange={(v) => onChange('description', v)}
            placeholder="Enter description..."
          />
        </>
      );

    case 'shot':
      return (
        <>
          <FieldInput
            label="Name"
            value={data.name || ''}
            onChange={(v) => onChange('name', v)}
          />
          <FieldSelect
            label="Shot Type"
            value={data.preset || 'medium'}
            options={Object.entries(SHOT_PRESET_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
            onChange={(v) => onChange('preset', v)}
          />
          <FieldTextarea
            label="Notes"
            value={data.description || ''}
            onChange={(v) => onChange('description', v)}
            placeholder="Additional framing notes..."
          />
        </>
      );

    case 'action':
      return (
        <FieldTextarea
          label="Action Description"
          value={data.content || ''}
          onChange={(v) => onChange('content', v)}
          placeholder="Describe what's happening in the scene..."
          rows={6}
        />
      );

    case 'output':
      return (
        <div className="text-sm text-muted">
          <p className="mb-2">
            The Output node collects all connected nodes and assembles them into a prompt.
          </p>
          <p>
            Connect Character, Setting, Style, Action, and Shot nodes to build your prompt.
          </p>
        </div>
      );

    default:
      return (
        <div className="text-sm text-muted">
          No properties available for this node type.
        </div>
      );
  }
}

// Field Components

interface FieldInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function FieldInput({ label, value, onChange, placeholder }: FieldInputProps) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted mb-2">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-md text-sm text-primary outline-none transition-all"
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-subtle)',
        }}
      />
    </div>
  );
}

interface FieldTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

function FieldTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: FieldTextareaProps) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted mb-2">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 rounded-md text-sm font-mono text-primary outline-none resize-y transition-all"
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-subtle)',
          lineHeight: 1.6,
        }}
      />
      <div className="text-right text-[10px] text-muted mt-1 font-mono">
        {value.length} characters
      </div>
    </div>
  );
}

interface FieldSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function FieldSelect({ label, value, options, onChange }: FieldSelectProps) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-md text-sm text-primary outline-none cursor-pointer appearance-none transition-all"
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-subtle)',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 16px center',
          paddingRight: '40px',
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
