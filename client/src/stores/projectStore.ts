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
} from '@/services/storage';
import { useFlowStore } from './flowStore';

interface ProjectState {
  currentProjectId: string | null;
  projectList: ProjectMetadata[];
  isLoading: boolean;

  // Actions
  refreshProjectList: () => void;
  createProject: (name?: string) => string;
  loadProject: (projectId: string) => boolean;
  saveCurrentProject: () => void;
  deleteProject: (projectId: string) => void;
  renameProject: (projectId: string, name: string) => void;
  exportProject: (projectId: string) => void;
  importProject: (json: string) => string | null;
  newUnsavedProject: () => void;
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  currentProjectId: getCurrentProjectId(),
  projectList: getProjectMetadataList(),
  isLoading: false,

  refreshProjectList: () => {
    set({ projectList: getProjectMetadataList() });
  },

  createProject: (name = 'Untitled Project') => {
    const project = createNewProject(name);
    const flowStore = useFlowStore.getState();

    // Save empty project first
    storageSaveProject(project);
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

  loadProject: (projectId: string) => {
    const project = storageLoadProject(projectId);
    if (!project) return false;

    const flowStore = useFlowStore.getState();

    flowStore.setNodes(project.nodes);
    flowStore.setEdges(project.edges);
    flowStore.setDirty(false);

    setCurrentProjectId(projectId);

    set({
      currentProjectId: projectId,
      projectList: getProjectMetadataList(),
    });

    return true;
  },

  saveCurrentProject: () => {
    const { currentProjectId } = get();
    const flowStore = useFlowStore.getState();

    if (!currentProjectId) {
      // If no current project, create one
      const project = createNewProject();
      project.nodes = flowStore.nodes;
      project.edges = flowStore.edges;
      storageSaveProject(project);
      setCurrentProjectId(project.id);

      set({
        currentProjectId: project.id,
        projectList: getProjectMetadataList(),
      });

      flowStore.setDirty(false);
      return;
    }

    const existing = storageLoadProject(currentProjectId);
    const project: Project = {
      id: currentProjectId,
      name: existing?.name || 'Untitled Project',
      nodes: flowStore.nodes,
      edges: flowStore.edges,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    storageSaveProject(project);
    flowStore.setDirty(false);

    set({ projectList: getProjectMetadataList() });
  },

  deleteProject: (projectId: string) => {
    const { currentProjectId } = get();

    storageDeleteProject(projectId);

    if (currentProjectId === projectId) {
      const flowStore = useFlowStore.getState();
      flowStore.setNodes([]);
      flowStore.setEdges([]);
      flowStore.setDirty(false);

      set({ currentProjectId: null });
    }

    set({ projectList: getProjectMetadataList() });
  },

  renameProject: (projectId: string, name: string) => {
    const project = storageLoadProject(projectId);
    if (!project) return;

    project.name = name;
    storageSaveProject(project);

    set({ projectList: getProjectMetadataList() });
  },

  exportProject: (projectId: string) => {
    const project = storageLoadProject(projectId);
    if (!project) return;

    downloadProjectAsFile(project);
  },

  importProject: (json: string) => {
    const project = importProjectFromJson(json);
    if (!project) return null;

    storageSaveProject(project);
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
