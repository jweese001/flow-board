import { useState } from 'react';
import { useFlowStore, generateNodeId } from '@/stores/flowStore';
import { NODE_COLORS, NODE_LABELS, type NodeType } from '@/types/nodes';
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
} from '@/components/ui/Icons';

interface NodeTypeConfig {
  type: NodeType;
  icon: React.ReactNode;
  defaultData: Record<string, unknown>;
}

const NODE_CONFIGS: NodeTypeConfig[] = [
  {
    type: 'character',
    icon: <UserIcon size={14} />,
    defaultData: {
      label: 'Character',
      name: 'New Character',
      description: 'Character description...',
    },
  },
  {
    type: 'setting',
    icon: <HomeIcon size={14} />,
    defaultData: {
      label: 'Setting',
      name: 'New Setting',
      description: 'Setting description...',
    },
  },
  {
    type: 'prop',
    icon: <BoxIcon size={14} />,
    defaultData: {
      label: 'Prop',
      name: 'New Prop',
      description: 'Prop description...',
    },
  },
  {
    type: 'style',
    icon: <PaletteIcon size={14} />,
    defaultData: {
      label: 'Style',
      name: 'New Style',
      description: 'Style description...',
    },
  },
  {
    type: 'shot',
    icon: <CameraIcon size={14} />,
    defaultData: {
      label: 'Shot',
      name: 'New Shot',
      preset: 'medium',
      description: '',
    },
  },
  {
    type: 'action',
    icon: <BoltIcon size={14} />,
    defaultData: {
      label: 'Action',
      content: 'Describe the action...',
    },
  },
  {
    type: 'output',
    icon: <ImageIcon size={14} />,
    defaultData: {
      label: 'Output',
      promptPreview: '',
      status: 'idle',
    },
  },
];

export function Sidebar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['nodes'])
  );
  const { addNode, nodes } = useFlowStore();

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
    // Calculate position based on existing nodes
    const offset = nodes.length * 20;
    const newNode = {
      id: generateNodeId(config.type),
      type: config.type,
      position: { x: 100 + offset, y: 100 + offset },
      data: { ...config.defaultData },
    };
    addNode(newNode as any);
  };

  const filteredConfigs = NODE_CONFIGS.filter((config) =>
    NODE_LABELS[config.type].toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside
      className="h-full flex flex-col"
      style={{
        width: 'var(--sidebar-width)',
        background: 'var(--color-bg-panel)',
        borderRight: '1px solid var(--color-border-subtle)',
      }}
    >
      {/* Header */}
      <div
        className="p-4"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">
          Node Library
        </div>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-md"
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
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Add New Nodes Section */}
        <div className="mb-4">
          <button
            onClick={() => toggleSection('nodes')}
            className="w-full flex items-center justify-between px-2 py-2 rounded-md hover:bg-bg-hover transition-colors"
            style={{ background: expandedSections.has('nodes') ? 'var(--color-bg-elevated)' : 'transparent' }}
          >
            <span className="text-xs font-semibold text-secondary">Add Nodes</span>
            <ChevronDownIcon
              size={14}
              className={`text-muted transition-transform ${
                expandedSections.has('nodes') ? '' : '-rotate-90'
              }`}
            />
          </button>

          {expandedSections.has('nodes') && (
            <div className="mt-2 space-y-1">
              {filteredConfigs.map((config) => (
                <button
                  key={config.type}
                  onClick={() => handleAddNode(config)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-bg-hover text-left"
                  style={{
                    background: 'transparent',
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center"
                    style={{
                      background: `${NODE_COLORS[config.type]}20`,
                      color: NODE_COLORS[config.type],
                    }}
                  >
                    {config.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-primary">
                      {NODE_LABELS[config.type]}
                    </div>
                  </div>
                  <PlusIcon size={14} className="text-muted" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div
          className="mt-4 p-3 rounded-lg text-[11px] text-muted"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          <div className="font-semibold text-secondary mb-1">Quick Tips</div>
          <ul className="space-y-1 list-disc list-inside">
            <li>Click a node to add it to the canvas</li>
            <li>Connect nodes by dragging from handles</li>
            <li>Click the Output node to generate</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
