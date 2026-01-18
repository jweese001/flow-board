import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface UIState {
  selectedNodeId: string | null;
  sidebarOpen: boolean;
  propertiesPanelOpen: boolean;
  collapsedNodes: Record<string, boolean>;

  // Actions
  selectNode: (nodeId: string | null) => void;
  toggleSidebar: () => void;
  togglePropertiesPanel: () => void;
  setSidebarOpen: (open: boolean) => void;
  setPropertiesPanelOpen: (open: boolean) => void;
  toggleNodeCollapsed: (nodeId: string) => void;
  isNodeCollapsed: (nodeId: string) => boolean;
}

export const useUIStore = create<UIState>()(
  immer((set, get) => ({
    selectedNodeId: null,
    sidebarOpen: true,
    propertiesPanelOpen: true,
    collapsedNodes: {},

    selectNode: (nodeId) => {
      set((state) => {
        state.selectedNodeId = nodeId;
        if (nodeId) {
          state.propertiesPanelOpen = true;
        }
      });
    },

    toggleSidebar: () => {
      set((state) => {
        state.sidebarOpen = !state.sidebarOpen;
      });
    },

    togglePropertiesPanel: () => {
      set((state) => {
        state.propertiesPanelOpen = !state.propertiesPanelOpen;
      });
    },

    setSidebarOpen: (open) => {
      set((state) => {
        state.sidebarOpen = open;
      });
    },

    setPropertiesPanelOpen: (open) => {
      set((state) => {
        state.propertiesPanelOpen = open;
      });
    },

    toggleNodeCollapsed: (nodeId) => {
      set((state) => {
        state.collapsedNodes[nodeId] = !state.collapsedNodes[nodeId];
      });
    },

    isNodeCollapsed: (nodeId) => {
      return !!get().collapsedNodes[nodeId];
    },
  }))
);
