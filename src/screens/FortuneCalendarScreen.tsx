/**
 * 운세 캘린더 화면
 * 월별 일운을 캘린더 형태로 표시합니다.
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
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../utils/theme';
import { useApp } from '../contexts/AppContext';
import { SajuCalculator } from '../services/SajuCalculator';
import {
  generateMonthCalendar,
  calculateMonthlyFortune,
  calculateDailyFortune,
  CalendarDay,
} from '../services/MonthlyDailyFortune';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export default function FortuneCalendarScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useApp();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  // 사주 계산
  const sajuResult = useMemo(() => {
    if (!profile) return null;
    const calculator = new SajuCalculator(profile.birthDate, profile.birthTime);
    return calculator.calculate();
  }, [profile?.birthDate, profile?.birthTime]);

  // 월별 캘린더 데이터
  const calendarData = useMemo(() => {
    if (!sajuResult?.dayMaster) return [];
    return generateMonthCalendar(sajuResult.dayMaster, currentYear, currentMonth);
  }, [sajuResult?.dayMaster, currentYear, currentMonth]);

  // 월운 데이터
  const monthlyFortune = useMemo(() => {
    if (!sajuResult?.dayMaster) return null;
    return calculateMonthlyFortune(sajuResult.dayMaster, currentYear, currentMonth);
  }, [sajuResult?.dayMaster, currentYear, currentMonth]);

  // 선택한 날의 일운
  const selectedDayFortune = useMemo(() => {
    if (!sajuResult?.dayMaster || !selectedDay) return null;
    const date = new Date(currentYear, currentMonth - 1, selectedDay);
    return calculateDailyFortune(sajuResult.dayMaster, date);
  }, [sajuResult?.dayMaster, currentYear, currentMonth, selectedDay]);

  // 이전/다음 달 이동
  const goToPrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
  };

  // 달력 렌더링을 위한 데이터 계산
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  // 날짜 색상
  const getDayColor = (category: CalendarDay['category']) => {
    switch (category) {
      case 'excellent': return COLORS.success;
      case 'good': return COLORS.info;
      case 'normal': return COLORS.textSecondary;
      case 'caution': return COLORS.warning;
      case 'bad': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const getCategoryEmoji = (category: CalendarDay['category']) => {
    switch (category) {
      case 'excellent': return '🌟';
      case 'good': return '😊';
      case 'normal': return '😐';
      case 'caution': return '😟';
      case 'bad': return '😰';
      default: return '';
    }
  };

  if (!profile || !sajuResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>운세 캘린더</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>프로필 정보가 필요합니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>운세 캘린더</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 월 선택 */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={goToPrevMonth} style={styles.monthButton}>
            <ChevronLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.monthText}>{currentYear}년 {MONTHS[currentMonth - 1]}</Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.monthButton}>
            <ChevronRight size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* 월운 요약 */}
        {monthlyFortune && (
          <View style={styles.monthSummary}>
            <View style={styles.monthSummaryHeader}>
              <Text style={styles.monthSummaryTitle}>이번 달 운세</Text>
              <View style={[styles.monthScoreBadge, {
                backgroundColor: monthlyFortune.score >= 70 ? COLORS.success :
                                monthlyFortune.score >= 50 ? COLORS.info :
                                monthlyFortune.score >= 35 ? COLORS.warning : COLORS.error
              }]}>
                <Text style={styles.monthScoreText}>{monthlyFortune.score}점</Text>
              </View>
            </View>
            <Text style={styles.monthSummaryText}>{monthlyFortune.overview}</Text>

            {/* 좋은 날 / 주의할 날 */}
            <View style={styles.monthDaysRow}>
              {monthlyFortune.luckyDays.length > 0 && (
                <View style={styles.luckyDaysBox}>
                  <Text style={styles.luckyDaysLabel}>🌟 좋은 날</Text>
                  <Text style={styles.luckyDaysText}>
                    {monthlyFortune.luckyDays.join(', ')}일
                  </Text>
                </View>
              )}
              {monthlyFortune.cautionDays.length > 0 && (
                <View style={styles.cautionDaysBox}>
                  <Text style={styles.cautionDaysLabel}>⚠️ 주의할 날</Text>
                  <Text style={styles.cautionDaysText}>
                    {monthlyFortune.cautionDays.join(', ')}일
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* 범례 */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.legendText}>대길</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.info }]} />
            <Text style={styles.legendText}>길</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.textSecondary }]} />
            <Text style={styles.legendText}>보통</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
            <Text style={styles.legendText}>주의</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
            <Text style={styles.legendText}>흉</Text>
          </View>
        </View>

        {/* 캘린더 */}
        <View style={styles.calendar}>
          {/* 요일 헤더 */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((day, index) => (
              <Text
                key={day}
                style={[
                  styles.weekdayText,
                  index === 0 && styles.sundayText,
                  index === 6 && styles.saturdayText,
                ]}
              >
                {day}
              </Text>
            ))}
          </View>

          {/* 날짜 그리드 */}
          <View style={styles.daysGrid}>
            {/* 빈 칸 (월 시작 전) */}
            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
              <View key={`empty-${index}`} style={styles.dayCell} />
            ))}

            {/* 날짜 */}
            {calendarData.map((day) => {
              const isToday =
                today.getFullYear() === currentYear &&
                today.getMonth() + 1 === currentMonth &&
                today.getDate() === day.day;
              const isSelected = selectedDay === day.day;
              const dayOfWeek = (firstDayOfMonth + day.day - 1) % 7;

              return (
                <TouchableOpacity
                  key={day.day}
                  style={[
                    styles.dayCell,
                    isSelected && styles.selectedDayCell,
                    isToday && styles.todayCell,
                  ]}
                  onPress={() => setSelectedDay(day.day)}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: getDayColor(day.category) },
                      dayOfWeek === 0 && styles.sundayText,
                      dayOfWeek === 6 && styles.saturdayText,
                      isSelected && styles.selectedDayText,
                    ]}
                  >
                    {day.day}
                  </Text>
                  <Text style={styles.dayGanji}>
                    {day.ganji.stem}{day.ganji.branch}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 선택한 날 상세 */}
        {selectedDayFortune && (
          <View style={styles.dayDetail}>
            <View style={styles.dayDetailHeader}>
              <Text style={styles.dayDetailTitle}>
                {currentMonth}월 {selectedDay}일 ({selectedDayFortune.ganji.stem}{selectedDayFortune.ganji.branch})
              </Text>
              <Text style={styles.dayDetailEmoji}>
                {getCategoryEmoji(calendarData.find(d => d.day === selectedDay)?.category || 'normal')}
              </Text>
            </View>

            <View style={styles.dayScoreRow}>
              <Text style={styles.dayScoreLabel}>운세 점수</Text>
              <Text style={[styles.dayScore, {
                color: selectedDayFortune.score >= 70 ? COLORS.success :
                      selectedDayFortune.score >= 50 ? COLORS.info :
                      selectedDayFortune.score >= 35 ? COLORS.warning : COLORS.error
              }]}>
                {selectedDayFortune.score}점 ({selectedDayFortune.category})
              </Text>
            </View>

            <Text style={styles.dayOverview}>{selectedDayFortune.overview}</Text>

            {/* 시간대별 운세 */}
            <View style={styles.timeSlots}>
              <View style={styles.timeSlot}>
                <Text style={styles.timeSlotLabel}>🌅 오전</Text>
                <Text style={styles.timeSlotText}>{selectedDayFortune.morning}</Text>
              </View>
              <View style={styles.timeSlot}>
                <Text style={styles.timeSlotLabel}>☀️ 오후</Text>
                <Text style={styles.timeSlotText}>{selectedDayFortune.afternoon}</Text>
              </View>
              <View style={styles.timeSlot}>
                <Text style={styles.timeSlotLabel}>🌙 저녁</Text>
                <Text style={styles.timeSlotText}>{selectedDayFortune.evening}</Text>
              </View>
            </View>

            {/* 행운 정보 */}
            <View style={styles.luckyInfo}>
              <View style={styles.luckyInfoItem}>
                <Text style={styles.luckyInfoLabel}>⏰ 좋은 시간</Text>
                <Text style={styles.luckyInfoValue}>{selectedDayFortune.luckyTime}</Text>
              </View>
              <View style={styles.luckyInfoItem}>
                <Text style={styles.luckyInfoLabel}>🎨 행운의 색</Text>
                <Text style={styles.luckyInfoValue}>{selectedDayFortune.luckyColor}</Text>
              </View>
              <View style={styles.luckyInfoItem}>
                <Text style={styles.luckyInfoLabel}>🔢 행운의 숫자</Text>
                <Text style={styles.luckyInfoValue}>{selectedDayFortune.luckyNumber}</Text>
              </View>
              <View style={styles.luckyInfoItem}>
                <Text style={styles.luckyInfoLabel}>🧭 행운의 방향</Text>
                <Text style={styles.luckyInfoValue}>{selectedDayFortune.luckyDirection}</Text>
              </View>
            </View>

            {/* 조언 */}
            <View style={styles.dayAdvice}>
              <Text style={styles.dayAdviceLabel}>💡 오늘의 조언</Text>
              <Text style={styles.dayAdviceText}>{selectedDayFortune.advice}</Text>
            </View>
          </View>
        )}

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
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  monthButton: {
    padding: SPACING.sm,
  },
  monthText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginHorizontal: SPACING.lg,
  },
  monthSummary: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  monthSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  monthSummaryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  monthScoreBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  monthScoreText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: 'white',
  },
  monthSummaryText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 22,
  },
  monthDaysRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  luckyDaysBox: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  luckyDaysLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: '#065F46',
  },
  luckyDaysText: {
    fontSize: FONT_SIZES.sm,
    color: '#047857',
  },
  cautionDaysBox: {
    flex: 1,
    backgroundColor: '#FFFBEB',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  cautionDaysLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: '#92400E',
  },
  cautionDaysText: {
    fontSize: FONT_SIZES.sm,
    color: '#B45309',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  legendText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  calendar: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  sundayText: {
    color: COLORS.error,
  },
  saturdayText: {
    color: COLORS.info,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: SPACING.xs,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  selectedDayCell: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: BORDER_RADIUS.md,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  dayNumber: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  selectedDayText: {
    color: COLORS.primary,
  },
  dayGanji: {
    fontSize: 8,
    color: COLORS.textSecondary,
  },
  dayDetail: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  dayDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  dayDetailTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  dayDetailEmoji: {
    fontSize: 28,
  },
  dayScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  dayScoreLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  dayScore: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  dayOverview: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  timeSlots: {
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  timeSlot: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  timeSlotLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  timeSlotText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  luckyInfo: {
    backgroundColor: '#F0F9FF',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  luckyInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  luckyInfoLabel: {
    fontSize: FONT_SIZES.sm,
    color: '#0369A1',
  },
  luckyInfoValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: '#0C4A6E',
  },
  dayAdvice: {
    backgroundColor: '#FFFBEB',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  dayAdviceLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: SPACING.xs,
  },
  dayAdviceText: {
    fontSize: FONT_SIZES.sm,
    color: '#B45309',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 50,
  },
});
