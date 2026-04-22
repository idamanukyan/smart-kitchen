import { View, Text } from 'react-native';
import type { AisleGroup, AisleCategory } from '../types';

const AISLE_EMOJI: Partial<Record<AisleCategory, string>> = {
  'Obst & Gem\u00FCse': '\uD83C\uDF4E',
  'Brot & Backwaren': '\uD83C\uDF5E',
  'K\u00FChlregal': '\u2744\uFE0F',
  'Milchprodukte': '\uD83E\uDD5B',
  'Fleisch & Wurst': '\uD83E\uDD69',
  'Tiefk\u00FChl': '\uD83E\uDDCA',
  'Konserven & Gl\u00E4ser': '\uD83E\uDD6B',
  'Trockenwaren & Beilagen': '\uD83C\uDF5D',
  'Backzutaten': '\uD83E\uDDC8',
  'Gew\u00FCrze & \u00D6le': '\uD83E\uDDC2',
  'Getr\u00E4nke': '\uD83E\uDD64',
  'S\u00FC\u00DFwaren & Snacks': '\uD83C\uDF6B',
  'Sonstiges': '\uD83D\uDCE6',
};

interface AisleSectionHeaderProps {
  group: AisleGroup;
}

export function AisleSectionHeader({ group }: AisleSectionHeaderProps) {
  const emoji = AISLE_EMOJI[group.category] ?? '\uD83D\uDCE6';
  const checkedCount = group.items.filter(i => i.is_checked).length;

  return (
    <View className="bg-background pt-3 pb-2 px-4">
      <Text className="text-xs font-bold text-accent uppercase tracking-wide">
        {emoji} {group.category}{' '}
        <Text className="text-muted font-normal">
          ({checkedCount}/{group.item_count})
        </Text>
      </Text>
    </View>
  );
}
