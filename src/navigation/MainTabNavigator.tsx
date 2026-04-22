import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { DE } from '../shared/i18n/de';
import { PlaceholderScreen } from '../shared/components/PlaceholderScreen';
import { MealPlanScreen } from '../features/meal-plan/screens/MealPlanScreen';
import { ShoppingListScreen } from '../features/shopping-list/screens/ShoppingListScreen';

const Tab = createBottomTabNavigator();

function RezeptePlaceholder() {
  return <PlaceholderScreen title={DE.tabs.rezepte} />;
}

function EinstellungenPlaceholder() {
  return <PlaceholderScreen title={DE.tabs.einstellungen} />;
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f0f23',
          borderTopColor: '#333',
        },
        tabBarActiveTintColor: '#7aa2f7',
        tabBarInactiveTintColor: '#888',
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
          tabBarLabel: DE.tabs.wochenplan,
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📅</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Einkaufsliste"
        component={ShoppingListScreen}
        options={{
          tabBarLabel: DE.tabs.einkaufsliste,
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🛒</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Rezepte"
        component={RezeptePlaceholder}
        options={{
          tabBarLabel: DE.tabs.rezepte,
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📖</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Einstellungen"
        component={EinstellungenPlaceholder}
        options={{
          tabBarLabel: DE.tabs.einstellungen,
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
