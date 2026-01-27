/**
 * 운세 질문 답변 화면
 * 구체적인 질문에 사주 기반으로 답변합니다.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, ChevronRight, CheckCircle, XCircle, MinusCircle } from 'lucide-react-native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../utils/theme';
import { useApp } from '../contexts/AppContext';
import { SajuCalculator } from '../services/SajuCalculator';
import { QUESTIONS, generateAnswer, QuestionCategory, Answer } from '../services/FortuneQnA';

export default function FortuneQnAScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useApp();
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionCategory | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);

  // 사주 계산
  const sajuResult = useMemo(() => {
    if (!profile) return null;
    const calculator = new SajuCalculator(profile.birthDate, profile.birthTime);
    return calculator.calculate();
  }, [profile?.birthDate, profile?.birthTime]);

  const handleSelectQuestion = (questionId: QuestionCategory) => {
    if (!sajuResult) return;

    setSelectedQuestion(questionId);
    const result = generateAnswer(questionId, sajuResult, profile);
    setAnswer(result);
  };

  const handleBack = () => {
    if (answer) {
      setSelectedQuestion(null);
      setAnswer(null);
    } else {
      navigation.goBack();
    }
  };

  if (!profile || !sajuResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>운세 질문</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>프로필 정보가 필요합니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 답변 화면
  if (answer) {
    const ResultIcon = answer.result === 'positive' ? CheckCircle :
                      answer.result === 'negative' ? XCircle : MinusCircle;
    const resultColor = answer.result === 'positive' ? '#10B981' :
                       answer.result === 'negative' ? '#EF4444' : '#F59E0B';

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>답변</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 질문 표시 */}
          <View style={styles.questionBox}>
            <Text style={styles.questionIcon}>{answer.question.icon}</Text>
            <Text style={styles.questionText}>{answer.question.question}</Text>
          </View>

          {/* 결과 카드 */}
          <View style={[styles.resultCard, { borderColor: resultColor }]}>
            <View style={styles.resultHeader}>
              <ResultIcon size={32} color={resultColor} />
              <View style={styles.resultScoreContainer}>
                <Text style={[styles.resultScore, { color: resultColor }]}>{answer.score}점</Text>
                <Text style={styles.resultLabel}>
                  {answer.result === 'positive' ? '긍정적' :
                   answer.result === 'negative' ? '주의 필요' : '보통'}
                </Text>
              </View>
            </View>

            <Text style={styles.resultSummary}>{answer.summary}</Text>

            {answer.details.length > 0 && (
              <View style={styles.detailsBox}>
                {answer.details.map((detail, index) => (
                  <Text key={index} style={styles.detailText}>• {detail}</Text>
                ))}
              </View>
            )}
          </View>

          {/* 시기 */}
          {answer.timing && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>⏰ 좋은 시기</Text>
              <Text style={styles.infoText}>{answer.timing}</Text>
            </View>
          )}

          {/* 조언 */}
          <View style={[styles.infoCard, styles.adviceCard]}>
            <Text style={styles.infoLabel}>💡 조언</Text>
            <Text style={styles.infoText}>{answer.advice}</Text>
          </View>

          {/* 주의 */}
          <View style={[styles.infoCard, styles.cautionCard]}>
            <Text style={styles.infoLabel}>⚠️ 주의할 점</Text>
            <Text style={styles.infoText}>{answer.caution}</Text>
          </View>

          {/* 다른 질문하기 버튼 */}
          <TouchableOpacity style={styles.anotherButton} onPress={handleBack}>
            <Text style={styles.anotherButtonText}>다른 질문하기</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 질문 목록 화면
  const categories = {
    career: { title: '💼 직업/커리어', questions: QUESTIONS.filter(q => q.id.startsWith('career')) },
    love: { title: '💕 연애/결혼', questions: QUESTIONS.filter(q => q.id.startsWith('love')) },
    wealth: { title: '💰 재물/투자', questions: QUESTIONS.filter(q => q.id.startsWith('wealth')) },
    other: { title: '🔮 기타', questions: QUESTIONS.filter(q =>
      !q.id.startsWith('career') && !q.id.startsWith('love') && !q.id.startsWith('wealth')
    ) },
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>운세 질문</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.introText}>
          궁금한 질문을 선택하면{'\n'}
          {profile.name}님의 사주를 기반으로 답변해드려요.
        </Text>

        {Object.entries(categories).map(([key, category]) => (
          <View key={key} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            {category.questions.map(question => (
              <TouchableOpacity
                key={question.id}
                style={styles.questionCard}
                onPress={() => handleSelectQuestion(question.id)}
              >
                <Text style={styles.questionCardIcon}>{question.icon}</Text>
                <View style={styles.questionCardContent}>
                  <Text style={styles.questionCardTitle}>{question.title}</Text>
                  <Text style={styles.questionCardText}>{question.question}</Text>
                </View>
                <ChevronRight size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.bottomSpacer} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  introText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: SPACING.xl,
  },
  categorySection: {
    marginBottom: SPACING.lg,
  },
  categoryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  questionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  questionCardIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  questionCardContent: {
    flex: 1,
  },
  questionCardTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  questionCardText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  // 답변 화면 스타일
  questionBox: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  questionIcon: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  questionText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  resultScoreContainer: {
    marginLeft: SPACING.md,
  },
  resultScore: {
    fontSize: 28,
    fontWeight: '800',
  },
  resultLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  resultSummary: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  detailsBox: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  detailText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  adviceCard: {
    backgroundColor: '#F0FDF4',
  },
  cautionCard: {
    backgroundColor: '#FFFBEB',
  },
  infoLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 22,
  },
  anotherButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  anotherButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: 'white',
  },
  bottomSpacer: {
    height: 50,
  },
});
