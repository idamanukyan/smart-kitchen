import { View, Text, TextInput, Pressable, Modal, Alert, Platform } from 'react-native';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { usePantryStore } from '../store/usePantryStore';
import { useTranslation } from '../../../shared/i18n/t';
import type { PantryItem } from '../types';

interface EditItemSheetProps {
  item: PantryItem;
  onClose: () => void;
}

export function EditItemSheet({ item, onClose }: EditItemSheetProps) {
  const t = useTranslation();
  const updateItem = usePantryStore((s) => s.updateItem);
  const removeItem = usePantryStore((s) => s.removeItem);
  const [amount, setAmount] = useState(String(item.amount));
  const [expiryDate, setExpiryDate] = useState(item.expiresAt ?? '');

  const handleSave = () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateItem(item.id, { amount: parsed, expiresAt: expiryDate || null });
    onClose();
  };

  const handleDelete = () => {
    Alert.alert(t.pantry.deleteConfirm, '', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: t.pantry.delete, style: 'destructive', onPress: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        removeItem(item.id);
        onClose();
      }},
    ]);
  };

  const canSave = amount !== '' && parseFloat(amount) > 0;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{
          backgroundColor: '#faf8f5', borderTopLeftRadius: 20, borderTopRightRadius: 20,
          paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        }}>
          <View style={{ width: 36, height: 4, backgroundColor: '#d0c8c0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#3d3529', marginBottom: 16 }}>{item.ingredientName}</Text>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#6b5b4e', marginBottom: 4 }}>{t.pantry.amount}</Text>
              <TextInput style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#e8e0d8', color: '#3d3529' }}
                value={amount} onChangeText={setAmount} keyboardType="numeric" autoFocus />
            </View>
            <View style={{ width: 80 }}>
              <Text style={{ fontSize: 13, color: '#6b5b4e', marginBottom: 4 }}>{t.pantry.unit}</Text>
              <View style={{ backgroundColor: '#f0ebe5', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e8e0d8', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 15, color: '#3d3529' }}>{item.unit}</Text>
              </View>
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, color: '#6b5b4e', marginBottom: 4 }}>{t.pantry.expiryDate}</Text>
            <TextInput style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#e8e0d8', color: '#3d3529' }}
              placeholder="YYYY-MM-DD" placeholderTextColor="#a09080" value={expiryDate} onChangeText={setExpiryDate} />
          </View>

          <Pressable onPress={handleSave} disabled={!canSave} style={({ pressed }) => ({
            backgroundColor: canSave ? '#c07a45' : '#d0c8c0', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8, opacity: pressed && canSave ? 0.85 : 1,
          })}>
            <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 15 }}>{t.pantry.save}</Text>
          </Pressable>

          <Pressable onPress={handleDelete} style={({ pressed }) => ({ padding: 14, borderRadius: 12, alignItems: 'center', opacity: pressed ? 0.6 : 1 })}>
            <Text style={{ color: '#dc2626', fontWeight: '500', fontSize: 15 }}>{t.pantry.delete}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
