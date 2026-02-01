/**
 * 대운/세운 분석 화면
 * 10년 단위 운세 흐름과 연간 운세를 보여줍니다.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../utils/theme';
import { useApp } from '../contexts/AppContext';
import {
  analyzeDaeunSeun,
  getDaeunTransition,
  Daeun,
  Seun,
} from '../services/DaeunCalculator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'daeun' | 'seun' | 'graph';

export default function DaeunScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('daeun');
  const [selectedDaeun, setSelectedDaeun] = useState<Daeun | null>(null);

  // 사주 정보 추출
  const birthInfo = useMemo(() => {
    if (!profile?.birthDate) return null;
    const [year, month, day] = profile.birthDate.split('-').map(Number);
    const hour = profile.birthTime ? parseInt(profile.birthTime.split(':')[0]) : null;
    return { year, month, day, hour };
  }, [profile]);

  // 대운/세운 분석
  const analysis = useMemo(() => {
    if (!birthInfo || !profile?.gender) return null;

    // 월간, 일간 계산 (간략화)
    const stemIndex = (birthInfo.year - 4) % 10;
    const branchIndex = (birthInfo.year - 4) % 12;
    const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
    const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

    // 월간 계산 (년간 기준)
    const monthStemBase = (stemIndex * 2 + birthInfo.month) % 10;
    const monthBranchIndex = (birthInfo.month + 1) % 12;

    // 일간 계산 (간략화된 공식)
    const dayCount = Math.floor((birthInfo.year - 1900) * 365.25 + (birthInfo.month - 1) * 30.44 + birthInfo.day);
    const dayStemIndex = (dayCount + 9) % 10;

    const dayGan = STEMS[dayStemIndex];
    const monthGan = STEMS[monthStemBase];
    const monthJi = BRANCHES[monthBranchIndex];

    return analyzeDaeunSeun(
      birthInfo.year,
      birthInfo.month,
      birthInfo.day,
      birthInfo.hour,
      profile.gender as 'male' | 'female',
      dayGan,
      monthGan,
      monthJi
    );
  }, [birthInfo, profile?.gender]);

  // 대운 전환 정보
  const transition = useMemo(() => {
    if (!analysis) return null;
    const currentAge = new Date().getFullYear() - (birthInfo?.year || 2000) + 1;
    return getDaeunTransition(analysis.daeunList, currentAge);
  }, [analysis, birthInfo]);

  if (!profile || !analysis) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>대운/세운 분석</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>프로필 정보가 필요합니다</Text>
          <Text style={styles.emptySubtext}>생년월일과 성별을 설정해주세요</Text>
        </View>
      </SafeAreaView>
    );
  }

  const tabs = [
    { key: 'daeun' as TabType, label: '대운', emoji: '🌊' },
    { key: 'seun' as TabType, label: '세운', emoji: '📅' },
    { key: 'graph' as TabType, label: '인생그래프', emoji: '📈' },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#10B981';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return '🌟';
    if (score >= 70) return '😊';
    if (score >= 55) return '😐';
    if (score >= 40) return '😓';
    return '💪';
  };

  const renderDaeunTab = () => (
    <View style={styles.tabContent}>
      {/* 현재 대운 요약 */}
      {analysis.currentDaeun && (
        <View style={styles.currentCard}>
          <View style={styles.currentHeader}>
            <Text style={styles.currentLabel}>현재 대운</Text>
            <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(analysis.currentDaeun.score) }]}>
              <Text style={styles.scoreText}>{analysis.currentDaeun.score}점</Text>
            </View>
          </View>
          <Text style={styles.currentGanji}>{analysis.currentDaeun.ganJi} 대운</Text>
          <Text style={styles.currentAge}>
            {analysis.currentDaeun.startAge}~{analysis.currentDaeun.endAge}세
          </Text>
          <View style={styles.currentInfo}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>십신</Text>
              <Text style={styles.infoValue}>{analysis.currentDaeun.tenGod}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>오행</Text>
              <Text style={styles.infoValue}>{analysis.currentDaeun.element}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>키워드</Text>
              <Text style={styles.infoValue}>{analysis.currentDaeun.keyword}</Text>
            </View>
          </View>
          <Text style={styles.currentDesc}>{analysis.currentDaeun.description}</Text>
        </View>
      )}

      {/* 대운 전환 알림 */}
      {transition?.isTransitioning && (
        <View style={styles.transitionCard}>
          <Text style={styles.transitionEmoji}>⚡</Text>
          <Text style={styles.transitionTitle}>대운 전환기</Text>
          <Text style={styles.transitionText}>{transition.message}</Text>
        </View>
      )}

      {/* 대운 목록 */}
      <Text style={styles.sectionTitle}>전체 대운 흐름</Text>
      {analysis.daeunList.map((daeun) => (
        <TouchableOpacity
          key={daeun.order}
          style={[
            styles.daeunCard,
            daeun.isCurrent && styles.daeunCardCurrent,
            selectedDaeun?.order === daeun.order && styles.daeunCardSelected,
          ]}
          onPress={() => setSelectedDaeun(selectedDaeun?.order === daeun.order ? null : daeun)}
        >
          <View style={styles.daeunHeader}>
            <View style={styles.daeunLeft}>
              <Text style={styles.daeunOrder}>{daeun.order}운</Text>
              <Text style={styles.daeunGanji}>{daeun.ganJi}</Text>
              <Text style={styles.daeunAge}>{daeun.startAge}~{daeun.endAge}세</Text>
            </View>
            <View style={styles.daeunRight}>
              <Text style={styles.daeunEmoji}>{getScoreEmoji(daeun.score)}</Text>
              <View style={[styles.daeunScoreBar, { width: `${daeun.score}%`, backgroundColor: getScoreColor(daeun.score) }]} />
              <Text style={[styles.daeunScore, { color: getScoreColor(daeun.score) }]}>{daeun.score}</Text>
            </View>
            {daeun.isCurrent && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>현재</Text>
              </View>
            )}
          </View>

          {selectedDaeun?.order === daeun.order && (
            <View style={styles.daeunDetail}>
              <Text style={styles.daeunDetailText}>{daeun.description}</Text>
              <View style={styles.daeunDetailRow}>
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>십신</Text>
                  <Text style={styles.detailValue}>{daeun.tenGod}</Text>
                </View>
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>키워드</Text>
                  <Text style={styles.detailValue}>{daeun.keyword}</Text>
                </View>
              </View>
              <View style={styles.aspectsRow}>
                <View style={styles.goodAspect}>
                  <Text style={styles.aspectLabel}>👍 좋은 점</Text>
                  <Text style={styles.aspectText}>{daeun.goodAspects[0]}</Text>
                </View>
                <View style={styles.badAspect}>
                  <Text style={styles.aspectLabel}>⚠️ 주의</Text>
                  <Text style={styles.aspectText}>{daeun.badAspects[0]}</Text>
                </View>
              </View>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSeunTab = () => (
    <View style={styles.tabContent}>
      {/* 올해 세운 */}
      {analysis.currentSeun && (
        <View style={styles.currentCard}>
          <View style={styles.currentHeader}>
            <Text style={styles.currentLabel}>{analysis.currentSeun.year}년 세운</Text>
            <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(analysis.currentSeun.score) }]}>
              <Text style={styles.scoreText}>{analysis.currentSeun.score}점</Text>
            </View>
          </View>
          <Text style={styles.currentGanji}>
            {analysis.currentSeun.ganJi}년 ({analysis.currentSeun.animal}띠 해)
          </Text>
          <Text style={styles.currentAge}>{analysis.currentSeun.age}세</Text>
          <View style={styles.currentInfo}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>십신</Text>
              <Text style={styles.infoValue}>{analysis.currentSeun.tenGod}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>키워드</Text>
              <Text style={styles.infoValue}>{analysis.currentSeun.keyword}</Text>
            </View>
          </View>
          <Text style={styles.currentDesc}>{analysis.currentSeun.description}</Text>
          <Text style={styles.monthlyHighlight}>📌 {analysis.currentSeun.monthlyHighlight}</Text>
        </View>
      )}

      {/* 세운 목록 */}
      <Text style={styles.sectionTitle}>연도별 세운</Text>
      {analysis.seunList.map((seun) => (
        <View
          key={seun.year}
          style={[
            styles.seunCard,
            seun.isCurrent && styles.seunCardCurrent,
          ]}
        >
          <View style={styles.seunLeft}>
            <Text style={styles.seunYear}>{seun.year}</Text>
            <Text style={styles.seunGanji}>{seun.ganJi}</Text>
            <Text style={styles.seunAnimal}>{seun.animal}띠</Text>
          </View>
          <View style={styles.seunMiddle}>
            <Text style={styles.seunAge}>{seun.age}세</Text>
            <Text style={styles.seunTenGod}>{seun.tenGod}</Text>
          </View>
          <View style={styles.seunRight}>
            <Text style={styles.seunEmoji}>{getScoreEmoji(seun.score)}</Text>
            <Text style={[styles.seunScore, { color: getScoreColor(seun.score) }]}>
              {seun.score}점
            </Text>
          </View>
          {seun.isCurrent && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>올해</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderGraphTab = () => {
    const maxScore = Math.max(...analysis.lifeGraph.map(p => p.score));
    const minScore = Math.min(...analysis.lifeGraph.map(p => p.score));
    const graphHeight = 200;
    const currentAge = new Date().getFullYear() - (birthInfo?.year || 2000) + 1;

    return (
      <View style={styles.tabContent}>
        <View style={styles.graphCard}>
          <Text style={styles.graphTitle}>인생 운세 그래프</Text>
          <Text style={styles.graphSubtitle}>대운 흐름에 따른 운세 점수 변화</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.graphScroll}>
            <View style={[styles.graphContainer, { width: Math.max(SCREEN_WIDTH - 60, analysis.lifeGraph.length * 8) }]}>
              {/* 그래프 배경선 */}
              <View style={[styles.graphLine, { top: 0 }]} />
              <View style={[styles.graphLine, { top: graphHeight / 2 }]} />
              <View style={[styles.graphLine, { top: graphHeight }]} />

              {/* 점수 레이블 */}
              <Text style={[styles.graphLabel, { top: -10 }]}>100</Text>
              <Text style={[styles.graphLabel, { top: graphHeight / 2 - 10 }]}>50</Text>
              <Text style={[styles.graphLabel, { top: graphHeight - 10 }]}>0</Text>

              {/* 그래프 바 */}
              <View style={styles.barsContainer}>
                {analysis.lifeGraph.map((point, index) => {
                  const height = (point.score / 100) * graphHeight;
                  const isCurrent = point.age === currentAge;
                  return (
                    <View key={index} style={styles.barWrapper}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height,
                            backgroundColor: isCurrent ? '#8B5CF6' : getScoreColor(point.score),
                          },
                        ]}
                      />
                      {point.age % 10 === 0 && (
                        <Text style={styles.barLabel}>{point.age}세</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* 범례 */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>좋음 (70+)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>보통 (50-69)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>주의 (50-)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
              <Text style={styles.legendText}>현재</Text>
            </View>
          </View>
        </View>

        {/* 요약 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📋 종합 분석</Text>
          <Text style={styles.summaryText}>{analysis.summary}</Text>
        </View>

        <View style={styles.adviceCard}>
          <Text style={styles.adviceTitle}>💡 조언</Text>
          <Text style={styles.adviceText}>{analysis.advice}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>대운/세운 분석</Text>
        <View style={{ width: 40 }} />
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'daeun' && renderDaeunTab()}
        {activeTab === 'seun' && renderSeunTab()}
        {activeTab === 'graph' && renderGraphTab()}
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
    width: 40,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
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
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  currentCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  currentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  currentLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  scoreBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  scoreText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '700',
  },
  currentGanji: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.text,
  },
  currentAge: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  currentInfo: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  currentDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
    flex: 1,
    flexWrap: 'wrap',
  },
  monthlyHighlight: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginTop: SPACING.sm,
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
  },
  transitionCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  transitionEmoji: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  transitionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: SPACING.xs,
  },
  transitionText: {
    fontSize: FONT_SIZES.sm,
    color: '#78350F',
    textAlign: 'center',
    lineHeight: 20,
    flex: 1,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  daeunCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  daeunCardCurrent: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  daeunCardSelected: {
    backgroundColor: '#F5F3FF',
  },
  daeunHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daeunLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  daeunOrder: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  daeunGanji: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  daeunAge: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  daeunRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  daeunEmoji: {
    fontSize: 20,
  },
  daeunScoreBar: {
    height: 8,
    borderRadius: 4,
    maxWidth: 60,
  },
  daeunScore: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    width: 30,
    textAlign: 'right',
  },
  currentBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    marginLeft: SPACING.sm,
  },
  currentBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    fontWeight: '600',
  },
  daeunDetail: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  daeunDetailText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: SPACING.sm,
    flex: 1,
    flexWrap: 'wrap',
  },
  daeunDetailRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  detailBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  aspectsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  goodAspect: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  badAspect: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  aspectLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    marginBottom: 4,
  },
  aspectText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
    lineHeight: 16,
    flex: 1,
    flexWrap: 'wrap',
  },
  seunCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  seunCardCurrent: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  seunLeft: {
    flex: 1,
  },
  seunYear: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  seunGanji: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  seunAnimal: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  seunMiddle: {
    flex: 1,
    alignItems: 'center',
  },
  seunAge: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  seunTenGod: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  seunRight: {
    alignItems: 'center',
  },
  seunEmoji: {
    fontSize: 24,
  },
  seunScore: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  graphCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  graphTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  graphSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  graphScroll: {
    marginBottom: SPACING.md,
  },
  graphContainer: {
    height: 250,
    position: 'relative',
    paddingLeft: 30,
  },
  graphLine: {
    position: 'absolute',
    left: 30,
    right: 0,
    height: 1,
    backgroundColor: COLORS.border,
  },
  graphLabel: {
    position: 'absolute',
    left: 0,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 200,
    marginTop: 10,
  },
  barWrapper: {
    alignItems: 'center',
    width: 8,
    marginRight: 2,
  },
  bar: {
    width: 6,
    borderRadius: 3,
  },
  barLabel: {
    fontSize: 8,
    color: COLORS.textSecondary,
    marginTop: 4,
    width: 30,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  summaryText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 22,
    flex: 1,
    flexWrap: 'wrap',
  },
  adviceCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  adviceTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: SPACING.sm,
  },
  adviceText: {
    fontSize: FONT_SIZES.sm,
    color: '#0C4A6E',
    lineHeight: 22,
    flex: 1,
    flexWrap: 'wrap',
  },
  bottomPadding: {
    height: 40,
  },
});
