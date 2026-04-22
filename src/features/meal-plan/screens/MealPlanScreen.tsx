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
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#1a1a1a' }}>
          {t.mealPlan.title}
        </Text>
        <Text style={{ fontSize: 14, color: '#888888', marginTop: 4 }}>{weekRange}</Text>
      </View>

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
