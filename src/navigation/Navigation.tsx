import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '../contexts/AppContext';
import { COLORS, FONT_SIZES } from '../utils/theme';

import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FortuneDetailScreen from '../screens/FortuneDetailScreen';
import FortuneMenuScreen from '../screens/FortuneMenuScreen';
import FortuneTypeScreen from '../screens/FortuneTypeScreen';
import CompatibilityInputScreen from '../screens/CompatibilityInputScreen';
import CompatibilityResultScreen from '../screens/CompatibilityResultScreen';
import SavedPeopleScreen from '../screens/SavedPeopleScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 탭 아이콘 컴포넌트
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '☯',
    Profile: '命',
    History: '卜',
    Settings: '設',
  };

  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
        {icons[name]}
      </Text>
    </View>
  );
}

// 메인 탭 네비게이터
function MainTabs() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 60 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          ...styles.tabBar,
          height: tabBarHeight,
          paddingBottom: insets.bottom + 8,
        },
        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: '오늘운세' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: '내사주' }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarLabel: '히스토리' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: '설정' }}
      />
    </Tab.Navigator>
  );
}

// 로딩 화면
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingEmoji}>☯</Text>
      <Text style={styles.loadingText}>사주투데이</Text>
      <Text style={styles.loadingSubtext}>오늘의 운세를 준비하고 있어요...</Text>
    </View>
  );
}

// 메인 네비게이션
export default function Navigation() {
  const { isLoading, isOnboardingComplete } = useApp();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isOnboardingComplete ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="FortuneDetail" component={FortuneDetailScreen} />
            <Stack.Screen name="FortuneMenu" component={FortuneMenuScreen} />
            <Stack.Screen name="FortuneType" component={FortuneTypeScreen} />
            <Stack.Screen name="CompatibilityInput" component={CompatibilityInputScreen} />
            <Stack.Screen name="CompatibilityResult" component={CompatibilityResultScreen} />
            <Stack.Screen name="SavedPeople" component={SavedPeopleScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 22,
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
});
