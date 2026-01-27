/**
 * 운세 통계/리포트 화면
 * 사용 기록 및 운세 분석 리포트
 */

import React, { useState, useCallback, useMemo } from 'react';
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
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Calendar,
  Star,
  Activity,
  Award,
  Clock,
} from 'lucide-react-native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../utils/theme';
import { useApp } from '../contexts/AppContext';
import { SajuCalculator } from '../services/SajuCalculator';
import { getDreams, DreamStats, getDreamStats } from '../services/DreamDiary';
import { getBookmarkStats, BookmarkStats } from '../services/Bookmark';
import { getGroupStats, GroupStats } from '../services/FamilyGroup';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UsageStats {
  totalDays: number;
  currentStreak: number;
  longestStreak: number;
  lastVisit: string;
  favoriteFeature: string;
}

export default function FortuneReportScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useApp();

  const [dreamStats, setDreamStats] = useState<DreamStats | null>(null);
  const [bookmarkStats, setBookmarkStats] = useState<BookmarkStats | null>(null);
  const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 사주 계산
  const sajuResult = useMemo(() => {
    if (!profile) return null;
    const calculator = new SajuCalculator(profile.birthDate, profile.birthTime);
    return calculator.calculate();
  }, [profile?.birthDate, profile?.birthTime]);

  const loadStats = async () => {
    try {
      const [dreams, bookmarks, groups] = await Promise.all([
        getDreamStats(),
        getBookmarkStats(),
        getGroupStats(),
      ]);
      setDreamStats(dreams);
      setBookmarkStats(bookmarks);
      setGroupStats(groups);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  // 오행 분포 계산
  const elementDistribution = useMemo(() => {
    if (!sajuResult) return null;

    const elements = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    const elementMap: Record<string, string> = {
      '갑': '목', '을': '목',
      '병': '화', '정': '화',
      '무': '토', '기': '토',
      '경': '금', '신': '금',
      '임': '수', '계': '수',
      '인': '목', '묘': '목',
      '사': '화', '오': '화',
      '진': '토', '술': '토', '축': '토', '미': '토',
      '신': '금', '유': '금',
      '해': '수', '자': '수',
    };

    // 천간 분석
    [sajuResult.year.천간, sajuResult.month.천간, sajuResult.day.천간, sajuResult.hour.천간].forEach(char => {
      if (elementMap[char]) {
        elements[elementMap[char] as keyof typeof elements]++;
      }
    });

    // 지지 분석
    [sajuResult.year.지지, sajuResult.month.지지, sajuResult.day.지지, sajuResult.hour.지지].forEach(char => {
      if (elementMap[char]) {
        elements[elementMap[char] as keyof typeof elements]++;
      }
    });

    const total = Object.values(elements).reduce((a, b) => a + b, 0);
    return Object.entries(elements).map(([element, count]) => ({
      element,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }, [sajuResult]);

  const ELEMENT_COLORS: Record<string, string> = {
    목: '#22C55E',
    화: '#EF4444',
    토: '#F59E0B',
    금: '#94A3B8',
    수: '#3B82F6',
  };

  const renderElementBar = (element: string, percentage: number) => (
    <View key={element} style={styles.elementRow}>
      <View style={styles.elementLabel}>
        <View style={[styles.elementDot, { backgroundColor: ELEMENT_COLORS[element] }]} />
        <Text style={styles.elementName}>{element}</Text>
      </View>
      <View style={styles.elementBarContainer}>
        <View
          style={[
            styles.elementBarFill,
            {
              width: `${percentage}%`,
              backgroundColor: ELEMENT_COLORS[element],
            },
          ]}
        />
      </View>
      <Text style={styles.elementPercentage}>{percentage}%</Text>
    </View>
  );

  const renderStatCard = (
    icon: React.ReactNode,
    label: string,
    value: string | number,
    color: string
  ) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>운세 리포트</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>프로필 정보가 필요합니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>운세 리포트</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 프로필 요약 */}
        <View style={styles.profileSummary}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {profile.name?.charAt(0) || '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.name || '사용자'}님의 리포트</Text>
            <Text style={styles.profileBirth}>
              {new Date(profile.birthDate).toLocaleDateString('ko-KR')}
              {profile.birthTime && ` ${profile.birthTime}`}
            </Text>
          </View>
        </View>

        {/* 오행 분포 */}
        {elementDistribution && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Activity size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>오행 분포</Text>
            </View>
            <View style={styles.elementCard}>
              {elementDistribution.map(({ element, percentage }) =>
                renderElementBar(element, percentage)
              )}
              <View style={styles.elementSummary}>
                <Text style={styles.elementSummaryText}>
                  {(() => {
                    const sorted = [...elementDistribution].sort(
                      (a, b) => b.percentage - a.percentage
                    );
                    const strongest = sorted[0];
                    const weakest = sorted[sorted.length - 1];
                    return `가장 강한 오행은 ${strongest.element}(${strongest.percentage}%)이고, ` +
                      `가장 약한 오행은 ${weakest.element}(${weakest.percentage}%)입니다.`;
                  })()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 사용 통계 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BarChart3 size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>앱 사용 통계</Text>
          </View>
          <View style={styles.statsGrid}>
            {renderStatCard(
              <Star size={20} color="#F59E0B" />,
              '저장된 북마크',
              bookmarkStats?.total || 0,
              '#F59E0B'
            )}
            {renderStatCard(
              <Calendar size={20} color="#3B82F6" />,
              '꿈 기록',
              dreamStats?.totalDreams || 0,
              '#3B82F6'
            )}
            {renderStatCard(
              <Award size={20} color="#10B981" />,
              '길몽 수',
              dreamStats?.goodDreams || 0,
              '#10B981'
            )}
            {renderStatCard(
              <TrendingUp size={20} color="#8B5CF6" />,
              '관리 멤버',
              groupStats?.totalMembers || 0,
              '#8B5CF6'
            )}
          </View>
        </View>

        {/* 꿈 분석 */}
        {dreamStats && dreamStats.totalDreams > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>꿈 분석</Text>
            </View>
            <View style={styles.dreamAnalysisCard}>
              <View style={styles.dreamTypeRow}>
                <View style={[styles.dreamTypeBox, { backgroundColor: '#D1FAE5' }]}>
                  <Text style={[styles.dreamTypeNumber, { color: '#10B981' }]}>
                    {dreamStats.goodDreams}
                  </Text>
                  <Text style={styles.dreamTypeLabel}>길몽</Text>
                </View>
                <View style={[styles.dreamTypeBox, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.dreamTypeNumber, { color: '#EF4444' }]}>
                    {dreamStats.badDreams}
                  </Text>
                  <Text style={styles.dreamTypeLabel}>흉몽</Text>
                </View>
                <View style={[styles.dreamTypeBox, { backgroundColor: '#F3F4F6' }]}>
                  <Text style={[styles.dreamTypeNumber, { color: '#6B7280' }]}>
                    {dreamStats.neutralDreams}
                  </Text>
                  <Text style={styles.dreamTypeLabel}>평몽</Text>
                </View>
              </View>

              {dreamStats.commonSymbols.length > 0 && (
                <View style={styles.commonSymbols}>
                  <Text style={styles.commonSymbolsTitle}>자주 나타나는 상징</Text>
                  <View style={styles.symbolChips}>
                    {dreamStats.commonSymbols.slice(0, 5).map(({ symbol, count }) => (
                      <View key={symbol} style={styles.symbolChip}>
                        <Text style={styles.symbolChipText}>
                          {symbol} ({count})
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* 북마크 분석 */}
        {bookmarkStats && bookmarkStats.total > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Star size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>북마크 분석</Text>
            </View>
            <View style={styles.bookmarkAnalysisCard}>
              {bookmarkStats.byType.map(({ category, count }) => (
                <View key={category.type} style={styles.bookmarkTypeRow}>
                  <Text style={styles.bookmarkTypeIcon}>{category.icon}</Text>
                  <Text style={styles.bookmarkTypeLabel}>{category.label}</Text>
                  <View style={styles.bookmarkTypeBarContainer}>
                    <View
                      style={[
                        styles.bookmarkTypeBarFill,
                        {
                          width: `${(count / bookmarkStats.total) * 100}%`,
                          backgroundColor: category.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.bookmarkTypeCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 종합 분석 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>종합 분석</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              {profile.name || '사용자'}님은{' '}
              {elementDistribution && (
                <>
                  <Text style={{ color: ELEMENT_COLORS[elementDistribution[0]?.element] }}>
                    {elementDistribution.sort((a, b) => b.percentage - a.percentage)[0]?.element}
                  </Text>
                  의 기운이 강한 사주를 가지고 있습니다.{' '}
                </>
              )}
              {dreamStats && dreamStats.totalDreams > 0 && (
                <>
                  지금까지 {dreamStats.totalDreams}개의 꿈을 기록했으며,{' '}
                  {dreamStats.goodDreams > dreamStats.badDreams
                    ? '길몽이 흉몽보다 많아 전반적으로 긍정적인 꿈을 꾸고 있습니다.'
                    : '꿈의 메시지에 주의를 기울여 보세요.'}
                </>
              )}
              {bookmarkStats && bookmarkStats.total > 0 && (
                <>
                  {' '}
                  {bookmarkStats.total}개의 운세를 북마크하며 적극적으로 운세를 활용하고 있습니다.
                </>
              )}
            </Text>
          </View>
        </View>

        <View style={{ height: 50 }} />
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  profileAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  profileBirth: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  elementCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  elementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  elementLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 50,
  },
  elementDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.xs,
  },
  elementName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  elementBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginHorizontal: SPACING.sm,
    overflow: 'hidden',
  },
  elementBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  elementPercentage: {
    width: 40,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  elementSummary: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  elementSummaryText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - SPACING.md * 2 - SPACING.sm) / 2 - 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  dreamAnalysisCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  dreamTypeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  dreamTypeBox: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  dreamTypeNumber: {
    fontSize: 24,
    fontWeight: '800',
  },
  dreamTypeLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  commonSymbols: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  commonSymbolsTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  symbolChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  symbolChip: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  symbolChipText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },
  bookmarkAnalysisCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  bookmarkTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  bookmarkTypeIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  bookmarkTypeLabel: {
    width: 80,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  bookmarkTypeBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginHorizontal: SPACING.sm,
    overflow: 'hidden',
  },
  bookmarkTypeBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  bookmarkTypeCount: {
    width: 30,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  summaryText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
  },
});
