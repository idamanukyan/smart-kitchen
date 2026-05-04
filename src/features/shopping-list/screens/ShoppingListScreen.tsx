import { View, Text, SectionList, Pressable } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShoppingListStore } from '../store/useShoppingListStore';
import { ShoppingItemCard } from '../components/ShoppingItemCard';
import { AisleSectionHeader } from '../components/AisleSection';
import { useTranslation } from '../../../shared/i18n/t';
import { ShoppingImportSheet } from '../../pantry/components/ShoppingImportSheet';
import type { AisleGroup, ShoppingListItem } from '../types';
import { usePantryStore } from '../../pantry/store/usePantryStore';
import { useMealPlanStore } from '../../meal-plan/store/useMealPlanStore';
import { RECIPE_BY_ID } from '../../../data/demo-data';

interface SectionData {
  group: AisleGroup;
  data: readonly ShoppingListItem[];
}

export function ShoppingListScreen() {
  const insets = useSafeAreaInsets();
  const shoppingList = useShoppingListStore(state => state.shoppingList);
  const t = useTranslation();

  const getExpiringItems = usePantryStore((s) => s.getExpiringItems);
  const activePlan = useMealPlanStore((s) => s.activePlan);

  const expiringItems = getExpiringItems(3);

  const usedIngredientIds = new Set(
    activePlan.slots
      .filter((s) => s.recipe_id !== null)
      .flatMap((s) => {
        const recipe = RECIPE_BY_ID?.get(s.recipe_id!);
        return recipe?.ingredients.map((ri) => ri.ingredient_id) ?? [];
      })
  );

  const unusedExpiringItems = expiringItems.filter(
    (item) => !usedIngredientIds.has(item.ingredientId)
  );

  if (!shoppingList) {
    return (
      <View style={{ flex: 1, backgroundColor: '#faf8f5', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#a09080' }}>{t.shoppingList.empty}</Text>
      </View>
    );
  }

  const totalChecked = shoppingList.groups.reduce(
    (sum, g) => sum + g.items.filter(i => i.is_checked).length,
    0
  );
  const [showImport, setShowImport] = useState(false);
  const checkedItems = shoppingList.groups.flatMap(g => g.items).filter(i => i.is_checked);

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
    <View style={{ flex: 1, backgroundColor: '#faf8f5', paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#3d3529' }}>
          {t.shoppingList.title}
        </Text>
      </View>

      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 12,
          backgroundColor: '#ffffff',
          borderRadius: 16,
          paddingHorizontal: 12,
          paddingVertical: 8,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#e8e0d8',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 3,
          elevation: 1,
        }}
      >
        <Text style={{ fontSize: 14, color: '#3d3529' }}>
          {t.shoppingList.itemsDone(totalChecked, shoppingList.total_items)}
        </Text>
        {shoppingList.total_estimated_cents > 0 && (
          <Text style={{ fontSize: 14, color: '#c07a45', fontWeight: '500' }}>
            {formatTotal()}
          </Text>
        )}
        {totalChecked > 0 && (
          <Pressable
            onPress={() => setShowImport(true)}
            style={({ pressed }) => ({
              backgroundColor: '#c07a45', paddingHorizontal: 12, paddingVertical: 6,
              borderRadius: 8, opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>
              {t.shoppingList.finishTrip}
            </Text>
          </Pressable>
        )}
      </View>

      {unusedExpiringItems.length > 0 && (
        <View style={{
          marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fef3cd',
          borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#f0d88a',
        }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#856404', marginBottom: 6 }}>
            ⚠️ {t.shoppingExpiry.title}
          </Text>
          {unusedExpiringItems.map((item) => {
            const days = item.expiresAt
              ? Math.ceil((new Date(item.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : 0;
            return (
              <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ fontSize: 13, color: '#856404' }}>{item.ingredientName} — {item.amount} {item.unit}</Text>
                <Text style={{ fontSize: 12, color: '#856404', fontWeight: '500' }}>{t.shoppingExpiry.daysLeft(days)}</Text>
              </View>
            );
          })}
        </View>
      )}

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
      {showImport && (
        <ShoppingImportSheet
          checkedItems={checkedItems}
          onClose={() => setShowImport(false)}
          onImported={() => {}}
        />
      )}
    </View>
  );
}
