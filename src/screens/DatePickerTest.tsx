import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function DatePickerTest() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  // 달력 데이터 미리 계산
  const calendarData = useMemo(() => {
    addLog('calendarData 계산 시작');
    try {
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
        year: number;
        month: number;
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
          year,
          month,
          isSelected: dateStr === selectedStr,
          isToday: dateStr === todayStr,
          dayOfWeek: date.getDay(),
        });
      }

      addLog(`calendarData 계산 완료: ${year}년 ${month + 1}월, ${daysInMonth}일`);
      return { year, month, emptyDays, days };
    } catch (error) {
      addLog(`calendarData 오류: ${error}`);
      return { year: 2026, month: 0, emptyDays: [], days: [] };
    }
  }, [calendarMonth, selectedDate]);

  const handleOpenDatePicker = () => {
    addLog('날짜 선택 버튼 클릭');
    try {
      setCalendarMonth(new Date(selectedDate));
      addLog('calendarMonth 설정 완료');
      setShowDatePicker(true);
      addLog('showDatePicker = true 설정 완료');
    } catch (error) {
      addLog(`handleOpenDatePicker 오류: ${error}`);
    }
  };

  const handleSelectDate = (year: number, month: number, day: number) => {
    addLog(`날짜 선택: ${year}-${month + 1}-${day}`);
    try {
      setSelectedDate(new Date(year, month, day));
      setShowDatePicker(false);
      addLog('날짜 선택 완료');
    } catch (error) {
      addLog(`handleSelectDate 오류: ${error}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>날짜 선택기 테스트</Text>

      <TouchableOpacity style={styles.dateButton} onPress={handleOpenDatePicker}>
        <Text style={styles.dateButtonText}>
          {selectedDate.toLocaleDateString('ko-KR')}
        </Text>
        <Text style={styles.dateButtonHint}>터치하여 날짜 선택</Text>
      </TouchableOpacity>

      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>로그:</Text>
        {logs.map((log, i) => (
          <Text key={i} style={styles.logText}>{log}</Text>
        ))}
      </View>

      {/* 단순 모달 테스트 */}
      <Modal
        visible={showDatePicker}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          addLog('모달 닫기 요청');
          setShowDatePicker(false);
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            {/* 헤더 */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>날짜 선택</Text>
              <TouchableOpacity onPress={() => {
                addLog('X 버튼 클릭');
                setShowDatePicker(false);
              }}>
                <X size={24} color="#78716C" />
              </TouchableOpacity>
            </View>

            {/* 년월 */}
            <View style={styles.yearMonth}>
              <TouchableOpacity
                onPress={() => {
                  addLog('이전 월');
                  const newMonth = new Date(calendarMonth);
                  newMonth.setMonth(newMonth.getMonth() - 1);
                  setCalendarMonth(newMonth);
                }}
              >
                <ChevronLeft size={24} color="#78716C" />
              </TouchableOpacity>
              <Text style={styles.yearMonthText}>
                {calendarData.year}년 {calendarData.month + 1}월
              </Text>
              <TouchableOpacity
                onPress={() => {
                  addLog('다음 월');
                  const newMonth = new Date(calendarMonth);
                  newMonth.setMonth(newMonth.getMonth() + 1);
                  setCalendarMonth(newMonth);
                }}
              >
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
                  onPress={() => handleSelectDate(item.year, item.month, item.day)}
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

            {/* 오늘 버튼 */}
            <TouchableOpacity
              style={styles.todayButton}
              onPress={() => {
                addLog('오늘 버튼 클릭');
                const now = new Date();
                setSelectedDate(now);
                setCalendarMonth(now);
                setShowDatePicker(false);
              }}
            >
              <Text style={styles.todayButtonText}>오늘로 이동</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  dateButton: {
    backgroundColor: '#8B5CF6',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  dateButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  dateButtonHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  logContainer: {
    backgroundColor: '#1C1917',
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },
  logTitle: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  logText: {
    color: '#A8A29E',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: width - 40,
    maxWidth: 360,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  yearMonth: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  yearMonthText: {
    fontSize: 16,
    fontWeight: '600',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  weekDay: {
    width: 40,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#78716C',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayEmpty: {
    width: (width - 80) / 7,
    maxWidth: 45,
    height: 40,
  },
  day: {
    width: (width - 80) / 7,
    maxWidth: 45,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  daySelected: {
    backgroundColor: '#8B5CF6',
  },
  dayToday: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  todayButton: {
    marginTop: 16,
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  todayButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
