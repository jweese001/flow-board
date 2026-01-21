import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Color palette for groups (muted, distinguishable)
const GROUP_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
];

export interface NodeGroup {
  id: string;
  name: string;
  nodeIds: string[];
  color: string;
}

interface GroupState {
  groups: NodeGroup[];
  isolatedGroupId: string | null; // Currently focused/isolated group

  // Actions
  createGroup: (nodeIds: string[], name?: string) => string;
  dissolveGroup: (groupId: string) => void;
  getGroupForNode: (nodeId: string) => NodeGroup | null;
  getNodesInSameGroup: (nodeId: string) => string[];
  removeNodeFromAllGroups: (nodeId: string) => void;
  setGroups: (groups: NodeGroup[]) => void;
  isolateGroup: (groupId: string | null) => void;
}

let groupCounter = 0;

export const useGroupStore = create<GroupState>()(
  immer((set, get) => ({
    groups: [],
    isolatedGroupId: null,

    createGroup: (nodeIds, name) => {
      if (nodeIds.length < 2) return '';

      // Remove nodes from any existing groups first
      const state = get();
      for (const nodeId of nodeIds) {
        state.removeNodeFromAllGroups(nodeId);
      }

      groupCounter++;
      const groupId = `group-${Date.now()}-${groupCounter}`;
      const colorIndex = (groupCounter - 1) % GROUP_COLORS.length;

      set((state) => {
        state.groups.push({
          id: groupId,
          name: name || `Group ${groupCounter}`,
          nodeIds: [...nodeIds],
          color: GROUP_COLORS[colorIndex],
        });
      });

      return groupId;
    },

    dissolveGroup: (groupId) => {
      set((state) => {
        state.groups = state.groups.filter((g) => g.id !== groupId);
        // Clear isolation if this was the isolated group
        if (state.isolatedGroupId === groupId) {
          state.isolatedGroupId = null;
        }
      });
    },

    getGroupForNode: (nodeId) => {
      const { groups } = get();
      return groups.find((g) => g.nodeIds.includes(nodeId)) || null;
    },

    getNodesInSameGroup: (nodeId) => {
      const { groups } = get();
      const group = groups.find((g) => g.nodeIds.includes(nodeId));
      return group ? group.nodeIds : [];
    },

    removeNodeFromAllGroups: (nodeId) => {
      set((state) => {
        for (const group of state.groups) {
          group.nodeIds = group.nodeIds.filter((id) => id !== nodeId);
        }
        // Remove empty groups or groups with only 1 node
        state.groups = state.groups.filter((g) => g.nodeIds.length >= 2);
      });
    },

    setGroups: (groups) => {
      set((state) => {
        state.groups = groups;
        // Clear isolation if the isolated group no longer exists
        if (state.isolatedGroupId && !groups.some((g) => g.id === state.isolatedGroupId)) {
          state.isolatedGroupId = null;
        }
      });
    },

    isolateGroup: (groupId) => {
      set((state) => {
        state.isolatedGroupId = groupId;
      });
    },
  }))
);
