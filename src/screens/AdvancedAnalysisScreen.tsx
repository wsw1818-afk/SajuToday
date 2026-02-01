/**
 * 고급 사주 분석 화면
 * - 지장간(地藏干) 분석
 * - 삼합(三合) 분석
 * - 육해(六害)/형벌(刑罰) 분석
 * - 일간 강약(强弱) 판단
 * - 용신(用神)/기신(忌神) 분석
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
import { ArrowLeft, ChevronDown, ChevronUp, Layers, Triangle, AlertCircle, Gauge, Target } from 'lucide-react-native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { useApp } from '../contexts/AppContext';
import { SajuCalculator } from '../services/SajuCalculator';
import {
  performAdvancedAnalysis,
  AdvancedAnalysisResult,
  HiddenStemInfo,
} from '../services/AdvancedSajuAnalysis';
import { FIVE_ELEMENTS, HEAVENLY_STEMS } from '../data/saju';
import { Element } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 오행별 색상
const ELEMENT_COLORS: Record<Element, string> = {
  wood: '#4CAF50',
  fire: '#F44336',
  earth: '#FFC107',
  metal: '#9E9E9E',
  water: '#2196F3',
};

// 섹션 컴포넌트
interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, icon, children, defaultExpanded = true }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.sectionTitleRow}>
          {icon}
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {expanded ? (
          <ChevronUp size={20} color={COLORS.textSecondary} />
        ) : (
          <ChevronDown size={20} color={COLORS.textSecondary} />
        )}
      </TouchableOpacity>
      {expanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

// 강약 게이지 컴포넌트
const StrengthGauge: React.FC<{ score: number; strength: string }> = ({ score, strength }) => {
  const getGaugeColor = () => {
    if (score >= 70) return '#4CAF50';
    if (score >= 55) return '#8BC34A';
    if (score >= 45) return '#FFC107';
    if (score >= 30) return '#FF9800';
    return '#F44336';
  };

  const strengthLabels: Record<string, string> = {
    'extreme-strong': '극강 (極强)',
    'strong': '신강 (身强)',
    'neutral': '중화 (中和)',
    'weak': '신약 (身弱)',
    'extreme-weak': '극약 (極弱)',
  };

  return (
    <View style={styles.gaugeContainer}>
      <View style={styles.gaugeHeader}>
        <Text style={styles.gaugeLabel}>일간 강약</Text>
        <Text style={[styles.gaugeStrength, { color: getGaugeColor() }]}>
          {strengthLabels[strength] || strength}
        </Text>
      </View>
      <View style={styles.gaugeBar}>
        <View
          style={[
            styles.gaugeFill,
            { width: `${score}%`, backgroundColor: getGaugeColor() },
          ]}
        />
        <View style={[styles.gaugeMarker, { left: '50%' }]} />
      </View>
      <View style={styles.gaugeLabels}>
        <Text style={styles.gaugeLabelText}>약</Text>
        <Text style={styles.gaugeLabelText}>중화</Text>
        <Text style={styles.gaugeLabelText}>강</Text>
      </View>
      <Text style={styles.gaugeScore}>{score}점</Text>
    </View>
  );
};

// 지장간 카드 컴포넌트
const HiddenStemCard: React.FC<{
  pillarName: string;
  branch: string;
  hidden: HiddenStemInfo | null;
}> = ({ pillarName, branch, hidden }) => {
  if (!hidden) return null;

  const renderStemBadge = (stem: string | null, element: Element | null, label: string) => {
    if (!stem || !element) return null;
    return (
      <View style={styles.hiddenStemBadge}>
        <View style={[styles.elementDot, { backgroundColor: ELEMENT_COLORS[element] }]} />
        <Text style={styles.hiddenStemText}>{stem}</Text>
        <Text style={styles.hiddenStemLabel}>({label})</Text>
      </View>
    );
  };

  return (
    <View style={styles.hiddenStemCard}>
      <View style={styles.hiddenStemHeader}>
        <Text style={styles.pillarName}>{pillarName}</Text>
        <Text style={styles.branchText}>{branch}지</Text>
      </View>
      <View style={styles.hiddenStemRow}>
        {renderStemBadge(hidden.main, hidden.mainElement, '본기')}
        {renderStemBadge(hidden.middle, hidden.middleElement, '중기')}
        {renderStemBadge(hidden.residue, hidden.residueElement, '여기')}
      </View>
    </View>
  );
};

// 용신/기신 배지 컴포넌트
const ElementBadge: React.FC<{ element: Element; type: 'yongsin' | 'gishin' }> = ({ element, type }) => {
  const info = FIVE_ELEMENTS[element];
  const isYongsin = type === 'yongsin';

  return (
    <View style={[
      styles.elementBadge,
      { backgroundColor: isYongsin ? `${ELEMENT_COLORS[element]}20` : '#FFF3F3' }
    ]}>
      <View style={[styles.elementDot, { backgroundColor: ELEMENT_COLORS[element] }]} />
      <Text style={[
        styles.elementBadgeText,
        { color: isYongsin ? ELEMENT_COLORS[element] : '#E53935' }
      ]}>
        {info.korean}({info.hanja})
      </Text>
    </View>
  );
};

export default function AdvancedAnalysisScreen() {
  const navigation = useNavigation<any>();
  const { profile, sajuResult: contextSajuResult } = useApp();

  // 사주 계산
  const sajuResult = useMemo(() => {
    if (contextSajuResult) return contextSajuResult;
    if (!profile) return null;
    const calculator = new SajuCalculator(profile.birthDate, profile.birthTime);
    return calculator.calculate();
  }, [profile?.birthDate, profile?.birthTime, contextSajuResult]);

  // 고급 분석
  const analysis = useMemo<AdvancedAnalysisResult | null>(() => {
    if (!sajuResult) return null;
    return performAdvancedAnalysis(sajuResult.pillars, sajuResult.elements);
  }, [sajuResult]);

  if (!profile || !sajuResult || !analysis) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>고급 사주 분석</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>프로필 정보가 필요합니다</Text>
          <Text style={styles.emptySubtext}>생년월일을 입력해주세요</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { pillars } = sajuResult;
  const { hiddenStems, threeCombines, harmsPunishments, dayMasterStrength, yongsin } = analysis;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>고급 사주 분석</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 종합 요약 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📋 분석 요약</Text>
          <Text style={styles.summaryText}>{analysis.overallSummary}</Text>
        </View>

        {/* 1. 일간 강약 */}
        <Section
          title="일간 강약 분석"
          icon={<Gauge size={20} color={COLORS.primary} />}
        >
          <StrengthGauge score={dayMasterStrength.score} strength={dayMasterStrength.strength} />

          <View style={styles.reasonsContainer}>
            <Text style={styles.subTitle}>판단 근거</Text>
            {dayMasterStrength.reasons.map((reason, idx) => (
              <View key={idx} style={styles.reasonRow}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            ))}
          </View>

          <View style={styles.analysisBox}>
            <Text style={styles.analysisText}>{dayMasterStrength.analysis}</Text>
          </View>
        </Section>

        {/* 2. 용신/기신 */}
        <Section
          title="용신(用神) / 기신(忌神)"
          icon={<Target size={20} color={COLORS.primary} />}
        >
          <View style={styles.yongsinContainer}>
            <View style={styles.yongsinRow}>
              <Text style={styles.yongsinLabel}>✨ 용신 (도움)</Text>
              <View style={styles.badgeRow}>
                {yongsin.yongsin.map((e, idx) => (
                  <ElementBadge key={idx} element={e} type="yongsin" />
                ))}
              </View>
            </View>

            {yongsin.heeshin.length > 0 && (
              <View style={styles.yongsinRow}>
                <Text style={styles.yongsinLabel}>💫 희신 (보조)</Text>
                <View style={styles.badgeRow}>
                  {yongsin.heeshin.map((e, idx) => (
                    <ElementBadge key={idx} element={e} type="yongsin" />
                  ))}
                </View>
              </View>
            )}

            {yongsin.gishin.length > 0 && (
              <View style={styles.yongsinRow}>
                <Text style={styles.yongsinLabel}>⚠️ 기신 (주의)</Text>
                <View style={styles.badgeRow}>
                  {yongsin.gishin.map((e, idx) => (
                    <ElementBadge key={idx} element={e} type="gishin" />
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={styles.recommendationBox}>
            <Text style={styles.recommendationTitle}>💡 행운 포인트</Text>
            <View style={styles.recommendationRow}>
              <Text style={styles.recommendationLabel}>색상</Text>
              <Text style={styles.recommendationValue}>{yongsin.recommendations.colors.join(' / ')}</Text>
            </View>
            <View style={styles.recommendationRow}>
              <Text style={styles.recommendationLabel}>방향</Text>
              <Text style={styles.recommendationValue}>{yongsin.recommendations.directions.join(', ')}</Text>
            </View>
            <View style={styles.recommendationRow}>
              <Text style={styles.recommendationLabel}>숫자</Text>
              <Text style={styles.recommendationValue}>{yongsin.recommendations.numbers.join(', ')}</Text>
            </View>
          </View>

          <View style={styles.adviceContainer}>
            {yongsin.recommendations.advice.map((advice, idx) => (
              <View key={idx} style={styles.adviceRow}>
                <Text style={styles.adviceIcon}>💬</Text>
                <Text style={styles.adviceText}>{advice}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* 3. 지장간 */}
        <Section
          title="지장간(地藏干) 분석"
          icon={<Layers size={20} color={COLORS.primary} />}
          defaultExpanded={false}
        >
          <Text style={styles.sectionDescription}>
            지장간은 지지(地支) 속에 숨어있는 천간(天干)입니다.
            겉으로 드러나지 않는 내면의 성향을 보여줍니다.
          </Text>

          <View style={styles.hiddenStemGrid}>
            <HiddenStemCard pillarName="년주" branch={pillars.year.branch} hidden={hiddenStems.year} />
            <HiddenStemCard pillarName="월주" branch={pillars.month.branch} hidden={hiddenStems.month} />
            <HiddenStemCard pillarName="일주" branch={pillars.day.branch} hidden={hiddenStems.day} />
            {pillars.hour && (
              <HiddenStemCard pillarName="시주" branch={pillars.hour.branch} hidden={hiddenStems.hour} />
            )}
          </View>

          {hiddenStems.hiddenTraits.length > 0 && (
            <View style={styles.traitsBox}>
              <Text style={styles.traitsTitle}>🔮 숨겨진 성향</Text>
              {hiddenStems.hiddenTraits.map((trait, idx) => (
                <Text key={idx} style={styles.traitText}>• {trait}</Text>
              ))}
            </View>
          )}
        </Section>

        {/* 4. 삼합 */}
        <Section
          title="삼합(三合) 분석"
          icon={<Triangle size={20} color={COLORS.primary} />}
          defaultExpanded={false}
        >
          <Text style={styles.sectionDescription}>
            삼합은 3개의 지지가 모여 특정 오행의 기운을 강하게 만듭니다.
          </Text>

          {threeCombines.found.length > 0 ? (
            <View style={styles.combineList}>
              {threeCombines.found.map((tc, idx) => (
                <View key={idx} style={styles.combineCard}>
                  <View style={styles.combineHeader}>
                    <View style={[styles.elementDot, { backgroundColor: ELEMENT_COLORS[tc.element] }]} />
                    <Text style={styles.combineName}>{tc.name}</Text>
                  </View>
                  <Text style={styles.combineDescription}>{tc.description}</Text>
                  <View style={styles.combineBranches}>
                    {tc.branches.map((b, bidx) => (
                      <View key={bidx} style={styles.branchBadge}>
                        <Text style={styles.branchBadgeText}>{b}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : threeCombines.halfCombines.length > 0 ? (
            <View style={styles.halfCombineContainer}>
              <Text style={styles.halfCombineTitle}>🔸 반합 (2/3 형성)</Text>
              {threeCombines.halfCombines.map((hc, idx) => (
                <View key={idx} style={styles.halfCombineCard}>
                  <Text style={styles.halfCombineName}>{hc.name}</Text>
                  <Text style={styles.halfCombineInfo}>
                    {hc.branches.join(', ')} 보유 / {hc.missing} 부족
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noDataBox}>
              <Text style={styles.noDataText}>{threeCombines.summary}</Text>
            </View>
          )}
        </Section>

        {/* 5. 육해/형벌 */}
        <Section
          title="육해(六害) / 형벌(刑罰)"
          icon={<AlertCircle size={20} color="#E53935" />}
          defaultExpanded={false}
        >
          <Text style={styles.sectionDescription}>
            육해와 형벌은 사주에서 주의가 필요한 관계입니다.
            인지하고 대비하면 충분히 극복할 수 있습니다.
          </Text>

          {harmsPunishments.harms.length > 0 && (
            <View style={styles.harmContainer}>
              <Text style={styles.harmTitle}>⚠️ 육해 (六害)</Text>
              {harmsPunishments.harms.map((harm, idx) => (
                <View key={idx} style={styles.harmCard}>
                  <Text style={styles.harmName}>{harm.name}</Text>
                  <Text style={styles.harmDescription}>{harm.description}</Text>
                </View>
              ))}
            </View>
          )}

          {harmsPunishments.punishments.length > 0 && (
            <View style={styles.punishContainer}>
              <Text style={styles.punishTitle}>⛔ 형벌 (刑罰)</Text>
              {harmsPunishments.punishments.map((punish, idx) => (
                <View key={idx} style={styles.punishCard}>
                  <Text style={styles.punishName}>{punish.name}</Text>
                  <Text style={styles.punishDescription}>{punish.description}</Text>
                </View>
              ))}
            </View>
          )}

          {harmsPunishments.harms.length === 0 && harmsPunishments.punishments.length === 0 && (
            <View style={styles.noHarmBox}>
              <Text style={styles.noHarmEmoji}>✅</Text>
              <Text style={styles.noHarmText}>{harmsPunishments.summary}</Text>
            </View>
          )}
        </Section>

        {/* 면책 문구 */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ℹ️ 이 분석은 전통 명리학 이론을 바탕으로 하며,
            참고용으로만 활용해주세요.
          </Text>
        </View>
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
    backgroundColor: COLORS.white,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  // 요약 카드
  summaryCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  summaryText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },

  // 섹션
  section: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionContent: {
    padding: SPACING.md,
  },
  sectionDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },

  // 강약 게이지
  gaugeContainer: {
    marginBottom: SPACING.md,
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  gaugeLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  gaugeStrength: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  gaugeBar: {
    height: 12,
    backgroundColor: COLORS.border,
    borderRadius: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 6,
  },
  gaugeMarker: {
    position: 'absolute',
    top: -2,
    width: 2,
    height: 16,
    backgroundColor: COLORS.textSecondary,
    marginLeft: -1,
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  gaugeLabelText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },
  gaugeScore: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },

  // 근거 목록
  reasonsContainer: {
    marginBottom: SPACING.md,
  },
  subTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  reasonRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  bulletPoint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginRight: SPACING.xs,
  },
  reasonText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },

  // 분석 박스
  analysisBox: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  analysisText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },

  // 용신/기신
  yongsinContainer: {
    marginBottom: SPACING.md,
  },
  yongsinRow: {
    marginBottom: SPACING.sm,
  },
  yongsinLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  elementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  elementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  elementBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },

  // 추천 박스
  recommendationBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  recommendationTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  recommendationRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  recommendationLabel: {
    width: 50,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  recommendationValue: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },

  // 조언
  adviceContainer: {
    gap: SPACING.sm,
  },
  adviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  adviceIcon: {
    marginRight: SPACING.xs,
  },
  adviceText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },

  // 지장간
  hiddenStemGrid: {
    gap: SPACING.sm,
  },
  hiddenStemCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  hiddenStemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  pillarName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  branchText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  hiddenStemRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  hiddenStemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  hiddenStemText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  hiddenStemLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },

  // 숨겨진 성향
  traitsBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  traitsTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#F57F17',
    marginBottom: SPACING.sm,
  },
  traitText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: SPACING.xs,
  },

  // 삼합
  combineList: {
    gap: SPACING.sm,
  },
  combineCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  combineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  combineName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  combineDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  combineBranches: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  branchBadge: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  branchBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.white,
  },

  // 반합
  halfCombineContainer: {
    gap: SPACING.sm,
  },
  halfCombineTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  halfCombineCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  halfCombineName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  halfCombineInfo: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  // 데이터 없음
  noDataBox: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  noDataText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // 육해/형벌
  harmContainer: {
    marginBottom: SPACING.md,
  },
  harmTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#FF9800',
    marginBottom: SPACING.sm,
  },
  harmCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  harmName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: SPACING.xs,
  },
  harmDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  punishContainer: {
    marginBottom: SPACING.md,
  },
  punishTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#E53935',
    marginBottom: SPACING.sm,
  },
  punishCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  punishName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: '#C62828',
    marginBottom: SPACING.xs,
  },
  punishDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },

  // 육해/형벌 없음
  noHarmBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  noHarmEmoji: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  noHarmText: {
    fontSize: FONT_SIZES.sm,
    color: '#2E7D32',
    textAlign: 'center',
    lineHeight: 20,
  },

  // 면책
  disclaimer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  disclaimerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
});
