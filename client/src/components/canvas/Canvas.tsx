import { useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type OnSelectionChangeFunc,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useFlowStore } from '@/stores/flowStore';
import { useUIStore } from '@/stores/uiStore';
import { nodeTypes } from '@/components/nodes';
import { NODE_COLORS } from '@/types/nodes';
import type { NodeType } from '@/types/nodes';

export function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, copyNodes, pasteNodes } = useFlowStore();
  const { selectNode } = useUIStore();
  const selectedNodeIds = useRef<string[]>([]);

  const handleSelectionChange: OnSelectionChangeFunc = useCallback(({ nodes: selectedNodes }) => {
    // Track selected node IDs for copy/paste
    selectedNodeIds.current = selectedNodes.map((n) => n.id);

    if (selectedNodes.length === 1) {
      selectNode(selectedNodes[0].id);
    } else {
      selectNode(null);
    }
  }, [selectNode]);

  // Keyboard shortcuts for copy/paste
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === 'c') {
        e.preventDefault();
        if (selectedNodeIds.current.length > 0) {
          copyNodes(selectedNodeIds.current);
        }
      }

      if (modifier && e.key === 'v') {
        e.preventDefault();
        pasteNodes();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copyNodes, pasteNodes]);

  return (
    <div className="flex-1 h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={handleSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          type: 'bezier',
          style: { strokeWidth: 2 },
        }}
        selectionOnDrag
        panOnDrag={[1, 2]} // Middle mouse and right mouse for panning
        selectNodesOnDrag={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(255, 255, 255, 0.05)"
        />
        <Controls
          showInteractive={false}
          position="bottom-right"
          style={{ marginRight: 10, marginBottom: 10 }}
        />
        <MiniMap
          nodeColor={(node) => NODE_COLORS[node.type as NodeType] || '#666'}
          maskColor="rgba(0, 0, 0, 0.8)"
          position="bottom-right"
          style={{ marginRight: 10, marginBottom: 60 }}
        />
      </ReactFlow>
    </div>
  );
}
