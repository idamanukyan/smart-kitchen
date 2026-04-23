import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useTranslation } from '../shared/i18n/t';
import { MealPlanScreen } from '../features/meal-plan/screens/MealPlanScreen';
import { ShoppingListScreen } from '../features/shopping-list/screens/ShoppingListScreen';
import { RecipesScreen } from '../features/recipes/screens/RecipesScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export function MainTabNavigator() {
  const t = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#faf8f5',
          borderTopColor: '#e8e0d8',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#c07a45',
        tabBarInactiveTintColor: '#a09080',
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
        component={RecipesScreen}
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
