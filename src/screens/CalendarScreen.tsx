/**
 * 월간 운세 캘린더 화면
 * 한 달의 운세를 한눈에 확인하고 좋은 날/나쁜 날 표시
 */

import React, { useState, useMemo, useCallback } from 'react';
import { COLORS } from '../utils/theme';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { SajuCalculator } from '../services/SajuCalculator';
import { generateFortune } from '../services/FortuneGenerator';

const { width } = Dimensions.get('window');
const DAY_SIZE = Math.floor((width - 48) / 7);

// 요일 배열
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 점수에 따른 색상
const getScoreColor = (score: number, isDark: boolean) => {
  if (score >= 85) return { bg: isDark ? '#166534' : '#DCFCE7', text: isDark ? '#86EFAC' : '#166534' };
  if (score >= 70) return { bg: isDark ? '#3F6212' : '#ECFCCB', text: isDark ? '#BEF264' : '#3F6212' };
  if (score >= 55) return { bg: isDark ? '#854D0E' : '#FEF3C7', text: isDark ? '#FCD34D' : '#92400E' };
  return { bg: isDark ? '#7F1D1D' : '#FEE2E2', text: isDark ? '#FCA5A5' : '#B91C1C' };
};

// 점수에 따른 이모지
const getScoreEmoji = (score: number): string => {
  if (score >= 90) return '✨';
  if (score >= 80) return '🌟';
  if (score >= 70) return '😊';
  if (score >= 60) return '🌱';
  return '⚠️';
};

interface DayFortune {
  date: Date;
  day: number;
  score: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

export default function CalendarScreen() {
  const navigation = useNavigation<any>();
  const { isDark, colors } = useTheme();
  const { profile } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayFortune | null>(null);

  // 사주 계산
  const sajuResult = useMemo(() => {
    if (!profile) return null;
    const calculator = new SajuCalculator(profile.birthDate, profile.birthTime);
    return calculator.calculate();
  }, [profile?.birthDate, profile?.birthTime]);

  // 현재 월의 달력 데이터 생성
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 이번 달 1일
    const firstDay = new Date(year, month, 1);
    // 이번 달 마지막 날
    const lastDay = new Date(year, month + 1, 0);

    // 오늘 날짜
    const today = new Date();
    const todayStr = today.toDateString();

    const days: DayFortune[] = [];

    // 이전 달 날짜 채우기
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      const fortune = sajuResult ? generateFortune(sajuResult, date) : null;
      days.push({
        date,
        day: date.getDate(),
        score: fortune?.scores.overall || 50,
        isCurrentMonth: false,
        isToday: false,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }

    // 이번 달 날짜
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const fortune = sajuResult ? generateFortune(sajuResult, date) : null;
      days.push({
        date,
        day: d,
        score: fortune?.scores.overall || 50,
        isCurrentMonth: true,
        isToday: date.toDateString() === todayStr,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }

    // 다음 달 날짜 채우기 (6주 표시)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      const fortune = sajuResult ? generateFortune(sajuResult, date) : null;
      days.push({
        date,
        day: i,
        score: fortune?.scores.overall || 50,
        isCurrentMonth: false,
        isToday: false,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }

    return days;
  }, [currentDate, sajuResult]);

  // 이번 달 최고의 날들
  const bestDays = useMemo(() => {
    return calendarData
      .filter(d => d.isCurrentMonth)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [calendarData]);

  // 이번 달 주의가 필요한 날들
  const cautionDays = useMemo(() => {
    return calendarData
      .filter(d => d.isCurrentMonth && d.score < 55)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);
  }, [calendarData]);

  // 이전 달로 이동
  const goToPrevMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDay(null);
  }, []);

