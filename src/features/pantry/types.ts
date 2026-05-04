export type StorageType = 'Kühlschrank' | 'Tiefkühler' | 'Vorratskammer' | 'Raumtemperatur';

export interface PantryItem {
  readonly id: string;
  readonly householdId: string;
  readonly ingredientId: string;
  readonly ingredientName: string;
  readonly amount: number;
  readonly unit: string;
  readonly storageType: StorageType;
  readonly expiresAt: string | null; // ISO date string
  readonly addedAt: string;          // ISO date string
  readonly addedByUserId: string;
}

export interface IngredientDeduction {
  readonly ingredientId: string;
  readonly amount: number;
  readonly unit: string;
}
