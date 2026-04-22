import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../../shared/i18n/t';
import { usePreferencesStore } from '../../../shared/store/usePreferencesStore';
import { useLanguageStore, type Locale } from '../../../shared/i18n/useLanguage';
import { PreferencesContent } from '../components/PreferencesContent';

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
        backgroundColor: isActive ? '#c07a45' : '#faf8f5',
        borderWidth: 1,
        borderColor: isActive ? '#c07a45' : '#e8e0d8',
      }}
    >
      <Text style={{
        fontSize: 14,
        fontWeight: '600',
        color: isActive ? '#ffffff' : '#3d3529',
      }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SetupScreen() {
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const completeSetup = usePreferencesStore(state => state.completeSetup);

  return (
    <View style={{ flex: 1, backgroundColor: '#faf8f5', paddingTop: insets.top }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Welcome header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#3d3529' }}>
            {t.setup.welcome}
          </Text>
          <Text style={{ fontSize: 16, color: '#a09080', marginTop: 8 }}>
            {t.setup.subtitle}
          </Text>
        </View>

        {/* Language */}
        <View style={{
          marginHorizontal: 16,
          marginTop: 20,
          backgroundColor: '#ffffff',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#e8e0d8',
          padding: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 3,
          elevation: 1,
        }}>
          <Text style={{ fontSize: 16, color: '#3d3529' }}>
            {t.settings.language}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <LanguagePill value="de" label="DE" />
            <LanguagePill value="en" label="EN" />
          </View>
        </View>

        {/* Preferences */}
        <PreferencesContent />

        {/* Done button */}
        <View style={{ paddingHorizontal: 16, paddingTop: 32, paddingBottom: 40 }}>
          <Pressable
            onPress={completeSetup}
            style={{
              backgroundColor: '#c07a45',
              borderRadius: 24,
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700' }}>
              {t.setup.done}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
