import { useState } from 'react';
import { useFlowStore, generateNodeId } from '@/stores/flowStore';
import { useUIStore } from '@/stores/uiStore';
import { NODE_COLORS, NODE_LABELS, SHOT_PRESET_LABELS, type NodeType } from '@/types/nodes';
import {
  UserIcon,
  HomeIcon,
  BoxIcon,
  PaletteIcon,
  CameraIcon,
  BoltIcon,
  ImageIcon,
  SearchIcon,
  PlusIcon,
  ChevronDownIcon,
  XIcon,
  PanelLeftIcon,
  FolderIcon,
  SettingsIcon,
  SlidersIcon,
  BanIcon,
  ShirtIcon,
  UsersIcon,
  PencilIcon,
} from '@/components/ui/Icons';
import { ProjectSection } from './ProjectSection';
import { SettingsSection } from './SettingsSection';

interface NodeTypeConfig {
  type: NodeType;
  icon: React.ReactNode;
  defaultData: Record<string, unknown>;
}

const NODE_CONFIGS: NodeTypeConfig[] = [
  // Asset Nodes
  {
    type: 'character',
    icon: <UserIcon size={14} />,
    defaultData: { label: 'Character', name: 'New Character', description: 'Character description...' },
  },
  {
    type: 'setting',
    icon: <HomeIcon size={14} />,
    defaultData: { label: 'Setting', name: 'New Setting', description: 'Setting description...' },
  },
  {
    type: 'prop',
    icon: <BoxIcon size={14} />,
    defaultData: { label: 'Prop', name: 'New Prop', description: 'Prop description...' },
  },
  {
    type: 'style',
    icon: <PaletteIcon size={14} />,
    defaultData: { label: 'Style', name: 'New Style', description: 'Style description...' },
  },
  {
    type: 'extras',
    icon: <UsersIcon size={14} />,
    defaultData: { label: 'Extras', name: 'Background Extras', description: 'Crowd of people, busy street...' },
  },
  // Modifier Nodes
  {
    type: 'shot',
    icon: <CameraIcon size={14} />,
    defaultData: { label: 'Shot', name: 'New Shot', preset: 'medium', description: '' },
  },
  {
    type: 'outfit',
    icon: <ShirtIcon size={14} />,
    defaultData: { label: 'Outfit', name: 'New Outfit', description: 'Outfit description...' },
  },
  // Scene Nodes
  {
    type: 'action',
    icon: <BoltIcon size={14} />,
    defaultData: { label: 'Action', content: 'Describe the action...' },
  },
  // Technical Nodes
  {
    type: 'negative',
    icon: <BanIcon size={14} />,
    defaultData: { label: 'Negative', name: 'Negative Prompt', content: 'blurry, low quality, distorted...' },
  },
  {
    type: 'parameters',
    icon: <SlidersIcon size={14} />,
    defaultData: { label: 'Parameters', model: 'mock', aspectRatio: '1:1', seed: undefined },
  },
  {
    type: 'edit',
    icon: <PencilIcon size={14} />,
    defaultData: { label: 'Edit', refinement: 'Make the colors more vibrant...' },
  },
  // Terminal Node
  {
    type: 'output',
    icon: <ImageIcon size={14} />,
    defaultData: { label: 'Output', promptPreview: '', status: 'idle' },
  },
];

