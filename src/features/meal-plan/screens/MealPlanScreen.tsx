import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MealSlot } from '../../shopping-list/types';
import { useMealPlanStore } from '../store/useMealPlanStore';
import { DayColumn } from '../components/DayColumn';
import { DE } from '../../../shared/i18n/de';

function formatDateShort(isoDate: string, dayOffset: number): string {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + dayOffset);
  return `${date.getDate()}. ${
    ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
     'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][date.getMonth()]
  }`;
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(start.getDate() + 6);

  const startDay = start.getDate();
  const endDay = end.getDate();
  const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  if (start.getMonth() === end.getMonth()) {
    return `${startDay}.–${endDay}. ${months[start.getMonth()]} ${start.getFullYear()}`;
  }
  return `${startDay}. ${months[start.getMonth()]}–${endDay}. ${months[end.getMonth()]} ${start.getFullYear()}`;
}

export function MealPlanScreen() {
  const insets = useSafeAreaInsets();
  const { activePlan, isGenerating, regeneratePlan } = useMealPlanStore();

  const weekRange = formatWeekRange(activePlan.week_start_date);

  // Group slots by day
  const slotsByDay = new Map<number, MealSlot[]>();
  for (const slot of activePlan.slots) {
    const existing = slotsByDay.get(slot.day_of_week) ?? [];
    existing.push(slot);
    slotsByDay.set(slot.day_of_week, existing);
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-white">
          {DE.mealPlan.title}
        </Text>
        <Text className="text-sm text-muted mt-1">{weekRange}</Text>
      </View>

      {/* Regenerate button */}
      <View className="px-4 pb-3">
        <Pressable
          onPress={regeneratePlan}
          disabled={isGenerating}
          className="bg-accent rounded-lg py-3 items-center active:opacity-80"
          style={isGenerating ? { opacity: 0.6 } : undefined}
        >
          {isGenerating ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color="#1a1a2e" />
              <Text className="text-background font-semibold">
                {DE.mealPlan.generating}
              </Text>
            </View>
          ) : (
            <Text className="text-background font-semibold">
              {DE.mealPlan.regenerate}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Day list */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {[0, 1, 2, 3, 4, 5, 6].map(day => {
          const slots = slotsByDay.get(day) ?? [];
          if (slots.length === 0) return null;

          return (
            <DayColumn
              key={day}
              dayOfWeek={day as 0 | 1 | 2 | 3 | 4 | 5 | 6}
              dateString={formatDateShort(activePlan.week_start_date, day)}
              slots={slots}
            />
          );
        })}
        {/* Bottom padding for tab bar */}
        <View className="h-4" />
      </ScrollView>
    </View>
  );
}
