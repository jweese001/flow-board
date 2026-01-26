import type { Project, ProjectMetadata, ProjectExport } from '@/types/project';
import type { AppSettings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';
import {
  storeImage,
  getImage,
  deleteProjectImages,
  getAllProjectImages,
} from './imageStore';
import { useGroupStore } from '@/stores/groupStore';

const STORAGE_KEYS = {
  PROJECTS: 'flowboard:projects',
  CURRENT_PROJECT_ID: 'flowboard:currentProjectId',
  SETTINGS: 'flowboard:settings',
} as const;

const PROJECT_VERSION = '1.0.0';

// ===== PROJECT STORAGE =====

/**
 * Save project to localStorage, storing images in IndexedDB
 */
export async function saveProject(project: Project): Promise<void> {
  const projects = getAllProjectsSync();
  const existingIndex = projects.findIndex((p) => p.id === project.id);

  // Process nodes - extract images and store in IndexedDB, keep references
  const processedNodes = await Promise.all(
    project.nodes.map(async (node) => {
      if (node.type === 'output' && node.data) {
        const outputData = node.data as {
          generatedImageUrl?: string;
          generatedImages?: { imageUrl: string; seed?: number }[];
          status?: string;
          [key: string]: unknown;
        };

        // Store images in IndexedDB if they exist
        const imageRefs: string[] = [];
        if (outputData.generatedImages && outputData.generatedImages.length > 0) {
          for (let i = 0; i < outputData.generatedImages.length; i++) {
            const img = outputData.generatedImages[i];
            if (img.imageUrl && img.imageUrl.startsWith('data:')) {
              const ref = await storeImage(project.id, node.id, img.imageUrl, i);
              imageRefs.push(ref);
            }
          }
        } else if (outputData.generatedImageUrl && outputData.generatedImageUrl.startsWith('data:')) {
          const ref = await storeImage(project.id, node.id, outputData.generatedImageUrl, 0);
          imageRefs.push(ref);
        }

        // Return node with image references instead of data
        // Preserve existing _imageRefs if no new images were stored
        const { generatedImageUrl, generatedImages, _imageRefs: existingRefs, _hasImages: existingHasImages, ...restData } = outputData as typeof outputData & { _imageRefs?: string[]; _hasImages?: boolean };
        const finalRefs = imageRefs.length > 0 ? imageRefs : existingRefs;
        return {
          ...node,
          data: {
            ...restData,
            _imageRefs: finalRefs,
            _hasImages: finalRefs && finalRefs.length > 0,
          },
        };
      }

      if (node.type === 'page' && node.data) {
        const pageData = node.data as {
          panelImages?: (string | null)[];
          _panelImageRefs?: (string | null)[];
          [key: string]: unknown;
        };

        // Store panel images in IndexedDB
        const imageRefs: (string | null)[] = [];
        if (pageData.panelImages) {
          for (let i = 0; i < pageData.panelImages.length; i++) {
            const img = pageData.panelImages[i];
            if (img && img.startsWith('data:')) {
              const ref = await storeImage(project.id, node.id, img, i);
              imageRefs.push(ref);
            } else {
              imageRefs.push(null);
            }
          }
        }

        // Preserve existing refs if no new images were stored
        const { panelImages, _panelImageRefs: existingPanelRefs, ...restData } = pageData;
        const finalPanelRefs = imageRefs.length > 0 ? imageRefs : existingPanelRefs;
        return {
          ...node,
          data: {
            ...restData,
            _panelImageRefs: finalPanelRefs,
          },
        };
      }

      // Reference nodes with images
      if (node.type === 'reference' && node.data) {
        const refData = node.data as {
          imageUrl?: string;
          _imageRef?: string;
          [key: string]: unknown;
        };

        if (refData.imageUrl && refData.imageUrl.startsWith('data:')) {
          const ref = await storeImage(project.id, node.id, refData.imageUrl, 0);
          const { imageUrl, ...restData } = refData;
          return {
            ...node,
            data: {
              ...restData,
              _imageRef: ref,
            },
          };
        }
      }

      return node;
    })
  );

  // Include current groups from groupStore
  const groupStore = useGroupStore.getState();

  const updatedProject: Project = {
    ...project,
    nodes: processedNodes as Project['nodes'],
    groups: groupStore.groups,
    updatedAt: Date.now(),
  };

  if (existingIndex >= 0) {
    projects[existingIndex] = updatedProject;
  } else {
    projects.push(updatedProject);
  }

  try {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  } catch (e) {
    // Check if it's a quota error
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
      console.error('localStorage quota exceeded. Consider clearing old projects or using file-based workflow.');
      throw new Error('Storage quota exceeded - localStorage is full');
    }
    console.error('Failed to save project:', e);
    throw new Error('Failed to save project to storage');
  }
}

