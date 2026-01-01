import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Sparkles, Heart, TrendingUp, Briefcase, Activity, ChevronDown, ChevronUp, Info, Zap, AlertCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../contexts/AppContext';
import { CircularProgress } from '../components/saju';
import { generateFortune } from '../services/FortuneGenerator';
import { DetailedFortune } from '../types';
import { SajuCalculator } from '../services/SajuCalculator';

// 카테고리별 아이콘 매핑
const CATEGORY_ICONS = {
  overall: Sparkles,
  love: Heart,
  money: TrendingUp,
  work: Briefcase,
  health: Activity,
};

const CATEGORY_COLORS = {
  overall: '#F59E0B',
  love: '#F43F5E',
  money: '#10B981',
  work: '#3B82F6',
  health: '#8B5CF6',
};

const CATEGORY_NAMES = {
  overall: '종합운',
  love: '애정운',
  money: '금전운',
  work: '직장운',
  health: '건강운',
};

interface FortuneCardProps {
  category: keyof typeof CATEGORY_ICONS;
  score: number;
  description: string;
  detailedFortune?: DetailedFortune;
}

const FortuneCard: React.FC<FortuneCardProps> = ({ category, score, description, detailedFortune }) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = CATEGORY_ICONS[category];
  const color = CATEGORY_COLORS[category];
  const name = CATEGORY_NAMES[category];

  return (
    <View style={styles.fortuneCard}>
      <TouchableOpacity
        style={styles.fortuneCardHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Icon size={24} color={color} />
        </View>
        <View style={styles.fortuneCardTitle}>
          <Text style={styles.categoryName}>{name}</Text>
          <Text style={[styles.scoreText, { color }]}>{score}점</Text>
        </View>
        <CircularProgress score={score} size={50} strokeWidth={4} color={color} showScore />
        {detailedFortune && (
          <View style={styles.expandButton}>
            {expanded ? (
              <ChevronUp size={20} color="#78716C" />
            ) : (
              <ChevronDown size={20} color="#78716C" />
            )}
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.fortuneDescription}>{description}</Text>

      {/* 확장된 상세 내용 */}
      {expanded && detailedFortune && (
        <View style={styles.detailedContent}>
          {/* 상세 분석 */}
          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <Info size={16} color={color} />
              <Text style={[styles.detailTitle, { color }]}>상세 분석</Text>
            </View>
            <Text style={styles.detailText}>{detailedFortune.analysis}</Text>
          </View>

          {/* 명리학적 이유 */}
          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <Zap size={16} color="#F59E0B" />
              <Text style={[styles.detailTitle, { color: '#F59E0B' }]}>명리학적 근거</Text>
            </View>
            <Text style={styles.detailText}>{detailedFortune.reason}</Text>
          </View>

          {/* 실천 조언 */}
          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <AlertCircle size={16} color="#10B981" />
              <Text style={[styles.detailTitle, { color: '#10B981' }]}>실천 조언</Text>
            </View>
            <Text style={styles.detailText}>{detailedFortune.advice}</Text>
          </View>

          {/* 키워드 */}
          <View style={styles.detailKeywords}>
            {detailedFortune.keywords.map((keyword, index) => (
              <View key={index} style={[styles.keywordChip, { backgroundColor: `${color}15` }]}>
                <Text style={[styles.keywordChipText, { color }]}>#{keyword}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default function FortuneDetailScreen() {
  const navigation = useNavigation();
  const { todayFortune, profile } = useApp();

  // 사주를 실시간으로 재계산 (저장된 데이터의 UTC 버그 문제 해결)
  const sajuResult = useMemo(() => {
    if (!profile) return null;
    const calculator = new SajuCalculator(profile.birthDate, profile.birthTime);
    return calculator.calculate();
  }, [profile?.birthDate, profile?.birthTime]);

  // 운세 데이터 (없으면 새로 생성)
  const fortune = todayFortune || generateFortune(sajuResult);

  // 오늘 날짜 포맷
  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6B5B45" />

      {/* Header */}
      <LinearGradient colors={['#6B5B45', '#8B7355']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft color="#FFFFFF" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>오늘의 운세</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.summarySection}>
            <Text style={styles.dateText}>{dateStr}</Text>
            <Text style={styles.userName}>{profile?.name || '사용자'}님의 운세</Text>
            <Text style={styles.summaryText}>{fortune.summary}</Text>

            <View style={styles.keywordsContainer}>
              {fortune.keywords.map((keyword, index) => (
                <View key={index} style={styles.keywordBadge}>
                  <Text style={styles.keywordText}>#{keyword}</Text>
                </View>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 오늘의 기운 분석 섹션 */}
        {fortune.elementAnalysis && fortune.branchAnalysis && (
          <View style={styles.analysisSection}>
            <Text style={styles.analysisSectionTitle}>오늘의 기운 분석</Text>

            {/* 오행 관계 */}
            <View style={styles.analysisCard}>
              <View style={styles.analysisRow}>
                <View style={styles.analysisItem}>
                  <Text style={styles.analysisLabel}>나의 일간</Text>
                  <Text style={styles.analysisValue}>
                    {fortune.userDayMaster?.stem} ({fortune.userDayMaster?.elementName})
                  </Text>
                </View>
                <View style={styles.analysisArrow}>
                  <Text style={styles.analysisArrowText}>{fortune.elementAnalysis.relationName}</Text>
                </View>
                <View style={styles.analysisItem}>
                  <Text style={styles.analysisLabel}>오늘의 간지</Text>
                  <Text style={styles.analysisValue}>
                    {fortune.todayGanji?.fullName}
                  </Text>
                </View>
              </View>
              <Text style={styles.analysisDescription}>
                {fortune.elementAnalysis.relationDescription}
              </Text>
            </View>

            {/* 지지 관계 */}
            {fortune.branchAnalysis.relation && (
              <View style={[styles.analysisCard, styles.branchCard]}>
                <View style={styles.branchHeader}>
                  <Text style={styles.branchRelationType}>
                    {fortune.branchAnalysis.relation === '육합' || fortune.branchAnalysis.relation === '삼합'
                      ? '길한 관계'
                      : '주의 관계'}
                  </Text>
                  <View style={[
                    styles.branchBadge,
                    fortune.branchAnalysis.relation === '육합' || fortune.branchAnalysis.relation === '삼합'
                      ? styles.branchBadgeGood
                      : styles.branchBadgeCaution
                  ]}>
                    <Text style={styles.branchBadgeText}>{fortune.branchAnalysis.relation}</Text>
                  </View>
                </View>
                {/* 쉬운 설명 (하이라이트) */}
                {fortune.branchAnalysis.simpleExplanation && (
                  <View style={styles.simpleExplanationBox}>
                    <Text style={styles.simpleExplanationText}>
                      💡 {fortune.branchAnalysis.simpleExplanation}
                    </Text>
                  </View>
                )}
                <Text style={styles.branchDescription}>
                  {fortune.branchAnalysis.relationDescription}
                </Text>
                <Text style={styles.branchEffect}>
                  {fortune.branchAnalysis.effect}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 운세 카드들 */}
        <Text style={styles.cardSectionTitle}>카테고리별 상세 운세</Text>
        <Text style={styles.cardSectionHint}>카드를 터치하면 상세 내용을 볼 수 있습니다</Text>

        <FortuneCard
          category="overall"
          score={fortune.scores.overall}
          description={fortune.cards.overall?.[0] || '오늘 하루도 좋은 일이 가득하길 바랍니다.'}
          detailedFortune={fortune.detailedFortunes?.overall}
        />
        <FortuneCard
          category="love"
          score={fortune.scores.love}
          description={fortune.cards.love?.[0] || '사랑하는 사람과 좋은 시간을 보내세요.'}
          detailedFortune={fortune.detailedFortunes?.love}
        />
        <FortuneCard
          category="money"
          score={fortune.scores.money}
          description={fortune.cards.money?.[0] || '재물운이 상승하는 시기입니다.'}
          detailedFortune={fortune.detailedFortunes?.money}
        />
        <FortuneCard
          category="work"
          score={fortune.scores.work}
          description={fortune.cards.work?.[0] || '업무에서 좋은 성과를 낼 수 있습니다.'}
          detailedFortune={fortune.detailedFortunes?.work}
        />
        <FortuneCard
          category="health"
          score={fortune.scores.health}
          description={fortune.cards.health?.[0] || '건강 관리에 신경 쓰세요.'}
          detailedFortune={fortune.detailedFortunes?.health}
        />

        {/* Do & Don't */}
        <View style={styles.dosDontsContainer}>
          <View style={[styles.dosDontsCard, styles.doCard]}>
            <Text style={styles.dosDontsLabel}>오늘 하면 좋은 것</Text>
            <Text style={styles.dosDontsText}>{fortune.do}</Text>
          </View>
          <View style={[styles.dosDontsCard, styles.dontCard]}>
            <Text style={styles.dosDontsLabel}>오늘 피할 것</Text>
            <Text style={styles.dosDontsText}>{fortune.dont}</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F4',
  },
  header: {
    paddingBottom: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  summarySection: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 16,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  keywordBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  keywordText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 60,
  },
  fortuneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fortuneCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fortuneCardTitle: {
    flex: 1,
    marginLeft: 12,
  },
  categoryName: {
    fontSize: 14,
    color: '#78716C',
    marginBottom: 2,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  fortuneDescription: {
    fontSize: 15,
    color: '#44403C',
    lineHeight: 22,
  },
  dosDontsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  dosDontsCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  doCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  dontCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dosDontsLabel: {
    fontSize: 12,
    color: '#78716C',
    marginBottom: 6,
  },
  dosDontsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1917',
  },
  // 확장 버튼
  expandButton: {
    marginLeft: 8,
    padding: 4,
  },
  // 상세 내용
  detailedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E7E5E4',
  },
  detailSection: {
    marginBottom: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#44403C',
    lineHeight: 22,
    paddingLeft: 22,
  },
  detailKeywords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  keywordChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  keywordChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // 오늘의 기운 분석 섹션
  analysisSection: {
    marginBottom: 20,
  },
  analysisSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 12,
  },
  analysisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  analysisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  analysisItem: {
    flex: 1,
    alignItems: 'center',
  },
  analysisLabel: {
    fontSize: 12,
    color: '#78716C',
    marginBottom: 4,
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1917',
    textAlign: 'center',
  },
  analysisArrow: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F5F5F4',
    borderRadius: 8,
  },
  analysisArrowText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B5B45',
  },
  analysisDescription: {
    fontSize: 14,
    color: '#44403C',
    lineHeight: 20,
    textAlign: 'center',
  },
  // 지지 관계 카드
  branchCard: {
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  branchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  branchRelationType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1917',
  },
  branchBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  branchBadgeGood: {
    backgroundColor: '#ECFDF5',
  },
  branchBadgeCaution: {
    backgroundColor: '#FEF2F2',
  },
  branchBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1917',
  },
  branchDescription: {
    fontSize: 13,
    color: '#44403C',
    lineHeight: 20,
    marginBottom: 6,
  },
  branchEffect: {
    fontSize: 13,
    color: '#78716C',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  // 쉬운 설명 박스
  simpleExplanationBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  simpleExplanationText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    fontWeight: '500',
  },
  // 카드 섹션 타이틀
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 4,
  },
  cardSectionHint: {
    fontSize: 12,
    color: '#A8A29E',
    marginBottom: 12,
  },
});
