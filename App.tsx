import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';

import { AppProvider } from './src/contexts/AppContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import Navigation from './src/navigation/Navigation';
import { initializeNotifications } from './src/services/NotificationService';
import { ErrorBoundary } from './src/components/common';

// 테스트 모드: true면 DatePickerTest 화면만 표시
const TEST_MODE = false;

// 테스트 화면 lazy import
const DatePickerTest = TEST_MODE ? require('./src/screens/DatePickerTest').default : null;

export default function App() {
  // 알림 초기화
  useEffect(() => {
    initializeNotifications();
  }, []);
  // 테스트 모드일 때는 테스트 화면만 표시
  if (TEST_MODE && DatePickerTest) {
    return (
      <View style={styles.container}>
        <SafeAreaProvider>
          <DatePickerTest />
          <StatusBar style="dark" />
        </SafeAreaProvider>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <ThemeProvider>
            <AppProvider>
              <Navigation />
              <StatusBar style="auto" />
            </AppProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
