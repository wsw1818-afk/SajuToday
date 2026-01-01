import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Sun, Moon, Star, Sparkles, Book, Heart, Rabbit, Gift, Compass } from 'lucide-react-native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';

// 현재 연도 정보 계산
const HEAVENLY_STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const EARTHLY_BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
const BRANCH_ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

const currentYear = new Date().getFullYear();
const stemIndex = (currentYear - 4) % 10;
const branchIndex = (currentYear - 4) % 12;
const yearGanji = `${HEAVENLY_STEMS[stemIndex]}${EARTHLY_BRANCHES[branchIndex]}`;
const yearAnimal = BRANCH_ANIMALS[branchIndex];

// 운세 종류 정의
const FORTUNE_TYPES = [
  {
    id: 'daily',
    title: '오늘의 운세',
    subtitle: '사주팔자 기반 일일 운세',
    description: '천간/지지 분석으로 오늘의 길흉을 알아봅니다',
    icon: Sun,
    color: '#F59E0B',
    available: true,
    source: '명리학 일진론',
  },
  {
    id: 'yearly',
    title: '신년운세',
    subtitle: `${currentYear}년 ${yearGanji}년 운세`,
    description: `${yearAnimal}띠 해, 전체 운의 흐름과 월별 운세`,
    icon: Sparkles,
    color: '#8B5CF6',
    available: true,
    source: '명리학 대운/세운론',
  },
  {
    id: 'animal',
    title: '띠 운세',
    subtitle: '12지 동물띠 운세',
    description: '태어난 해의 동물띠로 보는 운세',
    icon: Rabbit,
    color: '#10B981',
    available: true,
    source: '12지신 운세론',
  },
  {
    id: 'tojeong',
    title: '토정비결',
    subtitle: '조선 전통 운세서',
    description: '토정 이지함 선생의 전통 운세 해석',
    icon: Book,
    color: '#6B7280',
    available: true,
    source: '토정비결 원문',
  },
  {
    id: 'zodiac',
    title: '별자리 운세',
    subtitle: '12별자리 운세',
    description: '탄생 별자리로 보는 오늘의 운세',
    icon: Star,
    color: '#3B82F6',
    available: true,
    source: '서양 점성술',
  },
  {
    id: 'luckyInfo',
    title: '오늘의 길운',
    subtitle: '맞춤 행운 정보',
    description: '오늘의 행운 색상, 숫자, 방향, 시간대',
    icon: Gift,
    color: '#F97316',
    available: true,
    source: '명리학 용신론',
  },
  {
    id: 'compatibility',
    title: '전통 궁합',
    subtitle: '사주 궁합 분석',
    description: '두 사람의 사주로 보는 궁합',
    icon: Heart,
    color: '#EC4899',
    available: true,
    route: 'CompatibilityInput',
    source: '명리학 궁합론',
  },
  {
    id: 'dream',
    title: '꿈풀이',
    subtitle: '꿈 해몽 사전',
    description: '꿈에서 본 것의 의미를 알아봅니다',
    icon: Moon,
    color: '#6366F1',
    available: true,
    source: '전통 해몽서/주공해몽',
  },
  {
    id: 'fiveSpirits',
    title: '5신 분석',
    subtitle: '용신/희신/기신/구신/한신',
    description: '나에게 필요한 오행과 피해야 할 오행 분석',
    icon: Compass,
    color: '#9333EA',
    available: true,
    source: '적천수, 자평진전',
  },
];

export default function FortuneMenuScreen() {
  const navigation = useNavigation<any>();

  const handleFortuneSelect = (fortune: typeof FORTUNE_TYPES[0]) => {
    if (!fortune.available) return;

    if (fortune.route) {
      navigation.navigate(fortune.route);
    } else {
      navigation.navigate('FortuneType', { type: fortune.id });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={COLORS.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>운세 종류</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 안내 문구 */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>🔮 다양한 운세를 확인하세요</Text>
          <Text style={styles.infoText}>
            전통 명리학, 동양 점술, 서양 점성술의
            지혜로 당신의 운명을 풀어드립니다.
          </Text>
        </View>

        {/* 운세 카드 목록 */}
        {FORTUNE_TYPES.map((fortune) => (
          <TouchableOpacity
            key={fortune.id}
            style={[
              styles.fortuneCard,
              !fortune.available && styles.fortuneCardDisabled,
            ]}
            onPress={() => handleFortuneSelect(fortune)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${fortune.color}15` }]}>
              <fortune.icon size={28} color={fortune.color} />
            </View>
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{fortune.title}</Text>
                {!fortune.available && (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>준비중</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardSubtitle}>{fortune.subtitle}</Text>
              <Text style={styles.cardDescription}>{fortune.description}</Text>
              <Text style={styles.cardSource}>출처: {fortune.source}</Text>
            </View>
          </TouchableOpacity>
        ))}

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
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
  placeholder: {
    width: 32,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 20,
  },
  infoBox: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  infoTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  fortuneCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  fortuneCardDisabled: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  comingSoonBadge: {
    backgroundColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  comingSoonText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  cardDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    lineHeight: 18,
  },
  cardSource: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
});
