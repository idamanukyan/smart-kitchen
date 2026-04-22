import { View, Text } from 'react-native';
import { DE } from '../i18n/de';

interface PlaceholderScreenProps {
  title: string;
}

export function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      <Text className="text-2xl font-bold text-white mb-2">{title}</Text>
      <Text className="text-base text-muted text-center">
        {DE.placeholder.comingSoonSubtitle}
      </Text>
    </View>
  );
}
