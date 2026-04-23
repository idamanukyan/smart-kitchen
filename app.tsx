import './global.css';
import { Component, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { View, Text, ScrollView } from 'react-native';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#faf8f5', padding: 20, paddingTop: 60 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#c00', marginBottom: 10 }}>App Error</Text>
          <Text style={{ fontSize: 14, color: '#333', marginBottom: 10 }}>{this.state.error.message}</Text>
          <Text style={{ fontSize: 11, color: '#888', fontFamily: 'monospace' }}>{this.state.error.stack}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
