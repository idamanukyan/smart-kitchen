import { View, Text, TextInput, Pressable, Modal, ScrollView, Platform } from 'react-native';
import { useState, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { usePantryStore } from '../store/usePantryStore';
import { useTranslation } from '../../../shared/i18n/t';
import { RECIPE_BY_ID, DEMO_INGREDIENTS } from '../../../data/demo-data';

interface ConsumptionSheetProps {
  recipeId: string;
  servingsOverride: number | null;
  onClose: () => void;
}

interface DeductionLine {
  ingredientId: string;
  ingredientName: string;
  recipeAmount: number;
  unit: string;
  pantryAmount: number;
  editableAmount: string;
}

export function ConsumptionSheet({ recipeId, servingsOverride, onClose }: ConsumptionSheetProps) {
  const t = useTranslation();
  const pantryItems = usePantryStore((s) => s.items);
  const deductIngredients = usePantryStore((s) => s.deductIngredients);
  const recipe = RECIPE_BY_ID.get(recipeId);

  const initialLines = useMemo((): DeductionLine[] => {
    if (!recipe) return [];
    const servings = servingsOverride ?? recipe.servings_default;
    const scalingFactor = recipe.servings_default > 0 ? servings / recipe.servings_default : 1;

    return recipe.ingredients.map((ri) => {
      const scaledAmount = ri.amount * scalingFactor;
      const pantryItem = pantryItems.find((p) => p.ingredientId === ri.ingredient_id);
      const ingredientData = DEMO_INGREDIENTS.find((i) => i.id === ri.ingredient_id);
      return {
        ingredientId: ri.ingredient_id,
        ingredientName: ingredientData?.name_de ?? ri.ingredient_id,
        recipeAmount: Math.round(scaledAmount * 100) / 100,
        unit: ri.unit,
        pantryAmount: pantryItem?.amount ?? 0,
        editableAmount: String(Math.round(scaledAmount * 100) / 100),
      };
    }).filter((line) => line.pantryAmount > 0);
  }, [recipe, servingsOverride, pantryItems]);

  const [lines, setLines] = useState<DeductionLine[]>(initialLines);

  const updateAmount = (index: number, value: string) => {
    setLines((prev) => prev.map((line, i) => i === index ? { ...line, editableAmount: value } : line));
  };

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const deductions = lines
      .map((line) => ({ ingredientId: line.ingredientId, amount: parseFloat(line.editableAmount) || 0, unit: line.unit }))
      .filter((d) => d.amount > 0);
    deductIngredients(deductions);
    onClose();
  };

  if (!recipe || initialLines.length === 0) {
    onClose();
    return null;
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{
          backgroundColor: '#faf8f5', borderTopLeftRadius: 20, borderTopRightRadius: 20,
          paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '75%',
        }}>
          <View style={{ width: 36, height: 4, backgroundColor: '#d0c8c0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#3d3529', marginBottom: 4 }}>{t.consumption.title}</Text>
          <Text style={{ fontSize: 14, color: '#a09080', marginBottom: 16 }}>{recipe.title_de} — {t.consumption.subtitle}</Text>

          <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e8e0d8' }}>
              <Text style={{ flex: 1, fontSize: 12, color: '#a09080', fontWeight: '600' }}>Zutat</Text>
              <Text style={{ width: 70, fontSize: 12, color: '#a09080', fontWeight: '600', textAlign: 'right' }}>{t.consumption.currentPantry}</Text>
              <Text style={{ width: 80, fontSize: 12, color: '#a09080', fontWeight: '600', textAlign: 'right' }}>{t.consumption.toDeduct}</Text>
            </View>
            {lines.map((line, index) => (
              <View key={line.ingredientId} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0ebe5' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, color: '#3d3529' }}>{line.ingredientName}</Text>
                </View>
                <Text style={{ width: 70, fontSize: 13, color: '#a09080', textAlign: 'right' }}>{line.pantryAmount} {line.unit}</Text>
                <View style={{ width: 80, alignItems: 'flex-end' }}>
                  <TextInput
                    style={{ backgroundColor: '#ffffff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, fontSize: 14, borderWidth: 1, borderColor: '#e8e0d8', color: '#3d3529', textAlign: 'right', width: 70 }}
                    value={line.editableAmount} onChangeText={(v) => updateAmount(index, v)} keyboardType="numeric"
                  />
                </View>
              </View>
            ))}
          </ScrollView>

          <Pressable onPress={handleConfirm} style={({ pressed }) => ({
            marginTop: 16, backgroundColor: '#c07a45', padding: 14, borderRadius: 12, alignItems: 'center', opacity: pressed ? 0.85 : 1,
          })}>
            <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 15 }}>{t.consumption.confirm}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
