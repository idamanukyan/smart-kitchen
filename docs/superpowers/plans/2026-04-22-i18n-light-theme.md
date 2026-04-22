# i18n + Light Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add English translations with a manual DE/EN toggle and replace the dark theme with a clean minimal light theme.

**Architecture:** Zustand-based language store exposes current locale. A `useTranslation()` hook returns the correct string object. All components switch from direct `DE` import to `useTranslation()`. Tailwind config updated to light palette. All components updated with light-mode classes and inline styles.

**Tech Stack:** Zustand, Nativewind/Tailwind, React Native, TypeScript

---

## File Structure

```
New files:
  src/shared/i18n/en.ts                          ← English strings (same shape as de.ts)
  src/shared/i18n/useLanguage.ts                  ← Zustand store: locale state + setter
  src/shared/i18n/t.ts                            ← useTranslation() hook
  src/features/settings/screens/SettingsScreen.tsx ← Language toggle screen

Modified files:
  src/shared/i18n/de.ts                           ← Add settings + noRecipe strings
  tailwind.config.ts                              ← Light color palette
  src/navigation/MainTabNavigator.tsx             ← Light tab bar, wire SettingsScreen, use t()
  src/shared/components/PlaceholderScreen.tsx      ← Light styles, use t()
  src/features/meal-plan/screens/MealPlanScreen.tsx       ← Light styles, use t()
  src/features/meal-plan/components/DayColumn.tsx         ← Light styles, use t()
  src/features/meal-plan/components/MealSlotCard.tsx      ← Light styles, use t()
  src/features/shopping-list/screens/ShoppingListScreen.tsx ← Light styles, use t()
  src/features/shopping-list/components/ShoppingItemCard.tsx ← Light styles
  src/features/shopping-list/components/AisleSection.tsx    ← Light styles, remove emoji
```

---

### Task 1: i18n Infrastructure

**Files:**
- Modify: `src/shared/i18n/de.ts`
- Create: `src/shared/i18n/en.ts`
- Create: `src/shared/i18n/useLanguage.ts`
- Create: `src/shared/i18n/t.ts`

- [ ] **Step 1: Update de.ts with settings strings and noRecipe**

Replace `src/shared/i18n/de.ts` with:

```typescript
export const DE = {
  tabs: {
    wochenplan: 'Wochenplan',
    einkaufsliste: 'Einkaufsliste',
    rezepte: 'Rezepte',
    einstellungen: 'Einstellungen',
  },
  mealPlan: {
    title: 'Wochenplan',
    regenerate: 'Neu generieren',
    generating: 'Wird erstellt...',
    noRecipe: 'Kein Rezept',
    minuteSuffix: 'Min',
  },
  shoppingList: {
    title: 'Einkaufsliste',
    empty: 'Keine Einkaufsliste vorhanden',
    itemsDone: (done: number, total: number) => `${done} von ${total} erledigt`,
    estimatedTotal: (euros: string) => `~${euros} €`,
    package1: '1 Packung',
    packageN: (n: number) => `${n} Packungen`,
  },
  placeholder: {
    comingSoon: 'Kommt bald',
    comingSoonSubtitle: 'Dieses Feature wird in einem späteren Update verfügbar sein.',
  },
  settings: {
    title: 'Einstellungen',
    language: 'Sprache',
  },
  mealTypes: {
    Frühstück: 'Frühstück',
    Mittagessen: 'Mittagessen',
    Abendessen: 'Abendessen',
    Abendbrot: 'Abendbrot',
  } as Record<string, string>,
  days: [
    'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag',
    'Freitag', 'Samstag', 'Sonntag',
  ] as const,
  daysShort: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const,
  months: [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ] as const,
  monthsShort: [
    'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
  ] as const,
} as const;

export type Strings = typeof DE;
```

- [ ] **Step 2: Create en.ts**

Create `src/shared/i18n/en.ts`:

```typescript
import type { Strings } from './de';

export const EN: Strings = {
  tabs: {
    wochenplan: 'Meal Plan',
    einkaufsliste: 'Shopping List',
    rezepte: 'Recipes',
    einstellungen: 'Settings',
  },
  mealPlan: {
    title: 'Meal Plan',
    regenerate: 'Regenerate',
    generating: 'Generating...',
    noRecipe: 'No recipe',
    minuteSuffix: 'min',
  },
  shoppingList: {
    title: 'Shopping List',
    empty: 'No shopping list available',
    itemsDone: (done: number, total: number) => `${done} of ${total} done`,
    estimatedTotal: (euros: string) => `~€${euros}`,
    package1: '1 package',
    packageN: (n: number) => `${n} packages`,
  },
  placeholder: {
    comingSoon: 'Coming soon',
    comingSoonSubtitle: 'This feature will be available in a future update.',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
  },
  mealTypes: {
    Frühstück: 'Breakfast',
    Mittagessen: 'Lunch',
    Abendessen: 'Dinner',
    Abendbrot: 'Light Dinner',
  },
  days: [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday',
    'Friday', 'Saturday', 'Sunday',
  ],
  daysShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  months: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  monthsShort: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ],
};
```

