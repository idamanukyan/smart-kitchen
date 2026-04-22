import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MealSlot, MealType } from '../../shopping-list/types';
import { RECIPE_BY_ID } from '../../../data/demo-data';
import { useTranslation } from '../../../shared/i18n/t';
import type { RootStackParamList } from '../../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MEAL_TYPE_COLORS: Record<MealType, string> = {
  Frühstück: '#7a9e6b',
  Mittagessen: '#c07a45',
  Abendessen: '#6b5b8a',
  Abendbrot: '#8b6e4e',
};

interface MealSlotCardProps {
  slot: MealSlot;
}

export function MealSlotCard({ slot }: MealSlotCardProps) {
  const t = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const recipe = slot.recipe_id ? RECIPE_BY_ID.get(slot.recipe_id) : null;

  if (!recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: '#faf8f5', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e8e0d8' }}>
        <Text style={{ fontSize: 10, color: '#a09080' }}>
          {t.mealTypes[slot.meal_type] ?? slot.meal_type}
        </Text>
        <Text style={{ fontSize: 13, color: '#a09080', fontStyle: 'italic', marginTop: 4 }}>
          {t.mealPlan.noRecipe}
        </Text>
      </View>
    );
  }

  const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes;
  const color = MEAL_TYPE_COLORS[slot.meal_type];

  return (
    <Pressable
      onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
      style={{ flex: 1 }}
    >
      <View style={{ backgroundColor: '#faf8f5', borderRadius: 12, padding: 12 }}>
        <Text style={{ fontSize: 10, fontWeight: '500', color, marginBottom: 4 }}>
          {t.mealTypes[slot.meal_type] ?? slot.meal_type}
        </Text>
        <Text style={{ fontSize: 13, color: '#3d3529' }} numberOfLines={2}>
          {recipe.title_de}
        </Text>
        <Text style={{ fontSize: 10, color: '#a09080', marginTop: 4 }}>
          {totalTime} {t.mealPlan.minuteSuffix}
        </Text>
      </View>
    </Pressable>
  );
}
