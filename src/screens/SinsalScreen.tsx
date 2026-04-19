/**
 * 신살(神殺) 분석 화면
 * 사주의 길신과 흉신을 상세히 분석합니다.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Star, AlertTriangle, Info } from 'lucide-react-native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../utils/theme';
import { useApp } from '../contexts/AppContext';
import { SajuCalculator } from '../services/SajuCalculator';
import { calculateSinsals, getSinsalEmoji, Sinsal } from '../services/SinsalCalculator';

export default function SinsalScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useApp();

  // 사주 계산
  const sajuResult = useMemo(() => {
    if (!profile) return null;
    const calculator = new SajuCalculator(profile.birthDate, profile.birthTime);
    return calculator.calculate();
  }, [profile?.birthDate, profile?.birthTime]);

  // 신살 분석
  const sinsalAnalysis = useMemo(() => {
    if (!sajuResult) return null;
    return calculateSinsals(sajuResult);
  }, [sajuResult]);

  if (!profile || !sajuResult || !sinsalAnalysis) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>신살 분석</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>프로필 정보가 필요합니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  const foundGoodSinsals = sinsalAnalysis.goodSinsals.filter(s => s.found);
  const foundBadSinsals = sinsalAnalysis.badSinsals.filter(s => s.found);

  const renderSinsalCard = (sinsal: Sinsal) => {
    const isGood = sinsal.type === 'good';
    const emoji = getSinsalEmoji(sinsal);

    return (
      <View
        key={sinsal.name}
        style={[
          styles.sinsalCard,
          isGood ? styles.goodCard : styles.badCard,
        ]}
      >
        <View style={styles.sinsalHeader}>
          <Text style={styles.sinsalEmoji}>{emoji}</Text>
          <View style={styles.sinsalTitleContainer}>
            <Text style={styles.sinsalName}>{sinsal.name}</Text>
            <Text style={styles.sinsalHanja}>{sinsal.hanja}</Text>
          </View>
          <View style={[styles.badge, isGood ? styles.goodBadge : styles.badBadge]}>
            <Text style={styles.badgeText}>
              {sinsal.location.join(', ')}
            </Text>
          </View>
        </View>

        <Text style={styles.sinsalDescription}>{sinsal.description}</Text>

        <View style={styles.effectBox}>
          <Text style={styles.effectLabel}>영향</Text>
          <Text style={styles.effectText}>{sinsal.effect}</Text>
        </View>

        <View style={[styles.adviceBox, isGood ? styles.goodAdviceBox : styles.badAdviceBox]}>
          <Text style={[styles.adviceLabel, isGood ? styles.goodAdviceLabel : styles.badAdviceLabel]}>
            💡 조언
          </Text>
          <Text style={[styles.adviceText, isGood ? styles.goodAdviceText : styles.badAdviceText]}>
            {sinsal.advice}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>신살 분석</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 요약 카드 */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Info size={20} color={COLORS.primary} />
            <Text style={styles.summaryTitle}>종합 분석</Text>
          </View>
          <Text style={styles.summaryText}>{sinsalAnalysis.summary}</Text>
          <View style={styles.simpleBox}>
            <Text style={styles.simpleLabel}>쉬운 해석</Text>
            <Text style={styles.simpleText}>{sinsalAnalysis.simpleInterpretation}</Text>
          </View>
        </View>

        {/* 통계 */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.goodStatCard]}>
            <Star size={24} color="#10B981" />
            <Text style={styles.statNumber}>{foundGoodSinsals.length}</Text>
            <Text style={styles.statLabel}>길신</Text>
          </View>
          <View style={[styles.statCard, styles.badStatCard]}>
            <AlertTriangle size={24} color="#EF4444" />
            <Text style={styles.statNumber}>{foundBadSinsals.length}</Text>
            <Text style={styles.statLabel}>흉신</Text>
          </View>
        </View>

        {/* 길신 섹션 */}
        {foundGoodSinsals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Star size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>길신 (吉神) - 좋은 신살</Text>
            </View>
            <Text style={styles.sectionDescription}>
              사주에서 발견된 길신입니다. 해당 분야에서 복을 받습니다.
            </Text>
            {foundGoodSinsals.map(renderSinsalCard)}
          </View>
        )}

        {/* 흉신 섹션 */}
        {foundBadSinsals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={20} color="#EF4444" />
              <Text style={styles.sectionTitle}>흉신 (凶神) - 주의할 신살</Text>
            </View>
            <Text style={styles.sectionDescription}>
              흉신이 있다고 무조건 나쁜 것은 아닙니다. 주의할 점을 알면 오히려 전화위복이 됩니다.
            </Text>
            {foundBadSinsals.map(renderSinsalCard)}
          </View>
        )}

        {/* 신살이 하나도 없는 경우 */}
        {foundGoodSinsals.length === 0 && foundBadSinsals.length === 0 && (
          <View style={styles.noSinsalBox}>
            <Text style={styles.noSinsalText}>
              사주에서 특별한 신살이 발견되지 않았습니다.
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
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
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  summaryText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  simpleBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  simpleLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: SPACING.xs,
  },
  simpleText: {
    fontSize: FONT_SIZES.md,
    color: '#0C4A6E',
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  goodStatCard: {
    borderWidth: 2,
    borderColor: '#D1FAE5',
  },
  badStatCard: {
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  sinsalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
  },
  goodCard: {
    borderColor: '#D1FAE5',
    backgroundColor: '#F0FDF4',
  },
  badCard: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  sinsalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sinsalEmoji: {
    fontSize: 28,
    marginRight: SPACING.sm,
  },
  sinsalTitleContainer: {
    flex: 1,
  },
  sinsalName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  sinsalHanja: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  goodBadge: {
    backgroundColor: COLORS.success,
  },
  badBadge: {
    backgroundColor: COLORS.error,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: 'white',
  },
  sinsalDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  effectBox: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  effectLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  effectText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  adviceBox: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  goodAdviceBox: {
    backgroundColor: '#ECFDF5',
  },
  badAdviceBox: {
    backgroundColor: '#FFFBEB',
  },
  adviceLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    marginBottom: 4,
  },
  goodAdviceLabel: {
    color: '#065F46',
  },
  badAdviceLabel: {
    color: '#92400E',
  },
  adviceText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  goodAdviceText: {
    color: '#047857',
  },
  badAdviceText: {
    color: '#B45309',
  },
  bottomSpacer: {
    height: 50,
  },
  noSinsalBox: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  noSinsalText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
