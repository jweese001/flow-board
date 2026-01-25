import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface UIState {
  selectedNodeId: string | null;
  sidebarOpen: boolean;
  propertiesPanelOpen: boolean;
  collapsedNodes: Record<string, boolean>;
  showMinimap: boolean;

  // Actions
  selectNode: (nodeId: string | null) => void;
  toggleSidebar: () => void;
  togglePropertiesPanel: () => void;
  setSidebarOpen: (open: boolean) => void;
  setPropertiesPanelOpen: (open: boolean) => void;
  toggleNodeCollapsed: (nodeId: string) => void;
  isNodeCollapsed: (nodeId: string) => boolean;
  toggleMinimap: () => void;
}

export const useUIStore = create<UIState>()(
  immer((set, get) => ({
    selectedNodeId: null,
    sidebarOpen: true,
    propertiesPanelOpen: true,
    collapsedNodes: {},
    showMinimap: true,

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

    toggleMinimap: () => {
      set((state) => {
        state.showMinimap = !state.showMinimap;
      });
    },
  }))
);
