import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../contexts/AppContext';
import { COLORS, FONT_SIZES } from '../utils/theme';
import { useMonthlyFortune } from '../hooks/useMonthlyFortune';

export default function MonthlyFortuneScreen() {
  const insets = useSafeAreaInsets();
  const { sajuResult } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const monthlyFortune = useMonthlyFortune(sajuResult, new Date().getFullYear(), selectedMonth);

  if (!sajuResult || !monthlyFortune) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>월간 운세를 불러오는 중...</Text>
      </View>
    );
  }

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.title}>월간 운세</Text>
        <Text style={styles.subtitle}>{new Date().getFullYear()}년</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.monthSelector}
        contentContainerStyle={styles.monthSelectorContent}
      >
        {months.map((month) => (
          <TouchableOpacity
            key={month}
            style={[
              styles.monthButton,
              selectedMonth === month && styles.monthButtonActive
            ]}
            onPress={() => setSelectedMonth(month)}
          >
            <Text style={[
              styles.monthText,
              selectedMonth === month && styles.monthTextActive
            ]}>
              {month}월
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.scoreCard}>
        <Text style={styles.monthGanji}>
          {selectedMonth}월 월건: {monthlyFortune.monthGanji?.stem}{monthlyFortune.monthGanji?.branch}
        </Text>
        <Text style={styles.scoreValue}>{monthlyFortune.score}점</Text>
        <Text style={styles.categoryBadge}>{monthlyFortune.category}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>종합 운세</Text>
        <View style={styles.contentCard}>
          <Text style={styles.contentText}>{monthlyFortune.overview}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>분야별 운세</Text>
        <View style={styles.categoryList}>
          <View style={styles.categoryItem}>
            <Text style={styles.categoryLabel}>💰 재물운</Text>
            <Text style={styles.categoryDesc}>{monthlyFortune.wealth}</Text>
          </View>
          <View style={styles.categoryItem}>
            <Text style={styles.categoryLabel}>💼 사업운</Text>
            <Text style={styles.categoryDesc}>{monthlyFortune.career}</Text>
          </View>
          <View style={styles.categoryItem}>
            <Text style={styles.categoryLabel}>💕 애정운</Text>
            <Text style={styles.categoryDesc}>{monthlyFortune.love}</Text>
          </View>
          <View style={styles.categoryItem}>
            <Text style={styles.categoryLabel}>🏃 건강운</Text>
            <Text style={styles.categoryDesc}>{monthlyFortune.health}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>이번 달 조언</Text>
        <View style={styles.contentCard}>
          <Text style={styles.adviceText}>{monthlyFortune.advice}</Text>
        </View>
      </View>

      {monthlyFortune.luckyDays && monthlyFortune.luckyDays.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>행운의 날</Text>
          <View style={styles.daysContainer}>
            {monthlyFortune.luckyDays.map((day) => (
              <View key={day} style={styles.dayBadge}>
                <Text style={styles.dayText}>{day}일</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {monthlyFortune.cautionDays && monthlyFortune.cautionDays.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주의할 날</Text>
          <View style={styles.daysContainer}>
            {monthlyFortune.cautionDays.map((day) => (
              <View key={day} style={[styles.dayBadge, styles.cautionBadge]}>
                <Text style={[styles.dayText, styles.cautionText]}>{day}일</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  monthSelector: {
    marginBottom: 20,
  },
  monthSelectorContent: {
    paddingHorizontal: 8,
  },
  monthButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  monthText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  monthTextActive: {
    color: COLORS.white,
  },
  scoreCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthGanji: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  categoryBadge: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
    backgroundColor: 'rgba(81, 149, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  contentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contentText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  categoryList: {
    gap: 12,
  },
  categoryItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  categoryDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  adviceText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cautionBadge: {
    backgroundColor: '#FFEBEE',
  },
  dayText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: '#2E7D32',
  },
  cautionText: {
    color: '#C62828',
  },
});
