import type { Project, ProjectMetadata, ProjectExport } from '@/types/project';
import type { AppSettings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';

const STORAGE_KEYS = {
  PROJECTS: 'promptflow:projects',
  CURRENT_PROJECT_ID: 'promptflow:currentProjectId',
  SETTINGS: 'promptflow:settings',
} as const;

const PROJECT_VERSION = '1.0.0';

// ===== PROJECT STORAGE =====

export function saveProject(project: Project): void {
  const projects = getAllProjects();
  const existingIndex = projects.findIndex((p) => p.id === project.id);

  const updatedProject = {
    ...project,
    updatedAt: Date.now(),
  };

  if (existingIndex >= 0) {
    projects[existingIndex] = updatedProject;
  } else {
    projects.push(updatedProject);
  }

  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
}

export function loadProject(projectId: string): Project | null {
  const projects = getAllProjects();
  return projects.find((p) => p.id === projectId) || null;
}

export function deleteProject(projectId: string): void {
  const projects = getAllProjects().filter((p) => p.id !== projectId);
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));

  if (getCurrentProjectId() === projectId) {
    setCurrentProjectId(null);
  }
}

export function getAllProjects(): Project[] {
  const stored = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function getProjectMetadataList(): ProjectMetadata[] {
  return getAllProjects().map((p) => ({
    id: p.id,
    name: p.name,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    nodeCount: p.nodes.length,
  }));
}

export function getCurrentProjectId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT_ID);
}

export function setCurrentProjectId(projectId: string | null): void {
  if (projectId) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT_ID, projectId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT_ID);
  }
}

// ===== EXPORT / IMPORT =====

export function exportProject(project: Project): ProjectExport {
  return {
    version: PROJECT_VERSION,
    project,
    exportedAt: Date.now(),
  };
}

export function exportProjectAsJson(project: Project): string {
  return JSON.stringify(exportProject(project), null, 2);
}

export function importProjectFromJson(json: string): Project | null {
  try {
    const data = JSON.parse(json) as ProjectExport;

    if (!data.project || !data.project.id || !data.project.nodes) {
      return null;
    }

    // Generate new ID to avoid conflicts
    const importedProject: Project = {
      ...data.project,
      id: generateProjectId(),
      name: `${data.project.name} (Imported)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return importedProject;
  } catch {
    return null;
  }
}

export function downloadProjectAsFile(project: Project): void {
  const json = exportProjectAsJson(project);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.promptflow.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===== SETTINGS STORAGE =====

export function loadSettings(): AppSettings {
  const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!stored) return DEFAULT_SETTINGS;

  try {
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// ===== HELPERS =====

export function generateProjectId(): string {
  return `project-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function createNewProject(name: string = 'Untitled Project'): Project {
  const now = Date.now();
  return {
    id: generateProjectId(),
    name,
    nodes: [],
    edges: [],
    createdAt: now,
    updatedAt: now,
  };
}
