import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { useApp } from '../contexts/AppContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Tone, Length, Gender, CalendarType } from '../types';
import KasiService from '../services/KasiService';
import {
  requestNotificationPermission,
  getNotificationEnabled,
  setNotificationEnabled,
  getNotificationTime,
  setNotificationTime,
  sendTestNotification,
} from '../services/NotificationService';
import { useTheme, THEME_OPTIONS, FONT_SIZE_OPTIONS, FontSizeLevel, ThemeMode } from '../contexts/ThemeContext';

const TONE_OPTIONS: { value: Tone; label: string; description: string }[] = [
  { value: 'friendly', label: '친근함', description: '친구처럼 편하게' },
  { value: 'calm', label: '차분함', description: '부드럽고 안정적인' },
  { value: 'funny', label: '유머러스', description: '위트 있는 표현' },
  { value: 'serious', label: '진지함', description: '격식있는 조언' },
];

const LENGTH_OPTIONS: { value: Length; label: string; description: string }[] = [
  { value: 'short', label: '짧게', description: '핵심만 간단히' },
  { value: 'medium', label: '보통', description: '적당한 길이' },
  { value: 'long', label: '자세히', description: '상세한 설명' },
];

export default function SettingsScreen() {
  const { profile, settings, setSettings, setProfile, setSajuResult, calculateSaju, resetApp } = useApp();
  const { mode: themeMode, setMode: setThemeMode, fontSizeLevel, setFontSizeLevel, scaledFontSize } = useTheme();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);

  // 프로필 수정 모달 상태
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(profile?.name || '');
  const [editGender, setEditGender] = useState<Gender>(profile?.gender || null);
  const [editCalendar, setEditCalendar] = useState<CalendarType>(profile?.calendar || 'solar');
  const [isLeapMonth, setIsLeapMonth] = useState(profile?.isLeapMonth || false);
  const [isEditSaving, setIsEditSaving] = useState(false);

  // 드롭다운 선택 상태
  const [editYear, setEditYear] = useState<number | null>(null);
  const [editMonth, setEditMonth] = useState<number | null>(null);
  const [editDay, setEditDay] = useState<number | null>(null);
  const [editHour, setEditHour] = useState<number | null>(null);
  const [editMinute, setEditMinute] = useState<number | null>(null);
  const [unknownTime, setUnknownTime] = useState(false);

  // 드롭다운 피커 표시 상태
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showHourPicker, setShowHourPicker] = useState(false);
  const [showMinutePicker, setShowMinutePicker] = useState(false);

  // 알림 시간 선택 모달 상태
  const [showNotificationTimePicker, setShowNotificationTimePicker] = useState(false);
  const [notificationHour, setNotificationHour] = useState(8);
  const [notificationMinute, setNotificationMinute] = useState(0);

  // 앱 시작 시 알림 설정 로드
  useEffect(() => {
    const loadNotificationSettings = async () => {
      const enabled = await getNotificationEnabled();
      const time = await getNotificationTime();
      setLocalSettings(prev => ({
        ...prev,
        notificationEnabled: enabled,
        notificationTime: `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`,
      }));
      setNotificationHour(time.hour);
      setNotificationMinute(time.minute);
    };
    loadNotificationSettings();
  }, []);

  // 년도 옵션 생성 (1920 ~ 현재)
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear; y >= 1920; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // 월 옵션 (1~12)
  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  // 일 옵션 (월에 따라 동적)
  const dayOptions = useMemo(() => {
    if (!editMonth) return Array.from({ length: 31 }, (_, i) => i + 1);
    const daysInMonth = new Date(editYear || 2000, editMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [editYear, editMonth]);

  // 시간 옵션 (0~23)
  const hourOptions = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  // 분 옵션 (0, 10, 20, 30, 40, 50)
  const minuteOptions = useMemo(() => [0, 10, 20, 30, 40, 50], []);

  const handleToneChange = (tone: Tone) => {
    setLocalSettings(prev => ({ ...prev, tone }));
  };

  const handleLengthChange = (length: Length) => {
    setLocalSettings(prev => ({ ...prev, length }));
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      // 권한 요청
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        Alert.alert(
          '알림 권한 필요',
          '오늘의 운세 알림을 받으려면 알림 권한이 필요합니다. 설정에서 알림 권한을 허용해주세요.',
          [{ text: '확인' }]
        );
        return;
      }
    }

    setLocalSettings(prev => ({ ...prev, notificationEnabled: enabled }));
    await setNotificationEnabled(enabled);

    if (enabled) {
      Alert.alert('알림 설정', `매일 ${notificationHour}시 ${notificationMinute}분에 운세 알림을 보내드립니다.`);
    }
  };

  // 알림 시간 저장
  const handleSaveNotificationTime = async () => {
    const timeStr = `${notificationHour.toString().padStart(2, '0')}:${notificationMinute.toString().padStart(2, '0')}`;
    setLocalSettings(prev => ({ ...prev, notificationTime: timeStr }));
    await setNotificationTime(notificationHour, notificationMinute);
    setShowNotificationTimePicker(false);
    Alert.alert('알림 시간 변경', `매일 ${notificationHour}시 ${notificationMinute}분에 알림을 보내드립니다.`);
  };

  // 테스트 알림 보내기
  const handleTestNotification = async () => {
    await sendTestNotification();
    Alert.alert('테스트 알림', '알림이 전송되었습니다!');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setSettings(localSettings);
      Alert.alert('저장 완료', '설정이 저장되었습니다.');
    } catch (error) {
      Alert.alert('오류', '설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      '앱 초기화',
      '모든 데이터가 삭제됩니다. 정말 초기화하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: async () => {
            await resetApp();
          },
        },
      ]
    );
  };

  // 프로필 수정 모달 열기
  const openEditModal = () => {
    if (profile) {
      setEditName(profile.name);
      setEditGender(profile.gender);
      setEditCalendar(profile.calendar);
      setIsLeapMonth(profile.isLeapMonth || false);

      // 생년월일 파싱
      if (profile.birthDate) {
        const [year, month, day] = profile.birthDate.split('-').map(Number);
        setEditYear(year);
        setEditMonth(month);
        setEditDay(day);
      }

      // 태어난 시간 파싱
      if (profile.birthTime) {
        const [hour, minute] = profile.birthTime.split(':').map(Number);
        setEditHour(hour);
        setEditMinute(minute);
        setUnknownTime(false);
      } else {
        setEditHour(null);
        setEditMinute(null);
        setUnknownTime(true);
      }
    }
    setIsEditModalVisible(true);
  };

  // 프로필 수정 저장
  const handleSaveProfile = async () => {
    // 생년월일 유효성 검사
    if (!editYear || !editMonth || !editDay) {
      Alert.alert('오류', '생년월일을 모두 선택해주세요.');
      return;
    }

    setIsEditSaving(true);
    try {
      if (profile) {
        // 생년월일 포맷
        const birthDateText = `${editYear}-${String(editMonth).padStart(2, '0')}-${String(editDay).padStart(2, '0')}`;

        // 태어난 시간 포맷
        let birthTimeText: string | null = null;
        if (!unknownTime && editHour !== null) {
          const minute = editMinute ?? 0;
          birthTimeText = `${String(editHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        }

        // 음력인 경우 KASI API로 양력 변환
        let solarBirthDate = birthDateText;
        if (editCalendar === 'lunar') {
          try {
            const solarDate = await KasiService.lunarToSolar(
              editYear,
              editMonth,
              editDay,
              isLeapMonth
            );
            if (solarDate) {
              solarBirthDate = solarDate;
              console.log(`음력 ${birthDateText} → 양력 ${solarDate} 변환 완료 (KASI API)`);
            }
          } catch (e) {
            console.log('KASI API 호출 실패, 입력된 날짜 그대로 사용:', e);
          }
        }

        // 프로필 업데이트
        const updatedProfile = {
          ...profile,
          name: editName || profile.name,
          birthDate: birthDateText, // 원래 입력한 날짜 저장
          birthTime: birthTimeText,
          gender: editGender,
          calendar: editCalendar,
          isLeapMonth: editCalendar === 'lunar' ? isLeapMonth : false,
          updatedAt: new Date().toISOString(),
        };
        await setProfile(updatedProfile);

        // 사주 재계산 (양력 기준)
        const newSajuResult = calculateSaju(solarBirthDate, birthTimeText);
        await setSajuResult(newSajuResult);

        Alert.alert('저장 완료', '프로필이 수정되었습니다.\n운세를 새로 확인해주세요.');
        setIsEditModalVisible(false);
      }
    } catch (error) {
      Alert.alert('오류', '프로필 저장에 실패했습니다.');
    } finally {
      setIsEditSaving(false);
    }
  };

  // 시간을 12시간제로 표시
  const formatHourDisplay = (hour: number) => {
    if (hour === 0) return '밤 12시 (자정)';
    if (hour < 12) return `오전 ${hour}시`;
    if (hour === 12) return '낮 12시 (정오)';
    return `오후 ${hour - 12}시`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>설정</Text>
        </View>

        {/* 프로필 정보 */}
        {profile && (
          <Card title="내 정보" style={styles.card}>
            {profile.name && (
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>이름</Text>
                <Text style={styles.profileValue}>{profile.name}</Text>
              </View>
            )}
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>생년월일</Text>
              <Text style={styles.profileValue}>
                {profile.birthDate.replace(/-/g, '.')}
                {profile.calendar === 'lunar' && ' (음력)'}
              </Text>
            </View>
            {profile.birthTime && (
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>태어난 시간</Text>
                <Text style={styles.profileValue}>{profile.birthTime}</Text>
              </View>
            )}
            {profile.gender && (
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>성별</Text>
                <Text style={styles.profileValue}>
                  {profile.gender === 'male' ? '남성' : '여성'}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
              <Text style={styles.editButtonText}>수정</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* 운세 톤 설정 */}
        <Card title="운세 말투" style={styles.card}>
          <View style={styles.optionsGrid}>
            {TONE_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  localSettings.tone === option.value && styles.optionButtonSelected,
                ]}
                onPress={() => handleToneChange(option.value)}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    localSettings.tone === option.value && styles.optionLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
                    localSettings.tone === option.value && styles.optionDescriptionSelected,
                  ]}
                >
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* 운세 길이 설정 */}
        <Card title="운세 길이" style={styles.card}>
          <View style={styles.optionsRow}>
            {LENGTH_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.lengthButton,
                  localSettings.length === option.value && styles.lengthButtonSelected,
                ]}
                onPress={() => handleLengthChange(option.value)}
              >
                <Text
                  style={[
                    styles.lengthLabel,
                    localSettings.length === option.value && styles.lengthLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* 화면 테마 설정 */}
        <Card title="화면 테마" style={styles.card}>
          <View style={styles.themeOptionsRow}>
            {THEME_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.themeButton,
                  themeMode === option.value && styles.themeButtonSelected,
                ]}
                onPress={() => setThemeMode(option.value)}
              >
                <Text style={styles.themeIcon}>{option.icon}</Text>
                <Text
                  style={[
                    styles.themeLabel,
                    themeMode === option.value && styles.themeLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* 글꼴 크기 설정 */}
        <Card title="글꼴 크기" style={styles.card}>
          <View style={styles.fontSizeOptionsRow}>
            {FONT_SIZE_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.fontSizeButton,
                  fontSizeLevel === option.value && styles.fontSizeButtonSelected,
                ]}
                onPress={() => setFontSizeLevel(option.value)}
              >
                <Text
                  style={[
                    styles.fontSizeLabel,
                    fontSizeLevel === option.value && styles.fontSizeLabelSelected,
                    { fontSize: option.value === 'small' ? 12 : option.value === 'medium' ? 14 : option.value === 'large' ? 16 : 18 },
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.fontSizeDescription,
                    fontSizeLevel === option.value && styles.fontSizeDescriptionSelected,
                  ]}
                >
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.fontSizePreview}>
            <Text style={[styles.fontSizePreviewText, { fontSize: scaledFontSize(14) }]}>
              미리보기: 오늘의 운세를 확인해보세요
            </Text>
          </View>
        </Card>

        {/* 알림 설정 */}
        <Card title="알림" style={styles.card}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>매일 운세 알림</Text>
              <Text style={styles.switchDescription}>
                설정한 시간에 오늘의 운세를 알려드려요
              </Text>
            </View>
            <Switch
              value={localSettings.notificationEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: COLORS.border, true: `${COLORS.primary}80` }}
              thumbColor={localSettings.notificationEnabled ? COLORS.primary : COLORS.white}
            />
          </View>
          {localSettings.notificationEnabled && (
            <>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowNotificationTimePicker(true)}
              >
                <Text style={styles.timeLabel}>알림 시간</Text>
                <View style={styles.timeValueRow}>
                  <Text style={styles.timeValue}>{localSettings.notificationTime}</Text>
                  <Text style={styles.timeArrow}>→</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.testNotificationButton}
                onPress={handleTestNotification}
              >
                <Text style={styles.testNotificationText}>알림 테스트</Text>
              </TouchableOpacity>
            </>
          )}
        </Card>

        {/* 저장 버튼 */}
        <Button
          title="설정 저장"
          onPress={handleSave}
          loading={isSaving}
          style={styles.saveButton}
        />

        {/* 앱 정보 */}
        <Card title="앱 정보" style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>버전</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <TouchableOpacity style={styles.infoRow}>
            <Text style={styles.infoLabel}>개인정보 처리방침</Text>
            <Text style={styles.infoArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoRow}>
            <Text style={styles.infoLabel}>이용약관</Text>
            <Text style={styles.infoArrow}>→</Text>
          </TouchableOpacity>
        </Card>

        {/* 초기화 버튼 */}
        <Button
          title="앱 초기화"
          onPress={handleReset}
          variant="ghost"
          style={styles.resetButton}
          textStyle={styles.resetButtonText}
        />

      </ScrollView>

      {/* 프로필 수정 모달 */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>내 정보 수정</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* 이름 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>이름</Text>
                <TextInput
                  style={styles.textInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="이름을 입력하세요"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              {/* 양력/음력 선택 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>달력 유형</Text>
                <View style={styles.segmentControl}>
                  <TouchableOpacity
                    style={[
                      styles.segmentButton,
                      editCalendar === 'solar' && styles.segmentButtonActive,
                    ]}
                    onPress={() => setEditCalendar('solar')}
                  >
                    <Text style={[
                      styles.segmentText,
                      editCalendar === 'solar' && styles.segmentTextActive,
                    ]}>양력</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.segmentButton,
                      editCalendar === 'lunar' && styles.segmentButtonActive,
                    ]}
                    onPress={() => setEditCalendar('lunar')}
                  >
                    <Text style={[
                      styles.segmentText,
                      editCalendar === 'lunar' && styles.segmentTextActive,
                    ]}>음력</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 음력 윤달 선택 */}
              {editCalendar === 'lunar' && (
                <View style={styles.inputGroup}>
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setIsLeapMonth(!isLeapMonth)}
                  >
                    <View style={[styles.checkbox, isLeapMonth && styles.checkboxChecked]}>
                      {isLeapMonth && <Text style={styles.checkboxMark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>윤달</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 생년월일 - 드롭다운 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>생년월일 *</Text>
                <View style={styles.dropdownRow}>
                  {/* 년도 선택 */}
                  <TouchableOpacity
                    style={[styles.dropdownButton, styles.dropdownYear]}
                    onPress={() => setShowYearPicker(true)}
                  >
                    <Text style={[
                      styles.dropdownButtonText,
                      !editYear && styles.dropdownPlaceholder
                    ]}>
                      {editYear ? `${editYear}년` : '년도'}
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
                      !editMonth && styles.dropdownPlaceholder
                    ]}>
                      {editMonth ? `${editMonth}월` : '월'}
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
                      !editDay && styles.dropdownPlaceholder
                    ]}>
                      {editDay ? `${editDay}일` : '일'}
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 태어난 시간 - 드롭다운 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>태어난 시간</Text>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setUnknownTime(!unknownTime)}
                >
                  <View style={[styles.checkbox, unknownTime && styles.checkboxChecked]}>
                    {unknownTime && <Text style={styles.checkboxMark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>모름 / 입력 안함</Text>
                </TouchableOpacity>

                {!unknownTime && (
                  <View style={[styles.dropdownRow, { marginTop: SPACING.sm }]}>
                    {/* 시 선택 */}
                    <TouchableOpacity
                      style={[styles.dropdownButton, { flex: 2 }]}
                      onPress={() => setShowHourPicker(true)}
                    >
                      <Text style={[
                        styles.dropdownButtonText,
                        editHour === null && styles.dropdownPlaceholder
                      ]}>
                        {editHour !== null ? formatHourDisplay(editHour) : '시'}
                      </Text>
                      <Text style={styles.dropdownArrow}>▼</Text>
                    </TouchableOpacity>

                    {/* 분 선택 */}
                    <TouchableOpacity
                      style={[styles.dropdownButton, { flex: 1 }]}
                      onPress={() => setShowMinutePicker(true)}
                    >
                      <Text style={[
                        styles.dropdownButtonText,
                        editMinute === null && styles.dropdownPlaceholder
                      ]}>
                        {editMinute !== null ? `${editMinute}분` : '분'}
                      </Text>
                      <Text style={styles.dropdownArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* 성별 선택 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>성별</Text>
                <View style={styles.segmentControl}>
                  <TouchableOpacity
                    style={[
                      styles.segmentButton,
                      editGender === 'male' && styles.segmentButtonActive,
                    ]}
                    onPress={() => setEditGender('male')}
                  >
                    <Text style={[
                      styles.segmentText,
                      editGender === 'male' && styles.segmentTextActive,
                    ]}>남성</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.segmentButton,
                      editGender === 'female' && styles.segmentButtonActive,
                    ]}
                    onPress={() => setEditGender('female')}
                  >
                    <Text style={[
                      styles.segmentText,
                      editGender === 'female' && styles.segmentTextActive,
                    ]}>여성</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.segmentButton,
                      editGender === null && styles.segmentButtonActive,
                    ]}
                    onPress={() => setEditGender(null)}
                  >
                    <Text style={[
                      styles.segmentText,
                      editGender === null && styles.segmentTextActive,
                    ]}>선택안함</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveProfileButton, isEditSaving && styles.saveProfileButtonDisabled]}
                onPress={handleSaveProfile}
                disabled={isEditSaving}
              >
                <Text style={styles.saveProfileButtonText}>
                  {isEditSaving ? '저장 중...' : '저장'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 년도 피커 모달 */}
      <Modal visible={showYearPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowYearPicker(false)}
        >
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>년도 선택</Text>
              <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                <Text style={styles.pickerClose}>완료</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={yearOptions}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, editYear === item && styles.pickerItemSelected]}
                  onPress={() => { setEditYear(item); setShowYearPicker(false); }}
                >
                  <Text style={[styles.pickerItemText, editYear === item && styles.pickerItemTextSelected]}>
                    {item}년
                  </Text>
                </TouchableOpacity>
              )}
              initialScrollIndex={editYear ? yearOptions.indexOf(editYear) : 0}
              getItemLayout={(_, index) => ({ length: 48, offset: 48 * index, index })}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 월 피커 모달 */}
      <Modal visible={showMonthPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowMonthPicker(false)}
        >
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>월 선택</Text>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                <Text style={styles.pickerClose}>완료</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={monthOptions}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, editMonth === item && styles.pickerItemSelected]}
                  onPress={() => { setEditMonth(item); setShowMonthPicker(false); }}
                >
                  <Text style={[styles.pickerItemText, editMonth === item && styles.pickerItemTextSelected]}>
                    {item}월
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 일 피커 모달 */}
      <Modal visible={showDayPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowDayPicker(false)}
        >
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>일 선택</Text>
              <TouchableOpacity onPress={() => setShowDayPicker(false)}>
                <Text style={styles.pickerClose}>완료</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={dayOptions}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, editDay === item && styles.pickerItemSelected]}
                  onPress={() => { setEditDay(item); setShowDayPicker(false); }}
                >
                  <Text style={[styles.pickerItemText, editDay === item && styles.pickerItemTextSelected]}>
                    {item}일
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 시 피커 모달 */}
      <Modal visible={showHourPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowHourPicker(false)}
        >
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>시간 선택</Text>
              <TouchableOpacity onPress={() => setShowHourPicker(false)}>
                <Text style={styles.pickerClose}>완료</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={hourOptions}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, editHour === item && styles.pickerItemSelected]}
                  onPress={() => { setEditHour(item); setShowHourPicker(false); }}
                >
                  <Text style={[styles.pickerItemText, editHour === item && styles.pickerItemTextSelected]}>
                    {formatHourDisplay(item)}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 분 피커 모달 */}
      <Modal visible={showMinutePicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowMinutePicker(false)}
        >
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>분 선택</Text>
              <TouchableOpacity onPress={() => setShowMinutePicker(false)}>
                <Text style={styles.pickerClose}>완료</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={minuteOptions}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, editMinute === item && styles.pickerItemSelected]}
                  onPress={() => { setEditMinute(item); setShowMinutePicker(false); }}
                >
                  <Text style={[styles.pickerItemText, editMinute === item && styles.pickerItemTextSelected]}>
                    {item}분
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 알림 시간 피커 모달 */}
      <Modal visible={showNotificationTimePicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowNotificationTimePicker(false)}
        >
          <View style={styles.notificationTimeContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>알림 시간 설정</Text>
              <TouchableOpacity onPress={handleSaveNotificationTime}>
                <Text style={styles.pickerClose}>저장</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.notificationTimePickerRow}>
              <View style={styles.notificationTimeColumn}>
                <Text style={styles.notificationTimeLabel}>시</Text>
                <ScrollView style={styles.notificationTimeScroll}>
                  {hourOptions.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.notificationTimeItem,
                        notificationHour === hour && styles.notificationTimeItemSelected,
                      ]}
                      onPress={() => setNotificationHour(hour)}
                    >
                      <Text style={[
                        styles.notificationTimeItemText,
                        notificationHour === hour && styles.notificationTimeItemTextSelected,
                      ]}>
                        {hour.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <Text style={styles.notificationTimeColon}>:</Text>
              <View style={styles.notificationTimeColumn}>
                <Text style={styles.notificationTimeLabel}>분</Text>
                <ScrollView style={styles.notificationTimeScroll}>
                  {[0, 10, 20, 30, 40, 50].map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.notificationTimeItem,
                        notificationMinute === minute && styles.notificationTimeItemSelected,
                      ]}
                      onPress={() => setNotificationMinute(minute)}
                    >
                      <Text style={[
                        styles.notificationTimeItemText,
                        notificationMinute === minute && styles.notificationTimeItemTextSelected,
                      ]}>
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <Text style={styles.notificationTimePreview}>
              매일 {notificationHour.toString().padStart(2, '0')}:{notificationMinute.toString().padStart(2, '0')}에 알림
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 20,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  card: {
    marginBottom: SPACING.md,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  profileLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  profileValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  optionButton: {
    width: '48%',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  optionLabelSelected: {
    color: COLORS.white,
  },
  optionDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  optionDescriptionSelected: {
    color: `${COLORS.white}CC`,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  lengthButton: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  lengthButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  lengthLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  lengthLabelSelected: {
    color: COLORS.white,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  switchDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  timeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  timeLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  timeValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  saveButton: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  infoLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  infoArrow: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  resetButton: {
    marginTop: SPACING.sm,
  },
  resetButtonText: {
    color: COLORS.error,
  },
  // 수정 버튼
  editButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  editButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalClose: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textSecondary,
    padding: SPACING.xs,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: SPACING.lg,
    paddingBottom: 60,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
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
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  segmentControl: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  segmentButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  segmentText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  segmentTextActive: {
    color: COLORS.white,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveProfileButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveProfileButtonDisabled: {
    opacity: 0.6,
  },
  saveProfileButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
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
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  dropdownYear: {
    flex: 2,
  },
  dropdownMonth: {
    flex: 1,
  },
  dropdownDay: {
    flex: 1,
  },
  dropdownButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  dropdownPlaceholder: {
    color: COLORS.textLight,
  },
  dropdownArrow: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  // 체크박스 스타일
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
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
  checkboxMark: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  // 피커 모달 스타일
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    width: '80%',
    maxHeight: '60%',
    ...SHADOWS.lg,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  pickerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  pickerClose: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  pickerItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  pickerItemSelected: {
    backgroundColor: `${COLORS.primary}15`,
  },
  pickerItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  pickerItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  // 알림 관련 스타일
  timeValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeArrow: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  testNotificationButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: BORDER_RADIUS.md,
  },
  testNotificationText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // 알림 시간 피커 모달
  notificationTimeContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    width: '80%',
    ...SHADOWS.lg,
  },
  notificationTimePickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  notificationTimeColumn: {
    alignItems: 'center',
    width: 80,
  },
  notificationTimeLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  notificationTimeScroll: {
    height: 180,
  },
  notificationTimeItem: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  notificationTimeItemSelected: {
    backgroundColor: COLORS.primary,
  },
  notificationTimeItemText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '500',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  notificationTimeItemTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },
  notificationTimeColon: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  notificationTimePreview: {
    textAlign: 'center',
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    paddingBottom: SPACING.lg,
  },
  // 테마 설정 스타일
  themeOptionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  themeButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  themeButtonSelected: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
  },
  themeIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  themeLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  themeLabelSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  // 글꼴 크기 설정 스타일
  fontSizeOptionsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  fontSizeButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fontSizeButtonSelected: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
  },
  fontSizeLabel: {
    color: COLORS.textPrimary,
    fontWeight: '500',
    marginBottom: 2,
  },
  fontSizeLabelSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  fontSizeDescription: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  fontSizeDescriptionSelected: {
    color: COLORS.primary,
  },
  fontSizePreview: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    alignItems: 'center',
  },
  fontSizePreviewText: {
    color: COLORS.textSecondary,
  },
});
