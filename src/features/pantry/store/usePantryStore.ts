import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { appStorage } from '../../../shared/lib/storage';
import type { PantryItem, IngredientDeduction } from '../types';

interface PantryState {
  items: PantryItem[];
  addItem: (item: Omit<PantryItem, 'id' | 'addedAt'>) => void;
  addItems: (items: Omit<PantryItem, 'id' | 'addedAt'>[]) => void;
  updateItem: (id: string, patch: Partial<Pick<PantryItem, 'amount' | 'unit' | 'expiresAt'>>) => void;
  removeItem: (id: string) => void;
  deductIngredients: (deductions: IngredientDeduction[]) => void;
  getExpiringItems: (withinDays: number) => PantryItem[];
}

let idCounter = 0;
function generateId(): string {
  return `pantry-${Date.now()}-${++idCounter}`;
}

function pickEarlierExpiry(a: string | null, b: string | null): string | null {
  if (a === null) return b;
  if (b === null) return a;
  return a <= b ? a : b;
}

export const usePantryStore = create<PantryState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (input) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.ingredientId === input.ingredientId
          );

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === existing.id
                  ? {
                      ...i,
                      amount: i.amount + input.amount,
                      expiresAt: pickEarlierExpiry(i.expiresAt, input.expiresAt),
                    }
                  : i
              ),
            };
          }

          const newItem: PantryItem = {
            ...input,
            id: generateId(),
            addedAt: new Date().toISOString(),
          };
          return { items: [...state.items, newItem] };
        });
      },

      addItems: (inputs) => {
        for (const input of inputs) {
          get().addItem(input);
        }
      },

      updateItem: (id, patch) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, ...patch } : i
          ),
        }));
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      deductIngredients: (deductions) => {
        set((state) => {
          const deductionMap = new Map(
            deductions.map((d) => [d.ingredientId, d])
          );

          const updated = state.items
            .map((item) => {
              const deduction = deductionMap.get(item.ingredientId);
              if (!deduction) return item;
              const newAmount = item.amount - deduction.amount;
              return newAmount > 0 ? { ...item, amount: newAmount } : null;
            })
            .filter((item): item is PantryItem => item !== null);

          return { items: updated };
        });
      },

      getExpiringItems: (withinDays) => {
        const now = new Date();
        const cutoff = new Date(now);
        cutoff.setDate(now.getDate() + withinDays);
        const cutoffStr = cutoff.toISOString().slice(0, 10);

        return get().items.filter((item) => {
          if (item.expiresAt === null) return false;
          return item.expiresAt <= cutoffStr;
        });
      },
    }),
    {
      name: 'smartkueche-pantry',
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);

// Sync pantry to Supabase on every change (fire-and-forget).
// Lazy imports to avoid pulling in Supabase during tests.
let previousItems = usePantryStore.getState().items;
usePantryStore.subscribe((state) => {
  if (state.items !== previousItems) {
    previousItems = state.items;
    try {
      const { useAuthStore } = require('../../../shared/store/useAuthStore');
      const { syncPantry } = require('../../../shared/lib/sync');
      const householdId = useAuthStore.getState().householdId;
      if (householdId) {
        syncPantry(state.items, householdId);
      }
    } catch {
      // Sync unavailable (e.g. in test environment)
    }
  }
});
