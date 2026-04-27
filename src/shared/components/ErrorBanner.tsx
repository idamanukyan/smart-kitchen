import { View, Text, Pressable } from 'react-native';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <View style={{
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: '#fef2f2',
      borderWidth: 1,
      borderColor: '#fecaca',
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
    }}>
      <Text style={{ flex: 1, fontSize: 13, color: '#991b1b', lineHeight: 18 }}>
        {message}
      </Text>
      <Pressable onPress={onDismiss} style={{ paddingLeft: 12 }}>
        <Text style={{ fontSize: 16, color: '#991b1b', fontWeight: '600' }}>✕</Text>
      </Pressable>
    </View>
  );
}
