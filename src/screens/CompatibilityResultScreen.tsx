import React, { useMemo, useState } from 'react';
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
import { ArrowLeft, Heart, Star, Sparkles, Users, Wallet, MessageCircle, Home, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, SHADOWS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../utils/theme';
import { SajuResult } from '../types';
import { calculateCompatibility, DetailedCompatibility } from '../services/CompatibilityService';
import { CircularProgress } from '../components/saju';

type RouteParams = {
  CompatibilityResult: {
    person1: {
      name: string;
      birthDate: string;
      birthTime: string | null;
      gender: 'male' | 'female' | null;
      saju: SajuResult;
    };
    person2: {
      name: string;
      birthDate: string;
      birthTime: string | null;
      gender: 'male' | 'female' | null;
      saju: SajuResult;
    };
  };
};

export default function CompatibilityResultScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'CompatibilityResult'>>();
  const { person1, person2 } = route.params;

  // 확장된 카드 상태 관리
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // 카드 확장/축소 토글
  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  // 궁합 계산
  const compatibility = useMemo(() => {
    return calculateCompatibility(person1.saju, person2.saju);
  }, [person1.saju, person2.saju]);

  // 점수에 따른 등급 텍스트
  const getGradeText = (score: number) => {
    if (score >= 90) return '천생연분';
    if (score >= 80) return '매우 좋음';
    if (score >= 70) return '좋음';
    if (score >= 60) return '보통';
    if (score >= 50) return '노력 필요';
    return '주의 필요';
  };

  // 점수에 따른 색상
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const renderScoreCard = (
    title: string,
    score: number,
    description: string,
    icon: React.ReactNode
  ) => (
    <View style={styles.scoreCard}>
      <View style={styles.scoreCardHeader}>
        <View style={styles.scoreCardIcon}>{icon}</View>
        <Text style={styles.scoreCardTitle}>{title}</Text>
      </View>
      <View style={styles.scoreCardBody}>
        <CircularProgress
          score={score}
          size={60}
          strokeWidth={5}
          color={getScoreColor(score)}
          showScore
        />
        <View style={styles.scoreCardContent}>
          <Text style={[styles.scoreGrade, { color: getScoreColor(score) }]}>
            {getGradeText(score)}
          </Text>
          <Text style={styles.scoreDescription}>{description}</Text>
        </View>
      </View>
    </View>
  );

  // 세부 궁합 카드 아이콘 매핑
  const getDetailedCardIcon = (type: string) => {
    switch (type) {
      case 'intimacy':
        return <Heart size={20} color="#E91E63" />;
      case 'personality':
        return <Users size={20} color="#8B5CF6" />;
      case 'wealth':
        return <Wallet size={20} color="#10B981" />;
      case 'communication':
        return <MessageCircle size={20} color="#3B82F6" />;
      case 'family':
        return <Home size={20} color="#F59E0B" />;
      case 'future':
        return <TrendingUp size={20} color="#EC4899" />;
      default:
        return <Star size={20} color="#6B7280" />;
    }
  };

  // 세부 궁합 카드 배경색 매핑
  const getDetailedCardBgColor = (type: string) => {
    switch (type) {
      case 'intimacy':
        return '#FDF2F8';
      case 'personality':
        return '#F5F3FF';
      case 'wealth':
        return '#ECFDF5';
      case 'communication':
        return '#EFF6FF';
      case 'family':
        return '#FFFBEB';
      case 'future':
        return '#FDF2F8';
      default:
        return '#F9FAFB';
    }
  };

  // 세부 궁합 카드 렌더링
  const renderDetailedCard = (
    type: string,
    data: DetailedCompatibility
  ) => {
    const isExpanded = expandedCards.has(type);

    return (
      <View key={type} style={styles.detailedCard}>
        <TouchableOpacity
          style={styles.detailedCardHeader}
          onPress={() => toggleCard(type)}
          activeOpacity={0.7}
        >
          <View style={styles.detailedCardTitleRow}>
            <View style={[styles.detailedCardIconBg, { backgroundColor: getDetailedCardBgColor(type) }]}>
              {getDetailedCardIcon(type)}
            </View>
            <View style={styles.detailedCardTitleContent}>
              <Text style={styles.detailedCardTitle}>{data.title}</Text>
              <Text style={[styles.detailedCardGrade, { color: getScoreColor(data.score) }]}>
                {data.grade}
              </Text>
            </View>
          </View>
          <View style={styles.detailedCardScoreRow}>
            <CircularProgress
              score={data.score}
              size={50}
              strokeWidth={4}
              color={getScoreColor(data.score)}
              showScore
            />
            {isExpanded ? (
              <ChevronUp size={20} color="#9CA3AF" />
            ) : (
              <ChevronDown size={20} color="#9CA3AF" />
            )}
          </View>
        </TouchableOpacity>

        {/* 분석 요약 - 항상 표시 */}
        <Text style={styles.detailedCardAnalysis}>{data.analysis}</Text>

        {/* 상세 내용 - 확장 시 표시 */}
        {isExpanded && (
          <View style={styles.detailedCardDetails}>
            {data.details.map((detail, index) => (
              <View key={index} style={styles.detailItem}>
                <View style={[styles.detailBullet, { backgroundColor: getScoreColor(data.score) }]} />
                <Text style={styles.detailText}>{detail}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#E91E63" />

      {/* Header */}
      <LinearGradient colors={['#E91E63', '#F06292']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft color="#FFFFFF" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>궁합 결과</Text>
            <View style={styles.placeholder} />
          </View>

          {/* 총점 */}
          <View style={styles.totalScoreSection}>
            <View style={styles.personsRow}>
              <View style={styles.personBadge}>
                <Text style={styles.personBadgeText}>{person1.name}</Text>
              </View>
              <Heart size={24} color="#FFFFFF" fill="#FFFFFF" />
              <View style={styles.personBadge}>
                <Text style={styles.personBadgeText}>{person2.name}</Text>
              </View>
            </View>

            <View style={styles.totalScoreCircle}>
              <Text style={styles.totalScoreNumber}>{compatibility.totalScore}</Text>
              <Text style={styles.totalScoreUnit}>점</Text>
            </View>

            <Text style={styles.totalScoreGrade}>{getGradeText(compatibility.totalScore)}</Text>
            <Text style={styles.totalScoreSummary}>{compatibility.summary}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 세부 점수 */}
        {renderScoreCard(
          '오행 궁합',
          compatibility.elementScore,
          compatibility.elementAnalysis,
          <Sparkles size={20} color="#F59E0B" />
        )}

        {renderScoreCard(
          '지지 궁합',
          compatibility.branchScore,
          compatibility.branchAnalysis,
          <Star size={20} color="#3B82F6" />
        )}

        {renderScoreCard(
          '일주 궁합',
          compatibility.dayPillarScore,
          compatibility.dayPillarAnalysis,
          <Heart size={20} color="#E91E63" />
        )}

        {/* 천간합 특별 카드 (있는 경우에만 표시) */}
        {compatibility.stemCombination && (
          <View style={styles.specialCard}>
            <View style={styles.specialCardHeader}>
              <Sparkles size={20} color="#F59E0B" />
              <Text style={styles.specialCardTitle}>천간합 발견!</Text>
            </View>
            <Text style={styles.specialCardText}>
              두 분의 일간이 {compatibility.stemCombination.name} 관계입니다.
              이는 명리학에서 서로를 완성시켜주는 특별한 인연으로 봅니다.
            </Text>
          </View>
        )}

        {/* 세부 궁합 섹션 */}
        <View style={styles.detailedSection}>
          <Text style={styles.sectionTitle}>세부 궁합 분석</Text>
          <Text style={styles.sectionSubtitle}>카드를 터치하면 상세 내용을 볼 수 있어요</Text>

          {renderDetailedCard('intimacy', compatibility.detailedCompatibilities.intimacy)}
          {renderDetailedCard('personality', compatibility.detailedCompatibilities.personality)}
          {renderDetailedCard('wealth', compatibility.detailedCompatibilities.wealth)}
          {renderDetailedCard('communication', compatibility.detailedCompatibilities.communication)}
          {renderDetailedCard('family', compatibility.detailedCompatibilities.family)}
          {renderDetailedCard('future', compatibility.detailedCompatibilities.future)}
        </View>

        {/* 조언 섹션 */}
        <View style={styles.adviceCard}>
          <Text style={styles.adviceTitle}>궁합 조언</Text>
          {compatibility.advice.map((advice, index) => (
            <View key={index} style={styles.adviceItem}>
              <View style={styles.adviceBullet} />
              <Text style={styles.adviceText}>{advice}</Text>
            </View>
          ))}
        </View>

        {/* 다시 보기 버튼 */}
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.retryButtonText}>다른 사람과 궁합 보기</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F7',
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
  totalScoreSection: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  personsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  personBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  personBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  totalScoreCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  totalScoreNumber: {
    fontSize: 64,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  totalScoreUnit: {
    fontSize: 24,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
  },
  totalScoreGrade: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  totalScoreSummary: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 60,
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.md,
  },
  scoreCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  scoreCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scoreCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreCardContent: {
    flex: 1,
  },
  scoreGrade: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  scoreDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  adviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    ...SHADOWS.md,
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  adviceItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  adviceBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E91E63',
    marginTop: 7,
    marginRight: 10,
  },
  adviceText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E91E63',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E91E63',
  },
  // 천간합 특별 카드 스타일
  specialCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  specialCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  specialCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B45309',
  },
  specialCardText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  // 세부 궁합 섹션 스타일
  detailedSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  // 세부 궁합 카드 스타일
  detailedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.md,
  },
  detailedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailedCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailedCardIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailedCardTitleContent: {
    flex: 1,
  },
  detailedCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  detailedCardGrade: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailedCardScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailedCardAnalysis: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailedCardDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 10,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
});
