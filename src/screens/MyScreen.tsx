/**
 * MY 탭 화면
 * 내 사주 + 히스토리 + 설정 통합
 */

import React, { useState, useCallback, useMemo } from 'react';
import { COLORS } from '../utils/theme';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { SajuCalculator } from '../services/SajuCalculator';
import { getStreakLevel, StreakData, checkInToday } from '../services/NotificationService';
import { EARTHLY_BRANCHES } from '../data/saju';

// 지지로 띠 가져오기
const getAnimalByBranch = (branch: string): string => {
  const found = EARTHLY_BRANCHES.find(b => b.korean === branch);
  return found?.animal || '?';
};

const { width } = Dimensions.get('window');

export default function MyScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useApp();
  const { isDark, colors } = useTheme();
  const [streakData, setStreakData] = useState<StreakData | null>(null);

  // 스트릭 데이터 로드
  useFocusEffect(
    useCallback(() => {
      const loadStreak = async () => {
        const result = await checkInToday();
        setStreakData(result.streakData);
      };
      loadStreak();
    }, [])
  );

  // 사주 계산 (메모이제이션)
  const sajuResult = useMemo(() => {
    if (!profile) return null;
    return new SajuCalculator(profile.birthDate, profile.birthTime).calculate();
  }, [profile?.birthDate, profile?.birthTime]);

  const streakLevel = streakData ? getStreakLevel(streakData.currentStreak) : null;

  const menuItems = [
    {
      icon: '🌳',
      title: '인생 대운 타임라인',
      desc: '내 인생 흐름과 현재 위치',
      screen: 'Daeun',
      color: '#7C3AED',
    },
    {
      icon: '🌟',
      title: '길일 D-day',
      desc: '앞으로 14일 + 이벤트별 길일',
      screen: 'LuckyDays',
      color: '#E67E22',
    },
    {
      icon: '👨‍👩‍👧‍👦',
      title: '가족 운세 대시보드',
      desc: '가족 모두의 오늘 운세',
      screen: 'FamilyDashboard',
      color: COLORS.error,
    },
    {
      icon: '⭐',
      title: '저장한 운세',
      desc: '북마크한 운세 모아보기',
      screen: 'Bookmark',
      color: COLORS.warning,
    },
    {
      icon: '✅',
      title: '계산 검증',
      desc: '사주 계산 정확도 확인',
      screen: 'Verification',
      color: COLORS.success,
    },
    {
      icon: '⏰',
      title: '시간 모름 안내',
      desc: '출생 시간 추정 및 안내',
      screen: 'UnknownTime',
      color: COLORS.info,
    },
    {
      icon: '📱',
      title: '운세 위젯',
      desc: '운세 카드 미리보기 및 공유',
      screen: 'WidgetPreview',
      color: COLORS.fire,
    },
    {
      icon: '📜',
      title: '운세 히스토리',
      desc: '지난 운세 기록 보기',
      screen: 'History',
      color: COLORS.primary,
    },
    {
      icon: '📅',
      title: '월간 캘린더',
      desc: '이달의 길일/흉일 확인',
      screen: 'Calendar',
      color: COLORS.primary,
    },
    {
      icon: '👥',
      title: '저장된 사람',
      desc: '궁합 볼 사람들 관리',
      screen: 'SavedPeople',
      color: COLORS.success,
    },
    {
      icon: '⚙️',
      title: '설정',
      desc: '알림, 테마, 생년월일 변경',
      screen: 'Settings',
      color: '#78716C',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.background : COLORS.card }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: isDark ? colors.text : COLORS.text }]}>MY</Text>
        </View>

        {/* 프로필 카드 */}
        <LinearGradient
          colors={isDark ? ['#4C1D95', '#1E1B4B'] : [COLORS.primary, COLORS.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{profile?.name?.[0] || '?'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.name || '사용자'}님</Text>
              <Text style={styles.profileBirth}>
                {profile?.birthDate} {profile?.birthTime || '시간 미입력'}
              </Text>
            </View>
          </View>

          {/* 일주 정보 */}
          {sajuResult && (
            <View style={styles.sajuInfo}>
              <View style={styles.sajuItem}>
                <Text style={styles.sajuLabel}>나의 일주</Text>
                <Text style={styles.sajuValue}>
                  {sajuResult.pillars.day.stem}{sajuResult.pillars.day.branch}
                </Text>
              </View>
              <View style={styles.sajuDivider} />
              <View style={styles.sajuItem}>
                <Text style={styles.sajuLabel}>일간 (나)</Text>
                <Text style={styles.sajuValue}>{sajuResult.pillars.day.stem}</Text>
              </View>
              <View style={styles.sajuDivider} />
              <View style={styles.sajuItem}>
                <Text style={styles.sajuLabel}>띠</Text>
                <Text style={styles.sajuValue}>{getAnimalByBranch(sajuResult.pillars.year.branch)}</Text>
              </View>
            </View>
          )}

          {/* 연속 출석 */}
          {streakData && streakData.currentStreak > 0 && streakLevel && (
            <View style={styles.streakBox}>
              <Text style={styles.streakEmoji}>{streakLevel.emoji}</Text>
              <View style={styles.streakTextBox}>
                <Text style={styles.streakTitle}>{streakData.currentStreak}일 연속 출석!</Text>
                <Text style={styles.streakSub}>{streakLevel.title} | 총 {streakData.totalVisits}회 방문</Text>
              </View>
            </View>
          )}

        </LinearGradient>

        {/* 메뉴 리스트 */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.textSecondary : '#78716C' }]}>
            메뉴
          </Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: isDark ? colors.card : COLORS.card }]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                <Text style={styles.menuIconText}>{item.icon}</Text>
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: isDark ? colors.text : COLORS.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.menuDesc, { color: isDark ? colors.textSecondary : '#78716C' }]}>
                  {item.desc}
                </Text>
              </View>
              <Text style={[styles.menuArrow, { color: isDark ? colors.textSecondary : '#A8A29E' }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  profileCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.card,
  },
  profileInfo: {
    marginLeft: 14,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.card,
  },
  profileBirth: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  sajuInfo: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  sajuItem: {
    flex: 1,
    alignItems: 'center',
  },
  sajuLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  sajuValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.card,
  },
  sajuDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
  },
  streakBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  streakEmoji: {
    fontSize: 24,
  },
  streakTextBox: {
    marginLeft: 10,
  },
  streakTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.card,
  },
  streakSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingVertical: 12,
  },
  profileButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.card,
  },
  profileButtonArrow: {
    fontSize: 16,
    color: COLORS.card,
    marginLeft: 6,
  },
  menuSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    paddingLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconText: {
    fontSize: 20,
  },
  menuContent: {
    flex: 1,
    marginLeft: 14,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 24,
    fontWeight: '300',
  },
});
