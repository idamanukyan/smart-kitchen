import { View, Text } from 'react-native';
import type { AisleGroup } from '../types';

interface AisleSectionHeaderProps {
  group: AisleGroup;
}

export function AisleSectionHeader({ group }: AisleSectionHeaderProps) {
  const checkedCount = group.items.filter(i => i.is_checked).length;

  return (
    <View style={{ backgroundColor: '#ffffff', paddingTop: 12, paddingBottom: 8, paddingHorizontal: 16 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#888888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {group.category}{' '}
        <Text style={{ fontWeight: '400' }}>
          ({checkedCount}/{group.item_count})
        </Text>
      </Text>
    </View>
  );
}
