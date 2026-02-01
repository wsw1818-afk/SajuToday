import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { useApp } from '../contexts/AppContext';
import { CalendarType, Gender, UserProfile } from '../types';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import KasiService from '../services/KasiService';

function generateUUID(): string {
  // crypto.getRandomValues를 사용한 안전한 UUID 생성
  const getRandomValues = (typeof crypto !== 'undefined' && crypto.getRandomValues)
    ? (arr: Uint8Array) => crypto.getRandomValues(arr)
    : (arr: Uint8Array) => {
        // 폴백: Math.random() (암호학적으로 안전하지 않음)
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      };
  
  const bytes = new Uint8Array(16);
  getRandomValues(bytes);
  
  // UUID v4 형식으로 변환
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // 버전 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // 변형 10
  
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

// 드롭다운 피커 컴포넌트
interface DropdownPickerProps {
  visible: boolean;
  onClose: () => void;
  options: { label: string; value: string | number }[];
  selectedValue: string | number | null;
  onSelect: (value: string | number) => void;
  title: string;
}

function DropdownPicker({ visible, onClose, options, selectedValue, onSelect, title }: DropdownPickerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => String(item.value)}
            style={styles.optionList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  selectedValue === item.value && styles.optionItemSelected,
                ]}
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
              >
                <Text style={[
                  styles.optionText,
                  selectedValue === item.value && styles.optionTextSelected,
                ]}>
                  {item.label}
                </Text>
                {selectedValue === item.value && (
                  <Text style={styles.optionCheck}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            getItemLayout={(data, index) => ({
              length: 48,
              offset: 48 * index,
              index,
            })}
            initialScrollIndex={
              selectedValue
                ? Math.max(0, options.findIndex(o => o.value === selectedValue) - 3)
                : 0
            }
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function OnboardingScreen() {
  const { calculateSaju, setProfile, setSajuResult, completeOnboarding } = useApp();

  const [name, setName] = useState<string>('');
  // 생년월일 드롭다운 상태
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [birthMonth, setBirthMonth] = useState<number | null>(null);
  const [birthDay, setBirthDay] = useState<number | null>(null);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);

  const [calendar, setCalendar] = useState<CalendarType>('solar');
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [birthTimeText, setBirthTimeText] = useState<string>('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [unknownTime, setUnknownTime] = useState(true);
  const [gender, setGender] = useState<Gender>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [solarBirthDate, setSolarBirthDate] = useState<string>(''); // 양력 변환된 날짜 저장

  // 년도 옵션 생성 (1920 ~ 현재년도)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= 1920; y--) {
      years.push({ label: `${y}년`, value: y });
    }
    return years;
  }, []);

  // 월 옵션 생성 (1 ~ 12)
  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      label: `${i + 1}월`,
      value: i + 1,
    }));
  }, []);

  // 일 옵션 생성 (선택한 년/월에 따라 동적)
  const dayOptions = useMemo(() => {
    let maxDays = 31;
    if (birthYear && birthMonth) {
      // 해당 월의 마지막 날짜 계산
      maxDays = new Date(birthYear, birthMonth, 0).getDate();
    }
    return Array.from({ length: maxDays }, (_, i) => ({
      label: `${i + 1}일`,
      value: i + 1,
    }));
  }, [birthYear, birthMonth]);

  // 생년월일 텍스트 생성 (표시용 - 선택한 달력 기준)
  const birthDateText = useMemo(() => {
    if (birthYear && birthMonth && birthDay) {
      const month = String(birthMonth).padStart(2, '0');
      const day = String(birthDay).padStart(2, '0');
      return `${birthYear}-${month}-${day}`;
    }
    return '';
  }, [birthYear, birthMonth, birthDay]);

  // 시간 텍스트 포맷팅 (HH:MM)
  const formatTimeInput = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    let formatted = '';
    if (numbers.length <= 2) {
      formatted = numbers;
    } else {
      formatted = `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`;
    }
    setBirthTimeText(formatted);
  };

  const handleTimePickerChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const hours = String(selectedTime.getHours()).padStart(2, '0');
      const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
      setBirthTimeText(`${hours}:${minutes}`);
      setUnknownTime(false);
    }
  };

  // 입력값 검증
  const validateInputs = () => {
    // 생년월일 검증 (드롭다운으로 선택)
    if (!birthYear) {
      Alert.alert('입력 오류', '태어난 년도를 선택해주세요.');
      return false;
    }
    if (!birthMonth) {
      Alert.alert('입력 오류', '태어난 월을 선택해주세요.');
      return false;
    }
    if (!birthDay) {
      Alert.alert('입력 오류', '태어난 일을 선택해주세요.');
      return false;
    }

    // 시간 검증 (입력된 경우)
    if (!unknownTime && birthTimeText) {
      const timeMatch = birthTimeText.match(/^(\d{2}):(\d{2})$/);
      if (!timeMatch) {
        Alert.alert('입력 오류', '시간 형식이 올바르지 않습니다.\n예: 14:30');
        return false;
      }
      const [, hours, minutes] = timeMatch;
      if (parseInt(hours) > 23 || parseInt(minutes) > 59) {
        Alert.alert('입력 오류', '올바른 시간을 입력해주세요.');
        return false;
      }
    }

    return true;
  };

  const handleComplete = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    try {
      const timeStr = unknownTime || !birthTimeText ? null : birthTimeText;

      // 음력인 경우 KASI API로 양력 변환
      let finalSolarBirthDate = birthDateText;
      if (calendar === 'lunar' && birthYear && birthMonth && birthDay) {
        try {
          const solarDate = await KasiService.lunarToSolar(
            birthYear,
            birthMonth,
            birthDay,
            isLeapMonth
          );
          if (solarDate) {
            finalSolarBirthDate = solarDate;
            setSolarBirthDate(solarDate); // 상태 저장

          } else {

          }
        } catch (e) {

        }
      } else {
        // 양력이면 그대로 저장
        setSolarBirthDate(birthDateText);
      }

      // 프로필 생성
      // 중요: 사주 계산은 항상 양력 기준으로 하며, birthDate에는 양력 날짜를 저장
      const profile: UserProfile = {
        id: generateUUID(),
        name: name.trim() || '사용자',
        birthDate: finalSolarBirthDate, // 항상 양력으로 저장 (버그 픽스)
        birthTime: timeStr,
        calendar, // 원래 선택한 달력 정보는 별도로 유지
        isLeapMonth: calendar === 'lunar' ? isLeapMonth : false,
        gender,
        timezone: 'Asia/Seoul',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 사주 계산 (양력 기준으로 계산)
      const result = calculateSaju(finalSolarBirthDate, timeStr);

      // 저장
      await setProfile(profile);
      await setSajuResult(result);
      await completeOnboarding();
    } catch (error) {
      console.error('Onboarding error:', error);
      Alert.alert('오류', '정보 저장 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 헤더 */}
          <View style={styles.headerContainer}>
            <Text style={styles.headerEmoji}>☯</Text>
            <Text style={styles.headerTitle}>사주투데이</Text>
            <Text style={styles.headerSubtitle}>운세를 보기 위한 정보를 입력해주세요</Text>
          </View>

          {/* 입력 폼 */}
          <View style={styles.formContainer}>
            {/* 이름 입력 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>이름 (선택)</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="이름을 입력하세요"
                placeholderTextColor={COLORS.textLight}
                maxLength={20}
              />
            </View>

            {/* 생년월일 입력 - 드롭다운 방식 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>생년월일 <Text style={styles.required}>*</Text></Text>
              <View style={styles.dropdownRow}>
                {/* 년도 선택 */}
                <TouchableOpacity
                  style={[styles.dropdownButton, styles.dropdownYear]}
                  onPress={() => setShowYearPicker(true)}
                >
                  <Text style={[
                    styles.dropdownButtonText,
                    !birthYear && styles.dropdownPlaceholder
                  ]}>
                    {birthYear ? `${birthYear}년` : '년도'}
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>

                {/* 월 선택 */}
                <TouchableOpacity
                  style={[styles.dropdownButton, styles.dropdownMonth]}
                  onPress={() => setShowMonthPicker(true)}
                >
                  <Text style={[
                    styles.dropdownButtonText,
                    !birthMonth && styles.dropdownPlaceholder
                  ]}>
                    {birthMonth ? `${birthMonth}월` : '월'}
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>

                {/* 일 선택 */}
                <TouchableOpacity
                  style={[styles.dropdownButton, styles.dropdownDay]}
                  onPress={() => setShowDayPicker(true)}
                >
                  <Text style={[
                    styles.dropdownButtonText,
                    !birthDay && styles.dropdownPlaceholder
                  ]}>
                    {birthDay ? `${birthDay}일` : '일'}
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* 드롭다운 피커 모달들 */}
              <DropdownPicker
                visible={showYearPicker}
                onClose={() => setShowYearPicker(false)}
                options={yearOptions}
                selectedValue={birthYear}
                onSelect={(value) => setBirthYear(value as number)}
                title="년도 선택"
              />
              <DropdownPicker
                visible={showMonthPicker}
                onClose={() => setShowMonthPicker(false)}
                options={monthOptions}
                selectedValue={birthMonth}
                onSelect={(value) => setBirthMonth(value as number)}
                title="월 선택"
              />
              <DropdownPicker
                visible={showDayPicker}
                onClose={() => setShowDayPicker(false)}
                options={dayOptions}
                selectedValue={birthDay}
                onSelect={(value) => setBirthDay(value as number)}
                title="일 선택"
              />
            </View>

            {/* 양력/음력 선택 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>달력 종류</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    calendar === 'solar' && styles.toggleButtonActive,
                  ]}
                  onPress={() => setCalendar('solar')}
                >
                  <Text style={[
                    styles.toggleText,
                    calendar === 'solar' && styles.toggleTextActive,
                  ]}>양력</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    calendar === 'lunar' && styles.toggleButtonActive,
                  ]}
                  onPress={() => setCalendar('lunar')}
                >
                  <Text style={[
                    styles.toggleText,
                    calendar === 'lunar' && styles.toggleTextActive,
                  ]}>음력</Text>
                </TouchableOpacity>
              </View>
              {calendar === 'lunar' && (
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setIsLeapMonth(!isLeapMonth)}
                >
                  <View style={[styles.checkbox, isLeapMonth && styles.checkboxChecked]}>
                    {isLeapMonth && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>윤달</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 태어난 시간 입력 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>태어난 시간 (선택)</Text>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => {
                  setUnknownTime(!unknownTime);
                  if (!unknownTime) setBirthTimeText('');
                }}
              >
                <View style={[styles.checkbox, unknownTime && styles.checkboxChecked]}>
                  {unknownTime && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>시간을 모릅니다</Text>
              </TouchableOpacity>
              {!unknownTime && (
                <View style={styles.dateInputRow}>
                  <TextInput
                    style={[styles.textInput, styles.dateInput]}
                    value={birthTimeText}
                    onChangeText={formatTimeInput}
                    placeholder="14:30"
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                  <TouchableOpacity
                    style={styles.calendarButton}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={styles.calendarButtonText}>⏰</Text>
                  </TouchableOpacity>
                </View>
              )}
              {showTimePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimePickerChange}
                  is24Hour={true}
                />
              )}
            </View>

            {/* 성별 선택 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>성별 (선택)</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'male' && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender(gender === 'male' ? null : 'male')}
                >
                  <Text style={[
                    styles.genderText,
                    gender === 'male' && styles.genderTextActive,
                  ]}>남성</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'female' && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender(gender === 'female' ? null : 'female')}
                >
                  <Text style={[
                    styles.genderText,
                    gender === 'female' && styles.genderTextActive,
                  ]}>여성</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 시작 버튼 */}
          <Button
            title="운세 보러 가기"
            onPress={handleComplete}
            loading={isLoading}
            style={styles.startButton}
          />

          <Text style={styles.privacyNote}>
            입력한 정보는 기기에만 저장되며{'\n'}외부로 전송되지 않습니다.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
    paddingBottom: 60,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingTop: SPACING.md,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  required: {
    color: COLORS.error,
  },
  textInput: {
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dateInput: {
    flex: 1,
  },
  calendarButton: {
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  calendarButtonText: {
    fontSize: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  toggleText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  toggleTextActive: {
    color: COLORS.white,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  checkboxLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  genderButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  genderTextActive: {
    color: COLORS.white,
  },
  startButton: {
    marginBottom: SPACING.md,
  },
  privacyNote: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  // 드롭다운 스타일
  dropdownRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownYear: {
    flex: 2,
  },
  dropdownMonth: {
    flex: 1.2,
  },
  dropdownDay: {
    flex: 1.2,
  },
  dropdownButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    color: COLORS.textLight,
  },
  dropdownArrow: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    width: '100%',
    maxWidth: 320,
    maxHeight: '70%',
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalCloseButton: {
    fontSize: 20,
    color: COLORS.textSecondary,
    padding: SPACING.xs,
  },
  optionList: {
    flexGrow: 0,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionItemSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  optionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  optionCheck: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
  },
});
