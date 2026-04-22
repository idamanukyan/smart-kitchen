import { View } from 'react-native';
import { useTranslation } from '../../../shared/i18n/t';
import { usePreferencesStore } from '../../../shared/store/usePreferencesStore';
import { PreferenceSection, StepperSection } from './PreferenceSection';
import type { DietType, AllergenKey, PreferredStore } from '../../../features/meal-plan/algorithm/types';

const DIET_OPTIONS: DietType[] = ['omnivor', 'flexitarisch', 'vegetarisch', 'vegan', 'pescetarisch'];
const ALLERGEN_OPTIONS: AllergenKey[] = ['Laktose', 'Gluten', 'Nüsse', 'Erdnüsse', 'Ei', 'Soja', 'Fisch', 'Meeresfrüchte', 'Sellerie', 'Senf'];
const COOKING_TIME_OPTIONS: (number | null)[] = [20, 30, 45, 60, null];
const STORE_OPTIONS: PreferredStore[] = ['REWE', 'EDEKA', 'Lidl', 'Aldi', 'Kaufland', 'Other'];

export function PreferencesContent() {
  const t = useTranslation();
  const {
    householdSize, setHouseholdSize,
    dietType, setDietType,
    allergens, toggleAllergen,
    maxCookingTimeMinutes, setMaxCookingTime,
    preferredStore, setPreferredStore,
  } = usePreferencesStore();

  return (
    <View>
      {/* Household size */}
      <StepperSection
        title={t.preferences.householdSize}
        value={householdSize}
        onIncrement={() => setHouseholdSize(householdSize + 1)}
        onDecrement={() => setHouseholdSize(householdSize - 1)}
        displayValue={t.preferences.person(householdSize)}
      />

      {/* Diet type */}
      <PreferenceSection
        title={t.preferences.dietType}
        options={DIET_OPTIONS.map(d => ({ value: d, label: t.dietTypes[d] ?? d }))}
        selected={dietType}
        onSelect={(v) => setDietType(v as DietType)}
      />

      {/* Allergens */}
      <PreferenceSection
        title={t.preferences.allergens}
        options={ALLERGEN_OPTIONS.map(a => ({ value: a, label: t.allergenLabels[a] ?? a }))}
        selected={allergens}
        onSelect={(v) => toggleAllergen(v as AllergenKey)}
        multiSelect
      />

      {/* Cooking time */}
      <PreferenceSection
        title={t.preferences.cookingTime}
        options={COOKING_TIME_OPTIONS.map(m => ({
          value: m === null ? 'null' : String(m),
          label: m === null ? t.preferences.unlimited : t.preferences.minutes(m),
        }))}
        selected={maxCookingTimeMinutes === null ? 'null' : String(maxCookingTimeMinutes)}
        onSelect={(v) => setMaxCookingTime(v === 'null' ? null : Number(v))}
      />

      {/* Store */}
      <PreferenceSection
        title={t.preferences.store}
        options={STORE_OPTIONS.map(s => ({ value: s, label: t.storeNames[s] ?? s }))}
        selected={preferredStore}
        onSelect={(v) => setPreferredStore(v as PreferredStore)}
      />
    </View>
  );
}
