/**
 * 시간 모름 사용자 전용 화면
 * - 시간 없이도 볼 수 있는 정보 안내
 * - 12시주 미리보기
 * - 시간 추정 도우미
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { SajuCalculator } from '../services/SajuCalculator';
import {
  TWELVE_HOURS,
  TIME_ESTIMATION_QUESTIONS,
  analyzeUnknownTime,
  analyzeAllHourPillars,
  calculateTimeEstimation,
  HourPillarAnalysis,
} from '../services/UnknownTimeService';

export default function UnknownTimeScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useApp();
  const { isDark, colors } = useTheme();

  const [showEstimator, setShowEstimator] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[][]>([]);
  const [estimationResult, setEstimationResult] = useState<{branch: string; score: number}[] | null>(null);
  const [selectedHour, setSelectedHour] = useState<HourPillarAnalysis | null>(null);

  // 사주 계산 (시간 없이)
  const sajuResult = useMemo(() => {
    if (!profile?.birthDate) return null;
    const calculator = new SajuCalculator(profile.birthDate, null);
    return calculator.calculate();
  }, [profile]);

  // 시간 모름 분석
  const unknownTimeAnalysis = useMemo(() => {
    if (!sajuResult || !profile?.birthDate) return null;
    return analyzeUnknownTime(profile.birthDate, sajuResult, answers.length > 0 ? answers : undefined);
  }, [sajuResult, profile?.birthDate, answers]);

  // 12시주 분석
  const hourPreviews = useMemo(() => {
    if (!sajuResult) return [];
    return analyzeAllHourPillars(sajuResult.pillars.day.stem, profile?.birthDate || '');
  }, [sajuResult, profile?.birthDate]);

  // 시간 추정 답변 처리
  const handleAnswer = (hints: string[]) => {
    const newAnswers = [...answers, hints];
    setAnswers(newAnswers);

    if (currentQuestion < TIME_ESTIMATION_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // 추정 완료 - 모달 닫고 결과 표시
      const scores = calculateTimeEstimation(newAnswers);
      const sortedResults = Object.entries(scores)
        .map(([branch, score]) => ({ branch, score }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);
      setEstimationResult(sortedResults);
      setShowEstimator(false); // 모달 닫기
    }
  };

  // 추정 초기화
  const resetEstimation = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setEstimationResult(null);
  };

  if (!profile || !sajuResult) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.background : '#FDFBF7' }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>프로필 정보가 없습니다.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.background : '#FDFBF7' }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backText, { color: isDark ? colors.text : '#1C1917' }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? colors.text : '#1C1917' }]}>
            시간 모름 안내
          </Text>
          <View style={{ width: 44 }} />
        </View>

        {/* 안내 카드 */}
        <LinearGradient
          colors={isDark ? ['#1E3A8A', '#1E1B4B'] : ['#3B82F6', '#6366F1']}
          style={styles.infoCard}
        >
          <Text style={styles.infoEmoji}>⏰</Text>
          <Text style={styles.infoTitle}>출생 시간을 모르시나요?</Text>
          <Text style={styles.infoText}>
            걱정 마세요! 시간 없이도 많은 정보를 확인할 수 있어요.{'\n'}
            또한 성격 질문으로 시간을 추정해볼 수도 있습니다.
          </Text>
        </LinearGradient>

        {/* 현재 사주 (3주) */}
        <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#1C1917' }]}>
            🎋 현재 확인된 사주 (3주)
          </Text>
          <View style={styles.pillarsRow}>
            <View style={styles.pillarItem}>
              <Text style={[styles.pillarLabel, { color: isDark ? colors.textSecondary : '#78716C' }]}>시주</Text>
              <View style={[styles.pillarBox, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}>
                <Text style={[styles.pillarUnknown, { color: isDark ? colors.textSecondary : '#9CA3AF' }]}>?</Text>
              </View>
            </View>
            <View style={styles.pillarItem}>
              <Text style={[styles.pillarLabel, { color: isDark ? colors.textSecondary : '#78716C' }]}>일주</Text>
              <View style={[styles.pillarBox, { backgroundColor: '#8B5CF620' }]}>
                <Text style={[styles.pillarValue, { color: isDark ? colors.text : '#1C1917' }]}>
                  {sajuResult.pillars.day.stem}{sajuResult.pillars.day.branch}
                </Text>
              </View>
            </View>
            <View style={styles.pillarItem}>
              <Text style={[styles.pillarLabel, { color: isDark ? colors.textSecondary : '#78716C' }]}>월주</Text>
              <View style={[styles.pillarBox, { backgroundColor: '#8B5CF620' }]}>
                <Text style={[styles.pillarValue, { color: isDark ? colors.text : '#1C1917' }]}>
                  {sajuResult.pillars.month.stem}{sajuResult.pillars.month.branch}
                </Text>
              </View>
            </View>
            <View style={styles.pillarItem}>
              <Text style={[styles.pillarLabel, { color: isDark ? colors.textSecondary : '#78716C' }]}>년주</Text>
              <View style={[styles.pillarBox, { backgroundColor: '#8B5CF620' }]}>
                <Text style={[styles.pillarValue, { color: isDark ? colors.text : '#1C1917' }]}>
                  {sajuResult.pillars.year.stem}{sajuResult.pillars.year.branch}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 확인 가능한 정보 */}
        <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#1C1917' }]}>
            ✅ 시간 없이 확인 가능한 정보
          </Text>
          {unknownTimeAnalysis?.availableInfo.map((info, index) => (
            <View key={index} style={styles.infoRow}>
              <Text style={styles.checkIcon}>✓</Text>
              <Text style={[styles.infoItemText, { color: isDark ? colors.text : '#374151' }]}>{info}</Text>
            </View>
          ))}
        </View>

        {/* 제한되는 정보 */}
        <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#1C1917' }]}>
            ⚠️ 시간이 있으면 더 정확한 정보
          </Text>
          {unknownTimeAnalysis?.limitedInfo.map((info, index) => (
            <View key={index} style={styles.infoRow}>
              <Text style={styles.warningIcon}>!</Text>
              <Text style={[styles.infoItemText, { color: isDark ? colors.textSecondary : '#6B7280' }]}>{info}</Text>
            </View>
          ))}
        </View>

        {/* 시간 추정 버튼 */}
        <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#1C1917' }]}>
            🔮 시간 추정 도우미
          </Text>
          <Text style={[styles.estimatorDesc, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
            몇 가지 질문에 답하면 출생 시간을 추정해드립니다.{'\n'}
            정확하지 않을 수 있지만, 참고용으로 활용해보세요.
          </Text>

          {estimationResult ? (
            <View>
              <Text style={[styles.resultTitle, { color: isDark ? colors.text : '#1C1917' }]}>
                추정 결과
              </Text>
              {estimationResult.slice(0, 3).map((result, index) => {
                const hourInfo = TWELVE_HOURS.find(h => h.branch === result.branch);
                return (
                  <View key={index} style={[styles.resultItem, { backgroundColor: isDark ? colors.background : '#F3E8FF' }]}>
                    <Text style={[styles.resultRank, { color: '#8B5CF6' }]}>
                      {index + 1}위
                    </Text>
                    <View style={styles.resultInfo}>
                      <Text style={[styles.resultBranch, { color: isDark ? colors.text : '#1C1917' }]}>
                        {result.branch}시 ({hourInfo?.animal})
                      </Text>
                      <Text style={[styles.resultTime, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                        {hourInfo?.time}
                      </Text>
                    </View>
                    <Text style={[styles.resultScore, { color: '#8B5CF6' }]}>
                      {Math.round((result.score / answers.length) * 100)}%
                    </Text>
                  </View>
                );
              })}
              <TouchableOpacity
                style={[styles.resetButton, { borderColor: isDark ? colors.primary : '#8B5CF6' }]}
                onPress={resetEstimation}
              >
                <Text style={[styles.resetButtonText, { color: isDark ? colors.primary : '#8B5CF6' }]}>
                  다시 추정하기
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.estimatorButton, { backgroundColor: isDark ? colors.primary : '#8B5CF6' }]}
              onPress={() => setShowEstimator(true)}
            >
              <Text style={styles.estimatorButtonText}>시간 추정 시작하기 →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 12시주 미리보기 */}
        <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#1C1917' }]}>
            🕐 12시주 미리보기
          </Text>
          <Text style={[styles.previewDesc, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
            각 시간대별로 어떤 사주가 되는지 확인해보세요
          </Text>
          <View style={styles.hourGrid}>
            {hourPreviews.map((hour, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.hourItem, { backgroundColor: isDark ? colors.background : '#F9FAFB' }]}
                onPress={() => setSelectedHour(hour)}
              >
                <Text style={[styles.hourBranch, { color: isDark ? colors.text : '#1C1917' }]}>
                  {hour.branch}
                </Text>
                <Text style={[styles.hourAnimal, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                  {hour.animal}
                </Text>
                <Text style={[styles.hourTime, { color: isDark ? colors.textSecondary : '#9CA3AF' }]}>
                  {hour.timeRange.split('-')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 추천 */}
        <View style={[styles.recommendCard, { backgroundColor: isDark ? '#14532D20' : '#DCFCE7' }]}>
          <Text style={styles.recommendEmoji}>💡</Text>
          <Text style={[styles.recommendText, { color: isDark ? '#86EFAC' : '#166534' }]}>
            부모님이나 가족에게 출생 시간을 확인해보세요.{'\n'}
            병원 기록이나 주민등록 등본에서도 찾을 수 있어요!
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 시간 추정 모달 */}
      <Modal
        visible={showEstimator}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? colors.text : '#1C1917' }]}>
              시간 추정 질문 {currentQuestion + 1}/{TIME_ESTIMATION_QUESTIONS.length}
            </Text>

            <Text style={[styles.questionText, { color: isDark ? colors.text : '#374151' }]}>
              {TIME_ESTIMATION_QUESTIONS[currentQuestion].question}
            </Text>

            <ScrollView style={styles.optionsContainer}>
              {TIME_ESTIMATION_QUESTIONS[currentQuestion].options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.optionButton, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}
                  onPress={() => handleAnswer(option.hint)}
                >
                  <Text style={[styles.optionText, { color: isDark ? colors.text : '#374151' }]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => {
                setShowEstimator(false);
                resetEstimation();
              }}
            >
              <Text style={[styles.closeModalText, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                취소
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 시주 상세 모달 */}
      <Modal
        visible={selectedHour !== null}
        animationType="fade"
        transparent
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedHour(null)}
        >
          <View style={[styles.hourDetailModal, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {selectedHour && (
              <>
                <Text style={[styles.hourDetailTitle, { color: isDark ? colors.text : '#1C1917' }]}>
                  {selectedHour.branch}시 ({selectedHour.animal}) 상세
                </Text>
                <Text style={[styles.hourDetailTime, { color: isDark ? colors.primary : '#8B5CF6' }]}>
                  {selectedHour.timeRange}
                </Text>

                <View style={styles.hourDetailSection}>
                  <Text style={[styles.hourDetailLabel, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                    성격 특성
                  </Text>
                  <Text style={[styles.hourDetailValue, { color: isDark ? colors.text : '#374151' }]}>
                    {selectedHour.personality}
                  </Text>
                </View>

                <View style={styles.hourDetailSection}>
                  <Text style={[styles.hourDetailLabel, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                    적합 직업
                  </Text>
                  <Text style={[styles.hourDetailValue, { color: isDark ? colors.text : '#374151' }]}>
                    {selectedHour.career}
                  </Text>
                </View>

                <View style={styles.hourDetailSection}>
                  <Text style={[styles.hourDetailLabel, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                    건강 주의
                  </Text>
                  <Text style={[styles.hourDetailValue, { color: isDark ? colors.text : '#374151' }]}>
                    {selectedHour.health}
                  </Text>
                </View>

                <View style={styles.hourDetailSection}>
                  <Text style={[styles.hourDetailLabel, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                    행운의 색
                  </Text>
                  <Text style={[styles.hourDetailValue, { color: isDark ? colors.text : '#374151' }]}>
                    {selectedHour.luckyColor}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.hourDetailClose, { backgroundColor: isDark ? colors.primary : '#8B5CF6' }]}
                  onPress={() => setSelectedHour(null)}
                >
                  <Text style={styles.hourDetailCloseText}>닫기</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
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
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  infoCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  infoEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  pillarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pillarItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  pillarLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  pillarBox: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  pillarValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  pillarUnknown: {
    fontSize: 24,
    fontWeight: '300',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkIcon: {
    fontSize: 14,
    color: '#22C55E',
    marginRight: 10,
    fontWeight: '700',
  },
  warningIcon: {
    fontSize: 14,
    color: '#F59E0B',
    marginRight: 10,
    fontWeight: '700',
    width: 14,
    textAlign: 'center',
  },
  infoItemText: {
    fontSize: 14,
    flex: 1,
  },
  estimatorDesc: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  estimatorButton: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  estimatorButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  resultRank: {
    fontSize: 14,
    fontWeight: '700',
    width: 40,
  },
  resultInfo: {
    flex: 1,
  },
  resultBranch: {
    fontSize: 15,
    fontWeight: '600',
  },
  resultTime: {
    fontSize: 12,
    marginTop: 2,
  },
  resultScore: {
    fontSize: 16,
    fontWeight: '700',
  },
  resetButton: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewDesc: {
    fontSize: 13,
    marginBottom: 14,
  },
  hourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  hourItem: {
    width: '23%',
    marginHorizontal: '1%',
    marginBottom: 8,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  hourBranch: {
    fontSize: 18,
    fontWeight: '700',
  },
  hourAnimal: {
    fontSize: 11,
    marginTop: 2,
  },
  hourTime: {
    fontSize: 10,
    marginTop: 2,
  },
  recommendCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  recommendText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 26,
  },
  optionsContainer: {
    maxHeight: 300,
  },
  optionButton: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  optionText: {
    fontSize: 15,
    textAlign: 'center',
  },
  closeModalButton: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
  },
  closeModalText: {
    fontSize: 14,
  },
  hourDetailModal: {
    width: '85%',
    borderRadius: 20,
    padding: 20,
  },
  hourDetailTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  hourDetailTime: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  hourDetailSection: {
    marginBottom: 14,
  },
  hourDetailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  hourDetailValue: {
    fontSize: 14,
    lineHeight: 22,
  },
  hourDetailClose: {
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  hourDetailCloseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
