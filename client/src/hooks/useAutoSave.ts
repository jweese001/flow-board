import { useEffect, useRef, useCallback } from 'react';
import { useFlowStore } from '@/stores/flowStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProjectStore } from '@/stores/projectStore';
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
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (isDirty && autoSaveEnabled && !isSavingRef.current) {
        isSavingRef.current = true;
        try {
          await saveCurrentProject();
          console.log('Auto-saved project');
        } catch (e) {
          console.error('Auto-save failed:', e);
        } finally {
          isSavingRef.current = false;
        }
      }
    }, 2000); // Save 2 seconds after last change
  }, [isDirty, autoSaveEnabled, saveCurrentProject]);

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

  // Show warning on page unload (can't reliably do async save in beforeunload)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        // Show browser warning dialog
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
}