export function LeftPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['nodes', 'properties', 'projects']));
  const [searchQuery, setSearchQuery] = useState('');

  const { nodes, addNode, updateNodeData } = useFlowStore();
  const { selectedNodeId, selectNode } = useUIStore();

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleAddNode = (config: NodeTypeConfig) => {
    const offset = nodes.length * 20;
    const newNode = {
      id: generateNodeId(config.type),
      type: config.type,
      position: { x: 250 + offset, y: 150 + offset },
      data: { ...config.defaultData },
    };
    addNode(newNode as any);
  };

  const handleChange = (field: string, value: string | number) => {
    if (selectedNodeId) {
      updateNodeData(selectedNodeId, { [field]: value });
    }
  };

  const filteredConfigs = NODE_CONFIGS.filter((config) =>
    NODE_LABELS[config.type].toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isCollapsed) {
    return (
      <div
        className="h-full flex flex-col items-center py-4"
        style={{
          width: '52px',
          background: 'var(--color-bg-panel)',
          borderRight: '1px solid var(--color-border-subtle)',
        }}
      >
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-muted hover:text-primary hover:bg-bg-hover transition-colors"
          title="Expand panel"
        >
          <PanelLeftIcon size={18} />
        </button>
      </div>
    );
  }

  return (
    <aside
      className="h-full flex flex-col"
      style={{
        width: '300px',
        background: 'var(--color-bg-panel)',
        borderRight: '1px solid var(--color-border-subtle)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <span className="text-sm font-semibold text-secondary">PromptFlow</span>
        <button
          onClick={() => setIsCollapsed(true)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-primary hover:bg-bg-hover transition-colors"
          title="Collapse panel"
        >
          <PanelLeftIcon size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Projects Section */}
        <AccordionSection
          title="Projects"
          isExpanded={expandedSections.has('projects')}
          onToggle={() => toggleSection('projects')}
          icon={<FolderIcon size={14} />}
        >
          <ProjectSection />
        </AccordionSection>

        {/* Add Nodes Section */}
        <AccordionSection
          title="Add Nodes"
          isExpanded={expandedSections.has('nodes')}
          onToggle={() => toggleSection('nodes')}
        >
          <div className="px-5 pb-4">
            {/* Search */}
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-3"
              style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <SearchIcon size={14} className="text-muted" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-primary"
              />
            </div>

            {/* Node List */}
            <div className="space-y-1">
              {filteredConfigs.map((config) => (
                <button
                  key={config.type}
                  onClick={() => handleAddNode(config)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-bg-hover text-left"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: `${NODE_COLORS[config.type]}20`,
                      color: NODE_COLORS[config.type],
                    }}
                  >
                    {config.icon}
                  </div>
                  <span className="text-sm font-medium text-primary flex-1">
                    {NODE_LABELS[config.type]}
                  </span>
                  <PlusIcon size={14} className="text-muted" />
                </button>
              ))}
            </div>
          </div>
        </AccordionSection>

        {/* Properties Section */}
        {selectedNode && (
          <AccordionSection
            title="Properties"
            subtitle={NODE_LABELS[selectedNode.type as NodeType]}
            color={NODE_COLORS[selectedNode.type as NodeType]}
            isExpanded={expandedSections.has('properties')}
            onToggle={() => toggleSection('properties')}
            onClose={() => selectNode(null)}
          >
            <div className="px-5 pb-4">
              {renderNodeFields(selectedNode.type as NodeType, selectedNode.data as any, handleChange)}
            </div>
          </AccordionSection>
        )}

        {/* Settings Section */}
        <AccordionSection
          title="Settings"
          isExpanded={expandedSections.has('settings')}
          onToggle={() => toggleSection('settings')}
          icon={<SettingsIcon size={14} />}
        >
          <SettingsSection />
        </AccordionSection>
      </div>
    </aside>
  );
}

// Accordion Section Component
interface AccordionSectionProps {
  title: string;
  subtitle?: string;
  color?: string;
  icon?: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  onClose?: () => void;
  children: React.ReactNode;
}

function AccordionSection({
  title,
  subtitle,
  color,
  icon,
  isExpanded,
  onToggle,
  onClose,
  children,
}: AccordionSectionProps) {
  return (
    <div style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-bg-hover transition-colors text-left"
      >
        <ChevronDownIcon
          size={14}
          className={`text-muted transition-transform ${isExpanded ? '' : '-rotate-90'}`}
        />
        {icon && <span className="text-muted">{icon}</span>}
        <span className="text-sm font-semibold text-secondary flex-1">{title}</span>
        {subtitle && (
          <span
            className="text-xs font-medium px-2 py-1 rounded-md"
            style={{
              background: color ? `${color}20` : 'var(--color-bg-elevated)',
              color: color || 'var(--color-text-muted)',
            }}
          >
            {subtitle}
          </span>
        )}
        {onClose && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-6 h-6 rounded-md flex items-center justify-center text-muted hover:text-primary hover:bg-bg-hover"
          >
            <XIcon size={14} />
          </button>
        )}
      </button>
      {isExpanded && children}
    </div>
  );
}

