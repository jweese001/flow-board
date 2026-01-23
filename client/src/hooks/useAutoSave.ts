import { useEffect, useRef, useCallback } from 'react';
import { useFlowStore } from '@/stores/flowStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProjectStore } from '@/stores/projectStore';
import { useFileStore } from '@/stores/fileStore';
import { getCurrentProjectId } from '@/services/storage';

export function useAutoSave() {
  const isDirty = useFlowStore((state) => state.isDirty);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const autoSaveEnabled = useSettingsStore((state) => state.autoSaveEnabled);
  const saveCurrentProject = useProjectStore((state) => state.saveCurrentProject);
  const loadProject = useProjectStore((state) => state.loadProject);

  const hasLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  // Auto-load last project on startup, or create default project
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const initProject = async () => {
      const lastProjectId = getCurrentProjectId();
      if (lastProjectId) {
        const success = await loadProject(lastProjectId);
        if (success) {
          console.log('Auto-loaded project:', lastProjectId);
          return;
        }
      }

      // No existing project - save current state as a new project
      await saveCurrentProject();
      console.log('Created default project');
    };

    initProject();
  }, [loadProject, saveCurrentProject]);

  // Debounced auto-save on every change (saves 2 seconds after last change)
  // IMPORTANT: Read current state from stores inside setTimeout to avoid stale closures
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      // Read CURRENT state from stores, not captured closure values
      const currentIsDirty = useFlowStore.getState().isDirty;
      const currentAutoSaveEnabled = useSettingsStore.getState().autoSaveEnabled;
      const { isFileBacked } = useFileStore.getState();
      const { saveCurrentProject, saveCurrentToFile } = useProjectStore.getState();

      if (currentIsDirty && currentAutoSaveEnabled && !isSavingRef.current) {
        isSavingRef.current = true;
        try {
          // Always save to localStorage as backup
          await saveCurrentProject();

          // Also save to file if file-backed
          if (isFileBacked) {
            await saveCurrentToFile();
            console.log('Auto-saved to file and localStorage');
          } else {
            console.log('Auto-saved to localStorage');
          }
        } catch (e) {
          console.error('Auto-save failed:', e);
        } finally {
          isSavingRef.current = false;
        }
      }
    }, 2000); // Save 2 seconds after last change
  }, []); // No dependencies needed - we read from stores directly

  // Trigger debounced save whenever nodes or edges change
  useEffect(() => {
    if (isDirty && autoSaveEnabled) {
      debouncedSave();
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [nodes, edges, isDirty, autoSaveEnabled, debouncedSave]);

  // Save immediately on page unload or HMR
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const currentIsDirty = useFlowStore.getState().isDirty;
      if (currentIsDirty) {
        // Try to save synchronously before unload
        // Note: async operations may not complete, but localStorage writes are sync
        try {
          const save = useProjectStore.getState().saveCurrentProject;
          save(); // Fire and forget - may not complete but worth trying
        } catch {
          // Ignore errors during unload
        }
        // Show browser warning dialog as fallback
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Save on unmount (for HMR and navigation)
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save immediately on unmount if dirty
      const currentIsDirty = useFlowStore.getState().isDirty;
      if (currentIsDirty && !isSavingRef.current) {
        try {
          const save = useProjectStore.getState().saveCurrentProject;
          save(); // Fire and forget
          console.log('Saved on unmount');
        } catch (e) {
          console.error('Failed to save on unmount:', e);
        }
      }
    };
  }, []);
}
