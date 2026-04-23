import { useState, useMemo } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEMO_RECIPES } from '../../../data/demo-data';
import { useTranslation } from '../../../shared/i18n/t';
import { RecipeFilters } from '../components/RecipeFilters';
import { RecipeListCard } from '../components/RecipeListCard';
import type { Recipe, MealType } from '../../shopping-list/types';

export function RecipesScreen() {
  const insets = useSafeAreaInsets();
  const t = useTranslation();

  const [searchText, setSearchText] = useState('');
  const [selectedMealTypes, setSelectedMealTypes] = useState<MealType[]>([]);
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [maxTime, setMaxTime] = useState<number | null>(null);

  const toggleMealType = (mt: MealType) => {
    setSelectedMealTypes(prev =>
      prev.includes(mt) ? prev.filter(x => x !== mt) : [...prev, mt]
    );
  };

  const toggleDiet = (d: string) => {
    setSelectedDiets(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  const filteredRecipes = useMemo(() => {
    return DEMO_RECIPES.filter(recipe => {
      // Text search
      if (searchText.length > 0) {
        if (!recipe.title_de.toLowerCase().includes(searchText.toLowerCase())) {
          return false;
        }
      }

      // Meal type filter (OR within)
      if (selectedMealTypes.length > 0) {
        if (!selectedMealTypes.some(mt => recipe.meal_type.includes(mt))) {
          return false;
        }
      }

      // Diet filter (OR within)
      if (selectedDiets.length > 0) {
        if (!selectedDiets.some(d => recipe.diet_tags.includes(d))) {
          return false;
        }
      }

      // Cooking time filter
      if (maxTime !== null) {
        const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes;
        if (totalTime > maxTime) {
          return false;
        }
      }

      return true;
    });
  }, [searchText, selectedMealTypes, selectedDiets, maxTime]);

  return (
    <View style={{ flex: 1, backgroundColor: '#faf8f5', paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#3d3529' }}>
          {t.recipes.title}
        </Text>
      </View>

      {/* Filters */}
      <RecipeFilters
        searchText={searchText}
        onSearchChange={setSearchText}
        selectedMealTypes={selectedMealTypes}
        onToggleMealType={toggleMealType}
        selectedDiets={selectedDiets}
        onToggleDiet={toggleDiet}
        maxTime={maxTime}
        onSetMaxTime={setMaxTime}
      />

      {/* Recipe list */}
      <FlatList
        data={filteredRecipes}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <RecipeListCard recipe={item} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Text style={{ fontSize: 16, color: '#a09080' }}>
              {t.recipes.noResults}
            </Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 16 }} />}
      />
    </View>
  );
}
