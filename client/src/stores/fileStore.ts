/**
 * Zustand store for File System Access API state
 * Tracks the current file handle for Open/Save workflow
 *
 * Note: FileSystemFileHandle cannot be serialized to localStorage,
 * so file handles are lost on page refresh. This is by design for security.
 */

import { create } from 'zustand';

interface FileState {
  // Current file handle (null if working in browser-only mode)
  fileHandle: FileSystemFileHandle | null;

  // Display name for UI (e.g., "my-project.flowboard.json")
  fileName: string | null;

  // Timestamp when we last saved to file
  lastSavedAt: number | null;

  // File's lastModified when we last read/saved it (for conflict detection)
  lastFileModified: number | null;

  // Whether we're in "file mode" vs "browser mode"
  isFileBacked: boolean;

  // Actions
  setFileHandle: (
    handle: FileSystemFileHandle,
    fileName: string,
    lastModified: number
  ) => void;
  clearFileHandle: () => void;
  updateLastSaved: (timestamp: number, fileModified: number) => void;
}

export const useFileStore = create<FileState>((set) => ({
  fileHandle: null,
  fileName: null,
  lastSavedAt: null,
  lastFileModified: null,
  isFileBacked: false,

  setFileHandle: (handle, fileName, lastModified) =>
    set({
      fileHandle: handle,
      fileName,
      lastFileModified: lastModified,
      lastSavedAt: Date.now(),
      isFileBacked: true,
    }),

  clearFileHandle: () =>
    set({
      fileHandle: null,
      fileName: null,
      lastSavedAt: null,
      lastFileModified: null,
      isFileBacked: false,
    }),

  updateLastSaved: (timestamp, fileModified) =>
    set({
      lastSavedAt: timestamp,
      lastFileModified: fileModified,
    }),
}));
