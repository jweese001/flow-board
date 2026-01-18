import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ModelType, AspectRatio } from '@/types/nodes';

export interface HistoryEntry {
  id: string;
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  model: ModelType;
  aspectRatio: AspectRatio;
  seed?: number;
  timestamp: number;
}

interface HistoryState {
  entries: HistoryEntry[];
  maxEntries: number;
  addEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      maxEntries: 50,

      addEntry: (entry) =>
        set((state) => {
          const newEntry: HistoryEntry = {
            ...entry,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
          };
          // Keep only the most recent entries
          const updatedEntries = [newEntry, ...state.entries].slice(
            0,
            state.maxEntries
          );
          return { entries: updatedEntries };
        }),

      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),

      clearHistory: () => set({ entries: [] }),
    }),
    {
      name: 'flowboard-history',
    }
  )
);
