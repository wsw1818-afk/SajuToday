/**
 * 테마 컨텍스트
 * 다크 모드 / 라이트 모드 지원
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@saju_theme';
const FONT_SIZE_STORAGE_KEY = '@saju_font_size';

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontSizeLevel = 'small' | 'medium' | 'large' | 'xlarge';

// 글꼴 크기 배율
const FONT_SCALE: Record<FontSizeLevel, number> = {
  small: 0.85,
  medium: 1,
  large: 1.15,
  xlarge: 1.3,
};

// 라이트 테마 색상
export const lightColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  primary: '#6366F1',
  primaryLight: '#818CF8',
  secondary: '#EC4899',
  text: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  overlay: 'rgba(0,0,0,0.5)',
  shadow: '#000000',
};

// 다크 테마 색상
export const darkColors = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceVariant: '#334155',
  primary: '#818CF8',
  primaryLight: '#A5B4FC',
  secondary: '#F472B6',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  border: '#334155',
  error: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  info: '#60A5FA',
  card: '#1E293B',
  cardBorder: '#334155',
  overlay: 'rgba(0,0,0,0.7)',
  shadow: '#000000',
};

export type ThemeColors = typeof lightColors;

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  fontSizeLevel: FontSizeLevel;
  fontScale: number;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setFontSizeLevel: (level: FontSizeLevel) => void;
  scaledFontSize: (baseSize: number) => number;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [fontSizeLevel, setFontSizeLevelState] = useState<FontSizeLevel>('medium');
  const [isLoaded, setIsLoaded] = useState(false);

  // 저장된 테마 모드 및 글꼴 크기 로드
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [savedMode, savedFontSize] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem(FONT_SIZE_STORAGE_KEY),
      ]);

      if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
        setModeState(savedMode as ThemeMode);
      }

      if (savedFontSize && ['small', 'medium', 'large', 'xlarge'].includes(savedFontSize)) {
        setFontSizeLevelState(savedFontSize as FontSizeLevel);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  };

  const toggleTheme = () => {
    if (mode === 'light') {
      setMode('dark');
    } else if (mode === 'dark') {
      setMode('system');
    } else {
      setMode('light');
    }
  };

  // 글꼴 크기 설정
  const setFontSizeLevel = async (level: FontSizeLevel) => {
    setFontSizeLevelState(level);
    try {
      await AsyncStorage.setItem(FONT_SIZE_STORAGE_KEY, level);
    } catch (error) {
      console.error('Failed to save font size:', error);
    }
  };

  // 글꼴 배율 계산
  const fontScale = useMemo(() => FONT_SCALE[fontSizeLevel], [fontSizeLevel]);

  // 글꼴 크기 계산 함수
  const scaledFontSize = (baseSize: number) => Math.round(baseSize * fontScale);

  // 실제 적용할 다크 모드 여부 계산
  const isDark =
    mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');

  const colors = isDark ? darkColors : lightColors;

  // 로딩이 완료될 때까지 기본 테마 사용
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        mode,
        isDark,
        colors,
        fontSizeLevel,
        fontScale,
        setMode,
        toggleTheme,
        setFontSizeLevel,
        scaledFontSize,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// 테마 모드 옵션
export const THEME_OPTIONS = [
  { value: 'light' as ThemeMode, label: '라이트 모드', icon: '☀️' },
  { value: 'dark' as ThemeMode, label: '다크 모드', icon: '🌙' },
  { value: 'system' as ThemeMode, label: '시스템 설정', icon: '⚙️' },
];

// 글꼴 크기 옵션
export const FONT_SIZE_OPTIONS = [
  { value: 'small' as FontSizeLevel, label: '작게', description: '가독성 ↓' },
  { value: 'medium' as FontSizeLevel, label: '보통', description: '기본값' },
  { value: 'large' as FontSizeLevel, label: '크게', description: '가독성 ↑' },
  { value: 'xlarge' as FontSizeLevel, label: '매우 크게', description: '고령자용' },
];
