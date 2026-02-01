/**
 * 위젯 미리보기 화면
 * - 다양한 크기의 운세 위젯 미리보기
 * - 공유 기능
 * - 위젯 스타일 선택
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { SajuCalculator, getTodayGanji, getTodayRelation } from '../services/SajuCalculator';
import DailyFortuneWidget from '../components/widgets/DailyFortuneWidget';

// 오행별 한글 이름
const ELEMENT_NAMES: Record<string, string> = {
  wood: '목(木)',
  fire: '화(火)',
  earth: '토(土)',
  metal: '금(金)',
  water: '수(水)',
};

// 방향 매핑
const DIRECTION_BY_ELEMENT: Record<string, string> = {
  wood: '동쪽',
  fire: '남쪽',
  earth: '중앙',
  metal: '서쪽',
  water: '북쪽',
};

// 색상 매핑
const COLOR_BY_ELEMENT: Record<string, string> = {
  wood: '초록색',
  fire: '빨간색',
  earth: '노란색',
  metal: '흰색',
  water: '검정색',
};

export default function WidgetPreviewScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useApp();
  const { isDark, colors } = useTheme();
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('large');

  // 오늘 날짜
  const today = new Date();
  const dateString = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const fullDateString = `${dateString} (${weekdays[today.getDay()]})`;

  // 오늘의 간지
  const todayGanji = getTodayGanji();

  // 사주 계산
  const sajuResult = useMemo(() => {
    if (!profile?.birthDate) return null;
    const calculator = new SajuCalculator(profile.birthDate, profile.birthTime);
    return calculator.calculate();
  }, [profile]);

  // 운세 점수 계산 (간단한 버전)
  const fortuneScore = useMemo(() => {
    if (!sajuResult) return 50;

    // 일간과 오늘 일진의 관계로 점수 계산
    const relation = getTodayRelation(sajuResult.dayMaster, todayGanji.stem);

    const relationScores: Record<string, number> = {
      '비견': 70,
      '겁재': 60,
      '식신': 80,
      '상관': 65,
      '편재': 75,
      '정재': 85,
      '편관': 55,
      '정관': 75,
      '편인': 70,
      '정인': 80,
    };

    const baseScore = relationScores[relation] || 65;
    // 약간의 변동 추가 (날짜 기반)
    const dateVariation = (today.getDate() % 10) - 5;
    return Math.min(100, Math.max(30, baseScore + dateVariation));
  }, [sajuResult, todayGanji]);

  // 행운의 오행 결정
  const luckyElement = useMemo(() => {
    if (!sajuResult) return 'wood';
    // 일간의 오행이 부족한 것을 보완
    const elements = sajuResult.elements;
    const minElement = Object.entries(elements).reduce((min, [key, val]) =>
      (val < elements[min as keyof typeof elements]) ? key : min
    , 'wood');
    return minElement;
  }, [sajuResult]);

  // 위젯 데이터
  const widgetData = {
    date: fullDateString,
    dayGanji: `${todayGanji.stem}${todayGanji.branch}`,
    luckyScore: fortuneScore,
    luckyElement: ELEMENT_NAMES[luckyElement] || '목(木)',
    luckyColor: COLOR_BY_ELEMENT[luckyElement] || '초록색',
    luckyDirection: DIRECTION_BY_ELEMENT[luckyElement] || '동쪽',
    mainMessage: getMainMessage(fortuneScore),
    advice: getAdvice(fortuneScore, luckyElement),
  };

  // 전체 공유
  const handleShareAll = async () => {
    try {
      const shareMessage = `🔮 ${widgetData.date} 오늘의 운세

👤 ${profile?.name || '사용자'}님의 운세

일진: ${widgetData.dayGanji}
운세 점수: ${widgetData.luckyScore}점

💬 ${widgetData.mainMessage}

💡 ${widgetData.advice}

🎨 행운의 색: ${widgetData.luckyColor}
🧭 행운의 방향: ${widgetData.luckyDirection}
✨ 행운의 오행: ${widgetData.luckyElement}

━━━━━━━━━━━━━━
📱 사주투데이 앱에서 더 자세한 운세를 확인하세요!`;

      await Share.share({
        message: shareMessage,
        title: '오늘의 운세',
      });
    } catch (error) {
      Alert.alert('공유 실패', '운세 공유에 실패했습니다.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.background : '#FDFBF7' }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backText, { color: isDark ? colors.text : '#1C1917' }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? colors.text : '#1C1917' }]}>
            운세 위젯
          </Text>
          <TouchableOpacity onPress={handleShareAll} style={styles.shareHeaderButton}>
            <Text style={styles.shareHeaderIcon}>📤</Text>
          </TouchableOpacity>
        </View>

        {/* 안내 */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? colors.card : '#EFF6FF' }]}>
          <Text style={[styles.infoText, { color: isDark ? colors.text : '#1E40AF' }]}>
            📱 오늘의 운세를 위젯 형태로 확인하고 공유해보세요!
          </Text>
        </View>

        {/* 크기 선택 */}
        <View style={styles.sizeSelector}>
          {(['small', 'medium', 'large'] as const).map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.sizeButton,
                {
                  backgroundColor: selectedSize === size
                    ? (isDark ? colors.primary : '#8B5CF6')
                    : (isDark ? colors.card : '#F3F4F6'),
                }
              ]}
              onPress={() => setSelectedSize(size)}
            >
              <Text
                style={[
                  styles.sizeButtonText,
                  {
                    color: selectedSize === size
                      ? '#FFFFFF'
                      : (isDark ? colors.textSecondary : '#6B7280'),
                  }
                ]}
              >
                {size === 'small' ? '작게' : size === 'medium' ? '중간' : '크게'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 위젯 미리보기 */}
        <View style={styles.previewContainer}>
          <Text style={[styles.previewLabel, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
            미리보기
          </Text>
          <View style={styles.widgetWrapper}>
            <DailyFortuneWidget
              data={widgetData}
              size={selectedSize}
              onPress={() => navigation.navigate('FortuneDetail')}
            />
          </View>
        </View>

        {/* 모든 크기 보기 */}
        <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#1C1917' }]}>
            📐 모든 크기 보기
          </Text>

          {/* 작은 위젯들 */}
          <Text style={[styles.sizeLabel, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
            작은 위젯 (홈 화면 1x1)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.smallWidgetRow}>
            <DailyFortuneWidget data={widgetData} size="small" />
            <View style={{ width: 12 }} />
            <DailyFortuneWidget
              data={{ ...widgetData, luckyScore: 85 }}
              size="small"
            />
            <View style={{ width: 12 }} />
            <DailyFortuneWidget
              data={{ ...widgetData, luckyScore: 45 }}
              size="small"
            />
          </ScrollView>

          {/* 중간 위젯 */}
          <Text style={[styles.sizeLabel, { color: isDark ? colors.textSecondary : '#6B7280', marginTop: 20 }]}>
            중간 위젯 (홈 화면 2x1)
          </Text>
          <DailyFortuneWidget data={widgetData} size="medium" />

          {/* 큰 위젯 */}
          <Text style={[styles.sizeLabel, { color: isDark ? colors.textSecondary : '#6B7280', marginTop: 20 }]}>
            큰 위젯 (공유용)
          </Text>
          <DailyFortuneWidget data={widgetData} size="large" />
        </View>

        {/* 안내 메시지 */}
        <View style={[styles.noteCard, { backgroundColor: isDark ? '#7F1D1D20' : '#FEF2F2' }]}>
          <Text style={styles.noteEmoji}>📝</Text>
          <Text style={[styles.noteText, { color: isDark ? '#FCA5A5' : '#991B1B' }]}>
            현재 Expo 앱에서는 실제 홈 화면 위젯은 지원되지 않습니다.{'\n'}
            공유 버튼을 눌러 친구들에게 운세를 공유해보세요!
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// 점수에 따른 메인 메시지
function getMainMessage(score: number): string {
  if (score >= 85) return '오늘은 최고의 하루가 될 것 같아요! 적극적으로 도전하세요.';
  if (score >= 70) return '좋은 기운이 함께합니다. 하고 싶은 일을 시작하기 좋은 날이에요.';
  if (score >= 55) return '무난한 하루입니다. 평소처럼 안정적으로 보내세요.';
  if (score >= 40) return '조금 조심해야 할 날이에요. 큰 결정은 미루는 것이 좋습니다.';
  return '오늘은 내면을 돌보는 시간을 가져보세요. 무리하지 마세요.';
}

// 점수와 오행에 따른 조언
function getAdvice(score: number, element: string): string {
  const adviceByElement: Record<string, string> = {
    wood: '초록색 옷이나 소품을 활용하면 도움이 됩니다.',
    fire: '열정을 가지고 적극적으로 행동하세요.',
    earth: '중심을 잡고 안정적으로 하루를 보내세요.',
    metal: '정리정돈과 계획 수립에 집중하세요.',
    water: '유연하게 대처하고 지혜롭게 행동하세요.',
  };

  return adviceByElement[element] || '긍정적인 마음으로 하루를 시작하세요.';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  shareHeaderButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareHeaderIcon: {
    fontSize: 20,
  },
  infoCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
  },
  sizeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sizeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 6,
  },
  sizeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 13,
    marginBottom: 10,
  },
  widgetWrapper: {
    alignItems: 'center',
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  sizeLabel: {
    fontSize: 13,
    marginBottom: 10,
  },
  smallWidgetRow: {
    flexDirection: 'row',
  },
  noteCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteEmoji: {
    fontSize: 16,
    marginRight: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
