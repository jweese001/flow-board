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
import { useGroupStore } from './groupStore';

interface ClipboardData {
  nodes: AppNode[];
  edges: Edge[];
}

interface FlowState {
  nodes: AppNode[];
  edges: Edge[];
  isDirty: boolean;
  clipboard: ClipboardData | null;

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
  copyNodes: (nodeIds: string[]) => void;
  pasteNodes: () => void;
}

// Helper to generate unique IDs using timestamp + random suffix
export const generateNodeId = (type: NodeType): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${type}-${timestamp}-${random}`;
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

// Counter for generating unique paste IDs
let pasteCounter = 0;

// Helper to expand position changes for grouped nodes
function expandGroupedNodeChanges(
  changes: NodeChange<AppNode>[],
  nodes: AppNode[]
): NodeChange<AppNode>[] {
  const groupStore = useGroupStore.getState();
  const positionChanges = changes.filter(
    (c): c is NodeChange<AppNode> & { type: 'position'; position: { x: number; y: number } } =>
      c.type === 'position' && 'position' in c && c.position != null
  );

  if (positionChanges.length === 0) return changes;

  const additionalChanges: NodeChange<AppNode>[] = [];
  const processedNodeIds = new Set<string>();

  for (const change of positionChanges) {
    const nodeId = change.id;
    if (processedNodeIds.has(nodeId)) continue;

    const groupedNodeIds = groupStore.getNodesInSameGroup(nodeId);
    if (groupedNodeIds.length <= 1) continue;

    // Find the original node to calculate delta
    const originalNode = nodes.find((n) => n.id === nodeId);
    if (!originalNode) continue;

    const deltaX = change.position.x - originalNode.position.x;
    const deltaY = change.position.y - originalNode.position.y;

    // Apply same delta to all other nodes in the group
    for (const siblingId of groupedNodeIds) {
      processedNodeIds.add(siblingId);
      if (siblingId === nodeId) continue;

      const sibling = nodes.find((n) => n.id === siblingId);
      if (!sibling) continue;

      additionalChanges.push({
        type: 'position',
        id: siblingId,
        position: {
          x: sibling.position.x + deltaX,
          y: sibling.position.y + deltaY,
        },
        dragging: change.dragging,
      });
    }
  }

  return [...changes, ...additionalChanges];
}

export const useFlowStore = create<FlowState>()(
  immer((set, get) => ({
    nodes: initialNodes,
    edges: initialEdges,
    isDirty: false,
    clipboard: null,

    onNodesChange: (changes) => {
      set((state) => {
        const expandedChanges = expandGroupedNodeChanges(changes, state.nodes);
        state.nodes = applyNodeChanges(expandedChanges, state.nodes) as AppNode[];
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
        const sourceNode = state.nodes.find((n) => n.id === connection.source);
        const targetNode = state.nodes.find((n) => n.id === connection.target);

        let targetHandle = connection.targetHandle;

        // Auto-route parameters and negative nodes to the config handle on output nodes
        if (
          sourceNode &&
          targetNode &&
          (sourceNode.type === 'parameters' || sourceNode.type === 'negative') &&
          targetNode.type === 'output'
        ) {
          targetHandle = 'config';
        }

        // Auto-route reference nodes and output nodes to the reference handle
        if ((sourceNode?.type === 'reference' || sourceNode?.type === 'output') && targetNode) {
          const assetTypes = ['character', 'setting', 'prop', 'style', 'output'];
          if (assetTypes.includes(targetNode.type as string)) {
            targetHandle = 'reference';
          }
        }

        state.edges = addEdge(
          {
            ...connection,
            targetHandle,
            id: `e-${connection.source}-${connection.target}-${targetHandle || 'default'}`,
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
      // Clean up group membership
      useGroupStore.getState().removeNodeFromAllGroups(nodeId);
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

    copyNodes: (nodeIds) => {
      set((state) => {
        if (nodeIds.length === 0) return;

        // Get the selected nodes
        const selectedNodes = state.nodes.filter((n) => nodeIds.includes(n.id));

        // Get edges that connect selected nodes to each other
        const selectedNodeIdSet = new Set(nodeIds);
        const selectedEdges = state.edges.filter(
          (e) => selectedNodeIdSet.has(e.source) && selectedNodeIdSet.has(e.target)
        );

        // Deep clone to avoid reference issues
        state.clipboard = {
          nodes: JSON.parse(JSON.stringify(selectedNodes)),
          edges: JSON.parse(JSON.stringify(selectedEdges)),
        };
      });
    },

    pasteNodes: () => {
      const { clipboard } = get();
      if (!clipboard || clipboard.nodes.length === 0) return;

      pasteCounter++;
      const offset = 50 * pasteCounter;

      // Create a mapping from old IDs to new IDs
      const idMap = new Map<string, string>();
      clipboard.nodes.forEach((node) => {
        const newId = `${node.type}-paste-${pasteCounter}-${node.id}`;
        idMap.set(node.id, newId);
      });

      // Create new nodes with new IDs and offset positions
      const newNodes: AppNode[] = clipboard.nodes.map((node) => ({
        ...JSON.parse(JSON.stringify(node)),
        id: idMap.get(node.id)!,
        position: {
          x: node.position.x + offset,
          y: node.position.y + offset,
        },
        selected: true, // Select the pasted nodes
      }));

      // Create new edges with updated source/target IDs
      const newEdges: Edge[] = clipboard.edges.map((edge) => ({
        ...JSON.parse(JSON.stringify(edge)),
        id: `e-paste-${pasteCounter}-${edge.id}`,
        source: idMap.get(edge.source)!,
        target: idMap.get(edge.target)!,
      }));

      set((state) => {
        // Deselect all existing nodes
        state.nodes.forEach((n) => {
          n.selected = false;
        });
        // Add new nodes and edges
        state.nodes.push(...newNodes);
        state.edges.push(...newEdges);
        state.isDirty = true;
      });
    },
  }))
);
