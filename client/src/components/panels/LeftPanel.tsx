import { useState, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useFlowStore, generateNodeId } from '@/stores/flowStore';
import { useUIStore } from '@/stores/uiStore';
import { NODE_COLORS, NODE_LABELS, SHOT_PRESET_LABELS, PAGE_LAYOUT_LABELS, type NodeType, type PageLayout } from '@/types/nodes';
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
  HistoryIcon,
  PhotoIcon,
  LayoutIcon,
  TransformIcon,
} from '@/components/ui/Icons';
import { ProjectSection } from './ProjectSection';
import { SettingsSection } from './SettingsSection';
import { HistorySection } from './HistorySection';

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
  {
    type: 'reference',
    icon: <PhotoIcon size={14} />,
    defaultData: { label: 'Reference', name: 'Reference Image', imageType: 'character', imageUrl: undefined },
  },
  // Terminal Node
  {
    type: 'output',
    icon: <ImageIcon size={14} />,
    defaultData: { label: 'Output', promptPreview: '', status: 'idle' },
  },
  // Layout Node
  {
    type: 'page',
    icon: <LayoutIcon size={14} />,
    defaultData: { label: 'Page', name: 'Page Layout', layout: '4-up', gutter: 8, backgroundColor: '#ffffff', panelImages: [], outputWidth: 1200, outputHeight: 1600 },
  },
  // Transform Node
  {
    type: 'transform',
    icon: <TransformIcon size={14} />,
    defaultData: { label: 'Transform', name: 'Transform', scale: 1, offsetX: 0, offsetY: 0, rotation: 0, flipH: false, flipV: false, alignment: 'center' },
  },
];

