import { View, Text, SectionList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShoppingListStore } from '../store/useShoppingListStore';
import { ShoppingItemCard } from '../components/ShoppingItemCard';
import { AisleSectionHeader } from '../components/AisleSection';
import { DE } from '../../../shared/i18n/de';
import type { AisleGroup, ShoppingListItem } from '../types';

interface SectionData {
  group: AisleGroup;
  data: readonly ShoppingListItem[];
}

export function ShoppingListScreen() {
  const insets = useSafeAreaInsets();
  const shoppingList = useShoppingListStore(state => state.shoppingList);

  if (!shoppingList) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted">Keine Einkaufsliste vorhanden</Text>
      </View>
    );
  }

  // Count checked items across all groups.
  const totalChecked = shoppingList.groups.reduce(
    (sum, g) => sum + g.items.filter(i => i.is_checked).length,
    0
  );

  const formatTotal = (): string => {
    if (shoppingList.total_estimated_cents === 0) return '';
    const euros = (shoppingList.total_estimated_cents / 100).toLocaleString('de-DE', {
      minimumFractionDigits: 2,
    });
    return DE.shoppingList.estimatedTotal(euros);
  };

  const sections: SectionData[] = shoppingList.groups.map(group => ({
    group,
    data: group.items,
  }));

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-white">
          {DE.shoppingList.title}
        </Text>
      </View>

      {/* Summary bar */}
      <View className="mx-4 mb-3 bg-surface rounded-lg px-3 py-2 flex-row justify-between items-center">
        <Text className="text-sm text-white">
          {DE.shoppingList.itemsDone(totalChecked, shoppingList.total_items)}
        </Text>
        {shoppingList.total_estimated_cents > 0 && (
          <Text className="text-sm text-accent font-medium">
            {formatTotal()}
          </Text>
        )}
      </View>

      {/* Shopping list */}
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View className="px-4">
            <ShoppingItemCard item={item} />
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <AisleSectionHeader group={(section as SectionData).group} />
        )}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View className="h-4" />}
      />
    </View>
  );
}
