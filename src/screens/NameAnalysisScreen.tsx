/**
 * 이름 분석 화면
 * 사주 오행 기반 이름 분석 및 추천
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../utils/theme';
import { useApp } from '../contexts/AppContext';
import { analyzeName, NameAnalysis } from '../services/NameAnalyzer';

const ELEMENT_COLORS: Record<string, string> = {
  '목': '#22C55E',
  '화': '#EF4444',
  '토': '#F59E0B',
  '금': '#A1A1AA',
  '수': '#3B82F6',
};

const ELEMENT_EMOJI: Record<string, string> = {
  '목': '🌳',
  '화': '🔥',
  '토': '🏔️',
  '금': '⚔️',
  '수': '💧',
};

export default function NameAnalysisScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useApp();
  const [inputName, setInputName] = useState('');
  const [analysis, setAnalysis] = useState<NameAnalysis | null>(null);

  // 사주에서 오행 분포 추출 (간략화)
  const userElements = useMemo(() => {
    if (!profile) return undefined;
    // 실제로는 사주 계산 결과에서 가져와야 함
    return { '목': 2, '화': 1, '토': 3, '금': 1, '수': 1 };
  }, [profile]);

  const handleAnalyze = () => {
    if (inputName.length < 2) return;
    const result = analyzeName(inputName, userElements);
    setAnalysis(result);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const renderElementBar = (element: string, count: number, maxCount: number) => {
    const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
    return (
      <View key={element} style={styles.elementBarRow}>
        <Text style={styles.elementEmoji}>{ELEMENT_EMOJI[element]}</Text>
        <Text style={styles.elementLabel}>{element}</Text>
        <View style={styles.elementBarBg}>
          <View
            style={[
              styles.elementBarFill,
              { width: `${width}%`, backgroundColor: ELEMENT_COLORS[element] }
            ]}
          />
        </View>
        <Text style={styles.elementCount}>{count}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>이름 분석</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 입력 섹션 */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>분석할 이름을 입력하세요</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={inputName}
              onChangeText={setInputName}
              placeholder="예: 홍길동"
              placeholderTextColor={COLORS.textSecondary}
              maxLength={5}
            />
            <TouchableOpacity
              style={[styles.analyzeButton, inputName.length < 2 && styles.analyzeButtonDisabled]}
              onPress={handleAnalyze}
              disabled={inputName.length < 2}
            >
              <Text style={styles.analyzeButtonText}>분석</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.inputHint}>한글 이름만 분석 가능합니다 (2~5자)</Text>
        </View>

        {/* 분석 결과 */}
        {analysis && (
          <>
            {/* 글자별 분석 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📝 글자별 분석</Text>
              <View style={styles.charactersRow}>
                {analysis.characters.map((char, idx) => (
                  <View key={idx} style={styles.characterCard}>
                    <Text style={styles.characterText}>{char.char}</Text>
                    <View style={styles.characterElements}>
                      {char.elements.map((el, i) => (
                        <View
                          key={i}
                          style={[styles.elementBadge, { backgroundColor: ELEMENT_COLORS[el] }]}
                        >
                          <Text style={styles.elementBadgeText}>{el}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.characterStrokes}>{char.strokes}획</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 오행 분포 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>☯️ 오행 분포</Text>
              <View style={styles.elementBars}>
                {Object.entries(analysis.elementDistribution).map(([el, count]) =>
                  renderElementBar(el, count, Math.max(...Object.values(analysis.elementDistribution)))
                )}
              </View>
              <View style={styles.balanceBox}>
                <Text style={styles.balanceIcon}>
                  {analysis.balance.isBalanced ? '✅' : '⚠️'}
                </Text>
                <Text style={styles.balanceText}>{analysis.balance.analysis}</Text>
              </View>
            </View>

            {/* 획수 운 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔢 획수 분석</Text>
              <View style={styles.strokeCard}>
                <Text style={styles.strokeNumber}>총 {analysis.totalStrokes}획</Text>
                <View style={[
                  styles.fortuneBadge,
                  { backgroundColor: analysis.strokeFortune.fortune === '길' ? '#DCFCE7' : analysis.strokeFortune.fortune === '흉' ? '#FEE2E2' : '#F3F4F6' }
                ]}>
                  <Text style={[
                    styles.fortuneText,
                    { color: analysis.strokeFortune.fortune === '길' ? '#166534' : analysis.strokeFortune.fortune === '흉' ? '#991B1B' : '#374151' }
                  ]}>
                    {analysis.strokeFortune.fortune}
                  </Text>
                </View>
                <Text style={styles.strokeMeaning}>{analysis.strokeFortune.meaning}</Text>
              </View>
            </View>

            {/* 사주 호환성 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔮 사주와의 조화</Text>
              <View style={styles.compatibilityCard}>
                <View style={styles.compatibilityScore}>
                  <Text style={[styles.scoreValue, { color: getScoreColor(analysis.compatibility.score) }]}>
                    {analysis.compatibility.score}
                  </Text>
                  <Text style={styles.scoreUnit}>점</Text>
                </View>
                <Text style={styles.compatibilityText}>
                  {analysis.compatibility.analysis}
                </Text>
              </View>
            </View>

            {/* 제안사항 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 제안</Text>
              {analysis.suggestions.map((suggestion, idx) => (
                <View key={idx} style={styles.suggestionItem}>
                  <Text style={styles.suggestionBullet}>•</Text>
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </View>
              ))}
            </View>

            {/* 종합 */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>종합 평가</Text>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryName}>{analysis.name}</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryItemLabel}>총 획수</Text>
                    <Text style={styles.summaryItemValue}>{analysis.totalStrokes}획</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryItemLabel}>획수 운</Text>
                    <Text style={[styles.summaryItemValue, { color: analysis.strokeFortune.fortune === '길' ? '#10B981' : '#EF4444' }]}>
                      {analysis.strokeFortune.fortune}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryItemLabel}>사주 조화</Text>
                    <Text style={[styles.summaryItemValue, { color: getScoreColor(analysis.compatibility.score) }]}>
                      {analysis.compatibility.score}점
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {/* 안내 */}
        {!analysis && (
          <View style={styles.guideSection}>
            <Text style={styles.guideEmoji}>📚</Text>
            <Text style={styles.guideTitle}>이름 분석이란?</Text>
            <Text style={styles.guideText}>
              한글 이름의 자음과 모음에는 각각 오행(목화토금수)이 배속되어 있습니다.
              {'\n\n'}
              이름의 오행 분포와 획수를 분석하여 사주와의 조화를 살펴봅니다.
              {'\n\n'}
              좋은 이름은 사주에서 부족한 오행을 보완하고, 획수의 운이 좋으며, 오행이 균형 잡힌 이름입니다.
            </Text>
          </View>
        )}

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
  scrollView: {
    flex: 1,
  },
  inputSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  inputLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  analyzeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
  },
  analyzeButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  analyzeButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  inputHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  section: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  charactersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  characterCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    minWidth: 70,
  },
  characterText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  characterElements: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: SPACING.xs,
  },
  elementBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  elementBadgeText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '600',
  },
  characterStrokes: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  elementBars: {
    gap: SPACING.sm,
  },
  elementBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  elementEmoji: {
    fontSize: 16,
  },
  elementLabel: {
    width: 24,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  elementBarBg: {
    flex: 1,
    height: 12,
    backgroundColor: COLORS.background,
    borderRadius: 6,
    overflow: 'hidden',
  },
  elementBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  elementCount: {
    width: 20,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  balanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  balanceIcon: {
    fontSize: 20,
  },
  balanceText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  strokeCard: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  strokeNumber: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  fortuneBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  fortuneText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  strokeMeaning: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  compatibilityCard: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  compatibilityScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
  },
  scoreUnit: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
  compatibilityText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  suggestionBullet: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
  },
  suggestionText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: SPACING.sm,
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryName: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryItemLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    opacity: 0.7,
  },
  summaryItemValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  guideSection: {
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  guideEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  guideTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  guideText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomPadding: {
    height: 40,
  },
});