/**
 * Load project from localStorage and hydrate images from IndexedDB
 */
export async function loadProject(projectId: string): Promise<Project | null> {
  const projects = getAllProjectsSync();
  const project = projects.find((p) => p.id === projectId);
  if (!project) return null;

  // Hydrate images from IndexedDB
  const hydratedNodes = await Promise.all(
    project.nodes.map(async (node) => {
      if (node.type === 'output' && node.data) {
        const outputData = node.data as {
          _imageRefs?: string[];
          _hasImages?: boolean;
          status?: string;
          [key: string]: unknown;
        };

        if (outputData._imageRefs && outputData._imageRefs.length > 0) {
          const images: { imageUrl: string; seed?: number }[] = [];
          for (const ref of outputData._imageRefs) {
            const imageData = await getImage(ref);
            if (imageData) {
              images.push({ imageUrl: imageData });
            }
          }

          const { _imageRefs, _hasImages, ...restData } = outputData;
          return {
            ...node,
            data: {
              ...restData,
              generatedImages: images,
              generatedImageUrl: images[0]?.imageUrl,
              selectedImageIndex: 0,
              status: images.length > 0 ? 'complete' : 'idle',
            },
          };
        }

        // Reset status if no images
        if (outputData.status === 'generating') {
          return {
            ...node,
            data: {
              ...outputData,
              status: 'idle' as const,
            },
          };
        }
      }

      if (node.type === 'page' && node.data) {
        const pageData = node.data as {
          _panelImageRefs?: (string | null)[];
          [key: string]: unknown;
        };

        if (pageData._panelImageRefs) {
          const panelImages: (string | null)[] = [];
          for (const ref of pageData._panelImageRefs) {
            if (ref) {
              const imageData = await getImage(ref);
              panelImages.push(imageData);
            } else {
              panelImages.push(null);
            }
          }

          const { _panelImageRefs, ...restData } = pageData;
          return {
            ...node,
            data: {
              ...restData,
              panelImages,
            },
          };
        }
      }

      if (node.type === 'reference' && node.data) {
        const refData = node.data as {
          _imageRef?: string;
          [key: string]: unknown;
        };

        if (refData._imageRef) {
          const imageData = await getImage(refData._imageRef);
          const { _imageRef, ...restData } = refData;
          return {
            ...node,
            data: {
              ...restData,
              imageUrl: imageData || undefined,
            },
          };
        }
      }

      return node;
    })
  );

  // Restore groups from project
  const groupStore = useGroupStore.getState();
  groupStore.setGroups(project.groups || []);

  return {
    ...project,
    nodes: hydratedNodes as typeof project.nodes,
  };
}

/**
 * Synchronous load without image hydration (for metadata lists)
 */
export function loadProjectSync(projectId: string): Project | null {
  const projects = getAllProjectsSync();
  return projects.find((p) => p.id === projectId) || null;
}

/**
 * Hydrate a project's images from IndexedDB (used when localStorage is unavailable)
 */
export async function hydrateProjectImages(project: Project): Promise<Project> {
  const hydratedNodes = await Promise.all(
    project.nodes.map(async (node) => {
      if (node.type === 'output' && node.data) {
        const outputData = node.data as {
          _imageRefs?: string[];
          _hasImages?: boolean;
          status?: string;
          [key: string]: unknown;
        };

        if (outputData._imageRefs && outputData._imageRefs.length > 0) {
          const images: { imageUrl: string; seed?: number }[] = [];
          for (const ref of outputData._imageRefs) {
            const imageData = await getImage(ref);
            if (imageData) {
              images.push({ imageUrl: imageData });
            }
          }

          const { _imageRefs, _hasImages, ...restData } = outputData;
          return {
            ...node,
            data: {
              ...restData,
              generatedImages: images,
              generatedImageUrl: images[0]?.imageUrl,
              selectedImageIndex: 0,
              status: images.length > 0 ? 'complete' : 'idle',
            },
          };
        }

        // Reset status if stuck in generating
        if (outputData.status === 'generating') {
          return {
            ...node,
            data: {
              ...outputData,
              status: 'idle' as const,
            },
          };
        }
      }

      if (node.type === 'page' && node.data) {
        const pageData = node.data as {
          _panelImageRefs?: (string | null)[];
          [key: string]: unknown;
        };

        if (pageData._panelImageRefs) {
          const panelImages: (string | null)[] = [];
          for (const ref of pageData._panelImageRefs) {
            if (ref) {
              const imageData = await getImage(ref);
              panelImages.push(imageData);
            } else {
              panelImages.push(null);
            }
          }

          const { _panelImageRefs, ...restData } = pageData;
          return {
            ...node,
            data: {
              ...restData,
              panelImages,
            },
          };
        }
      }

      if (node.type === 'reference' && node.data) {
        const refData = node.data as {
          _imageRef?: string;
          [key: string]: unknown;
        };

        if (refData._imageRef) {
          const imageData = await getImage(refData._imageRef);
          const { _imageRef, ...restData } = refData;
          return {
            ...node,
            data: {
              ...restData,
              imageUrl: imageData || undefined,
            },
          };
        }
      }

      return node;
    })
  );

  return {
    ...project,
    nodes: hydratedNodes as typeof project.nodes,
  };
}

