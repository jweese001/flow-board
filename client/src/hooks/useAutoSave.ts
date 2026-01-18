import { useEffect, useRef } from 'react';
import { useFlowStore } from '@/stores/flowStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProjectStore } from '@/stores/projectStore';
import { getCurrentProjectId } from '@/services/storage';

export function useAutoSave() {
  const isDirty = useFlowStore((state) => state.isDirty);
  const autoSaveEnabled = useSettingsStore((state) => state.autoSaveEnabled);
  const autoSaveIntervalMs = useSettingsStore((state) => state.autoSaveIntervalMs);
  const saveCurrentProject = useProjectStore((state) => state.saveCurrentProject);
  const loadProject = useProjectStore((state) => state.loadProject);

  const lastSaveRef = useRef<number>(0);
  const hasLoadedRef = useRef(false);

  // Auto-load last project on startup, or create default project
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const lastProjectId = getCurrentProjectId();
    if (lastProjectId) {
      const success = loadProject(lastProjectId);
      if (success) {
        console.log('Auto-loaded project:', lastProjectId);
        return;
      }
    }

    // No existing project - save current state as a new project
    // This ensures work is never lost even if user forgets to save
    saveCurrentProject();
    console.log('Created default project');
  }, [loadProject, saveCurrentProject]);

  useEffect(() => {
    if (!autoSaveEnabled || !isDirty) {
      return;
    }

    const timeSinceLastSave = Date.now() - lastSaveRef.current;
    const delayMs = Math.max(0, autoSaveIntervalMs - timeSinceLastSave);

    const timeoutId = setTimeout(() => {
      if (isDirty) {
        saveCurrentProject();
        lastSaveRef.current = Date.now();
      }
    }, delayMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isDirty, autoSaveEnabled, autoSaveIntervalMs, saveCurrentProject]);

  // Save on page unload if dirty (actually save, not just warn)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isDirty) {
        // Synchronously save before unload
        saveCurrentProject();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, saveCurrentProject]);
}
