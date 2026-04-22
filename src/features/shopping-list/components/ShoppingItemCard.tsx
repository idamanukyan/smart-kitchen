import { View, Text, Pressable } from 'react-native';
import type { ShoppingListItem } from '../types';
import { useShoppingListStore } from '../store/useShoppingListStore';

interface ShoppingItemCardProps {
  item: ShoppingListItem;
}

export function ShoppingItemCard({ item }: ShoppingItemCardProps) {
  const toggleItem = useShoppingListStore(state => state.toggleItem);

  const formatPrice = (cents: number): string => {
    if (cents === 0) return '';
    return `~${(cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })} \u20AC`;
  };

  const formatPackageInfo = (): string => {
    if (item.package_size === 0) return '';
    if (item.package_count === 1) {
      return `1 Packung`;
    }
    return `${item.package_count} Packungen`;
  };

  const secondaryParts = [
    item.display_text !== item.ingredient_name ? item.display_text : `${item.amount_needed} ${item.unit}`,
    formatPackageInfo(),
    formatPrice(item.estimated_price_cents),
  ].filter(Boolean);

  return (
    <Pressable
      onPress={() => toggleItem(item.id)}
      className="active:opacity-80"
    >
      <View
        className="bg-surface rounded-xl p-3 mb-2 flex-row items-center"
        style={item.is_checked ? { opacity: 0.5 } : undefined}
      >
        {/* Checkbox */}
        <View
          className="w-6 h-6 rounded-md mr-3 items-center justify-center border-2"
          style={
            item.is_checked
              ? { backgroundColor: '#7aa2f7', borderColor: '#7aa2f7' }
              : { borderColor: '#555' }
          }
        >
          {item.is_checked && (
            <Text className="text-xs text-background font-bold">{'\u2713'}</Text>
          )}
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text
            className="text-sm font-medium text-white"
            style={item.is_checked ? { textDecorationLine: 'line-through', color: '#666' } : undefined}
          >
            {item.ingredient_name}
          </Text>
          <Text
            className="text-xs text-muted mt-0.5"
            style={item.is_checked ? { textDecorationLine: 'line-through', color: '#555' } : undefined}
            numberOfLines={1}
          >
            {secondaryParts.join(' \u00B7 ')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
