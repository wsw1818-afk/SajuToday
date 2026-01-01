import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Search } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Sun, Moon, Star, Sparkles, Book, Rabbit, Gift, Compass } from 'lucide-react-native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { useApp } from '../contexts/AppContext';
import {
  generateYearlyFortune,
  generateTojeongFortune,
  generateImprovedTojeongFortune,
  generateZodiacFortune,
  generateDreamFortune,
  generateAnimalFortune,
  generateLuckyInfo,
  analyzeFiveSpirits,
} from '../services/FortuneTypes';

// 현재 연도 정보 계산 (FortuneMenuScreen과 동일)
const HEAVENLY_STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const EARTHLY_BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

const currentYear = new Date().getFullYear();
const stemIndex = (currentYear - 4) % 10;
const branchIndex = (currentYear - 4) % 12;
const yearGanji = `${HEAVENLY_STEMS[stemIndex]}${EARTHLY_BRANCHES[branchIndex]}`;

const FORTUNE_CONFIG: Record<string, {
  title: string;
  icon: any;
  color: string;
  source: string;
}> = {
  daily: {
    title: '오늘의 운세',
    icon: Sun,
    color: '#F59E0B',
    source: '명리학 일진론',
  },
  yearly: {
    title: `${currentYear}년 ${yearGanji}년 신년운세`,
    icon: Sparkles,
    color: '#8B5CF6',
    source: '명리학 대운/세운론',
  },
  animal: {
    title: '띠 운세',
    icon: Rabbit,
    color: '#10B981',
    source: '12지신 운세론',
  },
  tojeong: {
    title: '토정비결',
    icon: Book,
    color: '#6B7280',
    source: '토정비결 원문',
  },
  zodiac: {
    title: '별자리 운세',
    icon: Star,
    color: '#3B82F6',
    source: '서양 점성술',
  },
  luckyInfo: {
    title: '오늘의 길운',
    icon: Gift,
    color: '#F97316',
    source: '명리학 용신론',
  },
  dream: {
    title: '꿈풀이',
    icon: Moon,
    color: '#6366F1',
    source: '전통 해몽서/주공해몽',
  },
  fiveSpirits: {
    title: '5신 분석',
    icon: Compass,
    color: '#9333EA',
    source: '적천수, 자평진전',
  },
};

