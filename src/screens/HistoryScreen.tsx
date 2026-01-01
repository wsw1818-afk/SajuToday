import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import Card from '../components/common/Card';
import { FortuneHistory } from '../types';
import StorageService from '../services/StorageService';

export default function HistoryScreen() {
  const [history, setHistory] = useState<FortuneHistory[]>([]);
  const [selectedItem, setSelectedItem] = useState<FortuneHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await StorageService.getFortuneHistory();
      setHistory(data);
    } catch (error) {
      console.error('History load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = days[date.getDay()];
    return `${month}월 ${day}일 (${dayOfWeek})`;
  };

  const renderItem = ({ item }: { item: FortuneHistory }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
    >
      <View style={styles.historyHeader}>
        <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>전체운</Text>
          <Text style={styles.scoreValue}>{item.fortune.scores.overall}</Text>
        </View>
      </View>
      <Text style={styles.historySummary}>{item.fortune.summary}</Text>
      <View style={styles.keywordsContainer}>
        {item.fortune.keywords.map((keyword, index) => (
          <View key={index} style={styles.keywordBadge}>
            <Text style={styles.keywordText}>#{keyword}</Text>
          </View>
        ))}
      </View>

      {selectedItem?.id === item.id && (
        <View style={styles.detailContainer}>
          <View style={styles.divider} />

          {/* 카테고리별 점수 */}
          <View style={styles.scoresGrid}>
            {[
              { key: 'money', label: '재물', emoji: '💰' },
              { key: 'work', label: '일/학업', emoji: '💼' },
              { key: 'love', label: '연애', emoji: '💕' },
              { key: 'health', label: '건강', emoji: '💪' },
            ].map(cat => (
              <View key={cat.key} style={styles.scoreItem}>
                <Text style={styles.scoreItemEmoji}>{cat.emoji}</Text>
                <Text style={styles.scoreItemLabel}>{cat.label}</Text>
                <Text style={styles.scoreItemValue}>
                  {item.fortune.scores[cat.key as keyof typeof item.fortune.scores]}
                </Text>
              </View>
            ))}
          </View>

          {/* 추천/피하기 */}
          <View style={styles.dosDontsContainer}>
            <View style={styles.doContainer}>
              <Text style={styles.doLabel}>✅ 추천</Text>
              <Text style={styles.doText}>{item.fortune.do}</Text>
            </View>
            <View style={styles.dontContainer}>
              <Text style={styles.dontLabel}>❌ 피하기</Text>
              <Text style={styles.dontText}>{item.fortune.dont}</Text>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>운세 히스토리</Text>
        <Text style={styles.subtitle}>최근 30일간의 운세를 확인하세요</Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyText}>아직 운세 기록이 없어요</Text>
          <Text style={styles.emptySubtext}>홈에서 오늘의 운세를 확인해보세요!</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  listContent: {
    padding: SPACING.lg,
    paddingTop: 0,
    paddingBottom: 20,
  },
  historyItem: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  historyDate: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  scoreLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  scoreValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  historySummary: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  keywordsContainer: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  keywordBadge: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  keywordText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },
  detailContainer: {
    marginTop: SPACING.md,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginBottom: SPACING.md,
  },
  scoresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreItemEmoji: {
    fontSize: FONT_SIZES.xl,
    marginBottom: SPACING.xs,
  },
  scoreItemLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  scoreItemValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dosDontsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  doContainer: {
    flex: 1,
    backgroundColor: `${COLORS.success}10`,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  dontContainer: {
    flex: 1,
    backgroundColor: `${COLORS.error}10`,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  doLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: SPACING.xs,
  },
  dontLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  doText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  dontText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
