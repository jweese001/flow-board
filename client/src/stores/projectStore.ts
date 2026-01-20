import { create } from 'zustand';
import type { Project, ProjectMetadata } from '@/types/project';
import {
  saveProject as storageSaveProject,
  loadProject as storageLoadProject,
  deleteProject as storageDeleteProject,
  getProjectMetadataList,
  getCurrentProjectId,
  setCurrentProjectId,
  createNewProject,
  downloadProjectAsFile,
  importProjectFromJson,
  loadProjectSync,
} from '@/services/storage';
import { useFlowStore } from './flowStore';

interface ProjectState {
  currentProjectId: string | null;
  projectList: ProjectMetadata[];
  isLoading: boolean;

  // Actions
  refreshProjectList: () => void;
  createProject: (name?: string) => Promise<string>;
  loadProject: (projectId: string) => Promise<boolean>;
  saveCurrentProject: () => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  renameProject: (projectId: string, name: string) => Promise<void>;
  exportProject: (projectId: string) => Promise<void>;
  importProject: (json: string) => Promise<string | null>;
  newUnsavedProject: () => void;
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  currentProjectId: getCurrentProjectId(),
  projectList: getProjectMetadataList(),
  isLoading: false,

  refreshProjectList: () => {
    set({ projectList: getProjectMetadataList() });
  },

  createProject: async (name = 'Untitled Project') => {
    const project = createNewProject(name);
    const flowStore = useFlowStore.getState();

    // Save empty project first
    await storageSaveProject(project);
    setCurrentProjectId(project.id);

    // Clear the flow
    flowStore.setNodes([]);
    flowStore.setEdges([]);
    flowStore.setDirty(false);

    set({
      currentProjectId: project.id,
      projectList: getProjectMetadataList(),
    });

    return project.id;
  },

  loadProject: async (projectId: string) => {
    set({ isLoading: true });

    try {
      const project = await storageLoadProject(projectId);
      if (!project) {
        set({ isLoading: false });
        return false;
      }

      const flowStore = useFlowStore.getState();

      flowStore.setNodes(project.nodes);
      flowStore.setEdges(project.edges);
      flowStore.setDirty(false);

      setCurrentProjectId(projectId);

      set({
        currentProjectId: projectId,
        projectList: getProjectMetadataList(),
        isLoading: false,
      });

      return true;
    } catch (e) {
      console.error('Failed to load project:', e);
      set({ isLoading: false });
      return false;
    }
  },

  saveCurrentProject: async () => {
    const { currentProjectId } = get();
    const flowStore = useFlowStore.getState();

    if (!currentProjectId) {
      // If no current project, create one
      const project = createNewProject();
      project.nodes = flowStore.nodes;
      project.edges = flowStore.edges;
      await storageSaveProject(project);
      setCurrentProjectId(project.id);

      set({
        currentProjectId: project.id,
        projectList: getProjectMetadataList(),
      });

      flowStore.setDirty(false);
      return;
    }

    const existing = loadProjectSync(currentProjectId);
    const project: Project = {
      id: currentProjectId,
      name: existing?.name || 'Untitled Project',
      nodes: flowStore.nodes,
      edges: flowStore.edges,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await storageSaveProject(project);
    flowStore.setDirty(false);

    set({ projectList: getProjectMetadataList() });
  },

  deleteProject: async (projectId: string) => {
    const { currentProjectId } = get();

    await storageDeleteProject(projectId);

    if (currentProjectId === projectId) {
      const flowStore = useFlowStore.getState();
      flowStore.setNodes([]);
      flowStore.setEdges([]);
      flowStore.setDirty(false);

      set({ currentProjectId: null });
    }

    set({ projectList: getProjectMetadataList() });
  },

  renameProject: async (projectId: string, name: string) => {
    const project = loadProjectSync(projectId);
    if (!project) return;

    project.name = name;
    await storageSaveProject(project);

    set({ projectList: getProjectMetadataList() });
  },

  exportProject: async (projectId: string) => {
    const project = await storageLoadProject(projectId);
    if (!project) return;

    await downloadProjectAsFile(project);
  },

  importProject: async (json: string) => {
    const project = await importProjectFromJson(json);
    if (!project) return null;

    await storageSaveProject(project);
    set({ projectList: getProjectMetadataList() });

    return project.id;
  },

  newUnsavedProject: () => {
    const flowStore = useFlowStore.getState();

    flowStore.setNodes([]);
    flowStore.setEdges([]);
    flowStore.setDirty(false);
    setCurrentProjectId(null);

    set({ currentProjectId: null });
  },
}));
