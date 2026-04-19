import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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

// 카테고리별 운세 정의 - 쉬운 용어로 변경
const FORTUNE_CATEGORIES = [
  {
    id: 'recommend',
    title: '🌟 처음이라면 이것부터!',
    description: '가장 인기 있는 운세예요',
    color: COLORS.warning,
    items: [
      {
        id: 'yearly',
        title: '올해 운세',
        subtitle: `${currentYear}년 나의 한 해 운세`,
        description: '올해 전체 운의 흐름을 알려드려요',
        emoji: '✨',
        color: COLORS.primary,
        help: '1년 동안의 전반적인 운세를 미리 알 수 있어요',
      },
      {
        id: 'compatibility',
        title: '궁합 보기',
        subtitle: '나와 상대방의 궁합은?',
        description: '두 사람이 얼마나 잘 맞는지 확인해요',
        emoji: '💕',
        color: COLORS.fire,
        route: 'CompatibilityInput',
        help: '연인, 친구, 가족과의 궁합 점수를 알 수 있어요',
      },
      {
        id: 'luckyItems',
        title: '오늘의 행운',
        subtitle: '행운을 부르는 색상, 숫자, 방향',
        description: '오늘 나에게 행운을 가져다 줄 정보',
        emoji: '🍀',
        color: COLORS.success,
        route: 'LuckyItems',
        help: '오늘 입을 옷 색깔, 가면 좋은 방향 등을 알려줘요',
      },
    ],
  },
  {
    id: 'basic',
    title: '📅 기본 운세',
    description: '매일매일 확인하는 운세',
    color: COLORS.info,
    items: [
      {
        id: 'fortuneCalendar',
        title: '운세 달력',
        subtitle: '한 달 운세를 한눈에',
        description: '달력에서 좋은 날, 조심할 날을 확인해요',
        emoji: '📅',
        color: '#059669',
        route: 'FortuneCalendar',
        help: '중요한 약속을 잡을 때 좋은 날을 찾아보세요',
      },
      {
        id: 'animal',
        title: '띠 운세',
        subtitle: '나의 띠로 보는 운세',
        description: '쥐띠, 소띠 등 12가지 띠별 운세',
        emoji: '🐰',
        color: COLORS.success,
        help: '태어난 해의 동물로 보는 친근한 운세예요',
      },
      {
        id: 'zodiac',
        title: '별자리 운세',
        subtitle: '내 별자리로 보는 운세',
        description: '물병자리, 양자리 등 12별자리 운세',
        emoji: '⭐',
        color: COLORS.info,
        help: '서양 점성술 기반의 별자리 운세예요',
      },
      {
        id: 'tojeong',
        title: '토정비결',
        subtitle: '조선시대 전통 운세',
        description: '500년 전해온 한국 전통 운세',
        emoji: '📜',
        color: '#6B7280',
        help: '토정 이지함 선생님이 만든 전통 점술서예요',
      },
    ],
  },
  {
    id: 'life',
    title: '🔮 인생 분석',
    description: '나의 타고난 운명을 알아봐요',
    color: COLORS.primary,
    items: [
      {
        id: 'daeun',
        title: '10년 대운',
        subtitle: '인생의 큰 흐름 보기',
        description: '10년 단위로 인생의 운이 어떻게 바뀌는지',
        emoji: '📊',
        color: '#0EA5E9',
        route: 'Daeun',
        help: '지금 내가 어떤 시기를 지나고 있는지 알 수 있어요',
      },
      {
        id: 'fiveSpirits',
        title: '나에게 좋은 것',
        subtitle: '나를 돕는 오행 찾기',
        description: '나에게 도움이 되는 색상, 방향, 직업 등',
        emoji: '🧭',
        color: '#9333EA',
        help: '금, 목, 수, 화, 토 중 나와 맞는 것을 알려줘요',
      },
      {
        id: 'sinsal',
        title: '타고난 기운',
        subtitle: '내 사주의 특별한 기운',
        description: '귀인, 도화살 등 사주에 있는 특별한 기운',
        emoji: '⚡',
        color: '#DC2626',
        route: 'Sinsal',
        help: '연예인 기운, 귀인 운 등 특별한 운을 알려줘요',
      },
      {
        id: 'nameAnalysis',
        title: '이름 풀이',
        subtitle: '내 이름의 의미와 운',
        description: '이름에 담긴 오행과 운명을 분석해요',
        emoji: '✍️',
        color: COLORS.primary,
        route: 'NameAnalysis',
        help: '이름이 나의 운명에 어떤 영향을 주는지 알아봐요',
      },
    ],
  },
  {
    id: 'manage',
    title: '👥 관리 기능',
    description: '운세 기록과 가족 관리',
    color: COLORS.error,
    items: [
      {
        id: 'familyGroup',
        title: '가족·친구 관리',
        subtitle: '소중한 사람들의 사주 저장',
        description: '가족, 친구의 사주를 저장하고 궁합도 확인',
        emoji: '👨‍👩‍👧‍👦',
        color: COLORS.error,
        route: 'FamilyGroup',
        help: '한 번 등록하면 언제든 운세와 궁합을 볼 수 있어요',
      },
      {
        id: 'bookmark',
        title: '저장한 운세',
        subtitle: '북마크한 운세 모아보기',
        description: '좋았던 운세, 중요한 운세를 다시 확인',
        emoji: '⭐',
        color: COLORS.warning,
        route: 'Bookmark',
        help: '마음에 드는 운세는 저장해두세요',
      },
      {
        id: 'fortuneReport',
        title: '나의 운세 리포트',
        subtitle: '지금까지의 운세 분석',
        description: '내 사주 종합 분석과 사용 통계',
        emoji: '📈',
        color: COLORS.success,
        route: 'FortuneReport',
        help: '오행 분포, 길몽 횟수 등 통계를 볼 수 있어요',
      },
    ],
  },
];

