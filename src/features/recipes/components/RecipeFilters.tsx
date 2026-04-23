import { View, Text, TextInput, ScrollView, Pressable } from 'react-native';
import { useTranslation } from '../../../shared/i18n/t';
import type { MealType } from '../../shopping-list/types';

const MEAL_TYPE_OPTIONS: MealType[] = ['Mittagessen', 'Abendessen', 'Abendbrot', 'Frühstück'];
const DIET_FILTER_OPTIONS = ['vegetarisch', 'vegan'] as const;
const TIME_OPTIONS = [20, 30, 45] as const;

interface RecipeFiltersProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  selectedMealTypes: MealType[];
  onToggleMealType: (mt: MealType) => void;
  selectedDiets: string[];
  onToggleDiet: (d: string) => void;
  maxTime: number | null;
  onSetMaxTime: (t: number | null) => void;
}

function FilterPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: active ? '#c07a45' : '#faf8f5',
        borderWidth: 1,
        borderColor: active ? '#c07a45' : '#e8e0d8',
        marginRight: 8,
      }}
    >
      <Text style={{
        fontSize: 12,
        fontWeight: '500',
        color: active ? '#ffffff' : '#3d3529',
      }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function RecipeFilters({
  searchText, onSearchChange,
  selectedMealTypes, onToggleMealType,
  selectedDiets, onToggleDiet,
  maxTime, onSetMaxTime,
}: RecipeFiltersProps) {
  const t = useTranslation();

  return (
    <View>
      {/* Search bar */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <TextInput
          value={searchText}
          onChangeText={onSearchChange}
          placeholder={t.recipes.searchPlaceholder}
          placeholderTextColor="#a09080"
          style={{
            backgroundColor: '#ffffff',
            borderWidth: 1,
            borderColor: '#e8e0d8',
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            fontSize: 14,
            color: '#3d3529',
          }}
        />
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 12 }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {/* Meal type filters */}
        {MEAL_TYPE_OPTIONS.map(mt => (
          <FilterPill
            key={mt}
            label={t.mealTypes[mt] ?? mt}
            active={selectedMealTypes.includes(mt)}
            onPress={() => onToggleMealType(mt)}
          />
        ))}

        {/* Separator */}
        <View style={{ width: 1, backgroundColor: '#e8e0d8', marginRight: 8, marginVertical: 4 }} />

        {/* Diet filters */}
        {DIET_FILTER_OPTIONS.map(d => (
          <FilterPill
            key={d}
            label={t.dietTypes[d] ?? d}
            active={selectedDiets.includes(d)}
            onPress={() => onToggleDiet(d)}
          />
        ))}

        {/* Separator */}
        <View style={{ width: 1, backgroundColor: '#e8e0d8', marginRight: 8, marginVertical: 4 }} />

        {/* Time filters */}
        {TIME_OPTIONS.map(time => (
          <FilterPill
            key={time}
            label={t.preferences.minutes(time)}
            active={maxTime === time}
            onPress={() => onSetMaxTime(maxTime === time ? null : time)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
