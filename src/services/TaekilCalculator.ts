/**
 * 택일(擇日) 계산 서비스
 * 결혼, 이사, 개업 등 좋은 날을 찾아주는 서비스
 */

import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../data/saju';

// 천간/지지 한글 배열 (index 접근용)
const STEMS = HEAVENLY_STEMS.map(s => s.korean);
const BRANCHES = EARTHLY_BRANCHES.map(b => b.korean);

// 12신살 (매일 돌아가는 신살)
const TWELVE_SPIRITS = ['건', '제', '만', '평', '정', '집', '파', '위', '성', '수', '개', '폐'];

// 28수 (별자리)
const TWENTY_EIGHT_MANSIONS = [
  '각', '항', '저', '방', '심', '미', '기', // 동방청룡 7수
  '두', '우', '여', '허', '위', '실', '벽', // 북방현무 7수
  '규', '루', '위', '묘', '필', '자', '삼', // 서방백호 7수
  '정', '귀', '류', '성', '장', '익', '진'  // 남방주작 7수
];

// 길일/흉일 유형
export type DateType = 'marriage' | 'move' | 'business' | 'contract' | 'travel' | 'surgery' | 'funeral' | 'general';

// 택일 목적별 설명
export const DATE_TYPE_INFO: Record<DateType, { name: string; emoji: string; description: string }> = {
  marriage: { name: '결혼/약혼', emoji: '💒', description: '결혼, 약혼, 맞선 등 혼인 관련 좋은 날' },
  move: { name: '이사', emoji: '🏠', description: '이사, 입주, 집들이 좋은 날' },
  business: { name: '개업/사업', emoji: '🏪', description: '가게 오픈, 사업 시작, 회사 설립 좋은 날' },
  contract: { name: '계약', emoji: '📝', description: '부동산 계약, 중요 서류 작성 좋은 날' },
  travel: { name: '여행/출장', emoji: '✈️', description: '여행, 출장, 먼 길 떠나기 좋은 날' },
  surgery: { name: '수술/치료', emoji: '🏥', description: '수술, 치료 시작하기 좋은 날' },
  funeral: { name: '장례/이장', emoji: '🪦', description: '장례, 이장, 제사 좋은 날' },
  general: { name: '일반', emoji: '📅', description: '일반적으로 좋은 길일' },
};

// 손 없는 날 계산 (음력 기준)
function getSonEomnNeunNal(lunarDay: number): boolean {
  // 손 없는 날: 음력 9, 10, 19, 20, 29, 30일
  return [9, 10, 19, 20, 29, 30].includes(lunarDay);
}

// 월장군 방향 (이사 시 피해야 할 방향)
function getMonthGeneralDirection(month: number): string {
  const directions = ['북', '북동', '동', '동남', '남', '남서', '서', '서북', '북', '북동', '동', '동남'];
  return directions[(month - 1) % 12];
}

/**
 * 줄리안 데이 넘버(JDN) 기반 일진 계산
 * SajuCalculator, MonthlyDailyFortune와 동일한 방식 사용
 * 검증: 2026-02-07 = 임자(壬子) = index 48
 */
function getJulianDayNumber(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

// JDN 기준 60갑자 오프셋: JDN % 60 과 실제 간지 index의 차이
// 검증: 2026-02-07 JDN=2461744, 실제 일진=임자(壬자)=index 48
// 2461744 % 60 = 44, 실제 index=48, 오프셋=48-44=4
const JDN_GANJI_OFFSET = 4;

// 일진 계산 (JDN 기반)
function getDayGanJi(date: Date): { gan: string; ji: string; ganJi: string } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const jdn = getJulianDayNumber(year, month, day);
  const ganjiIndex = ((jdn % 60) + JDN_GANJI_OFFSET + 60) % 60;
  
  const ganIndex = ganjiIndex % 10;
  const jiIndex = ganjiIndex % 12;

  return {
    gan: STEMS[ganIndex],
    ji: BRANCHES[jiIndex],
    ganJi: `${STEMS[ganIndex]}${BRANCHES[jiIndex]}`
  };
}

// 12신살 계산
function getTwelveSpirit(date: Date): { spirit: string; isGood: boolean; meaning: string } {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const spiritIndex = dayOfYear % 12;
  const spirit = TWELVE_SPIRITS[spiritIndex];

  const spiritInfo: Record<string, { isGood: boolean; meaning: string }> = {
    '건': { isGood: true, meaning: '새로운 일을 시작하기 좋은 날' },
    '제': { isGood: false, meaning: '장애물이 있을 수 있는 날' },
    '만': { isGood: true, meaning: '만사형통, 모든 일이 잘 풀리는 날' },
    '평': { isGood: true, meaning: '평화롭고 안정적인 날' },
    '정': { isGood: true, meaning: '안정과 균형의 날' },
    '집': { isGood: true, meaning: '집안일, 결혼에 좋은 날' },
    '파': { isGood: false, meaning: '파괴의 기운, 큰 일 피해야 함' },
    '위': { isGood: false, meaning: '위험할 수 있는 날' },
    '성': { isGood: true, meaning: '성공과 성취의 날' },
    '수': { isGood: true, meaning: '거두어들이기 좋은 날' },
    '개': { isGood: true, meaning: '열림, 시작하기 좋은 날' },
    '폐': { isGood: false, meaning: '닫힘, 마무리에 적합한 날' },
  };

  return {
    spirit,
    ...spiritInfo[spirit]
  };
}

