/**
 * 공유용 운세 카드 컴포넌트
 * SNS에 공유할 수 있는 예쁜 카드 디자인
 */

import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FortuneCardData, getScoreEmoji, getScoreGrade } from '../services/FortuneCardService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width - 40, 360);
const CARD_HEIGHT = CARD_WIDTH * 1.4;

interface FortuneCardProps {
  data: FortuneCardData;
  isDark?: boolean;
}

const FortuneCard = forwardRef<View, FortuneCardProps>(({ data, isDark = false }, ref) => {
  const emoji = getScoreEmoji(data.overallScore);
  const grade = getScoreGrade(data.overallScore);

  // 점수에 따른 그라데이션 색상
  const getGradientColors = (): [string, string, string] => {
    if (data.overallScore >= 90) return ['#667eea', '#764ba2', '#f093fb'];
    if (data.overallScore >= 80) return ['#11998e', '#38ef7d', '#00d4ff'];
    if (data.overallScore >= 70) return ['#ffecd2', '#fcb69f', '#ff9a9e'];
    if (data.overallScore >= 60) return ['#a8edea', '#fed6e3', '#ffecd2'];
    return ['#bdc3c7', '#2c3e50', '#4a5568'];
  };

  // 점수에 따른 별 렌더링
  const renderStars = () => {
    const starCount = Math.round(data.overallScore / 20);
    return '⭐'.repeat(starCount) + '☆'.repeat(5 - starCount);
  };

  return (
    <View ref={ref} style={styles.cardWrapper}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* 상단: 앱 로고 */}
        <View style={styles.header}>
          <Text style={styles.appName}>🔮 사주투데이</Text>
          <Text style={styles.dateText}>{data.date}</Text>
        </View>

        {/* 일주 정보 */}
        <View style={styles.dayPillarSection}>
          <Text style={styles.dayPillarLabel}>나의 일주</Text>
          <Text style={styles.dayPillar}>{data.dayPillar}</Text>
        </View>

        {/* 점수 섹션 */}
        <View style={styles.scoreSection}>
          <Text style={styles.scoreEmoji}>{emoji}</Text>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{data.overallScore}</Text>
            <Text style={styles.scoreUnit}>점</Text>
          </View>
          <Text style={styles.scoreStars}>{renderStars()}</Text>
          <View style={styles.gradeBadge}>
            <Text style={styles.gradeText}>{grade}</Text>
          </View>
        </View>

        {/* 한마디 */}
        <View style={styles.commentSection}>
          <Text style={styles.commentText}>{data.scoreComment}</Text>
        </View>

        {/* 조언 */}
        <View style={styles.adviceSection}>
          <Text style={styles.adviceLabel}>💡 오늘의 조언</Text>
          <Text style={styles.adviceText}>{data.oneLineAdvice}</Text>
        </View>

        {/* 키워드 */}
        <View style={styles.keywordsSection}>
          {data.keywords.slice(0, 4).map((keyword, index) => (
            <View key={index} style={styles.keywordBadge}>
              <Text style={styles.keywordText}>#{keyword}</Text>
            </View>
          ))}
        </View>

        {/* 행운 정보 */}
        <View style={styles.luckySection}>
          <View style={styles.luckyItem}>
            <Text style={styles.luckyLabel}>🎨 행운색</Text>
            <Text style={styles.luckyValue}>{data.luckyColor}</Text>
          </View>
          <View style={styles.luckyDivider} />
          <View style={styles.luckyItem}>
            <Text style={styles.luckyLabel}>🔢 행운숫자</Text>
            <Text style={styles.luckyValue}>{data.luckyNumber}</Text>
          </View>
        </View>

        {/* 하단: 워터마크 */}
        <View style={styles.footer}>
          <Text style={styles.watermark}>사주투데이에서 나의 운세 확인하기 ✨</Text>
        </View>
      </LinearGradient>
    </View>
  );
});

FortuneCard.displayName = 'FortuneCard';

const styles = StyleSheet.create({
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  dateText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  dayPillarSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  dayPillarLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  dayPillar: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  scoreSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  scoreEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreUnit: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: -4,
  },
  scoreStars: {
    fontSize: 18,
    marginTop: 8,
    letterSpacing: 2,
  },
  gradeBadge: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  commentSection: {
    alignItems: 'center',
    marginVertical: 8,
  },
  commentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  adviceSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  adviceLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  adviceText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  keywordsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 8,
  },
  keywordBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  keywordText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  luckySection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  luckyItem: {
    alignItems: 'center',
    flex: 1,
  },
  luckyLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  luckyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  luckyDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
  },
  watermark: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default FortuneCard;
