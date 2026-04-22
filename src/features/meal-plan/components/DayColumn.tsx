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
    <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#3d3529', marginBottom: 8 }}>
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
