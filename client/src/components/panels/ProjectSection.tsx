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
    const projectId = await openFromFile();
    if (projectId) {
      console.log('Opened project from file:', projectId);
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
    if (confirm('Delete this project? This cannot be undone.')) {
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

    const json = await file.text();
    console.log('Importing project, file size:', json.length);

    try {
      const projectId = await importProject(json);
      console.log('Import result, projectId:', projectId);

      if (projectId) {
        const loaded = await loadProject(projectId);
        console.log('Load result:', loaded);
        if (!loaded) {
          alert('Failed to load imported project');
        }
      } else {
        alert('Invalid project file - could not parse');
      }
    } catch (err) {
      console.error('Import error:', err);
      alert('Failed to import project');
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
    <div className="px-5 pb-4 space-y-3">
      {/* File Indicator (when file-backed) */}
      {isFileBacked && fileName && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
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

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleCreateProject}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-primary)',
          }}
        >
          <PlusIcon size={14} />
          New
        </button>
        <button
          onClick={handleSaveProject}
          disabled={!isDirty}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          style={{
            background: isDirty ? 'var(--color-node-setting)' : 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-subtle)',
            color: isDirty ? 'white' : 'var(--color-text-primary)',
          }}
          title={isFileBacked ? 'Save to file (Cmd+S)' : 'Save to browser (Cmd+S)'}
        >
          <SaveIcon size={14} />
          Save
        </button>
        {fileSystemSupported && (
          <button
            onClick={handleOpenFile}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-primary)',
            }}
            title="Open project file (Cmd+O)"
          >
            <FolderOpenIcon size={14} />
          </button>
        )}
        {fileSystemSupported && (
          <button
            onClick={handleSaveAs}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-primary)',
            }}
            title="Save As (Cmd+Shift+S)"
          >
            <DownloadIcon size={14} />
          </button>
        )}
        <button
          onClick={handleImportClick}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-primary)',
          }}
          title="Import project (creates copy)"
        >
          <UploadIcon size={14} />
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
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
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

                <div className="flex-1 min-w-0">
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
