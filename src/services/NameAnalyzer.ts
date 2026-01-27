/**
 * 작명 및 이름 분석 서비스
 * 사주 오행에 기반한 이름 분석 및 추천
 */

// 한글 자음 오행 배속
const CONSONANT_ELEMENTS: Record<string, { element: string; meaning: string }> = {
  'ㄱ': { element: '목', meaning: '강인함, 성장' },
  'ㅋ': { element: '목', meaning: '활력, 진취' },
  'ㄴ': { element: '화', meaning: '따뜻함, 열정' },
  'ㄷ': { element: '화', meaning: '밝음, 활발' },
  'ㅌ': { element: '화', meaning: '에너지, 정열' },
  'ㄹ': { element: '화', meaning: '빛남, 명예' },
  'ㅁ': { element: '토', meaning: '안정, 신뢰' },
  'ㅂ': { element: '수', meaning: '지혜, 유연' },
  'ㅍ': { element: '수', meaning: '깊이, 통찰' },
  'ㅅ': { element: '금', meaning: '날카로움, 의리' },
  'ㅈ': { element: '금', meaning: '정의, 결단' },
  'ㅊ': { element: '금', meaning: '청렴, 명쾌' },
  'ㅇ': { element: '토', meaning: '포용, 중심' },
  'ㅎ': { element: '수', meaning: '흐름, 적응' },
};

// 모음 오행 배속
const VOWEL_ELEMENTS: Record<string, { element: string; yin_yang: string }> = {
  'ㅏ': { element: '목', yin_yang: '양' },
  'ㅑ': { element: '목', yin_yang: '음' },
  'ㅓ': { element: '목', yin_yang: '음' },
  'ㅕ': { element: '목', yin_yang: '음' },
  'ㅗ': { element: '화', yin_yang: '양' },
  'ㅛ': { element: '화', yin_yang: '음' },
  'ㅜ': { element: '수', yin_yang: '양' },
  'ㅠ': { element: '수', yin_yang: '음' },
  'ㅡ': { element: '토', yin_yang: '음' },
  'ㅣ': { element: '금', yin_yang: '양' },
  'ㅐ': { element: '토', yin_yang: '양' },
  'ㅔ': { element: '토', yin_yang: '음' },
  'ㅚ': { element: '금', yin_yang: '양' },
  'ㅟ': { element: '수', yin_yang: '양' },
  'ㅢ': { element: '토', yin_yang: '음' },
};

// 획수 길흉
const STROKE_FORTUNE: Record<number, { fortune: 'good' | 'bad' | 'neutral'; meaning: string }> = {
  1: { fortune: 'good', meaning: '태초, 시작의 운' },
  2: { fortune: 'bad', meaning: '분리, 불안정' },
  3: { fortune: 'good', meaning: '발전, 성장의 운' },
  4: { fortune: 'bad', meaning: '고난, 시련' },
  5: { fortune: 'good', meaning: '중심, 균형의 운' },
  6: { fortune: 'good', meaning: '가정, 조화의 운' },
  7: { fortune: 'good', meaning: '독립, 의지의 운' },
  8: { fortune: 'good', meaning: '발전, 번영의 운' },
  9: { fortune: 'bad', meaning: '고독, 불완전' },
  10: { fortune: 'bad', meaning: '공허, 불안' },
  11: { fortune: 'good', meaning: '새로움, 재생의 운' },
  12: { fortune: 'bad', meaning: '좌절, 고난' },
  13: { fortune: 'good', meaning: '지혜, 성공의 운' },
  14: { fortune: 'bad', meaning: '파산, 곤란' },
  15: { fortune: 'good', meaning: '복덕, 행운' },
  16: { fortune: 'good', meaning: '덕망, 성공' },
  17: { fortune: 'good', meaning: '돌파, 성취' },
  18: { fortune: 'good', meaning: '발전, 성공' },
  19: { fortune: 'bad', meaning: '장애, 고통' },
  20: { fortune: 'bad', meaning: '공허, 허무' },
  21: { fortune: 'good', meaning: '두령, 리더십' },
  22: { fortune: 'bad', meaning: '박약, 실패' },
  23: { fortune: 'good', meaning: '융성, 발달' },
  24: { fortune: 'good', meaning: '풍요, 출세' },
  25: { fortune: 'good', meaning: '재능, 성공' },
};

// 한글 자모 분리
function decomposeKorean(char: string): { cho: string; jung: string; jong: string } | null {
  const code = char.charCodeAt(0);

  if (code < 0xAC00 || code > 0xD7A3) return null;

  const offset = code - 0xAC00;
  const cho_list = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const jung_list = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  const jong_list = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  const cho = Math.floor(offset / 588);
  const jung = Math.floor((offset % 588) / 28);
  const jong = offset % 28;

  return {
    cho: cho_list[cho],
    jung: jung_list[jung],
    jong: jong_list[jong],
  };
}

