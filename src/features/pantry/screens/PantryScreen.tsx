import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { usePantryStore } from '../store/usePantryStore';
import { StorageSection } from '../components/StorageSection';
import { AddItemSheet } from '../components/AddItemSheet';
import { EditItemSheet } from '../components/EditItemSheet';
import { useTranslation } from '../../../shared/i18n/t';
import type { PantryItem, StorageType } from '../types';

const STORAGE_ORDER: StorageType[] = ['Kühlschrank', 'Tiefkühler', 'Vorratskammer', 'Raumtemperatur'];

function sortByExpiry(items: PantryItem[]): PantryItem[] {
  return [...items].sort((a, b) => {
    if (a.expiresAt === null && b.expiresAt === null) return a.ingredientName.localeCompare(b.ingredientName, 'de');
    if (a.expiresAt === null) return 1;
    if (b.expiresAt === null) return -1;
    return a.expiresAt.localeCompare(b.expiresAt);
  });
}

export function PantryScreen() {
  const insets = useSafeAreaInsets();
  const items = usePantryStore((s) => s.items);
  const t = useTranslation();
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);

  const handleItemPress = useCallback((item: PantryItem) => { setEditingItem(item); }, []);

  const groupedItems = STORAGE_ORDER.map((type) => ({
    storageType: type,
    items: sortByExpiry(items.filter((i) => i.storageType === type)),
  })).filter((group) => group.items.length > 0);

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#faf8f5', paddingTop: insets.top }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#3d3529' }}>{t.pantry.title}</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 44, marginBottom: 16 }}>🏠</Text>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#3d3529', textAlign: 'center' }}>{t.pantry.emptyTitle}</Text>
          <Text style={{ fontSize: 14, color: '#a09080', textAlign: 'center', marginTop: 8 }}>{t.pantry.emptySubtitle}</Text>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowAdd(true); }}
            style={({ pressed }) => ({ marginTop: 24, backgroundColor: '#c07a45', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
            <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 15 }}>{t.pantry.add}</Text>
          </Pressable>
        </View>
        {showAdd && <AddItemSheet onClose={() => setShowAdd(false)} />}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#faf8f5', paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#3d3529' }}>{t.pantry.title}</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        {groupedItems.map(({ storageType, items: groupItems }) => (
          <StorageSection key={storageType} storageType={storageType} items={groupItems} onItemPress={handleItemPress} />
        ))}
      </ScrollView>
      <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowAdd(true); }}
        style={({ pressed }) => ({
          position: 'absolute', right: 20, bottom: 20 + insets.bottom, width: 56, height: 56, borderRadius: 28,
          backgroundColor: '#c07a45', alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
          opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.93 : 1 }],
        })}>
        <Text style={{ fontSize: 28, color: '#ffffff', lineHeight: 32 }}>+</Text>
      </Pressable>
      {showAdd && <AddItemSheet onClose={() => setShowAdd(false)} />}
      {editingItem && <EditItemSheet item={editingItem} onClose={() => setEditingItem(null)} />}
    </View>
  );
}
