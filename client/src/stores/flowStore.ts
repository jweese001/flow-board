import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import type { AppNode, AppNodeData, NodeType } from '@/types/nodes';

interface FlowState {
  nodes: AppNode[];
  edges: Edge[];
  isDirty: boolean;

  // Actions
  onNodesChange: (changes: NodeChange<AppNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: AppNode) => void;
  updateNodeData: (nodeId: string, data: Partial<AppNodeData>) => void;
  deleteNode: (nodeId: string) => void;
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  setDirty: (dirty: boolean) => void;
}

// Helper to generate unique IDs
let nodeIdCounter = 0;
export const generateNodeId = (type: NodeType): string => {
  nodeIdCounter++;
  return `${type}-${nodeIdCounter}`;
};

// Initial demo nodes
const initialNodes: AppNode[] = [
  {
    id: 'character-1',
    type: 'character',
    position: { x: 50, y: 100 },
    data: {
      label: 'Character',
      name: 'Mira Chen',
      description: 'Tall woman, short black hair, cybernetic left eye, worn leather jacket, confident stance',
    },
  },
  {
    id: 'setting-1',
    type: 'setting',
    position: { x: 50, y: 320 },
    data: {
      label: 'Setting',
      name: 'The Undercity',
      description: 'Crowded underground market, neon signs in foreign scripts, steam vents, perpetual rain',
    },
  },
  {
    id: 'style-1',
    type: 'style',
    position: { x: 50, y: 540 },
    data: {
      label: 'Style',
      name: 'Noir',
      description: 'Noir comic art, high contrast, heavy black inks, muted colors with neon accents, dramatic shadows',
    },
  },
  {
    id: 'shot-1',
    type: 'shot',
    position: { x: 350, y: 100 },
    data: {
      label: 'Shot',
      name: 'Dramatic Angle',
      preset: 'low-angle',
      description: 'Looking up at subject, emphasizing power',
    },
  },
  {
    id: 'action-1',
    type: 'action',
    position: { x: 350, y: 320 },
    data: {
      label: 'Action',
      content: 'Mira walks through the crowded market, her cybernetic eye scanning the crowd. Rain drips from her jacket.',
    },
  },
  {
    id: 'output-1',
    type: 'output',
    position: { x: 650, y: 200 },
    data: {
      label: 'Output',
      promptPreview: '',
      status: 'idle',
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'e-char-action', source: 'character-1', target: 'action-1' },
  { id: 'e-setting-action', source: 'setting-1', target: 'action-1' },
  { id: 'e-shot-output', source: 'shot-1', target: 'output-1' },
  { id: 'e-action-output', source: 'action-1', target: 'output-1' },
  { id: 'e-style-output', source: 'style-1', target: 'output-1' },
];

export const useFlowStore = create<FlowState>()(
  immer((set) => ({
    nodes: initialNodes,
    edges: initialEdges,
    isDirty: false,

    onNodesChange: (changes) => {
      set((state) => {
        state.nodes = applyNodeChanges(changes, state.nodes) as AppNode[];
        state.isDirty = true;
      });
    },

    onEdgesChange: (changes) => {
      set((state) => {
        state.edges = applyEdgeChanges(changes, state.edges);
        state.isDirty = true;
      });
    },

    onConnect: (connection) => {
      set((state) => {
        state.edges = addEdge(
          {
            ...connection,
            id: `e-${connection.source}-${connection.target}`,
          },
          state.edges
        );
        state.isDirty = true;
      });
    },

    addNode: (node) => {
      set((state) => {
        state.nodes.push(node);
        state.isDirty = true;
      });
    },

    updateNodeData: (nodeId, data) => {
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (node) {
          node.data = { ...node.data, ...data } as AppNodeData;
          state.isDirty = true;
        }
      });
    },

    deleteNode: (nodeId) => {
      set((state) => {
        state.nodes = state.nodes.filter((n) => n.id !== nodeId);
        state.edges = state.edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId
        );
        state.isDirty = true;
      });
    },

    setNodes: (nodes) => {
      set((state) => {
        state.nodes = nodes;
      });
    },

    setEdges: (edges) => {
      set((state) => {
        state.edges = edges;
      });
    },

    setDirty: (dirty) => {
      set((state) => {
        state.isDirty = dirty;
      });
    },
  }))
);
