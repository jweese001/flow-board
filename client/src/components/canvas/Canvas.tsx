import { useEffect, useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  type OnSelectionChangeFunc,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useFlowStore, generateNodeId } from '@/stores/flowStore';
import { useUIStore } from '@/stores/uiStore';
import { useGroupStore } from '@/stores/groupStore';
import { useProjectStore } from '@/stores/projectStore';
import { useFileStore } from '@/stores/fileStore';
import { nodeTypes } from '@/components/nodes';
import { NODE_COLORS } from '@/types/nodes';
import type { NodeType, AppNode } from '@/types/nodes';
import { GroupOverlay } from './GroupOverlay';
import { ContextMenu } from './ContextMenu';

export function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, copyNodes, pasteNodes, deleteNode, addNode } = useFlowStore();
  const { selectNode, showMinimap, toggleMinimap } = useUIStore();
  const selectedNodeIds = useRef<string[]>([]);
  const reactFlowInstance = useReactFlow();

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string | null;
  } | null>(null);

  const handleSelectionChange: OnSelectionChangeFunc = useCallback(({ nodes: selectedNodes }) => {
    // Track selected node IDs for copy/paste
    selectedNodeIds.current = selectedNodes.map((n) => n.id);

    if (selectedNodes.length === 1) {
      selectNode(selectedNodes[0].id);
    } else {
      selectNode(null);
    }
  }, [selectNode]);

  // Duplicate selected nodes
  const duplicateNodes = useCallback((nodeIds: string[]) => {
    if (nodeIds.length === 0) return;

    const nodesToDuplicate = nodes.filter((n) => nodeIds.includes(n.id));
    const newNodeIds: string[] = [];

    nodesToDuplicate.forEach((node) => {
      const newId = generateNodeId(node.type as NodeType);
      newNodeIds.push(newId);
      const newNode: AppNode = {
        ...JSON.parse(JSON.stringify(node)),
        id: newId,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
        selected: true,
      };
      addNode(newNode);
    });

    // Deselect original nodes and select new ones
    onNodesChange(
      nodeIds.map((id) => ({ type: 'select' as const, id, selected: false }))
    );
  }, [nodes, addNode, onNodesChange]);

  // Delete selected nodes
  const deleteSelectedNodes = useCallback((nodeIds: string[]) => {
    nodeIds.forEach((id) => deleteNode(id));
    selectNode(null);
  }, [deleteNode, selectNode]);

  // Handle right-click context menu
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();

    // Check if we're clicking on a node
    const target = event.target as HTMLElement;
    const nodeElement = target.closest('.react-flow__node');

    if (nodeElement) {
      const nodeId = nodeElement.getAttribute('data-id');
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: nodeId || null,
      });
    } else {
      // Click on canvas - show canvas context menu or close existing
      setContextMenu(null);
    }
  }, []);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

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

      // Duplicate selected nodes (Cmd+D)
      if (modifier && e.key === 'd') {
        e.preventDefault();
        if (selectedNodeIds.current.length > 0) {
          duplicateNodes(selectedNodeIds.current);
        }
      }

      // Delete selected nodes (Backspace or Delete)
      if ((e.key === 'Backspace' || e.key === 'Delete') && !modifier) {
        e.preventDefault();
        if (selectedNodeIds.current.length > 0) {
          deleteSelectedNodes(selectedNodeIds.current);
        }
      }

      // Toggle minimap (Cmd+M)
      if (modifier && e.key === 'm') {
        e.preventDefault();
        toggleMinimap();
      }

      // Group selected nodes (Cmd+G)
      if (modifier && e.key === 'g' && !e.shiftKey) {
        e.preventDefault();
        if (selectedNodeIds.current.length >= 2) {
          useGroupStore.getState().createGroup(selectedNodeIds.current);
        }
      }

      // Ungroup selected nodes (Cmd+Shift+G)
      if (modifier && e.key === 'g' && e.shiftKey) {
        e.preventDefault();
        const groupStore = useGroupStore.getState();
        const groupsToDissolve = new Set<string>();
        for (const nodeId of selectedNodeIds.current) {
          const group = groupStore.getGroupForNode(nodeId);
          if (group) groupsToDissolve.add(group.id);
        }
        for (const groupId of groupsToDissolve) {
          groupStore.dissolveGroup(groupId);
        }
      }

      // Exit isolation mode (Escape)
      if (e.key === 'Escape') {
        const groupStore = useGroupStore.getState();
        if (groupStore.isolatedGroupId) {
          e.preventDefault();
          groupStore.isolateGroup(null);
        }
      }

      // Save (Cmd+S) - save to file if file-backed, otherwise localStorage
      if (modifier && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        const { isFileBacked } = useFileStore.getState();
        const { saveCurrentProject, saveCurrentToFile } = useProjectStore.getState();
        if (isFileBacked) {
          saveCurrentToFile();
        } else {
          saveCurrentProject();
        }
      }

      // Save As (Cmd+Shift+S)
      if (modifier && e.key === 's' && e.shiftKey) {
        e.preventDefault();
        const { saveCurrentAsFile, isFileSystemSupported } = useProjectStore.getState();
        if (isFileSystemSupported()) {
          saveCurrentAsFile();
        }
      }

      // Open (Cmd+O)
      if (modifier && e.key === 'o') {
        e.preventDefault();
        const { openFromFile, isFileSystemSupported } = useProjectStore.getState();
        if (isFileSystemSupported()) {
          openFromFile();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copyNodes, pasteNodes, duplicateNodes, deleteSelectedNodes, toggleMinimap]);

  return (
    <div className="flex-1 h-full" onClick={closeContextMenu}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={handleSelectionChange}
        onContextMenu={handleContextMenu}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'bezier',
          style: { strokeWidth: 2 },
        }}
        selectionOnDrag
        panOnDrag={[1, 2]} // Middle mouse and right mouse for panning
        selectNodesOnDrag={false}
        proOptions={{ hideAttribution: true }}
      >
        <GroupOverlay />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(255, 255, 255, 0.05)"
        />
        {/* Minimap */}
        {showMinimap && (
          <MiniMap
            nodeColor={(node) => NODE_COLORS[node.type as NodeType] || '#666'}
            maskColor="rgba(0, 0, 0, 0.8)"
            position="bottom-right"
            style={{ marginRight: 10, marginBottom: 60 }}
          />
        )}

        {/* Custom Controls Bar - horizontal layout below minimap */}
        <div
          className="absolute flex items-center gap-1 p-1 rounded-lg"
          style={{
            bottom: 10,
            right: 10,
            zIndex: 5,
            background: 'var(--color-bg-panel)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          {/* Minimap Toggle */}
          <button
            onClick={toggleMinimap}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-bg-hover"
            style={{
              color: showMinimap ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            }}
            title={showMinimap ? 'Hide Minimap (Cmd+M)' : 'Show Minimap (Cmd+M)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <rect x="12" y="12" width="7" height="7" rx="1" fill="currentColor" opacity="0.3" />
            </svg>
          </button>

          {/* Fit View */}
          <button
            onClick={() => reactFlowInstance.fitView({ padding: 0.2 })}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-bg-hover"
            style={{ color: 'var(--color-text-muted)' }}
            title="Fit View"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3" />
              <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
              <path d="M3 16v3a2 2 0 0 0 2 2h3" />
              <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => reactFlowInstance.zoomOut()}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-bg-hover"
            style={{ color: 'var(--color-text-muted)' }}
            title="Zoom Out"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* Zoom In */}
          <button
            onClick={() => reactFlowInstance.zoomIn()}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-bg-hover"
            style={{ color: 'var(--color-text-muted)' }}
            title="Zoom In"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </ReactFlow>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          onClose={closeContextMenu}
          onDelete={() => {
            if (contextMenu.nodeId) {
              deleteSelectedNodes([contextMenu.nodeId]);
            } else if (selectedNodeIds.current.length > 0) {
              deleteSelectedNodes(selectedNodeIds.current);
            }
            closeContextMenu();
          }}
          onDuplicate={() => {
            if (contextMenu.nodeId) {
              duplicateNodes([contextMenu.nodeId]);
            } else if (selectedNodeIds.current.length > 0) {
              duplicateNodes(selectedNodeIds.current);
            }
            closeContextMenu();
          }}
          onCopy={() => {
            if (contextMenu.nodeId) {
              copyNodes([contextMenu.nodeId]);
            } else if (selectedNodeIds.current.length > 0) {
              copyNodes(selectedNodeIds.current);
            }
            closeContextMenu();
          }}
        />
      )}
    </div>
  );
}
