/**
 * 가족 대시보드 (Phase 2-2)
 * 저장된 사람 + 나의 오늘 점수를 한 화면에 표시
 * 가장 좋은/나쁜 사람 강조
 */

import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS, FONT_SIZES, SPACING } from '../utils/theme';
import { useApp } from '../contexts/AppContext';
import { StorageService } from '../services/StorageService';
import { SajuCalculator } from '../services/SajuCalculator';
import { SavedPerson, SajuResult } from '../types';
import { getDayGanji } from '../services/MonthlyDailyFortune';
import { getTenGod, stemToElement } from '../utils/elementConverter';
import { analyzeDayMasterStrength, analyzeYongsin } from '../services/AdvancedSajuAnalysis';

interface PersonScore {
  name: string;
  relation: string;
  score: number;
  grade: string;
  emoji: string;
  isMe: boolean;
  person?: SavedPerson;
}

const BRANCH_HARMONY: Record<string, string> = {
  '자': '축', '축': '자', '인': '해', '해': '인',
  '묘': '술', '술': '묘', '진': '유', '유': '진',
  '사': '신', '신': '사', '오': '미', '미': '오',
};

const BRANCH_CLASH: Record<string, string> = {
  '자': '오', '오': '자', '축': '미', '미': '축',
  '인': '신', '신': '인', '묘': '유', '유': '묘',
  '진': '술', '술': '진', '사': '해', '해': '사',
};

function calculateScore(saju: SajuResult, today: Date): number {
  try {
    const ganji = getDayGanji(today);
    const tenGod = getTenGod(saju.dayMaster, ganji.stem);
    const myDayBranch = saju.pillars.day.branch;

    const baseScores: Record<string, number> = {
      '비견': 65, '겁재': 45, '식신': 80, '상관': 55,
      '편재': 78, '정재': 72, '편관': 40, '정관': 75,
      '편인': 58, '정인': 73,
    };
    let score = baseScores[tenGod] || 60;

    if (BRANCH_HARMONY[myDayBranch] === ganji.branch) score += 10;
    if (BRANCH_CLASH[myDayBranch] === ganji.branch) score -= 15;

    const dayMasterStrength = analyzeDayMasterStrength(saju.pillars, saju.elements);
    const yongsinResult = analyzeYongsin(saju.pillars, saju.elements, dayMasterStrength);
    const stemEl = stemToElement(ganji.stem);
    if (stemEl) {
      if (yongsinResult.yongsin.includes(stemEl as any)) score += 12;
      else if (yongsinResult.heeshin.includes(stemEl as any)) score += 6;
      else if (yongsinResult.gushin.includes(stemEl as any)) score -= 6;
      else if (yongsinResult.gishin.includes(stemEl as any)) score -= 12;
    }

    return Math.max(20, Math.min(98, score));
  } catch (e) {
    return 60;
  }
}

function getGrade(score: number): string {
  if (score >= 80) return '대길';
  if (score >= 60) return '길';
  if (score >= 45) return '보통';
  if (score >= 30) return '주의';
  return '흉';
}

function getEmoji(score: number): string {
  if (score >= 80) return '⭐';
  if (score >= 65) return '🌸';
  if (score >= 50) return '🌿';
  if (score >= 35) return '⛅';
  return '🌧️';
}

function getColor(score: number): string {
  if (score >= 80) return COLORS.scoreExcellent;
  if (score >= 60) return '#8BC34A';
  if (score >= 45) return COLORS.scoreGood;
  if (score >= 30) return COLORS.scoreNeutral;
  return COLORS.scoreBad;
}

