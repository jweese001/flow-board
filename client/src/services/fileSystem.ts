/**
 * File System Access API wrapper for desktop-like file workflow
 * Enables Open/Save/Save As functionality for .flowboard.json files
 *
 * Browser Support:
 * - Full: Chrome 86+, Edge 86+, Opera 72+
 * - Fallback: Safari, Firefox (use Import/Export instead)
 */

export interface FileOpenResult {
  handle: FileSystemFileHandle;
  content: string;
  fileName: string;
  lastModified: number;
}

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
}

/**
 * Open a file using the file picker
 * Returns file handle, content, and metadata
 */
export async function openFile(): Promise<FileOpenResult | null> {
  if (!isFileSystemAccessSupported()) {
    console.warn('File System Access API not supported');
    return null;
  }

  try {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'FlowBoard Project',
          accept: {
            'application/json': ['.flowboard.json', '.json'],
          },
        },
      ],
      multiple: false,
    });

    const file = await handle.getFile();
    const content = await file.text();

    return {
      handle,
      content,
      fileName: file.name,
      lastModified: file.lastModified,
    };
  } catch (error) {
    // User cancelled the picker
    if ((error as Error).name === 'AbortError') {
      return null;
    }
    console.error('Error opening file:', error);
    throw error;
  }
}

/**
 * Save content to an existing file handle
 */
export async function saveToFile(
  handle: FileSystemFileHandle,
  content: string
): Promise<{ success: boolean; lastModified: number }> {
  try {
    // Request permission if needed
    const permission = await handle.queryPermission({ mode: 'readwrite' });
    if (permission !== 'granted') {
      const requested = await handle.requestPermission({ mode: 'readwrite' });
      if (requested !== 'granted') {
        throw new Error('Permission denied');
      }
    }

    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();

    // Get updated lastModified
    const file = await handle.getFile();
    return { success: true, lastModified: file.lastModified };
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
}

/**
 * Save content to a new file using Save As picker
 * Returns the new file handle
 */
export async function saveAsFile(
  content: string,
  suggestedName: string
): Promise<{ handle: FileSystemFileHandle; lastModified: number } | null> {
  if (!isFileSystemAccessSupported()) {
    console.warn('File System Access API not supported');
    return null;
  }

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: suggestedName.endsWith('.flowboard.json')
        ? suggestedName
        : `${suggestedName}.flowboard.json`,
      types: [
        {
          description: 'FlowBoard Project',
          accept: {
            'application/json': ['.flowboard.json'],
          },
        },
      ],
    });

    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();

    const file = await handle.getFile();
    return { handle, lastModified: file.lastModified };
  } catch (error) {
    // User cancelled the picker
    if ((error as Error).name === 'AbortError') {
      return null;
    }
    console.error('Error in Save As:', error);
    throw error;
  }
}

/**
 * Check if file was modified externally since last known modification
 */
export async function checkFileModified(
  handle: FileSystemFileHandle,
  lastKnownModified: number
): Promise<boolean> {
  try {
    const file = await handle.getFile();
    return file.lastModified > lastKnownModified;
  } catch (error) {
    console.error('Error checking file modification:', error);
    return false;
  }
}

/**
 * Re-read file content from handle
 */
export async function readFile(handle: FileSystemFileHandle): Promise<string> {
  const file = await handle.getFile();
  return file.text();
}

/**
 * Get the current file name from a handle
 */
export async function getFileName(handle: FileSystemFileHandle): Promise<string> {
  const file = await handle.getFile();
  return file.name;
}
