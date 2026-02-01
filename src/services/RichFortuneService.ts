/**
 * 풍부한 운세 해석 서비스
 * 문학적 비유와 상세한 맞춤 해석을 제공합니다.
 */

import { SajuResult, Element } from '../types';
import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../data/saju';
import {
  RICH_ILJU_DATA,
  RichIljuData,
  YEAR_STEM_FORTUNE,
  YEAR_BRANCH_FORTUNE,
  DAY_YEAR_RELATIONS,
  DayMasterYearRelation,
} from '../data/richInterpretations';
import {
  EASY_DAY_RELATIONS,
  EasyDayRelation,
  ILJU_DAILY_BONUS,
  IljuDailyBonus,
  ILJU_60_INTERPRETATIONS,
  Ilju60Interpretation,
  SITUATION_POOL,
  LUCKY_POINT_POOL,
  KEYWORD_POOL,
  ComprehensiveFortuneData,
} from '../data/fortuneMessages';

// 천간을 오행으로 변환
const STEM_TO_ELEMENT: Record<string, Element> = {
  '갑': 'wood', '을': 'wood',
  '병': 'fire', '정': 'fire',
  '무': 'earth', '기': 'earth',
  '경': 'metal', '신': 'metal',
  '임': 'water', '계': 'water',
};

// 오행 한글 이름
const ELEMENT_KOREAN: Record<Element, string> = {
  wood: '목(木)',
  fire: '화(火)',
  earth: '토(土)',
  metal: '금(金)',
  water: '수(水)',
};

// 지지를 오행으로 변환
const BRANCH_TO_ELEMENT: Record<string, Element> = {
  '인': 'wood', '묘': 'wood',     // 목
  '사': 'fire', '오': 'fire',     // 화
  '진': 'earth', '술': 'earth', '축': 'earth', '미': 'earth', // 토
  '신': 'metal', '유': 'metal',   // 금
  '해': 'water', '자': 'water',   // 수
};

// ===== 날짜 기반 시드 함수 (일관된 운세를 위해) =====
// 같은 날 같은 일주 = 같은 결과
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit 정수로 변환
  }
  return Math.abs(hash);
}

