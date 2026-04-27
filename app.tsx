import './global.css';
import React, { Component, type ReactNode, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useAuthStore } from './src/shared/store/useAuthStore';

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

function AppContent() {
  const { isLoading, userId, householdId, initialize } = useAuthStore();
  const [authDebug, setAuthDebug] = React.useState<string>('Initializing...');

  useEffect(() => {
    initialize().then(() => {
      const state = useAuthStore.getState();
      setAuthDebug(
        `userId: ${state.userId ?? 'null'}\nhouseholdId: ${state.householdId ?? 'null'}\nsession: ${state.session ? 'yes' : 'no'}`
      );
    });
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#faf8f5', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#3d3529', marginBottom: 16 }}>SmartKüche</Text>
        <ActivityIndicator size="small" color="#c07a45" />
        <Text style={{ fontSize: 11, color: '#a09080', marginTop: 12 }}>{authDebug}</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
