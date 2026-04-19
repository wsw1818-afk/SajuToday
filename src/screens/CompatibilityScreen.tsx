/**
 * 사주 궁합 화면
 * 두 사람의 사주를 비교하여 궁합 분석
 */

import React, { useState, useMemo, useCallback } from 'react';
import { COLORS } from '../utils/theme';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { SajuCalculator } from '../services/SajuCalculator';
import { calculateCompatibility, CompatibilityResult, DetailedCompatibility } from '../services/CompatibilityService';
import { SajuResult, CalendarType } from '../types';
import KasiService from '../services/KasiService';

const { width } = Dimensions.get('window');

// 생년월일 입력 형식 (YYYY-MM-DD)
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// 시진(時辰) 옵션 - 2시간 단위
const TIME_SLOTS = [
  { label: '🌙 자시 (23:00~01:00)', value: '00:00', emoji: '🌙' },
  { label: '🐂 축시 (01:00~03:00)', value: '02:00', emoji: '🐂' },
  { label: '🐅 인시 (03:00~05:00)', value: '04:00', emoji: '🐅' },
  { label: '🐇 묘시 (05:00~07:00)', value: '06:00', emoji: '🐇' },
  { label: '🐲 진시 (07:00~09:00)', value: '08:00', emoji: '🐲' },
  { label: '🐍 사시 (09:00~11:00)', value: '10:00', emoji: '🐍' },
  { label: '🐴 오시 (11:00~13:00)', value: '12:00', emoji: '🐴' },
  { label: '🐑 미시 (13:00~15:00)', value: '14:00', emoji: '🐑' },
  { label: '🐵 신시 (15:00~17:00)', value: '16:00', emoji: '🐵' },
  { label: '🐔 유시 (17:00~19:00)', value: '18:00', emoji: '🐔' },
  { label: '🐕 술시 (19:00~21:00)', value: '20:00', emoji: '🐕' },
  { label: '🐷 해시 (21:00~23:00)', value: '22:00', emoji: '🐷' },
  { label: '❓ 모름 (정오 기준)', value: '12:00', emoji: '❓' },
];

// 드롭다운 피커 컴포넌트
interface DropdownPickerProps {
  visible: boolean;
  onClose: () => void;
  options: { label: string; value: string | number }[];
  selectedValue: string | number | null;
  onSelect: (value: string | number) => void;
  title: string;
  isDark: boolean;
}

