/**
 * 즐겨찾기/북마크 서비스
 * 운세 결과, 날짜, 해석 등을 저장
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARK_STORAGE_KEY = '@saju_bookmarks';

export type BookmarkType =
  | 'daily_fortune'      // 오늘의 운세
  | 'compatibility'      // 궁합 결과
  | 'taekil'            // 택일 결과
  | 'sinsal'            // 신살 분석
  | 'daeun'             // 대운/세운
  | 'lucky_item'        // 행운 아이템
  | 'dream'             // 꿈 해몽
  | 'name_analysis';    // 이름 분석

export interface Bookmark {
  id: string;
  type: BookmarkType;
  title: string;
  subtitle?: string;
  content: string;
  date: string;           // 북마크한 날짜
  relatedDate?: string;   // 관련 날짜 (예: 운세 날짜, 택일 날짜)
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface BookmarkCategory {
  type: BookmarkType;
  label: string;
  icon: string;
  color: string;
}

// 북마크 카테고리 정보
export const BOOKMARK_CATEGORIES: BookmarkCategory[] = [
  { type: 'daily_fortune', label: '오늘의 운세', icon: '🌟', color: '#F59E0B' },
  { type: 'compatibility', label: '궁합', icon: '💕', color: '#EC4899' },
  { type: 'taekil', label: '택일', icon: '📅', color: '#10B981' },
  { type: 'sinsal', label: '신살', icon: '⚡', color: '#8B5CF6' },
  { type: 'daeun', label: '대운/세운', icon: '📈', color: '#3B82F6' },
  { type: 'lucky_item', label: '행운 아이템', icon: '🍀', color: '#22C55E' },
  { type: 'dream', label: '꿈 해몽', icon: '🌙', color: '#6366F1' },
  { type: 'name_analysis', label: '이름 분석', icon: '📝', color: '#14B8A6' },
];

// 북마크 저장
export async function addBookmark(
  bookmark: Omit<Bookmark, 'id' | 'createdAt'>
): Promise<Bookmark> {
  const bookmarks = await getBookmarks();

  // 중복 체크 (같은 타입, 같은 제목, 같은 관련 날짜)
  const exists = bookmarks.find(
    b => b.type === bookmark.type &&
         b.title === bookmark.title &&
         b.relatedDate === bookmark.relatedDate
  );

  if (exists) {
    throw new Error('이미 저장된 북마크입니다.');
  }

  const newBookmark: Bookmark = {
    ...bookmark,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };

  bookmarks.unshift(newBookmark);
  await AsyncStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarks));
  return newBookmark;
}

// 모든 북마크 가져오기
export async function getBookmarks(): Promise<Bookmark[]> {
  try {
    const data = await AsyncStorage.getItem(BOOKMARK_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// 타입별 북마크 가져오기
export async function getBookmarksByType(type: BookmarkType): Promise<Bookmark[]> {
  const bookmarks = await getBookmarks();
  return bookmarks.filter(b => b.type === type);
}

// 북마크 삭제
export async function deleteBookmark(id: string): Promise<void> {
  const bookmarks = await getBookmarks();
  const filtered = bookmarks.filter(b => b.id !== id);
  await AsyncStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(filtered));
}

// 북마크 존재 여부 확인
export async function isBookmarked(
  type: BookmarkType,
  title: string,
  relatedDate?: string
): Promise<boolean> {
  const bookmarks = await getBookmarks();
  return bookmarks.some(
    b => b.type === type &&
         b.title === title &&
         b.relatedDate === relatedDate
  );
}

// 북마크 토글 (있으면 삭제, 없으면 추가)
export async function toggleBookmark(
  bookmark: Omit<Bookmark, 'id' | 'createdAt'>
): Promise<{ added: boolean; bookmark?: Bookmark }> {
  const bookmarks = await getBookmarks();
  const existingIndex = bookmarks.findIndex(
    b => b.type === bookmark.type &&
         b.title === bookmark.title &&
         b.relatedDate === bookmark.relatedDate
  );

  if (existingIndex !== -1) {
    // 삭제
    bookmarks.splice(existingIndex, 1);
    await AsyncStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarks));
    return { added: false };
  } else {
    // 추가
    const newBookmark = await addBookmark(bookmark);
    return { added: true, bookmark: newBookmark };
  }
}

// 북마크 검색
export async function searchBookmarks(query: string): Promise<Bookmark[]> {
  const bookmarks = await getBookmarks();
  const lowercaseQuery = query.toLowerCase();
  return bookmarks.filter(
    b =>
      b.title.toLowerCase().includes(lowercaseQuery) ||
      b.content.toLowerCase().includes(lowercaseQuery) ||
      (b.subtitle && b.subtitle.toLowerCase().includes(lowercaseQuery))
  );
}

// 북마크 통계
export interface BookmarkStats {
  total: number;
  byType: { type: BookmarkType; count: number; category: BookmarkCategory }[];
  recentBookmarks: Bookmark[];
}

export async function getBookmarkStats(): Promise<BookmarkStats> {
  const bookmarks = await getBookmarks();

  const byType = BOOKMARK_CATEGORIES.map(category => ({
    type: category.type,
    count: bookmarks.filter(b => b.type === category.type).length,
    category,
  })).filter(item => item.count > 0);

  const recentBookmarks = bookmarks.slice(0, 5);

  return {
    total: bookmarks.length,
    byType,
    recentBookmarks,
  };
}

// 특정 날짜의 북마크
export async function getBookmarksByDate(date: string): Promise<Bookmark[]> {
  const bookmarks = await getBookmarks();
  return bookmarks.filter(b => b.date === date || b.relatedDate === date);
}

// 북마크 내보내기 (JSON 문자열)
export async function exportBookmarks(): Promise<string> {
  const bookmarks = await getBookmarks();
  return JSON.stringify(bookmarks, null, 2);
}

// 북마크 가져오기
export async function importBookmarks(jsonString: string): Promise<number> {
  try {
    const importedBookmarks: Bookmark[] = JSON.parse(jsonString);
    const currentBookmarks = await getBookmarks();

    let addedCount = 0;
    for (const bookmark of importedBookmarks) {
      const exists = currentBookmarks.find(
        b => b.type === bookmark.type &&
             b.title === bookmark.title &&
             b.relatedDate === bookmark.relatedDate
      );

      if (!exists) {
        currentBookmarks.push({
          ...bookmark,
          id: Date.now().toString() + addedCount,
          createdAt: new Date().toISOString(),
        });
        addedCount++;
      }
    }

    await AsyncStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(currentBookmarks));
    return addedCount;
  } catch {
    throw new Error('북마크 데이터 형식이 올바르지 않습니다.');
  }
}

// 헬퍼: 카테고리 정보 가져오기
export function getCategoryInfo(type: BookmarkType): BookmarkCategory | undefined {
  return BOOKMARK_CATEGORIES.find(c => c.type === type);
}
