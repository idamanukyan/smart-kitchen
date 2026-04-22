import { View, Text } from 'react-native';
import { useTranslation } from '../i18n/t';

interface PlaceholderScreenProps {
  title: string;
}

export function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  const t = useTranslation();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', paddingHorizontal: 32 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 }}>{title}</Text>
      <Text style={{ fontSize: 16, color: '#888888', textAlign: 'center' }}>
        {t.placeholder.comingSoonSubtitle}
      </Text>
    </View>
  );
}
