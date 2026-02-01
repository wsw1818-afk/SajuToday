import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useApp } from '../contexts/AppContext';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../utils/theme';
import { useTodayFortune } from '../hooks/useTodayFortune';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 탭 정의
type TabType = 'summary' | 'detail' | 'lucky';
const TABS: { id: TabType; label: string; emoji: string }[] = [
  { id: 'summary', label: '요약', emoji: '📋' },
  { id: 'detail', label: '상세', emoji: '📊' },
  { id: 'lucky', label: '행운', emoji: '🍀' },
];

export default function DailyFortuneScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { sajuResult } = useApp();

  // 선택된 날짜 상태
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  // 현재 탭 상태
  const [activeTab, setActiveTab] = useState<TabType>('summary');

  // DatePickerScreen에서 돌아왔을 때 날짜 업데이트
  useFocusEffect(
    useCallback(() => {
      if (route.params?.selectedDate) {
        const newDate = new Date(route.params.selectedDate);
        setSelectedDate(newDate);
        navigation.setParams({ selectedDate: undefined });
      }
    }, [route.params?.selectedDate, navigation])
  );

  // 날짜 이동 함수
  const goToPrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // 오늘인지 확인
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const todayFortune = useTodayFortune(sajuResult, selectedDate);

  if (!sajuResult || !todayFortune) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>운세를 불러오는 중...</Text>
      </View>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFC107';
    if (score >= 40) return '#FF9800';
    return '#F44336';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '대길';
    if (score >= 60) return '길';
    if (score >= 40) return '평';
    return '흉';
  };

  // 기본값 처리
  const summary = todayFortune.overall?.summary || '오늘의 운세를 확인하세요.';
  const detail = todayFortune.overall?.detail || '오늘은 평온한 하루가 될 것입니다.';
  const advice = todayFortune.overall?.advice || '차분하게 하루를 보내세요.';
  const wealth = todayFortune.wealth?.advice || '평온한 재물운입니다.';
  const love = todayFortune.love?.advice || '평온한 연애운입니다.';
  const work = todayFortune.work?.advice || '평온한 직장운입니다.';
  const health = todayFortune.health?.advice || '건강에 유의하세요.';
  const color = todayFortune.luckyPoints?.color || '흰색';
  const number = todayFortune.luckyPoints?.number || '3, 7';
  const direction = todayFortune.luckyPoints?.direction || '남쪽';
  const item = todayFortune.luckyPoints?.item || '수첩';
  const goodActivities = todayFortune.activities?.good || ['일상 업무', '정리 정돈'];
  const cautions = todayFortune.caution || ['급한 결정은 피하세요'];

  // 날짜 포맷
  const shortDateStr = (() => {
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][selectedDate.getDay()];
    return `${month}/${day} (${dayOfWeek})`;
  })();

  // 요약 탭 컨텐츠
  const renderSummaryTab = () => (
    <>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.dateText}>{selectedDate.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        })}</Text>
        <Text style={styles.ganjiText}>
          나의 일주: {todayFortune.myIlju || '-'} | {isToday ? '오늘' : '해당일'} 일진: {todayFortune.todayIlju || '-'}
        </Text>
        <Text style={styles.tenGodText}>
          {isToday ? '오늘' : '해당일'}의 십신: {todayFortune.tenGod || '-'}
        </Text>
      </View>

      {/* 종합 운세 점수 */}
      <View style={[styles.scoreCard, { backgroundColor: getScoreColor(todayFortune.score || 60) }]}>
        <Text style={styles.scoreLabel}>오늘의 운세</Text>
        <Text style={styles.scoreValue}>{todayFortune.score || 60}점</Text>
        <Text style={styles.scoreGrade}>{getScoreLabel(todayFortune.score || 60)}</Text>
        <Text style={styles.scoreDesc}>{summary}</Text>
      </View>

      {/* 종합 운세 요약 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 오늘의 운세 요약</Text>

        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{summary}</Text>
          <Text style={styles.detailText}>{detail}</Text>

          <View style={styles.adviceBox}>
            <Text style={styles.adviceIcon}>💡</Text>
            <Text style={styles.adviceText}>{advice}</Text>
          </View>
        </View>
      </View>

      {/* 실천 조언 섹션 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✨ 오늘 이렇게 하세요</Text>

        {/* 이렇게 하세요 */}
        <View style={styles.actionCard}>
          <View style={styles.actionHeader}>
            <Text style={styles.actionEmoji}>✅</Text>
            <Text style={styles.actionTitle}>이렇게 하세요</Text>
          </View>
          {goodActivities.slice(0, 3).map((activity, index) => (
            <View key={index} style={styles.actionItem}>
              <Text style={styles.actionBullet}>•</Text>
              <Text style={styles.actionText}>{activity}</Text>
            </View>
          ))}
        </View>

        {/* 피하세요 */}
        <View style={[styles.actionCard, styles.cautionActionCard]}>
          <View style={styles.actionHeader}>
            <Text style={styles.actionEmoji}>⚠️</Text>
            <Text style={styles.actionTitle}>피하세요</Text>
          </View>
          {cautions.slice(0, 2).map((caution, index) => (
            <View key={index} style={styles.actionItem}>
              <Text style={[styles.actionBullet, { color: '#F97316' }]}>•</Text>
              <Text style={styles.actionText}>{caution}</Text>
            </View>
          ))}
        </View>

        {/* 행운 포인트 미니 */}
        <View style={styles.miniLuckyBox}>
          <Text style={styles.miniLuckyTitle}>🍀 오늘의 행운 포인트</Text>
          <View style={styles.miniLuckyRow}>
            <View style={styles.miniLuckyItem}>
              <Text style={styles.miniLuckyLabel}>색</Text>
              <Text style={styles.miniLuckyValue}>{color}</Text>
            </View>
            <View style={styles.miniLuckyItem}>
              <Text style={styles.miniLuckyLabel}>숫자</Text>
              <Text style={styles.miniLuckyValue}>{number}</Text>
            </View>
            <View style={styles.miniLuckyItem}>
              <Text style={styles.miniLuckyLabel}>방향</Text>
              <Text style={styles.miniLuckyValue}>{direction}</Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );

  // 상세 탭 컨텐츠
  const renderDetailTab = () => (
    <>
      {/* 카테고리별 운세 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 카테고리별 운세</Text>

        <View style={styles.categoryGrid}>
          <View style={[styles.categoryCard, { backgroundColor: '#FFF3E0' }]}>
            <Text style={styles.categoryIcon}>💰</Text>
            <Text style={styles.categoryTitle}>재물운</Text>
            <View style={styles.categoryScoreBox}>
              <Text style={styles.categoryScore}>{todayFortune.wealth?.score || 60}점</Text>
            </View>
            <Text style={styles.categoryDesc}>{wealth}</Text>
          </View>

          <View style={[styles.categoryCard, { backgroundColor: '#FCE4EC' }]}>
            <Text style={styles.categoryIcon}>💕</Text>
            <Text style={styles.categoryTitle}>연애운</Text>
            <View style={styles.categoryScoreBox}>
              <Text style={styles.categoryScore}>{todayFortune.love?.score || 60}점</Text>
            </View>
            <Text style={styles.categoryDesc}>{love}</Text>
          </View>

          <View style={[styles.categoryCard, { backgroundColor: '#E3F2FD' }]}>
            <Text style={styles.categoryIcon}>💼</Text>
            <Text style={styles.categoryTitle}>직장운</Text>
            <View style={styles.categoryScoreBox}>
              <Text style={styles.categoryScore}>{todayFortune.work?.score || 60}점</Text>
            </View>
            <Text style={styles.categoryDesc}>{work}</Text>
          </View>

          <View style={[styles.categoryCard, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.categoryIcon}>🏃</Text>
            <Text style={styles.categoryTitle}>건강운</Text>
            <View style={styles.categoryScoreBox}>
              <Text style={styles.categoryScore}>{todayFortune.health?.score || 60}점</Text>
            </View>
            <Text style={styles.categoryDesc}>{health}</Text>
          </View>
        </View>
      </View>

      {/* 추천 활동 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✅ 오늘의 추천 활동</Text>

        <View style={styles.activityCard}>
          {goodActivities.map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <Text style={styles.activityIcon}>👍</Text>
              <Text style={styles.activityText}>{activity}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 주의사항 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚠️ 주의사항</Text>

        <View style={styles.cautionCard}>
          {cautions.map((cautionItem, index) => (
            <View key={index} style={styles.cautionItem}>
              <Text style={styles.cautionIcon}>•</Text>
              <Text style={styles.cautionText}>{cautionItem}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );

  // 행운 탭 컨텐츠
  const renderLuckyTab = () => (
    <>
      {/* 행운 정보 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🍀 오늘의 행운 정보</Text>

        <View style={styles.luckyGrid}>
          <View style={styles.luckyCard}>
            <Text style={styles.luckyEmoji}>🎨</Text>
            <Text style={styles.luckyLabel}>행운의 색</Text>
            <Text style={styles.luckyValue}>{color}</Text>
            <Text style={styles.luckyHint}>오늘 이 색상의 옷이나 소품을 활용해보세요</Text>
          </View>

          <View style={styles.luckyCard}>
            <Text style={styles.luckyEmoji}>🔢</Text>
            <Text style={styles.luckyLabel}>행운의 숫자</Text>
            <Text style={styles.luckyValue}>{number}</Text>
            <Text style={styles.luckyHint}>중요한 선택에 이 숫자를 참고해보세요</Text>
          </View>

          <View style={styles.luckyCard}>
            <Text style={styles.luckyEmoji}>🧭</Text>
            <Text style={styles.luckyLabel}>행운의 방향</Text>
            <Text style={styles.luckyValue}>{direction}</Text>
            <Text style={styles.luckyHint}>이 방향으로 이동하면 좋은 기운이 있어요</Text>
          </View>

          <View style={styles.luckyCard}>
            <Text style={styles.luckyEmoji}>✨</Text>
            <Text style={styles.luckyLabel}>행운의 아이템</Text>
            <Text style={styles.luckyValue}>{item}</Text>
            <Text style={styles.luckyHint}>오늘 이 아이템을 가지고 다녀보세요</Text>
          </View>
        </View>
      </View>

      {/* 오늘의 팁 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 행운을 높이는 팁</Text>

        <View style={styles.tipCard}>
          <View style={styles.tipItem}>
            <Text style={styles.tipEmoji}>🌅</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>아침 루틴</Text>
              <Text style={styles.tipDesc}>
                {direction} 방향을 향해 심호흡 3번으로 하루를 시작해보세요
              </Text>
            </View>
          </View>

          <View style={styles.tipItem}>
            <Text style={styles.tipEmoji}>👔</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>스타일 팁</Text>
              <Text style={styles.tipDesc}>
                {color} 계열의 악세사리나 옷을 포인트로 활용해보세요
              </Text>
            </View>
          </View>

          <View style={styles.tipItem}>
            <Text style={styles.tipEmoji}>🎯</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>행운 시간</Text>
              <Text style={styles.tipDesc}>
                오전 {(parseInt(String(todayFortune.score || 60)) % 12) || 10}시~{((parseInt(String(todayFortune.score || 60)) % 12) + 2) || 12}시가 가장 좋은 시간대입니다
              </Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );

  // 현재 탭에 따른 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return renderSummaryTab();
      case 'detail':
        return renderDetailTab();
      case 'lucky':
        return renderLuckyTab();
      default:
        return renderSummaryTab();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 날짜 선택 네비게이터 */}
      <View style={styles.dateNavigator}>
        <TouchableOpacity
          style={styles.dateArrowBtn}
          onPress={goToPrevDay}
          accessibilityLabel="이전 날짜"
        >
          <Text style={styles.dateArrowText}>◀</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => navigation.navigate('DatePicker', {
            selectedDate: selectedDate.toISOString(),
            returnScreen: 'Daily',
          })}
          accessibilityLabel="날짜 선택"
        >
          <Text style={styles.dateLabelText}>
            {isToday ? '📅 오늘' : '📅 선택'}
          </Text>
          <Text style={styles.dateValueText}>{shortDateStr}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateArrowBtn}
          onPress={goToNextDay}
          accessibilityLabel="다음 날짜"
        >
          <Text style={styles.dateArrowText}>▶</Text>
        </TouchableOpacity>

        {!isToday && (
          <TouchableOpacity
            style={styles.todayBtn}
            onPress={goToToday}
          >
            <Text style={styles.todayBtnText}>오늘</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 탭 네비게이션 */}
      <View style={styles.tabContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[
              styles.tabEmoji,
              activeTab === tab.id && styles.tabEmojiActive,
            ]}>
              {tab.emoji}
            </Text>
            <Text style={[
              styles.tabLabel,
              activeTab === tab.id && styles.tabLabelActive,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dateText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  ganjiText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  tenGodText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  scoreCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  scoreLabel: {
    fontSize: FONT_SIZES.md,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  scoreGrade: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 12,
    opacity: 0.95,
  },
  scoreDesc: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  detailTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  detailText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
    flex: 1,
    flexWrap: 'wrap',
  },
  adviceBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  adviceIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  adviceText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
    flex: 1,
    flexWrap: 'wrap',
  },
  activityCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  activityText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
    flexWrap: 'wrap',
  },
  cautionCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 16,
  },
  cautionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cautionIcon: {
    fontSize: 16,
    color: '#FF9800',
    marginRight: 8,
  },
  cautionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
    flexWrap: 'wrap',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  categoryScoreBox: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryScore: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  categoryDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    flex: 1,
    flexWrap: 'wrap',
  },
  luckyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  luckyCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  luckyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  luckyLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  luckyValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  luckyHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  // 날짜 선택 네비게이터 스타일
  dateNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dateArrowBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: COLORS.background,
  },
  dateArrowText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginHorizontal: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
  },
  dateLabelText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  dateValueText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  todayBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  todayBtnText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.white,
  },
  // 탭 네비게이션 스타일
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  tabEmojiActive: {
    // 활성 상태에서도 같은 크기 유지
  },
  tabLabel: {
    fontSize: FONT_SIZES.md,
    color: '#6B7280',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  // 실천 조언 스타일
  actionCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cautionActionCard: {
    backgroundColor: '#FFF3E0',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  actionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  actionBullet: {
    fontSize: 16,
    color: '#22C55E',
    marginRight: 8,
    marginTop: 2,
  },
  actionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
    lineHeight: 22,
  },
  miniLuckyBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  miniLuckyTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  miniLuckyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  miniLuckyItem: {
    alignItems: 'center',
  },
  miniLuckyLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  miniLuckyValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
  // 팁 카드 스타일
  tipCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tipEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  tipDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