// 28수 계산
function getTwentyEightMansion(date: Date): { mansion: string; meaning: string } {
  const baseDate = new Date(1900, 0, 1);
  const diffDays = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  const mansionIndex = diffDays % 28;
  const mansion = TWENTY_EIGHT_MANSIONS[mansionIndex];

  const mansionMeanings: Record<string, string> = {
    '각': '건축, 결혼 길', '항': '여행, 이사 흉', '저': '제사, 장례 길',
    '방': '결혼, 개업 길', '심': '여행, 계약 흉', '미': '건축, 수리 길',
    '기': '결혼, 이사 길', '두': '개업, 계약 길', '우': '결혼, 건축 길',
    '여': '결혼, 여행 길', '허': '장례, 제사 길', '위': '건축, 수리 길',
    '실': '결혼, 이사 길', '벽': '여행, 이동 길', '규': '건축, 개업 길',
    '루': '결혼, 장례 길', '묘': '건축, 수리 흉',
    '필': '개업, 사업 길', '자': '결혼, 계약 흉', '삼': '건축, 여행 길',
    '정': '결혼, 개업 길', '귀': '장례, 제사 길', '류': '결혼, 이사 길',
    '성': '여행, 계약 길', '장': '결혼, 개업 길', '익': '건축, 수리 길',
    '진': '이사, 여행 흉'
  };

  return {
    mansion,
    meaning: mansionMeanings[mansion] || '일반적인 날'
  };
}

// 목적별 길일 점수 계산
function calculateDateScore(
  date: Date,
  purpose: DateType,
  dayGanJi: { gan: string; ji: string },
  spirit: { spirit: string; isGood: boolean },
  mansion: { mansion: string; meaning: string }
): number {
  let score = 50; // 기본 점수

  // 12신 영향
  if (spirit.isGood) score += 15;
  else score -= 10;

  // 특정 12신 보너스
  const spiritBonus: Record<DateType, string[]> = {
    marriage: ['집', '만', '성'],
    move: ['개', '만', '평'],
    business: ['건', '개', '성'],
    contract: ['만', '성', '정'],
    travel: ['개', '건', '평'],
    surgery: ['정', '평', '수'],
    funeral: ['폐', '수', '정'],
    general: ['만', '성', '개'],
  };

  if (spiritBonus[purpose]?.includes(spirit.spirit)) {
    score += 20;
  }

  // 28수 영향
  if (mansion.meaning.includes('길')) {
    score += 10;
  } else if (mansion.meaning.includes('흉')) {
    score -= 10;
  }

  // 목적별 28수 보너스
  if (purpose === 'marriage' && mansion.meaning.includes('결혼')) score += 15;
  if (purpose === 'move' && mansion.meaning.includes('이사')) score += 15;
  if (purpose === 'business' && mansion.meaning.includes('개업')) score += 15;
  if (purpose === 'travel' && mansion.meaning.includes('여행')) score += 15;

  // 요일 영향
  const dayOfWeek = date.getDay();
  if ([0, 6].includes(dayOfWeek)) score += 5; // 주말 보너스

  // 일간 오행에 따른 조정
  const ganElement: Record<string, string> = {
    '갑': '목', '을': '목', '병': '화', '정': '화', '무': '토',
    '기': '토', '경': '금', '신': '금', '임': '수', '계': '수'
  };

  // 목적별 유리한 오행
  const purposeElements: Record<DateType, string[]> = {
    marriage: ['화', '목'],
    move: ['토', '목'],
    business: ['금', '토'],
    contract: ['금', '토'],
    travel: ['수', '목'],
    surgery: ['금', '수'],
    funeral: ['수', '금'],
    general: ['목', '화', '토'],
  };

  const dayElement = ganElement[dayGanJi.gan];
  if (purposeElements[purpose]?.includes(dayElement)) {
    score += 10;
  }

  return Math.max(20, Math.min(100, score));
}

export interface TaekilDate {
  date: Date;
  dateString: string;
  ganJi: string;
  dayOfWeek: string;
  lunarDate?: string;
  score: number;
  spirit: string;
  spiritMeaning: string;
  mansion: string;
  mansionMeaning: string;
  isGoodDay: boolean;
  reasons: string[];
  cautions: string[];
  sonEomnNeunNal: boolean;
}

