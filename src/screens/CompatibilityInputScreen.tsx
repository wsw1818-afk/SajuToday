import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ArrowLeft, Heart, User, Calendar, Clock, Users, Save, X, ChevronRight, ChevronDown } from 'lucide-react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { useApp } from '../contexts/AppContext';
import { Gender, SavedPerson } from '../types';
import { StorageService } from '../services/StorageService';

// 연도 데이터 생성 (1920~현재)
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1919 }, (_, i) => currentYear - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

// 빠른 연도 선택을 위한 연령대 버튼
const AGE_QUICK_SELECT = [
  { label: '20대', startYear: currentYear - 29, endYear: currentYear - 20 },
  { label: '30대', startYear: currentYear - 39, endYear: currentYear - 30 },
  { label: '40대', startYear: currentYear - 49, endYear: currentYear - 40 },
  { label: '50대', startYear: currentYear - 59, endYear: currentYear - 50 },
  { label: '60대+', startYear: currentYear - 79, endYear: currentYear - 60 },
];

interface PersonInfo {
  name: string;
  birthDate: Date;
  birthTime: Date | null;
  unknownTime: boolean;
  gender: Gender;
  calendar: 'solar' | 'lunar';  // 양력/음력
  isLeapMonth: boolean;  // 윤달 여부
}

