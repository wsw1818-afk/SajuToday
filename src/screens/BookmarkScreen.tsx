/**
 * 북마크/즐겨찾기 화면
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Bookmark as BookmarkIcon,
  Search,
  Trash2,
  ChevronRight,
  Filter,
  Calendar,
} from 'lucide-react-native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../utils/theme';
import {
  Bookmark,
  BookmarkType,
  BookmarkStats,
  getBookmarks,
  deleteBookmark,
  getBookmarkStats,
  getBookmarksByType,
  searchBookmarks,
  BOOKMARK_CATEGORIES,
  getCategoryInfo,
} from '../services/Bookmark';

export default function BookmarkScreen() {
  const navigation = useNavigation<any>();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [stats, setStats] = useState<BookmarkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<BookmarkType | 'all'>('all');

  const loadData = async () => {
    try {
      const [bookmarkList, bookmarkStats] = await Promise.all([
        getBookmarks(),
        getBookmarkStats(),
      ]);
      setBookmarks(bookmarkList);
      setStats(bookmarkStats);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
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

  const handleDelete = (bookmark: Bookmark) => {
    Alert.alert(
      '북마크 삭제',
      `'${bookmark.title}'을(를) 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await deleteBookmark(bookmark.id);
            loadData();
          },
        },
      ]
    );
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await searchBookmarks(query);
      setBookmarks(results);
    } else {
      loadData();
    }
  };

  const handleFilterByType = async (type: BookmarkType | 'all') => {
    setSelectedType(type);
    if (type === 'all') {
      const allBookmarks = await getBookmarks();
      setBookmarks(allBookmarks);
    } else {
      const filtered = await getBookmarksByType(type);
      setBookmarks(filtered);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderCategoryFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterScroll}
      contentContainerStyle={styles.filterContent}
    >
      <TouchableOpacity
        style={[
          styles.filterChip,
          selectedType === 'all' && styles.filterChipSelected,
        ]}
        onPress={() => handleFilterByType('all')}
      >
        <Text style={[
          styles.filterChipText,
          selectedType === 'all' && styles.filterChipTextSelected,
        ]}>
          전체 ({stats?.total || 0})
        </Text>
      </TouchableOpacity>

      {stats?.byType.map(item => (
        <TouchableOpacity
          key={item.type}
          style={[
            styles.filterChip,
            selectedType === item.type && styles.filterChipSelected,
            { borderColor: item.category.color },
          ]}
          onPress={() => handleFilterByType(item.type)}
        >
          <Text style={styles.filterChipIcon}>{item.category.icon}</Text>
          <Text style={[
            styles.filterChipText,
            selectedType === item.type && styles.filterChipTextSelected,
          ]}>
            {item.category.label} ({item.count})
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderBookmarkCard = (bookmark: Bookmark) => {
    const category = getCategoryInfo(bookmark.type);

    return (
      <View key={bookmark.id} style={styles.bookmarkCard}>
        <View style={styles.bookmarkHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: category?.color + '20' }]}>
            <Text style={styles.categoryIcon}>{category?.icon}</Text>
            <Text style={[styles.categoryLabel, { color: category?.color }]}>
              {category?.label}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(bookmark)}
          >
            <Trash2 size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.bookmarkTitle}>{bookmark.title}</Text>
        {bookmark.subtitle && (
          <Text style={styles.bookmarkSubtitle}>{bookmark.subtitle}</Text>
        )}

        <Text style={styles.bookmarkContent} numberOfLines={3}>
          {bookmark.content}
        </Text>

        <View style={styles.bookmarkFooter}>
          <View style={styles.dateInfo}>
            <Calendar size={12} color={COLORS.textSecondary} />
            <Text style={styles.dateText}>
              {formatDate(bookmark.createdAt)}
            </Text>
            {bookmark.relatedDate && (
              <Text style={styles.relatedDate}>
                · 관련: {bookmark.relatedDate}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>북마크</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 검색 바 */}
      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="북마크 검색..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* 카테고리 필터 */}
      {renderCategoryFilter()}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 통계 요약 */}
        {stats && stats.total > 0 && !searchQuery && selectedType === 'all' && (
          <View style={styles.summaryCard}>
            <BookmarkIcon size={20} color={COLORS.primary} />
            <Text style={styles.summaryText}>
              총 {stats.total}개의 북마크가 저장되어 있어요
            </Text>
          </View>
        )}

        {/* 북마크 목록 */}
        {bookmarks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <BookmarkIcon size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>
              {searchQuery
                ? '검색 결과가 없습니다'
                : selectedType !== 'all'
                ? '해당 카테고리의 북마크가 없습니다'
                : '저장된 북마크가 없습니다'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? '다른 검색어로 시도해보세요'
                : '운세 결과에서 북마크 버튼을 눌러 저장해보세요'}
            </Text>
          </View>
        ) : (
          bookmarks.map(renderBookmarkCard)
        )}

        <View style={{ height: 50 }} />
      </ScrollView>
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
  filterScroll: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  filterChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipIcon: {
    fontSize: 14,
  },
  filterChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  filterChipTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  summaryText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  bookmarkCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  categoryIcon: {
    fontSize: 12,
  },
  categoryLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  bookmarkTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  bookmarkSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  bookmarkContent: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  bookmarkFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  relatedDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
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
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