export async function deleteProject(projectId: string): Promise<void> {
  const projects = getAllProjectsSync().filter((p) => p.id !== projectId);
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));

  // Also delete images from IndexedDB
  await deleteProjectImages(projectId);

  if (getCurrentProjectId() === projectId) {
    setCurrentProjectId(null);
  }
}

function getAllProjectsSync(): Project[] {
  const stored = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function getAllProjects(): Project[] {
  return getAllProjectsSync();
}

export function getProjectMetadataList(): ProjectMetadata[] {
  return getAllProjectsSync().map((p) => ({
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

/**
 * Export project with full image data (self-contained)
 */
export async function exportProject(project: Project): Promise<ProjectExport> {
  // Get all images for this project from IndexedDB
  const storedImages = await getAllProjectImages(project.id);
  const imageMap = new Map(storedImages.map((img) => [img.id, img.imageData]));

  // Hydrate nodes with actual image data for export
  const exportNodes = project.nodes.map((node) => {
    if (node.type === 'output' && node.data) {
      const outputData = node.data as {
        _imageRefs?: string[];
        generatedImages?: { imageUrl: string; seed?: number }[];
        generatedImageUrl?: string;
        [key: string]: unknown;
      };

      // If we have refs, hydrate them
      if (outputData._imageRefs) {
        const images = outputData._imageRefs
          .map((ref) => imageMap.get(ref))
          .filter(Boolean)
          .map((url) => ({ imageUrl: url! }));

        const { _imageRefs, _hasImages, ...restData } = outputData as Record<string, unknown>;
        return {
          ...node,
          data: {
            ...restData,
            generatedImages: images,
            generatedImageUrl: images[0]?.imageUrl,
            status: images.length > 0 ? 'complete' : 'idle',
          },
        };
      }
    }

    if (node.type === 'page' && node.data) {
      const pageData = node.data as {
        _panelImageRefs?: (string | null)[];
        [key: string]: unknown;
      };

      if (pageData._panelImageRefs) {
        const panelImages = pageData._panelImageRefs.map((ref) =>
          ref ? imageMap.get(ref) || null : null
        );
        const { _panelImageRefs, ...restData } = pageData;
        return {
          ...node,
          data: {
            ...restData,
            panelImages,
          },
        };
      }
    }

    if (node.type === 'reference' && node.data) {
      const refData = node.data as {
        _imageRef?: string;
        [key: string]: unknown;
      };

      if (refData._imageRef) {
        const imageUrl = imageMap.get(refData._imageRef);
        const { _imageRef, ...restData } = refData;
        return {
          ...node,
          data: {
            ...restData,
            imageUrl,
          },
        };
      }
    }

    return node;
  });

  return {
    version: PROJECT_VERSION,
    project: {
      ...project,
      nodes: exportNodes as typeof project.nodes,
    },
    exportedAt: Date.now(),
  };
}

export async function exportProjectAsJson(project: Project): Promise<string> {
  const exportData = await exportProject(project);
  return JSON.stringify(exportData, null, 2);
}

export async function importProjectFromJson(json: string): Promise<Project | null> {
  console.log('[importProjectFromJson] Starting, json length:', json.length);
  try {
    let data: ProjectExport;

    try {
      data = JSON.parse(json) as ProjectExport;
      console.log('[importProjectFromJson] JSON parsed successfully');
    } catch (parseError) {
      console.error('[importProjectFromJson] JSON parse error:', parseError);
      return null;
    }

    // Handle both wrapped format ({ project: ... }) and raw format ({ id, nodes, ... })
    if (!data.project && (data as unknown as Project).id && (data as unknown as Project).nodes) {
      // Raw project format - wrap it
      data = {
        version: PROJECT_VERSION,
        project: data as unknown as Project,
        exportedAt: Date.now(),
      };
    }

    if (!data.project || !data.project.nodes) {
      console.error('Import validation failed - missing project or nodes', {
        hasProject: !!data.project,
        hasNodes: !!data.project?.nodes,
        keys: Object.keys(data)
      });
      return null;
    }

    // Ensure project has an ID
    if (!data.project.id) {
      data.project.id = generateProjectId();
    }

    // Generate new project ID
    const newProjectId = generateProjectId();

    // Process nodes - store any embedded images in IndexedDB
    const processedNodes = await Promise.all(
      data.project.nodes.map(async (node) => {
        if (node.type === 'output' && node.data) {
          const outputData = node.data as {
            generatedImages?: { imageUrl: string; seed?: number }[];
            generatedImageUrl?: string;
            status?: string;
            [key: string]: unknown;
          };

          // Store embedded images in IndexedDB
          const imageRefs: string[] = [];
          if (outputData.generatedImages) {
            for (let i = 0; i < outputData.generatedImages.length; i++) {
              const img = outputData.generatedImages[i];
              if (img.imageUrl) {
                const ref = await storeImage(newProjectId, node.id, img.imageUrl, i);
                imageRefs.push(ref);
              }
            }
          } else if (outputData.generatedImageUrl) {
            const ref = await storeImage(newProjectId, node.id, outputData.generatedImageUrl, 0);
            imageRefs.push(ref);
          }

          // IMPORTANT: Remove embedded image data, keep only refs
          const { generatedImageUrl, generatedImages, ...restOutputData } = outputData;
          return {
            ...node,
            data: {
              ...restOutputData,
              status: outputData.status === 'generating' ? 'idle' : outputData.status,
              _imageRefs: imageRefs.length > 0 ? imageRefs : undefined,
            },
          };
        }

        if (node.type === 'page' && node.data) {
          const pageData = node.data as {
            panelImages?: (string | null)[];
            [key: string]: unknown;
          };

          if (pageData.panelImages) {
            const imageRefs: (string | null)[] = [];
            for (let i = 0; i < pageData.panelImages.length; i++) {
              const img = pageData.panelImages[i];
              if (img) {
                const ref = await storeImage(newProjectId, node.id, img, i);
                imageRefs.push(ref);
              } else {
                imageRefs.push(null);
              }
            }
            // Remove embedded image data, keep only refs
            const { panelImages, ...restPageData } = pageData;
            return {
              ...node,
              data: {
                ...restPageData,
                _panelImageRefs: imageRefs,
              },
            };
          }
        }

        if (node.type === 'reference' && node.data) {
          const refData = node.data as {
            imageUrl?: string;
            [key: string]: unknown;
          };

          if (refData.imageUrl) {
            const ref = await storeImage(newProjectId, node.id, refData.imageUrl, 0);
            // Remove embedded image data, keep only ref
            const { imageUrl, ...restRefData } = refData;
            return {
              ...node,
              data: {
                ...restRefData,
                _imageRef: ref,
              },
            };
          }
        }

        return node;
      })
    );

    return {
      ...data.project,
      id: newProjectId,
      name: `${data.project.name} (Imported)`,
      nodes: processedNodes as typeof data.project.nodes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  } catch (e) {
    console.error('Import failed:', e);
    return null;
  }
}

/**
 * Open project from file - preserves original ID (unlike import which creates a copy)
 * Used for File System Access API workflow where you work directly with a file
 */
export async function openProjectFromFile(json: string): Promise<Project | null> {
  console.log('[openProjectFromFile] Starting, json length:', json.length);
  try {
    let data: ProjectExport;

    try {
      data = JSON.parse(json) as ProjectExport;
      console.log('[openProjectFromFile] JSON parsed successfully');
    } catch (parseError) {
      console.error('[openProjectFromFile] JSON parse error:', parseError);
      return null;
    }

    // Handle both wrapped format ({ project: ... }) and raw format ({ id, nodes, ... })
    if (!data.project && (data as unknown as Project).nodes) {
      const rawProject = data as unknown as Project;
      data = {
        version: PROJECT_VERSION,
        project: rawProject,
        exportedAt: Date.now(),
      };
    }

    console.log('[openProjectFromFile] Checking data structure:', {
      hasProject: !!data.project,
      hasNodes: !!data.project?.nodes,
      nodeCount: data.project?.nodes?.length,
      keys: Object.keys(data)
    });

    if (!data.project || !data.project.nodes) {
      console.error('[openProjectFromFile] Validation failed - missing project or nodes');
      return null;
    }

    // Ensure project has an ID (generate one if missing)
    if (!data.project.id) {
      data.project.id = generateProjectId();
    }

    // Use original project ID (key difference from import)
    const projectId = data.project.id;
    console.log('[openProjectFromFile] Project ID:', projectId, 'Name:', data.project.name);

    // Check if project with this ID already exists and delete its images
    const existingProject = loadProjectSync(projectId);
    if (existingProject) {
      console.log('[openProjectFromFile] Deleting existing project images');
      await deleteProjectImages(projectId);
    }

    // Process nodes - store any embedded images in IndexedDB
    console.log('[openProjectFromFile] Starting to process', data.project.nodes.length, 'nodes');
    const processedNodes = await Promise.all(
      data.project.nodes.map(async (node, nodeIndex) => {
        try {
          console.log(`[openProjectFromFile] Processing node ${nodeIndex}/${data.project.nodes.length}: type=${node.type}, id=${node.id}`);
        if (node.type === 'output' && node.data) {
          const outputData = node.data as {
            generatedImages?: { imageUrl: string; seed?: number }[];
            generatedImageUrl?: string;
            status?: string;
            [key: string]: unknown;
          };

          // Store embedded images in IndexedDB
          const imageRefs: string[] = [];
          if (outputData.generatedImages) {
            for (let i = 0; i < outputData.generatedImages.length; i++) {
              const img = outputData.generatedImages[i];
              if (img.imageUrl) {
                const ref = await storeImage(projectId, node.id, img.imageUrl, i);
                imageRefs.push(ref);
              }
            }
          } else if (outputData.generatedImageUrl) {
            const ref = await storeImage(projectId, node.id, outputData.generatedImageUrl, 0);
            imageRefs.push(ref);
          }

          // IMPORTANT: Remove embedded image data, keep only refs
          const { generatedImageUrl, generatedImages, ...restOutputData } = outputData;
          return {
            ...node,
            data: {
              ...restOutputData,
              status: outputData.status === 'generating' ? 'idle' : outputData.status,
              _imageRefs: imageRefs.length > 0 ? imageRefs : undefined,
            },
          };
        }

        if (node.type === 'page' && node.data) {
          const pageData = node.data as {
            panelImages?: (string | null)[];
            [key: string]: unknown;
          };

          if (pageData.panelImages) {
            const imageRefs: (string | null)[] = [];
            for (let i = 0; i < pageData.panelImages.length; i++) {
              const img = pageData.panelImages[i];
              if (img) {
                const ref = await storeImage(projectId, node.id, img, i);
                imageRefs.push(ref);
              } else {
                imageRefs.push(null);
              }
            }
            // Remove embedded image data, keep only refs
            const { panelImages, ...restPageData } = pageData;
            return {
              ...node,
              data: {
                ...restPageData,
                _panelImageRefs: imageRefs,
              },
            };
          }
        }

        if (node.type === 'reference' && node.data) {
          const refData = node.data as {
            imageUrl?: string;
            [key: string]: unknown;
          };

          if (refData.imageUrl) {
            const ref = await storeImage(projectId, node.id, refData.imageUrl, 0);
            // Remove embedded image data, keep only ref
            const { imageUrl, ...restRefData } = refData;
            return {
              ...node,
              data: {
                ...restRefData,
                _imageRef: ref,
              },
            };
          }
        }

        return node;
        } catch (nodeError) {
          console.error(`[openProjectFromFile] Error processing node ${nodeIndex}:`, nodeError);
          return node; // Return unprocessed node on error
        }
      })
    );

    console.log('[openProjectFromFile] Processed', processedNodes.length, 'nodes successfully');

    // Preserve original name (no "(Imported)" suffix)
    const result = {
      ...data.project,
      id: projectId,
      nodes: processedNodes as typeof data.project.nodes,
      // Keep original timestamps or use current if missing
      createdAt: data.project.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    console.log('[openProjectFromFile] Returning project:', result.name, 'with', result.nodes.length, 'nodes');
    return result;
  } catch (e) {
    console.error('[openProjectFromFile] Open failed:', e);
    return null;
  }
}

export async function downloadProjectAsFile(project: Project): Promise<void> {
  const json = await exportProjectAsJson(project);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.flowboard.json`;
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
