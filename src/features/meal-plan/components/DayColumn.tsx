import { View, Text } from 'react-native';
import type { MealSlot } from '../../shopping-list/types';
import { MealSlotCard } from './MealSlotCard';
import { DE } from '../../../shared/i18n/de';

interface DayColumnProps {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  dateString: string;
  slots: MealSlot[];
}

export function DayColumn({ dayOfWeek, dateString, slots }: DayColumnProps) {
  const dayName = DE.days[dayOfWeek];

  return (
    <View className="bg-surface rounded-xl p-3 mb-3">
      <Text className="text-sm font-semibold text-white mb-2">
        {dayName}, {dateString}
      </Text>
      <View className="flex-row gap-2">
        {slots.map(slot => (
          <MealSlotCard key={slot.id} slot={slot} />
        ))}
      </View>
    </View>
  );
}
