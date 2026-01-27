/**
 * 꿈 일기 서비스
 * 꿈 기록 및 해몽 저장/분석
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const DREAM_STORAGE_KEY = '@saju_dreams';

export interface DreamEntry {
  id: string;
  date: string;           // YYYY-MM-DD
  title: string;          // 꿈 제목
  content: string;        // 꿈 내용
  symbols: string[];      // 주요 상징물
  interpretation: string; // 해몽
  fortuneType: 'good' | 'bad' | 'neutral'; // 길몽/흉몽/보통
  tags: string[];         // 태그
  mood: 'happy' | 'scared' | 'confused' | 'sad' | 'neutral'; // 꿈의 기분
  createdAt: string;
}

export interface DreamStats {
  totalDreams: number;
  goodDreams: number;
  badDreams: number;
  neutralDreams: number;
  commonSymbols: { symbol: string; count: number }[];
  recentMoods: { mood: string; count: number }[];
}

// 꿈 상징물 해석
export const DREAM_SYMBOLS: Record<string, { meaning: string; fortune: 'good' | 'bad' | 'neutral' }> = {
  // 동물
  '뱀': { meaning: '재물운, 횡재수가 있거나 주변에 조심할 사람이 있음', fortune: 'neutral' },
  '돼지': { meaning: '재물과 복을 상징, 횡재수나 금전운 상승', fortune: 'good' },
  '용': { meaning: '최고의 길몽, 출세운과 명예운 상승', fortune: 'good' },
  '호랑이': { meaning: '권력과 명예, 사업 성공이나 승진 암시', fortune: 'good' },
  '개': { meaning: '충성과 보호, 주변에 도움을 줄 사람 나타남', fortune: 'good' },
  '고양이': { meaning: '배신이나 시기하는 사람 주의', fortune: 'bad' },
  '물고기': { meaning: '재물운, 특히 잡으면 금전 이득', fortune: 'good' },
  '새': { meaning: '희망과 자유, 좋은 소식이 올 징조', fortune: 'good' },
  '거북이': { meaning: '장수와 건강, 안정적인 운세', fortune: 'good' },
  '말': { meaning: '발전과 전진, 일이 빠르게 진행됨', fortune: 'good' },

  // 자연
  '물': { meaning: '감정과 무의식, 맑으면 길하고 탁하면 주의', fortune: 'neutral' },
  '불': { meaning: '열정과 변화, 정화의 의미', fortune: 'neutral' },
  '산': { meaning: '목표와 도전, 오르면 성취를 의미', fortune: 'good' },
  '바다': { meaning: '무의식과 가능성, 잔잔하면 길하고 거칠면 흉', fortune: 'neutral' },
  '꽃': { meaning: '기쁨과 행복, 연애운이나 경사가 있을 조짐', fortune: 'good' },
  '비': { meaning: '정화와 새로움, 근심 해소', fortune: 'good' },
  '눈': { meaning: '순수와 새로운 시작, 재물운도 가능', fortune: 'good' },
  '무지개': { meaning: '희망과 행운, 좋은 일이 생길 징조', fortune: 'good' },
  '태양': { meaning: '성공과 명예, 밝은 미래', fortune: 'good' },
  '달': { meaning: '여성성과 직관, 임신이나 길한 소식', fortune: 'good' },

  // 행동/상황
  '떨어지다': { meaning: '불안과 두려움, 현재 상황에 대한 걱정', fortune: 'bad' },
  '날다': { meaning: '자유와 해방, 목표 달성의 가능성', fortune: 'good' },
  '쫓기다': { meaning: '스트레스나 회피하고 싶은 문제 존재', fortune: 'bad' },
  '죽음': { meaning: '끝과 새로운 시작, 변화의 시기', fortune: 'neutral' },
  '결혼': { meaning: '새로운 시작이나 결합, 경사가 있을 수 있음', fortune: 'good' },
  '돈': { meaning: '가치와 자존감, 많으면 복이 오고 잃으면 주의', fortune: 'neutral' },
  '음식': { meaning: '영양과 만족, 풍요로움의 상징', fortune: 'good' },
  '집': { meaning: '자아와 안정, 상태에 따라 해석 달라짐', fortune: 'neutral' },
  '차': { meaning: '인생의 방향, 운전하면 통제력 있음', fortune: 'neutral' },
  '시험': { meaning: '평가에 대한 불안, 자기 점검 필요', fortune: 'neutral' },

  // 사람
  '아기': { meaning: '새로운 시작, 창조성, 임신 가능성', fortune: 'good' },
  '부모': { meaning: '보호와 권위, 조언이 필요할 수 있음', fortune: 'neutral' },
  '연인': { meaning: '사랑과 관계, 현재 감정 상태 반영', fortune: 'neutral' },
  '낯선 사람': { meaning: '자신의 숨겨진 면, 새로운 만남', fortune: 'neutral' },
  '고인': { meaning: '그리움, 조언이나 메시지의 의미', fortune: 'neutral' },
};

// 꿈 해석 생성
export function interpretDream(content: string, symbols: string[]): {
  interpretation: string;
  fortuneType: 'good' | 'bad' | 'neutral';
} {
  let goodCount = 0;
  let badCount = 0;
  const interpretations: string[] = [];

  for (const symbol of symbols) {
    const info = DREAM_SYMBOLS[symbol];
    if (info) {
      interpretations.push(`${symbol}: ${info.meaning}`);
      if (info.fortune === 'good') goodCount++;
      else if (info.fortune === 'bad') badCount++;
    }
  }

  let fortuneType: 'good' | 'bad' | 'neutral';
  let summary: string;

  if (goodCount > badCount + 1) {
    fortuneType = 'good';
    summary = '전반적으로 길한 꿈입니다. 좋은 일이 생길 징조가 보입니다.';
  } else if (badCount > goodCount + 1) {
    fortuneType = 'bad';
    summary = '주의가 필요한 꿈입니다. 현재 상황을 점검해보세요.';
  } else {
    fortuneType = 'neutral';
    summary = '평범한 꿈입니다. 현재 마음 상태를 반영하고 있습니다.';
  }

  const interpretation = interpretations.length > 0
    ? `${summary}\n\n[상징 해석]\n${interpretations.join('\n')}`
    : summary;

  return { interpretation, fortuneType };
}

// 꿈 저장
export async function saveDream(dream: Omit<DreamEntry, 'id' | 'createdAt'>): Promise<DreamEntry> {
  const dreams = await getDreams();
  const newDream: DreamEntry = {
    ...dream,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };

  dreams.unshift(newDream);
  await AsyncStorage.setItem(DREAM_STORAGE_KEY, JSON.stringify(dreams));
  return newDream;
}

// 모든 꿈 가져오기
export async function getDreams(): Promise<DreamEntry[]> {
  try {
    const data = await AsyncStorage.getItem(DREAM_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// 꿈 삭제
export async function deleteDream(id: string): Promise<void> {
  const dreams = await getDreams();
  const filtered = dreams.filter(d => d.id !== id);
  await AsyncStorage.setItem(DREAM_STORAGE_KEY, JSON.stringify(filtered));
}

// 꿈 통계
export async function getDreamStats(): Promise<DreamStats> {
  const dreams = await getDreams();

  const symbolCounts: Record<string, number> = {};
  const moodCounts: Record<string, number> = {};

  for (const dream of dreams) {
    for (const symbol of dream.symbols) {
      symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
    }
    moodCounts[dream.mood] = (moodCounts[dream.mood] || 0) + 1;
  }

  const commonSymbols = Object.entries(symbolCounts)
    .map(([symbol, count]) => ({ symbol, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recentMoods = Object.entries(moodCounts)
    .map(([mood, count]) => ({ mood, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalDreams: dreams.length,
    goodDreams: dreams.filter(d => d.fortuneType === 'good').length,
    badDreams: dreams.filter(d => d.fortuneType === 'bad').length,
    neutralDreams: dreams.filter(d => d.fortuneType === 'neutral').length,
    commonSymbols,
    recentMoods,
  };
}

// 특정 날짜 꿈 가져오기
export async function getDreamsByDate(date: string): Promise<DreamEntry[]> {
  const dreams = await getDreams();
  return dreams.filter(d => d.date === date);
}

// 심볼로 검색
export async function searchDreamsBySymbol(symbol: string): Promise<DreamEntry[]> {
  const dreams = await getDreams();
  return dreams.filter(d => d.symbols.includes(symbol));
}
