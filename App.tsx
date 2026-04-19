import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View, Text } from 'react-native';
import { useFonts } from 'expo-font';

import { AppProvider } from './src/contexts/AppContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import Navigation from './src/navigation/Navigation';
import { initializeNotifications } from './src/services/NotificationService';
import { ErrorBoundary } from './src/components/common';

// DESIGN.md BUJEOK 부적 컨셉 (2026-04-18): 한자 폰트 + 부적 손글씨 폰트
// Noto Serif KR — 한자 본문/제목용 (먹글씨 느낌)
// Nanum Brush Script — 부적 인장 손글씨용
// expo-font config plugin으로 prebuild 시 자동 등록 (app.json 참조)

// 테스트 모드: true면 DatePickerTest 화면만 표시
const TEST_MODE = false;

// 테스트 화면 lazy import
const DatePickerTest = TEST_MODE ? require('./src/screens/DatePickerTest').default : null;

export default function App() {
  // 부적 디자인용 한자 폰트 로드 (DESIGN.md BUJEOK 컨셉)
  const [fontsLoaded, fontError] = useFonts({
    'NotoSerifKR': require('./assets/fonts/NotoSerifKR-Regular.ttf'),
    'NotoSerifKR-Bold': require('./assets/fonts/NotoSerifKR-Bold.ttf'),
    'NanumBrushScript': require('./assets/fonts/NanumBrushScript-Regular.ttf'),
  });

  // 알림 초기화
  useEffect(() => {
    initializeNotifications();
  }, []);

  // 폰트 로드 실패 시 진단용 (개발 중 폰트 누락 감지)
  if (fontError) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>폰트 로드 실패: {fontError.message}</Text>
      </View>
    );
  }

  // 폰트 로딩 중에는 빈 화면 (스플래시가 가려줌)
  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

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
