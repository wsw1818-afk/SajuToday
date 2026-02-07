/**
 * 월운(月運)과 일운(日運) 계산기
 * 대운/세울보다 더 세밀한 운세를 제공합니다.
 */

import { FIVE_ELEMENTS, SIX_COMBINES, SIX_CLASHES, STEM_COMBINES, STEM_CLASHES, HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../data/saju';
import { stemToElement, branchToElement, koreanToElement, elementToKorean, ElementKorean } from '../utils/elementConverter';

// 천간과 지지 (saju.ts 마스터 데이터에서 추출)
const STEMS = HEAVENLY_STEMS.map(s => s.korean);
const BRANCHES = EARTHLY_BRANCHES.map(b => b.korean);
const BRANCH_ANIMALS = EARTHLY_BRANCHES.map(b => b.animal);

// 오행 상생상극 헬퍼 함수 (FIVE_ELEMENTS 사용)
// 한글 오행('목', '화', etc)을 받아서 상생/상극 오행(한글)을 반환
const getGenerates = (element: string | null): string | null => {
  if (!element) return null;
  const enElement = koreanToElement(element as ElementKorean);
  if (!enElement) return null;
  const generatesEn = FIVE_ELEMENTS[enElement]?.generates;
  return generatesEn ? elementToKorean(generatesEn) : null;
};
const getOvercomes = (element: string | null): string | null => {
  if (!element) return null;
  const enElement = koreanToElement(element as ElementKorean);
  if (!enElement) return null;
  const controlsEn = FIVE_ELEMENTS[enElement]?.controls;
  return controlsEn ? elementToKorean(controlsEn) : null;
};

// 천간 합/충 확인 함수 (STEM_COMBINES, STEM_CLASHES 사용)
function findCombineBranch(branch: string): string | undefined {
  const combine = SIX_COMBINES.find(c => c.pair.includes(branch));
  return combine?.pair.find(b => b !== branch);
}

function findClashBranch(branch: string): string | undefined {
  const clash = SIX_CLASHES.find(c => c.pair.includes(branch));
  return clash?.pair.find(b => b !== branch);
}

// 천간 합 찾기 함수
function findStemCombine(stem: string): string | undefined {
  const combine = STEM_COMBINES.find(c => c.pair.includes(stem));
  return combine?.pair.find(s => s !== stem);
}

// 천간 충 찾기 함수
function findStemClash(stem: string): string | undefined {
  const clash = STEM_CLASHES.find(c => c.pair.includes(stem));
  return clash?.pair.find(s => s !== stem);
}

/**
 * 줄리안 데이 넘버(JDN) 계산 - 시간대 영향 없는 순수 날짜 계산
 */
function getJulianDayNumber(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

// JDN 기준 60갑자 오프셋 (검증: 2026-02-07 = 임자 = index 48)
const JDN_GANJI_OFFSET = 4;

/**
 * 특정 날짜의 일진(천간지지) 계산
 * JDN 기반으로 시간대 문제 없이 정확한 일진 계산
 */
export function getDayGanji(date: Date): { stem: string; branch: string; animal: string } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const jdn = getJulianDayNumber(year, month, day);
  const ganjiIndex = ((jdn + JDN_GANJI_OFFSET) % 60 + 60) % 60;
  const stemIndex = ganjiIndex % 10;
  const branchIndex = ganjiIndex % 12;

  return {
    stem: STEMS[stemIndex],
    branch: BRANCHES[branchIndex],
    animal: BRANCH_ANIMALS[branchIndex],
  };
}

/**
 * 특정 월의 월건(천간지지) 계산
 */
export function getMonthGanji(year: number, month: number): { stem: string; branch: string } {
  // 월건 계산: 인월(1월)부터 시작
  // 년간에 따라 월간이 결정됨 (년간 갑기는 병인월 시작)
  const yearStemIndex = (year - 4) % 10;

  // 월지는 고정 (1월=인, 2월=묘, ...)
  const monthBranchIndex = (month + 1) % 12; // 1월이 인(2)

  // 월간 계산 (년간 * 2 + 월 조정)
  const monthStemBase = [2, 4, 6, 8, 0]; // 갑기, 을경, 병신, 정임, 무계 년의 정월 천간
  const baseIndex = monthStemBase[yearStemIndex % 5];
  const monthStemIndex = (baseIndex + month - 1) % 10;

  return {
    stem: STEMS[monthStemIndex],
    branch: BRANCHES[monthBranchIndex],
  };
}

/**
 * 일간과 일진의 관계 분석
 */
function analyzeRelation(
  dayMaster: string,
  targetStem: string,
  targetBranch: string
): {
  score: number;
  stemRelation: string;
  branchRelation: string;
  description: string;
} {
  const dayMasterElement = stemToElement(dayMaster);
  const targetStemElement = stemToElement(targetStem);
  const targetBranchElement = branchToElement(targetBranch);

  let score = 60; // 기본 점수
  let stemRelation = '';
  let branchRelation = '';
  const descriptions: string[] = [];

  // 천간 관계 분석
  if (findStemCombine(dayMaster) === targetStem) {
    score += 15;
    stemRelation = '천간합';
    descriptions.push('하늘의 기운이 화합합니다');
  } else if (findStemClash(dayMaster) === targetStem) {
    score -= 15;
    stemRelation = '천간충';
    descriptions.push('하늘의 기운이 충돌합니다');
  } else if (getGenerates(dayMasterElement) === targetStemElement && targetStemElement) {
    score += 5;
    stemRelation = '설기';
    descriptions.push('에너지가 소모될 수 있습니다');
  } else if (getGenerates(targetStemElement) === dayMasterElement && dayMasterElement) {
    score += 10;
    stemRelation = '생조';
    descriptions.push('힘을 받는 날입니다');
  } else if (getOvercomes(dayMasterElement) === targetStemElement && targetStemElement) {
    score += 5;
    stemRelation = '극출';
    descriptions.push('적극적으로 행동하기 좋습니다');
  } else if (getOvercomes(targetStemElement) === dayMasterElement && dayMasterElement) {
    score -= 10;
    stemRelation = '극입';
    descriptions.push('외부 압박이 있을 수 있습니다');
  }

  // 지지 관계 분석 (년지/일지 기준은 제외, 일진만 분석)
  const combineBranch = findCombineBranch(targetBranch);
  if (combineBranch) {
    score += 5;
    branchRelation = '지지합 가능';
  }

  // 오행 조화
  if (getGenerates(targetBranchElement) === dayMasterElement && dayMasterElement) {
    score += 8;
    descriptions.push('땅의 기운이 도움을 줍니다');
  } else if (getOvercomes(targetBranchElement) === dayMasterElement && dayMasterElement) {
    score -= 8;
    descriptions.push('땅의 기운이 방해합니다');
  }

  // 점수 범위 조정
  score = Math.max(20, Math.min(95, score));

  return {
    score,
    stemRelation,
    branchRelation,
    description: descriptions.join('. ') || '평온한 기운입니다',
  };
}

// ============================================
// 월운 분석
// ============================================

export interface MonthlyFortune {
  year: number;
  month: number;
  ganji: { stem: string; branch: string };
  score: number;
  category: string; // 대길, 길, 보통, 주의, 흉
  overview: string;
  career: string;
  wealth: string;
  love: string;
  health: string;
  advice: string;
  luckyDays: number[]; // 이번 달 좋은 날짜
  cautionDays: number[]; // 이번 달 주의할 날짜
}

export function calculateMonthlyFortune(
  dayMaster: string,
  year: number,
  month: number
): MonthlyFortune {
  const ganji = getMonthGanji(year, month);
  const relation = analyzeRelation(dayMaster, ganji.stem, ganji.branch);

  // 카테고리 결정
  let category = '';
  if (relation.score >= 80) category = '대길';
  else if (relation.score >= 65) category = '길';
  else if (relation.score >= 50) category = '보통';
  else if (relation.score >= 35) category = '주의';
  else category = '흉';

  // 월운 해석
  const dayMasterElement = stemToElement(dayMaster);
  const monthElement = stemToElement(ganji.stem);

  let overview = '';
  let career = '';
  let wealth = '';
  let love = '';
  let health = '';
  let advice = '';

  // 관계별 해석
  if (relation.stemRelation === '천간합') {
    overview = `${month}월은 하늘의 기운이 조화를 이루는 달입니다. 새로운 기회와 만남이 찾아옵니다.`;
    career = '협력과 파트너십이 빛나는 시기입니다. 팀 프로젝트에서 좋은 성과가 기대됩니다.';
    wealth = '합작 투자나 공동 사업에 유리합니다. 함께 하면 더 큰 이익이 생깁니다.';
    love = '인연이 들어오는 시기입니다. 소개팅이나 새로운 만남에 적극적으로 나서세요.';
    health = '심신이 안정되어 컨디션이 좋습니다.';
    advice = '사람들과의 관계를 소중히 하고, 열린 마음으로 기회를 맞이하세요.';
  } else if (relation.stemRelation === '천간충') {
    overview = `${month}월은 변화와 도전이 있는 달입니다. 예상치 못한 일에 유연하게 대응하세요.`;
    career = '직장에서 갈등이 생길 수 있습니다. 감정적 대응을 피하고 냉정하게 처리하세요.';
    wealth = '투자나 큰 지출은 신중하게 결정하세요. 충동구매를 삼가세요.';
    love = '연인과 다툼이 있을 수 있습니다. 서로의 입장을 이해하려 노력하세요.';
    health = '스트레스 관리에 신경 쓰세요. 충분한 휴식이 필요합니다.';
    advice = '급하게 움직이지 말고 한 발 물러서서 상황을 관망하세요.';
  } else if (relation.stemRelation === '생조') {
    overview = `${month}월은 힘을 받는 달입니다. 에너지가 충만해지고 의욕이 넘칩니다.`;
    career = '업무 능률이 오르고 상사의 인정을 받기 좋습니다.';
    wealth = '재물 운이 상승합니다. 부수입이나 보너스가 기대됩니다.';
    love = '매력이 상승하여 이성에게 좋은 인상을 줍니다.';
    health = '체력이 좋아지고 활력이 넘칩니다.';
    advice = '이 시기의 좋은 기운을 잘 활용하여 중요한 일을 추진하세요.';
  } else if (relation.stemRelation === '극입') {
    overview = `${month}월은 외부 압박이 있는 달입니다. 인내심을 갖고 버티는 것이 중요합니다.`;
    career = '업무량이 증가하거나 예상치 못한 어려움이 생길 수 있습니다.';
    wealth = '지출이 늘 수 있습니다. 계획적인 소비가 필요합니다.';
    love = '연애보다는 자기 계발에 집중하기 좋은 시기입니다.';
    health = '과로에 주의하세요. 무리하지 마세요.';
    advice = '어려움 속에서도 성장의 기회를 찾으세요. 이 시기가 지나면 더 강해집니다.';
  } else {
    overview = `${month}월은 안정적인 달입니다. 꾸준히 노력하면 좋은 결과가 있습니다.`;
    career = '현재 하던 일을 차분히 이어가세요. 급격한 변화는 피하는 것이 좋습니다.';
    wealth = '수입과 지출이 균형을 이룹니다. 저축을 시작하기 좋습니다.';
    love = '기존 관계가 안정되고, 새로운 만남은 천천히 진행됩니다.';
    health = '평소대로 건강을 유지하면 됩니다.';
    advice = '무리하지 말고 꾸준함으로 승부하세요.';
  }

  // 좋은 날과 주의할 날 계산
  const luckyDays: number[] = [];
  const cautionDays: number[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayGanji = getDayGanji(date);
    const dayRelation = analyzeRelation(dayMaster, dayGanji.stem, dayGanji.branch);

    if (dayRelation.score >= 75) {
      luckyDays.push(day);
    } else if (dayRelation.score <= 40) {
      cautionDays.push(day);
    }
  }

  return {
    year,
    month,
    ganji,
    score: relation.score,
    category,
    overview,
    career,
    wealth,
    love,
    health,
    advice,
    luckyDays: luckyDays.slice(0, 5), // 최대 5일
    cautionDays: cautionDays.slice(0, 3), // 최대 3일
  };
}

// ============================================
// 일운 분석
// ============================================

export interface DailyFortune {
  date: Date;
  ganji: { stem: string; branch: string; animal: string };
  score: number;
  category: string;
  overview: string;
  morning: string; // 오전 운세
  afternoon: string; // 오후 운세
  evening: string; // 저녁 운세
  luckyTime: string; // 좋은 시간대
  luckyColor: string;
  luckyNumber: string;
  luckyDirection: string;
  advice: string;
}

export function calculateDailyFortune(
  dayMaster: string,
  date: Date
): DailyFortune {
  const ganji = getDayGanji(date);
  const relation = analyzeRelation(dayMaster, ganji.stem, ganji.branch);

  // 카테고리 결정
  let category = '';
  if (relation.score >= 80) category = '대길';
  else if (relation.score >= 65) category = '길';
  else if (relation.score >= 50) category = '보통';
  else if (relation.score >= 35) category = '주의';
  else category = '흉';

  const dayElement = stemToElement(ganji.stem);
  const dayMasterElement = stemToElement(dayMaster);

  // 시간대별 운세
  let morning = '';
  let afternoon = '';
  let evening = '';
  let luckyTime = '';

  if (relation.score >= 70) {
    morning = '활기찬 아침입니다. 중요한 일을 오전에 처리하세요.';
    afternoon = '좋은 흐름이 이어집니다. 회의나 미팅에 적극적으로 참여하세요.';
    evening = '즐거운 저녁 시간이 될 것입니다. 모임에 참석해 보세요.';
    luckyTime = '오전 9시~11시';
  } else if (relation.score >= 50) {
    morning = '평온한 아침입니다. 차분하게 하루를 시작하세요.';
    afternoon = '업무에 집중하기 좋은 시간입니다.';
    evening = '휴식을 취하며 재충전하세요.';
    luckyTime = '오후 2시~4시';
  } else {
    morning = '서두르지 마세요. 여유를 갖고 움직이세요.';
    afternoon = '감정적인 결정은 피하세요. 신중하게 판단하세요.';
    evening = '집에서 편안히 쉬는 것이 좋습니다.';
    luckyTime = '오후 7시~9시';
  }

  // 오행별 행운 정보
  const luckyInfo: Record<string, { color: string; number: string; direction: string }> = {
    '목': { color: '초록색, 청록색', number: '3, 8', direction: '동쪽' },
    '화': { color: '빨간색, 주황색', number: '2, 7', direction: '남쪽' },
    '토': { color: '노란색, 갈색', number: '5, 10', direction: '중앙' },
    '금': { color: '흰색, 금색', number: '4, 9', direction: '서쪽' },
    '수': { color: '검은색, 파란색', number: '1, 6', direction: '북쪽' },
  };

  // 용신 오행 (간단히 생조하는 오행)
  const dayMasterElementEn = dayMasterElement ? koreanToElement(dayMasterElement as ElementKorean) : null;
  const yongsinElementEn = Object.keys(FIVE_ELEMENTS).find(k => FIVE_ELEMENTS[k as keyof typeof FIVE_ELEMENTS].generates === dayMasterElementEn) || 'earth';
  const yongsinElement = elementToKorean(yongsinElementEn as import('../types').Element);
  const lucky = luckyInfo[yongsinElement];

  // 오버뷰
  let overview = '';
  if (relation.score >= 80) {
    overview = `오늘은 ${ganji.animal}의 날로, 모든 일이 순조롭게 풀리는 대길일입니다. 적극적으로 행동하세요.`;
  } else if (relation.score >= 65) {
    overview = `오늘은 ${ganji.animal}의 날로, 좋은 기운이 함께합니다. 계획한 일을 추진하기 좋습니다.`;
  } else if (relation.score >= 50) {
    overview = `오늘은 ${ganji.animal}의 날로, 평온한 하루가 예상됩니다. 무리하지 않으면 무난합니다.`;
  } else if (relation.score >= 35) {
    overview = `오늘은 ${ganji.animal}의 날로, 조심해야 할 일이 있습니다. 신중하게 행동하세요.`;
  } else {
    overview = `오늘은 ${ganji.animal}의 날로, 주의가 필요합니다. 큰 결정은 미루세요.`;
  }

  // 조언
  let advice = '';
  if (relation.stemRelation === '천간합') {
    advice = '새로운 만남과 협력이 행운을 가져옵니다.';
  } else if (relation.stemRelation === '천간충') {
    advice = '갈등을 피하고 양보하는 마음을 가지세요.';
  } else if (relation.stemRelation === '생조') {
    advice = '자신감을 갖고 도전하세요. 좋은 결과가 있습니다.';
  } else if (relation.stemRelation === '극입') {
    advice = '무리하지 말고 내일을 기약하세요.';
  } else {
    advice = '평소대로 꾸준히 하루를 보내세요.';
  }

  return {
    date,
    ganji,
    score: relation.score,
    category,
    overview,
    morning,
    afternoon,
    evening,
    luckyTime,
    luckyColor: lucky.color,
    luckyNumber: lucky.number,
    luckyDirection: lucky.direction,
    advice,
  };
}

// ============================================
// 운세 캘린더 데이터
// ============================================

export interface CalendarDay {
  day: number;
  ganji: { stem: string; branch: string };
  score: number;
  category: 'excellent' | 'good' | 'normal' | 'caution' | 'bad';
}

export function generateMonthCalendar(
  dayMaster: string,
  year: number,
  month: number
): CalendarDay[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const calendar: CalendarDay[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const ganji = getDayGanji(date);
    const relation = analyzeRelation(dayMaster, ganji.stem, ganji.branch);

    let category: CalendarDay['category'];
    if (relation.score >= 80) category = 'excellent';
    else if (relation.score >= 65) category = 'good';
    else if (relation.score >= 50) category = 'normal';
    else if (relation.score >= 35) category = 'caution';
    else category = 'bad';

    calendar.push({
      day,
      ganji: { stem: ganji.stem, branch: ganji.branch },
      score: relation.score,
      category,
    });
  }

  return calendar;
}
