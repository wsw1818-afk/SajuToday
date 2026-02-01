/**
 * 일일 운세 위젯 컴포넌트
 * - 홈 화면에서 사용되는 요약 위젯
 * - 공유 가능한 이미지 형태
 * - 다양한 크기 지원
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

interface WidgetData {
  date: string;
  dayGanji: string;
  luckyScore: number;
  luckyElement: string;
  luckyColor: string;
  luckyDirection: string;
  mainMessage: string;
  advice: string;
}

interface DailyFortuneWidgetProps {
  data: WidgetData;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
}

export default function DailyFortuneWidget({
  data,
  size = 'medium',
  onPress
}: DailyFortuneWidgetProps) {
  const { isDark, colors } = useTheme();

  // 점수에 따른 색상
  const getScoreColor = (score: number): [string, string] => {
    if (score >= 80) return ['#22C55E', '#16A34A'];
    if (score >= 60) return ['#3B82F6', '#2563EB'];
    if (score >= 40) return ['#F59E0B', '#D97706'];
    return ['#EF4444', '#DC2626'];
  };

  const scoreColors: [string, string] = getScoreColor(data.luckyScore);

  // 공유 기능
  const handleShare = async () => {
    try {
      const shareMessage = `🔮 ${data.date} 오늘의 운세

일진: ${data.dayGanji}
운세 점수: ${data.luckyScore}점

💬 ${data.mainMessage}

💡 ${data.advice}

행운의 색: ${data.luckyColor}
행운의 방향: ${data.luckyDirection}

- 사주투데이 앱에서 더 자세한 운세를 확인하세요!`;

      await Share.share({
        message: shareMessage,
        title: '오늘의 운세',
      });
    } catch (error) {
      Alert.alert('공유 실패', '운세 공유에 실패했습니다.');
    }
  };

  // 작은 위젯
  if (size === 'small') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={isDark ? ['#374151', '#1F2937'] : ['#FFFFFF', '#F9FAFB']}
          style={styles.smallWidget}
        >
          <Text style={[styles.smallDate, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
            {data.date}
          </Text>
          <View style={styles.smallScoreContainer}>
            <LinearGradient
              colors={scoreColors}
              style={styles.smallScoreBadge}
            >
              <Text style={styles.smallScore}>{data.luckyScore}</Text>
            </LinearGradient>
          </View>
          <Text style={[styles.smallGanji, { color: isDark ? colors.text : '#1F2937' }]}>
            {data.dayGanji}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // 중간 위젯
  if (size === 'medium') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={isDark ? ['#374151', '#1F2937'] : ['#FFFFFF', '#F9FAFB']}
          style={styles.mediumWidget}
        >
          <View style={styles.mediumHeader}>
            <View>
              <Text style={[styles.mediumDate, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                {data.date}
              </Text>
              <Text style={[styles.mediumGanji, { color: isDark ? colors.text : '#1F2937' }]}>
                {data.dayGanji}
              </Text>
            </View>
            <LinearGradient
              colors={scoreColors}
              style={styles.mediumScoreBadge}
            >
              <Text style={styles.mediumScoreLabel}>운세</Text>
              <Text style={styles.mediumScore}>{data.luckyScore}</Text>
            </LinearGradient>
          </View>

          <Text
            style={[styles.mediumMessage, { color: isDark ? colors.text : '#374151' }]}
            numberOfLines={2}
          >
            {data.mainMessage}
          </Text>

          <View style={styles.mediumLucky}>
            <View style={styles.luckyItem}>
              <Text style={styles.luckyIcon}>🎨</Text>
              <Text style={[styles.luckyText, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                {data.luckyColor}
              </Text>
            </View>
            <View style={styles.luckyItem}>
              <Text style={styles.luckyIcon}>🧭</Text>
              <Text style={[styles.luckyText, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                {data.luckyDirection}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // 큰 위젯
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={isDark ? ['#374151', '#1F2937'] : ['#FFFFFF', '#F9FAFB']}
        style={styles.largeWidget}
      >
        <View style={styles.largeHeader}>
          <View>
            <Text style={[styles.largeDate, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
              {data.date}
            </Text>
            <Text style={[styles.largeGanji, { color: isDark ? colors.text : '#1F2937' }]}>
              오늘의 일진: {data.dayGanji}
            </Text>
          </View>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Text style={styles.shareIcon}>📤</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.largeScoreSection}>
          <LinearGradient
            colors={scoreColors}
            style={styles.largeScoreBadge}
          >
            <Text style={styles.largeScoreLabel}>오늘 운세</Text>
            <Text style={styles.largeScore}>{data.luckyScore}</Text>
            <Text style={styles.largeScoreUnit}>점</Text>
          </LinearGradient>
          <View style={styles.scoreBar}>
            <View
              style={[
                styles.scoreBarFill,
                {
                  width: `${data.luckyScore}%`,
                  backgroundColor: scoreColors[0],
                }
              ]}
            />
          </View>
        </View>

        <View style={[styles.messageBox, { backgroundColor: isDark ? '#1F293720' : '#F3F4F6' }]}>
          <Text style={styles.messageIcon}>💬</Text>
          <Text style={[styles.largeMessage, { color: isDark ? colors.text : '#374151' }]}>
            {data.mainMessage}
          </Text>
        </View>

        <View style={[styles.adviceBox, { backgroundColor: isDark ? '#3B82F620' : '#EFF6FF' }]}>
          <Text style={styles.adviceIcon}>💡</Text>
          <Text style={[styles.largeAdvice, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>
            {data.advice}
          </Text>
        </View>

        <View style={styles.largeLucky}>
          <View style={[styles.luckyBox, { backgroundColor: isDark ? '#1F293720' : '#F9FAFB' }]}>
            <Text style={styles.luckyBoxIcon}>🎨</Text>
            <Text style={[styles.luckyBoxLabel, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
              행운의 색
            </Text>
            <Text style={[styles.luckyBoxValue, { color: isDark ? colors.text : '#1F2937' }]}>
              {data.luckyColor}
            </Text>
          </View>
          <View style={[styles.luckyBox, { backgroundColor: isDark ? '#1F293720' : '#F9FAFB' }]}>
            <Text style={styles.luckyBoxIcon}>🧭</Text>
            <Text style={[styles.luckyBoxLabel, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
              행운의 방향
            </Text>
            <Text style={[styles.luckyBoxValue, { color: isDark ? colors.text : '#1F2937' }]}>
              {data.luckyDirection}
            </Text>
          </View>
          <View style={[styles.luckyBox, { backgroundColor: isDark ? '#1F293720' : '#F9FAFB' }]}>
            <Text style={styles.luckyBoxIcon}>✨</Text>
            <Text style={[styles.luckyBoxLabel, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
              행운의 오행
            </Text>
            <Text style={[styles.luckyBoxValue, { color: isDark ? colors.text : '#1F2937' }]}>
              {data.luckyElement}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Small Widget
  smallWidget: {
    width: 100,
    height: 100,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  smallDate: {
    fontSize: 10,
    marginBottom: 4,
  },
  smallScoreContainer: {
    marginVertical: 6,
  },
  smallScoreBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallScore: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  smallGanji: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Medium Widget
  mediumWidget: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mediumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mediumDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  mediumGanji: {
    fontSize: 18,
    fontWeight: '700',
  },
  mediumScoreBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  mediumScoreLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  mediumScore: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mediumMessage: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  mediumLucky: {
    flexDirection: 'row',
  },
  luckyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  luckyIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  luckyText: {
    fontSize: 12,
  },

  // Large Widget
  largeWidget: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  largeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  largeDate: {
    fontSize: 13,
    marginBottom: 2,
  },
  largeGanji: {
    fontSize: 18,
    fontWeight: '700',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: {
    fontSize: 18,
  },
  largeScoreSection: {
    marginBottom: 16,
  },
  largeScoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 10,
  },
  largeScoreLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginRight: 8,
  },
  largeScore: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  largeScoreUnit: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 2,
  },
  scoreBar: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  messageBox: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  messageIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  largeMessage: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
  },
  adviceBox: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  adviceIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  largeAdvice: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  largeLucky: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  luckyBox: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
  },
  luckyBoxIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  luckyBoxLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  luckyBoxValue: {
    fontSize: 13,
    fontWeight: '600',
  },
});
