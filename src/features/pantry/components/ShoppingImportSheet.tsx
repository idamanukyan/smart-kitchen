import { View, Text, Pressable, Modal, ScrollView, Switch, Platform } from 'react-native';
import { useState, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { usePantryStore } from '../store/usePantryStore';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { useTranslation } from '../../../shared/i18n/t';
import { DEMO_INGREDIENTS } from '../../../data/demo-data';
import type { ShoppingListItem } from '../../shopping-list/types';

interface ShoppingImportSheetProps {
  checkedItems: ShoppingListItem[];
  onClose: () => void;
  onImported: () => void;
}

interface ImportLine {
  item: ShoppingListItem;
  selected: boolean;
  expiryDate: string;
}

export function ShoppingImportSheet({ checkedItems, onClose, onImported }: ShoppingImportSheetProps) {
  const t = useTranslation();
  const addItems = usePantryStore((s) => s.addItems);
  const userId = useAuthStore((s) => s.userId);
  const householdId = useAuthStore((s) => s.householdId);

  const initialLines = useMemo(() => {
    return checkedItems.map((item): ImportLine => {
      const ingredient = DEMO_INGREDIENTS.find((i) => i.id === item.ingredient_id);
      const shelfLifeDays = ingredient?.shelf_life_days;
      let expiryDate = '';
      if (shelfLifeDays) {
        const date = new Date();
        date.setDate(date.getDate() + shelfLifeDays);
        expiryDate = date.toISOString().slice(0, 10);
      }
      return { item, selected: true, expiryDate };
    });
  }, [checkedItems]);

  const [lines, setLines] = useState<ImportLine[]>(initialLines);

  const toggleLine = (index: number) => {
    setLines((prev) => prev.map((line, i) => i === index ? { ...line, selected: !line.selected } : line));
  };

  const handleImport = () => {
    const selectedLines = lines.filter((l) => l.selected);
    if (selectedLines.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const itemsToAdd = selectedLines.map((line) => {
      const ingredient = DEMO_INGREDIENTS.find((i) => i.id === line.item.ingredient_id);
      const purchasedAmount = line.item.package_size > 0
        ? line.item.package_count * line.item.package_size
        : line.item.amount_needed;
      return {
        householdId: householdId ?? 'local',
        ingredientId: line.item.ingredient_id,
        ingredientName: line.item.ingredient_name,
        amount: purchasedAmount,
        unit: line.item.unit,
        storageType: (ingredient?.storage_type ?? 'Vorratskammer') as 'Kühlschrank' | 'Tiefkühler' | 'Vorratskammer' | 'Raumtemperatur',
        expiresAt: line.expiryDate || null,
        addedByUserId: userId ?? 'local',
      };
    });

    addItems(itemsToAdd);
    onImported();
    onClose();
  };

  const selectedCount = lines.filter((l) => l.selected).length;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{
          backgroundColor: '#faf8f5', borderTopLeftRadius: 20, borderTopRightRadius: 20,
          paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '75%',
        }}>
          <View style={{ width: 36, height: 4, backgroundColor: '#d0c8c0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#3d3529', marginBottom: 4 }}>{t.pantryImport.title}</Text>
          <Text style={{ fontSize: 14, color: '#a09080', marginBottom: 16 }}>{t.pantryImport.subtitle}</Text>

          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
            {lines.map((line, index) => (
              <View key={line.item.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e8e0d8' }}>
                <Switch value={line.selected} onValueChange={() => toggleLine(index)} trackColor={{ false: '#d0c8c0', true: '#c07a45' }} thumbColor="#ffffff" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 15, color: '#3d3529' }}>{line.item.ingredient_name}</Text>
                  <Text style={{ fontSize: 13, color: '#a09080' }}>{line.item.display_text}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <Pressable onPress={handleImport} disabled={selectedCount === 0} style={({ pressed }) => ({
            marginTop: 16, backgroundColor: selectedCount > 0 ? '#c07a45' : '#d0c8c0',
            padding: 14, borderRadius: 12, alignItems: 'center', opacity: pressed && selectedCount > 0 ? 0.85 : 1,
          })}>
            <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 15 }}>{t.pantryImport.confirm} ({selectedCount})</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
