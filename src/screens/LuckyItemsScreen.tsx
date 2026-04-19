/**
 * 행운 아이템 화면
 * 오행 기반 행운의 색상, 숫자, 방향, 아이템, 부적 정보 표시
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../contexts/AppContext';
import { COLORS, FONT_SIZES, SPACING, SHADOWS, BORDER_RADIUS } from '../utils/theme';
import {
  getPersonalLuckyInfo,
  getDailyLuckyInfo,
  getAllTalismans,
  getTodayLuckyNumbers,
  getTimeSlotLucky,
  getMonthlyLuckyTheme,
  PersonalLuckyInfo,
  DailyLuckyInfo,
} from '../services/LuckyItems';
import { getDayGanji } from '../services/MonthlyDailyFortune';

type TabType = 'daily' | 'personal' | 'talisman' | 'time';

export default function LuckyItemsScreen() {
  const navigation = useNavigation();
  const { profile, sajuResult } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('daily');

  // 오늘의 일진
  const todayGanji = useMemo(() => getDayGanji(new Date()), []);

  // 개인 행운 정보
  const personalLucky = useMemo<PersonalLuckyInfo | null>(() => {
    if (!sajuResult?.pillars?.day?.stem) return null;
    return getPersonalLuckyInfo(sajuResult.pillars.day.stem);
  }, [sajuResult]);

  // 오늘의 행운 정보
  const dailyLucky = useMemo<DailyLuckyInfo>(() => {
    return getDailyLuckyInfo(todayGanji.stem, todayGanji.branch);
  }, [todayGanji]);

  // 오늘의 행운 숫자
  const luckyNumbers = useMemo(() => {
    const dayGan = sajuResult?.pillars?.day?.stem || todayGanji.stem;
    return getTodayLuckyNumbers(dayGan, 6);
  }, [sajuResult, todayGanji]);

  // 시간대별 행운
  const timeSlots = useMemo(() => getTimeSlotLucky(), []);

  // 이번 달 테마
  const monthlyTheme = useMemo(() => {
    return getMonthlyLuckyTheme(new Date().getMonth() + 1);
  }, []);

  // 모든 부적
  const allTalismans = useMemo(() => getAllTalismans(), []);

  const tabs = [
    { key: 'daily' as TabType, label: '오늘의 행운', emoji: '🍀' },
    { key: 'personal' as TabType, label: '나의 행운', emoji: '✨' },
    { key: 'talisman' as TabType, label: '부적', emoji: '🛡️' },
    { key: 'time' as TabType, label: '시간대별', emoji: '🕐' },
  ];

  const renderDailyTab = () => (
    <View style={styles.tabContent}>
      {/* 오늘의 일진 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🗓️ 오늘의 일진</Text>
        <View style={styles.dayGanjiContainer}>
          <Text style={styles.dayGanjiText}>{dailyLucky.dayGanji}일</Text>
          <Text style={styles.dateText}>{dailyLucky.date}</Text>
        </View>
        <Text style={styles.adviceText}>{dailyLucky.advice}</Text>
      </View>

      {/* 행운의 색상 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎨 오늘의 행운 색상</Text>
        <View style={styles.colorRow}>
          {dailyLucky.luckyColors.map((color, idx) => (
            <View key={idx} style={styles.colorItem}>
              <Text style={styles.colorEmoji}>{dailyLucky.luckyColorEmojis[idx]}</Text>
              <Text style={styles.colorName}>{color}</Text>
            </View>
          ))}
        </View>
        <View style={styles.avoidBox}>
          <Text style={styles.avoidLabel}>피할 색상</Text>
          <Text style={styles.avoidValue}>{dailyLucky.avoidColor}</Text>
        </View>
      </View>

      {/* 행운의 숫자 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔢 오늘의 행운 숫자</Text>
        <View style={styles.numberRow}>
          {luckyNumbers.map((num, idx) => (
            <View key={idx} style={styles.numberBall}>
              <Text style={styles.numberText}>{num}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.hintText}>
          오늘의 행운 오행: {dailyLucky.luckyElement}
        </Text>
      </View>

      {/* 방향 & 아이템 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🧭 오늘의 행운</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoEmoji}>🧭</Text>
            <Text style={styles.infoLabel}>행운의 방향</Text>
            <Text style={styles.infoValue}>{dailyLucky.luckyDirection}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoEmoji}>🍽️</Text>
            <Text style={styles.infoLabel}>행운의 음식</Text>
            <Text style={styles.infoValue}>{dailyLucky.luckyFood}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoEmoji}>🎁</Text>
            <Text style={styles.infoLabel}>행운의 아이템</Text>
            <Text style={styles.infoValue}>{dailyLucky.luckyItem}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoEmoji}>⚠️</Text>
            <Text style={styles.infoLabel}>피할 방향</Text>
            <Text style={styles.infoValue}>{dailyLucky.avoidDirection}</Text>
          </View>
        </View>
      </View>

      {/* 이번 달 테마 */}
      <View style={[styles.card, styles.themeCard]}>
        <Text style={styles.themeEmoji}>{monthlyTheme.emoji}</Text>
        <Text style={styles.themeTitle}>{new Date().getMonth() + 1}월 테마: {monthlyTheme.theme}</Text>
        <Text style={styles.themeFocus}>{monthlyTheme.focus}</Text>
        <Text style={styles.themeElement}>이달의 오행: {monthlyTheme.element}</Text>
      </View>
    </View>
  );

  const renderPersonalTab = () => {
    if (!personalLucky) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataEmoji}>😔</Text>
          <Text style={styles.noDataText}>사주 정보가 없습니다</Text>
          <Text style={styles.noDataSubtext}>프로필에서 생년월일시를 설정해주세요</Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {/* 나의 용신 오행 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚡ 나의 용신 오행</Text>
          <View style={styles.elementRow}>
            <View style={styles.elementBox}>
              <Text style={styles.elementLabel}>주 용신</Text>
              <Text style={styles.elementValue}>{personalLucky.primaryElement}</Text>
            </View>
            <View style={styles.elementBox}>
              <Text style={styles.elementLabel}>보조 용신</Text>
              <Text style={styles.elementValue}>{personalLucky.supportElement}</Text>
            </View>
            <View style={[styles.elementBox, styles.avoidElementBox]}>
              <Text style={styles.elementLabel}>기신(피할)</Text>
              <Text style={styles.elementValue}>{personalLucky.avoidElement}</Text>
            </View>
          </View>
        </View>

        {/* 나의 행운 색상 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎨 나의 행운 색상</Text>
          <View style={styles.colorRow}>
            {personalLucky.luckyColors.map((color, idx) => (
              <View key={idx} style={styles.colorItem}>
                <Text style={styles.colorEmoji}>{personalLucky.luckyColorEmojis[idx]}</Text>
                <Text style={styles.colorName}>{color}</Text>
              </View>
            ))}
          </View>
          <View style={styles.avoidBox}>
            <Text style={styles.avoidLabel}>피할 색상</Text>
            <Text style={styles.avoidValue}>{personalLucky.avoidColors.join(', ')}</Text>
          </View>
        </View>

        {/* 나의 행운 숫자 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔢 나의 행운 숫자</Text>
          <View style={styles.numberRow}>
            {personalLucky.luckyNumbers.map((num, idx) => (
              <View key={idx} style={styles.numberBall}>
                <Text style={styles.numberText}>{num}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 나의 행운 방향 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧭 나의 행운 방향</Text>
          <View style={styles.directionRow}>
            {personalLucky.luckyDirections.map((dir, idx) => (
              <View key={idx} style={styles.directionBadge}>
                <Text style={styles.directionText}>{dir}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 행운의 보석 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💎 나의 행운 보석</Text>
          <View style={styles.tagRow}>
            {personalLucky.luckyGemstones.map((gem, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{gem}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 행운의 꽃 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌸 나의 행운 꽃</Text>
          <View style={styles.tagRow}>
            {personalLucky.luckyFlowers.map((flower, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{flower}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 행운의 음식 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🍽️ 나의 행운 음식</Text>
          <View style={styles.tagRow}>
            {personalLucky.luckyFoods.map((food, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{food}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 행운의 아이템 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎁 나의 행운 아이템</Text>
          <View style={styles.tagRow}>
            {personalLucky.luckyItems.map((item, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 추천 부적 */}
        {personalLucky.recommendedTalismans.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🛡️ 추천 부적</Text>
            {personalLucky.recommendedTalismans.map((talisman, idx) => (
              <View key={idx} style={styles.talismanPreview}>
                <Text style={styles.talismanPreviewEmoji}>{talisman.emoji}</Text>
                <View style={styles.talismanPreviewInfo}>
                  <Text style={styles.talismanPreviewName}>{talisman.name}</Text>
                  <Text style={styles.talismanPreviewPurpose}>{talisman.purpose}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderTalismanTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionIntro}>
        부적은 고대부터 전해 내려오는 행운의 상징입니다.
        목적에 맞는 부적을 선택하여 좋은 기운을 받으세요.
      </Text>

      {allTalismans.map((talisman, idx) => (
        <View key={idx} style={styles.talismanCard}>
          <View style={styles.talismanHeader}>
            <Text style={styles.talismanEmoji}>{talisman.emoji}</Text>
            <View style={styles.talismanTitleArea}>
              <Text style={styles.talismanName}>{talisman.name}</Text>
              <Text style={styles.talismanPurpose}>{talisman.purpose}</Text>
            </View>
          </View>
          <Text style={styles.talismanDescription}>{talisman.description}</Text>
          <View style={styles.talismanMeta}>
            <View style={styles.talismanMetaItem}>
              <Text style={styles.talismanMetaLabel}>관련 오행</Text>
              <Text style={styles.talismanMetaValue}>{talisman.elements.join(', ')}</Text>
            </View>
            <View style={styles.talismanMetaItem}>
              <Text style={styles.talismanMetaLabel}>최적 시기</Text>
              <Text style={styles.talismanMetaValue}>{talisman.bestTime}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderTimeTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionIntro}>
        하루 12시진에 따라 각 시간대의 오행과 적합한 활동이 다릅니다.
        시간대에 맞는 활동으로 효율을 높여보세요.
      </Text>

      {timeSlots.map((slot, idx) => (
        <View key={idx} style={styles.timeSlotCard}>
          <View style={styles.timeSlotLeft}>
            <Text style={styles.timeSlotEmoji}>{slot.emoji}</Text>
            <Text style={styles.timeSlotName}>{slot.time}</Text>
            <Text style={styles.timeSlotRange}>{slot.timeRange}</Text>
          </View>
          <View style={styles.timeSlotRight}>
            <View style={styles.timeSlotElement}>
              <Text style={styles.timeSlotElementText}>{slot.element}</Text>
            </View>
            <Text style={styles.timeSlotActivity}>{slot.activity}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>행운 아이템</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 탭 */}
      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={styles.tabEmoji}>{tab.emoji}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 컨텐츠 */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'daily' && renderDailyTab()}
        {activeTab === 'personal' && renderPersonalTab()}
        {activeTab === 'talisman' && renderTalismanTab()}
        {activeTab === 'time' && renderTimeTab()}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  backButtonText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.divider,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: FONT_SIZES.sm,
    color: '#6B7280',
    fontWeight: '600',
  },
  activeTabLabel: {
    color: COLORS.white,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  cardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  dayGanjiContainer: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  dayGanjiText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dateText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  adviceText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.sm,
  },
  colorItem: {
    alignItems: 'center',
  },
  colorEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  colorName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  avoidBox: {
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    padding: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avoidLabel: {
    fontSize: FONT_SIZES.sm,
    color: '#E53E3E',
  },
  avoidValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: '#E53E3E',
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  numberBall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.white,
  },
  hintText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  infoItem: {
    width: '48%',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  infoEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  themeCard: {
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
  },
  themeEmoji: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  themeTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  themeFocus: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: 8,
  },
  themeElement: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  elementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  elementBox: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  avoidElementBox: {
    backgroundColor: '#FFEBEE',
  },
  elementLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  elementValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  directionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  directionBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  directionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.white,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  tag: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  tagText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  noDataContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    marginTop: 100,
  },
  noDataEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  noDataText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  noDataSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  sectionIntro: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  talismanCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  talismanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  talismanEmoji: {
    fontSize: 40,
    marginRight: SPACING.sm,
  },
  talismanTitleArea: {
    flex: 1,
  },
  talismanName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  talismanPurpose: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  talismanDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  talismanMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.sm,
  },
  talismanMetaItem: {
    alignItems: 'center',
  },
  talismanMetaLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  talismanMetaValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  talismanPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  talismanPreviewEmoji: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  talismanPreviewInfo: {
    flex: 1,
  },
  talismanPreviewName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  talismanPreviewPurpose: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  timeSlotCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  timeSlotLeft: {
    alignItems: 'center',
    marginRight: SPACING.md,
    width: 80,
  },
  timeSlotEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  timeSlotName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  timeSlotRange: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  timeSlotRight: {
    flex: 1,
    justifyContent: 'center',
  },
  timeSlotElement: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  timeSlotElementText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.white,
  },
  timeSlotActivity: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  bottomPadding: {
    height: 40,
  },
});
