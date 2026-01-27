/**
 * 꿈 일기 화면
 * 꿈 기록 및 해몽 분석
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Plus,
  Moon,
  Search,
  Calendar,
  Trash2,
  X,
  ChevronDown,
  BarChart3,
} from 'lucide-react-native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../utils/theme';
import {
  DreamEntry,
  DreamStats,
  DREAM_SYMBOLS,
  saveDream,
  getDreams,
  deleteDream,
  getDreamStats,
  interpretDream,
} from '../services/DreamDiary';

type MoodType = 'happy' | 'scared' | 'confused' | 'sad' | 'neutral';

const MOOD_OPTIONS: { value: MoodType; label: string; emoji: string }[] = [
  { value: 'happy', label: '행복함', emoji: '😊' },
  { value: 'scared', label: '무서움', emoji: '😨' },
  { value: 'confused', label: '혼란스러움', emoji: '😵' },
  { value: 'sad', label: '슬픔', emoji: '😢' },
  { value: 'neutral', label: '평범함', emoji: '😐' },
];

const FORTUNE_BADGE = {
  good: { label: '길몽', color: '#10B981', bg: '#D1FAE5' },
  bad: { label: '흉몽', color: '#EF4444', bg: '#FEE2E2' },
  neutral: { label: '평몽', color: '#6B7280', bg: '#F3F4F6' },
};

export default function DreamDiaryScreen() {
  const navigation = useNavigation<any>();
  const [dreams, setDreams] = useState<DreamEntry[]>([]);
  const [stats, setStats] = useState<DreamStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // 새 꿈 입력 상태
  const [newDream, setNewDream] = useState({
    title: '',
    content: '',
    mood: 'neutral' as MoodType,
    selectedSymbols: [] as string[],
  });

  const loadData = async () => {
    try {
      const [dreamList, dreamStats] = await Promise.all([
        getDreams(),
        getDreamStats(),
      ]);
      setDreams(dreamList);
      setStats(dreamStats);
    } catch (error) {
      console.error('Failed to load dreams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSaveDream = async () => {
    if (!newDream.title.trim()) {
      Alert.alert('알림', '꿈의 제목을 입력해주세요.');
      return;
    }
    if (!newDream.content.trim()) {
      Alert.alert('알림', '꿈의 내용을 입력해주세요.');
      return;
    }

    try {
      const { interpretation, fortuneType } = interpretDream(
        newDream.content,
        newDream.selectedSymbols
      );

      const today = new Date().toISOString().split('T')[0];

      await saveDream({
        date: today,
        title: newDream.title,
        content: newDream.content,
        symbols: newDream.selectedSymbols,
        interpretation,
        fortuneType,
        tags: [],
        mood: newDream.mood,
      });

      setShowAddModal(false);
      setNewDream({
        title: '',
        content: '',
        mood: 'neutral',
        selectedSymbols: [],
      });
      loadData();
      Alert.alert('저장 완료', '꿈이 기록되었습니다.');
    } catch (error) {
      Alert.alert('오류', '저장 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteDream = (id: string) => {
    Alert.alert(
      '삭제 확인',
      '이 꿈 기록을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await deleteDream(id);
            loadData();
          },
        },
      ]
    );
  };

  const toggleSymbol = (symbol: string) => {
    setNewDream(prev => ({
      ...prev,
      selectedSymbols: prev.selectedSymbols.includes(symbol)
        ? prev.selectedSymbols.filter(s => s !== symbol)
        : [...prev.selectedSymbols, symbol],
    }));
  };

  const filteredDreams = dreams.filter(
    dream =>
      dream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dream.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dream.symbols.some(s => s.includes(searchQuery))
  );

  const renderDreamCard = (dream: DreamEntry) => {
    const badge = FORTUNE_BADGE[dream.fortuneType];
    const moodOption = MOOD_OPTIONS.find(m => m.value === dream.mood);

    return (
      <View key={dream.id} style={styles.dreamCard}>
        <View style={styles.dreamHeader}>
          <View style={styles.dreamTitleRow}>
            <Text style={styles.dreamTitle}>{dream.title}</Text>
            <View style={[styles.fortuneBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.fortuneBadgeText, { color: badge.color }]}>
                {badge.label}
              </Text>
            </View>
          </View>
          <View style={styles.dreamMeta}>
            <Text style={styles.dreamDate}>
              <Calendar size={12} color={COLORS.textSecondary} /> {dream.date}
            </Text>
            <Text style={styles.dreamMood}>{moodOption?.emoji} {moodOption?.label}</Text>
          </View>
        </View>

        <Text style={styles.dreamContent} numberOfLines={3}>
          {dream.content}
        </Text>

        {dream.symbols.length > 0 && (
          <View style={styles.symbolsRow}>
            {dream.symbols.slice(0, 4).map(symbol => (
              <View key={symbol} style={styles.symbolChip}>
                <Text style={styles.symbolChipText}>{symbol}</Text>
              </View>
            ))}
            {dream.symbols.length > 4 && (
              <Text style={styles.moreSymbols}>+{dream.symbols.length - 4}</Text>
            )}
          </View>
        )}

        <View style={styles.interpretationBox}>
          <Text style={styles.interpretationLabel}>해몽</Text>
          <Text style={styles.interpretationText} numberOfLines={2}>
            {dream.interpretation.split('\n')[0]}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteDream(dream.id)}
        >
          <Trash2 size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>꿈 기록하기</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>꿈 제목</Text>
            <TextInput
              style={styles.input}
              placeholder="어떤 꿈이었나요?"
              placeholderTextColor={COLORS.textSecondary}
              value={newDream.title}
              onChangeText={text => setNewDream(prev => ({ ...prev, title: text }))}
            />

            <Text style={styles.inputLabel}>꿈 내용</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="꿈의 내용을 자세히 적어주세요..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={newDream.content}
              onChangeText={text => setNewDream(prev => ({ ...prev, content: text }))}
            />

            <Text style={styles.inputLabel}>꿈에서의 기분</Text>
            <View style={styles.moodSelector}>
              {MOOD_OPTIONS.map(mood => (
                <TouchableOpacity
                  key={mood.value}
                  style={[
                    styles.moodOption,
                    newDream.mood === mood.value && styles.moodOptionSelected,
                  ]}
                  onPress={() => setNewDream(prev => ({ ...prev, mood: mood.value }))}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[
                    styles.moodLabel,
                    newDream.mood === mood.value && styles.moodLabelSelected,
                  ]}>
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>꿈에 나온 상징물 선택</Text>
            <Text style={styles.inputHint}>해당하는 것을 모두 선택하세요</Text>
            <View style={styles.symbolGrid}>
              {Object.keys(DREAM_SYMBOLS).map(symbol => (
                <TouchableOpacity
                  key={symbol}
                  style={[
                    styles.symbolOption,
                    newDream.selectedSymbols.includes(symbol) && styles.symbolOptionSelected,
                  ]}
                  onPress={() => toggleSymbol(symbol)}
                >
                  <Text style={[
                    styles.symbolOptionText,
                    newDream.selectedSymbols.includes(symbol) && styles.symbolOptionTextSelected,
                  ]}>
                    {symbol}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveDream}>
              <Text style={styles.saveButtonText}>저장하고 해몽받기</Text>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderStatsModal = () => (
    <Modal
      visible={showStatsModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowStatsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>꿈 통계</Text>
            <TouchableOpacity onPress={() => setShowStatsModal(false)}>
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {stats && (
            <ScrollView style={styles.modalScroll}>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{stats.totalDreams}</Text>
                  <Text style={styles.statLabel}>총 기록</Text>
                </View>
                <View style={[styles.statBox, { borderColor: '#D1FAE5' }]}>
                  <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.goodDreams}</Text>
                  <Text style={styles.statLabel}>길몽</Text>
                </View>
                <View style={[styles.statBox, { borderColor: '#FEE2E2' }]}>
                  <Text style={[styles.statNumber, { color: '#EF4444' }]}>{stats.badDreams}</Text>
                  <Text style={styles.statLabel}>흉몽</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{stats.neutralDreams}</Text>
                  <Text style={styles.statLabel}>평몽</Text>
                </View>
              </View>

              {stats.commonSymbols.length > 0 && (
                <View style={styles.statsSection}>
                  <Text style={styles.statsSectionTitle}>자주 나타나는 상징</Text>
                  {stats.commonSymbols.map((item, index) => (
                    <View key={item.symbol} style={styles.symbolStatRow}>
                      <Text style={styles.symbolStatRank}>{index + 1}</Text>
                      <Text style={styles.symbolStatName}>{item.symbol}</Text>
                      <View style={styles.symbolStatBar}>
                        <View
                          style={[
                            styles.symbolStatBarFill,
                            {
                              width: `${(item.count / stats.commonSymbols[0].count) * 100}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.symbolStatCount}>{item.count}회</Text>
                    </View>
                  ))}
                </View>
              )}

              {stats.recentMoods.length > 0 && (
                <View style={styles.statsSection}>
                  <Text style={styles.statsSectionTitle}>꿈에서의 기분 분포</Text>
                  {stats.recentMoods.map(item => {
                    const moodOption = MOOD_OPTIONS.find(m => m.value === item.mood);
                    return (
                      <View key={item.mood} style={styles.moodStatRow}>
                        <Text style={styles.moodStatEmoji}>{moodOption?.emoji}</Text>
                        <Text style={styles.moodStatLabel}>{moodOption?.label}</Text>
                        <Text style={styles.moodStatCount}>{item.count}회</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>꿈 일기</Text>
        <TouchableOpacity onPress={() => setShowStatsModal(true)}>
          <BarChart3 size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* 검색 바 */}
      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="꿈 검색..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* 통계 요약 */}
      {stats && stats.totalDreams > 0 && (
        <View style={styles.summaryCard}>
          <Moon size={20} color={COLORS.primary} />
          <Text style={styles.summaryText}>
            총 {stats.totalDreams}개의 꿈을 기록했어요
          </Text>
          <View style={styles.summaryBadges}>
            <Text style={styles.summaryBadge}>길몽 {stats.goodDreams}</Text>
            <Text style={styles.summaryBadge}>흉몽 {stats.badDreams}</Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredDreams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Moon size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? '검색 결과가 없습니다' : '아직 기록된 꿈이 없어요'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? '다른 검색어로 시도해보세요'
                : '오늘 밤 꾼 꿈을 기록해보세요'}
            </Text>
          </View>
        ) : (
          filteredDreams.map(renderDreamCard)
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 추가 버튼 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Plus size={28} color="white" />
      </TouchableOpacity>

      {renderAddModal()}
      {renderStatsModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  summaryText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  summaryBadges: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  summaryBadge: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  dreamCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    position: 'relative',
  },
  dreamHeader: {
    marginBottom: SPACING.sm,
  },
  dreamTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  dreamTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  fortuneBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  fortuneBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  dreamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  dreamDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  dreamMood: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  dreamContent: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  symbolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  symbolChip: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  symbolChipText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },
  moreSymbols: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    alignSelf: 'center',
  },
  interpretationBox: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  interpretationLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  interpretationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 18,
  },
  deleteButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    padding: SPACING.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalScroll: {
    padding: SPACING.md,
  },
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  inputHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 120,
  },
  moodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  moodOption: {
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 60,
  },
  moodOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  moodLabelSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  symbolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  symbolOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  symbolOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  symbolOptionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  symbolOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: 'white',
  },
  // Stats Modal
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statsSection: {
    marginBottom: SPACING.lg,
  },
  statsSectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  symbolStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  symbolStatRank: {
    width: 20,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  symbolStatName: {
    width: 50,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  symbolStatBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginHorizontal: SPACING.sm,
    overflow: 'hidden',
  },
  symbolStatBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  symbolStatCount: {
    width: 40,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  moodStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  moodStatEmoji: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  moodStatLabel: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  moodStatCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