- [ ] **Step 3: Create useLanguage.ts**

Create `src/shared/i18n/useLanguage.ts`:

```typescript
import { create } from 'zustand';

export type Locale = 'de' | 'en';

interface LanguageState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  locale: 'de',
  setLocale: (locale: Locale) => set({ locale }),
}));
```

- [ ] **Step 4: Create t.ts**

Create `src/shared/i18n/t.ts`:

```typescript
import { DE } from './de';
import { EN } from './en';
import { useLanguageStore } from './useLanguage';
import type { Strings } from './de';

const STRINGS: Record<string, Strings> = { de: DE, en: EN };

export function useTranslation(): Strings {
  const locale = useLanguageStore((state) => state.locale);
  return STRINGS[locale] ?? DE;
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/shared/i18n/
git commit -m "i18n infrastructure: DE/EN strings, language store, useTranslation hook"
```

---

### Task 2: Light Theme Palette

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Update tailwind.config.ts**

Replace `tailwind.config.ts` with:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './App.tsx',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        surface: '#f5f5f5',
        border: '#e5e5e5',
        text: '#1a1a1a',
        accent: '#2563eb',
        'meal-mittag': '#2563eb',
        'meal-abend': '#7c3aed',
        'meal-abendbrot': '#d97706',
        'meal-frueh': '#059669',
        muted: '#888888',
      },
    },
  },
  safelist: [
    'text-meal-frueh',
    'text-meal-mittag',
    'text-meal-abend',
    'text-meal-abendbrot',
  ],
  plugins: [],
};

export default config;
```

- [ ] **Step 2: Commit**

```bash
git add tailwind.config.ts
git commit -m "Light theme: update Tailwind color palette to clean minimal light mode"
```

---

### Task 3: Settings Screen

**Files:**
- Create: `src/features/settings/screens/SettingsScreen.tsx`

- [ ] **Step 1: Create SettingsScreen**

Create `src/features/settings/screens/SettingsScreen.tsx`:

```tsx
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../../shared/i18n/t';
import { useLanguageStore, type Locale } from '../../../shared/i18n/useLanguage';

function LanguagePill({ value, label }: { value: Locale; label: string }) {
  const { locale, setLocale } = useLanguageStore();
  const isActive = locale === value;

  return (
    <Pressable
      onPress={() => setLocale(value)}
      style={{
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: isActive ? '#2563eb' : '#f5f5f5',
        borderWidth: 1,
        borderColor: isActive ? '#2563eb' : '#e5e5e5',
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: isActive ? '#ffffff' : '#1a1a1a',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const t = useTranslation();

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff', paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#1a1a1a' }}>
          {t.settings.title}
        </Text>
      </View>

      {/* Language row */}
      <View
        style={{
          marginHorizontal: 16,
          marginTop: 16,
          backgroundColor: '#f5f5f5',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#e5e5e5',
          padding: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 16, color: '#1a1a1a' }}>
          {t.settings.language}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <LanguagePill value="de" label="DE" />
          <LanguagePill value="en" label="EN" />
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/features/settings/
git commit -m "Settings screen with DE/EN language toggle"
```

---

### Task 4: Update Navigation + PlaceholderScreen

**Files:**
- Modify: `src/navigation/MainTabNavigator.tsx`
- Modify: `src/shared/components/PlaceholderScreen.tsx`

- [ ] **Step 1: Update PlaceholderScreen to light theme + i18n**

Replace `src/shared/components/PlaceholderScreen.tsx` with:

```tsx
import { View, Text } from 'react-native';
import { useTranslation } from '../i18n/t';

interface PlaceholderScreenProps {
  title: string;
}

export function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  const t = useTranslation();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', paddingHorizontal: 32 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 }}>{title}</Text>
      <Text style={{ fontSize: 16, color: '#888888', textAlign: 'center' }}>
        {t.placeholder.comingSoonSubtitle}
      </Text>
    </View>
  );
}
```

- [ ] **Step 2: Update MainTabNavigator to light theme + i18n + SettingsScreen**

Replace `src/navigation/MainTabNavigator.tsx` with:

```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useTranslation } from '../shared/i18n/t';
import { PlaceholderScreen } from '../shared/components/PlaceholderScreen';
import { MealPlanScreen } from '../features/meal-plan/screens/MealPlanScreen';
import { ShoppingListScreen } from '../features/shopping-list/screens/ShoppingListScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function RezeptePlaceholder() {
  const t = useTranslation();
  return <PlaceholderScreen title={t.tabs.rezepte} />;
}