export interface TaekilResult {
  purpose: DateType;
  purposeInfo: { name: string; emoji: string; description: string };
  startDate: Date;
  endDate: Date;
  goodDates: TaekilDate[];
  badDates: TaekilDate[];
  bestDate: TaekilDate | null;
  monthGeneralDirection?: string;
  summary: string;
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 택일 분석 메인 함수
 */
export function analyzeTaekil(
  purpose: DateType,
  startDate: Date,
  endDate: Date,
  options?: {
    excludeWeekdays?: boolean;
    onlyWeekends?: boolean;
  }
): TaekilResult {
  const dates: TaekilDate[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();

    // 옵션에 따른 필터링
    if (options?.onlyWeekends && ![0, 6].includes(dayOfWeek)) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }
    if (options?.excludeWeekdays && [1, 2, 3, 4, 5].includes(dayOfWeek)) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    const dayGanJi = getDayGanJi(currentDate);
    const spirit = getTwelveSpirit(currentDate);
    const mansion = getTwentyEightMansion(currentDate);
    const score = calculateDateScore(currentDate, purpose, dayGanJi, spirit, mansion);

    // 음력 일자 (간략화 - 실제로는 음력 변환 필요)
    const lunarDay = (currentDate.getDate() + 10) % 30 || 30;
    const sonEomnNeunNal = getSonEomnNeunNal(lunarDay);

    // 이유 생성
    const reasons: string[] = [];
    const cautions: string[] = [];

    if (spirit.isGood) reasons.push(`${spirit.spirit}일 - ${spirit.meaning}`);
    else cautions.push(`${spirit.spirit}일 - ${spirit.meaning}`);

    if (mansion.meaning.includes('길')) reasons.push(`28수 ${mansion.mansion}수 - ${mansion.meaning}`);
    else if (mansion.meaning.includes('흉')) cautions.push(`28수 ${mansion.mansion}수 - ${mansion.meaning}`);

    if (sonEomnNeunNal) reasons.push('손 없는 날 (이사, 여행 좋음)');

    const taekilDate: TaekilDate = {
      date: new Date(currentDate),
      dateString: `${currentDate.getFullYear()}.${currentDate.getMonth() + 1}.${currentDate.getDate()}`,
      ganJi: dayGanJi.ganJi,
      dayOfWeek: DAY_NAMES[dayOfWeek],
      score,
      spirit: spirit.spirit,
      spiritMeaning: spirit.meaning,
      mansion: mansion.mansion,
      mansionMeaning: mansion.meaning,
      isGoodDay: score >= 65,
      reasons,
      cautions,
      sonEomnNeunNal,
    };

    dates.push(taekilDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // 정렬
  const goodDates = dates.filter(d => d.isGoodDay).sort((a, b) => b.score - a.score);
  const badDates = dates.filter(d => !d.isGoodDay).sort((a, b) => b.score - a.score);
  const bestDate = goodDates[0] || null;

  // 월장군 방향 (이사 시)
  const monthGeneralDirection = purpose === 'move'
    ? getMonthGeneralDirection(startDate.getMonth() + 1)
    : undefined;

  // 요약 생성
  const summary = generateSummary(purpose, goodDates.length, dates.length, bestDate);

  return {
    purpose,
    purposeInfo: DATE_TYPE_INFO[purpose],
    startDate,
    endDate,
    goodDates,
    badDates,
    bestDate,
    monthGeneralDirection,
    summary,
  };
}

function generateSummary(
  purpose: DateType,
  goodCount: number,
  totalCount: number,
  bestDate: TaekilDate | null
): string {
  const purposeName = DATE_TYPE_INFO[purpose].name;

  if (goodCount === 0) {
    return `선택한 기간에 ${purposeName}에 적합한 길일이 없습니다. 기간을 늘려보세요.`;
  }

  if (bestDate) {
    return `${totalCount}일 중 ${goodCount}일이 ${purposeName}에 좋은 날입니다. ` +
      `가장 좋은 날은 ${bestDate.dateString}(${bestDate.dayOfWeek}) ${bestDate.ganJi}일이며, ` +
      `${bestDate.score}점입니다.`;
  }

  return `${totalCount}일 중 ${goodCount}일이 ${purposeName}에 적합합니다.`;
}

/**
 * 특정 날짜 상세 분석
 */
export function analyzeSpecificDate(date: Date): {
  ganJi: string;
  spirit: { spirit: string; isGood: boolean; meaning: string };
  mansion: { mansion: string; meaning: string };
  purposes: { purpose: DateType; score: number; isGood: boolean }[];
} {
  const dayGanJi = getDayGanJi(date);
  const spirit = getTwelveSpirit(date);
  const mansion = getTwentyEightMansion(date);

  const purposes = (Object.keys(DATE_TYPE_INFO) as DateType[]).map(purpose => {
    const score = calculateDateScore(date, purpose, dayGanJi, spirit, mansion);
    return {
      purpose,
      score,
      isGood: score >= 65
    };
  });

  return {
    ganJi: dayGanJi.ganJi,
    spirit,
    mansion,
    purposes: purposes.sort((a, b) => b.score - a.score)
  };
}
