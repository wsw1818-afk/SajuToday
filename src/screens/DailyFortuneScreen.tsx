import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useApp } from '../contexts/AppContext';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, FONTS, SHADOWS, getScoreColor as scoreColor, getScoreLabel as scoreLabel } from '../utils/theme';
import { BujeokSeal } from '../components/common/BujeokSeal';
import { useTodayFortune } from '../hooks/useTodayFortune';
import { SajuCalculator } from '../services/SajuCalculator';
import { StorageService } from '../services/StorageService';
import { SavedPerson } from '../types';
import { calculateLuckyDays } from '../services/LuckyDayCalculator';
// ConcernService는 향후 재도입 가능 (PROGRESS.md 참고). 현재는 미사용.
import { DailyShareModal } from '../components/DailyShareModal';
import { useTheme } from '../contexts/ThemeContext';


export default function DailyFortuneScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { sajuResult, profile } = useApp();
  const { isDark } = useTheme();

  // 선택된 날짜 상태
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  // 사람 전환 상태
  const [savedPeople, setSavedPeople] = useState<SavedPerson[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<SavedPerson | null>(null);
  const [showPeoplePicker, setShowPeoplePicker] = useState(false);
  // 공유 모달 (Phase 2-1)
  const [showShareModal, setShowShareModal] = useState(false);

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

  // 다음 길일 계산 (Phase 1-2)
  const luckyData = useMemo(() => {
    if (!activeSajuResult) return null;
    try {
      return calculateLuckyDays(activeSajuResult);
    } catch (e) {
      console.warn('길일 계산 실패:', e);
      return null;
    }
  }, [activeSajuResult]);

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

  // DESIGN.md BUJEOK 부적 컨셉: theme.ts의 토큰 함수 사용 (2026-04-18)
  // 부적 적색 4단계 + 한자 라벨 (大吉/吉/平/凶)
  const getScoreColor = scoreColor;
  const getScoreLabel = scoreLabel;

  // 기본값 처리 — 폴백은 정상 운세 생성 실패 시에만 노출되어야 함
  // QA 검수 후 (2026-04-18): 폴백 텍스트가 정상 흐름에 섞이지 않도록 비어있을 때만 폴백 사용
  // 빈 문자열도 폴백 트리거에 포함 (?? 대신 || 유지)
  const summary = todayFortune.overall?.summary?.trim() || '오늘의 운세를 확인하세요.';
  const detail = todayFortune.overall?.detail?.trim() || '오늘은 평온한 하루가 될 것입니다.';
  const advice = todayFortune.overall?.advice?.trim() || '차분하게 하루를 보내세요.';
  const wealth = todayFortune.wealth?.advice?.trim() || '평온한 재물운입니다.';
  const love = todayFortune.love?.advice?.trim() || '평온한 연애운입니다.';
  const work = todayFortune.work?.advice?.trim() || '평온한 직장운입니다.';
  const health = todayFortune.health?.advice?.trim() || '건강에 유의하세요.';
  const color = todayFortune.luckyPoints?.color || '흰색';
  const number = todayFortune.luckyPoints?.number || '3, 7';
  const direction = todayFortune.luckyPoints?.direction || '남쪽';
  const item = todayFortune.luckyPoints?.item || '수첩';
  const goodActivities = todayFortune.activities?.good || ['일상 업무', '정리 정돈'];
  const cautions = todayFortune.caution || ['급한 결정은 피하세요'];

  // 종합 풀이 압축 — 날짜별 길이 편차 최소화 (핑퐁 방지)
  // 목표값(target) ± 15% 범위에 안정적으로 수렴하도록 종결어미 단위 절단
  //
  // 알고리즘:
  // 1. 한국어 종결("요./어요./죠./네요./예요." + "다.") + 마침표 단위로 분리
  // 2. 누적 길이가 target 근처 도달할 때까지 문장 추가
  // 3. 다음 문장 추가 시 max 초과면 멈춤 (target 미달이어도 OK)
  // 4. 첫 문장조차 max 초과하면 어절 단위 부드러운 절단
  const trimByTarget = (text: string, target: number, max: number): string => {
    if (!text) return '';
    if (text.length <= max) return text;

    // 한국어 종결 + 영문 마침표 모두 인식
    const sentences = text
      .split(/(?<=[요죠다요예네까]\.|[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    let result = '';
    for (const s of sentences) {
      const next = result ? `${result} ${s}` : s;
      if (next.length <= max) {
        result = next;
        // target 도달했고 max 여유가 적으면 멈춤
        if (result.length >= target * 0.85) break;
      } else {
        // 추가하면 max 초과 → 멈춤
        if (result) break;
        // 첫 문장조차 max 초과 → 어절 단위 절단
        const words = s.split(' ');
        let acc = '';
        for (const w of words) {
          if ((acc + ' ' + w).length > max) break;
          acc = acc ? `${acc} ${w}` : w;
        }
        result = acc + '…';
        break;
      }
    }
    return result || text.slice(0, max) + '…';
  };

  // BUJEOK: 본문은 detail만 (카테고리는 별도 부적 도장 카드로 분리됨)
  const comprehensiveReading = trimByTarget(detail, 220, 280);

  // 부적 카테고리 4종 — 한자(장식) + 한글(메인 정보, 시안 일치)
  const bujeokCategories = [
    { hanja: '財', label: '재물', score: todayFortune.wealth?.score, advice: trimByTarget(wealth, 50, 70) },
    { hanja: '愛', label: '애정', score: todayFortune.love?.score, advice: trimByTarget(love, 50, 70) },
    { hanja: '職', label: '직업', score: todayFortune.work?.score, advice: trimByTarget(work, 50, 70) },
    { hanja: '健', label: '건강', score: todayFortune.health?.score, advice: trimByTarget(health, 50, 70) },
  ];

  // 날짜 포맷
  const shortDateStr = (() => {
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][selectedDate.getDay()];
    return `${month}/${day} (${dayOfWeek})`;
  })();

  return (
    <ImageBackground
      source={require('../../assets/images/hanji-bg.jpg')}
      style={[styles.container, { paddingTop: insets.top }]}
      imageStyle={styles.hanjiBgImage}
      resizeMode="cover"
    >
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

      {/* 다음 길일 D-day 배너 (Phase 1-2) */}
      {luckyData?.nextBestDay && luckyData.nextBestDday > 0 && (
        <TouchableOpacity
          style={styles.luckyBanner}
          onPress={() => navigation.navigate('LuckyDays')}
          activeOpacity={0.7}
        >
          <Text style={styles.luckyBannerEmoji}>🌟</Text>
          <View style={styles.luckyBannerContent}>
            <Text style={styles.luckyBannerTitle}>
              다음 길일 D-{luckyData.nextBestDday}
            </Text>
            <Text style={styles.luckyBannerDesc}>
              {luckyData.nextBestDay.dateStr} · {luckyData.nextBestDay.reason}
            </Text>
          </View>
          <Text style={styles.luckyBannerArrow}>▶</Text>
        </TouchableOpacity>
      )}

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

        {/* 종합 운세 점수 — 부적 인장 스타일 (DESIGN.md BUJEOK) */}
        <View style={styles.bujeokScoreContainer}>
          {/* 큰 한자 인장 (大吉/吉/平/凶) */}
          <BujeokSeal
            hanja={getScoreLabel(todayFortune.score || 60)}
            size={120}
            color={getScoreColor(todayFortune.score || 60)}
            variant="brush"
            style={styles.bujeokMainSeal}
          />
          {/* 우측 작은 인장 (사주명) */}
          <BujeokSeal
            hanja="運勢"
            size={56}
            color={COLORS.primary}
            style={styles.bujeokSubSeal}
          />
          {/* 부적 구분선 (天 ◆ 地) */}
          <View style={styles.bujeokDivider}>
            <View style={styles.bujeokDividerLine} />
            <Text style={styles.bujeokDividerText}>天 ◆ 地</Text>
            <View style={styles.bujeokDividerLine} />
          </View>
          {/* 점수 + 사람 이름 */}
          <View style={styles.bujeokScoreInfo}>
            <Text style={styles.bujeokScoreLabel}>{activeName}님의 오늘 운세</Text>
            <Text style={[styles.bujeokScoreValue, { color: getScoreColor(todayFortune.score || 60) }]}>
              {todayFortune.score || 60}점
            </Text>
            <Text style={styles.bujeokScoreDesc}>{summary}</Text>
          </View>
        </View>

        {/* 종합 운세 풀이 */}
        <View style={styles.section}>
          <View style={styles.detailCard}>
            {/* 명리학 근거 한 줄 (Council 합의: 사용자 신뢰 회복) */}
            {todayFortune.dayGanji && todayFortune.tenGod && (
              <Text style={styles.myeongriBasis}>
                📖 일주 {activeSajuResult?.pillars.day.stem}{activeSajuResult?.pillars.day.branch}
                {' · '}오늘 {todayFortune.dayGanji.stem}{todayFortune.dayGanji.branch}
                {' · '}{todayFortune.tenGod}
                {summary?.includes('의 날') ? ` · ${summary.replace('의 날', '')}` : ''}
              </Text>
            )}
            <Text style={styles.detailText}>{comprehensiveReading}</Text>
            {/* AI 생성 정직 공개 (Devils 강력 권고) */}
            <Text style={styles.aiDisclosure}>
              ※ 사주 계산은 명리학(60갑자·십신·12운성)에 따르며, 풀이 본문은 AI가 그 결과를 바탕으로 작성합니다.
            </Text>
          </View>
        </View>

        {/* BUJEOK 부적 구분선 (人 ◆ 道) */}
        <View style={styles.bujeokDivider}>
          <View style={styles.bujeokDividerLine} />
          <Text style={styles.bujeokDividerText}>人 ◆ 道</Text>
          <View style={styles.bujeokDividerLine} />
        </View>

        {/* BUJEOK: 카테고리 4개 부적 도장 카드 (시안 일치 — 한글 메인, 한자 장식) */}
        <View style={styles.bujeokCategoryGrid}>
          {bujeokCategories.map((cat) => (
            <View key={cat.hanja} style={styles.bujeokCategoryCard}>
              {/* 부적 인장 (한자 + 한글) */}
              <View style={styles.bujeokCategorySeal}>
                <Text style={styles.bujeokCategoryHanja}>{cat.hanja}</Text>
                <Text style={styles.bujeokCategoryHangul}>{cat.label}</Text>
              </View>
              {/* 빨간 점수 도장 */}
              {cat.score !== undefined && (
                <View style={styles.bujeokScoreStamp}>
                  <Text style={styles.bujeokScoreStampText}>{cat.score}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* 공유 버튼 (Phase 2-1) */}
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => setShowShareModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.shareBtnText}>📤 친구에게 공유하기</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 공유 모달 */}
      <DailyShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        cardData={{
          name: activeName,
          dateStr: selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }),
          score: todayFortune.score || 60,
          grade: getScoreLabel(todayFortune.score || 60),
          stageName: summary || '평온의 날',
          summary: detail.split('\n')[0]?.slice(0, 60) || '오늘의 운세',
          topCategoryEmoji: '✨',
          topCategoryText: wealth?.slice(0, 80) || '',
        }}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,  // ImageBackground 로딩 전 fallback
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
    backgroundColor: COLORS.surface || COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    backgroundColor: COLORS.card,
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
    borderBottomColor: COLORS.divider,
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
    borderTopColor: COLORS.divider,
    marginTop: 4,
  },
  addPersonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.info,
    fontWeight: '600',
  },
  // 길일 배너 (Phase 1-2)
  luckyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0D8B8',
  },
  luckyBannerEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  luckyBannerContent: {
    flex: 1,
  },
  luckyBannerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#E67E22',
  },
  luckyBannerDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  luckyBannerArrow: {
    fontSize: 14,
    color: '#E67E22',
    marginLeft: 8,
  },
  // 공유 버튼 (Phase 2-1)
  shareBtn: {
    marginTop: 16,
    marginHorizontal: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#E67E22',
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#FFF',
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
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
  // ===== 한지 배경 =====
  hanjiBgImage: {
    opacity: 0.85,
  },
  // ===== BUJEOK 부적 점수 인장 (DESIGN.md) =====
  bujeokScoreContainer: {
    position: 'relative',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  bujeokMainSeal: {
    marginBottom: SPACING.md,
  },
  bujeokSubSeal: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
  },
  bujeokScoreInfo: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  bujeokScoreLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontFamily: FONTS.serif,
    marginBottom: SPACING.xs,
  },
  bujeokScoreValue: {
    fontSize: 36,
    fontFamily: FONTS.serifBold,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  bujeokScoreDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontFamily: FONTS.serif,
    textAlign: 'center',
    lineHeight: FONT_SIZES.sm * 1.7,
    paddingHorizontal: SPACING.lg,
  },
  // ===== BUJEOK 부적 구분선 (天 ◆ 地, 人 ◆ 道) =====
  bujeokDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.lg,
    gap: SPACING.md,
  },
  bujeokDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  bujeokDividerText: {
    fontFamily: FONTS.serifBold,
    fontSize: FONT_SIZES.md,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 4,
    opacity: 0.6,
  },
  // ===== BUJEOK 카테고리 부적 도장 4개 (시안 일치 — 한글 메인, 한자 장식) =====
  bujeokCategoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  bujeokCategoryCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 140,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  bujeokCategorySeal: {
    width: 64,
    height: 64,
    borderWidth: 3,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
  },
  bujeokCategoryHanja: {
    fontFamily: FONTS.brush,
    fontSize: 24,
    color: COLORS.textSecondary,
    opacity: 0.7,
    fontWeight: '900',
    lineHeight: 24,
  },
  bujeokCategoryHangul: {
    fontFamily: FONTS.serifBold,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '800',
    marginTop: 2,
  },
  bujeokScoreStamp: {
    width: 44,
    height: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
  },
  bujeokScoreStampText: {
    fontFamily: FONTS.serifBold,
    fontSize: 13,
    color: COLORS.white,
    fontWeight: '700',
  },
  // ===== 기존 scoreCard (dead code, 추후 정리) =====
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
  // 명리학 근거 한 줄 (Council 합의: 사주 신뢰 회복) — 부적 컴러
  myeongriBasis: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,         // 부적 적색
    fontWeight: '600',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  // AI 생성 정직 공개 (Devils 권고)
  aiDisclosure: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    lineHeight: 16,
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
