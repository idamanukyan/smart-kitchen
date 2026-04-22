import { View, Text } from 'react-native';
import type { MealSlot } from '../../shopping-list/types';
import { MealSlotCard } from './MealSlotCard';
import { useTranslation } from '../../../shared/i18n/t';

interface DayColumnProps {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  dateString: string;
  slots: MealSlot[];
}

export function DayColumn({ dayOfWeek, dateString, slots }: DayColumnProps) {
  const t = useTranslation();
  const dayName = t.days[dayOfWeek];

  return (
    <View style={{ backgroundColor: '#f5f5f5', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e5e5' }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 }}>
        {dayName}, {dateString}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {slots.map(slot => (
          <MealSlotCard key={slot.id} slot={slot} />
        ))}
      </View>
    </View>
  );
}
