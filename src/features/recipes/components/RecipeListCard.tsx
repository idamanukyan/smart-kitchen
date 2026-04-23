import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Recipe, MealType } from '../../shopping-list/types';
import { useTranslation } from '../../../shared/i18n/t';
import type { RootStackParamList } from '../../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MEAL_TYPE_COLORS: Record<MealType, string> = {
  'Frühstück': '#7a9e6b',
  Mittagessen: '#c07a45',
  Abendessen: '#6b5b8a',
  Abendbrot: '#8b6e4e',
};

interface RecipeListCardProps {
  recipe: Recipe;
}

export function RecipeListCard({ recipe }: RecipeListCardProps) {
  const navigation = useNavigation<NavigationProp>();
  const t = useTranslation();

  const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes;
  const difficultyLabel = recipe.difficulty ? (t.recipe.difficulty[recipe.difficulty] ?? recipe.difficulty) : null;
  const costLabel = recipe.cost_rating ? (t.recipe.costRating[recipe.cost_rating] ?? recipe.cost_rating) : null;

  const metaParts = [
    `${totalTime} ${t.mealPlan.minuteSuffix}`,
    difficultyLabel,
    costLabel,
  ].filter(Boolean);

  return (
    <Pressable onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}>
      <View style={{
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e8e0d8',
        padding: 14,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 1,
      }}>
        {/* Meal type pills */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
          {recipe.meal_type.map(mt => (
            <View key={mt} style={{
              backgroundColor: (MEAL_TYPE_COLORS[mt] ?? '#a09080') + '18',
              borderRadius: 10,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}>
              <Text style={{
                fontSize: 10,
                fontWeight: '600',
                color: MEAL_TYPE_COLORS[mt] ?? '#a09080',
              }}>
                {t.mealTypes[mt] ?? mt}
              </Text>
            </View>
          ))}
        </View>

        {/* Title */}
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#3d3529', marginBottom: 4 }}>
          {recipe.title_de}
        </Text>

        {/* Meta line */}
        <Text style={{ fontSize: 12, color: '#a09080' }}>
          {metaParts.join(' \u00b7 ')}
        </Text>
      </View>
    </Pressable>
  );
}
