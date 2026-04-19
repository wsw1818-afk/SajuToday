/**
 * 사용자 환경 설정 (Phase 3-1)
 * 톤/글자 크기/전문용어 표시
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type ToneStyle = 'casual' | 'polite' | 'shaman';   // 친근체 / 정중체 / 점쟁이체
export type FontScale = 'small' | 'medium' | 'large' | 'xlarge';
export type TermMode = 'easy' | 'mixed';                   // 쉬운말 / 전문용어 함께

export interface UserPreferences {
  tone: ToneStyle;
  fontScale: FontScale;
  termMode: TermMode;
}

const DEFAULT_PREFS: UserPreferences = {
  tone: 'casual',
  fontScale: 'medium',
  termMode: 'easy',
};

const STORAGE_KEY = 'user_preferences';

export const FONT_SCALE_MULTIPLIER: Record<FontScale, number> = {
  small: 0.9,
  medium: 1.0,
  large: 1.2,
  xlarge: 1.4,
};

export const FONT_SCALE_LABEL: Record<FontScale, string> = {
  small: '작게',
  medium: '보통',
  large: '크게',
  xlarge: '아주 크게',
};

export const TONE_LABEL: Record<ToneStyle, string> = {
  casual: '친근체 (~해요)',
  polite: '정중체 (~합니다)',
  shaman: '점쟁이체 (~잖아요)',
};

export const TERM_LABEL: Record<TermMode, string> = {
  easy: '쉬운 말만',
  mixed: '전문용어 함께',
};

export async function getPreferences(): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function setPreferences(prefs: UserPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('설정 저장 실패:', e);
  }
}

export async function updatePreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): Promise<UserPreferences> {
  const current = await getPreferences();
  const next = { ...current, [key]: value };
  await setPreferences(next);
  return next;
}