// 시간 문자열을 Date 객체로 변환 (컴포넌트 외부로 이동)
function parseTime(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

// Date 객체를 시간 문자열로 변환 (컴포넌트 외부로 이동)
function formatTimeToString(time: Date | null): string | null {
  if (!time) return null;
  const hours = time.getHours();
  const minutes = time.getMinutes();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export default function CompatibilityInputScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { profile, sajuResult, calculateSaju } = useApp();

  // 저장된 사람 목록
  const [savedPeople, setSavedPeople] = useState<SavedPerson[]>([]);
  const [showPeopleModal, setShowPeopleModal] = useState<1 | 2 | null>(null);

  // 본인 정보 (프로필에서 가져오기)
  const [person1, setPerson1] = useState<PersonInfo>({
    name: profile?.name || '나',
    birthDate: profile?.birthDate ? new Date(profile.birthDate) : new Date(1990, 0, 1),
    birthTime: profile?.birthTime ? parseTime(profile.birthTime) : null,
    unknownTime: !profile?.birthTime,
    gender: profile?.gender || null,
    calendar: profile?.calendar || 'solar',
    isLeapMonth: profile?.isLeapMonth || false,
  });

  // 상대방 정보
  const [person2, setPerson2] = useState<PersonInfo>({
    name: '',
    birthDate: new Date(1990, 0, 1),
    birthTime: null,
    unknownTime: false,
    gender: null,
    calendar: 'solar',
    isLeapMonth: false,
  });

  // 날짜/시간 피커 상태
  const [showDatePicker, setShowDatePicker] = useState<{ person: 1 | 2; type: 'date' | 'time' } | null>(null);

  // 커스텀 날짜 선택 모달 상태
  const [showDateModal, setShowDateModal] = useState<{ person: 1 | 2 } | null>(null);
  const [tempYear, setTempYear] = useState(1990);
  const [tempMonth, setTempMonth] = useState(1);
  const [tempDay, setTempDay] = useState(1);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null);

  // 저장된 사람 불러오기
  useFocusEffect(
    useCallback(() => {
      loadSavedPeople();
    }, [])
  );

  // 라우트 파라미터에서 선택된 사람 적용
  useEffect(() => {
    if (route.params?.selectedPerson) {
      const selected = route.params.selectedPerson as SavedPerson;
      setPerson2({
        name: selected.name,
        birthDate: new Date(selected.birthDate),
        birthTime: selected.birthTime ? parseTime(selected.birthTime) : null,
        unknownTime: !selected.birthTime,
        gender: selected.gender,
        calendar: selected.calendar || 'solar',
        isLeapMonth: selected.isLeapMonth || false,
      });
    }
  }, [route.params?.selectedPerson]);

  const loadSavedPeople = async () => {
    const people = await StorageService.getSavedPeople();
    setSavedPeople(people);
  };

  // 저장된 사람 선택
  const handleSelectPerson = (person: SavedPerson, personNum: 1 | 2) => {
    const info: PersonInfo = {
      name: person.name,
      birthDate: new Date(person.birthDate),
      birthTime: person.birthTime ? parseTime(person.birthTime) : null,
      unknownTime: !person.birthTime,
      gender: person.gender,
      calendar: person.calendar || 'solar',
      isLeapMonth: person.isLeapMonth || false,
    };

    if (personNum === 1) {
      setPerson1(info);
    } else {
      setPerson2(info);
    }
    setShowPeopleModal(null);
  };

  // 현재 입력 정보를 저장
  const handleSavePerson = async (person: PersonInfo, personNum: 1 | 2) => {
    if (!person.name.trim()) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return;
    }

    if (!person.gender) {
      Alert.alert('알림', '성별을 선택해주세요.');
      return;
    }

    try {
      const birthDateStr = person.birthDate.toISOString().split('T')[0];
      const birthTimeStr = person.unknownTime || !person.birthTime
        ? null
        : formatTimeToString(person.birthTime);

      const saju = calculateSaju(birthDateStr, birthTimeStr);

      const newPerson: SavedPerson = {
        id: `person_${Date.now()}`,
        name: person.name.trim(),
        birthDate: birthDateStr,
        birthTime: birthTimeStr,
        gender: person.gender,
        calendar: person.calendar,
        isLeapMonth: person.isLeapMonth,
        saju,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await StorageService.savePerson(newPerson);
      await loadSavedPeople();
      Alert.alert('저장 완료', `'${person.name}'님의 정보가 저장되었습니다.`);
    } catch (error) {
      console.error('저장 실패:', error);
      Alert.alert('저장 실패', '정보를 저장하는 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
  };

  // 날짜 모달 열기
  const openDateModal = (personNum: 1 | 2) => {
    const person = personNum === 1 ? person1 : person2;
    setTempYear(person.birthDate.getFullYear());
    setTempMonth(person.birthDate.getMonth() + 1);
    setTempDay(person.birthDate.getDate());
    setSelectedAgeGroup(null);
    setShowDateModal({ person: personNum });
  };

  // 날짜 모달에서 확인 시
  const confirmDateModal = () => {
    if (!showDateModal) return;

    // 해당 월의 최대 일수 계산
    const maxDay = new Date(tempYear, tempMonth, 0).getDate();
    const validDay = Math.min(tempDay, maxDay);

    const newDate = new Date(tempYear, tempMonth - 1, validDay);

    if (showDateModal.person === 1) {
      setPerson1({ ...person1, birthDate: newDate });
    } else {
      setPerson2({ ...person2, birthDate: newDate });
    }
    setShowDateModal(null);
  };

  // 연령대 빠른 선택
  const handleAgeGroupSelect = (group: typeof AGE_QUICK_SELECT[0]) => {
    setSelectedAgeGroup(group.label);
    // 선택된 연령대의 중간 연도로 설정
    const midYear = Math.floor((group.startYear + group.endYear) / 2);
    setTempYear(midYear);
  };

  // 해당 월의 최대 일수 계산
  const maxDaysInMonth = useMemo(() => {
    return new Date(tempYear, tempMonth, 0).getDate();
  }, [tempYear, tempMonth]);

  // 연도 목록 (선택된 연령대 기준 또는 전체)
  const filteredYears = useMemo(() => {
    if (selectedAgeGroup) {
      const group = AGE_QUICK_SELECT.find(g => g.label === selectedAgeGroup);
      if (group) {
        return YEARS.filter(y => y >= group.startYear && y <= group.endYear);
      }
    }
    return YEARS;
  }, [selectedAgeGroup]);

  const formatTime = (time: Date | null) => {
    if (!time) return '선택 안함';
    const hours = time.getHours();
    const minutes = time.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowDatePicker(null);
    }
    if (selectedDate && showDatePicker) {
      if (showDatePicker.person === 1) {
        if (showDatePicker.type === 'date') {
          setPerson1({ ...person1, birthDate: selectedDate });
        } else {
          setPerson1({ ...person1, birthTime: selectedDate, unknownTime: false });
        }
      } else {
        if (showDatePicker.type === 'date') {
          setPerson2({ ...person2, birthDate: selectedDate });
        } else {
          setPerson2({ ...person2, birthTime: selectedDate, unknownTime: false });
        }
      }
    }
  };

  const handleCheckCompatibility = () => {
    // 사주 계산
    const person1DateStr = person1.birthDate.toISOString().split('T')[0];
    const person1TimeStr = person1.unknownTime || !person1.birthTime
      ? null
      : formatTime(person1.birthTime);

    const person2DateStr = person2.birthDate.toISOString().split('T')[0];
    const person2TimeStr = person2.unknownTime || !person2.birthTime
      ? null
      : formatTime(person2.birthTime);

    const saju1 = calculateSaju(person1DateStr, person1TimeStr);
    const saju2 = calculateSaju(person2DateStr, person2TimeStr);

    // 결과 화면으로 이동
    navigation.navigate('CompatibilityResult', {
      person1: {
        name: person1.name || '나',
        birthDate: person1DateStr,
        birthTime: person1TimeStr,
        gender: person1.gender,
        calendar: person1.calendar,
        isLeapMonth: person1.isLeapMonth,
        saju: saju1,
      },
      person2: {
        name: person2.name || '상대방',
        birthDate: person2DateStr,
        birthTime: person2TimeStr,
        gender: person2.gender,
        calendar: person2.calendar,
        isLeapMonth: person2.isLeapMonth,
        saju: saju2,
      },
    });
  };

  const renderPersonInput = (
    person: PersonInfo,
    setPerson: (p: PersonInfo) => void,
    personNum: 1 | 2,
    title: string
  ) => (
    <View style={styles.personCard}>
      <View style={styles.personHeader}>
        <View style={[styles.personIcon, personNum === 1 ? styles.person1Icon : styles.person2Icon]}>
          <User size={20} color="#FFFFFF" />
        </View>
        <Text style={styles.personTitle}>{title}</Text>
        <View style={styles.personActions}>
          {/* 저장된 사람 불러오기 */}
          <TouchableOpacity
            style={styles.actionIconButton}
            onPress={() => setShowPeopleModal(personNum)}
          >
            <Users size={18} color="#6B7280" />
          </TouchableOpacity>
          {/* 현재 정보 저장 */}
          <TouchableOpacity
            style={styles.actionIconButton}
            onPress={() => handleSavePerson(person, personNum)}
          >
            <Save size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 이름 입력 */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>이름</Text>
        <TextInput
          style={styles.textInput}
          value={person.name}
          onChangeText={(text) => setPerson({ ...person, name: text })}
          placeholder="이름을 입력하세요"
          placeholderTextColor={COLORS.textLight}
          maxLength={20}
        />
      </View>

      {/* 음력/양력 선택 */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>달력 종류</Text>
        <View style={styles.calendarRow}>
          {[
            { value: 'solar' as const, label: '양력' },
            { value: 'lunar' as const, label: '음력' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.calendarButton, person.calendar === option.value && styles.calendarButtonActive]}
              onPress={() => setPerson({ ...person, calendar: option.value, isLeapMonth: false })}
            >
              <Text style={[styles.calendarButtonText, person.calendar === option.value && styles.calendarButtonTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          {person.calendar === 'lunar' && (
            <TouchableOpacity
              style={[styles.leapMonthButton, person.isLeapMonth && styles.leapMonthButtonActive]}
              onPress={() => setPerson({ ...person, isLeapMonth: !person.isLeapMonth })}
            >
              <Text style={[styles.leapMonthButtonText, person.isLeapMonth && styles.leapMonthButtonTextActive]}>
                윤달
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 생년월일 */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>생년월일 {person.calendar === 'lunar' ? '(음력)' : '(양력)'}</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => openDateModal(personNum)}
        >
          <Calendar size={18} color={COLORS.textSecondary} />
          <Text style={styles.dateButtonText}>{formatDate(person.birthDate)}</Text>
          <ChevronDown size={18} color={COLORS.textLight} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </View>

      {/* 태어난 시간 */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>태어난 시간</Text>
        <View style={styles.timeRow}>
          <TouchableOpacity
            style={[styles.dateButton, styles.timeButton, person.unknownTime && styles.disabledButton]}
            onPress={() => !person.unknownTime && setShowDatePicker({ person: personNum, type: 'time' })}
            disabled={person.unknownTime}
          >
            <Clock size={18} color={person.unknownTime ? COLORS.textLight : COLORS.textSecondary} />
            <Text style={[styles.dateButtonText, person.unknownTime && styles.disabledText]}>
              {person.unknownTime ? '모름' : formatTime(person.birthTime)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unknownButton, person.unknownTime && styles.unknownButtonActive]}
            onPress={() => setPerson({ ...person, unknownTime: !person.unknownTime, birthTime: null })}
          >
            <Text style={[styles.unknownButtonText, person.unknownTime && styles.unknownButtonTextActive]}>
              모름
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 성별 */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>성별</Text>
        <View style={styles.genderRow}>
          {[
            { value: 'male' as Gender, label: '남성' },
            { value: 'female' as Gender, label: '여성' },
            { value: null as Gender, label: '선택안함' },
          ].map((option) => (
            <TouchableOpacity
              key={option.label}
              style={[styles.genderButton, person.gender === option.value && styles.genderButtonActive]}
              onPress={() => setPerson({ ...person, gender: option.value })}
            >
              <Text style={[styles.genderButtonText, person.gender === option.value && styles.genderButtonTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

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
            <Text style={styles.headerTitle}>궁합 보기</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.headerInfo}>
            <Heart size={32} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.headerSubtitle}>두 사람의 사주로 궁합을 확인해보세요</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 본인 정보 */}
        {renderPersonInput(person1, setPerson1, 1, '첫 번째 사람')}

        {/* 하트 아이콘 */}
        <View style={styles.heartContainer}>
          <View style={styles.heartCircle}>
            <Heart size={24} color="#E91E63" fill="#E91E63" />
          </View>
        </View>

        {/* 상대방 정보 */}
        {renderPersonInput(person2, setPerson2, 2, '두 번째 사람')}

        {/* 궁합 보기 버튼 */}
        <TouchableOpacity
          style={styles.checkButton}
          onPress={handleCheckCompatibility}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#E91E63', '#F06292']}
            style={styles.checkButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Heart size={20} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.checkButtonText}>궁합 확인하기</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Date/Time Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={
            showDatePicker.type === 'date'
              ? (showDatePicker.person === 1 ? person1.birthDate : person2.birthDate)
              : (showDatePicker.person === 1 ? person1.birthTime : person2.birthTime) || new Date()
          }
          mode={showDatePicker.type}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={showDatePicker.type === 'date' ? new Date() : undefined}
          minimumDate={showDatePicker.type === 'date' ? new Date(1900, 0, 1) : undefined}
          is24Hour={true}
        />
      )}

      {/* 저장된 사람 선택 모달 */}
      <Modal
        visible={showPeopleModal !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPeopleModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>저장된 사람 선택</Text>
              <TouchableOpacity onPress={() => setShowPeopleModal(null)}>
                <X size={24} color="#1C1917" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {savedPeople.length === 0 ? (
                <View style={styles.emptyState}>
                  <Users size={40} color="#D6D3D1" />
                  <Text style={styles.emptyText}>저장된 사람이 없습니다</Text>
                  <TouchableOpacity
                    style={styles.manageButton}
                    onPress={() => {
                      setShowPeopleModal(null);
                      navigation.navigate('SavedPeople');
                    }}
                  >
                    <Text style={styles.manageButtonText}>사람 관리하기</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {savedPeople.map(person => (
                    <TouchableOpacity
                      key={person.id}
                      style={styles.personItem}
                      onPress={() => handleSelectPerson(person, showPeopleModal!)}
                    >
                      <View style={styles.personItemAvatar}>
                        <Text style={styles.avatarText}>{person.name[0]}</Text>
                      </View>
                      <View style={styles.personItemInfo}>
                        <Text style={styles.personItemName}>{person.name}</Text>
                        <Text style={styles.personItemDate}>
                          {person.birthDate.replace(/-/g, '.')}
                          {person.relation && ` · ${person.relation}`}
                        </Text>
                      </View>
                      <ChevronRight size={20} color="#D6D3D1" />
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.manageLink}
                    onPress={() => {
                      setShowPeopleModal(null);
                      navigation.navigate('SavedPeople');
                    }}
                  >
                    <Text style={styles.manageLinkText}>저장된 사람 관리</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 날짜 선택 모달 */}
      <Modal
        visible={showDateModal !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDateModal(null)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.dateModalContent} edges={['bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>생년월일 선택</Text>
              <TouchableOpacity onPress={() => setShowDateModal(null)}>
                <X size={24} color="#1C1917" />
              </TouchableOpacity>
            </View>

            {/* 연령대 빠른 선택 */}
            <View style={styles.ageQuickSelect}>
              <Text style={styles.ageQuickLabel}>연령대 선택</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ageButtonsRow}>
                {AGE_QUICK_SELECT.map((group) => (
                  <TouchableOpacity
                    key={group.label}
                    style={[
                      styles.ageButton,
                      selectedAgeGroup === group.label && styles.ageButtonActive,
                    ]}
                    onPress={() => handleAgeGroupSelect(group)}
                  >
                    <Text
                      style={[
                        styles.ageButtonText,
                        selectedAgeGroup === group.label && styles.ageButtonTextActive,
                      ]}
                    >
                      {group.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 연도/월/일 선택 */}
            <View style={styles.datePickerContainer}>
              {/* 연도 선택 */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>연도</Text>
                <View style={styles.pickerWrapper}>
                  <FlatList
                    data={filteredYears}
                    keyExtractor={(item) => item.toString()}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={44}
                    decelerationRate="fast"
                    initialScrollIndex={Math.max(0, filteredYears.indexOf(tempYear))}
                    getItemLayout={(_, index) => ({ length: 44, offset: 44 * index, index })}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.pickerItem, tempYear === item && styles.pickerItemActive]}
                        onPress={() => setTempYear(item)}
                      >
                        <Text style={[styles.pickerItemText, tempYear === item && styles.pickerItemTextActive]}>
                          {item}년
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </View>

              {/* 월 선택 */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>월</Text>
                <View style={styles.pickerWrapper}>
                  <FlatList
                    data={MONTHS}
                    keyExtractor={(item) => item.toString()}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={44}
                    decelerationRate="fast"
                    initialScrollIndex={Math.max(0, tempMonth - 1)}
                    getItemLayout={(_, index) => ({ length: 44, offset: 44 * index, index })}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.pickerItem, tempMonth === item && styles.pickerItemActive]}
                        onPress={() => setTempMonth(item)}
                      >
                        <Text style={[styles.pickerItemText, tempMonth === item && styles.pickerItemTextActive]}>
                          {item}월
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </View>

              {/* 일 선택 */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>일</Text>
                <View style={styles.pickerWrapper}>
                  <FlatList
                    data={DAYS.filter(d => d <= maxDaysInMonth)}
                    keyExtractor={(item) => item.toString()}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={44}
                    decelerationRate="fast"
                    initialScrollIndex={Math.max(0, Math.min(tempDay, maxDaysInMonth) - 1)}
                    getItemLayout={(_, index) => ({ length: 44, offset: 44 * index, index })}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.pickerItem, tempDay === item && styles.pickerItemActive]}
                        onPress={() => setTempDay(item)}
                      >
                        <Text style={[styles.pickerItemText, tempDay === item && styles.pickerItemTextActive]}>
                          {item}일
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </View>
            </View>

            {/* 선택된 날짜 미리보기 */}
            <View style={styles.datePreview}>
              <Text style={styles.datePreviewText}>
                {tempYear}년 {tempMonth}월 {Math.min(tempDay, maxDaysInMonth)}일
              </Text>
              <Text style={styles.datePreviewAge}>
                (만 {currentYear - tempYear}세)
              </Text>
            </View>

            {/* 확인 버튼 */}
            <TouchableOpacity style={styles.confirmButton} onPress={confirmDateModal}>
              <Text style={styles.confirmButtonText}>선택 완료</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F7',
  },
  header: {
    paddingBottom: 24,
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
  headerInfo: {
    alignItems: 'center',
    paddingTop: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
  },
  content: {
    flex: 1,
    marginTop: -16,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 60,
  },
  personCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.md,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  personIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  person1Icon: {
    backgroundColor: '#3B82F6',
  },
  person2Icon: {
    backgroundColor: '#E91E63',
  },
  personTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  dateButtonText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timeButton: {
    flex: 1,
  },
  disabledButton: {
    backgroundColor: '#F3F4F6',
  },
  disabledText: {
    color: COLORS.textLight,
  },
  unknownButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  unknownButtonActive: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  unknownButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  unknownButtonTextActive: {
    color: '#FFFFFF',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  // 음력/양력 선택 스타일
  calendarRow: {
    flexDirection: 'row',
    gap: 10,
  },
  calendarButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  calendarButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  calendarButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  calendarButtonTextActive: {
    color: '#FFFFFF',
  },
  leapMonthButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  leapMonthButtonActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  leapMonthButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  leapMonthButtonTextActive: {
    color: '#FFFFFF',
  },
  heartContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  heartCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  checkButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  checkButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  checkButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // 저장/불러오기 버튼
  personActions: {
    flexDirection: 'row',
    marginLeft: 'auto',
    gap: 8,
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
  },
  modalBody: {
    paddingVertical: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#78716C',
    marginTop: 12,
    marginBottom: 16,
  },
  manageButton: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  personItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  personItemAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6B5B45',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  personItemInfo: {
    flex: 1,
  },
  personItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1917',
    marginBottom: 2,
  },
  personItemDate: {
    fontSize: 13,
    color: '#78716C',
  },
  manageLink: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  manageLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E91E63',
  },
  // 날짜 선택 모달 스타일
  dateModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
  },
  ageQuickSelect: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  ageQuickLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  ageButtonsRow: {
    gap: 8,
  },
  ageButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  ageButtonActive: {
    backgroundColor: '#E91E63',
  },
  ageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  ageButtonTextActive: {
    color: '#FFFFFF',
  },
  datePickerContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  pickerWrapper: {
    height: 176,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerItem: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemActive: {
    backgroundColor: '#FCE7F3',
  },
  pickerItemText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  pickerItemTextActive: {
    fontWeight: '700',
    color: '#E91E63',
  },
  datePreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginHorizontal: 20,
    gap: 8,
  },
  datePreviewText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  datePreviewAge: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  confirmButton: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#E91E63',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
