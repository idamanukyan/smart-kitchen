import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { RECIPE_BY_ID, DEMO_INGREDIENTS } from '../../../data/demo-data';
import { useTranslation } from '../../../shared/i18n/t';
import type { RootStackParamList } from '../../../navigation/RootNavigator';

type RecipeDetailRoute = RouteProp<RootStackParamList, 'RecipeDetail'>;

function MetaPill({ label }: { label: string }) {
  return (
    <View style={{
      backgroundColor: '#faf8f5',
      borderWidth: 1,
      borderColor: '#e8e0d8',
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
    }}>
      <Text style={{ fontSize: 12, color: '#3d3529' }}>{label}</Text>
    </View>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <View style={{
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#c07a45',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      marginTop: 2,
    }}>
      <Text style={{ fontSize: 12, color: '#ffffff', fontWeight: '700' }}>{n}</Text>
    </View>
  );
}

export function RecipeDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RecipeDetailRoute>();
  const t = useTranslation();

  const recipe = RECIPE_BY_ID.get(route.params.recipeId);

  if (!recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: '#faf8f5', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#a09080' }}>{t.mealPlan.noRecipe}</Text>
      </View>
    );
  }

  const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes;

  // Build ingredient lookup for names
  const ingredientMap = new Map(DEMO_INGREDIENTS.map(i => [i.id, i]));

  return (
    <View style={{ flex: 1, backgroundColor: '#faf8f5', paddingTop: insets.top }}>
      {/* Back button */}
      <Pressable
        onPress={() => navigation.goBack()}
        style={{ paddingHorizontal: 16, paddingVertical: 12 }}
      >
        <Text style={{ fontSize: 16, color: '#c07a45', fontWeight: '600' }}>← {t.mealPlan.title}</Text>
      </Pressable>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Title & description */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#3d3529' }}>
            {recipe.title_de}
          </Text>
          {recipe.description_de && (
            <Text style={{ fontSize: 14, color: '#a09080', marginTop: 8, lineHeight: 20 }}>
              {recipe.description_de}
            </Text>
          )}
        </View>

        {/* Meta pills */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 20 }}>
          <MetaPill label={`${totalTime} ${t.mealPlan.minuteSuffix}`} />
          {recipe.difficulty && (
            <MetaPill label={t.recipe.difficulty[recipe.difficulty] ?? recipe.difficulty} />
          )}
          {recipe.cost_rating && (
            <MetaPill label={t.recipe.costRating[recipe.cost_rating] ?? recipe.cost_rating} />
          )}
        </View>

        {/* Ingredients card */}
        <View style={{ marginHorizontal: 16, marginBottom: 20 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#c07a45', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            {t.recipe.ingredients}
          </Text>
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#e8e0d8',
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 3,
            elevation: 1,
          }}>
            <Text style={{ fontSize: 12, color: '#a09080', marginBottom: 12 }}>
              {t.recipe.servings(recipe.servings_default)}
            </Text>
            {recipe.ingredients.map((ri, i) => {
              const ing = ingredientMap.get(ri.ingredient_id);
              const name = ing?.name_de ?? ri.ingredient_id;
              return (
                <View key={ri.id} style={{
                  flexDirection: 'row',
                  paddingVertical: 8,
                  borderTopWidth: i > 0 ? 1 : 0,
                  borderTopColor: '#f0ebe5',
                }}>
                  <Text style={{ fontSize: 14, color: '#3d3529', width: 80 }}>
                    {ri.amount} {ri.unit}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, color: '#3d3529' }}>{name}</Text>
                    {ri.preparation_note && (
                      <Text style={{ fontSize: 12, color: '#a09080', fontStyle: 'italic', marginTop: 2 }}>
                        {ri.preparation_note}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Instructions card */}
        {recipe.instructions_de && recipe.instructions_de.length > 0 && (
          <View style={{ marginHorizontal: 16, marginBottom: 32 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#c07a45', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
              {t.recipe.instructions}
            </Text>
            <View style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#e8e0d8',
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 3,
              elevation: 1,
            }}>
              {recipe.instructions_de.map((step, i) => (
                <View key={i} style={{
                  flexDirection: 'row',
                  marginBottom: i < recipe.instructions_de!.length - 1 ? 16 : 0,
                }}>
                  <StepNumber n={i + 1} />
                  <Text style={{ flex: 1, fontSize: 14, color: '#3d3529', lineHeight: 20 }}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}
