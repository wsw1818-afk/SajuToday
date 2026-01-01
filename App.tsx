import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';

import { AppProvider } from './src/contexts/AppContext';
import Navigation from './src/navigation/Navigation';

export default function App() {
  return (
    <View style={styles.container}>
      <SafeAreaProvider>
        <AppProvider>
          <Navigation />
          <StatusBar style="dark" />
        </AppProvider>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
