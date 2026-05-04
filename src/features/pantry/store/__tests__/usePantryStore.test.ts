import { usePantryStore } from '../usePantryStore';
import type { PantryItem } from '../../types';

// Reset store between tests
beforeEach(() => {
  usePantryStore.setState({ items: [] });
});

const makeItem = (overrides: Partial<PantryItem> = {}): Omit<PantryItem, 'id' | 'addedAt'> => ({
  householdId: 'hh-1',
  ingredientId: 'ing-kartoffeln',
  ingredientName: 'Kartoffeln',
  amount: 1000,
  unit: 'g',
  storageType: 'Vorratskammer',
  expiresAt: null,
  addedByUserId: 'user-1',
  ...overrides,
});

describe('addItem', () => {
  test('adds a new item to the store', () => {
    usePantryStore.getState().addItem(makeItem());
    const items = usePantryStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].ingredientId).toBe('ing-kartoffeln');
    expect(items[0].amount).toBe(1000);
    expect(items[0].id).toBeTruthy();
    expect(items[0].addedAt).toBeTruthy();
  });

  test('merges amounts when adding same ingredientId', () => {
    usePantryStore.getState().addItem(makeItem({ amount: 500 }));
    usePantryStore.getState().addItem(makeItem({ amount: 300 }));
    const items = usePantryStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].amount).toBe(800);
  });

  test('keeps earlier expiry date when merging', () => {
    usePantryStore.getState().addItem(makeItem({
      amount: 500,
      expiresAt: '2026-05-10',
    }));
    usePantryStore.getState().addItem(makeItem({
      amount: 300,
      expiresAt: '2026-05-15',
    }));
    const items = usePantryStore.getState().items;
    expect(items[0].expiresAt).toBe('2026-05-10');
  });
});

describe('addItems (bulk)', () => {
  test('adds multiple items at once', () => {
    usePantryStore.getState().addItems([
      makeItem({ ingredientId: 'ing-kartoffeln', ingredientName: 'Kartoffeln' }),
      makeItem({ ingredientId: 'ing-mehl', ingredientName: 'Mehl', amount: 500 }),
    ]);
    expect(usePantryStore.getState().items).toHaveLength(2);
  });
});

describe('updateItem', () => {
  test('updates amount of existing item', () => {
    usePantryStore.getState().addItem(makeItem());
    const id = usePantryStore.getState().items[0].id;
    usePantryStore.getState().updateItem(id, { amount: 750 });
    expect(usePantryStore.getState().items[0].amount).toBe(750);
  });

  test('updates expiresAt of existing item', () => {
    usePantryStore.getState().addItem(makeItem());
    const id = usePantryStore.getState().items[0].id;
    usePantryStore.getState().updateItem(id, { expiresAt: '2026-06-01' });
    expect(usePantryStore.getState().items[0].expiresAt).toBe('2026-06-01');
  });
});

describe('removeItem', () => {
  test('removes item by id', () => {
    usePantryStore.getState().addItem(makeItem());
    const id = usePantryStore.getState().items[0].id;
    usePantryStore.getState().removeItem(id);
    expect(usePantryStore.getState().items).toHaveLength(0);
  });
});

describe('deductIngredients', () => {
  test('subtracts amount from matching pantry item', () => {
    usePantryStore.getState().addItem(makeItem({ amount: 1000 }));
    usePantryStore.getState().deductIngredients([
      { ingredientId: 'ing-kartoffeln', amount: 400, unit: 'g' },
    ]);
    expect(usePantryStore.getState().items[0].amount).toBe(600);
  });

  test('removes item when deduction reaches zero', () => {
    usePantryStore.getState().addItem(makeItem({ amount: 500 }));
    usePantryStore.getState().deductIngredients([
      { ingredientId: 'ing-kartoffeln', amount: 500, unit: 'g' },
    ]);
    expect(usePantryStore.getState().items).toHaveLength(0);
  });

  test('caps at zero — never goes negative', () => {
    usePantryStore.getState().addItem(makeItem({ amount: 200 }));
    usePantryStore.getState().deductIngredients([
      { ingredientId: 'ing-kartoffeln', amount: 500, unit: 'g' },
    ]);
    expect(usePantryStore.getState().items).toHaveLength(0);
  });

  test('skips ingredients not in pantry', () => {
    usePantryStore.getState().addItem(makeItem({ amount: 500 }));
    usePantryStore.getState().deductIngredients([
      { ingredientId: 'ing-missing', amount: 200, unit: 'g' },
    ]);
    expect(usePantryStore.getState().items).toHaveLength(1);
    expect(usePantryStore.getState().items[0].amount).toBe(500);
  });
});

describe('getExpiringItems', () => {
  test('returns items expiring within N days', () => {
    const today = new Date();
    const in2Days = new Date(today);
    in2Days.setDate(today.getDate() + 2);
    const in10Days = new Date(today);
    in10Days.setDate(today.getDate() + 10);

    usePantryStore.getState().addItem(makeItem({
      ingredientId: 'ing-sahne',
      ingredientName: 'Sahne',
      expiresAt: in2Days.toISOString().slice(0, 10),
    }));
    usePantryStore.getState().addItem(makeItem({
      ingredientId: 'ing-mehl',
      ingredientName: 'Mehl',
      expiresAt: in10Days.toISOString().slice(0, 10),
    }));

    const expiring = usePantryStore.getState().getExpiringItems(3);
    expect(expiring).toHaveLength(1);
    expect(expiring[0].ingredientId).toBe('ing-sahne');
  });

  test('includes already-expired items', () => {
    usePantryStore.getState().addItem(makeItem({
      expiresAt: '2026-01-01', // past date
    }));
    const expiring = usePantryStore.getState().getExpiringItems(3);
    expect(expiring).toHaveLength(1);
  });

  test('excludes items with no expiry date', () => {
    usePantryStore.getState().addItem(makeItem({ expiresAt: null }));
    const expiring = usePantryStore.getState().getExpiringItems(3);
    expect(expiring).toHaveLength(0);
  });
});
