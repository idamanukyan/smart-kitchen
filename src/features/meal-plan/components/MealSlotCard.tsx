import { View, Text } from 'react-native';
import type { MealSlot, MealType } from '../../shopping-list/types';
import { RECIPE_BY_ID } from '../../../data/demo-data';
import { DE } from '../../../shared/i18n/de';

const MEAL_TYPE_COLORS: Record<MealType, string> = {
  Frühstück: 'text-meal-frueh',
  Mittagessen: 'text-meal-mittag',
  Abendessen: 'text-meal-abend',
  Abendbrot: 'text-meal-abendbrot',
};

interface MealSlotCardProps {
  slot: MealSlot;
}

export function MealSlotCard({ slot }: MealSlotCardProps) {
  const recipe = slot.recipe_id ? RECIPE_BY_ID.get(slot.recipe_id) : null;

  if (!recipe) {
    return (
      <View className="flex-1 bg-surface/50 rounded-lg p-3">
        <Text className="text-xs text-muted">
          {DE.mealTypes[slot.meal_type]}
        </Text>
        <Text className="text-sm text-muted italic mt-1">Kein Rezept</Text>
      </View>
    );
  }

  const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes;
  const colorClass = MEAL_TYPE_COLORS[slot.meal_type];

  return (
    <View className="flex-1 bg-[#0f3460] rounded-lg p-3">
      <Text className={`text-[10px] font-medium ${colorClass} mb-1`}>
        {DE.mealTypes[slot.meal_type]}
      </Text>
      <Text className="text-sm text-white" numberOfLines={2}>
        {recipe.title_de}
      </Text>
      <Text className="text-[10px] text-muted mt-1">
        {totalTime} Min
      </Text>
    </View>
  );
}
