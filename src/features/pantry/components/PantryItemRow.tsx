import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../../../shared/i18n/t';
import type { PantryItem } from '../types';

interface PantryItemRowProps {
  item: PantryItem;
  onPress: (item: PantryItem) => void;
}

function daysUntilExpiry(expiresAt: string): number {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function expiryColor(days: number): string {
  if (days < 2) return '#dc2626';
  if (days <= 5) return '#d97706';
  return '#16a34a';
}

export function PantryItemRow({ item, onPress }: PantryItemRowProps) {
  const t = useTranslation();
  const days = item.expiresAt ? daysUntilExpiry(item.expiresAt) : null;
  const expiryText = (() => {
    if (days === null) return t.pantry.noExpiry;
    if (days <= 0) return t.pantry.expired;
    return t.pantry.expiresIn(days);
  })();
  const expiryTextColor = days !== null ? expiryColor(days) : '#a09080';

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(item);
      }}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e8e0d8',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
      })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '500', color: '#3d3529' }}>{item.ingredientName}</Text>
          <Text style={{ fontSize: 13, color: '#a09080', marginTop: 2 }}>{item.amount} {item.unit}</Text>
        </View>
        <Text style={{ fontSize: 12, color: expiryTextColor, fontWeight: '500' }}>{expiryText}</Text>
      </View>
    </Pressable>
  );
}
