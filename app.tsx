import './global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
// RootNavigator will be created in Task 2
import { View, Text } from 'react-native';

function PlaceholderRoot() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
      <Text style={{ color: 'white', fontSize: 18 }}>SmartKüche</Text>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <PlaceholderRoot />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
