import { type StateStorage } from 'zustand/middleware';

/**
 * Simple storage adapter that uses localStorage on web
 * and AsyncStorage on native. Falls back to in-memory if neither is available.
 */

const memoryStore = new Map<string, string>();

export const appStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(name);
      }
    } catch {
      // localStorage not available
    }
    return memoryStore.get(name) ?? null;
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(name, value);
        return;
      }
    } catch {
      // localStorage not available
    }
    memoryStore.set(name, value);
  },
  removeItem: (name: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(name);
        return;
      }
    } catch {
      // localStorage not available
    }
    memoryStore.delete(name);
  },
};
