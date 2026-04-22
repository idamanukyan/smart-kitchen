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
