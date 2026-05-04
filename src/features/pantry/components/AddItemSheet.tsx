import { View, Text, TextInput, Pressable, Modal, FlatList, Platform } from 'react-native';
import { useState, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { usePantryStore } from '../store/usePantryStore';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { useTranslation } from '../../../shared/i18n/t';
import { DEMO_INGREDIENTS } from '../../../data/demo-data';
import type { Ingredient } from '../../shopping-list/types';
import type { StorageType } from '../types';

interface AddItemSheetProps {
  onClose: () => void;
}

export function AddItemSheet({ onClose }: AddItemSheetProps) {
  const t = useTranslation();
  const addItem = usePantryStore((s) => s.addItem);
  const userId = useAuthStore((s) => s.userId);
  const householdId = useAuthStore((s) => s.householdId);

  const [searchText, setSearchText] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [amount, setAmount] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [storageType, setStorageType] = useState<StorageType>('Vorratskammer');

  const filteredIngredients = useMemo(() => {
    if (searchText.length < 2) return [];
    const query = searchText.toLowerCase();
    return DEMO_INGREDIENTS.filter((i) => i.name_de.toLowerCase().includes(query)).slice(0, 10);
  }, [searchText]);

  const handleSelectIngredient = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setSearchText(ingredient.name_de);
    setStorageType(ingredient.storage_type ?? 'Vorratskammer');
    if (ingredient.shelf_life_days) {
      const date = new Date();
      date.setDate(date.getDate() + ingredient.shelf_life_days);
      setExpiryDate(date.toISOString().slice(0, 10));
    }
  };

  const handleSave = () => {
    if (!selectedIngredient || !amount || parseFloat(amount) <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addItem({
      householdId: householdId ?? 'local',
      ingredientId: selectedIngredient.id,
      ingredientName: selectedIngredient.name_de,
      amount: parseFloat(amount),
      unit: selectedIngredient.default_unit,
      storageType,
      expiresAt: expiryDate || null,
      addedByUserId: userId ?? 'local',
    });
    onClose();
  };

  const canSave = selectedIngredient !== null && amount !== '' && parseFloat(amount) > 0;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{
          backgroundColor: '#faf8f5', borderTopLeftRadius: 20, borderTopRightRadius: 20,
          paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '80%',
        }}>
          <View style={{ width: 36, height: 4, backgroundColor: '#d0c8c0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#3d3529', marginBottom: 16 }}>{t.pantry.add}</Text>

          <TextInput
            style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#e8e0d8', color: '#3d3529', marginBottom: 8 }}
            placeholder={t.pantry.searchPlaceholder}
            placeholderTextColor="#a09080"
            value={searchText}
            onChangeText={(text) => { setSearchText(text); if (selectedIngredient && text !== selectedIngredient.name_de) setSelectedIngredient(null); }}
            autoFocus
          />

          {filteredIngredients.length > 0 && !selectedIngredient && (
            <View style={{ maxHeight: 200, marginBottom: 8 }}>
              <FlatList
                data={filteredIngredients}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable onPress={() => handleSelectIngredient(item)} style={({ pressed }) => ({
                    paddingVertical: 10, paddingHorizontal: 12, backgroundColor: pressed ? '#f0ebe5' : 'transparent', borderRadius: 8,
                  })}>
                    <Text style={{ fontSize: 15, color: '#3d3529' }}>{item.name_de}</Text>
                    <Text style={{ fontSize: 12, color: '#a09080' }}>{item.category}</Text>
                  </Pressable>
                )}
              />
            </View>
          )}

          {selectedIngredient && (
            <>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: '#6b5b4e', marginBottom: 4 }}>{t.pantry.amount}</Text>
                  <TextInput style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#e8e0d8', color: '#3d3529' }}
                    placeholder="0" placeholderTextColor="#a09080" value={amount} onChangeText={setAmount} keyboardType="numeric" />
                </View>
                <View style={{ width: 80 }}>
                  <Text style={{ fontSize: 13, color: '#6b5b4e', marginBottom: 4 }}>{t.pantry.unit}</Text>
                  <View style={{ backgroundColor: '#f0ebe5', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e8e0d8', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, color: '#3d3529' }}>{selectedIngredient.default_unit}</Text>
                  </View>
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 13, color: '#6b5b4e', marginBottom: 4 }}>{t.pantry.expiryDate}</Text>
                <TextInput style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#e8e0d8', color: '#3d3529' }}
                  placeholder="YYYY-MM-DD" placeholderTextColor="#a09080" value={expiryDate} onChangeText={setExpiryDate} />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: '#6b5b4e', marginBottom: 4 }}>{t.pantry.storageType}</Text>
                <View style={{ backgroundColor: '#f0ebe5', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e8e0d8' }}>
                  <Text style={{ fontSize: 15, color: '#3d3529' }}>{t.storageTypes[storageType] ?? storageType}</Text>
                </View>
              </View>

              <Pressable onPress={handleSave} disabled={!canSave} style={({ pressed }) => ({
                backgroundColor: canSave ? '#c07a45' : '#d0c8c0', padding: 14, borderRadius: 12, alignItems: 'center', opacity: pressed && canSave ? 0.85 : 1,
              })}>
                <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 15 }}>{t.pantry.save}</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
