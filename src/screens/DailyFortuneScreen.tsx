import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useApp } from '../contexts/AppContext';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../utils/theme';
import { useTodayFortune } from '../hooks/useTodayFortune';
import { SajuCalculator } from '../services/SajuCalculator';
import { StorageService } from '../services/StorageService';
import { SavedPerson } from '../types';


export default function DailyFortuneScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { sajuResult, profile } = useApp();

  // 선택된 날짜 상태
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  // 사람 전환 상태
  const [savedPeople, setSavedPeople] = useState<SavedPerson[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<SavedPerson | null>(null);
  const [showPeoplePicker, setShowPeoplePicker] = useState(false);

  // 저장된 사람 목록 로드 (화면 포커스 시 갱신)
  useFocusEffect(
    useCallback(() => {
      StorageService.getSavedPeople().then(people => setSavedPeople(people)).catch(() => {});
    }, [])
  );

  // 선택된 사람의 사주 계산 (없으면 나의 사주)
  const activeSajuResult = useMemo(() => {
    if (selectedPerson) {
      try {
        const calc = new SajuCalculator(selectedPerson.birthDate, selectedPerson.birthTime);
        return calc.calculate();
      } catch { return sajuResult; }
    }
    return sajuResult;
  }, [selectedPerson, sajuResult]);

  // 선택된 사람의 프로필 (대운 계산용)
  const activeProfile = useMemo(() => {
    if (selectedPerson) {
      return {
        id: selectedPerson.id,
        name: selectedPerson.name,
        birthDate: selectedPerson.birthDate,
        birthTime: selectedPerson.birthTime,
        gender: selectedPerson.gender || 'male' as const,
        calendar: selectedPerson.calendar || 'solar' as const,
        isLeapMonth: selectedPerson.isLeapMonth || false,
        timezone: 'Asia/Seoul',
        createdAt: selectedPerson.createdAt,
        updatedAt: selectedPerson.updatedAt,
      };
    }
    return profile;
  }, [selectedPerson, profile]);

  // 현재 표시되는 이름
  const activeName = selectedPerson ? selectedPerson.name : (profile?.name || '나');

  // DatePickerScreen에서 돌아왔을 때 날짜 업데이트
  useFocusEffect(
    useCallback(() => {
      if (route.params?.selectedDate) {
        const newDate = new Date(route.params.selectedDate);
        setSelectedDate(newDate);
        navigation.setParams({ selectedDate: undefined });
      }
    }, [route.params?.selectedDate, navigation])
  );

  // 날짜 이동 함수
  const goToPrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // 오늘인지 확인
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const todayFortune = useTodayFortune(activeSajuResult, selectedDate, activeProfile);

  if (!activeSajuResult || !todayFortune) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>운세를 불러오는 중...</Text>
      </View>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFC107';
    if (score >= 40) return '#FF9800';
    return '#F44336';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '대길';
    if (score >= 60) return '길';
    if (score >= 40) return '평';
    return '흉';
  };

  // 기본값 처리
  const summary = todayFortune.overall?.summary || '오늘의 운세를 확인하세요.';
  const detail = todayFortune.overall?.detail || '오늘은 평온한 하루가 될 것입니다.';
  const advice = todayFortune.overall?.advice || '차분하게 하루를 보내세요.';
  const wealth = todayFortune.wealth?.advice || '평온한 재물운입니다.';
  const love = todayFortune.love?.advice || '평온한 연애운입니다.';
  const work = todayFortune.work?.advice || '평온한 직장운입니다.';
  const health = todayFortune.health?.advice || '건강에 유의하세요.';
  const color = todayFortune.luckyPoints?.color || '흰색';
  const number = todayFortune.luckyPoints?.number || '3, 7';
  const direction = todayFortune.luckyPoints?.direction || '남쪽';
  const item = todayFortune.luckyPoints?.item || '수첩';
  const goodActivities = todayFortune.activities?.good || ['일상 업무', '정리 정돈'];
  const cautions = todayFortune.caution || ['급한 결정은 피하세요'];

  // 종합 풀이 (카테고리를 하나의 서술형으로 통합)
  const comprehensiveReading = [
    detail,
    '',
    wealth,
    '',
    love,
    '',
    work,
    '',
    health,
  ].join('\n');

  // 날짜 포맷
  const shortDateStr = (() => {
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][selectedDate.getDay()];
    return `${month}/${day} (${dayOfWeek})`;
  })();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 사람 전환 버튼 */}
      <TouchableOpacity
        style={styles.personSelector}
        onPress={() => setShowPeoplePicker(true)}
      >
        <Text style={styles.personIcon}>👤</Text>
        <Text style={styles.personName}>{activeName}</Text>
        <Text style={styles.personArrow}>▼</Text>
      </TouchableOpacity>

      {/* 사람 선택 모달 */}
      <Modal
        visible={showPeoplePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPeoplePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPeoplePicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>운세를 볼 사람 선택</Text>

            {/* 나 (기본) */}
            <TouchableOpacity
              style={[styles.personItem, !selectedPerson && styles.personItemActive]}
              onPress={() => { setSelectedPerson(null); setShowPeoplePicker(false); }}
            >
              <Text style={styles.personItemIcon}>👤</Text>
              <View style={styles.personItemInfo}>
                <Text style={[styles.personItemName, !selectedPerson && styles.personItemNameActive]}>
                  {profile?.name || '나'} (나)
                </Text>
                <Text style={styles.personItemDate}>{profile?.birthDate || ''}</Text>
              </View>
              {!selectedPerson && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>

            {/* 저장된 사람 목록 */}
            {savedPeople.map(person => (
              <TouchableOpacity
                key={person.id}
                style={[styles.personItem, selectedPerson?.id === person.id && styles.personItemActive]}
                onPress={() => { setSelectedPerson(person); setShowPeoplePicker(false); }}
              >
                <Text style={styles.personItemIcon}>👤</Text>
                <View style={styles.personItemInfo}>
                  <Text style={[styles.personItemName, selectedPerson?.id === person.id && styles.personItemNameActive]}>
                    {person.name} {person.relation ? `(${person.relation})` : ''}
                  </Text>
                  <Text style={styles.personItemDate}>{person.birthDate}</Text>
                </View>
                {selectedPerson?.id === person.id && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
            ))}

            {savedPeople.length === 0 && (
              <Text style={styles.emptyText}>저장된 사람이 없어요</Text>
            )}

            {/* 새 사람 추가 */}
            <TouchableOpacity
              style={styles.addPersonBtn}
              onPress={() => { setShowPeoplePicker(false); navigation.navigate('SavedPeople'); }}
            >
              <Text style={styles.addPersonText}>+ 새 사람 추가</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 날짜 선택 네비게이터 */}
      <View style={styles.dateNavigator}>
        <TouchableOpacity
          style={styles.dateArrowBtn}
          onPress={goToPrevDay}
          accessibilityLabel="이전 날짜"
        >
          <Text style={styles.dateArrowText}>◀</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => navigation.navigate('DatePicker', {
            selectedDate: selectedDate.toISOString(),
            returnScreen: 'Daily',
          })}
          accessibilityLabel="날짜 선택"
        >
          <Text style={styles.dateLabelText}>
            {isToday ? '📅 오늘' : '📅 선택'}
          </Text>
          <Text style={styles.dateValueText}>{shortDateStr}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateArrowBtn}
          onPress={goToNextDay}
          accessibilityLabel="다음 날짜"
        >
          <Text style={styles.dateArrowText}>▶</Text>
        </TouchableOpacity>

        {!isToday && (
          <TouchableOpacity
            style={styles.todayBtn}
            onPress={goToToday}
          >
            <Text style={styles.todayBtnText}>오늘</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 날짜 */}
        <View style={styles.header}>
          <Text style={styles.dateText}>{selectedDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })}</Text>
        </View>

        {/* 종합 운세 점수 */}
        <View style={[styles.scoreCard, { backgroundColor: getScoreColor(todayFortune.score || 60) }]}>
          <Text style={styles.scoreLabel}>{activeName}님의 오늘 운세</Text>
          <Text style={styles.scoreValue}>{todayFortune.score || 60}점</Text>
          <Text style={styles.scoreGrade}>{getScoreLabel(todayFortune.score || 60)}</Text>
          <Text style={styles.scoreDesc}>{summary}</Text>
        </View>

        {/* 종합 운세 풀이 */}
        <View style={styles.section}>
          <View style={styles.detailCard}>
            <Text style={styles.detailText}>{comprehensiveReading}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 100,
  },
  // 사람 전환
  personSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  personIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  personName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  personArrow: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  // 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    paddingTop: 120,
  },
  modalContent: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  personItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  personItemActive: {
    backgroundColor: '#FFF8F0',
  },
  personItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  personItemInfo: {
    flex: 1,
  },
  personItemName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  personItemNameActive: {
    color: '#E67E22',
    fontWeight: '700',
  },
  personItemDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checkMark: {
    fontSize: 18,
    color: '#E67E22',
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    paddingVertical: 20,
  },
  addPersonBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 4,
  },
  addPersonText: {
    fontSize: FONT_SIZES.md,
    color: '#3B82F6',
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dateText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  ganjiText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  tenGodText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  scoreCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  scoreLabel: {
    fontSize: FONT_SIZES.md,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  scoreGrade: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 12,
    opacity: 0.95,
  },
  scoreDesc: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  detailTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  detailText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
    flex: 1,
    flexWrap: 'wrap',
  },
  // 날짜 선택 네비게이터 스타일
  dateNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dateArrowBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: COLORS.background,
  },
  dateArrowText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginHorizontal: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
  },
  dateLabelText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  dateValueText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  todayBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  todayBtnText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.white,
  },
});
