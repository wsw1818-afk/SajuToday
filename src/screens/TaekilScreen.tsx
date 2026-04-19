/**
 * 택일(擇日) 화면
 * 결혼, 이사, 개업 등 좋은 날을 찾아주는 화면
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
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../utils/theme';
import {
  analyzeTaekil,
  analyzeSpecificDate,
  DATE_TYPE_INFO,
  DateType,
  TaekilDate,
} from '../services/TaekilCalculator';

export default function TaekilScreen() {
  const navigation = useNavigation<any>();
  const [selectedPurpose, setSelectedPurpose] = useState<DateType>('marriage');
  const [dateRange, setDateRange] = useState<'1month' | '2month' | '3month'>('1month');
  const [showDetail, setShowDetail] = useState<TaekilDate | null>(null);
  const [onlyWeekends, setOnlyWeekends] = useState(false);

  // 날짜 범위 계산
  const { startDate, endDate } = useMemo(() => {
    const start = new Date();
    const end = new Date();
    const months = dateRange === '1month' ? 1 : dateRange === '2month' ? 2 : 3;
    end.setMonth(end.getMonth() + months);
    return { startDate: start, endDate: end };
  }, [dateRange]);

  // 택일 분석
  const result = useMemo(() => {
    return analyzeTaekil(selectedPurpose, startDate, endDate, { onlyWeekends });
  }, [selectedPurpose, startDate, endDate, onlyWeekends]);

  const purposes: DateType[] = ['marriage', 'move', 'business', 'contract', 'travel', 'surgery', 'general'];

  const getScoreColor = (score: number) => {
    if (score >= 80) return COLORS.success;
    if (score >= 65) return '#34D399';
    if (score >= 50) return COLORS.warning;
    return COLORS.error;
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return '🌟';
    if (score >= 65) return '👍';
    if (score >= 50) return '😐';
    return '⚠️';
  };

  const renderPurposeSelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.purposeScroll}
      contentContainerStyle={styles.purposeContainer}
    >
      {purposes.map(purpose => {
        const info = DATE_TYPE_INFO[purpose];
        const isSelected = selectedPurpose === purpose;
        return (
          <TouchableOpacity
            key={purpose}
            style={[styles.purposeButton, isSelected && styles.purposeButtonActive]}
            onPress={() => setSelectedPurpose(purpose)}
          >
            <Text style={styles.purposeEmoji}>{info.emoji}</Text>
            <Text style={[styles.purposeLabel, isSelected && styles.purposeLabelActive]}>
              {info.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderDateCard = (date: TaekilDate, rank?: number) => (
    <TouchableOpacity
      key={date.dateString}
      style={[styles.dateCard, date.isGoodDay && styles.dateCardGood]}
      onPress={() => setShowDetail(date)}
    >
      <View style={styles.dateCardLeft}>
        {rank && (
          <View style={[styles.rankBadge, { backgroundColor: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32' }]}>
            <Text style={styles.rankText}>{rank}</Text>
          </View>
        )}
        <View>
          <Text style={styles.dateText}>{date.dateString}</Text>
          <Text style={styles.dayOfWeek}>{date.dayOfWeek}요일</Text>
        </View>
      </View>

      <View style={styles.dateCardMiddle}>
        <Text style={styles.ganjiText}>{date.ganJi}일</Text>
        <Text style={styles.spiritText}>{date.spirit}일</Text>
        {date.sonEomnNeunNal && (
          <View style={styles.sonBadge}>
            <Text style={styles.sonBadgeText}>손없는날</Text>
          </View>
        )}
      </View>

      <View style={styles.dateCardRight}>
        <Text style={styles.scoreEmoji}>{getScoreEmoji(date.score)}</Text>
        <Text style={[styles.scoreValue, { color: getScoreColor(date.score) }]}>
          {date.score}점
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderDetailModal = () => (
    <Modal
      visible={!!showDetail}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowDetail(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {showDetail && (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {showDetail.dateString} ({showDetail.dayOfWeek})
                </Text>
                <TouchableOpacity onPress={() => setShowDetail(null)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.modalScoreBox}>
                  <Text style={styles.modalScoreEmoji}>{getScoreEmoji(showDetail.score)}</Text>
                  <Text style={[styles.modalScore, { color: getScoreColor(showDetail.score) }]}>
                    {showDetail.score}점
                  </Text>
                  <Text style={styles.modalScoreLabel}>
                    {DATE_TYPE_INFO[selectedPurpose].name} 적합도
                  </Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoLabel}>일진</Text>
                    <Text style={styles.modalInfoValue}>{showDetail.ganJi}일</Text>
                  </View>
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoLabel}>12신</Text>
                    <Text style={styles.modalInfoValue}>{showDetail.spirit}일</Text>
                  </View>
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoLabel}>28수</Text>
                    <Text style={styles.modalInfoValue}>{showDetail.mansion}수</Text>
                  </View>
                </View>

                {showDetail.reasons.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>👍 좋은 점</Text>
                    {showDetail.reasons.map((reason, idx) => (
                      <Text key={idx} style={styles.modalReasonText}>• {reason}</Text>
                    ))}
                  </View>
                )}

                {showDetail.cautions.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>⚠️ 주의할 점</Text>
                    {showDetail.cautions.map((caution, idx) => (
                      <Text key={idx} style={styles.modalCautionText}>• {caution}</Text>
                    ))}
                  </View>
                )}

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>📊 다른 목적 적합도</Text>
                  {(() => {
                    const analysis = analyzeSpecificDate(showDetail.date);
                    return analysis.purposes.slice(0, 4).map(p => (
                      <View key={p.purpose} style={styles.otherPurposeRow}>
                        <Text style={styles.otherPurposeEmoji}>
                          {DATE_TYPE_INFO[p.purpose].emoji}
                        </Text>
                        <Text style={styles.otherPurposeName}>
                          {DATE_TYPE_INFO[p.purpose].name}
                        </Text>
                        <View style={[styles.otherPurposeBar, { width: `${p.score}%`, backgroundColor: getScoreColor(p.score) }]} />
                        <Text style={[styles.otherPurposeScore, { color: getScoreColor(p.score) }]}>
                          {p.score}
                        </Text>
                      </View>
                    ));
                  })()}
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowDetail(null)}
              >
                <Text style={styles.modalButtonText}>닫기</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>택일 (길일 찾기)</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 목적 선택 */}
        <Text style={styles.sectionLabel}>어떤 목적의 날을 찾으시나요?</Text>
        {renderPurposeSelector()}

        {/* 선택된 목적 설명 */}
        <View style={styles.purposeInfoBox}>
          <Text style={styles.purposeInfoEmoji}>{DATE_TYPE_INFO[selectedPurpose].emoji}</Text>
          <Text style={styles.purposeInfoName}>{DATE_TYPE_INFO[selectedPurpose].name}</Text>
          <Text style={styles.purposeInfoDesc}>{DATE_TYPE_INFO[selectedPurpose].description}</Text>
        </View>

        {/* 기간 선택 */}
        <View style={styles.rangeSelector}>
          <Text style={styles.rangeSelectorLabel}>기간 선택</Text>
          <View style={styles.rangeButtons}>
            {(['1month', '2month', '3month'] as const).map(range => (
              <TouchableOpacity
                key={range}
                style={[styles.rangeButton, dateRange === range && styles.rangeButtonActive]}
                onPress={() => setDateRange(range)}
              >
                <Text style={[styles.rangeButtonText, dateRange === range && styles.rangeButtonTextActive]}>
                  {range === '1month' ? '1개월' : range === '2month' ? '2개월' : '3개월'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 주말만 보기 */}
        <TouchableOpacity
          style={styles.weekendToggle}
          onPress={() => setOnlyWeekends(!onlyWeekends)}
        >
          <View style={[styles.checkbox, onlyWeekends && styles.checkboxActive]}>
            {onlyWeekends && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.weekendToggleText}>주말만 보기</Text>
        </TouchableOpacity>

        {/* 이사 시 월장군 방향 */}
        {result.monthGeneralDirection && (
          <View style={styles.warningBox}>
            <Text style={styles.warningEmoji}>🧭</Text>
            <Text style={styles.warningText}>
              이번 달 월장군 방향: {result.monthGeneralDirection}{'\n'}
              이 방향으로의 이사는 피하는 것이 좋습니다.
            </Text>
          </View>
        )}

        {/* 요약 */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>{result.summary}</Text>
        </View>

        {/* 베스트 날짜 */}
        {result.bestDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌟 최고의 날</Text>
            {renderDateCard(result.bestDate)}
          </View>
        )}

        {/* 좋은 날 목록 */}
        {result.goodDates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              👍 좋은 날 ({result.goodDates.length}일)
            </Text>
            {result.goodDates.slice(0, 10).map((date, idx) => renderDateCard(date, idx + 1))}
            {result.goodDates.length > 10 && (
              <Text style={styles.moreText}>+{result.goodDates.length - 10}일 더 있음</Text>
            )}
          </View>
        )}

        {/* 피해야 할 날 */}
        {result.badDates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              ⚠️ 피하면 좋은 날
            </Text>
            {result.badDates.slice(0, 5).map(date => renderDateCard(date))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {renderDetailModal()}
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
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
    width: 40,
  },
  backButtonText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  purposeScroll: {
    flexGrow: 0,
  },
  purposeContainer: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  purposeButton: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  purposeButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F4FF',
  },
  purposeEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  purposeLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  purposeLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  purposeInfoBox: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  purposeInfoEmoji: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  purposeInfoName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  purposeInfoDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  rangeSelector: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  rangeSelectorLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  rangeButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  rangeButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  rangeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  rangeButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  rangeButtonTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  weekendToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontWeight: '700',
  },
  weekendToggleText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  warningEmoji: {
    fontSize: 24,
  },
  warningText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: '#92400E',
    lineHeight: 20,
  },
  summaryBox: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  summaryText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  dateCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateCardGood: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  dateCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.white,
  },
  dateText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  dayOfWeek: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  dateCardMiddle: {
    flex: 1,
    alignItems: 'center',
  },
  ganjiText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  spiritText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  sonBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  sonBadgeText: {
    fontSize: 10,
    color: '#1D4ED8',
  },
  dateCardRight: {
    alignItems: 'center',
  },
  scoreEmoji: {
    fontSize: 24,
  },
  scoreValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  moreText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalClose: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  modalBody: {
    marginBottom: SPACING.md,
  },
  modalScoreBox: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalScoreEmoji: {
    fontSize: 48,
  },
  modalScore: {
    fontSize: 36,
    fontWeight: '800',
  },
  modalScoreLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  modalInfoRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  modalInfoItem: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  modalInfoLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  modalInfoValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalSection: {
    marginBottom: SPACING.md,
  },
  modalSectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  modalReasonText: {
    fontSize: FONT_SIZES.sm,
    color: '#047857',
    marginBottom: 4,
  },
  modalCautionText: {
    fontSize: FONT_SIZES.sm,
    color: '#B45309',
    marginBottom: 4,
  },
  otherPurposeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  otherPurposeEmoji: {
    fontSize: 16,
  },
  otherPurposeName: {
    width: 70,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  otherPurposeBar: {
    height: 8,
    borderRadius: 4,
    flex: 1,
  },
  otherPurposeScore: {
    width: 30,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    textAlign: 'right',
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  bottomPadding: {
    height: 40,
  },
});
