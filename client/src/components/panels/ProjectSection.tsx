import { useRef, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useFlowStore } from '@/stores/flowStore';
import { useFileStore } from '@/stores/fileStore';
import {
  PlusIcon,
  FileIcon,
  TrashIcon,
  DownloadIcon,
  UploadIcon,
  SaveIcon,
  SaveAsIcon,
  FolderOpenIcon,
} from '@/components/ui/Icons';

export function ProjectSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const {
    currentProjectId,
    projectList,
    createProject,
    loadProject,
    saveCurrentProject,
    deleteProject,
    renameProject,
    exportProject,
    importProject,
    openFromFile,
    saveCurrentToFile,
    saveCurrentAsFile,
    isFileSystemSupported,
  } = useProjectStore();

  const isDirty = useFlowStore((state) => state.isDirty);
  const { isFileBacked, fileName } = useFileStore();

  const handleCreateProject = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Create a new project anyway?')) {
        return;
      }
    }
    createProject();
  };

  const handleLoadProject = (projectId: string) => {
    if (isDirty && currentProjectId !== projectId) {
      if (!confirm('You have unsaved changes. Load this project anyway?')) {
        return;
      }
    }
    loadProject(projectId);
  };

  const handleSaveProject = async () => {
    if (isFileBacked) {
      const success = await saveCurrentToFile();
      if (!success) {
        // Fallback already handled in saveCurrentToFile
        console.log('Saved to localStorage as fallback');
      }
    } else {
      await saveCurrentProject();
    }
  };

  const handleOpenFile = async () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Open a file anyway?')) {
        return;
      }
    }
    try {
      const projectId = await openFromFile();
      if (projectId) {
        console.log('Opened project from file:', projectId);
      } else {
        // User cancelled or file failed to parse
        // openFromFile returns null on cancel (no error), so check console for details
        console.log('Open returned null - user may have cancelled or file parse failed');
      }
    } catch (err) {
      console.error('Error opening file:', err);
      alert(`Failed to open file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSaveAs = async () => {
    const success = await saveCurrentAsFile();
    if (success) {
      console.log('Project saved to new file');
    }
  };

  const handleDeleteProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const message = isFileBacked && currentProjectId === projectId
      ? 'Remove from browser? (The file on disk will NOT be deleted)'
      : 'Remove this project from browser storage?';
    if (confirm(message)) {
      deleteProject(projectId);
    }
  };

  const handleExportProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    exportProject(projectId);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again
    e.target.value = '';

    console.log('Importing file:', file.name, 'size:', file.size);

    let json: string;
    try {
      json = await file.text();
    } catch (readErr) {
      console.error('Failed to read file:', readErr);
      alert('Failed to read file');
      return;
    }

    console.log('File content length:', json.length);

    try {
      const projectId = await importProject(json);
      console.log('Import result, projectId:', projectId);

      if (projectId) {
        const loaded = await loadProject(projectId);
        console.log('Load result:', loaded);
        if (!loaded) {
          alert('Project imported but failed to load. Check browser console for details.');
        }
      } else {
        alert('Invalid project file format. Make sure this is a FlowBoard project file.');
      }
    } catch (err) {
      console.error('Import error:', err);
      alert(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const startRenaming = (projectId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(projectId);
    setEditingName(currentName);
  };

  const submitRename = () => {
    if (editingId && editingName.trim()) {
      renameProject(editingId, editingName.trim());
    }
    setEditingId(null);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fileSystemSupported = isFileSystemSupported();

  return (
    <div className="px-4 pt-2 pb-5 space-y-5">
      {/* File Indicator (when file-backed) */}
      {isFileBacked && fileName && (
        <div
          className="flex items-center gap-2 px-3 py-3 rounded-lg text-xs"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-node-setting)',
          }}
        >
          <FileIcon size={12} className="text-green-400 flex-shrink-0" />
          <span className="text-muted truncate" title={fileName}>
            {fileName}
          </span>
        </div>
      )}

      {/* Icon Toolbar */}
      <div className="flex items-center justify-start gap-1">
        <button
          onClick={handleCreateProject}
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted hover:text-primary hover:bg-white/5 transition-colors"
          title="New empty project"
        >
          <PlusIcon size={18} />
        </button>

        {/* Separator */}
        <div className="w-px h-5 bg-white/10 mx-1" />

        {fileSystemSupported && (
          <button
            onClick={handleOpenFile}
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted hover:text-primary hover:bg-white/5 transition-colors"
            title="Open file (⌘O) - load and link to file on disk"
          >
            <FolderOpenIcon size={18} />
          </button>
        )}
        <button
          onClick={handleSaveProject}
          disabled={!isDirty}
          className="w-8 h-8 flex items-center justify-center rounded-md transition-colors disabled:opacity-30"
          style={{
            color: isDirty ? 'var(--color-node-setting)' : 'var(--color-text-muted)',
          }}
          title={isFileBacked ? 'Save to file (⌘S)' : 'Save to browser (⌘S)'}
        >
          <SaveIcon size={18} />
        </button>
        {fileSystemSupported && (
          <button
            onClick={handleSaveAs}
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted hover:text-primary hover:bg-white/5 transition-colors"
            title="Save As (⌘⇧S) - save to new file on disk"
          >
            <SaveAsIcon size={18} />
          </button>
        )}
        <button
          onClick={handleImportClick}
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted hover:text-primary hover:bg-white/5 transition-colors"
          title="Import - load copy from .json file"
        >
          <UploadIcon size={18} />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.flowboard.json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Project List */}
      <div className="space-y-1">
        {projectList.length === 0 ? (
          <div className="text-xs text-muted py-4 text-center">
            No saved projects yet
          </div>
        ) : (
          projectList
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map((project) => (
              <div
                key={project.id}
                onClick={() => handleLoadProject(project.id)}
                className={`group flex items-center gap-3 px-3 py-3 rounded-lg transition-colors cursor-pointer ${
                  currentProjectId === project.id
                    ? 'bg-bg-hover'
                    : 'hover:bg-bg-hover'
                }`}
                style={{
                  border:
                    currentProjectId === project.id
                      ? '1px solid var(--color-border-medium)'
                      : '1px solid transparent',
                }}
              >
                <FileIcon
                  size={14}
                  className={currentProjectId === project.id ? 'text-primary' : 'text-muted'}
                />

                <div className="flex-1 min-w-0 py-2">
                  {editingId === project.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={submitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitRename();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full text-xs font-medium text-primary bg-transparent border-none outline-none"
                    />
                  ) : (
                    <div
                      className="text-xs font-medium text-primary truncate"
                      onDoubleClick={(e) => startRenaming(project.id, project.name, e)}
                    >
                      {project.name}
                    </div>
                  )}
                  <div className="text-[10px] text-muted">
                    {formatDate(project.updatedAt)} · {project.nodeCount} nodes
                  </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleExportProject(project.id, e)}
                    className="w-6 h-6 rounded flex items-center justify-center text-muted hover:text-primary hover:bg-bg-hover"
                    title="Export"
                  >
                    <DownloadIcon size={12} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteProject(project.id, e)}
                    className="w-6 h-6 rounded flex items-center justify-center text-muted hover:text-error hover:bg-bg-hover"
                    title="Delete"
                  >
                    <TrashIcon size={12} />
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
