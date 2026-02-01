import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function DatePickerScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // 전달받은 날짜 또는 오늘 날짜
  const initialDate = route.params?.selectedDate
    ? new Date(route.params.selectedDate)
    : new Date();

  const [calendarMonth, setCalendarMonth] = useState(() => new Date(initialDate));
  const [selectedDate, setSelectedDate] = useState(() => new Date(initialDate));

  // 달력 데이터 계산
  const calendarData = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = new Date().toDateString();
    const selectedStr = selectedDate.toDateString();

    const emptyDays: { key: string }[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      emptyDays.push({ key: `empty-${i}` });
    }

    const days: {
      key: string;
      day: number;
      date: Date;
      isSelected: boolean;
      isToday: boolean;
      dayOfWeek: number;
    }[] = [];

    for (let i = 0; i < daysInMonth; i++) {
      const day = i + 1;
      const date = new Date(year, month, day);
      const dateStr = date.toDateString();
      days.push({
        key: `day-${day}`,
        day,
        date,
        isSelected: dateStr === selectedStr,
        isToday: dateStr === todayStr,
        dayOfWeek: date.getDay(),
      });
    }

    return { year, month, emptyDays, days };
  }, [calendarMonth, selectedDate]);

  // 이전 달
  const handlePrevMonth = () => {
    setCalendarMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  };

  // 다음 달
  const handleNextMonth = () => {
    setCalendarMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  };

  // 날짜 선택
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
  };

  // 확인 버튼
  const handleConfirm = () => {
    // returnScreen 파라미터에 따라 적절한 화면으로 이동
    const returnScreen = route.params?.returnScreen || 'Daily';
    navigation.navigate('MainTabs', {
      screen: returnScreen,
      params: { selectedDate: selectedDate.toISOString() },
    });
  };

  // 오늘로 이동
  const handleGoToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCalendarMonth(today);
  };

  // 닫기
  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>날짜 선택</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#78716C" />
          </TouchableOpacity>
        </View>

        {/* 빠른 선택 버튼 */}
        <View style={styles.quickButtons}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              setSelectedDate(yesterday);
              setCalendarMonth(yesterday);
            }}
          >
            <Text style={styles.quickButtonText}>어제</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickButton, styles.quickButtonActive]}
            onPress={handleGoToToday}
          >
            <Text style={[styles.quickButtonText, styles.quickButtonTextActive]}>오늘</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              setSelectedDate(tomorrow);
              setCalendarMonth(tomorrow);
            }}
          >
            <Text style={styles.quickButtonText}>내일</Text>
          </TouchableOpacity>
        </View>

        {/* 년월 선택 */}
        <View style={styles.yearMonth}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowButton}>
            <ChevronLeft size={24} color="#78716C" />
          </TouchableOpacity>
          <Text style={styles.yearMonthText}>
            {calendarData.year}년 {calendarData.month + 1}월
          </Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.arrowButton}>
            <ChevronRight size={24} color="#78716C" />
          </TouchableOpacity>
        </View>

        {/* 요일 헤더 */}
        <View style={styles.weekHeader}>
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <Text
              key={d}
              style={[
                styles.weekDay,
                i === 0 && { color: '#EF4444' },
                i === 6 && { color: '#3B82F6' },
              ]}
            >
              {d}
            </Text>
          ))}
        </View>

        {/* 날짜 그리드 */}
        <View style={styles.grid}>
          {calendarData.emptyDays.map((item) => (
            <View key={item.key} style={styles.dayEmpty} />
          ))}
          {calendarData.days.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.day,
                item.isSelected && styles.daySelected,
                item.isToday && !item.isSelected && styles.dayToday,
              ]}
              onPress={() => handleSelectDate(item.date)}
            >
              <Text
                style={[
                  styles.dayText,
                  item.isSelected && styles.dayTextSelected,
                  item.dayOfWeek === 0 && !item.isSelected && { color: '#EF4444' },
                  item.dayOfWeek === 6 && !item.isSelected && { color: '#3B82F6' },
                ]}
              >
                {item.day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 선택된 날짜 표시 */}
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedInfoText}>
            선택: {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
          </Text>
        </View>

        {/* 확인 버튼 */}
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>이 날짜로 운세 보기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1917',
  },
  closeButton: {
    padding: 4,
  },
  quickButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  quickButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  quickButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#57534E',
  },
  quickButtonTextActive: {
    color: '#FFFFFF',
  },
  yearMonth: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  arrowButton: {
    padding: 8,
  },
  yearMonthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1917',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  weekDay: {
    width: (width - 40) / 7,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#78716C',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayEmpty: {
    width: (width - 40) / 7,
    height: 48,
  },
  day: {
    width: (width - 40) / 7,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  daySelected: {
    backgroundColor: '#8B5CF6',
  },
  dayToday: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1917',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  selectedInfo: {
    marginTop: 24,
    alignItems: 'center',
  },
  selectedInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  confirmButton: {
    marginTop: 24,
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
