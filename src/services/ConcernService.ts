/**
 * 오늘의 고민 카테고리 (Phase 1-3)
 * 사용자가 선택한 카테고리에 따라 풀이 우선순위/점수 가중치 조정
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type ConcernCategory = 'wealth' | 'love' | 'work' | 'family' | 'health' | 'none';

export interface ConcernInfo {
  key: ConcernCategory;
  icon: string;
  label: string;
  description: string;
}

export const CONCERN_OPTIONS: ConcernInfo[] = [
  { key: 'wealth', icon: '💰', label: '돈/재물', description: '금전, 투자, 사업' },
  { key: 'love', icon: '💕', label: '연애/인연', description: '연애, 결혼, 만남' },
  { key: 'work', icon: '💼', label: '일/직장', description: '직장, 이직, 승진' },
  { key: 'family', icon: '👨\u200d👩\u200d👧', label: '가족/자식', description: '가족, 자녀, 부부' },
  { key: 'health', icon: '🏃', label: '건강/체력', description: '몸, 마음, 컨디션' },
  { key: 'none', icon: '✨', label: '특별히 없음', description: '평온한 하루를 보내고 싶어요' },
];

const STORAGE_KEY = 'today_concern';
const STORAGE_TIMESTAMP_KEY = 'today_concern_timestamp';
const MAX_AGE_DAYS = 30;

export async function getConcern(): Promise<ConcernCategory> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const timestamp = await AsyncStorage.getItem(STORAGE_TIMESTAMP_KEY);

    if (stored && timestamp) {
      const ageDays = (Date.now() - parseInt(timestamp, 10)) / (1000 * 60 * 60 * 24);
      if (ageDays <= MAX_AGE_DAYS) {
        return stored as ConcernCategory;
      }
    }
    return 'none';
  } catch {
    return 'none';
  }
}

export async function setConcern(concern: ConcernCategory): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, concern);
    await AsyncStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
  } catch (e) {
    console.warn('고민 저장 실패:', e);
  }
}

export function getConcernInfo(concern: ConcernCategory): ConcernInfo {
  return CONCERN_OPTIONS.find(opt => opt.key === concern) || CONCERN_OPTIONS[CONCERN_OPTIONS.length - 1];
}

/**
 * 고민 카테고리에 따라 점수 가중치 반환
 * (해당 카테고리 점수가 종합 점수에 더 크게 반영되도록)
 */
export function getConcernWeights(concern: ConcernCategory): {
  wealth: number;
  love: number;
  work: number;
  health: number;
} {
  const weights = { wealth: 1.0, love: 1.0, work: 1.0, health: 1.0 };
  switch (concern) {
    case 'wealth':
      weights.wealth = 1.5;
      break;
    case 'love':
      weights.love = 1.5;
      break;
    case 'work':
      weights.work = 1.5;
      break;
    case 'family':
      weights.love = 1.3;
      weights.health = 1.2;
      break;
    case 'health':
      weights.health = 1.5;
      break;
  }
  return weights;
}