function DropdownPicker({ visible, onClose, options, selectedValue, onSelect, title, isDark }: DropdownPickerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={dropdownStyles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[
          dropdownStyles.modalContent,
          { backgroundColor: isDark ? '#27272A' : COLORS.card }
        ]}>
          <View style={[
            dropdownStyles.modalHeader,
            { borderBottomColor: isDark ? '#3F3F46' : COLORS.border }
          ]}>
            <Text style={[dropdownStyles.modalTitle, { color: isDark ? '#E4E4E7' : COLORS.text }]}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[dropdownStyles.modalCloseButton, { color: isDark ? '#A1A1AA' : '#6B7280' }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => String(item.value)}
            style={dropdownStyles.optionList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  dropdownStyles.optionItem,
                  selectedValue === item.value && {
                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(139, 92, 246, 0.1)'
                  },
                ]}
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
              >
                <Text style={[
                  dropdownStyles.optionText,
                  { color: isDark ? '#D4D4D8' : '#44403C' },
                  selectedValue === item.value && { color: isDark ? '#A5B4FC' : '#7C3AED', fontWeight: '600' },
                ]}>
                  {item.label}
                </Text>
                {selectedValue === item.value && (
                  <Text style={[dropdownStyles.optionCheck, { color: isDark ? '#A5B4FC' : '#7C3AED' }]}>✓</Text>
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

export default function CompatibilityScreen() {
  const navigation = useNavigation<any>();
  const { isDark, colors } = useTheme();
  const { profile } = useApp();

  // 내 정보 (프로필에서 가져옴)
  const mySaju = useMemo(() => {
    if (!profile) return null;
    const calculator = new SajuCalculator(profile.birthDate, profile.birthTime);
    return calculator.calculate();
  }, [profile?.birthDate, profile?.birthTime]);

  // 상대방 정보
  const [partnerName, setPartnerName] = useState('');
  // 드롭다운 상태
  const [partnerBirthYear, setPartnerBirthYear] = useState<number | null>(null);
  const [partnerBirthMonth, setPartnerBirthMonth] = useState<number | null>(null);
  const [partnerBirthDay, setPartnerBirthDay] = useState<number | null>(null);
  const [partnerBirthTime, setPartnerBirthTime] = useState('12:00');
  // 양력/음력 선택
  const [partnerCalendar, setPartnerCalendar] = useState<CalendarType>('solar');
  const [partnerIsLeapMonth, setPartnerIsLeapMonth] = useState(false);
  // 피커 표시 상태
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [partnerSaju, setPartnerSaju] = useState<SajuResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

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
    if (partnerBirthYear && partnerBirthMonth) {
      maxDays = new Date(partnerBirthYear, partnerBirthMonth, 0).getDate();
    }
    return Array.from({ length: maxDays }, (_, i) => ({
      label: `${i + 1}일`,
      value: i + 1,
    }));
  }, [partnerBirthYear, partnerBirthMonth]);

  // 생년월일 텍스트 생성 (YYYY-MM-DD)
  const partnerBirthDate = useMemo(() => {
    if (partnerBirthYear && partnerBirthMonth && partnerBirthDay) {
      const month = String(partnerBirthMonth).padStart(2, '0');
      const day = String(partnerBirthDay).padStart(2, '0');
      return `${partnerBirthYear}-${month}-${day}`;
    }
    return '';
  }, [partnerBirthYear, partnerBirthMonth, partnerBirthDay]);

  // 선택된 시진 라벨 가져오기
  const selectedTimeLabel = useMemo(() => {
    const slot = TIME_SLOTS.find(s => s.value === partnerBirthTime);
    return slot ? slot.label : '시간 선택';
  }, [partnerBirthTime]);

  // 궁합 결과
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  // 궁합 분석 실행 (음력 변환 포함)
  const analyzeCompatibility = useCallback(async () => {
    if (!mySaju) {
      Alert.alert('프로필 필요', '먼저 내 프로필을 등록해주세요.');
      return;
    }

    if (!partnerName.trim()) {
      Alert.alert('입력 필요', '상대방 이름을 입력해주세요.');
      return;
    }

    if (!partnerBirthYear || !partnerBirthMonth || !partnerBirthDay) {
      Alert.alert('입력 필요', '상대방 생년월일을 선택해주세요.');
      return;
    }

    setIsCalculating(true);

    try {
      let finalBirthDate = partnerBirthDate;

      // 음력인 경우 KASI API로 양력 변환
      if (partnerCalendar === 'lunar') {
        try {
          const solarDate = await KasiService.lunarToSolar(
            partnerBirthYear,
            partnerBirthMonth,
            partnerBirthDay,
            partnerIsLeapMonth
          );
          if (solarDate) {
            finalBirthDate = solarDate;
          } else {
            Alert.alert('변환 오류', '음력을 양력으로 변환하는데 실패했습니다.');
            setIsCalculating(false);
            return;
          }
        } catch (e) {
          Alert.alert('변환 오류', '음력 변환 중 오류가 발생했습니다.');
          setIsCalculating(false);
          return;
        }
      }

      const calculator = new SajuCalculator(finalBirthDate, partnerBirthTime);
      const partnerResult = calculator.calculate();

      setPartnerSaju(partnerResult);
      const compatibilityResult = calculateCompatibility(mySaju, partnerResult);
      setResult(compatibilityResult);
      setShowResult(true);
    } catch (error) {
      Alert.alert('계산 오류', '사주 계산 중 오류가 발생했습니다.');
    } finally {
      setIsCalculating(false);
    }
  }, [mySaju, partnerName, partnerBirthDate, partnerBirthTime, partnerBirthYear, partnerBirthMonth, partnerBirthDay, partnerCalendar, partnerIsLeapMonth]);

  // 점수에 따른 색상
  const getScoreColor = (score: number): string => {
    if (score >= 80) return isDark ? '#86EFAC' : '#16A34A';
    if (score >= 60) return isDark ? '#FCD34D' : '#D97706';
    return isDark ? '#FCA5A5' : '#DC2626';
  };

  // 점수에 따른 이모지
  const getScoreEmoji = (score: number): string => {
    if (score >= 90) return '💕';
    if (score >= 80) return '💛';
    if (score >= 70) return '💚';
    if (score >= 60) return '🤝';
    if (score >= 50) return '💪';
    return '⚠️';
  };

  // 세부 궁합 카드 렌더링
  const renderDetailCard = (detail: DetailedCompatibility, index: number) => (
    <View
      key={index}
      style={[
        styles.detailCard,
        { backgroundColor: isDark ? 'rgba(39, 39, 42, 0.9)' : COLORS.card }
      ]}
    >
      <View style={styles.detailHeader}>
        <Text style={[styles.detailTitle, { color: isDark ? '#E4E4E7' : COLORS.text }]}>
          {detail.title}
        </Text>
        <View style={[styles.detailScoreBadge, { backgroundColor: getScoreColor(detail.score) + '20' }]}>
          <Text style={[styles.detailScore, { color: getScoreColor(detail.score) }]}>
            {detail.score}점
          </Text>
        </View>
      </View>
      <View style={[styles.detailGradeBadge, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)' }]}>
        <Text style={[styles.detailGrade, { color: isDark ? '#A5B4FC' : COLORS.primary }]}>
          {detail.grade}
        </Text>
      </View>
      <Text style={[styles.detailAnalysis, { color: isDark ? '#A1A1AA' : COLORS.textSecondary }]}>
        {detail.analysis}
      </Text>
      {detail.details.map((d, i) => (
        <Text key={i} style={[styles.detailItem, { color: isDark ? '#D4D4D8' : '#44403C' }]}>
          • {d}
        </Text>
      ))}
    </View>
  );

  // 결과 화면
  if (showResult && result) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : COLORS.card }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowResult(false)} style={styles.backButton}>
              <Text style={[styles.backText, { color: isDark ? colors.text : COLORS.text }]}>← 다시 검색</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 결과 헤더 */}
          <LinearGradient
            colors={result.totalScore >= 70
              ? ['#667eea', '#764ba2']
              : result.totalScore >= 50
              ? ['#f093fb', '#f5576c']
              : ['#4facfe', '#00f2fe']}
            style={styles.resultHeader}
          >
            <Text style={styles.resultEmoji}>{getScoreEmoji(result.totalScore)}</Text>
            <Text style={styles.resultNames}>
              {profile?.name || '나'} & {partnerName}
            </Text>
            <View style={styles.resultScoreCircle}>
              <Text style={styles.resultScoreNumber}>{result.totalScore}</Text>
              <Text style={styles.resultScoreUnit}>점</Text>
            </View>
            <Text style={styles.resultSummary}>{result.summary}</Text>
          </LinearGradient>

          {/* 일주 정보 */}
          <View style={[styles.pillarSection, { backgroundColor: isDark ? 'rgba(39, 39, 42, 0.8)' : COLORS.card }]}>
            <View style={styles.pillarRow}>
              <View style={styles.pillarItem}>
                <Text style={[styles.pillarLabel, { color: isDark ? '#A1A1AA' : '#78716C' }]}>
                  {profile?.name || '나'}의 일주
                </Text>
                <Text style={[styles.pillarValue, { color: isDark ? '#E4E4E7' : COLORS.text }]}>
                  {mySaju?.pillars.day.stem}{mySaju?.pillars.day.branch}
                </Text>
              </View>
              <Text style={styles.vsText}>VS</Text>
              <View style={styles.pillarItem}>
                <Text style={[styles.pillarLabel, { color: isDark ? '#A1A1AA' : '#78716C' }]}>
                  {partnerName}의 일주
                </Text>
                <Text style={[styles.pillarValue, { color: isDark ? '#E4E4E7' : COLORS.text }]}>
                  {partnerSaju?.pillars.day.stem}{partnerSaju?.pillars.day.branch}
                </Text>
              </View>
            </View>
          </View>

          {/* 천간합 정보 (있는 경우) */}
          {result.stemCombination && (
            <View style={[styles.stemComboCard, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.08)' }]}>
              <Text style={[styles.stemComboLabel, { color: isDark ? '#C4B5FD' : '#7C3AED' }]}>
                💫 천간합 발견!
              </Text>
              <Text style={[styles.stemComboName, { color: isDark ? '#E0E7FF' : '#5B21B6' }]}>
                {result.stemCombination.name}
              </Text>
              <Text style={[styles.stemComboDesc, { color: isDark ? '#A5B4FC' : '#7C3AED' }]}>
                운명적인 인연의 징표입니다
              </Text>
            </View>
          )}

          {/* 점수 요약 */}
          <View style={[styles.scoresSection, { backgroundColor: isDark ? 'rgba(39, 39, 42, 0.8)' : COLORS.card }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#E4E4E7' : COLORS.text }]}>
              궁합 점수 분석
            </Text>
            <View style={styles.scoreRow}>
              <View style={styles.scoreItem}>
                <Text style={[styles.scoreLabel, { color: isDark ? '#A1A1AA' : '#78716C' }]}>오행 궁합</Text>
                <Text style={[styles.scoreValue, { color: getScoreColor(result.elementScore) }]}>
                  {result.elementScore}점
                </Text>
              </View>
              <View style={styles.scoreItem}>
                <Text style={[styles.scoreLabel, { color: isDark ? '#A1A1AA' : '#78716C' }]}>지지 궁합</Text>
                <Text style={[styles.scoreValue, { color: getScoreColor(result.branchScore) }]}>
                  {result.branchScore}점
                </Text>
              </View>
              <View style={styles.scoreItem}>
                <Text style={[styles.scoreLabel, { color: isDark ? '#A1A1AA' : '#78716C' }]}>일주 궁합</Text>
                <Text style={[styles.scoreValue, { color: getScoreColor(result.dayPillarScore) }]}>
                  {result.dayPillarScore}점
                </Text>
              </View>
            </View>
          </View>

          {/* 분석 텍스트 */}
          <View style={[styles.analysisSection, { backgroundColor: isDark ? 'rgba(39, 39, 42, 0.8)' : COLORS.card }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#E4E4E7' : COLORS.text }]}>
              상세 분석
            </Text>
            <Text style={[styles.analysisText, { color: isDark ? '#D4D4D8' : '#44403C' }]}>
              {result.elementAnalysis}
            </Text>
            <Text style={[styles.analysisText, { color: isDark ? '#D4D4D8' : '#44403C' }]}>
              {result.branchAnalysis}
            </Text>
            <Text style={[styles.analysisText, { color: isDark ? '#D4D4D8' : '#44403C' }]}>
              {result.dayPillarAnalysis}
            </Text>
          </View>

          {/* 세부 궁합 */}
          <View style={styles.detailsSection}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#E4E4E7' : COLORS.text, marginBottom: 16 }]}>
              세부 궁합
            </Text>
            {renderDetailCard(result.detailedCompatibilities.intimacy, 0)}
            {renderDetailCard(result.detailedCompatibilities.personality, 1)}
            {renderDetailCard(result.detailedCompatibilities.communication, 2)}
            {renderDetailCard(result.detailedCompatibilities.wealth, 3)}
            {renderDetailCard(result.detailedCompatibilities.family, 4)}
            {renderDetailCard(result.detailedCompatibilities.future, 5)}
          </View>

          {/* 조언 */}
          <View style={[styles.adviceSection, { backgroundColor: isDark ? 'rgba(39, 39, 42, 0.8)' : COLORS.card }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#E4E4E7' : COLORS.text }]}>
              💡 궁합 조언
            </Text>
            {result.advice.map((advice, index) => (
              <Text key={index} style={[styles.adviceItem, { color: isDark ? '#D4D4D8' : '#44403C' }]}>
                • {advice}
              </Text>
            ))}
          </View>

          {/* 공유 버튼 */}
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: isDark ? COLORS.primary : COLORS.primary }]}
            onPress={() => {
              Alert.alert('공유', '궁합 결과를 공유합니다! (추후 구현)');
            }}
          >
            <Text style={styles.shareButtonText}>📤 궁합 결과 공유하기</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // 입력 화면
  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : COLORS.card }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backText, { color: isDark ? colors.text : COLORS.text }]}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? colors.text : COLORS.text }]}>
            사주 궁합
          </Text>
          <View style={{ width: 60 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 내 정보 */}
        <View style={[styles.inputSection, { backgroundColor: isDark ? 'rgba(39, 39, 42, 0.8)' : COLORS.card }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#E4E4E7' : COLORS.text }]}>
            👤 내 정보
          </Text>
          {profile ? (
            <View style={styles.myInfoBox}>
              <Text style={[styles.myInfoName, { color: isDark ? '#E4E4E7' : COLORS.text }]}>
                {profile.name}
              </Text>
              <Text style={[styles.myInfoDetail, { color: isDark ? '#A1A1AA' : '#78716C' }]}>
                일주: {mySaju?.pillars.day.stem}{mySaju?.pillars.day.branch}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.setupButton, { borderColor: isDark ? COLORS.primary : COLORS.primary }]}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={[styles.setupButtonText, { color: isDark ? COLORS.primary : COLORS.primary }]}>
                프로필 설정하기
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 상대방 정보 입력 */}
        <View style={[styles.inputSection, { backgroundColor: isDark ? 'rgba(39, 39, 42, 0.8)' : COLORS.card }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#E4E4E7' : COLORS.text }]}>
            💑 상대방 정보
          </Text>

          <Text style={[styles.inputLabel, { color: isDark ? '#A1A1AA' : '#78716C' }]}>이름</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: isDark ? 'rgba(63, 63, 70, 0.5)' : '#F5F5F4',
                color: isDark ? '#E4E4E7' : COLORS.text,
                borderColor: isDark ? 'rgba(82, 82, 91, 0.5)' : COLORS.border,
              }
            ]}
            placeholder="상대방 이름"
            placeholderTextColor={isDark ? '#71717A' : '#A8A29E'}
            value={partnerName}
            onChangeText={setPartnerName}
          />

          <Text style={[styles.inputLabel, { color: isDark ? '#A1A1AA' : '#78716C' }]}>생년월일</Text>

          {/* 양력/음력 선택 */}
          <View style={styles.calendarToggleRow}>
            <TouchableOpacity
              style={[
                styles.calendarToggleButton,
                partnerCalendar === 'solar' && styles.calendarToggleButtonActive,
                { borderColor: isDark ? 'rgba(82, 82, 91, 0.5)' : COLORS.border }
              ]}
              onPress={() => setPartnerCalendar('solar')}
            >
              <Text style={[
                styles.calendarToggleText,
                partnerCalendar === 'solar' && styles.calendarToggleTextActive,
                { color: partnerCalendar === 'solar' ? COLORS.card : (isDark ? '#A1A1AA' : '#78716C') }
              ]}>
                ☀️ 양력
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.calendarToggleButton,
                partnerCalendar === 'lunar' && styles.calendarToggleButtonActive,
                { borderColor: isDark ? 'rgba(82, 82, 91, 0.5)' : COLORS.border }
              ]}
              onPress={() => setPartnerCalendar('lunar')}
            >
              <Text style={[
                styles.calendarToggleText,
                partnerCalendar === 'lunar' && styles.calendarToggleTextActive,
                { color: partnerCalendar === 'lunar' ? COLORS.card : (isDark ? '#A1A1AA' : '#78716C') }
              ]}>
                🌙 음력
              </Text>
            </TouchableOpacity>
            {partnerCalendar === 'lunar' && (
              <TouchableOpacity
                style={[
                  styles.leapMonthButton,
                  partnerIsLeapMonth && styles.leapMonthButtonActive,
                ]}
                onPress={() => setPartnerIsLeapMonth(!partnerIsLeapMonth)}
              >
                <Text style={[
                  styles.leapMonthText,
                  partnerIsLeapMonth && styles.leapMonthTextActive,
                ]}>
                  {partnerIsLeapMonth ? '✓ ' : ''}윤달
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.datePickerRow}>
            {/* 년도 선택 */}
            <TouchableOpacity
              style={[
                styles.datePickerButton,
                {
                  backgroundColor: isDark ? 'rgba(63, 63, 70, 0.5)' : '#F5F5F4',
                  borderColor: isDark ? 'rgba(82, 82, 91, 0.5)' : COLORS.border,
                }
              ]}
              onPress={() => setShowYearPicker(true)}
            >
              <Text style={[
                styles.datePickerButtonText,
                { color: partnerBirthYear ? (isDark ? '#E4E4E7' : COLORS.text) : (isDark ? '#71717A' : '#A8A29E') }
              ]}>
                {partnerBirthYear ? `${partnerBirthYear}년` : '년도'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>

            {/* 월 선택 */}
            <TouchableOpacity
              style={[
                styles.datePickerButton,
                {
                  backgroundColor: isDark ? 'rgba(63, 63, 70, 0.5)' : '#F5F5F4',
                  borderColor: isDark ? 'rgba(82, 82, 91, 0.5)' : COLORS.border,
                }
              ]}
              onPress={() => setShowMonthPicker(true)}
            >
              <Text style={[
                styles.datePickerButtonText,
                { color: partnerBirthMonth ? (isDark ? '#E4E4E7' : COLORS.text) : (isDark ? '#71717A' : '#A8A29E') }
              ]}>
                {partnerBirthMonth ? `${partnerBirthMonth}월` : '월'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>

            {/* 일 선택 */}
            <TouchableOpacity
              style={[
                styles.datePickerButton,
                {
                  backgroundColor: isDark ? 'rgba(63, 63, 70, 0.5)' : '#F5F5F4',
                  borderColor: isDark ? 'rgba(82, 82, 91, 0.5)' : COLORS.border,
                }
              ]}
              onPress={() => setShowDayPicker(true)}
            >
              <Text style={[
                styles.datePickerButtonText,
                { color: partnerBirthDay ? (isDark ? '#E4E4E7' : COLORS.text) : (isDark ? '#71717A' : '#A8A29E') }
              ]}>
                {partnerBirthDay ? `${partnerBirthDay}일` : '일'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.inputLabel, { color: isDark ? '#A1A1AA' : '#78716C' }]}>태어난 시간 (선택)</Text>
          <TouchableOpacity
            style={[
              styles.timePickerButton,
              {
                backgroundColor: isDark ? 'rgba(63, 63, 70, 0.5)' : '#F5F5F4',
                borderColor: isDark ? 'rgba(82, 82, 91, 0.5)' : COLORS.border,
              }
            ]}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={[styles.timePickerButtonText, { color: isDark ? '#E4E4E7' : COLORS.text }]}>
              {selectedTimeLabel}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* 드롭다운 피커들 */}
        <DropdownPicker
          visible={showYearPicker}
          onClose={() => setShowYearPicker(false)}
          options={yearOptions}
          selectedValue={partnerBirthYear}
          onSelect={(value) => setPartnerBirthYear(value as number)}
          title="년도 선택"
          isDark={isDark}
        />
        <DropdownPicker
          visible={showMonthPicker}
          onClose={() => setShowMonthPicker(false)}
          options={monthOptions}
          selectedValue={partnerBirthMonth}
          onSelect={(value) => setPartnerBirthMonth(value as number)}
          title="월 선택"
          isDark={isDark}
        />
        <DropdownPicker
          visible={showDayPicker}
          onClose={() => setShowDayPicker(false)}
          options={dayOptions}
          selectedValue={partnerBirthDay}
          onSelect={(value) => setPartnerBirthDay(value as number)}
          title="일 선택"
          isDark={isDark}
        />
        <DropdownPicker
          visible={showTimePicker}
          onClose={() => setShowTimePicker(false)}
          options={TIME_SLOTS}
          selectedValue={partnerBirthTime}
          onSelect={(value) => setPartnerBirthTime(value as string)}
          title="시진 선택"
          isDark={isDark}
        />

        {/* 분석 버튼 */}
        <TouchableOpacity
          style={[
            styles.analyzeButton,
            { backgroundColor: isDark ? COLORS.primary : COLORS.primary },
            (!profile || !partnerName.trim() || !partnerBirthYear || !partnerBirthMonth || !partnerBirthDay || isCalculating) && styles.analyzeButtonDisabled
          ]}
          onPress={analyzeCompatibility}
          disabled={!profile || !partnerName.trim() || !partnerBirthYear || !partnerBirthMonth || !partnerBirthDay || isCalculating}
        >
          <Text style={styles.analyzeButtonText}>
            {isCalculating ? '⏳ 분석 중...' : '💕 궁합 분석하기'}
          </Text>
        </TouchableOpacity>

        {/* 안내 */}
        <View style={styles.infoBox}>
          <Text style={[styles.infoText, { color: isDark ? '#A1A1AA' : '#78716C' }]}>
            사주 궁합은 두 사람의 사주팔자를 비교하여{'\n'}
            오행의 조화, 지지의 관계, 천간합 등을 분석합니다.
          </Text>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  inputSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  myInfoBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  myInfoName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  myInfoDetail: {
    fontSize: 14,
  },
  setupButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  setupButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  // 양력/음력 토글 스타일
  calendarToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  calendarToggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  calendarToggleButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  calendarToggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  calendarToggleTextActive: {
    color: COLORS.card,
    fontWeight: '600',
  },
  leapMonthButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  leapMonthButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
  },
  leapMonthText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  leapMonthTextActive: {
    fontWeight: '600',
  },
  analyzeButton: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  analyzeButtonDisabled: {
    opacity: 0.5,
  },
  analyzeButtonText: {
    color: COLORS.card,
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  infoText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  // 결과 화면 스타일
  resultHeader: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  resultEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  resultNames: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.card,
    marginBottom: 16,
  },
  resultScoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 16,
  },
  resultScoreNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.card,
  },
  resultScoreUnit: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: -4,
  },
  resultSummary: {
    fontSize: 16,
    color: COLORS.card,
    textAlign: 'center',
    lineHeight: 24,
  },
  pillarSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  pillarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillarItem: {
    flex: 1,
    alignItems: 'center',
  },
  pillarLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  pillarValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  vsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginHorizontal: 16,
  },
  stemComboCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  stemComboLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  stemComboName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  stemComboDesc: {
    fontSize: 13,
  },
  scoresSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreItem: {
    alignItems: 'center',
    flex: 1,
  },
  scoreLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  analysisSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailScoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailScore: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailGradeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  detailGrade: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailAnalysis: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  detailItem: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  adviceSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  adviceItem: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  shareButton: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  shareButtonText: {
    color: COLORS.card,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 날짜 선택 스타일
  datePickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  datePickerButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  timePickerButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

// 드롭다운 피커 스타일
const dropdownStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    maxHeight: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    fontSize: 18,
    fontWeight: '300',
  },
  optionList: {
    maxHeight: 336,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  optionText: {
    fontSize: 15,
  },
  optionCheck: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