export default function FamilyDashboardScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { sajuResult, profile } = useApp();
  const [savedPeople, setSavedPeople] = useState<SavedPerson[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      StorageService.getSavedPeople().then(setSavedPeople).catch(() => {});
    }, [])
  );

  const today = useMemo(() => new Date(), []);

  const peopleScores = useMemo<PersonScore[]>(() => {
    const list: PersonScore[] = [];

    // 나
    if (sajuResult && profile) {
      const myScore = calculateScore(sajuResult, today);
      list.push({
        name: profile.name || '나',
        relation: '나',
        score: myScore,
        grade: getGrade(myScore),
        emoji: getEmoji(myScore),
        isMe: true,
      });
    }

    // 저장된 사람
    savedPeople.forEach(person => {
      try {
        const calc = new SajuCalculator(person.birthDate, person.birthTime);
        const saju = calc.calculate();
        const score = calculateScore(saju, today);
        list.push({
          name: person.name,
          relation: person.relation || '',
          score,
          grade: getGrade(score),
          emoji: getEmoji(score),
          isMe: false,
          person,
        });
      } catch (e) {
        // 사주 계산 실패 시 무시
      }
    });

    return list;
  }, [sajuResult, profile, savedPeople, today]);

  // 가장 좋은/나쁜
  const bestPerson = useMemo(() => {
    if (peopleScores.length === 0) return null;
    return [...peopleScores].sort((a, b) => b.score - a.score)[0];
  }, [peopleScores]);

  const worstPerson = useMemo(() => {
    if (peopleScores.length === 0) return null;
    return [...peopleScores].sort((a, b) => a.score - b.score)[0];
  }, [peopleScores]);

  // 평균 점수
  const avgScore = useMemo(() => {
    if (peopleScores.length === 0) return 0;
    return Math.round(peopleScores.reduce((s, p) => s + p.score, 0) / peopleScores.length);
  }, [peopleScores]);

  const summaryMessage = useMemo(() => {
    if (avgScore >= 70) return '🌟 가족 모두 좋은 흐름이에요. 함께 시간 보내기 좋은 날입니다.';
    if (avgScore >= 55) return '🌿 평온한 가족의 하루예요. 무리 없이 보내세요.';
    if (avgScore >= 40) return '⛅ 신중한 하루예요. 작은 다툼도 조심하세요.';
    return '🌧️ 가족 모두 조심해야 하는 날이에요. 서로 배려하면 잘 지나갑니다.';
  }, [avgScore]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.title}>가족 운세 대시보드</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 종합 메시지 */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>{summaryMessage}</Text>
          <Text style={styles.avgText}>가족 평균 {avgScore}점</Text>
        </View>

        {/* 가장 좋은/나쁜 */}
        {bestPerson && worstPerson && bestPerson.name !== worstPerson.name && (
          <View style={styles.highlightRow}>
            <View style={[styles.highlightCard, styles.highlightBest]}>
              <Text style={styles.highlightLabel}>🌟 가장 좋은 분</Text>
              <Text style={styles.highlightName}>{bestPerson.name}</Text>
              <Text style={styles.highlightScore}>{bestPerson.score}점 · {bestPerson.grade}</Text>
            </View>
            <View style={[styles.highlightCard, styles.highlightWorst]}>
              <Text style={styles.highlightLabel}>⚠️ 조심할 분</Text>
              <Text style={styles.highlightName}>{worstPerson.name}</Text>
              <Text style={styles.highlightScore}>{worstPerson.score}점 · {worstPerson.grade}</Text>
            </View>
          </View>
        )}

        {/* 전체 목록 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍👩‍👧‍👦 가족 전체</Text>
          {peopleScores.length === 0 ? (
            <Text style={styles.empty}>저장된 가족이 없어요. 가족을 추가해보세요.</Text>
          ) : (
            peopleScores.map((p, idx) => (
              <View key={idx} style={[styles.personRow, p.isMe && styles.personRowMe]}>
                <View style={styles.personLeft}>
                  <Text style={styles.personName}>
                    {p.name} {p.relation && `(${p.relation})`}
                    {p.isMe && ' 👈 나'}
                  </Text>
                </View>
                <View style={styles.personRight}>
                  <Text style={styles.personEmoji}>{p.emoji}</Text>
                  <View style={[styles.personScoreBox, { backgroundColor: getColor(p.score) }]}>
                    <Text style={styles.personScoreText}>{p.score}</Text>
                  </View>
                  <Text style={[styles.personGrade, { color: getColor(p.score) }]}>
                    {p.grade}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {peopleScores.length < 2 && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('SavedPeople')}
          >
            <Text style={styles.addBtnText}>+ 가족/친구 추가하기</Text>
          </TouchableOpacity>
        )}
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
  content: {
    padding: SPACING.md,
    paddingBottom: 32,
  },
  summaryBox: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  avgText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  highlightRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  highlightCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  highlightBest: {
    backgroundColor: '#E8F5E9',
  },
  highlightWorst: {
    backgroundColor: '#FFEBEE',
  },
  highlightLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  highlightName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  highlightScore: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginTop: 4,
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
  empty: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    padding: 32,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  personRowMe: {
    backgroundColor: '#FFF8F0',
    borderColor: '#E67E22',
  },
  personLeft: {
    flex: 1,
  },
  personName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  personRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  personEmoji: {
    fontSize: 22,
  },
  personScoreBox: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  personScoreText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  personGrade: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    minWidth: 30,
  },
  addBtn: {
    paddingVertical: 14,
    backgroundColor: COLORS.info,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
});
