import { View, Text, Pressable } from 'react-native';
import type { ShoppingListItem } from '../types';
import { useShoppingListStore } from '../store/useShoppingListStore';
import { useTranslation } from '../../../shared/i18n/t';

interface ShoppingItemCardProps {
  item: ShoppingListItem;
}

export function ShoppingItemCard({ item }: ShoppingItemCardProps) {
  const toggleItem = useShoppingListStore(state => state.toggleItem);
  const t = useTranslation();

  const formatPrice = (cents: number): string => {
    if (cents === 0) return '';
    return `~${(cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`;
  };

  const formatPackageInfo = (): string => {
    if (item.package_size === 0) return '';
    if (item.package_count === 1) return t.shoppingList.package1;
    return t.shoppingList.packageN(item.package_count);
  };

  const secondaryParts = [
    item.display_text !== item.ingredient_name ? item.display_text : `${item.amount_needed} ${item.unit}`,
    formatPackageInfo(),
    formatPrice(item.estimated_price_cents),
  ].filter(Boolean);

  return (
    <Pressable onPress={() => toggleItem(item.id)}>
      <View
        style={{
          backgroundColor: '#f5f5f5',
          borderRadius: 12,
          padding: 12,
          marginBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#e5e5e5',
          opacity: item.is_checked ? 0.5 : 1,
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            marginRight: 12,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            backgroundColor: item.is_checked ? '#2563eb' : 'transparent',
            borderColor: item.is_checked ? '#2563eb' : '#d4d4d4',
          }}
        >
          {item.is_checked && (
            <Text style={{ fontSize: 12, color: '#ffffff', fontWeight: '700' }}>✓</Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: item.is_checked ? '#888888' : '#1a1a1a',
              textDecorationLine: item.is_checked ? 'line-through' : 'none',
            }}
          >
            {item.ingredient_name}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: item.is_checked ? '#aaaaaa' : '#888888',
              marginTop: 2,
              textDecorationLine: item.is_checked ? 'line-through' : 'none',
            }}
            numberOfLines={1}
          >
            {secondaryParts.join(' · ')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
