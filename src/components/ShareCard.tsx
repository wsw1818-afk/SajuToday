/**
 * 운세 공유 카드 (Phase 2-1)
 * 9:16 인스타 스토리 사이즈, 점수+한줄+이모지
 * 생년월일 미표시 (비판자 우려 반영)
 */

import React, { forwardRef } from 'react';
import { COLORS } from '../utils/theme';
import { View, Text, StyleSheet } from 'react-native';

interface ShareCardProps {
  name: string;
  dateStr: string;        // "4월 17일 목요일"
  score: number;
  grade: string;          // "대길/길/보통/주의/흉"
  stageName: string;      // "안정의 기운의 날"
  summary: string;        // 한 줄 요약
  topCategoryEmoji: string; // 강조 카테고리 이모지
  topCategoryText: string;  // 강조 카테고리 한 줄
}

export const ShareCard = forwardRef<View, ShareCardProps>(
  ({ name, dateStr, score, grade, stageName, summary, topCategoryEmoji, topCategoryText }, ref) => {
    const bgColor = getBgColor(score);
    return (
      <View ref={ref} style={[styles.card, { backgroundColor: bgColor }]} collapsable={false}>
        <View style={styles.topRow}>
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>

        <View style={styles.center}>
          <Text style={styles.nameText}>{name}님의 운세</Text>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{score}</Text>
            <Text style={styles.scoreUnit}>점</Text>
          </View>
          <Text style={styles.gradeText}>{grade}</Text>
          <Text style={styles.stageText}>{stageName}</Text>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>"{summary}"</Text>
        </View>

        <View style={styles.categoryBox}>
          <Text style={styles.categoryEmoji}>{topCategoryEmoji}</Text>
          <Text style={styles.categoryText} numberOfLines={3}>
            {topCategoryText}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>from 사주투데이 ☯</Text>
        </View>
      </View>
    );
  }
);

ShareCard.displayName = 'ShareCard';

function getBgColor(score: number): string {
  if (score >= 80) return COLORS.scoreExcellent;
  if (score >= 60) return '#FFB74D';
  if (score >= 45) return '#FFD54F';
  if (score >= 30) return '#FF8A65';
  return '#9E9E9E';
}

const CARD_WIDTH = 360;
const CARD_HEIGHT = 640;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    padding: 32,
    justifyContent: 'space-between',
  },
  topRow: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  center: {
    alignItems: 'center',
    marginTop: 20,
  },
  nameText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 12,
  },
  scoreCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scoreNumber: {
    fontSize: 80,
    fontWeight: '900',
    color: '#333',
    lineHeight: 88,
  },
  scoreUnit: {
    fontSize: 18,
    color: '#666',
    marginTop: -8,
  },
  gradeText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFF',
    marginTop: 8,
  },
  stageText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    marginTop: 4,
    fontStyle: 'italic',
  },
  summaryBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  summaryText: {
    fontSize: 14,
    color: '#FFF',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  categoryBox: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 28,
    marginRight: 10,
  },
  categoryText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
});
