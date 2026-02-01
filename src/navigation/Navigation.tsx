import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '../contexts/AppContext';
import { COLORS, FONT_SIZES } from '../utils/theme';

import OnboardingScreen from '../screens/OnboardingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MyScreen from '../screens/MyScreen';
import FortuneDetailScreen from '../screens/FortuneDetailScreen';
import FortuneMenuScreen from '../screens/FortuneMenuScreen';
import FortuneTypeScreen from '../screens/FortuneTypeScreen';
import CompatibilityInputScreen from '../screens/CompatibilityInputScreen';
import CompatibilityResultScreen from '../screens/CompatibilityResultScreen';
import SavedPeopleScreen from '../screens/SavedPeopleScreen';
import DatePickerScreen from '../screens/DatePickerScreen';
import MenuScreen from '../screens/MenuScreen';
import SinsalScreen from '../screens/SinsalScreen';
import FortuneQnAScreen from '../screens/FortuneQnAScreen';
import FortuneCalendarScreen from '../screens/FortuneCalendarScreen';
import LuckyItemsScreen from '../screens/LuckyItemsScreen';
// 운세 전용 화면
import DailyFortuneScreen from '../screens/DailyFortuneScreen';
import SajuScreen from '../screens/SajuScreen';
// 새로운 화면들
import DaeunScreen from '../screens/DaeunScreen';
import TaekilScreen from '../screens/TaekilScreen';
import NameAnalysisScreen from '../screens/NameAnalysisScreen';
import DreamDiaryScreen from '../screens/DreamDiaryScreen';
import FamilyGroupScreen from '../screens/FamilyGroupScreen';
import BookmarkScreen from '../screens/BookmarkScreen';
import FortuneReportScreen from '../screens/FortuneReportScreen';
import AdvancedAnalysisScreen from '../screens/AdvancedAnalysisScreen';
import VerificationScreen from '../screens/VerificationScreen';
import UnknownTimeScreen from '../screens/UnknownTimeScreen';
import WidgetPreviewScreen from '../screens/WidgetPreviewScreen';
// 사용자 유입/리텐션 기능 화면
import CompatibilityScreen from '../screens/CompatibilityScreen';
import CalendarScreen from '../screens/CalendarScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 탭 아이콘 컴포넌트
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Daily: '📅',
    Saju: '☯',
    FortuneMenu: '🔮',
    Compatibility: '💕',
    My: '👤',
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
        name="Daily"
        component={DailyFortuneScreen}
        options={{ tabBarLabel: '오늘' }}
      />
      <Tab.Screen
        name="Saju"
        component={SajuScreen}
        options={{ tabBarLabel: '사주' }}
      />
      <Tab.Screen
        name="FortuneMenu"
        component={FortuneMenuScreen}
        options={{ tabBarLabel: '운세' }}
      />
      <Tab.Screen
        name="Compatibility"
        component={CompatibilityScreen}
        options={{ tabBarLabel: '궁합' }}
      />
      <Tab.Screen
        name="My"
        component={MyScreen}
        options={{ tabBarLabel: 'MY' }}
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
            <Stack.Screen
              name="DatePicker"
              component={DatePickerScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="Menu"
              component={MenuScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="Sinsal" component={SinsalScreen} />
            <Stack.Screen name="FortuneQnA" component={FortuneQnAScreen} />
            <Stack.Screen name="FortuneCalendar" component={FortuneCalendarScreen} />
            <Stack.Screen name="LuckyItems" component={LuckyItemsScreen} />
            {/* 새로운 화면들 */}
            <Stack.Screen name="Daeun" component={DaeunScreen} />
            <Stack.Screen name="Taekil" component={TaekilScreen} />
            <Stack.Screen name="NameAnalysis" component={NameAnalysisScreen} />
            <Stack.Screen name="DreamDiary" component={DreamDiaryScreen} />
            <Stack.Screen name="FamilyGroup" component={FamilyGroupScreen} />
            <Stack.Screen name="Bookmark" component={BookmarkScreen} />
            <Stack.Screen name="FortuneReport" component={FortuneReportScreen} />
            <Stack.Screen name="AdvancedAnalysis" component={AdvancedAnalysisScreen} />
            <Stack.Screen name="Verification" component={VerificationScreen} />
            <Stack.Screen name="UnknownTime" component={UnknownTimeScreen} />
            <Stack.Screen name="WidgetPreview" component={WidgetPreviewScreen} />
            {/* MY 탭에서 접근하는 화면들 */}
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Calendar" component={CalendarScreen} />
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