// 시드 기반 난수 생성 (Mulberry32)
function seededRandom(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// 날짜+일주 기반 시드 생성
function getDailySeed(ilju: string, todayStem: string, todayBranch: string): number {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  return hashCode(`${dateStr}-${ilju}-${todayStem}${todayBranch}`);
}

// 시드 기반 셔플 함수
function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  const random = seededRandom(seed);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 날짜 기반 시드로 상황 메시지 선택 (매일 다른 조합)
function selectDailyMessages(random: () => number, seed: number) {
  // 긍정적 상황 1-2개
  const positiveCount = Math.floor(random() * 2) + 1;
  const positives = shuffleWithSeed(SITUATION_POOL.positive, seed)
    .slice(0, positiveCount);

  // 중립 상황 1개
  const neutral = shuffleWithSeed(SITUATION_POOL.neutral, seed)[0];

  // 주의 상황 0-1개 (50% 확률)
  const caution = random() > 0.5
    ? shuffleWithSeed(SITUATION_POOL.caution, seed)[0]
    : null;

  // 행운 포인트 1개
  const luckyPoint = shuffleWithSeed(LUCKY_POINT_POOL, seed)[0];

  // 키워드 3개 (각 카테고리에서 1개씩)
  const keywords = [
    shuffleWithSeed(KEYWORD_POOL.emotion, seed)[0],
    shuffleWithSeed(KEYWORD_POOL.action, seed)[0],
    shuffleWithSeed(KEYWORD_POOL.value, seed)[0],
  ];

  return { positives, neutral, caution, luckyPoint, keywords };
}

// ===== 지지 관계 분석 =====
// 지지 합(合) - 육합
const BRANCH_HARMONY: Record<string, string> = {
  '자': '축', '축': '자',
  '인': '해', '해': '인',
  '묘': '술', '술': '묘',
  '진': '유', '유': '진',
  '사': '신', '신': '사',
  '오': '미', '미': '오',
};

// 지지 충(冲) - 육충
const BRANCH_CLASH: Record<string, string> = {
  '자': '오', '오': '자',
  '축': '미', '미': '축',
  '인': '신', '신': '인',
  '묘': '유', '유': '묘',
  '진': '술', '술': '진',
  '사': '해', '해': '사',
};

// 지지 형(刑) - 삼형
const BRANCH_PUNISHMENT: Record<string, string[]> = {
  '인': ['사', '신'],
  '사': ['인', '신'],
  '신': ['인', '사'],
  '축': ['술', '미'],
  '술': ['축', '미'],
  '미': ['축', '술'],
  '자': ['묘'],
  '묘': ['자'],
};

// 지지 관계 분석 함수
function analyzeBranchRelation(dayBranch: string, todayBranch: string): {
  type: 'harmony' | 'clash' | 'punishment' | 'neutral';
  effect: string;
  advice: string;
} {
  // 합(合) 체크
  if (BRANCH_HARMONY[dayBranch] === todayBranch) {
    return {
      type: 'harmony',
      effect: '육합(六合)의 날 - 조화와 협력이 빛나는 시기',
      advice: '인연을 맺거나 협력 관계를 강화하기 좋은 날입니다.',
    };
  }

  // 충(冲) 체크
  if (BRANCH_CLASH[dayBranch] === todayBranch) {
    return {
      type: 'clash',
      effect: '육충(六冲)의 날 - 변화와 움직임이 많은 시기',
      advice: '이사, 여행, 변화가 생길 수 있어요. 충돌을 피하고 유연하게 대처하세요.',
    };
  }

  // 형(刑) 체크
  if (BRANCH_PUNISHMENT[dayBranch]?.includes(todayBranch)) {
    return {
      type: 'punishment',
      effect: '형살(刑煞)의 날 - 갈등이나 마찰에 주의',
      advice: '말과 행동을 조심하고, 분쟁을 피하세요. 법적 문제도 주의하세요.',
    };
  }

  return {
    type: 'neutral',
    effect: '평온한 기운의 날',
    advice: '자연스러운 흐름에 맡기세요.',
  };
}

// ===== 월령(月令) 분석 =====
function getMonthlyInfluence(dayElement: Element): {
  season: string;
  strength: 'strong' | 'weak' | 'neutral';
  message: string;
} {
  const month = new Date().getMonth() + 1; // 1-12

  // 계절별 왕상(旺相) 판단 (간략화)
  // 봄(2-4): 목왕, 여름(5-7): 화왕, 가을(8-10): 금왕, 겨울(11-1): 수왕
  const seasonData: Record<number, { season: string; strong: Element; weak: Element }> = {
    1: { season: '한겨울', strong: 'water', weak: 'fire' },
    2: { season: '이른봄', strong: 'wood', weak: 'metal' },
    3: { season: '봄', strong: 'wood', weak: 'metal' },
    4: { season: '늦봄', strong: 'wood', weak: 'metal' },
    5: { season: '초여름', strong: 'fire', weak: 'water' },
    6: { season: '여름', strong: 'fire', weak: 'water' },
    7: { season: '한여름', strong: 'fire', weak: 'water' },
    8: { season: '초가을', strong: 'metal', weak: 'wood' },
    9: { season: '가을', strong: 'metal', weak: 'wood' },
    10: { season: '늦가을', strong: 'metal', weak: 'wood' },
    11: { season: '초겨울', strong: 'water', weak: 'fire' },
    12: { season: '겨울', strong: 'water', weak: 'fire' },
  };

  const data = seasonData[month];

  if (dayElement === data.strong) {
    return {
      season: data.season,
      strength: 'strong',
      message: `${data.season}, 당신의 기운이 왕성합니다. 적극적으로 움직이세요!`,
    };
  } else if (dayElement === data.weak) {
    return {
      season: data.season,
      strength: 'weak',
      message: `${data.season}, 기운이 약해지는 시기입니다. 무리하지 말고 내실을 다지세요.`,
    };
  }

  return {
    season: data.season,
    strength: 'neutral',
    message: `${data.season}, 균형 잡힌 기운입니다. 꾸준히 나아가세요.`,
  };
}

// 일주(일간+일지) 가져오기
export function getIlju(sajuResult: SajuResult | null): string | null {
  if (!sajuResult?.pillars?.day) return null;
  const dayStem = sajuResult.pillars.day.stem;
  const dayBranch = sajuResult.pillars.day.branch;
  return dayStem + dayBranch;
}

// 일간 가져오기
export function getDayMaster(sajuResult: SajuResult | null): string | null {
  if (!sajuResult?.pillars?.day) return null;
  return sajuResult.pillars.day.stem;
}

// 일간의 오행 가져오기
export function getDayMasterElement(sajuResult: SajuResult | null): Element | null {
  const dayMaster = getDayMaster(sajuResult);
  if (!dayMaster) return null;
  return STEM_TO_ELEMENT[dayMaster] || null;
}

// 풍부한 일주 해석 가져오기
export function getRichIljuInterpretation(sajuResult: SajuResult | null): RichIljuData | null {
  const ilju = getIlju(sajuResult);
  if (!ilju) return null;
  return RICH_ILJU_DATA[ilju] || null;
}

// 특정 년도의 간지 계산
export function getYearGanji(year: number): { stem: string; branch: string } {
  // 1984년 = 갑자년 기준
  const baseYear = 1984;
  const stems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  const branches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

  const diff = year - baseYear;
  const stemIndex = ((diff % 10) + 10) % 10;
  const branchIndex = ((diff % 12) + 12) % 12;

  return {
    stem: stems[stemIndex],
    branch: branches[branchIndex],
  };
}

// 년운 해석 인터페이스
export interface YearFortuneInterpretation {
  // 해당 년도 간지
  yearGanji: string;
  // 해당 년도 천간 특성
  stemFortune: {
    character: string;
    energy: string;
    keywords: string[];
  };
  // 해당 년도 지지 특성
  branchFortune: {
    animal: string;
    character: string;
    energy: string;
    keywords: string[];
  };
  // 내 일간과 해당 년도 천간의 관계
  dayYearRelation: DayMasterYearRelation | null;
  // 종합 해석
  overallInterpretation: string;
  // 핵심 메시지
  coreMessage: string;
  // 조언
  advice: string;
}

// 년운(세운) 해석 생성
export function getYearFortuneInterpretation(
  sajuResult: SajuResult | null,
  year: number
): YearFortuneInterpretation | null {
  if (!sajuResult) return null;

  const dayElement = getDayMasterElement(sajuResult);
  if (!dayElement) return null;

  const yearGanji = getYearGanji(year);
  const yearStemElement = STEM_TO_ELEMENT[yearGanji.stem];

  const stemFortune = YEAR_STEM_FORTUNE[yearGanji.stem];
  const branchFortune = YEAR_BRANCH_FORTUNE[yearGanji.branch];

  // 일간 오행과 년운 천간 오행의 관계
  const dayYearRelation = DAY_YEAR_RELATIONS[dayElement]?.[yearStemElement] || null;

  // 종합 해석 생성
  const overallInterpretation = generateOverallYearInterpretation(
    sajuResult,
    yearGanji,
    stemFortune,
    branchFortune,
    dayYearRelation,
    year
  );

  // 핵심 메시지 생성
  const coreMessage = generateCoreYearMessage(dayYearRelation, stemFortune, branchFortune);

  // 조언 생성
  const advice = generateYearAdvice(dayYearRelation, stemFortune);

  return {
    yearGanji: yearGanji.stem + yearGanji.branch,
    stemFortune,
    branchFortune,
    dayYearRelation,
    overallInterpretation,
    coreMessage,
    advice,
  };
}

// 종합 년운 해석 생성
function generateOverallYearInterpretation(
  sajuResult: SajuResult,
  yearGanji: { stem: string; branch: string },
  stemFortune: { character: string; energy: string; keywords: string[] },
  branchFortune: { animal: string; character: string; energy: string; keywords: string[] },
  dayYearRelation: DayMasterYearRelation | null,
  year: number
): string {
  const ilju = getIlju(sajuResult);
  const richIlju = ilju ? RICH_ILJU_DATA[ilju] : null;
  const dayMaster = getDayMaster(sajuResult);
  const dayElement = getDayMasterElement(sajuResult);

  let interpretation = '';

  // 1. 사주 핵심 분석 (문학적 비유)
  if (richIlju) {
    interpretation += `🌟 **사주 핵심 분석: "${richIlju.metaphor}"**\n\n`;
    interpretation += `본인의 타고난 기운(일주): ${ilju}(${dayMaster}) 일주입니다.\n\n`;
    interpretation += `**형상**: ${richIlju.metaphor}\n\n`;
    interpretation += `**성향**: ${richIlju.essence}\n\n`;
    interpretation += `**현재 상태**: ${richIlju.needs}\n\n`;
  }

  // 2. 해당 년도 운세
  interpretation += `📅 **${year}년(${yearGanji.stem}${yearGanji.branch}년) 운세**\n\n`;
  interpretation += `${year}년은 ${yearGanji.stem}${yearGanji.branch}(${branchFortune.animal})년으로, `;
  interpretation += `${stemFortune.character}이 들어오는 해입니다.\n\n`;
  interpretation += `${stemFortune.energy}\n\n`;

  // 3. 일간과 년운의 관계
  if (dayYearRelation) {
    interpretation += `**${dayElement ? ELEMENT_KOREAN[dayElement] : ''} 일간에게 이 해는**: `;
    interpretation += `${dayYearRelation.relation}\n\n`;
    interpretation += `${dayYearRelation.meaning}\n\n`;
    interpretation += `**운의 흐름**: ${dayYearRelation.fortune}\n\n`;
  }

  return interpretation;
}

// 핵심 메시지 생성
function generateCoreYearMessage(
  dayYearRelation: DayMasterYearRelation | null,
  stemFortune: { character: string; energy: string; keywords: string[] },
  branchFortune: { animal: string; character: string; energy: string; keywords: string[] }
): string {
  if (dayYearRelation) {
    return dayYearRelation.fortune;
  }
  return `${stemFortune.keywords.join(', ')}의 기운이 흐르는 해입니다.`;
}

// 년운 조언 생성
function generateYearAdvice(
  dayYearRelation: DayMasterYearRelation | null,
  stemFortune: { character: string; energy: string; keywords: string[] }
): string {
  if (dayYearRelation) {
    return dayYearRelation.advice;
  }
  return '기회를 잘 살펴보고 신중하게 결정하세요.';
}

// 오늘의 풍부한 운세 해석 (확장된 버전)
export interface RichDailyFortune {
  // 문학적 비유 (일주 기반)
  metaphor: string;
  // 핵심 이미지
  image: string;
  // 타고난 기질
  essence: string;
  // 필요한 오행
  needs: string;
  // 인생 테마
  lifeTheme: string;
  // 오늘의 맞춤 해석
  todayInterpretation: string;
  // 오늘의 핵심 조언
  todayAdvice: string;
  // 오늘의 키워드
  keywords: string[];
  // 오늘과 일간의 관계 (쉬운 제목)
  dayRelation: string;
  // 상세 해석 (풍부한 버전)
  interpretation: string;
  // 핵심 조언
  advice: string;
  // 행운의 시간
  luckyTime: string;

  // === 새로 추가된 풍부한 해석 ===
  // 한 줄 요약
  summary: string;
  // 상세 풀이 (3-4문장)
  detailedInterpretation: string;
  // 구체적인 상황 예시
  situations: string[];
  // 오늘 이렇게 하세요
  doThis: string[];
  // 오늘 이건 피하세요
  avoidThis: string[];
  // 행운 포인트
  luckyPoint: string;
  // 일주별 추가 조언 (있는 경우)
  iljuBonus?: {
    todayWarning: string;
    todayStrength: string;
    luckyTip: string;
  };
  // 나의 일주와 오늘의 만남 (문학적 표현)
  todayMeeting: string;
  // 오늘 나에게 하는 말 (1인칭 조언)
  personalMessage: string;
  // === 신규: 지지 관계 분석 ===
  branchRelation?: {
    type: 'harmony' | 'clash' | 'punishment' | 'neutral';
    effect: string;
    advice: string;
  };
  // === 신규: 월령 영향 ===
  monthlyInfluence?: {
    season: string;
    strength: 'strong' | 'weak' | 'neutral';
    message: string;
  };
  // === 신규: 60갑자 상세 해석 ===
  ilju60Interpretation?: Ilju60Interpretation;
  // === 신규: 종합 운세 데이터 ===
  comprehensiveFortune?: ComprehensiveFortuneData;
}

// 오늘의 풍부한 운세 생성 (확장 버전)
export function generateRichDailyFortune(
  sajuResult: SajuResult | null,
  todayStem: string,
  todayBranch: string
): RichDailyFortune | null {
  if (!sajuResult) return null;

  const richIlju = getRichIljuInterpretation(sajuResult);
  const dayElement = getDayMasterElement(sajuResult);
  const todayElement = STEM_TO_ELEMENT[todayStem];
  const ilju = getIlju(sajuResult);
  const dayBranch = sajuResult.pillars?.day?.branch;

  if (!richIlju || !dayElement || !todayElement || !ilju || !dayBranch) return null;

  // 날짜 기반 시드 생성 (같은 날 같은 운세)
  const seed = getDailySeed(ilju, todayStem, todayBranch);
  const random = seededRandom(seed);

  // 쉬운 일일 운세 데이터 가져오기
  const easyRelation = EASY_DAY_RELATIONS[dayElement]?.[todayElement];

  // 일주별 추가 보너스 해석
  const iljuBonus = ilju ? ILJU_DAILY_BONUS[ilju] : undefined;

  // === 신규: 60갑자 상세 해석 ===
  const ilju60Interpretation = ilju ? ILJU_60_INTERPRETATIONS[ilju] : undefined;

  // === 신규: 지지 관계 분석 (육합/육충/형살) ===
  const branchRelation = analyzeBranchRelation(dayBranch, todayBranch);

  // === 신규: 월령 영향 분석 ===
  const monthlyInfluence = getMonthlyInfluence(dayElement);

  // === 신규: 랜덤 메시지 풀에서 매일 다른 조합 선택 ===
  const dailyMessages = selectDailyMessages(random, seed);

  // 기본값 설정 (랜덤 메시지 풀 활용)
  let dayRelation = '조화로운 하루';
  let summary = '평온하고 안정적인 하루입니다.';
  let detailedInterpretation = '오늘의 기운과 조화를 이루며 나아가세요. 자연스러운 흐름에 몸을 맡기되, 자신의 페이스를 유지하며 진행하세요.';
  // 상황 메시지: 긍정적 1-2개 + 중립 1개 + 주의 0-1개
  let situations: string[] = [...dailyMessages.positives, dailyMessages.neutral];
  if (dailyMessages.caution) {
    situations.push(dailyMessages.caution);
  }
  let doThis: string[] = ['자신의 페이스 유지하기', '여유 있게 하루 별내기'];
  let avoidThis: string[] = ['무리한 계획', '조급해하기'];
  // 행운 포인트: 랜덤 풀에서 선택
  let luckyPoint = dailyMessages.luckyPoint;
  // 키워드: 랜덤 풀 3개 + 일주 특성 2개
  let keywords: string[] = [...dailyMessages.keywords, ...richIlju.strengthKeywords.slice(0, 2)];
  let advice = '자신의 페이스를 유지하며 진행하세요.';

  // 쉬운 해석 데이터가 있으면 적용 (랜덤 메시지 풀과 병합)
  if (easyRelation) {
    dayRelation = easyRelation.title;
    summary = easyRelation.summary;
    detailedInterpretation = easyRelation.detailed;
    // situations는 랜덤 풀에서 가져온 것과 병합
    situations = [...easyRelation.situations, ...situations].slice(0, 5);
    doThis = easyRelation.doThis;
    avoidThis = easyRelation.avoidThis;
    // luckyPoint는 50% 확률로 랜덤 풀에서 선택
    luckyPoint = random() > 0.5 ? easyRelation.luckyPoint : dailyMessages.luckyPoint;
    // keywords는 랜덤 풀과 병합
    keywords = [...easyRelation.keywords, ...dailyMessages.keywords].slice(0, 5);
    advice = easyRelation.doThis[0]; // 첫 번째 권장사항을 조언으로
  }

  // 60갑자 상세 해석이 있으면 추가 정보 반영
  if (ilju60Interpretation) {
    // 오행+60갑자 통합 상세 해석
    const combinedDetail = `${ilju60Interpretation.poeticImage}인 당신에게 ${easyRelation?.title || '오늘'}이 찾아왔습니다.\n\n${ilju60Interpretation.dailyInfluence}\n\n${easyRelation?.detailed || detailedInterpretation}`;
    detailedInterpretation = combinedDetail;

    // 60갑자별 좋은 활동 추가
    const randomGoodActivity = ilju60Interpretation.goodActivities[Math.floor(random() * ilju60Interpretation.goodActivities.length)];
    if (!doThis.includes(randomGoodActivity)) {
      doThis = [randomGoodActivity, ...doThis];
    }

    // 60갑자별 피해야 할 상황 추가
    const randomAvoidSituation = ilju60Interpretation.avoidSituations[Math.floor(random() * ilju60Interpretation.avoidSituations.length)];
    if (!avoidThis.includes(randomAvoidSituation)) {
      avoidThis = [randomAvoidSituation, ...avoidThis];
    }

    // 키워드에 핵심 성격 추가
    keywords = [...new Set([...ilju60Interpretation.coreTraits.slice(0, 2), ...keywords])].slice(0, 5);
  }

  // 행운의 시간 계산 (오행에 따라)
  const luckyTimeMap: Record<Element, string> = {
    wood: '오전 5시-9시 (인묘시)',
    fire: '오전 9시-오후 1시 (사오시)',
    earth: '오후 1시-5시 (미신시)',
    metal: '오후 5시-9시 (유술시)',
    water: '오후 9시-오전 1시 (해자시)',
  };
  const luckyTime = luckyTimeMap[todayElement] || '';

  // 종합 해석 문장 구성
  const interpretation = `${summary}\n\n${detailedInterpretation}`;

  // 나의 일주와 오늘의 만남 (문학적 표현 생성)
  const todayMeeting = generateTodayMeeting(richIlju, dayElement, todayElement, todayStem);

  // 오늘 나에게 하는 말 (1인칭 개인화된 메시지) - 시드 기반 랜덤
  const personalMessage = generatePersonalMessage(richIlju, easyRelation, iljuBonus, random);

  // 지지 관계에 따른 상황 추가
  if (branchRelation.type === 'harmony') {
    situations = [...situations, '뜻밖의 도움이나 좋은 인연을 만날 수 있어요'];
    doThis = [...doThis, '협력과 화합을 추구하세요'];
  } else if (branchRelation.type === 'clash') {
    situations = [...situations, '예상치 못한 변화나 이동이 있을 수 있어요'];
    avoidThis = [...avoidThis, '충동적인 결정', '불필요한 다툼'];
  } else if (branchRelation.type === 'punishment') {
    situations = [...situations, '오해나 갈등이 생길 수 있는 날이에요'];
    avoidThis = [...avoidThis, '언쟁이나 논쟁', '법적 문제와 관련된 일'];
  }

  // 월령에 따른 조언 추가
  if (monthlyInfluence.strength === 'strong') {
    doThis = [...doThis, '적극적으로 기회를 잡으세요'];
  } else if (monthlyInfluence.strength === 'weak') {
    avoidThis = [...avoidThis, '무리한 일정이나 과욕'];
  }

  return {
    // 일주 기본 정보
    metaphor: richIlju.metaphor,
    image: richIlju.image,
    essence: richIlju.essence,
    needs: richIlju.needs,
    lifeTheme: richIlju.lifeTheme,

    // 오늘의 운세 (기존 호환)
    todayInterpretation: interpretation,
    todayAdvice: advice,
    keywords,
    dayRelation,
    interpretation,
    advice,
    luckyTime,

    // 새로운 풍부한 해석
    summary,
    detailedInterpretation,
    situations,
    doThis,
    avoidThis,
    luckyPoint,
    iljuBonus,
    todayMeeting,
    personalMessage,

    // 신규: 지지 관계 및 월령
    branchRelation,
    monthlyInfluence,
    // 신규: 60갑자 상세 해석
    ilju60Interpretation,
  };
}

// 나의 일주와 오늘의 만남 문학적 표현 생성
function generateTodayMeeting(
  richIlju: RichIljuData,
  dayElement: Element,
  todayElement: Element,
  todayStem: string
): string {
  // 오늘 천간 한글 이름
  const stemNames: Record<string, string> = {
    '갑': '갑목(甲木)', '을': '을목(乙木)',
    '병': '병화(丙火)', '정': '정화(丁火)',
    '무': '무토(戊土)', '기': '기토(己土)',
    '경': '경금(庚金)', '신': '신금(辛金)',
    '임': '임수(壬水)', '계': '계수(癸水)',
  };

  // 오행 자연 표현
  const elementNature: Record<Element, string> = {
    wood: '푸른 나무의 기운',
    fire: '불꽃의 에너지',
    earth: '대지의 품',
    metal: '쇠의 단단함',
    water: '물의 지혜',
  };

  // 관계별 만남 표현
  const relationMeetings: Record<string, Record<string, string>> = {
    wood: {
      wood: `오늘, ${richIlju.metaphor}인 당신에게 같은 숲의 나무들이 찾아옵니다. 서로 햇빛을 향해 경쟁하듯, 비슷한 에너지가 부딪히지만 함께 숲을 이룰 수도 있습니다.`,
      fire: `오늘, ${richIlju.metaphor}인 당신이 불꽃을 만납니다. 나무가 불을 피워 세상을 밝히듯, 당신 안의 재능이 밖으로 터져 나오려 합니다.`,
      earth: `오늘, ${richIlju.metaphor}인 당신이 비옥한 땅을 만납니다. 나무가 흙에서 영양분을 흡수하듯, 성과와 결실을 거둘 수 있는 날입니다.`,
      metal: `오늘, ${richIlju.metaphor}인 당신이 날카로운 도끼를 만납니다. 시련처럼 느껴지지만, 다듬어져 더 아름다운 형태가 될 수 있습니다.`,
      water: `오늘, ${richIlju.metaphor}인 당신에게 생명의 물이 흘러들어옵니다. 지혜와 도움의 손길이 당신을 성장하게 합니다.`,
    },
    fire: {
      wood: `오늘, ${richIlju.metaphor}인 당신에게 땔감이 들어옵니다. 나무가 불을 지피듯, 누군가의 지원과 응원이 당신을 밝게 합니다.`,
      fire: `오늘, ${richIlju.metaphor}인 당신이 또 다른 불꽃을 만납니다. 열정이 더해져 활활 타오르지만, 과열되지 않도록 조절이 필요합니다.`,
      earth: `오늘, ${richIlju.metaphor}인 당신이 따뜻한 흙을 만납니다. 불이 흙을 데워 생명을 키우듯, 당신의 열정이 결실로 이어집니다.`,
      metal: `오늘, ${richIlju.metaphor}인 당신이 금속을 만납니다. 불이 쇠를 녹이듯, 당신의 능력이 재물과 성과로 연결됩니다.`,
      water: `오늘, ${richIlju.metaphor}인 당신에게 물의 기운이 찾아옵니다. 불과 물의 균형처럼, 휴식과 조절이 필요한 날입니다.`,
    },
    earth: {
      wood: `오늘, ${richIlju.metaphor}인 당신의 땅에 나무 뿌리가 뻗어옵니다. 변화의 바람이 불어오니 유연하게 받아들이세요.`,
      fire: `오늘, ${richIlju.metaphor}인 당신에게 따뜻한 햇살이 내리쬡니다. 주변의 응원과 지지가 당신을 든든하게 합니다.`,
      earth: `오늘, ${richIlju.metaphor}인 당신이 넓은 대지를 만납니다. 안정과 평화 속에서 내실을 다지는 날입니다.`,
      metal: `오늘, ${richIlju.metaphor}인 당신에게서 보석이 캐어집니다. 노력이 결실로 나타나는 때입니다.`,
      water: `오늘, ${richIlju.metaphor}인 당신에게 물이 흘러들어옵니다. 재물과 기회의 에너지가 당신을 풍요롭게 합니다.`,
    },
    metal: {
      wood: `오늘, ${richIlju.metaphor}인 당신이 나무를 만납니다. 도끼가 나무를 베듯, 당신의 능력이 재물로 연결됩니다.`,
      fire: `오늘, ${richIlju.metaphor}인 당신이 불을 만납니다. 쇠가 불에 달궈져 더 강해지듯, 시련이 성장의 기회가 됩니다.`,
      earth: `오늘, ${richIlju.metaphor}인 당신에게 흙의 보호가 찾아옵니다. 안정감과 지지 속에서 성장할 수 있는 날입니다.`,
      metal: `오늘, ${richIlju.metaphor}인 당신이 또 다른 쇠를 만납니다. 서로 부딪혀 날카로워지거나, 협력하여 강해질 수 있습니다.`,
      water: `오늘, ${richIlju.metaphor}인 당신에게서 맑은 물이 흘러나옵니다. 아이디어와 표현력이 샘솟는 날입니다.`,
    },
    water: {
      wood: `오늘, ${richIlju.metaphor}인 당신이 키운 나무에서 열매가 열립니다. 투자와 노력이 결실을 맺는 때입니다.`,
      fire: `오늘, ${richIlju.metaphor}인 당신이 불을 만납니다. 물과 불이 만나 균형을 이루며, 재물 활동이 활발해집니다.`,
      earth: `오늘, ${richIlju.metaphor}인 당신에게 둑이 쳐집니다. 흐름이 막힐 수 있으니 규칙을 따르고 인내하세요.`,
      metal: `오늘, ${richIlju.metaphor}인 당신에게 금속의 맑은 기운이 더해집니다. 지혜와 도움이 흘러들어오는 날입니다.`,
      water: `오늘, ${richIlju.metaphor}인 당신이 넓은 바다를 만납니다. 지혜가 더 깊어지고 통찰력이 빛나는 날입니다.`,
    },
  };

  return relationMeetings[dayElement]?.[todayElement] ||
    `오늘, ${richIlju.metaphor}인 당신에게 ${elementNature[todayElement]}이 찾아옵니다.`;
}

// 오늘 나에게 하는 말 (개인화된 1인칭 메시지) - 시드 기반 랜덤
function generatePersonalMessage(
  richIlju: RichIljuData,
  easyRelation: EasyDayRelation | undefined,
  iljuBonus: IljuDailyBonus | undefined,
  random: () => number // 시드 기반 랜덤 함수
): string {
  // 일주 특성 기반 기본 메시지
  const baseMessages = [
    `당신의 강점인 '${richIlju.strengthKeywords[0]}'을 오늘 발휘해보세요.`,
    `'${richIlju.essence}'인 당신답게 오늘을 보내세요.`,
    `오늘은 '${richIlju.lifeTheme}'라는 당신의 인생 테마와 맞닿은 날입니다.`,
  ];

  // 시드 기반 랜덤 사용 (같은 날 같은 결과)
  let message = baseMessages[Math.floor(random() * baseMessages.length)];

  // 일주 보너스가 있으면 그것을 우선 사용
  if (iljuBonus) {
    message = iljuBonus.todayStrength;
  }

  // easyRelation이 있으면 조합
  if (easyRelation) {
    message += ` ${easyRelation.doThis[0]}는 것이 오늘의 핵심입니다.`;
  }

  return message;
}

// 카테고리별 상세 운세 해석
export interface CategoryFortune {
  career: {
    title: string;
    message: string;
    advice: string;
  };
  wealth: {
    title: string;
    message: string;
    advice: string;
  };
  love: {
    title: string;
    message: string;
    advice: string;
  };
  health: {
    title: string;
    message: string;
    advice: string;
  };
}

// 점수에 따른 등급
type FortuneLevel = 'excellent' | 'good' | 'neutral' | 'caution';

function getFortuneLevel(score: number): FortuneLevel {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'neutral';
  return 'caution';
}

// 카테고리별 맞춤 해석 생성
export function generateCategoryFortune(
  sajuResult: SajuResult | null,
  scores: { overall: number; love: number; money: number; work: number; health: number }
): CategoryFortune {
  const richIlju = getRichIljuInterpretation(sajuResult);

  // 기본 해석 템플릿
  const templates = {
    career: {
      excellent: {
        title: '승승장구하는 직장운',
        message: '업무에서 탁월한 능력을 발휘하고 인정받습니다.',
        advice: '적극적으로 의견을 내고 리더십을 발휘하세요.',
      },
      good: {
        title: '순조로운 직장운',
        message: '계획한 대로 업무가 진행됩니다.',
        advice: '팀워크를 발휘하면 더 좋은 결과가 있습니다.',
      },
      neutral: {
        title: '무난한 직장운',
        message: '큰 변화 없이 현상 유지하는 흐름입니다.',
        advice: '기본에 충실하고 때를 기다리세요.',
      },
      caution: {
        title: '주의가 필요한 직장운',
        message: '직장 내 갈등이나 스트레스가 있을 수 있습니다.',
        advice: '감정 조절에 신경 쓰고 신중하게 행동하세요.',
      },
    },
    wealth: {
      excellent: {
        title: '재물이 들어오는 금전운',
        message: '예상치 못한 수입이나 좋은 기회가 찾아옵니다.',
        advice: '적극적으로 기회를 잡되, 과욕은 금물입니다.',
      },
      good: {
        title: '안정적인 금전운',
        message: '수입과 지출이 균형을 이루며 안정됩니다.',
        advice: '저축과 투자의 균형을 유지하세요.',
      },
      neutral: {
        title: '보통의 금전운',
        message: '큰 변화 없이 현상 유지됩니다.',
        advice: '충동구매를 피하고 계획적으로 소비하세요.',
      },
      caution: {
        title: '지출 조심해야 할 금전운',
        message: '예상치 못한 지출이 생길 수 있습니다.',
        advice: '큰 금액의 거래나 투자는 신중히 결정하세요.',
      },
    },
    love: {
      excellent: {
        title: '사랑이 꽃피는 애정운',
        message: '연인과의 관계가 깊어지고, 솔로는 좋은 인연을 만납니다.',
        advice: '적극적으로 마음을 표현하세요.',
      },
      good: {
        title: '따뜻한 애정운',
        message: '주변 사람들과 좋은 관계를 유지합니다.',
        advice: '작은 관심과 배려가 큰 행복이 됩니다.',
      },
      neutral: {
        title: '잔잔한 애정운',
        message: '특별한 변화 없이 안정적인 관계가 유지됩니다.',
        advice: '조급해하지 말고 자연스럽게 흘러가게 두세요.',
      },
      caution: {
        title: '오해 주의해야 할 애정운',
        message: '사소한 말다툼이나 오해가 생기기 쉽습니다.',
        advice: '말하기 전에 한 번 더 생각하세요.',
      },
    },
    health: {
      excellent: {
        title: '컨디션 최상의 건강운',
        message: '몸과 마음이 건강하고 활력이 넘칩니다.',
        advice: '새로운 운동이나 건강 습관을 시작하기 좋습니다.',
      },
      good: {
        title: '양호한 건강운',
        message: '전반적으로 건강 상태가 좋습니다.',
        advice: '규칙적인 생활과 적당한 운동을 유지하세요.',
      },
      neutral: {
        title: '보통의 건강운',
        message: '특별한 문제는 없지만 관리가 필요합니다.',
        advice: '무리하지 않는 선에서 활동하세요.',
      },
      caution: {
        title: '관리가 필요한 건강운',
        message: '피로 누적과 스트레스에 주의가 필요합니다.',
        advice: '충분한 휴식과 수면을 취하세요.',
      },
    },
  };

  // 일주 특성을 반영한 맞춤 조언 추가
  const careerLevel = getFortuneLevel(scores.work);
  const wealthLevel = getFortuneLevel(scores.money);
  const loveLevel = getFortuneLevel(scores.love);
  const healthLevel = getFortuneLevel(scores.health);

  const career = { ...templates.career[careerLevel] };
  const wealth = { ...templates.wealth[wealthLevel] };
  const love = { ...templates.love[loveLevel] };
  const health = { ...templates.health[healthLevel] };

  // 일주 특성 반영
  if (richIlju) {
    // 강점 키워드를 조언에 반영
    if (richIlju.strengthKeywords.includes('리더십')) {
      career.advice += ' 당신의 리더십이 빛을 발할 수 있습니다.';
    }
    if (richIlju.strengthKeywords.includes('창의력') || richIlju.strengthKeywords.includes('창작')) {
      career.advice += ' 창의적인 아이디어를 적극 제안해보세요.';
    }
    if (richIlju.strengthKeywords.includes('재물복') || richIlju.strengthKeywords.includes('사업')) {
      wealth.advice += ' 당신의 사업 감각을 믿어보세요.';
    }
    if (richIlju.strengthKeywords.includes('감성') || richIlju.strengthKeywords.includes('매력')) {
      love.advice += ' 당신의 자연스러운 매력이 빛납니다.';
    }
  }

  return { career, wealth, love, health };
}

// 맞춤 질문 응답용 데이터
export interface CustomQuestionAnswer {
  question: string;
  answer: string;
  advice: string;
}

// 직장운/이직운 맞춤 해석
export function getCareerAdvice(
  sajuResult: SajuResult | null,
  year: number
): CustomQuestionAnswer {
  const yearFortune = getYearFortuneInterpretation(sajuResult, year);
  const richIlju = getRichIljuInterpretation(sajuResult);

  let answer = '';
  let advice = '';

  if (yearFortune?.dayYearRelation) {
    const relation = yearFortune.dayYearRelation.relation;

    if (relation.includes('재성운')) {
      answer = `${year}년은 재물과 성취의 기운이 강해 현재 직장에서 좋은 성과를 거둘 수 있습니다. `;
      answer += '연봉 협상이나 승진의 기회가 있을 수 있습니다. ';
      answer += '이직을 한다면 반드시 더 나은 조건을 확보하고 움직이세요.';
      advice = '단순히 힘들어서 그만두는 것은 추천하지 않습니다. 몸값을 높여서 가는 것이라면 좋습니다.';
    } else if (relation.includes('관성운')) {
      answer = `${year}년은 직장과 사회적 위치에 변화가 있을 수 있는 해입니다. `;
      answer += '승진이나 새로운 책임을 맡게 될 수 있지만, 스트레스도 따릅니다. ';
      answer += '이직보다는 현재 위치에서 기반을 다지는 것이 유리합니다.';
      advice = '책임이 늘어나는 만큼 능력도 인정받는 시기입니다. 인내하세요.';
    } else if (relation.includes('인성운')) {
      answer = `${year}년은 학습과 성장의 기운이 강합니다. `;
      answer += '새로운 기술이나 자격증을 취득하기 좋은 해입니다. ';
      answer += '이직보다는 실력을 쌓아 더 큰 도약을 준비하세요.';
      advice = '배움에 투자하세요. 귀인의 도움도 기대할 수 있습니다.';
    } else if (relation.includes('식상운')) {
      answer = `${year}년은 창의력과 표현력이 발휘되는 해입니다. `;
      answer += '새로운 프로젝트나 창업에 적합합니다. ';
      answer += '현 직장에서 능력을 인정받거나, 독립을 고려해볼 수 있습니다.';
      advice = '당신의 아이디어와 재능이 빛을 발할 때입니다.';
    } else {
      answer = `${year}년은 같은 기운이 와서 경쟁이 치열해질 수 있습니다. `;
      answer += '동료나 경쟁자와의 관계에 주의가 필요합니다. ';
      answer += '협력을 통해 시너지를 내는 것이 좋습니다.';
      advice = '혼자 가려 하지 말고 팀으로 움직이세요.';
    }
  } else {
    answer = '종합적으로 판단했을 때, 급격한 변화보다는 신중한 결정이 필요한 시기입니다.';
    advice = '충분히 정보를 수집하고 여러 옵션을 비교해보세요.';
  }

  // 일주 특성 반영
  if (richIlju) {
    if (richIlju.strengthKeywords.includes('리더십')) {
      answer += ' 당신의 리더십 기질을 살릴 수 있는 환경인지 확인하세요.';
    }
    if (richIlju.cautionKeywords.includes('고집') || richIlju.cautionKeywords.includes('완고함')) {
      advice += ' 다만 고집을 부리기보다 유연하게 상황을 판단하세요.';
    }
  }

  return {
    question: `${year}년 직장운 (이직 vs 잔류)`,
    answer,
    advice,
  };
}

// 자녀운 맞춤 해석
export function getFertilityAdvice(
  sajuResult: SajuResult | null,
  year: number
): CustomQuestionAnswer {
  const yearFortune = getYearFortuneInterpretation(sajuResult, year);
  const richIlju = getRichIljuInterpretation(sajuResult);
  const dayElement = getDayMasterElement(sajuResult);

  let answer = '';
  let advice = '';

  // 일간의 식상(자녀) 오행 확인
  const childElement: Record<Element, Element> = {
    wood: 'fire',
    fire: 'earth',
    earth: 'metal',
    metal: 'water',
    water: 'wood',
  };

  if (dayElement) {
    const fertileElement = childElement[dayElement];
    const yearGanji = getYearGanji(year);
    const yearElement = STEM_TO_ELEMENT[yearGanji.stem];

    if (yearElement === fertileElement) {
      answer = `${year}년은 자녀운이 매우 좋은 해입니다! `;
      answer += `당신에게 자녀를 의미하는 ${ELEMENT_KOREAN[fertileElement]}의 기운이 강하게 들어옵니다. `;
      answer += '임신과 출산을 계획하고 있다면 좋은 시기입니다.';
      advice = '자녀 계획이 있다면 적극적으로 활용하세요.';
    } else if (yearFortune?.dayYearRelation?.relation.includes('식상운')) {
      answer = `${year}년은 식상운으로 창조와 탄생의 기운이 흐릅니다. `;
      answer += '자녀운에도 긍정적인 영향을 줄 수 있습니다.';
      advice = '새로운 시작에 좋은 기운이니 기회를 살펴보세요.';
    } else {
      answer = `${year}년의 자녀운은 보통 수준입니다. `;
      answer += '급하게 서두르기보다 건강 관리와 준비에 집중하세요.';
      advice = '몸과 마음의 준비를 철저히 하세요.';
    }
  }

  // 일주 특성 반영
  if (richIlju?.needs.includes('따뜻') || richIlju?.needs.includes('불')) {
    answer += ' 사주가 차가운 편이라 따뜻한 환경과 온기가 도움이 됩니다.';
  }

  return {
    question: `${year}년 자녀운 (임신/출산)`,
    answer,
    advice,
  };
}

// 이사운 맞춤 해석
export function getMovingAdvice(
  sajuResult: SajuResult | null,
  year: number
): CustomQuestionAnswer {
  const yearFortune = getYearFortuneInterpretation(sajuResult, year);

  let answer = '';
  let advice = '';

  if (yearFortune?.dayYearRelation) {
    const relation = yearFortune.dayYearRelation.relation;

    if (relation.includes('재성운')) {
      answer = `${year}년은 재물운이 좋아 부동산 거래나 자산 관련 이동에 유리합니다. `;
      answer += '더 넓은 집으로 이사하거나 투자 가치 있는 곳으로 옮기기에 좋습니다.';
      advice = '단순한 이사보다 자산 증식 관점에서 접근하세요.';
    } else if (yearFortune.branchFortune.keywords.includes('이동')) {
      answer = `${year}년은 이동수가 있는 해입니다. `;
      answer += '이사나 직장 이동이 자연스럽게 일어날 수 있습니다.';
      advice = '변화에 유연하게 대처하세요.';
    } else {
      answer = `${year}년은 이사운이 특별히 강하지는 않습니다. `;
      answer += '급하게 옮기기보다는 현재 위치에서 안정을 취하는 것도 좋습니다.';
      advice = '필요에 의한 이사라면 괜찮지만, 굳이 무리해서 갈 필요는 없습니다.';
    }
  } else {
    answer = '이사를 결정할 때는 실질적인 필요와 조건을 우선 고려하세요.';
    advice = '운세보다 현실적인 조건(교통, 환경, 가격)이 더 중요합니다.';
  }

  return {
    question: `${year}년 이사운`,
    answer,
    advice,
  };
}
