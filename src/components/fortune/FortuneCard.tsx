import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Fortune, FortuneScores } from '../../types';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../utils/theme';
import Card from '../common/Card';

interface FortuneCardProps {
  fortune: Fortune;
}

interface ScoreBarProps {
  label: string;
  score: number;
  color: string;
}

function ScoreBar({ label, score, color }: ScoreBarProps) {
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.scoreBarContainer}>
        <View style={[styles.scoreBar, { width: `${score}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.scoreValue, { color }]}>{score}</Text>
    </View>
  );
}

export function FortuneCard({ fortune }: FortuneCardProps) {
  const scoreConfig = [
    { key: 'overall' as keyof FortuneScores, label: '전체운', color: COLORS.primary },
    { key: 'money' as keyof FortuneScores, label: '재물운', color: COLORS.secondary },
    { key: 'work' as keyof FortuneScores, label: '일/학업', color: COLORS.info },
    { key: 'love' as keyof FortuneScores, label: '연애/대인', color: '#E91E63' },
    { key: 'health' as keyof FortuneScores, label: '건강운', color: COLORS.success },
  ];

  return (
    <View style={styles.container}>
      {/* 총운 카드 */}
      <Card style={styles.summaryCard}>
        <Text style={styles.summary}>{fortune.summary}</Text>
        <View style={styles.keywordsContainer}>
          {fortune.keywords.map((keyword, index) => (
            <View key={index} style={styles.keywordBadge}>
              <Text style={styles.keywordText}>#{keyword}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* 점수 */}
      <Card title="오늘의 운세 지수" style={styles.scoresCard}>
        {scoreConfig.map(item => (
          <ScoreBar
            key={item.key}
            label={item.label}
            score={fortune.scores[item.key]}
            color={item.color}
          />
        ))}
      </Card>

      {/* 추천/피하기 */}
      <View style={styles.dosDontsContainer}>
        <Card style={styles.doCard}>
          <Text style={styles.doTitle}>오늘의 추천</Text>
          <Text style={styles.doText}>{fortune.do}</Text>
        </Card>
        <Card style={styles.dontCard}>
          <Text style={styles.dontTitle}>피하면 좋은 것</Text>
          <Text style={styles.dontText}>{fortune.dont}</Text>
        </Card>
      </View>

      {/* 면책 문구 */}
      <Text style={styles.disclaimer}>{fortune.disclaimer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  summaryCard: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  summary: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  keywordBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  keywordText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  scoresCard: {
    marginTop: SPACING.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  scoreLabel: {
    width: 65,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  scoreBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    marginHorizontal: SPACING.sm,
  },
  scoreBar: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  scoreValue: {
    width: 30,
    textAlign: 'right',
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  dosDontsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfCard: {
    flex: 1,
  },
  doCard: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
  },
  dontCard: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
  },
  doTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: SPACING.xs,
  },
  dontTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  doText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  dontText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  disclaimer: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});

export default FortuneCard;
