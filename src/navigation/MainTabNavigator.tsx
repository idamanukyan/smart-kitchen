import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useTranslation } from '../shared/i18n/t';
import { PlaceholderScreen } from '../shared/components/PlaceholderScreen';
import { MealPlanScreen } from '../features/meal-plan/screens/MealPlanScreen';
import { ShoppingListScreen } from '../features/shopping-list/screens/ShoppingListScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function RezeptePlaceholder() {
  const t = useTranslation();
  return <PlaceholderScreen title={t.tabs.rezepte} />;
}

export function MainTabNavigator() {
  const t = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e5e5',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#888888',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Wochenplan"
        component={MealPlanScreen}
        options={{
          tabBarLabel: t.tabs.wochenplan,
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📅</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Einkaufsliste"
        component={ShoppingListScreen}
        options={{
          tabBarLabel: t.tabs.einkaufsliste,
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🛒</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Rezepte"
        component={RezeptePlaceholder}
        options={{
          tabBarLabel: t.tabs.rezepte,
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📖</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Einstellungen"
        component={SettingsScreen}
        options={{
          tabBarLabel: t.tabs.einstellungen,
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
