/**
 * 길일/흉일 화면 (Phase 1-2)
 * 앞으로 14일 길흉 + 이벤트별 길일 추천
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../utils/theme';
import { useApp } from '../contexts/AppContext';
import { calculateLuckyDays, DailyLuck } from '../services/LuckyDayCalculator';

const EVENT_LABELS: Record<string, { icon: string; label: string; desc: string }> = {
  marriage: { icon: '💍', label: '결혼·약혼', desc: '인연이 굳어지는 날' },
  moving: { icon: '🚚', label: '이사·이동', desc: '새 환경에 자리잡기 좋은 날' },
  contract: { icon: '📝', label: '계약·서명', desc: '약속이 지켜지는 날' },
  exam: { icon: '📚', label: '시험·발표', desc: '학습이 빛나는 날' },
  meeting: { icon: '💕', label: '만남·소개', desc: '인연이 닿는 날' },
};

interface DayCardProps {
  luck: DailyLuck;
  isToday: boolean;
  onPress?: () => void;
}

function DayCard({ luck, isToday }: DayCardProps) {
  const scoreColor = getScoreColor(luck.score);
  return (
    <View style={[styles.dayCard, isToday && styles.dayCardToday]}>
      <View style={styles.dayCardLeft}>
        <Text style={[styles.dayDate, isToday && styles.dayDateToday]}>
          {luck.dateStr}
          {isToday && ' 오늘'}
        </Text>
        <Text style={styles.dayReason}>{luck.reason}</Text>
        {luck.eventTags.length > 0 && (
          <View style={styles.tagRow}>
            {luck.eventTags.slice(0, 3).map(tag => {
              const info = EVENT_LABELS[tag];
              if (!info) return null;
              return (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagText}>{info.icon} {info.label}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
      <View style={styles.dayCardRight}>
        <Text style={styles.dayEmoji}>{luck.emoji}</Text>
        <View style={[styles.dayScorePill, { backgroundColor: scoreColor }]}>
          <Text style={styles.dayScoreText}>{luck.score}</Text>
        </View>
        <Text style={[styles.dayGrade, { color: scoreColor }]}>{luck.grade}</Text>
      </View>
    </View>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return COLORS.scoreExcellent;
  if (score >= 60) return '#8BC34A';
  if (score >= 45) return COLORS.scoreGood;
  if (score >= 30) return COLORS.scoreNeutral;
  return COLORS.scoreBad;
}

export default function LuckyDaysScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { sajuResult } = useApp();

  const luckyData = useMemo(() => {
    if (!sajuResult) return null;
    return calculateLuckyDays(sajuResult);
  }, [sajuResult]);

  if (!sajuResult || !luckyData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.title}>길일 D-day</Text>
          <View style={{ width: 30 }} />
        </View>
        <Text style={styles.empty}>사주 정보를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.title}>길일 D-day</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 다음 길일 강조 */}
        {luckyData.nextBestDay && (
          <View style={styles.highlightBox}>
            <Text style={styles.highlightLabel}>🌟 앞으로 가장 좋은 날</Text>
            <Text style={styles.highlightDate}>{luckyData.nextBestDay.dateStr}</Text>
            <View style={styles.highlightDdayRow}>
              <Text style={styles.highlightDday}>D-{luckyData.nextBestDday}</Text>
              <Text style={styles.highlightScore}>
                {luckyData.nextBestDay.score}점 · {luckyData.nextBestDay.grade}
              </Text>
            </View>
            <Text style={styles.highlightReason}>{luckyData.nextBestDay.reason}</Text>
          </View>
        )}

        {/* 이벤트별 길일 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📌 이벤트별 추천 길일</Text>
          {Object.entries(luckyData.byEvent).map(([key, day]) => {
            const info = EVENT_LABELS[key];
            if (!info) return null;
            return (
              <View key={key} style={styles.eventRow}>
                <Text style={styles.eventIcon}>{info.icon}</Text>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventLabel}>{info.label}</Text>
                  <Text style={styles.eventDesc}>{info.desc}</Text>
                </View>
                <View style={styles.eventDate}>
                  {day ? (
                    <>
                      <Text style={styles.eventDateText}>{day.dateStr}</Text>
                      <Text style={[styles.eventScore, { color: getScoreColor(day.score) }]}>
                        {day.score}점
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.eventNone}>14일 내 없음</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* 14일 전체 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗓️ 앞으로 14일 길흉</Text>
          {luckyData.next14Days.map((luck, idx) => (
            <DayCard key={idx} luck={luck} isToday={idx === 0} />
          ))}
        </View>

        {/* 마무리 격언 (공자 페르소나) */}
        <View style={styles.bottomNote}>
          <Text style={styles.bottomNoteText}>
            📜 좋은 날을 잡는 것보다 좋은 마음으로 임하는 것이 더 중요합니다.
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
  highlightBox: {
    backgroundColor: '#FFF8F0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E67E22',
    alignItems: 'center',
  },
  highlightLabel: {
    fontSize: FONT_SIZES.sm,
    color: '#E67E22',
    fontWeight: '700',
    marginBottom: 8,
  },
  highlightDate: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  highlightDdayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 8,
  },
  highlightDday: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '900',
    color: '#E67E22',
  },
  highlightScore: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  highlightReason: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  eventDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  eventDate: {
    alignItems: 'flex-end',
  },
  eventDateText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  eventScore: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    marginTop: 2,
  },
  eventNone: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  // 일별 카드
  dayCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayCardToday: {
    borderColor: '#E67E22',
    borderWidth: 2,
    backgroundColor: '#FFF8F0',
  },
  dayCardLeft: {
    flex: 1,
  },
  dayCardRight: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  dayDate: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  dayDateToday: {
    color: '#E67E22',
    fontWeight: '700',
  },
  dayReason: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  tagChip: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    color: '#0369A1',
    fontWeight: '600',
  },
  dayEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  dayScorePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 4,
  },
  dayScoreText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  dayGrade: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
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