// 획수 계산 (간략화된 버전)
function getStrokeCount(char: string): number {
  const strokeMap: Record<string, number> = {
    // 자음 획수
    'ㄱ': 2, 'ㄲ': 4, 'ㄴ': 2, 'ㄷ': 3, 'ㄸ': 6, 'ㄹ': 5, 'ㅁ': 4, 'ㅂ': 4, 'ㅃ': 8,
    'ㅅ': 2, 'ㅆ': 4, 'ㅇ': 1, 'ㅈ': 3, 'ㅉ': 6, 'ㅊ': 4, 'ㅋ': 3, 'ㅌ': 4, 'ㅍ': 4, 'ㅎ': 3,
    // 모음 획수
    'ㅏ': 2, 'ㅐ': 3, 'ㅑ': 3, 'ㅒ': 4, 'ㅓ': 2, 'ㅔ': 3, 'ㅕ': 3, 'ㅖ': 4,
    'ㅗ': 2, 'ㅘ': 4, 'ㅙ': 5, 'ㅚ': 3, 'ㅛ': 3, 'ㅜ': 2, 'ㅝ': 4, 'ㅞ': 5, 'ㅟ': 3, 'ㅠ': 3,
    'ㅡ': 1, 'ㅢ': 2, 'ㅣ': 1,
  };

  const decomposed = decomposeKorean(char);
  if (!decomposed) return 0;

  let count = 0;
  count += strokeMap[decomposed.cho] || 0;
  count += strokeMap[decomposed.jung] || 0;
  if (decomposed.jong) {
    count += strokeMap[decomposed.jong] || 0;
  }

  return count;
}

export interface NameAnalysis {
  name: string;
  characters: {
    char: string;
    elements: string[];
    strokes: number;
    meaning: string;
  }[];
  totalStrokes: number;
  elementDistribution: Record<string, number>;
  strokeFortune: { fortune: string; meaning: string };
  balance: {
    isBalanced: boolean;
    strongElements: string[];
    weakElements: string[];
    analysis: string;
  };
  compatibility: {
    score: number;
    analysis: string;
  };
  suggestions: string[];
}

export interface NameRecommendation {
  surname: string;
  characters: string[];
  reason: string;
  score: number;
}

/**
 * 이름 분석
 */
