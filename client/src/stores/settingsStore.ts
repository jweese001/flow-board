import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, APIKeys, GenerationDefaults } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';

interface SettingsState extends AppSettings {
  // Actions
  setApiKey: (provider: keyof APIKeys, key: string) => void;
  clearApiKey: (provider: keyof APIKeys) => void;
  setDefaults: (defaults: Partial<GenerationDefaults>) => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  setAutoSaveToFileEnabled: (enabled: boolean) => void;
  setAutoSaveInterval: (intervalMs: number) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setApiKey: (provider, key) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: key },
        })),

      clearApiKey: (provider) =>
        set((state) => {
          const { [provider]: _, ...rest } = state.apiKeys;
          return { apiKeys: rest };
        }),

      setDefaults: (defaults) =>
        set((state) => ({
          defaults: { ...state.defaults, ...defaults },
        })),

      setAutoSaveEnabled: (enabled) =>
        set({ autoSaveEnabled: enabled }),

      setAutoSaveToFileEnabled: (enabled) =>
        set({ autoSaveToFileEnabled: enabled }),

      setAutoSaveInterval: (intervalMs) =>
        set({ autoSaveIntervalMs: intervalMs }),

      resetSettings: () =>
        set(DEFAULT_SETTINGS),
    }),
    {
      name: 'flowboard:settings',
      partialize: (state) => ({
        apiKeys: state.apiKeys,
        defaults: state.defaults,
        autoSaveEnabled: state.autoSaveEnabled,
        autoSaveToFileEnabled: state.autoSaveToFileEnabled,
        autoSaveIntervalMs: state.autoSaveIntervalMs,
      }),
    }
  )
);
