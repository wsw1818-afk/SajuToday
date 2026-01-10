import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
// DateTimePicker 대신 커스텀 모달 사용 (네이티브 모듈 크래시 방지)
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useApp } from '../contexts/AppContext';
import { SajuWheel, LuckCard, AdviceCard } from '../components/saju';
import { Fortune } from '../types';
import { generateFortune } from '../services/FortuneGenerator';
import { generateComprehensiveFortune, ComprehensiveFortune } from '../services/FortuneTypes';
import { formatDateWithDayOfWeek, formatLunarFromISO } from '../utils/dateFormatter';
import { SajuCalculator } from '../services/SajuCalculator';
import { getStemByKorean } from '../data/saju';

const { width } = Dimensions.get('window');


export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { profile, todayInfo, refreshTodayInfo } = useApp();

  // 모든 useState를 최상단에 선언 (Hook 규칙 준수)
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  // DatePickerScreen에서 전달된 날짜 처리
  useFocusEffect(
    useCallback(() => {
      if (route.params?.selectedDate) {
        const newDate = new Date(route.params.selectedDate);
        setSelectedDate(newDate);
        // 파라미터 초기화 (다음 포커스 시 중복 처리 방지)
        navigation.setParams({ selectedDate: undefined });
      }
    }, [route.params?.selectedDate, navigation])
  );

  // 사주를 실시간으로 재계산 (저장된 데이터의 UTC 버그 문제 해결)
  const sajuResult = useMemo(() => {
    if (!profile) return null;
    const calculator = new SajuCalculator(profile.birthDate, profile.birthTime);
    return calculator.calculate();
  }, [profile?.birthDate, profile?.birthTime]);

  // 선택한 날짜의 타임스탬프 (메모이제이션 의존성용)
  const selectedDateTimestamp = selectedDate.getTime();

  // 선택한 날짜 기준 운세 생성 (메모이제이션)
  const fortune = useMemo(() =>
    generateFortune(sajuResult, selectedDate),
    [sajuResult, selectedDateTimestamp]
  );

  // 오늘 날짜 (실시간 갱신을 위해 selectedDate 변경 시마다 체크)
  const today = useMemo(() => new Date(), [selectedDateTimestamp]);
  const dateStr = useMemo(() => formatDateWithDayOfWeek(today), [today]);

  // 오늘 음력 날짜 (컨텍스트에서 가져옴 - 참고용)
  const lunarStr = useMemo(() =>
    todayInfo?.date ? formatLunarFromISO(todayInfo.date) : '음력 정보 로딩 중',
    [todayInfo?.date]
  );

  // 종합운세 생성 (모든 운세 통합) - 선택한 날짜 기준
  const comprehensiveFortune = useMemo(() => {
    if (!profile?.birthDate || !sajuResult?.dayMaster) return null;
    return generateComprehensiveFortune(
      profile.birthDate,
      sajuResult.dayMaster,
      profile.name || '사용자',
      selectedDate
    );
  }, [profile?.birthDate, profile?.name, sajuResult?.dayMaster, selectedDateTimestamp]);


  // 오늘의 운세 해석 (일진 기반 운세 알고리즘 사용)
  const todayFortuneInterpretation = useMemo(() => {
    if (!fortune || !sajuResult) {
      return {
        main: '운세 정보를 불러오는 중입니다...',
        sub: '',
      };
    }

    try {
      const dayMaster = sajuResult.dayMaster || '갑';

      // fortune 객체에서 일진 기반 운세 데이터 사용
      const overallScore = fortune.scores.overall;
      const todayGanji = fortune.todayGanji; // 해당 날짜의 일진
      const elementAnalysis = fortune.elementAnalysis; // 오행 분석
      const branchAnalysis = fortune.branchAnalysis; // 지지 분석
      const detailedFortunes = fortune.detailedFortunes; // 상세 운세

      // 점수에 따른 운세 해석
      let fortuneLevel = '';
      let fortuneAdvice = '';
      if (overallScore >= 85) {
        fortuneLevel = '매우 좋은 운세';
        fortuneAdvice = detailedFortunes?.overall?.advice || '적극적으로 행동하면 좋은 결과를 얻을 수 있습니다.';
      } else if (overallScore >= 75) {
        fortuneLevel = '좋은 운세';
        fortuneAdvice = detailedFortunes?.overall?.advice || '전반적으로 순조로운 흐름이 예상됩니다.';
      } else if (overallScore >= 65) {
        fortuneLevel = '무난한 운세';
        fortuneAdvice = detailedFortunes?.overall?.advice || '큰 변동 없이 안정적인 하루가 예상됩니다.';
      } else if (overallScore >= 55) {
        fortuneLevel = '주의가 필요한 운세';
        fortuneAdvice = detailedFortunes?.overall?.advice || '작은 실수나 오해가 생길 수 있으니 신중하게 행동하세요.';
      } else {
        fortuneLevel = '조심해야 할 운세';
        fortuneAdvice = detailedFortunes?.overall?.advice || '예상치 못한 변수가 생길 수 있습니다.';
      }

      // 일간 해석
      const dayMasterMeaning: Record<string, string> = {
        '갑': '굳센 나무처럼 곧은 심성을 가진',
        '을': '유연한 풀처럼 적응력이 뛰어난',
        '병': '밝은 태양처럼 활발한 에너지를 가진',
        '정': '따뜻한 촛불처럼 섬세한 마음을 가진',
        '무': '높은 산처럼 듬직한 신뢰감을 가진',
        '기': '비옥한 땅처럼 포용력이 넓은',
        '경': '단단한 쇠처럼 의지가 강한',
        '신': '빛나는 보석처럼 섬세한 감각을 가진',
        '임': '넓은 바다처럼 지혜가 깊은',
        '계': '맑은 시냇물처럼 순수한 마음을 가진',
      };

      const dayMasterDesc = dayMasterMeaning[dayMaster] || '고유한 기운을 가진';

      // 일진 정보 포함 (날짜별로 다른 간지)
      const ganjiInfo = todayGanji ? `\n\n📅 일진: ${todayGanji.fullName}` : '';

      // 오행 관계 분석 추가
      const elementInfo = elementAnalysis?.relation
        ? `\n${elementAnalysis.relationDescription || ''}`
        : '';

      // 지지 관계 분석 추가
      const branchInfo = branchAnalysis?.relation && branchAnalysis.relation !== '무관계'
        ? `\n${branchAnalysis.simpleExplanation || branchAnalysis.relationDescription || ''}`
        : '';

      // 키워드 (fortune 객체에서 가져옴)
      const keywords = fortune.keywords || ['성장', '발전', '기회'];
      const keywordText = keywords.join("', '");

      // 종합 해석 생성 (일진 기반)
      const mainText = `${dayMasterDesc} ${profile?.name || '당신'}님의 운세는 ${overallScore}점으로 "${fortuneLevel}"입니다.${ganjiInfo}${elementInfo}${branchInfo}\n\n` +
        `${fortuneAdvice}\n\n` +
        `오늘의 키워드: '${keywordText}'`;

      // 부가 정보 (fortune 객체에서 가져옴)
      const luckyInfo = fortune.luckyInfo || { color: '초록색', number: '3, 8', direction: '동쪽' };
      const subText = `💡 행운의 색상: ${luckyInfo.color} | 행운의 숫자: ${luckyInfo.number} | 길한 방향: ${luckyInfo.direction}`;

      return { main: mainText, sub: subText };
    } catch (error) {
      console.error('운세 해석 생성 오류:', error);
      return {
        main: '오늘 하루도 긍정적인 마음으로 시작해보세요.',
        sub: '',
      };
    }
  }, [fortune, sajuResult, profile?.name, selectedDateTimestamp]);

  // 커스텀 모달에서는 handleDateChange가 필요 없음 (모달 내에서 직접 처리)

  // 오늘로 돌아가기
  const handleResetToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  // 이전 날짜로 이동
  const handlePrevDay = useCallback(() => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  }, []);

  // 다음 날짜로 이동
  const handleNextDay = useCallback(() => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  }, []);


  // 선택한 날짜가 오늘인지 확인
  const isToday = useMemo(() => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  }, [selectedDate]);

  // 선택한 날짜가 미래인지 확인
  const isFuture = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected > today;
  }, [selectedDate]);

  // 선택한 날짜 포맷
  const selectedDateStr = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][selectedDate.getDay()];
    return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
  }, [selectedDate]);

  // 상단 헤더용 짧은 날짜 포맷
  const headerDateStr = useMemo(() => {
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][selectedDate.getDay()];
    return `${month}월 ${day}일 (${dayOfWeek})`;
  }, [selectedDate]);

  // 선택 날짜 음력 정보 (실제 음력 변환 적용)
  const selectedLunarStr = useMemo(() => {
    try {
      // 선택한 날짜의 실제 음력 계산
      return formatLunarFromISO(selectedDate.toISOString());
    } catch {
      // 변환 실패 시 기본 표시
      const month = selectedDate.getMonth() + 1;
      const day = selectedDate.getDate();
      return `음력 ${month}월 ${day}일 (추정)`;
    }
  }, [selectedDate]);

  // 핸들러 메모이제이션
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshTodayInfo();
    // 선택 날짜가 오늘이면 오늘로 리셋
    if (isToday) {
      setSelectedDate(new Date());
    }
    setIsRefreshing(false);
  }, [refreshTodayInfo, isToday]);


  const handleOpenMenu = useCallback(() => {
    navigation.navigate('Menu');
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFBF7" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.iconButton} onPress={handleOpenMenu}>
              <Text style={styles.menuIconButton}>☰</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>나의 사주팔자</Text>
            <Text style={styles.subTitle}>당신의 운명을 확인해보세요</Text>
          </View>

          {/* Saju Wheel */}
          <SajuWheel
            dayPillar={sajuResult?.pillars.day}
            yearPillar={sajuResult?.pillars.year}
            monthPillar={sajuResult?.pillars.month}
            hourPillar={sajuResult?.pillars.hour}
          />
        </View>

        {/* Horoscope Section */}
        <LinearGradient
          colors={['rgba(250, 250, 249, 0.8)', 'rgba(255, 255, 255, 1)']}
          style={styles.horoscopeSheet}
        >
          <View style={styles.sheetHandle} />

          {/* Date Header - 개선된 날짜 선택 UI */}
          <View style={styles.dateNavigator}>
            {/* 상단: 음력 정보 + 절기/오늘로 버튼 */}
            <View style={styles.dateInfoRow}>
              <View style={styles.lunarBadge}>
                <Text style={styles.lunarText}>{selectedLunarStr}</Text>
                {isToday && todayInfo?.solarTerm && (
                  <>
                    <View style={styles.dotSeparator} />
                    <Text style={styles.lunarText}>{todayInfo.solarTerm}</Text>
                  </>
                )}
              </View>
              {!isToday && (
                <TouchableOpacity
                  style={styles.todayButton}
                  onPress={handleResetToToday}
                  activeOpacity={0.7}
                >
                  <Text style={styles.todayButtonText}>오늘</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 중앙: 날짜 선택 영역 (화살표 + 날짜 + 화살표) */}
            <View style={styles.dateControlRow}>
              {/* 이전 날짜 버튼 */}
              <TouchableOpacity
                style={styles.dateArrowButton}
                onPress={handlePrevDay}
                activeOpacity={0.6}
              >
                <Text style={styles.arrowText}>◀</Text>
              </TouchableOpacity>

              {/* 날짜 표시 - 클릭하면 날짜 선택 화면으로 이동 */}
              <TouchableOpacity
                style={styles.dateCenterBox}
                onPress={() => {
                  navigation.navigate('DatePicker', {
                    selectedDate: selectedDate.toISOString(),
                    onSelectDate: (dateStr: string) => {
                      setSelectedDate(new Date(dateStr));
                    },
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={styles.dateMainRow}>
                  <Text style={[styles.dateTitle, !isToday && styles.dateTitleSelected]}>
                    {headerDateStr}
                  </Text>
                  <Text style={[
                    styles.calendarEmoji,
                    { color: isToday ? '#A8A29E' : (isFuture ? '#10B981' : '#8B5CF6') }
                  ]}>📅</Text>
                </View>
                {!isToday && (
                  <View style={[styles.dateTypeBadge, isFuture ? styles.dateTypeBadgeFuture : styles.dateTypeBadgePast]}>
                    <Text style={styles.dateTypeBadgeText}>
                      {isFuture ? '미래 운세' : '과거 운세'}
                    </Text>
                  </View>
                )}
                {isToday && (
                  <Text style={styles.todayLabel}>오늘의 운세</Text>
                )}
              </TouchableOpacity>

              {/* 다음 날짜 버튼 */}
              <TouchableOpacity
                style={styles.dateArrowButton}
                onPress={handleNextDay}
                activeOpacity={0.6}
              >
                <Text style={styles.arrowText}>▶</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Luck Cards */}
          <View style={styles.luckRow}>
            <LuckCard
              label="종합운"
              emoji="✨"
              color="#F59E0B"
              value={`${fortune.scores.overall}점`}
              score={fortune.scores.overall}
            />
            <LuckCard
              label="애정운"
              emoji="💕"
              color="#F43F5E"
              value={`${fortune.scores.love}점`}
              score={fortune.scores.love}
            />
            <LuckCard
              label="금전운"
              emoji="📈"
              color="#10B981"
              value={fortune.scores.money >= 85 ? '대길' : `${fortune.scores.money}점`}
              score={fortune.scores.money}
            />
          </View>

          {/* 애정운/금전운 해설 섹션 (종합운은 아래 AdviceCard에서 표시) */}
          {fortune.detailedFortunes && (
            <View style={styles.fortuneDetailsSection}>
              {/* 애정운 해설 */}
              <View style={styles.fortuneDetailCard}>
                <View style={styles.fortuneDetailHeader}>
                  <Text style={styles.fortuneDetailEmoji}>💕</Text>
                  <Text style={styles.fortuneDetailTitle}>애정운</Text>
                  <View style={[styles.fortuneDetailBadge, { backgroundColor: '#FCE7F3' }]}>
                    <Text style={[styles.fortuneDetailScore, { color: '#DB2777' }]}>{fortune.scores.love}점</Text>
                  </View>
                </View>
                <Text style={styles.fortuneDetailSummary}>
                  {fortune.detailedFortunes.love?.summary || '사랑하는 사람과 좋은 시간을 보내세요.'}
                </Text>
                <Text style={styles.fortuneDetailAdvice}>
                  💡 {fortune.detailedFortunes.love?.advice || '진심을 담아 소통하면 좋은 결과가 있을 것입니다.'}
                </Text>
              </View>

              {/* 금전운 해설 */}
              <View style={styles.fortuneDetailCard}>
                <View style={styles.fortuneDetailHeader}>
                  <Text style={styles.fortuneDetailEmoji}>📈</Text>
                  <Text style={styles.fortuneDetailTitle}>금전운</Text>
                  <View style={[styles.fortuneDetailBadge, { backgroundColor: '#D1FAE5' }]}>
                    <Text style={[styles.fortuneDetailScore, { color: '#059669' }]}>{fortune.scores.money}점</Text>
                  </View>
                </View>
                <Text style={styles.fortuneDetailSummary}>
                  {fortune.detailedFortunes.money?.summary || '재정적으로 안정적인 하루입니다.'}
                </Text>
                <Text style={styles.fortuneDetailAdvice}>
                  💡 {fortune.detailedFortunes.money?.advice || '계획적인 소비와 저축을 병행하세요.'}
                </Text>
              </View>
            </View>
          )}

          {/* 통합 운세 섹션 (오늘의 운세 + 종합운세 통합) */}
          {comprehensiveFortune && (
            <View style={styles.comprehensiveSection}>
              <View style={styles.comprehensiveHeader}>
                <View style={styles.comprehensiveTitleRow}>
                  <Text style={styles.comprehensiveIcon}>✨</Text>
                  <Text style={styles.comprehensiveTitle}>{isToday ? '오늘의 운세' : `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 운세`}</Text>
                </View>
                <View style={styles.comprehensiveScoreBadge}>
                  <Text style={styles.comprehensiveScoreText}>{fortune.scores.overall}점</Text>
                </View>
              </View>

              {/* 운세 해석 */}
              <View style={styles.fortuneInterpretationCard}>
                <Text style={styles.fortuneInterpretationText}>{todayFortuneInterpretation.main}</Text>
                {todayFortuneInterpretation.sub && (
                  <Text style={styles.fortuneInterpretationSub}>{todayFortuneInterpretation.sub}</Text>
                )}
              </View>

              {/* 오늘의 키워드 */}
              <View style={styles.keywordRow}>
                {(comprehensiveFortune.todayKeywords || []).map((keyword, index) => (
                  <View key={index} style={styles.keywordBadge}>
                    <Text style={styles.keywordText}>#{keyword}</Text>
                  </View>
                ))}
              </View>

              {/* 시간대별 조언 */}
              <View style={styles.timeAdviceCard}>
                <Text style={styles.timeAdviceTitle}>시간대별 조언</Text>
                <View style={styles.timeAdviceRow}>
                  <View style={styles.timeAdviceItem}>
                    <View style={[styles.timeAdviceIcon, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={styles.timeAdviceEmoji}>☀️</Text>
                    </View>
                    <Text style={styles.timeAdviceLabel}>오전</Text>
                  </View>
                  <Text style={styles.timeAdviceText}>
                    {comprehensiveFortune.comprehensiveAdvice?.morning || '차분하게 하루를 시작하세요.'}
                  </Text>
                </View>
                <View style={styles.timeAdviceRow}>
                  <View style={styles.timeAdviceItem}>
                    <View style={[styles.timeAdviceIcon, { backgroundColor: '#DBEAFE' }]}>
                      <Text style={styles.timeAdviceEmoji}>🧭</Text>
                    </View>
                    <Text style={styles.timeAdviceLabel}>오후</Text>
                  </View>
                  <Text style={styles.timeAdviceText}>
                    {comprehensiveFortune.comprehensiveAdvice?.afternoon || '적극적인 활동이 좋습니다.'}
                  </Text>
                </View>
                <View style={styles.timeAdviceRow}>
                  <View style={styles.timeAdviceItem}>
                    <View style={[styles.timeAdviceIcon, { backgroundColor: '#E0E7FF' }]}>
                      <Text style={styles.timeAdviceEmoji}>🌙</Text>
                    </View>
                    <Text style={styles.timeAdviceLabel}>저녁</Text>
                  </View>
                  <Text style={styles.timeAdviceText}>
                    {comprehensiveFortune.comprehensiveAdvice?.evening || '휴식과 재충전의 시간을 가지세요.'}
                  </Text>
                </View>
              </View>

              {/* 오늘의 할일/피할일 */}
              <View style={styles.dosDontsCard}>
                <View style={styles.dosSection}>
                  <Text style={styles.dosDontsTitle}>오늘 하면 좋은 것</Text>
                  {(comprehensiveFortune.dailyFortune?.doList || []).slice(0, 3).map((item, index) => (
                    <View key={index} style={styles.dosDontsItem}>
                      <View style={[styles.dosDontsDot, { backgroundColor: '#10B981' }]} />
                      <Text style={styles.dosDontsText}>{item}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.dosDontsDivider} />
                <View style={styles.dontsSection}>
                  <Text style={[styles.dosDontsTitle, { color: '#EF4444' }]}>오늘 피할 것</Text>
                  {(comprehensiveFortune.dailyFortune?.dontList || []).slice(0, 3).map((item, index) => (
                    <View key={index} style={styles.dosDontsItem}>
                      <View style={[styles.dosDontsDot, { backgroundColor: '#EF4444' }]} />
                      <Text style={styles.dosDontsText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 길운 정보 요약 */}
              <View style={styles.luckyInfoSummary}>
                <View style={styles.luckyInfoItem}>
                  <Text style={styles.luckyInfoLabel}>색상</Text>
                  <Text style={styles.luckyInfoValue}>{comprehensiveFortune.luckyInfo?.color || '초록색'}</Text>
                </View>
                <View style={styles.luckyInfoDivider} />
                <View style={styles.luckyInfoItem}>
                  <Text style={styles.luckyInfoLabel}>숫자</Text>
                  <Text style={styles.luckyInfoValue}>{comprehensiveFortune.luckyInfo?.number || '3, 8'}</Text>
                </View>
                <View style={styles.luckyInfoDivider} />
                <View style={styles.luckyInfoItem}>
                  <Text style={styles.luckyInfoLabel}>방향</Text>
                  <Text style={styles.luckyInfoValue}>{comprehensiveFortune.luckyInfo?.direction || '동쪽'}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    zIndex: 10,
  },
  iconButton: {
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: '#EF4444',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  mainContent: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1917',
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 14,
    color: '#78716C',
  },
  horoscopeSheet: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: 30,
    marginTop: -20,
    minHeight: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    alignSelf: 'center',
    position: 'absolute',
    top: 12,
  },
  // 날짜 네비게이터 (개선된 UI)
  dateNavigator: {
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(168, 162, 158, 0.2)',
  },
  dateInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  lunarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 229, 228, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  lunarText: {
    fontSize: 12,
    color: '#57534E',
    fontWeight: '500',
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#A8A29E',
    marginHorizontal: 6,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F59E0B',
    borderRadius: 16,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dateControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateArrowButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(231, 229, 228, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCenterBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(250, 250, 249, 0.8)',
  },
  dateMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1917',
  },
  dateTitleSelected: {
    color: '#8B5CF6',
  },
  calendarIconInline: {
    marginLeft: 2,
  },
  todayLabel: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 4,
    fontWeight: '500',
  },
  dateTypeBadge: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dateTypeBadgeFuture: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  dateTypeBadgePast: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  dateTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  // 기존 스타일 (호환성용 - 사용 안 함)
  dateHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarIcon: {
    marginLeft: 4,
  },
  luckRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  // 운세별 해설 섹션 스타일
  fortuneDetailsSection: {
    marginBottom: 24,
    gap: 12,
  },
  fortuneDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  fortuneDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  fortuneDetailEmoji: {
    fontSize: 20,
  },
  fortuneDetailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
    flex: 1,
  },
  fortuneDetailBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fortuneDetailScore: {
    fontSize: 13,
    fontWeight: '700',
  },
  fortuneDetailSummary: {
    fontSize: 14,
    color: '#44403C',
    lineHeight: 22,
    marginBottom: 10,
  },
  fortuneDetailAdvice: {
    fontSize: 13,
    color: '#78716C',
    lineHeight: 20,
    backgroundColor: 'rgba(250, 250, 249, 0.8)',
    padding: 12,
    borderRadius: 10,
  },
  // 용신 카드 스타일
  yongsinCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.2)',
  },
  // 운세 해석 카드 스타일
  fortuneInterpretationCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  fortuneInterpretationText: {
    fontSize: 14,
    color: '#44403C',
    lineHeight: 24,
  },
  fortuneInterpretationSub: {
    fontSize: 13,
    color: '#78716C',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  yongsinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  yongsinTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
  },
  yongsinBadge: {
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: '#9333EA',
    fontWeight: '600',
    overflow: 'hidden',
  },
  yongsinContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  yongsinItem: {
    alignItems: 'center',
    flex: 1,
  },
  yongsinLabel: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '500',
    marginBottom: 4,
  },
  yongsinValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
  },
  yongsinDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  yongsinHint: {
    fontSize: 12,
    color: '#A8A29E',
    textAlign: 'center',
    marginTop: 12,
  },
  // 종합운세 섹션 스타일
  comprehensiveSection: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  comprehensiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  comprehensiveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comprehensiveTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
  },
  comprehensiveScoreBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  comprehensiveScoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // 날짜 선택 카드 스타일
  dateSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3E8FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
  },
  dateSelectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dateSelectIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSelectTextBox: {
    flex: 1,
  },
  dateSelectLabel: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
    marginBottom: 2,
  },
  dateSelectValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5B21B6',
  },
  dateSelectRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateSelectChange: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  // 날짜 변경 안내
  dateChangeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  dateChangeNoticeText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
  backToTodayButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  backToTodayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // 미래 날짜 스타일
  dateSelectCardFuture: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  dateSelectIconBoxFuture: {
    backgroundColor: '#10B981',
  },
  dateSelectLabelFuture: {
    color: '#059669',
  },
  dateSelectValueFuture: {
    color: '#047857',
  },
  dateSelectChangeFuture: {
    color: '#10B981',
  },
  futureDateNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  futureDateNoticeText: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '600',
  },
  backToTodayButtonFuture: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  backToTodayTextFuture: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  keywordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  keywordBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  keywordText: {
    color: '#8B5CF6',
    fontSize: 13,
    fontWeight: '600',
  },
  timeAdviceCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  timeAdviceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1917',
    marginBottom: 14,
  },
  timeAdviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  timeAdviceItem: {
    alignItems: 'center',
    width: 50,
  },
  timeAdviceIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  timeAdviceLabel: {
    fontSize: 11,
    color: '#78716C',
    fontWeight: '500',
  },
  timeAdviceText: {
    flex: 1,
    fontSize: 13,
    color: '#44403C',
    lineHeight: 18,
  },
  dosDontsCard: {
    flexDirection: 'column',
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  dosSection: {
    marginBottom: 16,
  },
  dontsSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  dosDontsDivider: {
    display: 'none',
  },
  dosDontsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 12,
  },
  dosDontsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  dosDontsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  dosDontsText: {
    flex: 1,
    fontSize: 14,
    color: '#44403C',
    lineHeight: 20,
  },
  luckyInfoSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: 12,
    paddingVertical: 14,
  },
  luckyInfoItem: {
    alignItems: 'center',
    flex: 1,
  },
  luckyInfoLabel: {
    fontSize: 11,
    color: '#78716C',
    marginBottom: 4,
  },
  luckyInfoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  luckyInfoDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  // 커스텀 날짜 선택기 스타일 (Modal 대신 절대 위치 사용)
  datePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  datePickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: width - 40,
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1001,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
  },
  datePickerYearMonth: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  datePickerArrow: {
    padding: 8,
  },
  datePickerYearMonthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1917',
  },
  datePickerWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerWeekDay: {
    width: 40,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#78716C',
  },
  datePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  datePickerDayEmpty: {
    width: (width - 80) / 7,
    maxWidth: 45,
    height: 40,
  },
  datePickerDay: {
    width: (width - 80) / 7,
    maxWidth: 45,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  datePickerDaySelected: {
    backgroundColor: '#8B5CF6',
  },
  datePickerDayToday: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  datePickerDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1917',
  },
  datePickerDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  datePickerTodayButton: {
    marginTop: 16,
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  datePickerTodayButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // 빠른 날짜 선택 버튼 스타일
  quickDateButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  quickDateButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  quickDateButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  quickDateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#57534E',
  },
  quickDateButtonTextActive: {
    color: '#FFFFFF',
  },
  menuIconButton: {
    fontSize: 24,
    color: '#1C1917',
  },
  arrowText: {
    fontSize: 20,
    color: '#78716C',
  },
  calendarEmoji: {
    fontSize: 16,
    marginLeft: 4,
  },
  comprehensiveIcon: {
    fontSize: 18,
    color: '#8B5CF6',
  },
  timeAdviceEmoji: {
    fontSize: 14,
  },
});
