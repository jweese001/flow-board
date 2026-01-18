import { useEffect, useRef } from 'react';
import { useFlowStore } from '@/stores/flowStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProjectStore } from '@/stores/projectStore';

export function useAutoSave() {
  const isDirty = useFlowStore((state) => state.isDirty);
  const autoSaveEnabled = useSettingsStore((state) => state.autoSaveEnabled);
  const autoSaveIntervalMs = useSettingsStore((state) => state.autoSaveIntervalMs);
  const saveCurrentProject = useProjectStore((state) => state.saveCurrentProject);

  const lastSaveRef = useRef<number>(0);

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

  // Also save on page unload if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);
}
