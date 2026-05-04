import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import type { PantryItem, StorageType } from '../types';
import { PantryItemRow } from './PantryItemRow';
import { useTranslation } from '../../../shared/i18n/t';

const STORAGE_ICONS: Record<StorageType, string> = {
  Kühlschrank: '🧊',
  Tiefkühler: '❄️',
  Vorratskammer: '🏠',
  Raumtemperatur: '🌡️',
};

interface StorageSectionProps {
  storageType: StorageType;
  items: PantryItem[];
  onItemPress: (item: PantryItem) => void;
}

export function StorageSection({ storageType, items, onItemPress }: StorageSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const t = useTranslation();

  return (
    <View style={{ marginBottom: 16 }}>
      <Pressable
        onPress={() => setCollapsed(!collapsed)}
        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 }}
      >
        <Text style={{ fontSize: 16 }}>{STORAGE_ICONS[storageType]}</Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#3d3529', marginLeft: 8, flex: 1 }}>
          {t.storageTypes[storageType] ?? storageType}
        </Text>
        <View style={{ backgroundColor: '#e8e0d8', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
          <Text style={{ fontSize: 12, color: '#6b5b4e', fontWeight: '600' }}>{items.length}</Text>
        </View>
        <Text style={{ fontSize: 14, color: '#a09080', marginLeft: 8 }}>{collapsed ? '▸' : '▾'}</Text>
      </Pressable>
      {!collapsed && items.map((item) => (
        <PantryItemRow key={item.id} item={item} onPress={onItemPress} />
      ))}
    </View>
  );
}