export default function FortuneTypeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { profile, sajuResult } = useApp();

  const fortuneType = route.params?.type || 'daily';
  const config = FORTUNE_CONFIG[fortuneType];

  // 꿈풀이 검색 상태
  const [dreamSearchQuery, setDreamSearchQuery] = useState('');

  // 오늘의 운세는 기존 FortuneDetail 화면으로 이동 (useEffect로 처리)
  useEffect(() => {
    if (fortuneType === 'daily') {
      navigation.replace('FortuneDetail');
    }
  }, [fortuneType, navigation]);

  // 운세 데이터 생성 (각 운세 타입별로 다른 구조를 가짐)
  const fortuneData = useMemo((): any => {
    if (!profile || fortuneType === 'daily') return null;

    const birthDate = profile.birthDate;
    const dayMaster = sajuResult?.dayMaster || '갑';

    switch (fortuneType) {
      case 'yearly':
        return generateYearlyFortune(birthDate, dayMaster);
      case 'animal':
        return generateAnimalFortune(birthDate, dayMaster);
      case 'tojeong':
        return generateImprovedTojeongFortune(birthDate, undefined, dayMaster);
      case 'zodiac':
        return generateZodiacFortune(birthDate, dayMaster);
      case 'luckyInfo':
        return generateLuckyInfo(birthDate, dayMaster);
      case 'dream':
        return generateDreamFortune(dayMaster);
      case 'fiveSpirits': {
        // 일간 오행 변환
        const stemToElement: Record<string, string> = {
          '갑': '목', '을': '목', '병': '화', '정': '화', '무': '토',
          '기': '토', '경': '금', '신': '금', '임': '수', '계': '수',
        };
        const dayMasterElement = stemToElement[dayMaster] || '목';

        // 사주 오행 분포 변환 (영어 → 한글)
        const elementMap: Record<string, string> = {
          'wood': '목', 'fire': '화', 'earth': '토', 'metal': '금', 'water': '수',
        };
        const koreanElements: Record<string, number> = {};
        if (sajuResult?.elements) {
          Object.entries(sajuResult.elements).forEach(([key, value]) => {
            koreanElements[elementMap[key] || key] = value as number;
          });
        } else {
          // 기본값 설정
          koreanElements['목'] = 2;
          koreanElements['화'] = 2;
          koreanElements['토'] = 2;
          koreanElements['금'] = 1;
          koreanElements['수'] = 1;
        }

        const analysis = analyzeFiveSpirits(dayMasterElement, koreanElements);

        return {
          summary: analysis.summary,
          score: 85,
          categories: [
            {
              emoji: '⭐',
              title: `용신 (用神) - ${analysis.yongsin.element}(${analysis.yongsin.hanja})`,
              content: analysis.yongsin.description,
              score: 90,
            },
            {
              emoji: '😊',
              title: `희신 (喜神) - ${analysis.heesin.element}(${analysis.heesin.hanja})`,
              content: analysis.heesin.description,
              score: 85,
            },
            {
              emoji: '⚠️',
              title: `기신 (忌神) - ${analysis.gisin.element}(${analysis.gisin.hanja})`,
              content: analysis.gisin.description,
              score: 40,
            },
            {
              emoji: '🚫',
              title: `구신 (仇神) - ${analysis.gusin.element}(${analysis.gusin.hanja})`,
              content: analysis.gusin.description,
              score: 35,
            },
            {
              emoji: '➖',
              title: `한신 (閑神) - ${analysis.hansin.element}(${analysis.hansin.hanja})`,
              content: analysis.hansin.description,
              score: 50,
            },
          ],
          luckyInfo: {
            color: analysis.yongsin.element === '목' ? '초록색' :
                   analysis.yongsin.element === '화' ? '빨간색' :
                   analysis.yongsin.element === '토' ? '노란색' :
                   analysis.yongsin.element === '금' ? '흰색' : '검은색',
            number: analysis.yongsin.element === '목' ? '3, 8' :
                    analysis.yongsin.element === '화' ? '2, 7' :
                    analysis.yongsin.element === '토' ? '5, 10' :
                    analysis.yongsin.element === '금' ? '4, 9' : '1, 6',
            direction: analysis.yongsin.element === '목' ? '동쪽' :
                       analysis.yongsin.element === '화' ? '남쪽' :
                       analysis.yongsin.element === '토' ? '중앙' :
                       analysis.yongsin.element === '금' ? '서쪽' : '북쪽',
          },
          advice: analysis.advice,
        };
      }
      default:
        return null;
    }
  }, [fortuneType, profile, sajuResult]);

  // 꿈풀이 검색 필터링
  const filteredDreamCategories = useMemo(() => {
    if (!fortuneData?.dreamCategories || !dreamSearchQuery.trim()) {
      return fortuneData?.dreamCategories;
    }

    const query = dreamSearchQuery.toLowerCase().trim();
    return fortuneData.dreamCategories
      .map((category: any) => ({
        ...category,
        items: category.items.filter((item: any) =>
          item.name.toLowerCase().includes(query) ||
          item.meaning.toLowerCase().includes(query)
        ),
      }))
      .filter((category: any) => category.items.length > 0);
  }, [fortuneData?.dreamCategories, dreamSearchQuery]);

  // 오늘의 운세인 경우 로딩 표시 (리다이렉트 중)
  if (fortuneType === 'daily') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const Icon = config?.icon || Sun;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={COLORS.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{config?.title}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 아이콘 및 제목 */}
        <View style={styles.titleSection}>
          <View style={[styles.iconContainer, { backgroundColor: `${config?.color}15` }]}>
            <Icon size={40} color={config?.color} />
          </View>
          <Text style={styles.mainTitle}>{config?.title}</Text>
          <Text style={styles.sourceBadge}>출처: {config?.source}</Text>
        </View>

        {/* 사용자 정보 */}
        {profile && (
          <View style={styles.userInfoCard}>
            <Text style={styles.userInfoTitle}>
              {profile.name || '사용자'}님의 운세
            </Text>
            <Text style={styles.userInfoDate}>
              생년월일: {profile.birthDate}
            </Text>
          </View>
        )}

        {/* 운세 내용 */}
        {fortuneData && (
          <>
            {/* 총평 */}
            {fortuneData.summary && (
              <View style={styles.summaryCard}>
                <Text style={styles.sectionTitle}>총평</Text>
                <Text style={styles.summaryText}>{fortuneData.summary}</Text>
                {fortuneData.score && (
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreLabel}>총운 점수</Text>
                    <Text style={[styles.scoreValue, { color: config?.color }]}>
                      {fortuneData.score}점
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 카테고리별 운세 */}
            {fortuneData.categories?.map((category: any, index: number) => (
              <View key={index} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  {category.score && (
                    <Text style={styles.categoryScore}>{category.score}점</Text>
                  )}
                </View>
                <Text style={styles.categoryContent}>{category.content}</Text>
                {category.advice && (
                  <View style={styles.adviceBox}>
                    <Text style={styles.adviceLabel}>조언</Text>
                    <Text style={styles.adviceText}>{category.advice}</Text>
                  </View>
                )}
              </View>
            ))}

            {/* 월별 운세 (신년운세) */}
            {fortuneData.monthly && (
              <View style={styles.monthlySection}>
                <Text style={styles.sectionTitle}>월별 운세</Text>
                {fortuneData.monthly.map((month: any, index: number) => (
                  <View key={index} style={styles.monthCard}>
                    <View style={styles.monthHeader}>
                      <Text style={styles.monthLabel}>{month.month}월</Text>
                      <View style={[
                        styles.monthBadge,
                        { backgroundColor: month.luck === 'good' ? '#10B981' :
                          month.luck === 'bad' ? '#EF4444' : '#F59E0B' }
                      ]}>
                        <Text style={styles.monthBadgeText}>
                          {month.luck === 'good' ? '길' : month.luck === 'bad' ? '흉' : '평'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.monthContent}>{month.content}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 띠 운세 정보 (animal) */}
            {fortuneData.animalInfo && (
              <View style={styles.animalInfoCard}>
                <Text style={styles.animalEmoji}>{fortuneData.animalInfo.emoji}</Text>
                <Text style={styles.animalName}>{fortuneData.animalInfo.name}</Text>
                <Text style={styles.animalElement}>{fortuneData.animalInfo.element}</Text>
                <Text style={styles.animalPersonality}>{fortuneData.animalInfo.personality}</Text>
              </View>
            )}

            {/* 오늘의 조언 */}
            {fortuneData.advice && !fortuneData.categories?.some((c: any) => c.advice) && (
              <View style={styles.adviceCard}>
                <Text style={styles.sectionTitle}>오늘의 조언</Text>
                <Text style={styles.adviceMainText}>{fortuneData.advice}</Text>
              </View>
            )}

            {/* 꿈풀이 카테고리 (꿈풀이) */}
            {fortuneData.dreamCategories && (
              <View style={styles.dreamSection}>
                <Text style={styles.sectionTitle}>꿈 해몽 사전</Text>
                <Text style={styles.dreamGuide}>
                  꿈에서 본 것을 검색하거나 카테고리에서 찾아보세요.
                </Text>

                {/* 검색바 */}
                <View style={styles.dreamSearchContainer}>
                  <Search size={18} color={COLORS.textSecondary} />
                  <TextInput
                    style={styles.dreamSearchInput}
                    placeholder="꿈에서 본 것을 검색하세요 (예: 뱀, 물, 돈)"
                    placeholderTextColor={COLORS.textLight}
                    value={dreamSearchQuery}
                    onChangeText={setDreamSearchQuery}
                  />
                </View>

                {/* 검색 결과 또는 카테고리 목록 */}
                {filteredDreamCategories && filteredDreamCategories.length > 0 ? (
                  filteredDreamCategories.map((category: any, index: number) => (
                    <View key={index} style={styles.dreamCategoryCard}>
                      <Text style={styles.dreamCategoryTitle}>
                        {category.emoji} {category.title}
                      </Text>
                      {category.items.map((item: any, itemIndex: number) => (
                        <View key={itemIndex} style={styles.dreamItem}>
                          <Text style={styles.dreamItemTitle}>{item.name}</Text>
                          <Text style={styles.dreamItemMeaning}>{item.meaning}</Text>
                          <Text style={styles.dreamItemLuck}>
                            {item.luck === 'good' ? '🟢 길몽' :
                             item.luck === 'bad' ? '🔴 흉몽' : '🟡 평몽'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))
                ) : dreamSearchQuery.trim() ? (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>
                      "{dreamSearchQuery}"에 대한 해몽을 찾을 수 없습니다.
                    </Text>
                    <Text style={styles.noResultsHint}>
                      다른 키워드로 검색해보세요.
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* 행운 정보 - luckyInfo 또는 직접 속성 */}
            {(fortuneData.luckyInfo || fortuneData.color) && (
              <View style={styles.luckyCard}>
                <Text style={styles.sectionTitle}>행운 정보</Text>
                <View style={styles.luckyGrid}>
                  <View style={styles.luckyItem}>
                    <Text style={styles.luckyLabel}>행운의 색</Text>
                    <Text style={styles.luckyValue}>
                      {fortuneData.luckyInfo?.color || fortuneData.color}
                    </Text>
                  </View>
                  <View style={styles.luckyItem}>
                    <Text style={styles.luckyLabel}>행운의 숫자</Text>
                    <Text style={styles.luckyValue}>
                      {fortuneData.luckyInfo?.number || fortuneData.numbers}
                    </Text>
                  </View>
                  <View style={styles.luckyItem}>
                    <Text style={styles.luckyLabel}>행운의 방향</Text>
                    <Text style={styles.luckyValue}>
                      {fortuneData.luckyInfo?.direction || fortuneData.direction}
                    </Text>
                  </View>
                  {(fortuneData.luckyInfo?.item || fortuneData.time) && (
                    <View style={styles.luckyItem}>
                      <Text style={styles.luckyLabel}>
                        {fortuneData.luckyInfo?.item ? '행운의 물건' : '행운의 시간'}
                      </Text>
                      <Text style={styles.luckyValue}>
                        {fortuneData.luckyInfo?.item || fortuneData.time}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

          </>
        )}

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
  titleSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  mainTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  sourceBadge: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  userInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  userInfoTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  userInfoDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  summaryText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  scoreLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  scoreValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
  },
  categoryCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  categoryTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  categoryScore: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
  categoryContent: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  adviceBox: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: '#F0FDF4',
    borderRadius: BORDER_RADIUS.md,
  },
  adviceLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: '#166534',
    marginBottom: SPACING.xs,
  },
  adviceText: {
    fontSize: FONT_SIZES.sm,
    color: '#166534',
    lineHeight: 20,
  },
  monthlySection: {
    marginTop: SPACING.md,
  },
  monthCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  monthLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  monthBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  monthBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.white,
  },
  monthContent: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  dreamSection: {
    marginTop: SPACING.md,
  },
  dreamGuide: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  dreamSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dreamSearchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  noResultsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  noResultsText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  noResultsHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
  },
  dreamCategoryCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  dreamCategoryTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  dreamItem: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dreamItemTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dreamItemMeaning: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  dreamItemLuck: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
  luckyCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    ...SHADOWS.sm,
  },
  luckyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  luckyItem: {
    width: '48%',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
  },
  luckyLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  luckyValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  // 띠 운세 스타일
  animalInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginTop: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  animalEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  animalName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  animalElement: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  animalPersonality: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // 조언 카드 스타일
  adviceCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    ...SHADOWS.sm,
  },
  adviceMainText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
});
