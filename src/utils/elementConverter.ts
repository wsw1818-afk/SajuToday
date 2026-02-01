/**
 * 오행(五行) 변환 유틸리티
 * 천간/지지 → 오행 변환 중복 코드 제거용
 */

import { HEAVENLY_STEMS, EARTHLY_BRANCHES, FIVE_ELEMENTS } from '../data/saju';
import { Element } from '../types';

// 오행 한글명
export type ElementKorean = '목' | '화' | '토' | '금' | '수';

// Element 영문 → 한글 매핑
const ELEMENT_TO_KOREAN: Record<Element, ElementKorean> = {
  wood: '목',
  fire: '화',
  earth: '토',
  metal: '금',
  water: '수',
};

// 한글 → Element 영문 매핑
const KOREAN_TO_ELEMENT: Record<ElementKorean, Element> = {
  '목': 'wood',
  '화': 'fire',
  '토': 'earth',
  '금': 'metal',
  '수': 'water',
};

/**
 * 천간 → 오행 (한글)
 * @param stem 천간 (갑, 을, 병, 정, 무, 기, 경, 신, 임, 계)
 * @returns 오행 한글 (목, 화, 토, 금, 수) 또는 null
 */
export function stemToElement(stem: string): ElementKorean | null {
  const found = HEAVENLY_STEMS.find(s => s.korean === stem);
  return found ? ELEMENT_TO_KOREAN[found.element] : null;
}

/**
 * 지지 → 오행 (한글)
 * @param branch 지지 (자, 축, 인, 묘, 진, 사, 오, 미, 신, 유, 술, 해)
 * @returns 오행 한글 (목, 화, 토, 금, 수) 또는 null
 */
export function branchToElement(branch: string): ElementKorean | null {
  const found = EARTHLY_BRANCHES.find(b => b.korean === branch);
  return found ? ELEMENT_TO_KOREAN[found.element] : null;
}

/**
 * 천간 또는 지지 → 오행 (한글)
 * 천간을 먼저 확인하고, 없으면 지지 확인
 * @param char 천간 또는 지지
 * @returns 오행 한글 또는 null
 */
export function ganjiToElement(char: string): ElementKorean | null {
  return stemToElement(char) || branchToElement(char);
}

/**
 * 천간 → Element 영문
 */
export function stemToElementEn(stem: string): Element | null {
  const found = HEAVENLY_STEMS.find(s => s.korean === stem);
  return found ? found.element : null;
}

/**
 * 지지 → Element 영문
 */
export function branchToElementEn(branch: string): Element | null {
  const found = EARTHLY_BRANCHES.find(b => b.korean === branch);
  return found ? found.element : null;
}

/**
 * 천간 또는 지지 → Element 영문
 */
export function ganjiToElementEn(char: string): Element | null {
  return stemToElementEn(char) || branchToElementEn(char);
}

/**
 * Element 영문 → 한글
 */
export function elementToKorean(element: Element): ElementKorean {
  return ELEMENT_TO_KOREAN[element];
}

/**
 * 한글 → Element 영문
 */
export function koreanToElement(korean: ElementKorean): Element {
  return KOREAN_TO_ELEMENT[korean];
}

/**
 * 오행 색상 반환
 */
export function getElementColor(element: Element | ElementKorean): string {
  if (element in FIVE_ELEMENTS) {
    return FIVE_ELEMENTS[element as Element].color;
  }
  const en = KOREAN_TO_ELEMENT[element as ElementKorean];
  return en ? FIVE_ELEMENTS[en].color : '#9E9E9E';
}

/**
 * 오행 분포 계산 (사주 8자 기준)
 */
export function calculateElementDistribution(
  stems: string[],
  branches: string[]
): Record<ElementKorean, number> {
  const distribution: Record<ElementKorean, number> = {
    '목': 0, '화': 0, '토': 0, '금': 0, '수': 0
  };

  stems.forEach(stem => {
    const element = stemToElement(stem);
    if (element) distribution[element]++;
  });

  branches.forEach(branch => {
    const element = branchToElement(branch);
    if (element) distribution[element]++;
  });

  return distribution;
}

