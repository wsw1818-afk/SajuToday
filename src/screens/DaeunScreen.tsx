/**
 * 인생 대운 타임라인 화면 (Phase 1-1)
 * Council 합의: 인생 90년 가로 스와이프 + 현재 위치 강조 + 클릭 시 상세
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../utils/theme';
import { useApp } from '../contexts/AppContext';
import { analyzeDaeunSeun, Daeun } from '../services/DaeunCalculator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 대운별 키워드/이모지 (역술인 + 무당 합의)
const TENGOD_INFO: Record<string, { keyword: string; emoji: string; virtue: string }> = {
  '비견': { keyword: '독립과 동료', emoji: '🤝', virtue: '협력' },
  '겁재': { keyword: '경쟁과 분투', emoji: '⚔️', virtue: '절제' },
  '식신': { keyword: '풍요와 즐거움', emoji: '🌸', virtue: '나눔' },
  '상관': { keyword: '재능과 표현', emoji: '🎨', virtue: '겸손' },
  '편재': { keyword: '기회와 횡재', emoji: '💎', virtue: '성실' },
  '정재': { keyword: '안정과 결실', emoji: '⭐', virtue: '근면' },
  '편관': { keyword: '시련과 성장', emoji: '⚡', virtue: '인내' },
  '정관': { keyword: '명예와 책임', emoji: '🏛️', virtue: '정직' },
  '편인': { keyword: '직관과 학문', emoji: '🌙', virtue: '통찰' },
  '정인': { keyword: '지혜와 도움', emoji: '📚', virtue: '학습' },
};

const SEASON_EMOJI = ['🌱', '🌿', '🌳', '🌸', '☀️', '🍀', '🌻', '🍂', '🍁', '❄️'];

interface DaeunCardProps {
  daeun: Daeun;
  isSelected: boolean;
  isCurrent: boolean;
  onPress: () => void;
  cardWidth: number;
}

function DaeunCard({ daeun, isSelected, isCurrent, onPress, cardWidth }: DaeunCardProps) {
  const info = TENGOD_INFO[daeun.tenGod] || { keyword: daeun.keyword, emoji: '✨', virtue: '수양' };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.daeunCard,
        { width: cardWidth },
        isCurrent && styles.daeunCardCurrent,
        isSelected && styles.daeunCardSelected,
      ]}
      activeOpacity={0.7}
    >
      {isCurrent && (
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>📍 지금</Text>
        </View>
      )}
      <Text style={styles.daeunAge}>{daeun.startAge}~{daeun.endAge}세</Text>
      <Text style={styles.daeunEmoji}>{info.emoji}</Text>
      <Text style={styles.daeunGanji}>{daeun.ganJi}</Text>
      <Text style={styles.daeunTenGod}>{daeun.tenGod}</Text>
      <Text style={styles.daeunKeyword}>{info.keyword}</Text>
      <View style={[styles.daeunScoreBar, { backgroundColor: getScoreColor(daeun.score) }]}>
        <Text style={styles.daeunScoreText}>{daeun.score}</Text>
      </View>
    </TouchableOpacity>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#4CAF50';
  if (score >= 65) return '#8BC34A';
  if (score >= 50) return '#FFC107';
  if (score >= 35) return '#FF9800';
  return '#F44336';
}

function calculateDday(targetAge: number, currentAge: number, currentDate: Date = new Date()): number {
  const yearsLeft = targetAge - currentAge;
  if (yearsLeft <= 0) return 0;
  const daysLeft = Math.floor(yearsLeft * 365.25);
  return daysLeft;
}

export default function DaeunScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { profile, sajuResult } = useApp();
  const [selectedDaeun, setSelectedDaeun] = useState<Daeun | null>(null);

  const analysis = useMemo(() => {
    if (!profile?.birthDate || !sajuResult) return null;
    try {
      const [year, month, day] = profile.birthDate.split('-').map(Number);
      const hour = profile.birthTime ? parseInt(profile.birthTime.split(':')[0], 10) : null;
      return analyzeDaeunSeun(
        year, month, day, hour,
        profile.gender || 'male',
        sajuResult.dayMaster,
        sajuResult.pillars.month.stem,
        sajuResult.pillars.month.branch
      );
    } catch (e) {
      console.warn('대운 분석 실패:', e);
      return null;
    }
  }, [profile?.birthDate, profile?.birthTime, profile?.gender, sajuResult]);

  if (!profile || !sajuResult || !analysis) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.title}>인생 대운</Text>
          <View style={{ width: 30 }} />
        </View>
        <Text style={styles.empty}>사주 정보를 불러오는 중...</Text>
      </View>
    );
  }

  const currentAge = new Date().getFullYear() - parseInt(profile.birthDate.split('-')[0], 10) + 1;
  const current = analysis.currentDaeun;
  const next = analysis.nextDaeun;
  const dday = next ? calculateDday(next.startAge, currentAge) : 0;
  const selected = selectedDaeun || current;
  const selectedInfo = selected ? TENGOD_INFO[selected.tenGod] : null;

  // 80세 이전 대운만 표시 (비판자 권고)
  const visibleDaeun = analysis.daeunList.filter(d => d.startAge < 80);

  const cardWidth = SCREEN_WIDTH * 0.35;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.title}>인생 대운 타임라인</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 현재 위치 요약 (5060/3040 핵심 요구) */}
        {current && (
          <View style={styles.currentBox}>
            <Text style={styles.currentLabel}>📍 지금 여기 ({currentAge}세)</Text>
            <Text style={styles.currentTitle}>
              {current.tenGod} 대운 ({current.startAge}~{current.endAge}세)
            </Text>
            <Text style={styles.currentKeyword}>
              "{TENGOD_INFO[current.tenGod]?.keyword || current.keyword}"
            </Text>
            {next && dday > 0 && (
              <View style={styles.ddayBox}>
                <Text style={styles.ddayLabel}>다음 대운까지</Text>
                <Text style={styles.ddayValue}>D-{dday.toLocaleString()}</Text>
                <Text style={styles.ddaySub}>
                  {next.startAge}세에 {next.tenGod} 대운 진입
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 인생 타임라인 (가로 스와이프) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌳 인생 타임라인 (가로로 넘기세요)</Text>
          {profile.birthTime === null && (
            <Text style={styles.warningText}>
              ⚠️ 출생시간 미입력 — 대운 진입 시기 ±1년 오차 가능
            </Text>
          )}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timelineScroll}
          >
            {visibleDaeun.map((daeun, idx) => (
              <DaeunCard
                key={daeun.order}
                daeun={daeun}
                isSelected={selected?.order === daeun.order}
                isCurrent={current?.order === daeun.order}
                onPress={() => setSelectedDaeun(daeun)}
                cardWidth={cardWidth}
              />
            ))}
          </ScrollView>
        </View>

        {/* 선택한 대운 상세 */}
        {selected && selectedInfo && (
          <View style={styles.detailBox}>
            <Text style={styles.detailHeader}>
              {selectedInfo.emoji} {selected.tenGod} 대운 상세
            </Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>시기</Text>
              <Text style={styles.detailValue}>
                {selected.startAge}세 ~ {selected.endAge}세
                {selected.order === current?.order && ' (현재)'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>핵심 키워드</Text>
              <Text style={styles.detailValue}>{selectedInfo.keyword}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>운세 점수</Text>
              <Text style={[styles.detailValue, { color: getScoreColor(selected.score), fontWeight: '700' }]}>
                {selected.score}점
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>천간/지지</Text>
              <Text style={styles.detailValue}>{selected.ganJi}</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.detailSection}>📖 풀이</Text>
            <Text style={styles.detailText}>{selected.description}</Text>

            {selected.goodAspects && selected.goodAspects.length > 0 && (
              <>
                <Text style={styles.detailSection}>✨ 좋은 점</Text>
                {selected.goodAspects.map((aspect, idx) => (
                  <Text key={idx} style={styles.detailListItem}>• {aspect}</Text>
                ))}
              </>
            )}

            {selected.badAspects && selected.badAspects.length > 0 && (
              <>
                <Text style={styles.detailSection}>⚠️ 주의할 점</Text>
                {selected.badAspects.map((aspect, idx) => (
                  <Text key={idx} style={styles.detailListItem}>• {aspect}</Text>
                ))}
              </>
            )}

            <View style={styles.divider} />

            <Text style={styles.virtueBox}>
              📜 이 시기에 닦아야 할 덕목: <Text style={styles.virtueText}>{selectedInfo.virtue}</Text>
            </Text>
          </View>
        )}

        {/* 종합 한 줄 (무당 권고: 따뜻한 마무리) */}
        <View style={styles.bottomNote}>
          <Text style={styles.bottomNoteText}>
            🌿 인생은 봄·여름·가을·겨울이 순환합니다. 지금이 어떤 계절이든, 그 계절만의 의미가 있어요.
          </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    width: 30,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  empty: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 32,
  },
  // 현재 위치 박스
  currentBox: {
    backgroundColor: '#FFF8F0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E67E22',
  },
  currentLabel: {
    fontSize: FONT_SIZES.sm,
    color: '#E67E22',
    fontWeight: '700',
    marginBottom: 6,
  },
  currentTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  currentKeyword: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  ddayBox: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  ddayLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  ddayValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '900',
    color: '#E67E22',
    marginVertical: 4,
  },
  ddaySub: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  // 섹션
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  warningText: {
    fontSize: FONT_SIZES.xs,
    color: '#FF9800',
    marginBottom: 8,
  },
  timelineScroll: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  // 대운 카드
  daeunCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  daeunCardCurrent: {
    borderColor: '#E67E22',
    borderWidth: 2,
    backgroundColor: '#FFF8F0',
  },
  daeunCardSelected: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  currentBadge: {
    position: 'absolute',
    top: -8,
    right: -4,
    backgroundColor: '#E67E22',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  currentBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  daeunAge: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  daeunEmoji: {
    fontSize: 32,
    marginVertical: 6,
  },
  daeunGanji: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  daeunTenGod: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: 2,
  },
  daeunKeyword: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  daeunScoreBar: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  daeunScoreText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  // 상세 박스
  detailBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailHeader: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  detailSection: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 6,
  },
  detailText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  detailListItem: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  virtueBox: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  virtueText: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  // 마무리 노트
  bottomNote: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  bottomNoteText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
