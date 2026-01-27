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

// 오늘의 풍부한 운세 해석
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
  // 오늘과 일간의 관계
  dayRelation: string;
  // 상세 해석
  interpretation: string;
  // 핵심 조언
  advice: string;
  // 행운의 시간
  luckyTime: string;
}

// 오늘의 풍부한 운세 생성
export function generateRichDailyFortune(
  sajuResult: SajuResult | null,
  todayStem: string,
  todayBranch: string
): RichDailyFortune | null {
  if (!sajuResult) return null;

  const richIlju = getRichIljuInterpretation(sajuResult);
  const dayElement = getDayMasterElement(sajuResult);
  const todayElement = STEM_TO_ELEMENT[todayStem];

  if (!richIlju || !dayElement || !todayElement) return null;

  // 일간과 오늘 천간의 관계로 해석 생성
  const dayTodayRelation = DAY_YEAR_RELATIONS[dayElement]?.[todayElement];

  let dayRelation = '';
  let interpretation = '';
  let advice = '';
  let keywords: string[] = [];

  if (dayTodayRelation) {
    dayRelation = dayTodayRelation.relation;
    interpretation = `오늘은 ${dayTodayRelation.relation}의 기운이 흐릅니다. ${dayTodayRelation.meaning} ${dayTodayRelation.fortune}`;
    advice = dayTodayRelation.advice;
    keywords = dayTodayRelation.keywords;
  } else {
    dayRelation = '조화로운 하루';
    interpretation = `오늘의 기운과 조화를 이루며 나아가세요. 자연스러운 흐름에 몸을 맡기되, 자신의 페이스를 유지하며 진행하세요.`;
    advice = '자신의 페이스를 유지하며 진행하세요.';
    keywords = richIlju.strengthKeywords.slice(0, 3);
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

  return {
    metaphor: richIlju.metaphor,
    image: richIlju.image,
    essence: richIlju.essence,
    needs: richIlju.needs,
    lifeTheme: richIlju.lifeTheme,
    todayInterpretation: interpretation,
    todayAdvice: advice,
    keywords,
    dayRelation,
    interpretation,
    advice,
    luckyTime,
  };
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
