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
  openProjectFromFile as storageOpenProjectFromFile,
  loadProjectSync,
  exportProjectAsJson,
} from '@/services/storage';
import {
  openFile,
  saveToFile,
  saveAsFile,
  checkFileModified,
  isFileSystemAccessSupported,
} from '@/services/fileSystem';
import { useFlowStore } from './flowStore';
import { useGroupStore } from './groupStore';
import { useFileStore } from './fileStore';

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

  // File System Access API actions
  openFromFile: () => Promise<string | null>;
  saveCurrentToFile: () => Promise<boolean>;
  saveCurrentAsFile: () => Promise<boolean>;
  isFileSystemSupported: () => boolean;
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
    const groupStore = useGroupStore.getState();
    const fileStore = useFileStore.getState();

    // Save empty project first
    await storageSaveProject(project);
    setCurrentProjectId(project.id);

    // Clear the flow, groups, and file handle
    flowStore.setNodes([]);
    flowStore.setEdges([]);
    flowStore.setDirty(false);
    groupStore.setGroups([]);
    fileStore.clearFileHandle();

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
      const fileStore = useFileStore.getState();

      flowStore.setNodes(project.nodes);
      flowStore.setEdges(project.edges);
      flowStore.setDirty(false);

      // Clear file handle - loading from browser storage, not a file
      fileStore.clearFileHandle();

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
      const fileStore = useFileStore.getState();

      flowStore.setNodes([]);
      flowStore.setEdges([]);
      flowStore.setDirty(false);

      // Clear file handle if this was a file-backed project
      // Note: The actual file on disk is NOT deleted
      fileStore.clearFileHandle();

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

    // Try to save to localStorage (non-critical - images are in IndexedDB)
    try {
      await storageSaveProject(project);
      set({ projectList: getProjectMetadataList() });
    } catch (e) {
      console.warn('Could not save imported project to localStorage (quota exceeded). Loading directly.');
    }

    // Load the project into the flow (hydrating images from IndexedDB)
    const flowStore = useFlowStore.getState();
    const groupStore = useGroupStore.getState();

    // Hydrate images from IndexedDB
    const { hydrateProjectImages } = await import('@/services/storage');
    const hydratedProject = await hydrateProjectImages(project);

    console.log('[importProject] Hydrated project:', {
      nodeCount: hydratedProject.nodes.length,
      edgeCount: hydratedProject.edges.length,
      groupCount: hydratedProject.groups?.length ?? 0,
    });

    flowStore.setNodes(hydratedProject.nodes);
    flowStore.setEdges(hydratedProject.edges);
    flowStore.setDirty(false);
    groupStore.setGroups(hydratedProject.groups || []);

    setCurrentProjectId(project.id);
    set({ currentProjectId: project.id, isLoading: false });

    return project.id;
  },

  newUnsavedProject: () => {
    const flowStore = useFlowStore.getState();
    const groupStore = useGroupStore.getState();

    flowStore.setNodes([]);
    flowStore.setEdges([]);
    flowStore.setDirty(false);
    groupStore.setGroups([]);
    setCurrentProjectId(null);

    set({ currentProjectId: null });
  },

  // File System Access API actions
  isFileSystemSupported: () => isFileSystemAccessSupported(),

  openFromFile: async () => {
    const result = await openFile();
    if (!result) return null; // User cancelled

    set({ isLoading: true });

    try {
      console.log('Opening file:', result.fileName, 'size:', result.content.length);

      const project = await storageOpenProjectFromFile(result.content);
      if (!project) {
        set({ isLoading: false });
        alert('Failed to parse project file. Make sure this is a valid FlowBoard project file.');
        return null;
      }

      console.log('Parsed project:', project.id, 'nodes:', project.nodes.length);

      // Save to localStorage as backup (skip if it would exceed quota)
      try {
        await storageSaveProject(project);
      } catch (saveError) {
        console.warn('Could not save to localStorage (quota exceeded?), continuing with file-only mode:', saveError);
        // Continue - the file is the source of truth, localStorage is just a backup
      }

      // Track the file handle
      const fileStore = useFileStore.getState();
      fileStore.setFileHandle(result.handle, result.fileName, result.lastModified);

      // Load with hydration from IndexedDB (to get actual image data)
      // Try localStorage first, fall back to direct hydration if that fails
      let hydratedProject = await storageLoadProject(project.id);
      if (!hydratedProject) {
        console.log('localStorage load failed, hydrating directly from IndexedDB');
        // Import the hydration function to do it directly
        const { hydrateProjectImages } = await import('@/services/storage');
        hydratedProject = await hydrateProjectImages(project);
      }

      // Load into flow
      const flowStore = useFlowStore.getState();
      flowStore.setNodes(hydratedProject.nodes);
      flowStore.setEdges(hydratedProject.edges);
      flowStore.setDirty(false);

      // Restore groups if present
      const groupStore = useGroupStore.getState();
      groupStore.setGroups(hydratedProject.groups || project.groups || []);

      setCurrentProjectId(project.id);

      set({
        currentProjectId: project.id,
        projectList: getProjectMetadataList(),
        isLoading: false,
      });

      return project.id;
    } catch (e) {
      console.error('Failed to open from file:', e);
      set({ isLoading: false });
      alert(`Failed to open file: ${e instanceof Error ? e.message : 'Unknown error'}`);
      return null;
    }
  },

  saveCurrentToFile: async () => {
    const { currentProjectId } = get();
    const fileStore = useFileStore.getState();

    if (!currentProjectId || !fileStore.fileHandle) {
      console.warn('No file handle to save to');
      return false;
    }

    try {
      // Check for external modifications
      if (fileStore.lastFileModified) {
        const wasModified = await checkFileModified(
          fileStore.fileHandle,
          fileStore.lastFileModified
        );
        if (wasModified) {
          const overwrite = confirm(
            'The file has been modified externally. Overwrite with your changes?'
          );
          if (!overwrite) return false;
        }
      }

      // Get current project state
      const flowStore = useFlowStore.getState();
      const groupStore = useGroupStore.getState();
      const existing = loadProjectSync(currentProjectId);
      const project: Project = {
        id: currentProjectId,
        name: existing?.name || 'Untitled Project',
        nodes: flowStore.nodes,
        edges: flowStore.edges,
        groups: groupStore.groups,
        createdAt: existing?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      // Export to JSON (with images embedded)
      const json = await exportProjectAsJson(project);

      // Save to file
      const result = await saveToFile(fileStore.fileHandle, json);
      fileStore.updateLastSaved(Date.now(), result.lastModified);

      // Also save to localStorage as backup
      await storageSaveProject(project);
      flowStore.setDirty(false);

      set({ projectList: getProjectMetadataList() });
      return true;
    } catch (e) {
      console.error('Failed to save to file:', e);
      // Fall back to localStorage save
      await get().saveCurrentProject();
      return false;
    }
  },

  saveCurrentAsFile: async () => {
    const { currentProjectId } = get();
    const flowStore = useFlowStore.getState();
    const groupStore = useGroupStore.getState();

    // Get or create project
    const existing = currentProjectId ? loadProjectSync(currentProjectId) : null;
    const project: Project = {
      id: currentProjectId || `project-${Date.now()}`,
      name: existing?.name || 'Untitled Project',
      nodes: flowStore.nodes,
      edges: flowStore.edges,
      groups: groupStore.groups,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    try {
      // Export to JSON
      const json = await exportProjectAsJson(project);

      // Show Save As dialog
      const suggestedName = project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const result = await saveAsFile(json, suggestedName);
      if (!result) return false;

      // Track the new file handle
      const fileStore = useFileStore.getState();
      fileStore.setFileHandle(result.handle, suggestedName + '.flowboard.json', result.lastModified);

      // Save to localStorage as backup
      await storageSaveProject(project);
      setCurrentProjectId(project.id);
      flowStore.setDirty(false);

      set({
        currentProjectId: project.id,
        projectList: getProjectMetadataList(),
      });

      return true;
    } catch (e) {
      console.error('Failed to Save As:', e);
      return false;
    }
  },
}));
