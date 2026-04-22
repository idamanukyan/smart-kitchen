import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { RecipeDetailScreen } from '../features/recipes/screens/RecipeDetailScreen';
import { SetupScreen } from '../features/settings/screens/SetupScreen';
import { usePreferencesStore } from '../shared/store/usePreferencesStore';

export type RootStackParamList = {
  Setup: undefined;
  Main: undefined;
  RecipeDetail: { recipeId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const hasCompletedSetup = usePreferencesStore(state => state.hasCompletedSetup);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!hasCompletedSetup ? (
        <Stack.Screen name="Setup" component={SetupScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