// Field rendering based on node type
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
        <div className="space-y-4">
          <FieldInput label="Name" value={data.name || ''} onChange={(v) => onChange('name', v)} />
          <FieldTextarea
            label="Description"
            value={data.description || ''}
            onChange={(v) => onChange('description', v)}
            placeholder="Enter description..."
          />
        </div>
      );

    case 'shot':
      return (
        <div className="space-y-4">
          <FieldInput label="Name" value={data.name || ''} onChange={(v) => onChange('name', v)} />
          <FieldSelect
            label="Shot Type"
            value={data.preset || 'medium'}
            options={Object.entries(SHOT_PRESET_LABELS).map(([value, label]) => ({ value, label }))}
            onChange={(v) => onChange('preset', v)}
          />
          <FieldTextarea
            label="Notes"
            value={data.description || ''}
            onChange={(v) => onChange('description', v)}
            placeholder="Additional framing notes..."
            rows={2}
          />
        </div>
      );

    case 'action':
      return (
        <FieldTextarea
          label="Action"
          value={data.content || ''}
          onChange={(v) => onChange('content', v)}
          placeholder="Describe what's happening..."
          rows={5}
        />
      );

    case 'outfit':
      return (
        <div className="space-y-4">
          <FieldInput label="Name" value={data.name || ''} onChange={(v) => onChange('name', v)} />
          <FieldTextarea
            label="Description"
            value={data.description || ''}
            onChange={(v) => onChange('description', v)}
            placeholder="Describe the outfit..."
          />
        </div>
      );

    case 'negative':
      return (
        <div className="space-y-4">
          <FieldInput label="Name" value={data.name || ''} onChange={(v) => onChange('name', v)} />
          <FieldTextarea
            label="Negative Prompts"
            value={data.content || ''}
            onChange={(v) => onChange('content', v)}
            placeholder="blurry, low quality, distorted..."
            rows={4}
          />
        </div>
      );

    case 'parameters':
      return (
        <div className="space-y-4">
          <FieldSelect
            label="Model"
            value={data.model || 'mock'}
            options={[
              { value: 'mock', label: 'Mock (No API)' },
              { value: 'gemini-pro', label: 'Gemini Pro' },
              { value: 'gemini-flash', label: 'Gemini Flash' },
              { value: 'flux-schnell', label: 'Flux Schnell' },
              { value: 'flux-dev', label: 'Flux Dev' },
              { value: 'turbo', label: 'Turbo' },
              { value: 'sdxl-turbo', label: 'SDXL Turbo' },
            ]}
            onChange={(v) => onChange('model', v)}
          />
          <FieldSelect
            label="Aspect Ratio"
            value={data.aspectRatio || '1:1'}
            options={[
              { value: '1:1', label: '1:1 Square' },
              { value: '16:9', label: '16:9 Landscape' },
              { value: '9:16', label: '9:16 Portrait' },
              { value: '2:3', label: '2:3 Portrait' },
              { value: '3:2', label: '3:2 Landscape' },
            ]}
            onChange={(v) => onChange('aspectRatio', v)}
          />
          <FieldInput
            label="Seed (optional)"
            value={data.seed?.toString() || ''}
            onChange={(v) => onChange('seed', v ? parseInt(v, 10) : '')}
            placeholder="Random seed for reproducibility"
          />
        </div>
      );

    case 'edit':
      return (
        <FieldTextarea
          label="Refinement Instructions"
          value={data.refinement || ''}
          onChange={(v) => onChange('refinement', v)}
          placeholder="Make the colors more vibrant..."
          rows={4}
        />
      );

    case 'output':
      return (
        <div className="text-sm text-muted leading-relaxed">
          Connect nodes to build your prompt. Click Generate on the node to create an image.
        </div>
      );

    default:
      return <div className="text-sm text-muted">No properties available.</div>;
  }
}

// Field Components with better spacing
interface FieldInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function FieldInput({ label, value, onChange, placeholder }: FieldInputProps) {
  return (
    <div>
      <label
        className="block text-xs font-semibold uppercase tracking-wide text-muted"
        style={{ marginBottom: '8px', marginLeft: '4px' }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg text-sm text-primary outline-none transition-all"
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-subtle)',
          padding: '12px 16px',
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

function FieldTextarea({ label, value, onChange, placeholder, rows = 3 }: FieldTextareaProps) {
  return (
    <div>
      <label
        className="block text-xs font-semibold uppercase tracking-wide text-muted"
        style={{ marginBottom: '8px', marginLeft: '4px' }}
      >
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg text-sm font-mono text-primary outline-none resize-y transition-all"
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-subtle)',
          padding: '12px 16px',
          lineHeight: 1.6,
        }}
      />
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
    <div>
      <label
        className="block text-xs font-semibold uppercase tracking-wide text-muted"
        style={{ marginBottom: '8px', marginLeft: '4px' }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg text-sm text-primary outline-none cursor-pointer appearance-none transition-all"
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-subtle)',
          padding: '12px 16px',
          paddingRight: '44px',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 16px center',
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
