import { View, Text, SectionList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShoppingListStore } from '../store/useShoppingListStore';
import { ShoppingItemCard } from '../components/ShoppingItemCard';
import { AisleSectionHeader } from '../components/AisleSection';
import { useTranslation } from '../../../shared/i18n/t';
import type { AisleGroup, ShoppingListItem } from '../types';

interface SectionData {
  group: AisleGroup;
  data: readonly ShoppingListItem[];
}

export function ShoppingListScreen() {
  const insets = useSafeAreaInsets();
  const shoppingList = useShoppingListStore(state => state.shoppingList);
  const t = useTranslation();

  if (!shoppingList) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#888888' }}>{t.shoppingList.empty}</Text>
      </View>
    );
  }

  const totalChecked = shoppingList.groups.reduce(
    (sum, g) => sum + g.items.filter(i => i.is_checked).length,
    0
  );

  const formatTotal = (): string => {
    if (shoppingList.total_estimated_cents === 0) return '';
    const euros = (shoppingList.total_estimated_cents / 100).toLocaleString('de-DE', {
      minimumFractionDigits: 2,
    });
    return t.shoppingList.estimatedTotal(euros);
  };

  const sections: SectionData[] = shoppingList.groups.map(group => ({
    group,
    data: group.items,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff', paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#1a1a1a' }}>
          {t.shoppingList.title}
        </Text>
      </View>

      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 12,
          backgroundColor: '#f5f5f5',
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#e5e5e5',
        }}
      >
        <Text style={{ fontSize: 14, color: '#1a1a1a' }}>
          {t.shoppingList.itemsDone(totalChecked, shoppingList.total_items)}
        </Text>
        {shoppingList.total_estimated_cents > 0 && (
          <Text style={{ fontSize: 14, color: '#2563eb', fontWeight: '500' }}>
            {formatTotal()}
          </Text>
        )}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <ShoppingItemCard item={item} />
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <AisleSectionHeader group={(section as SectionData).group} />
        )}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: 16 }} />}
      />
    </View>
  );
}
