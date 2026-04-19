/**
 * HomeScreen 동적 스타일 훅
 * 다크모드/글꼴 크기에 따른 스타일 계산을 분리
 */

import { useMemo } from 'react';
import { COLORS } from '../utils/theme';
import { useTheme } from '../contexts/ThemeContext';

/**
 * HomeScreen 동적 스타일 훅
 */
export function useHomeStyles() {
  const { isDark, colors, scaledFontSize } = useTheme();

  const dynamicStyles = useMemo(() => ({
    container: {
      backgroundColor: isDark ? colors.background : COLORS.card,
    },
    mainTitle: {
      fontSize: scaledFontSize(26),
      color: isDark ? colors.text : COLORS.text,
    },
    subTitle: {
      fontSize: scaledFontSize(15),
      color: isDark ? colors.textSecondary : COLORS.textSecondary,
    },
    menuIcon: {
      color: isDark ? colors.text : COLORS.text,
    },
    card: {
      backgroundColor: isDark ? colors.surface : COLORS.card,
      borderColor: isDark ? colors.border : 'rgba(0, 0, 0, 0.05)',
    },
    cardText: {
      color: isDark ? colors.text : COLORS.text,
    },
    secondaryText: {
      color: isDark ? colors.textSecondary : COLORS.textSecondary,
    },
    horoscopeSheet: {
      backgroundColor: isDark ? colors.surface : 'rgba(255, 255, 255, 1)',
    },
    // 일주 섹션 스타일
    iljuMetaphorSection: {
      backgroundColor: isDark ? 'rgba(30, 27, 75, 0.4)' : 'rgba(245, 243, 255, 0.9)',
      borderColor: isDark ? 'rgba(129, 140, 248, 0.3)' : '#E9D5FF',
    },
    iljuMetaphorTitle: {
      color: isDark ? '#C4B5FD' : '#6B21A8',
      fontSize: scaledFontSize(16),
    },
    iljuMetaphorEssence: {
      color: isDark ? '#A5B4FC' : '#7C3AED',
      fontSize: scaledFontSize(13),
    },
    iljuMetaphorText: {
      color: isDark ? '#E0E7FF' : '#4C1D95',
      fontSize: scaledFontSize(15),
    },
    iljuMetaphorTheme: {
      color: isDark ? '#A5B4FC' : '#7C3AED',
      fontSize: scaledFontSize(14),
    },
    // 날짜 선택 영역
    dateNavigator: {
      backgroundColor: isDark ? 'rgba(39, 39, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      borderColor: isDark ? 'rgba(63, 63, 70, 0.5)' : 'rgba(168, 162, 158, 0.2)',
    },
    lunarBadge: {
      backgroundColor: isDark ? 'rgba(63, 63, 70, 0.5)' : 'rgba(231, 229, 228, 0.5)',
    },
    lunarText: {
      color: isDark ? '#A1A1AA' : COLORS.textSecondary,
      fontSize: scaledFontSize(12),
    },
    dateTitle: {
      color: isDark ? '#FAFAFA' : COLORS.text,
      fontSize: scaledFontSize(22),
    },
    todayLabel: {
      color: isDark ? '#A1A1AA' : COLORS.textSecondary,
      fontSize: scaledFontSize(12),
    },
    arrowButton: {
      backgroundColor: isDark ? 'rgba(63, 63, 70, 0.6)' : 'rgba(231, 229, 228, 0.6)',
    },
    arrowText: {
      color: isDark ? '#A1A1AA' : '#78716C',
    },
    dateCenterBox: {
      backgroundColor: isDark ? 'rgba(39, 39, 42, 0.8)' : 'rgba(250, 250, 249, 0.8)',
    },
    // 운세 카드 영역
    richDailyFortuneCard: {
      backgroundColor: isDark ? 'rgba(39, 39, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: isDark ? 'rgba(63, 63, 70, 0.5)' : 'rgba(0, 0, 0, 0.05)',
    },
    richDailySummary: {
      color: isDark ? '#E4E4E7' : '#292524',
      fontSize: scaledFontSize(15),
    },
    todayMeetingCard: {
      backgroundColor: isDark ? 'rgba(79, 70, 229, 0.15)' : 'rgba(238, 242, 255, 0.9)',
      borderColor: isDark ? 'rgba(129, 140, 248, 0.3)' : '#C7D2FE',
    },
    todayMeetingText: {
      color: isDark ? '#C7D2FE' : '#4338CA',
      fontSize: scaledFontSize(14),
    },
    // 탭 스타일
    fortuneTab: {
      backgroundColor: isDark ? 'rgba(39, 39, 42, 0.5)' : 'rgba(231, 229, 228, 0.5)',
    },
    fortuneTabActive: {
      backgroundColor: isDark ? '#4F46E5' : COLORS.card,
    },
    fortuneTabText: {
      color: isDark ? '#A1A1AA' : COLORS.textSecondary,
      fontSize: scaledFontSize(14),
    },
    fortuneTabTextActive: {
      color: isDark ? COLORS.card : COLORS.text,
    },
    // 행운 정보
    luckyInfoSummary: {
      backgroundColor: isDark ? 'rgba(39, 39, 42, 0.8)' : 'rgba(250, 250, 249, 0.9)',
      borderColor: isDark ? 'rgba(63, 63, 70, 0.5)' : 'rgba(0, 0, 0, 0.05)',
    },
    luckyInfoLabel: {
      color: isDark ? '#A1A1AA' : '#78716C',
      fontSize: scaledFontSize(12),
    },
    luckyInfoValue: {
      color: isDark ? '#E4E4E7' : COLORS.text,
      fontSize: scaledFontSize(14),
    },
    // 카테고리 카드
    categoryCard: {
      backgroundColor: isDark ? 'rgba(39, 39, 42, 0.9)' : COLORS.card,
    },
    categoryName: {
      color: isDark ? '#E4E4E7' : COLORS.text,
      fontSize: scaledFontSize(15),
    },
    categoryMessage: {
      color: isDark ? '#A1A1AA' : COLORS.textSecondary,
      fontSize: scaledFontSize(13),
    },
  }), [isDark, colors, scaledFontSize]);

  return {
    isDark,
    colors,
    scaledFontSize,
    dynamicStyles,
  };
}

export default useHomeStyles;