export function MainTabNavigator() {
  const t = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e5e5',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#888888',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Wochenplan"
        component={MealPlanScreen}
        options={{
          tabBarLabel: t.tabs.wochenplan,
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📅</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Einkaufsliste"
        component={ShoppingListScreen}
        options={{
          tabBarLabel: t.tabs.einkaufsliste,
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🛒</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Rezepte"
        component={RezeptePlaceholder}
        options={{
          tabBarLabel: t.tabs.rezepte,
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📖</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Einstellungen"
        component={SettingsScreen}
        options={{
          tabBarLabel: t.tabs.einstellungen,
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/navigation/MainTabNavigator.tsx src/shared/components/PlaceholderScreen.tsx
git commit -m "Update navigation and placeholder to light theme + i18n"
```

---

### Task 5: Update Meal Plan Screens to Light Theme + i18n

**Files:**
- Modify: `src/features/meal-plan/screens/MealPlanScreen.tsx`
- Modify: `src/features/meal-plan/components/DayColumn.tsx`
- Modify: `src/features/meal-plan/components/MealSlotCard.tsx`

- [ ] **Step 1: Update MealSlotCard**

Replace `src/features/meal-plan/components/MealSlotCard.tsx` with:

```tsx
import { View, Text } from 'react-native';
import type { MealSlot, MealType } from '../../shopping-list/types';
import { RECIPE_BY_ID } from '../../../data/demo-data';
import { useTranslation } from '../../../shared/i18n/t';

const MEAL_TYPE_COLORS: Record<MealType, string> = {
  Frühstück: '#059669',
  Mittagessen: '#2563eb',
  Abendessen: '#7c3aed',
  Abendbrot: '#d97706',
};

interface MealSlotCardProps {
  slot: MealSlot;
}

export function MealSlotCard({ slot }: MealSlotCardProps) {
  const t = useTranslation();
  const recipe = slot.recipe_id ? RECIPE_BY_ID.get(slot.recipe_id) : null;

  if (!recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fafafa', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#e5e5e5' }}>
        <Text style={{ fontSize: 10, color: '#888888' }}>
          {t.mealTypes[slot.meal_type] ?? slot.meal_type}
        </Text>
        <Text style={{ fontSize: 13, color: '#888888', fontStyle: 'italic', marginTop: 4 }}>
          {t.mealPlan.noRecipe}
        </Text>
      </View>
    );
  }

  const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes;
  const color = MEAL_TYPE_COLORS[slot.meal_type];

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#e5e5e5' }}>
      <Text style={{ fontSize: 10, fontWeight: '500', color, marginBottom: 4 }}>
        {t.mealTypes[slot.meal_type] ?? slot.meal_type}
      </Text>
      <Text style={{ fontSize: 13, color: '#1a1a1a' }} numberOfLines={2}>
        {recipe.title_de}
      </Text>
      <Text style={{ fontSize: 10, color: '#888888', marginTop: 4 }}>
        {totalTime} {t.mealPlan.minuteSuffix}
      </Text>
    </View>
  );
}
```

- [ ] **Step 2: Update DayColumn**

Replace `src/features/meal-plan/components/DayColumn.tsx` with:

```tsx
import { View, Text } from 'react-native';
import type { MealSlot } from '../../shopping-list/types';
import { MealSlotCard } from './MealSlotCard';
import { useTranslation } from '../../../shared/i18n/t';

interface DayColumnProps {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  dateString: string;
  slots: MealSlot[];
}

export function DayColumn({ dayOfWeek, dateString, slots }: DayColumnProps) {
  const t = useTranslation();
  const dayName = t.days[dayOfWeek];

  return (
    <View style={{ backgroundColor: '#f5f5f5', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e5e5' }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 }}>
        {dayName}, {dateString}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {slots.map(slot => (
          <MealSlotCard key={slot.id} slot={slot} />
        ))}
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Update MealPlanScreen**

Replace `src/features/meal-plan/screens/MealPlanScreen.tsx` with:

```tsx
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MealSlot } from '../../shopping-list/types';
import { useMealPlanStore } from '../store/useMealPlanStore';
import { DayColumn } from '../components/DayColumn';
import { useTranslation } from '../../../shared/i18n/t';

function formatDateShort(isoDate: string, dayOffset: number, monthsShort: readonly string[]): string {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + dayOffset);
  return `${date.getDate()}. ${monthsShort[date.getMonth()]}`;
}

function formatWeekRange(weekStart: string, months: readonly string[]): string {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(start.getDate() + 6);

  const startDay = start.getDate();
  const endDay = end.getDate();

  if (start.getMonth() === end.getMonth()) {
    return `${startDay}.–${endDay}. ${months[start.getMonth()]} ${start.getFullYear()}`;
  }
  return `${startDay}. ${months[start.getMonth()]}–${endDay}. ${months[end.getMonth()]} ${start.getFullYear()}`;
}

export function MealPlanScreen() {
  const insets = useSafeAreaInsets();
  const { activePlan, isGenerating, regeneratePlan } = useMealPlanStore();
  const t = useTranslation();

  const weekRange = formatWeekRange(activePlan.week_start_date, t.months);

  const slotsByDay = new Map<number, MealSlot[]>();
  for (const slot of activePlan.slots) {
    const existing = slotsByDay.get(slot.day_of_week) ?? [];
    existing.push(slot);
    slotsByDay.set(slot.day_of_week, existing);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff', paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#1a1a1a' }}>
          {t.mealPlan.title}
        </Text>
        <Text style={{ fontSize: 14, color: '#888888', marginTop: 4 }}>{weekRange}</Text>
      </View>

      {/* Regenerate button */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <Pressable
          onPress={regeneratePlan}
          disabled={isGenerating}
          style={{
            backgroundColor: '#2563eb',
            borderRadius: 8,
            paddingVertical: 12,
            alignItems: 'center',
            opacity: isGenerating ? 0.6 : 1,
          }}
        >
          {isGenerating ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={{ color: '#ffffff', fontWeight: '600' }}>
                {t.mealPlan.generating}
              </Text>
            </View>
          ) : (
            <Text style={{ color: '#ffffff', fontWeight: '600' }}>
              {t.mealPlan.regenerate}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Day list */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
        {[0, 1, 2, 3, 4, 5, 6].map(day => {
          const slots = slotsByDay.get(day) ?? [];
          if (slots.length === 0) return null;

          return (
            <DayColumn
              key={day}
              dayOfWeek={day as 0 | 1 | 2 | 3 | 4 | 5 | 6}
              dateString={formatDateShort(activePlan.week_start_date, day, t.monthsShort)}
              slots={slots}
            />
          );
        })}
        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/features/meal-plan/
git commit -m "Meal plan screens: light theme + i18n with useTranslation"
```

---

### Task 6: Update Shopping List Screens to Light Theme + i18n

**Files:**
- Modify: `src/features/shopping-list/components/AisleSection.tsx`
- Modify: `src/features/shopping-list/components/ShoppingItemCard.tsx`
- Modify: `src/features/shopping-list/screens/ShoppingListScreen.tsx`

- [ ] **Step 1: Update AisleSection — light, no emoji**

Replace `src/features/shopping-list/components/AisleSection.tsx` with:

```tsx
import { View, Text } from 'react-native';
import type { AisleGroup } from '../types';

interface AisleSectionHeaderProps {
  group: AisleGroup;
}

export function AisleSectionHeader({ group }: AisleSectionHeaderProps) {
  const checkedCount = group.items.filter(i => i.is_checked).length;

  return (
    <View style={{ backgroundColor: '#ffffff', paddingTop: 12, paddingBottom: 8, paddingHorizontal: 16 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#888888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {group.category}{' '}
        <Text style={{ fontWeight: '400' }}>
          ({checkedCount}/{group.item_count})
        </Text>
      </Text>
    </View>
  );
}
```

- [ ] **Step 2: Update ShoppingItemCard — light + i18n**

Replace `src/features/shopping-list/components/ShoppingItemCard.tsx` with:

```tsx
import { View, Text, Pressable } from 'react-native';
import type { ShoppingListItem } from '../types';
import { useShoppingListStore } from '../store/useShoppingListStore';
import { useTranslation } from '../../../shared/i18n/t';

interface ShoppingItemCardProps {
  item: ShoppingListItem;
}

export function ShoppingItemCard({ item }: ShoppingItemCardProps) {
  const toggleItem = useShoppingListStore(state => state.toggleItem);
  const t = useTranslation();

  const formatPrice = (cents: number): string => {
    if (cents === 0) return '';
    return `~${(cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`;
  };

  const formatPackageInfo = (): string => {
    if (item.package_size === 0) return '';
    if (item.package_count === 1) return t.shoppingList.package1;
    return t.shoppingList.packageN(item.package_count);
  };

  const secondaryParts = [
    item.display_text !== item.ingredient_name ? item.display_text : `${item.amount_needed} ${item.unit}`,
    formatPackageInfo(),
    formatPrice(item.estimated_price_cents),
  ].filter(Boolean);

  return (
    <Pressable onPress={() => toggleItem(item.id)}>
      <View
        style={{
          backgroundColor: '#f5f5f5',
          borderRadius: 12,
          padding: 12,
          marginBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#e5e5e5',
          opacity: item.is_checked ? 0.5 : 1,
        }}
      >
        {/* Checkbox */}
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            marginRight: 12,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            backgroundColor: item.is_checked ? '#2563eb' : 'transparent',
            borderColor: item.is_checked ? '#2563eb' : '#d4d4d4',
          }}
        >
          {item.is_checked && (
            <Text style={{ fontSize: 12, color: '#ffffff', fontWeight: '700' }}>✓</Text>
          )}
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: item.is_checked ? '#888888' : '#1a1a1a',
              textDecorationLine: item.is_checked ? 'line-through' : 'none',
            }}
          >
            {item.ingredient_name}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: item.is_checked ? '#aaaaaa' : '#888888',
              marginTop: 2,
              textDecorationLine: item.is_checked ? 'line-through' : 'none',
            }}
            numberOfLines={1}
          >
            {secondaryParts.join(' · ')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
```

- [ ] **Step 3: Update ShoppingListScreen — light + i18n**

Replace `src/features/shopping-list/screens/ShoppingListScreen.tsx` with:

```tsx
import { View, Text, SectionList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShoppingListStore } from '../store/useShoppingListStore';
import { ShoppingItemCard } from '../components/ShoppingItemCard';
import { AisleSectionHeader } from '../components/AisleSection';
import { useTranslation } from '../../../shared/i18n/t';
import type { AisleGroup, ShoppingListItem } from '../types';

interface SectionData {
  group: AisleGroup;
  data: readonly ShoppingListItem[];
}

export function ShoppingListScreen() {
  const insets = useSafeAreaInsets();
  const shoppingList = useShoppingListStore(state => state.shoppingList);
  const t = useTranslation();

  if (!shoppingList) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#888888' }}>{t.shoppingList.empty}</Text>
      </View>
    );
  }

  const totalChecked = shoppingList.groups.reduce(
    (sum, g) => sum + g.items.filter(i => i.is_checked).length,
    0
  );

  const formatTotal = (): string => {
    if (shoppingList.total_estimated_cents === 0) return '';
    const euros = (shoppingList.total_estimated_cents / 100).toLocaleString('de-DE', {
      minimumFractionDigits: 2,
    });
    return t.shoppingList.estimatedTotal(euros);
  };

  const sections: SectionData[] = shoppingList.groups.map(group => ({
    group,
    data: group.items,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff', paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#1a1a1a' }}>
          {t.shoppingList.title}
        </Text>
      </View>

      {/* Summary bar */}
      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 12,
          backgroundColor: '#f5f5f5',
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#e5e5e5',
        }}
      >
        <Text style={{ fontSize: 14, color: '#1a1a1a' }}>
          {t.shoppingList.itemsDone(totalChecked, shoppingList.total_items)}
        </Text>
        {shoppingList.total_estimated_cents > 0 && (
          <Text style={{ fontSize: 14, color: '#2563eb', fontWeight: '500' }}>
            {formatTotal()}
          </Text>
        )}
      </View>

      {/* Shopping list */}
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <ShoppingItemCard item={item} />
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <AisleSectionHeader group={(section as SectionData).group} />
        )}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: 16 }} />}
      />
    </View>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/features/shopping-list/
git commit -m "Shopping list screens: light theme + i18n with useTranslation"
```

---

### Task 7: Update public/index.html background

**Files:**
- Modify: `public/index.html`

- [ ] **Step 1: Change body background to white**

In `public/index.html`, change:
```css
body { overflow: hidden; background-color: #1a1a2e; }
```
To:
```css
body { overflow: hidden; background-color: #ffffff; }
```

- [ ] **Step 2: Commit**

```bash
git add public/index.html
git commit -m "Update index.html background to white for light theme"
```
