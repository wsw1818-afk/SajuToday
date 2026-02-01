/**
 * 계산 검증 화면
 * 사용자의 사주 계산이 정확한지 검증하는 화면
 * - 만세력 데이터와 비교
 * - 계산 과정 상세 설명
 * - 오차 발생 시 원인 안내
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { SajuCalculator } from '../services/SajuCalculator';
import { HEAVENLY_STEMS, EARTHLY_BRANCHES, SEXAGENARY_CYCLE } from '../data/saju';

// 만세력 검증 데이터 (유명인 생일 예시 - 검증용)
const VERIFICATION_SAMPLES = [
  {
    name: '예시 1: 1984년 갑자년',
    birthDate: '1984-02-05',
    birthTime: '12:00',
    expected: { year: '갑자', month: '병인', day: '을미' },
    note: '1984년 2월 5일은 입춘 후이므로 갑자년',
  },
  {
    name: '예시 2: 입춘 전 출생',
    birthDate: '1984-02-03',
    birthTime: '10:00',
    expected: { year: '계해', month: '을축', day: '갑오' },
    note: '입춘(2/4) 전이므로 전년도인 계해년',
  },
  {
    name: '예시 3: 2000년 경진년',
    birthDate: '2000-05-15',
    birthTime: '08:00',
    expected: { year: '경진', month: '신사', day: '기축' },
    note: '밀레니엄 출생자 예시',
  },
];

// 기준일 상수
const BASE_DATE = new Date(1900, 0, 31);
const BASE_GANJI_INDEX = 0;

export default function VerificationScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useApp();
  const { isDark, colors } = useTheme();

  const [testDate, setTestDate] = useState(profile?.birthDate || '1990-01-15');
  const [testTime, setTestTime] = useState(profile?.birthTime || '12:00');
  const [showDetails, setShowDetails] = useState(false);

  // 테스트 날짜로 사주 계산
  const testResult = useMemo(() => {
    try {
      const calculator = new SajuCalculator(testDate, testTime);
      return calculator.calculate();
    } catch (e) {
      return null;
    }
  }, [testDate, testTime]);

  // 계산 과정 상세 정보
  const calculationDetails = useMemo(() => {
    if (!testResult) return null;

    const [year, month, day] = testDate.split('-').map(Number);
    const birthDateObj = new Date(year, month - 1, day);

    // 년주 계산 과정
    let yearForCalc = year;
    const isBeforeLichun = month === 1 || (month === 2 && day < 4);
    if (isBeforeLichun) {
      yearForCalc -= 1;
    }
    const yearIndex = ((yearForCalc - 4) % 60 + 60) % 60;

    // 일주 계산 과정
    const diffTime = birthDateObj.getTime() - BASE_DATE.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const dayIndex = ((diffDays + BASE_GANJI_INDEX) % 60 + 60) % 60;

    // 절기 기준 월 계산
    const solarTermDays: Record<number, number> = {
      1: 6, 2: 4, 3: 6, 4: 5, 5: 6, 6: 6,
      7: 7, 8: 8, 9: 8, 10: 8, 11: 7, 12: 7,
    };
    const termDay = solarTermDays[month] || 6;
    let adjustedMonth = month;
    if (day < termDay) {
      adjustedMonth = month === 1 ? 12 : month - 1;
    }
    const monthIndex = (adjustedMonth + 10) % 12;

    // 시주 계산 과정
    const [hours] = testTime.split(':').map(Number);
    let hourBranchIndex = 0;
    if (hours >= 23 || hours < 1) {
      hourBranchIndex = 0;
    } else {
      hourBranchIndex = Math.floor((hours + 1) / 2);
    }

    return {
      yearCalc: {
        originalYear: year,
        usedYear: yearForCalc,
        isBeforeLichun,
        index: yearIndex,
        formula: `(${yearForCalc} - 4) % 60 = ${yearIndex}`,
      },
      monthCalc: {
        originalMonth: month,
        termDay,
        adjustedMonth,
        monthIndex,
        note: day < termDay ? '절기 이전이므로 전월 사용' : '절기 이후이므로 해당월 사용',
      },
      dayCalc: {
        baseDateStr: '1900년 1월 31일 (갑자일)',
        diffDays,
        index: dayIndex,
        formula: `(${diffDays} + 0) % 60 = ${dayIndex}`,
      },
      hourCalc: {
        hours,
        branchIndex: hourBranchIndex,
        branchName: EARTHLY_BRANCHES[hourBranchIndex].korean,
        timeRange: getTimeRange(hourBranchIndex),
      },
    };
  }, [testDate, testTime, testResult]);

  // 시간대 범위 반환
  function getTimeRange(branchIndex: number): string {
    const ranges = [
      '23:00~01:00 (자시)',
      '01:00~03:00 (축시)',
      '03:00~05:00 (인시)',
      '05:00~07:00 (묘시)',
      '07:00~09:00 (진시)',
      '09:00~11:00 (사시)',
      '11:00~13:00 (오시)',
      '13:00~15:00 (미시)',
      '15:00~17:00 (신시)',
      '17:00~19:00 (유시)',
      '19:00~21:00 (술시)',
      '21:00~23:00 (해시)',
    ];
    return ranges[branchIndex] || '';
  }

  // 외부 만세력 사이트 연결
  const openExternalVerification = () => {
    Alert.alert(
      '외부 만세력 검증',
      '외부 만세력 사이트에서 직접 비교해볼 수 있습니다.',
      [
        {
          text: '만세력 사이트 1',
          onPress: () => Linking.openURL('https://sajuplus.tistory.com/'),
        },
        {
          text: '만세력 사이트 2',
          onPress: () => Linking.openURL('https://www.etoland.co.kr/bbs/board.php?bo_table=etoboard7'),
        },
        { text: '취소', style: 'cancel' },
      ]
    );
  };

  // 샘플 데이터로 테스트
  const runSampleTest = (sample: typeof VERIFICATION_SAMPLES[0]) => {
    setTestDate(sample.birthDate);
    setTestTime(sample.birthTime);
    setShowDetails(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.background : '#FDFBF7' }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backText, { color: isDark ? colors.text : '#1C1917' }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? colors.text : '#1C1917' }]}>
            계산 검증
          </Text>
          <View style={{ width: 44 }} />
        </View>

        {/* 설명 */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? colors.card : '#FEF3C7' }]}>
          <Text style={[styles.infoTitle, { color: isDark ? colors.text : '#92400E' }]}>
            🔍 사주 계산 검증이란?
          </Text>
          <Text style={[styles.infoText, { color: isDark ? colors.textSecondary : '#A16207' }]}>
            입력한 생년월일시로 계산된 사주가 정확한지 확인합니다.{'\n'}
            계산 과정을 상세히 보여주어 검증할 수 있습니다.
          </Text>
        </View>

        {/* 테스트 입력 */}
        <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#1C1917' }]}>
            검증할 날짜 입력
          </Text>

          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: isDark ? colors.textSecondary : '#78716C' }]}>
              생년월일
            </Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: isDark ? colors.background : '#F5F5F4',
                color: isDark ? colors.text : '#1C1917',
              }]}
              value={testDate}
              onChangeText={setTestDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={isDark ? colors.textSecondary : '#A8A29E'}
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: isDark ? colors.textSecondary : '#78716C' }]}>
              출생시간
            </Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: isDark ? colors.background : '#F5F5F4',
                color: isDark ? colors.text : '#1C1917',
              }]}
              value={testTime}
              onChangeText={setTestTime}
              placeholder="HH:MM"
              placeholderTextColor={isDark ? colors.textSecondary : '#A8A29E'}
            />
          </View>
        </View>

        {/* 계산 결과 */}
        {testResult && (
          <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#1C1917' }]}>
              계산 결과
            </Text>

            <View style={styles.pillarsRow}>
              <View style={styles.pillarBox}>
                <Text style={[styles.pillarLabel, { color: isDark ? colors.textSecondary : '#78716C' }]}>
                  시주
                </Text>
                <Text style={[styles.pillarValue, { color: isDark ? colors.text : '#1C1917' }]}>
                  {testResult.pillars.hour ? `${testResult.pillars.hour.stem}${testResult.pillars.hour.branch}` : '-'}
                </Text>
              </View>
              <View style={styles.pillarBox}>
                <Text style={[styles.pillarLabel, { color: isDark ? colors.textSecondary : '#78716C' }]}>
                  일주
                </Text>
                <Text style={[styles.pillarValue, { color: isDark ? colors.text : '#1C1917' }]}>
                  {testResult.pillars.day.stem}{testResult.pillars.day.branch}
                </Text>
              </View>
              <View style={styles.pillarBox}>
                <Text style={[styles.pillarLabel, { color: isDark ? colors.textSecondary : '#78716C' }]}>
                  월주
                </Text>
                <Text style={[styles.pillarValue, { color: isDark ? colors.text : '#1C1917' }]}>
                  {testResult.pillars.month.stem}{testResult.pillars.month.branch}
                </Text>
              </View>
              <View style={styles.pillarBox}>
                <Text style={[styles.pillarLabel, { color: isDark ? colors.textSecondary : '#78716C' }]}>
                  년주
                </Text>
                <Text style={[styles.pillarValue, { color: isDark ? colors.text : '#1C1917' }]}>
                  {testResult.pillars.year.stem}{testResult.pillars.year.branch}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.detailsButton, { backgroundColor: isDark ? colors.primary : '#8B5CF6' }]}
              onPress={() => setShowDetails(!showDetails)}
            >
              <Text style={styles.detailsButtonText}>
                {showDetails ? '계산 과정 숨기기' : '계산 과정 보기'} {showDetails ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 계산 과정 상세 */}
        {showDetails && calculationDetails && (
          <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#1C1917' }]}>
              📐 계산 과정 상세
            </Text>

            {/* 년주 계산 */}
            <View style={[styles.calcBox, { backgroundColor: isDark ? `${colors.primary}20` : '#F3E8FF' }]}>
              <Text style={[styles.calcTitle, { color: isDark ? colors.primary : '#7C3AED' }]}>
                1. 년주 계산
              </Text>
              <Text style={[styles.calcText, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                • 원래 년도: {calculationDetails.yearCalc.originalYear}년
              </Text>
              {calculationDetails.yearCalc.isBeforeLichun && (
                <Text style={[styles.calcText, { color: '#DC2626' }]}>
                  • ⚠️ 입춘(2/4) 이전 출생 → 전년도 사용
                </Text>
              )}
              <Text style={[styles.calcText, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                • 계산에 사용된 년도: {calculationDetails.yearCalc.usedYear}년
              </Text>
              <Text style={[styles.calcText, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                • 공식: {calculationDetails.yearCalc.formula}
              </Text>
              <Text style={[styles.calcText, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                • 60갑자 인덱스 {calculationDetails.yearCalc.index} → {SEXAGENARY_CYCLE[calculationDetails.yearCalc.index]?.stem}{SEXAGENARY_CYCLE[calculationDetails.yearCalc.index]?.branch}
              </Text>
            </View>

            {/* 월주 계산 */}
            <View style={[styles.calcBox, { backgroundColor: isDark ? `${colors.primary}20` : '#DBEAFE' }]}>
              <Text style={[styles.calcTitle, { color: isDark ? colors.primary : '#2563EB' }]}>
                2. 월주 계산
              </Text>
              <Text style={[styles.calcText, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                • 원래 월: {calculationDetails.monthCalc.originalMonth}월
              </Text>
              <Text style={[styles.calcText, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                • 해당 월 절기 시작일: {calculationDetails.monthCalc.termDay}일
              </Text>
              <Text style={[styles.calcText, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                • {calculationDetails.monthCalc.note}
              </Text>
              <Text style={[styles.calcText, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                • 조정된 월: {calculationDetails.monthCalc.adjustedMonth}월 (월 인덱스: {calculationDetails.monthCalc.monthIndex})
              </Text>
            </View>

            {/* 일주 계산 */}
            <View style={[styles.calcBox, { backgroundColor: isDark ? `${colors.primary}20` : '#DCFCE7' }]}>
              <Text style={[styles.calcTitle, { color: isDark ? colors.primary : '#16A34A' }]}>
                3. 일주 계산
              </Text>
              <Text style={[styles.calcText, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                • 기준일: {calculationDetails.dayCalc.baseDateStr}
              </Text>
              <Text style={[styles.calcText, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                • 기준일로부터 경과일: {calculationDetails.dayCalc.diffDays}일
              </Text>
              <Text style={[styles.calcText, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                • 공식: {calculationDetails.dayCalc.formula}
              </Text>
              <Text style={[styles.calcText, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                • 60갑자 인덱스 {calculationDetails.dayCalc.index} → {SEXAGENARY_CYCLE[calculationDetails.dayCalc.index]?.stem}{SEXAGENARY_CYCLE[calculationDetails.dayCalc.index]?.branch}
              </Text>
            </View>

            {/* 시주 계산 */}
            <View style={[styles.calcBox, { backgroundColor: isDark ? `${colors.primary}20` : '#FEF9C3' }]}>
              <Text style={[styles.calcTitle, { color: isDark ? colors.primary : '#CA8A04' }]}>
                4. 시주 계산
              </Text>
              <Text style={[styles.calcText, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                • 출생시간: {calculationDetails.hourCalc.hours}시
              </Text>
              <Text style={[styles.calcText, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                • 시간대: {calculationDetails.hourCalc.timeRange}
              </Text>
              <Text style={[styles.calcText, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                • 시지: {calculationDetails.hourCalc.branchName}
              </Text>
              <Text style={[styles.calcText, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                • 시간은 일간에 따라 결정됨
              </Text>
            </View>
          </View>
        )}

        {/* 검증 샘플 */}
        <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#1C1917' }]}>
            📋 검증 샘플로 테스트
          </Text>
          <Text style={[styles.sampleNote, { color: isDark ? colors.textSecondary : '#78716C' }]}>
            아래 샘플로 계산이 정확한지 확인해보세요
          </Text>

          {VERIFICATION_SAMPLES.map((sample, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.sampleItem, { backgroundColor: isDark ? colors.background : '#F5F5F4' }]}
              onPress={() => runSampleTest(sample)}
            >
              <View style={styles.sampleHeader}>
                <Text style={[styles.sampleName, { color: isDark ? colors.text : '#1C1917' }]}>
                  {sample.name}
                </Text>
                <Text style={[styles.sampleDate, { color: isDark ? colors.textSecondary : '#78716C' }]}>
                  {sample.birthDate} {sample.birthTime}
                </Text>
              </View>
              <Text style={[styles.sampleExpected, { color: isDark ? colors.textSecondary : '#6B7280' }]}>
                예상: {sample.expected.year} {sample.expected.month} {sample.expected.day}
              </Text>
              <Text style={[styles.sampleNoteText, { color: isDark ? colors.primary : '#8B5CF6' }]}>
                💡 {sample.note}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 외부 검증 */}
        <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#1C1917' }]}>
            🌐 외부 만세력과 비교
          </Text>
          <Text style={[styles.externalNote, { color: isDark ? colors.textSecondary : '#78716C' }]}>
            다른 만세력 사이트에서 직접 비교해볼 수 있습니다.
          </Text>
          <TouchableOpacity
            style={[styles.externalButton, { borderColor: isDark ? colors.primary : '#8B5CF6' }]}
            onPress={openExternalVerification}
          >
            <Text style={[styles.externalButtonText, { color: isDark ? colors.primary : '#8B5CF6' }]}>
              외부 만세력 사이트 열기 →
            </Text>
          </TouchableOpacity>
        </View>

        {/* 주의사항 */}
        <View style={[styles.cautionCard, { backgroundColor: isDark ? '#7F1D1D20' : '#FEF2F2' }]}>
          <Text style={[styles.cautionTitle, { color: '#DC2626' }]}>
            ⚠️ 계산 오차가 발생할 수 있는 경우
          </Text>
          <Text style={[styles.cautionText, { color: isDark ? colors.textSecondary : '#991B1B' }]}>
            • 절기 시간을 정확히 계산하지 않은 경우 (약 1일 오차 가능){'\n'}
            • 자시(23:00~01:00) 출생 시 날짜 경계 처리{'\n'}
            • 음력 날짜를 양력으로 잘못 입력한 경우{'\n'}
            • 서머타임 적용 지역 출생자
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputRow: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  pillarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pillarBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  pillarLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  pillarValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  detailsButton: {
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  calcBox: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  calcTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  calcText: {
    fontSize: 13,
    lineHeight: 20,
  },
  sampleNote: {
    fontSize: 13,
    marginBottom: 12,
  },
  sampleItem: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  sampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sampleName: {
    fontSize: 14,
    fontWeight: '600',
  },
  sampleDate: {
    fontSize: 12,
  },
  sampleExpected: {
    fontSize: 13,
    marginBottom: 4,
  },
  sampleNoteText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  externalNote: {
    fontSize: 13,
    marginBottom: 12,
  },
  externalButton: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  externalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cautionCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cautionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  cautionText: {
    fontSize: 12,
    lineHeight: 20,
  },
});
