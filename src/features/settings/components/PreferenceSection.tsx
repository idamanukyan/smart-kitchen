import { View, Text, Pressable } from 'react-native';

interface PillOption {
  value: string;
  label: string;
}

interface PreferenceSectionProps {
  title: string;
  options: PillOption[];
  selected: string | string[];
  onSelect: (value: string) => void;
  multiSelect?: boolean;
}

export function PreferenceSection({ title, options, selected, onSelect, multiSelect = false }: PreferenceSectionProps) {
  const isSelected = (value: string) =>
    Array.isArray(selected) ? selected.includes(value) : selected === value;

  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#3d3529', marginBottom: 10, paddingHorizontal: 16 }}>
        {title}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 }}>
        {options.map(opt => {
          const active = isSelected(opt.value);
          return (
            <Pressable
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: active ? '#c07a45' : '#faf8f5',
                borderWidth: 1,
                borderColor: active ? '#c07a45' : '#e8e0d8',
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: '500',
                color: active ? '#ffffff' : '#3d3529',
              }}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface StepperProps {
  title: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  displayValue: string;
}

export function StepperSection({ title, value, onIncrement, onDecrement, displayValue }: StepperProps) {
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#3d3529', marginBottom: 10, paddingHorizontal: 16 }}>
        {title}
      </Text>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e8e0d8',
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 1,
      }}>
        <Pressable
          onPress={onDecrement}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#faf8f5',
            borderWidth: 1,
            borderColor: '#e8e0d8',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 18, color: '#3d3529', fontWeight: '600' }}>−</Text>
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#3d3529' }}>
          {displayValue}
        </Text>
        <Pressable
          onPress={onIncrement}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#faf8f5',
            borderWidth: 1,
            borderColor: '#e8e0d8',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 18, color: '#3d3529', fontWeight: '600' }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}