/**
 * 오행 분포를 퍼센티지로 변환
 */
export function elementDistributionToPercentage(
  distribution: Record<ElementKorean, number>
): Array<{ element: ElementKorean; count: number; percentage: number }> {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  return Object.entries(distribution).map(([element, count]) => ({
    element: element as ElementKorean,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
}

// 오행 색상 상수 (UI용)
export const ELEMENT_COLORS: Record<ElementKorean, string> = {
  '목': '#22C55E',
  '화': '#EF4444',
  '토': '#F59E0B',
  '금': '#94A3B8',
  '수': '#3B82F6',
};

// 십신 해석 정보
export interface TenGodMeaning {
  keyword: string;
  good: string;
  bad: string;
}

// 십신 해석 데이터
export const TEN_GOD_MEANINGS: Record<string, TenGodMeaning> = {
  '비견': { keyword: '경쟁/독립', good: '독립심, 자신감, 경쟁력 상승', bad: '고집, 경쟁자 출현, 손재' },
  '겁재': { keyword: '협력/경쟁', good: '파트너십, 협력 관계', bad: '재물 손실, 배신, 다툼' },
  '식신': { keyword: '표현/재능', good: '재능 발휘, 건강, 자녀운', bad: '철력 소모, 과식, 나태' },
  '상관': { keyword: '창의/반항', good: '창의력, 언변, 예술성', bad: '구설수, 관재, 반항심' },
  '편재': { keyword: '사업/투자', good: '사업운, 투자 수익, 이성운', bad: '투기 실패, 돈 문제' },
  '정재': { keyword: '안정/저축', good: '안정적 수입, 저축, 결혼운', bad: '인색, 융통성 부족' },
  '편관': { keyword: '권력/도전', good: '승진, 명예, 추진력', bad: '사고, 관재, 스트레스' },
  '정관': { keyword: '명예/직장', good: '승진, 안정, 사회적 인정', bad: '경직, 압박감' },
  '편인': { keyword: '학문/변화', good: '공부, 자격증, 새로운 기술', bad: '불안정, 방황, 건강' },
  '정인': { keyword: '학문/보호', good: '학업 성취, 어른 도움, 자격', bad: '의존성, 게으름' },
};

/**
 * 십신 계산
 * @param dayMaster 일간 (사주의 일주 천간)
 * @param targetStem 비교할 천간
 * @returns 십신 (비견, 겁재, 식신, 상관, 편재, 정재, 편관, 정관, 편인, 정인)
 */
export function getTenGod(dayMaster: string, targetStem: string): string {
  const dayStem = HEAVENLY_STEMS.find(s => s.korean === dayMaster);
  const target = HEAVENLY_STEMS.find(s => s.korean === targetStem);

  if (!dayStem || !target) return '';

  const dayElement = dayStem.element;
  const dayYinYang = dayStem.yinYang;
  const targetElement = target.element;
  const targetYinYang = target.yinYang;
  const sameYinYang = dayYinYang === targetYinYang;

  // 같은 오행
  if (dayElement === targetElement) {
    return sameYinYang ? '비견' : '겁재';
  }

  // 내가 생하는 오행 (식상)
  if (FIVE_ELEMENTS[dayElement].generates === targetElement) {
    return sameYinYang ? '식신' : '상관';
  }

  // 내가 극하는 오행 (재성)
  if (FIVE_ELEMENTS[dayElement].controls === targetElement) {
    return sameYinYang ? '편재' : '정재';
  }

  // 나를 극하는 오행 (관성)
  if (FIVE_ELEMENTS[targetElement].controls === dayElement) {
    return sameYinYang ? '편관' : '정관';
  }

  // 나를 생하는 오행 (인성)
  if (FIVE_ELEMENTS[targetElement].generates === dayElement) {
    return sameYinYang ? '편인' : '정인';
  }

  return '';
}