  // 다음 달로 이동
  const goToNextMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDay(null);
  }, []);

  // 오늘로 이동
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  }, []);

  // 날짜 선택
  const handleDayPress = useCallback((day: DayFortune) => {
    setSelectedDay(day);
  }, []);

  // 선택한 날짜로 운세 보기
  const goToFortune = useCallback(() => {
    if (selectedDay) {
      // MainTabs 내부의 Home 탭으로 이동하면서 파라미터 전달
      navigation.navigate('MainTabs', {
        screen: 'Home',
        params: { selectedDate: selectedDay.date.toISOString() },
      });
    }
  }, [selectedDay, navigation]);

  // 월 이름
  const monthName = useMemo(() => {
    return `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`;
  }, [currentDate]);

  // 날짜 렌더링
  const renderDay = (day: DayFortune, index: number) => {
    const colors = getScoreColor(day.score, isDark);
    const isSelected = selectedDay?.date.toDateString() === day.date.toDateString();

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayCell,
          { width: DAY_SIZE, height: DAY_SIZE },
          !day.isCurrentMonth && styles.dayCellOutside,
          day.isToday && [styles.dayCellToday, { borderColor: isDark ? '#A78BFA' : COLORS.primary }],
          isSelected && [styles.dayCellSelected, { borderColor: isDark ? COLORS.primary : '#4F46E5' }],
        ]}
        onPress={() => handleDayPress(day)}
        activeOpacity={0.7}
      >
        <View style={[styles.dayScoreBg, { backgroundColor: day.isCurrentMonth ? colors.bg : 'transparent' }]}>
          <Text style={[
            styles.dayText,
            { color: day.isCurrentMonth ? colors.text : (isDark ? '#52525B' : '#D4D4D8') },
            day.isWeekend && day.isCurrentMonth && { color: day.date.getDay() === 0 ? COLORS.error : COLORS.info },
          ]}>
            {day.day}
          </Text>
          {day.isCurrentMonth && (
            <Text style={styles.dayEmoji}>{getScoreEmoji(day.score)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : COLORS.card }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={[styles.backText, { color: isDark ? colors.text : COLORS.text }]}>← 뒤로</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: isDark ? '#A1A1AA' : '#78716C' }]}>
            프로필을 먼저 등록해주세요
          </Text>
          <TouchableOpacity
            style={[styles.setupButton, { backgroundColor: isDark ? COLORS.primary : COLORS.primary }]}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.setupButtonText}>프로필 설정하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : COLORS.card }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backText, { color: isDark ? colors.text : COLORS.text }]}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? colors.text : COLORS.text }]}>
            월간 운세
          </Text>
          <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
            <Text style={[styles.todayButtonText, { color: isDark ? '#A5B4FC' : COLORS.primary }]}>오늘</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 월 네비게이션 */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
            <Text style={[styles.navButtonText, { color: isDark ? '#A1A1AA' : '#78716C' }]}>◀ 이전</Text>
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: isDark ? '#E4E4E7' : COLORS.text }]}>
            {monthName}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
            <Text style={[styles.navButtonText, { color: isDark ? '#A1A1AA' : '#78716C' }]}>다음 ▶</Text>
          </TouchableOpacity>
        </View>

        {/* 요일 헤더 */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((day, index) => (
            <View key={day} style={[styles.weekdayCell, { width: DAY_SIZE }]}>
              <Text style={[
                styles.weekdayText,
                { color: isDark ? '#A1A1AA' : '#78716C' },
                index === 0 && { color: COLORS.error },
                index === 6 && { color: COLORS.info },
              ]}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* 캘린더 그리드 */}
        <View style={styles.calendarGrid}>
          {calendarData.map((day, index) => renderDay(day, index))}
        </View>

        {/* 범례 */}
        <View style={[styles.legendSection, { backgroundColor: isDark ? 'rgba(39, 39, 42, 0.8)' : COLORS.card }]}>
          <Text style={[styles.legendTitle, { color: isDark ? '#E4E4E7' : COLORS.text }]}>범례</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: isDark ? '#166534' : '#DCFCE7' }]} />
              <Text style={[styles.legendText, { color: isDark ? '#A1A1AA' : '#78716C' }]}>85점+ 대길</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: isDark ? '#3F6212' : '#ECFCCB' }]} />
              <Text style={[styles.legendText, { color: isDark ? '#A1A1AA' : '#78716C' }]}>70점+ 길</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: isDark ? '#854D0E' : '#FEF3C7' }]} />
              <Text style={[styles.legendText, { color: isDark ? '#A1A1AA' : '#78716C' }]}>55점+ 평</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2' }]} />
              <Text style={[styles.legendText, { color: isDark ? '#A1A1AA' : '#78716C' }]}>55점- 주의</Text>
            </View>
          </View>
        </View>

        {/* 선택된 날짜 정보 */}
        {selectedDay && (
          <View style={[styles.selectedSection, { backgroundColor: isDark ? 'rgba(39, 39, 42, 0.9)' : COLORS.card }]}>
            <View style={styles.selectedHeader}>
              <Text style={[styles.selectedDate, { color: isDark ? '#E4E4E7' : COLORS.text }]}>
                {selectedDay.date.getMonth() + 1}월 {selectedDay.day}일
              </Text>
              <View style={[styles.selectedScoreBadge, { backgroundColor: getScoreColor(selectedDay.score, isDark).bg }]}>
                <Text style={[styles.selectedScore, { color: getScoreColor(selectedDay.score, isDark).text }]}>
                  {selectedDay.score}점 {getScoreEmoji(selectedDay.score)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.viewFortuneButton, { backgroundColor: isDark ? COLORS.primary : COLORS.primary }]}
              onPress={goToFortune}
            >
              <Text style={styles.viewFortuneText}>🔮 상세 운세 보기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 이번 달 요약 */}
        <View style={styles.summarySection}>
          {/* 최고의 날 */}
          <View style={[styles.summaryCard, { backgroundColor: isDark ? 'rgba(22, 101, 52, 0.2)' : '#DCFCE7' }]}>
            <Text style={[styles.summaryTitle, { color: isDark ? '#86EFAC' : '#166534' }]}>
              ✨ 이번 달 최고의 날
            </Text>
            {bestDays.slice(0, 3).map((day, index) => (
              <TouchableOpacity
                key={index}
                style={styles.summaryItem}
                onPress={() => handleDayPress(day)}
              >
                <Text style={[styles.summaryDayText, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                  {day.day}일
                </Text>
                <Text style={[styles.summaryScoreText, { color: isDark ? '#86EFAC' : '#16A34A' }]}>
                  {day.score}점
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 주의가 필요한 날 */}
          {cautionDays.length > 0 && (
            <View style={[styles.summaryCard, { backgroundColor: isDark ? 'rgba(127, 29, 29, 0.2)' : '#FEE2E2' }]}>
              <Text style={[styles.summaryTitle, { color: isDark ? '#FCA5A5' : '#B91C1C' }]}>
                ⚠️ 주의가 필요한 날
              </Text>
              {cautionDays.slice(0, 3).map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.summaryItem}
                  onPress={() => handleDayPress(day)}
                >
                  <Text style={[styles.summaryDayText, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                    {day.day}일
                  </Text>
                  <Text style={[styles.summaryScoreText, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
                    {day.score}점
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
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
    paddingVertical: 8,
    paddingRight: 16,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  todayButton: {
    paddingVertical: 8,
    paddingLeft: 16,
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayCell: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellOutside: {
    opacity: 0.4,
  },
  dayCellToday: {
    borderWidth: 2,
    borderRadius: 8,
  },
  dayCellSelected: {
    borderWidth: 2,
    borderRadius: 8,
  },
  dayScoreBg: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dayEmoji: {
    fontSize: 10,
    marginTop: 1,
  },
  legendSection: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
  selectedSection: {
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedDate: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedScoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  selectedScore: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  viewFortuneButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewFortuneText: {
    color: COLORS.card,
    fontSize: 15,
    fontWeight: 'bold',
  },
  summarySection: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryDayText: {
    fontSize: 14,
  },
  summaryScoreText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 20,
  },
  setupButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  setupButtonText: {
    color: COLORS.card,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