interface FortuneItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
  color: string;
  route?: string;
  help: string;
}

export default function FortuneMenuScreen() {
  const navigation = useNavigation<any>();
  const [expandedCategory, setExpandedCategory] = useState<string | null>('recommend');
  const [showHelp, setShowHelp] = useState<string | null>(null);

  const handleFortuneSelect = (fortune: FortuneItem) => {
    if (fortune.route) {
      navigation.navigate(fortune.route);
    } else {
      navigation.navigate('FortuneType', { type: fortune.id });
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const renderFortuneCard = (item: FortuneItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.fortuneCard}
      onPress={() => handleFortuneSelect(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
        <Text style={styles.iconEmoji}>{item.emoji}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>
      </View>
      <View style={styles.cardRight}>
        <TouchableOpacity
          style={styles.helpButton}
          onPress={(e) => {
            e.stopPropagation();
            setShowHelp(showHelp === item.id ? null : item.id);
          }}
        >
          <Text style={styles.helpButtonText}>?</Text>
        </TouchableOpacity>
        <Text style={styles.cardArrow}>›</Text>
      </View>

      {/* 도움말 표시 */}
      {showHelp === item.id && (
        <View style={styles.helpBubble}>
          <Text style={styles.helpText}>💡 {item.help}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔮 운세 모음</Text>
        <Text style={styles.headerSubtitle}>원하는 운세를 선택하세요</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 카테고리별 운세 */}
        {FORTUNE_CATEGORIES.map((category) => (
          <View key={category.id} style={styles.categoryContainer}>
            <TouchableOpacity
              style={[
                styles.categoryHeader,
                expandedCategory === category.id && styles.categoryHeaderExpanded,
              ]}
              onPress={() => toggleCategory(category.id)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryTitleContainer}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
              </View>
              <Text style={[
                styles.expandIcon,
                expandedCategory === category.id && styles.expandIconRotated,
              ]}>
                ▼
              </Text>
            </TouchableOpacity>

            {expandedCategory === category.id && (
              <View style={styles.categoryContent}>
                {category.items.map(renderFortuneCard)}
              </View>
            )}
          </View>
        ))}

        {/* 하단 안내 */}
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomInfoTitle}>💡 알아두세요</Text>
          <Text style={styles.bottomInfoText}>
            • 운세는 참고용이에요. 최종 결정은 본인이 하는 거예요!{'\n'}
            • 같은 날이라도 마음가짐에 따라 운이 달라질 수 있어요{'\n'}
            • 좋은 운세는 더 좋게, 나쁜 운세는 조심하면 돼요
          </Text>
        </View>

        <View style={{ height: 30 }} />
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 20,
  },
  categoryContainer: {
    marginBottom: SPACING.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  categoryHeaderExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  categoryTitleContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  categoryDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  expandIcon: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  expandIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  categoryContent: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
    ...SHADOWS.sm,
    marginTop: -1,
  },
  fortuneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    position: 'relative',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  iconEmoji: {
    fontSize: 22,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,  // 더 큰 글자
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  cardSubtitle: {
    fontSize: FONT_SIZES.md,  // 더 큰 글자
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 3,
  },
  cardDescription: {
    fontSize: FONT_SIZES.md,  // 더 큰 글자
    color: COLORS.textSecondary,  // 더 진한 색상
    marginTop: 6,
    lineHeight: 21,  // 더 넓은 줄간격
  },
  cardRight: {
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  helpButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  helpButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  cardArrow: {
    fontSize: 20,
    color: COLORS.textLight,
  },
  helpBubble: {
    position: 'absolute',
    top: '100%',
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.text,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginTop: 4,
    zIndex: 100,
  },
  helpText: {
    fontSize: FONT_SIZES.md,  // 더 큰 글자
    color: 'white',
    lineHeight: 21,  // 더 넓은 줄간격
  },
  bottomInfo: {
    backgroundColor: '#FEF3C7',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,  // 더 넓은 패딩
    marginTop: SPACING.md,
  },
  bottomInfoTitle: {
    fontSize: FONT_SIZES.lg,  // 더 큰 글자
    fontWeight: '700',
    color: '#78350F',  // 더 진한 색상 (대비 개선)
    marginBottom: SPACING.sm,
  },
  bottomInfoText: {
    fontSize: FONT_SIZES.md,  // 더 큰 글자
    color: '#78350F',  // 더 진한 색상 (대비 개선)
    lineHeight: 24,  // 더 넓은 줄간격
  },
});