export function analyzeName(
  name: string,
  userElements?: Record<string, number>
): NameAnalysis {
  const characters: NameAnalysis['characters'] = [];
  let totalStrokes = 0;
  const elementDistribution: Record<string, number> = {
    '목': 0, '화': 0, '토': 0, '금': 0, '수': 0,
  };

  // 각 글자 분석
  for (const char of name) {
    const decomposed = decomposeKorean(char);
    if (!decomposed) continue;

    const elements: string[] = [];
    const meanings: string[] = [];

    // 초성 오행
    const choInfo = CONSONANT_ELEMENTS[decomposed.cho];
    if (choInfo) {
      elements.push(choInfo.element);
      meanings.push(choInfo.meaning);
      elementDistribution[choInfo.element]++;
    }

    // 중성 오행
    const jungInfo = VOWEL_ELEMENTS[decomposed.jung];
    if (jungInfo) {
      elements.push(jungInfo.element);
      elementDistribution[jungInfo.element]++;
    }

    // 종성 오행
    if (decomposed.jong) {
      const jongInfo = CONSONANT_ELEMENTS[decomposed.jong];
      if (jongInfo) {
        elements.push(jongInfo.element);
        elementDistribution[jongInfo.element]++;
      }
    }

    const strokes = getStrokeCount(char);
    totalStrokes += strokes;

    characters.push({
      char,
      elements: [...new Set(elements)],
      strokes,
      meaning: meanings[0] || '',
    });
  }

  // 획수 운
  const strokeMod = totalStrokes % 25 || 25;
  const strokeFortune = STROKE_FORTUNE[strokeMod] || { fortune: 'neutral', meaning: '보통' };

  // 오행 균형 분석
  const maxElement = Object.entries(elementDistribution).reduce((a, b) => a[1] > b[1] ? a : b);
  const minElement = Object.entries(elementDistribution).reduce((a, b) => a[1] < b[1] ? a : b);
  const strongElements = Object.entries(elementDistribution)
    .filter(([_, v]) => v >= 3)
    .map(([k]) => k);
  const weakElements = Object.entries(elementDistribution)
    .filter(([_, v]) => v === 0)
    .map(([k]) => k);

  const isBalanced = strongElements.length <= 2 && weakElements.length <= 1;

  // 사주와의 호환성
  let compatibilityScore = 70;
  let compatibilityAnalysis = '';

  if (userElements) {
    // 사주에서 부족한 오행이 이름에 있는지 확인
    const weakInSaju = Object.entries(userElements)
      .filter(([_, v]) => v <= 1)
      .map(([k]) => k);

    const complemented = weakInSaju.filter(e => elementDistribution[e] > 0);
    compatibilityScore += complemented.length * 10;

    if (complemented.length > 0) {
      compatibilityAnalysis = `사주에서 부족한 ${complemented.join(', ')} 오행을 이름이 보완해주고 있습니다.`;
    } else if (weakInSaju.length > 0) {
      compatibilityAnalysis = `사주에서 부족한 ${weakInSaju.join(', ')} 오행이 이름에도 부족합니다.`;
      compatibilityScore -= 15;
    } else {
      compatibilityAnalysis = '이름의 오행이 사주와 조화를 이룹니다.';
    }
  } else {
    compatibilityAnalysis = '사주 정보가 있으면 더 정확한 분석이 가능합니다.';
  }

  // 제안사항
  const suggestions: string[] = [];
  if (weakElements.length > 0) {
    suggestions.push(`${weakElements.join(', ')} 오행이 부족합니다. 해당 오행의 글자를 고려해보세요.`);
  }
  if (strongElements.length > 2) {
    suggestions.push(`${strongElements.join(', ')} 오행이 과다합니다. 균형을 맞추면 좋겠습니다.`);
  }
  if (strokeFortune.fortune === 'bad') {
    suggestions.push(`총 획수 ${totalStrokes}획은 ${strokeFortune.meaning}의 의미가 있습니다.`);
  }
  if (suggestions.length === 0) {
    suggestions.push('전체적으로 균형 잡힌 좋은 이름입니다.');
  }

  return {
    name,
    characters,
    totalStrokes,
    elementDistribution,
    strokeFortune: {
      fortune: strokeFortune.fortune === 'good' ? '길' : strokeFortune.fortune === 'bad' ? '흉' : '보통',
      meaning: strokeFortune.meaning,
    },
    balance: {
      isBalanced,
      strongElements,
      weakElements,
      analysis: isBalanced
        ? '오행이 균형 있게 분포되어 있습니다.'
        : `${strongElements.length > 0 ? strongElements.join(', ') + ' 오행이 강하고' : ''} ${weakElements.length > 0 ? weakElements.join(', ') + ' 오행이 약합니다.' : ''}`,
    },
    compatibility: {
      score: Math.min(100, Math.max(0, compatibilityScore)),
      analysis: compatibilityAnalysis,
    },
    suggestions,
  };
}

/**
 * 오행별 추천 글자
 */
export const ELEMENT_CHARACTERS: Record<string, string[]> = {
  '목': ['가', '강', '건', '경', '공', '규', '근', '기', '나', '남', '단', '동', '란', '림', '민', '박', '빈', '산', '상', '석'],
  '화': ['나', '다', '덕', '동', '라', '란', '령', '림', '명', '민', '빈', '선', '연', '영', '정', '진', '채', '태', '현', '화'],
  '토': ['만', '명', '문', '미', '민', '배', '보', '부', '비', '빈', '상', '서', '선', '성', '세', '수', '순', '승', '시', '신'],
  '금': ['상', '서', '선', '성', '세', '소', '수', '숙', '순', '승', '시', '신', '아', '안', '애', '양', '언', '여', '연', '영'],
  '수': ['민', '박', '반', '배', '백', '범', '병', '보', '복', '봉', '부', '빈', '하', '한', '해', '현', '형', '혜', '호', '화'],
};

/**
 * 이름 추천 (사주 기반)
 */
export function recommendNames(
  surname: string,
  userElements: Record<string, number>,
  gender: 'male' | 'female'
): NameRecommendation[] {
  // 부족한 오행 찾기
  const weakElements = Object.entries(userElements)
    .filter(([_, v]) => v <= 1)
    .map(([k]) => k);

  // 필요한 오행 결정
  const neededElements = weakElements.length > 0 ? weakElements : ['토', '금']; // 기본값

  const recommendations: NameRecommendation[] = [];

  // 각 필요한 오행에서 글자 선택
  for (const element of neededElements.slice(0, 2)) {
    const chars = ELEMENT_CHARACTERS[element] || [];
    const selectedChars = chars.slice(0, 3);

    for (const char of selectedChars) {
      recommendations.push({
        surname,
        characters: [char],
        reason: `${element} 오행 보완 - ${char} 글자가 ${element}의 기운을 더해줍니다.`,
        score: 75 + Math.floor(Math.random() * 20),
      });
    }
  }

  // 점수순 정렬
  return recommendations.sort((a, b) => b.score - a.score).slice(0, 6);
}
