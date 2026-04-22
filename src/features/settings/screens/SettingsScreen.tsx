import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../../shared/i18n/t';
import { useLanguageStore, type Locale } from '../../../shared/i18n/useLanguage';

function LanguagePill({ value, label }: { value: Locale; label: string }) {
  const { locale, setLocale } = useLanguageStore();
  const isActive = locale === value;

  return (
    <Pressable
      onPress={() => setLocale(value)}
      style={{
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: isActive ? '#2563eb' : '#f5f5f5',
        borderWidth: 1,
        borderColor: isActive ? '#2563eb' : '#e5e5e5',
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: isActive ? '#ffffff' : '#1a1a1a',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const t = useTranslation();

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff', paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#1a1a1a' }}>
          {t.settings.title}
        </Text>
      </View>

      {/* Language row */}
      <View
        style={{
          marginHorizontal: 16,
          marginTop: 16,
          backgroundColor: '#f5f5f5',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#e5e5e5',
          padding: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 16, color: '#1a1a1a' }}>
          {t.settings.language}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <LanguagePill value="de" label="DE" />
          <LanguagePill value="en" label="EN" />
        </View>
      </View>
    </View>
  );
}