export function LeftPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['nodes', 'properties', 'projects']));
  const [searchQuery, setSearchQuery] = useState('');

  const { nodes, addNode, updateNodeData } = useFlowStore();
  const { selectedNodeId, selectNode } = useUIStore();
  const reactFlowInstance = useReactFlow();

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

  // Get the center of the visible viewport in flow coordinates
  const getViewportCenter = useCallback(() => {
    // Get the React Flow container element to know screen dimensions
    const container = document.querySelector('.react-flow');
    if (!container) {
      return { x: 250, y: 150 }; // Fallback position
    }

    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Convert screen coordinates to flow coordinates
    const position = reactFlowInstance.screenToFlowPosition({
      x: rect.left + centerX,
      y: rect.top + centerY,
    });

    return position;
  }, [reactFlowInstance]);

  const handleAddNode = (config: NodeTypeConfig) => {
    const center = getViewportCenter();
    // Add small random offset to prevent nodes from stacking exactly on top of each other
    const offset = (Math.random() - 0.5) * 50;
    const newNode = {
      id: generateNodeId(config.type),
      type: config.type,
      position: { x: center.x + offset, y: center.y + offset },
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
        <span className="text-sm font-semibold text-secondary">FlowBoard</span>
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

        {/* History Section */}
        <AccordionSection
          title="History"
          isExpanded={expandedSections.has('history')}
          onToggle={() => toggleSection('history')}
          icon={<HistoryIcon size={14} />}
        >
          <HistorySection />
        </AccordionSection>

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
              { value: 'gemini-pro', label: 'Gemini 3 Pro' },
              { value: 'gemini-flash', label: 'Gemini 2.5 Flash' },
              { value: 'sd3-large', label: 'SD3 Large (Stability)' },
              { value: 'sd3-large-turbo', label: 'SD3 Large Turbo (Stability)' },
              { value: 'sd3-medium', label: 'SD3 Medium (Stability)' },
              { value: 'sdxl-1.0', label: 'SDXL 1.0 (Stability)' },
              { value: 'flux-schnell', label: 'Flux Schnell (fal.ai)' },
              { value: 'flux-dev', label: 'Flux Dev (fal.ai)' },
              { value: 'turbo', label: 'Turbo (fal.ai)' },
              { value: 'sdxl-turbo', label: 'SDXL Turbo (fal.ai)' },
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
          <FieldSelect
            label="Resolution"
            value={data.resolution || '1K'}
            options={[
              { value: '1K', label: '1K (1024px)' },
              { value: '2K', label: '2K (2048px)' },
              { value: '4K', label: '4K (4096px)' },
            ]}
            onChange={(v) => onChange('resolution', v)}
          />
          <FieldSlider
            label="Temperature"
            value={data.temperature ?? 1.0}
            min={0}
            max={2}
            step={0.1}
            onChange={(v) => onChange('temperature', v)}
          />
          <FieldInput
            label="Seed (optional)"
            value={data.seed?.toString() || ''}
            onChange={(v) => onChange('seed', v ? parseInt(v, 10) : '')}
            placeholder="Random seed for reproducibility"
          />
          <FieldSelect
            label="Number of Images"
            value={String(data.numberOfImages || 1)}
            options={[
              { value: '1', label: '1 image' },
              { value: '2', label: '2 images' },
              { value: '3', label: '3 images' },
              { value: '4', label: '4 images' },
            ]}
            onChange={(v) => onChange('numberOfImages', parseInt(v, 10))}
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

    case 'reference':
      return (
        <div className="space-y-4">
          <FieldInput
            label="Name"
            value={data.name || ''}
            onChange={(v) => onChange('name', v)}
          />
          <FieldSelect
            label="Reference Type"
            value={data.imageType || 'character'}
            options={[
              { value: 'character', label: 'Character' },
              { value: 'setting', label: 'Setting / Environment' },
              { value: 'prop', label: 'Prop / Object' },
              { value: 'style', label: 'Style / Aesthetic' },
              { value: 'scene', label: 'Scene / Composition' },
              { value: 'mood', label: 'Mood / Atmosphere' },
            ]}
            onChange={(v) => onChange('imageType', v)}
          />
          <FieldTextarea
            label="Description (optional)"
            value={data.description || ''}
            onChange={(v) => onChange('description', v)}
            placeholder="Describe what this reference shows..."
            rows={2}
          />
        </div>
      );

    case 'output':
      return (
        <div className="text-sm text-muted leading-relaxed">
          Connect nodes to build your prompt. Click Generate on the node to create an image.
        </div>
      );

    case 'page':
      return (
        <div className="space-y-4">
          <FieldInput
            label="Name"
            value={data.name || ''}
            onChange={(v) => onChange('name', v)}
            placeholder="Page Layout"
          />
          <FieldSelect
            label="Layout"
            value={data.layout || '4-up'}
            options={Object.entries(PAGE_LAYOUT_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
            onChange={(v) => onChange('layout', v as PageLayout)}
          />
          <FieldSlider
            label="Gutter (px)"
            value={data.gutter ?? 8}
            min={0}
            max={32}
            step={2}
            onChange={(v) => onChange('gutter', v)}
          />
          <FieldInput
            label="Background Color"
            value={data.backgroundColor || '#ffffff'}
            onChange={(v) => onChange('backgroundColor', v)}
            placeholder="#ffffff"
          />
          <div className="grid grid-cols-2 gap-3">
            <FieldInput
              label="Width (px)"
              value={String(data.outputWidth || 1200)}
              onChange={(v) => onChange('outputWidth', parseInt(v, 10) || 1200)}
              placeholder="1200"
            />
            <FieldInput
              label="Height (px)"
              value={String(data.outputHeight || 1600)}
              onChange={(v) => onChange('outputHeight', parseInt(v, 10) || 1600)}
              placeholder="1600"
            />
          </div>
        </div>
      );

    case 'transform':
      return (
        <div className="space-y-4">
          <FieldInput
            label="Name"
            value={data.name || ''}
            onChange={(v) => onChange('name', v)}
            placeholder="Transform"
          />
          <FieldSlider
            label="Scale"
            value={data.scale ?? 1}
            min={0.1}
            max={3}
            step={0.1}
            onChange={(v) => onChange('scale', v)}
          />
          <div className="grid grid-cols-2 gap-3">
            <FieldSlider
              label="Offset X"
              value={data.offsetX ?? 0}
              min={-100}
              max={100}
              step={5}
              onChange={(v) => onChange('offsetX', v)}
            />
            <FieldSlider
              label="Offset Y"
              value={data.offsetY ?? 0}
              min={-100}
              max={100}
              step={5}
              onChange={(v) => onChange('offsetY', v)}
            />
          </div>
          <FieldSlider
            label="Rotation"
            value={data.rotation ?? 0}
            min={0}
            max={360}
            step={15}
            onChange={(v) => onChange('rotation', v)}
          />
          <FieldSelect
            label="Alignment"
            value={data.alignment || 'center'}
            options={[
              { value: 'center', label: 'Center' },
              { value: 'top', label: 'Top' },
              { value: 'bottom', label: 'Bottom' },
              { value: 'left', label: 'Left' },
              { value: 'right', label: 'Right' },
              { value: 'top-left', label: 'Top Left' },
              { value: 'top-right', label: 'Top Right' },
              { value: 'bottom-left', label: 'Bottom Left' },
              { value: 'bottom-right', label: 'Bottom Right' },
            ]}
            onChange={(v) => onChange('alignment', v)}
          />
          <div className="flex gap-3">
            <FieldCheckbox
              label="Flip Horizontal"
              checked={data.flipH || false}
              onChange={(v) => onChange('flipH', v as unknown as number)}
            />
            <FieldCheckbox
              label="Flip Vertical"
              checked={data.flipV || false}
              onChange={(v) => onChange('flipV', v as unknown as number)}
            />
          </div>
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

interface FieldSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

function FieldSlider({ label, value, min, max, step, onChange }: FieldSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: '8px', marginLeft: '4px', marginRight: '4px' }}
      >
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">
          {label}
        </label>
        <span className="text-xs font-mono text-secondary">{value.toFixed(1)}</span>
      </div>
      <div
        className="relative h-8 flex items-center"
        style={{ marginLeft: '4px', marginRight: '4px' }}
      >
        {/* Track background */}
        <div
          className="absolute w-full h-2 rounded-full"
          style={{ background: 'var(--color-bg-elevated)' }}
        />
        {/* Filled track */}
        <div
          className="absolute h-2 rounded-full"
          style={{
            background: 'var(--color-node-parameters)',
            width: `${percentage}%`,
          }}
        />
        {/* Invisible range input for interaction */}
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute w-full h-8 opacity-0 cursor-pointer"
          style={{ zIndex: 2 }}
        />
        {/* Visual thumb */}
        <div
          className="absolute w-4 h-4 rounded-full border-2 pointer-events-none"
          style={{
            background: 'var(--color-bg-panel)',
            borderColor: 'var(--color-node-parameters)',
            left: `calc(${percentage}% - 8px)`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        />
      </div>
      <div
        className="flex justify-between text-[10px] text-muted mt-1"
        style={{ marginLeft: '4px', marginRight: '4px' }}
      >
        <span>Precise</span>
        <span>Creative</span>
      </div>
    </div>
  );
}

interface FieldCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function FieldCheckbox({ label, checked, onChange }: FieldCheckboxProps) {
  return (
    <label
      className="flex items-center gap-2 cursor-pointer flex-1"
      onClick={() => onChange(!checked)}
    >
      <div
        className="w-5 h-5 rounded flex items-center justify-center transition-colors"
        style={{
          background: checked ? 'var(--color-node-transform)' : 'var(--color-bg-elevated)',
          border: `1px solid ${checked ? 'var(--color-node-transform)' : 'var(--color-border-subtle)'}`,
        }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span className="text-xs text-secondary">{label}</span>
    </label>
  );
}
