/**
 * 궁합 계산 서비스
 * 두 사람의 사주를 기반으로 궁합을 분석합니다.
 */

import { SajuResult, Element } from '../types';
import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../data/saju';
import {
  ELEMENT_GENERATES,
  ELEMENT_CONTROLS,
  SIX_HARMONIES,
  THREE_HARMONIES,
  SIX_CLASHES,
  SIX_HARMS,
  YUAN_JIN,
  DIRECTION_GROUPS,
} from '../data/constants';

// 세부 궁합 항목 인터페이스
export interface DetailedCompatibility {
  score: number;
  grade: string;
  title: string;
  analysis: string;
  details: string[];
}

// 궁합 결과 인터페이스
export interface CompatibilityResult {
  totalScore: number;
  elementScore: number;
  branchScore: number;
  dayPillarScore: number;
  elementAnalysis: string;
  branchAnalysis: string;
  dayPillarAnalysis: string;
  summary: string;
  advice: string[];
  // 추가: 천간합 정보 (있는 경우)
  stemCombination?: {
    name: string;
    resultElement: Element;
  };
  // 다양한 궁합 종류
  detailedCompatibilities: {
    intimacy: DetailedCompatibility;      // 속궁합 (정서적 친밀도)
    personality: DetailedCompatibility;    // 성격궁합
    wealth: DetailedCompatibility;         // 재물궁합
    communication: DetailedCompatibility;  // 소통궁합
    family: DetailedCompatibility;         // 가정궁합
    future: DetailedCompatibility;         // 미래궁합
  };
}

// 방합 관계를 CompatibilityService용으로 재정의 (그룹 형태)
const DIRECTION_COMPATIBILITY_GROUPS: Record<string, string[]> = {
  '동방': ['인', '묘', '진'],  // 동방목국
  '남방': ['사', '오', '미'],  // 남방화국
  '서방': ['신', '유', '술'],  // 서방금국
  '북방': ['해', '자', '축'],  // 북방수국
};

// 천간합 결과 오행 (합화 오행)
const STEM_COMBINATION_RESULT: Record<string, { stems: [string, string]; result: Element; name: string }> = {
  '갑기': { stems: ['갑', '기'], result: 'earth', name: '갑기합토(甲己合土)' },
  '을경': { stems: ['을', '경'], result: 'metal', name: '을경합금(乙庚合金)' },
  '병신': { stems: ['병', '신'], result: 'water', name: '병신합수(丙辛合水)' },
  '정임': { stems: ['정', '임'], result: 'wood', name: '정임합목(丁壬合木)' },
  '무계': { stems: ['무', '계'], result: 'fire', name: '무계합화(戊癸合火)' },
};

/**
 * 두 사람의 궁합을 계산합니다.
 */
export function calculateCompatibility(saju1: SajuResult, saju2: SajuResult): CompatibilityResult {
  // 일간의 오행 가져오기
  const dayStem1 = saju1.pillars.day.stem;
  const dayStem2 = saju2.pillars.day.stem;
  const dayBranch1 = saju1.pillars.day.branch;
  const dayBranch2 = saju2.pillars.day.branch;

  const element1 = getElementFromStem(dayStem1);
  const element2 = getElementFromStem(dayStem2);

  // 1. 오행 궁합 계산
  const elementResult = analyzeElementCompatibility(element1, element2);

  // 2. 지지 궁합 계산 (년지, 월지, 일지 모두 고려)
  const branchResult = analyzeBranchCompatibility(saju1, saju2);

  // 3. 일주 궁합 계산
  const dayPillarResult = analyzeDayPillarCompatibility(
    dayStem1, dayBranch1, dayStem2, dayBranch2
  );

  // 총점 계산 (가중 평균)
  const totalScore = Math.round(
    elementResult.score * 0.3 +
    branchResult.score * 0.4 +
    dayPillarResult.score * 0.3
  );

  // 조언 생성
  const advice = generateAdvice(elementResult, branchResult, dayPillarResult, totalScore);

  // 요약 생성
  const summary = generateSummary(totalScore, elementResult, branchResult);

  // 천간합 정보 확인
  const stemComboInfo = getStemCombinationInfo(dayStem1, dayStem2);

  // 세부 궁합 분석
  const detailedCompatibilities = {
    intimacy: analyzeIntimacyCompatibility(saju1, saju2),
    personality: analyzePersonalityCompatibility(saju1, saju2),
    wealth: analyzeWealthCompatibility(saju1, saju2),
    communication: analyzeCommunicationCompatibility(saju1, saju2),
    family: analyzeFamilyCompatibility(saju1, saju2),
    future: analyzeFutureCompatibility(saju1, saju2),
  };

  const result: CompatibilityResult = {
    totalScore,
    elementScore: elementResult.score,
    branchScore: branchResult.score,
    dayPillarScore: dayPillarResult.score,
    elementAnalysis: elementResult.analysis,
    branchAnalysis: branchResult.analysis,
    dayPillarAnalysis: dayPillarResult.analysis,
    summary,
    advice,
    detailedCompatibilities,
  };

  // 천간합이 있으면 추가
  if (stemComboInfo) {
    result.stemCombination = {
      name: stemComboInfo.name,
      resultElement: stemComboInfo.result,
    };
  }

  return result;
}

/**
 * 천간에서 오행 추출
 */
function getElementFromStem(stem: string): Element {
  const stemInfo = HEAVENLY_STEMS.find(s => s.korean === stem);
  return stemInfo?.element || 'earth';
}

/**
 * 오행 궁합 분석
 */
function analyzeElementCompatibility(element1: Element, element2: Element): { score: number; analysis: string } {
  const elementNames: Record<Element, string> = {
    wood: '목(木)',
    fire: '화(火)',
    earth: '토(土)',
    metal: '금(金)',
    water: '수(水)',
  };

  // 같은 오행
  if (element1 === element2) {
    return {
      score: 75,
      analysis: `두 분 모두 ${elementNames[element1]} 오행으로 비견의 관계입니다. 서로 이해하기 쉽지만 경쟁심이 생길 수 있습니다.`,
    };
  }

  // 상생 관계 (내가 상대를 생함)
  if (ELEMENT_GENERATES[element1] === element2) {
    return {
      score: 85,
      analysis: `${elementNames[element1]}이 ${elementNames[element2]}을 생하는 상생 관계입니다. 한 분이 다른 분을 자연스럽게 돕게 됩니다.`,
    };
  }

  // 상생 관계 (상대가 나를 생함)
  if (ELEMENT_GENERATES[element2] === element1) {
    return {
      score: 90,
      analysis: `${elementNames[element2]}이 ${elementNames[element1]}을 생하는 상생 관계입니다. 서로에게 힘이 되어주는 좋은 궁합입니다.`,
    };
  }

  // 상극 관계 (내가 상대를 극함)
  if (ELEMENT_CONTROLS[element1] === element2) {
    return {
      score: 55,
      analysis: `${elementNames[element1]}이 ${elementNames[element2]}을 극하는 관계입니다. 한 분이 주도권을 가지기 쉬워 균형이 필요합니다.`,
    };
  }

  // 상극 관계 (상대가 나를 극함)
  if (ELEMENT_CONTROLS[element2] === element1) {
    return {
      score: 50,
      analysis: `${elementNames[element2]}이 ${elementNames[element1]}을 극하는 관계입니다. 서로 양보하고 이해하려는 노력이 필요합니다.`,
    };
  }

  // 기타 관계
  return {
    score: 70,
    analysis: `${elementNames[element1]}와 ${elementNames[element2]}의 조합입니다. 서로 다른 성향을 보완할 수 있습니다.`,
  };
}

/**
 * 지지 궁합 분석
 */
function analyzeBranchCompatibility(saju1: SajuResult, saju2: SajuResult): { score: number; analysis: string } {
  const branches1 = [
    saju1.pillars.year.branch,
    saju1.pillars.month.branch,
    saju1.pillars.day.branch,
  ];
  const branches2 = [
    saju2.pillars.year.branch,
    saju2.pillars.month.branch,
    saju2.pillars.day.branch,
  ];

  let harmonyCount = 0;
  let threeHarmonyCount = 0;
  let clashCount = 0;
  let harmCount = 0;
  let yuanJinCount = 0;  // 원진 카운트 추가
  let sameDirectionCount = 0;  // 방합 카운트 추가

  // 모든 지지 조합 검사
  for (const b1 of branches1) {
    for (const b2 of branches2) {
      // 육합 검사
      if (SIX_HARMONIES[b1] === b2) {
        harmonyCount++;
      }
      // 삼합 검사
      if (THREE_HARMONIES[b1]?.includes(b2)) {
        threeHarmonyCount++;
      }
      // 육충 검사
      if (SIX_CLASHES[b1] === b2) {
        clashCount++;
      }
      // 육해 검사
      if (SIX_HARMS[b1] === b2) {
        harmCount++;
      }
      // 원진 검사 (육해와 별개로)
      if (YUAN_JIN[b1] === b2) {
        yuanJinCount++;
      }
      // 방합 검사 (같은 방향 지지)
      for (const direction of Object.values(DIRECTION_GROUPS)) {
        if (direction.includes(b1) && direction.includes(b2) && b1 !== b2) {
          sameDirectionCount++;
        }
      }
    }
  }

  // 점수 계산
  let score = 70; // 기본 점수
  score += harmonyCount * 15; // 육합당 +15
  score += threeHarmonyCount * 8; // 삼합당 +8
  score += sameDirectionCount * 5; // 방합당 +5
  score -= clashCount * 12; // 육충당 -12
  score -= harmCount * 8; // 육해당 -8
  score -= yuanJinCount * 6; // 원진당 -6

  // 범위 제한
  score = Math.max(40, Math.min(100, score));

  // 분석 텍스트 생성
  const analysisItems: string[] = [];
  if (harmonyCount > 0) {
    analysisItems.push(`육합이 ${harmonyCount}개 있어 서로 자연스럽게 끌리는 인연입니다.`);
  }
  if (threeHarmonyCount > 0) {
    analysisItems.push(`삼합이 ${threeHarmonyCount}개 있어 함께할 때 시너지가 납니다.`);
  }
  if (sameDirectionCount > 0) {
    analysisItems.push(`방합이 ${sameDirectionCount}개 있어 같은 방향성을 가진 관계입니다.`);
  }
  if (clashCount > 0) {
    analysisItems.push(`육충이 ${clashCount}개 있어 가끔 충돌이 있을 수 있습니다.`);
  }
  if (harmCount > 0) {
    analysisItems.push(`육해가 ${harmCount}개 있어 서로 상처받기 쉬우니 배려가 필요합니다.`);
  }
  if (yuanJinCount > 0 && yuanJinCount !== harmCount) {
    analysisItems.push(`원진이 ${yuanJinCount}개 있어 감정적 갈등에 주의하세요.`);
  }

  const analysis = analysisItems.length > 0
    ? analysisItems.join(' ')
    : '지지 간에 특별한 충돌이나 조화가 없어 무난한 관계입니다.';

  return { score, analysis };
}

/**
 * 일주 궁합 분석
 */
function analyzeDayPillarCompatibility(
  stem1: string,
  branch1: string,
  stem2: string,
  branch2: string
): { score: number; analysis: string } {
  let score = 70;
  const analysisItems: string[] = [];

  // 일간 합 검사 (갑기합, 을경합, 병신합, 정임합, 무계합) - 가장 중요
  const stemComboInfo = getStemCombinationInfo(stem1, stem2);
  if (stemComboInfo) {
    score += 18;
    analysisItems.push(`일간이 ${stemComboInfo.name}으로 서로 보완하며 조화를 이루는 천생연분의 관계입니다.`);
  }

  // 일지 육합 검사
  if (SIX_HARMONIES[branch1] === branch2) {
    score += 20;
    analysisItems.push('일지가 육합 관계로 서로에게 강하게 끌리며 정서적 유대감이 깊습니다.');
  }
  // 일지 육충 검사
  else if (SIX_CLASHES[branch1] === branch2) {
    score -= 15;
    analysisItems.push('일지가 육충 관계로 생활 습관이나 가치관에서 마찰이 있을 수 있습니다.');
  }
  // 일지 삼합 검사
  else if (THREE_HARMONIES[branch1]?.includes(branch2)) {
    score += 10;
    analysisItems.push('일지가 삼합 관계로 함께 성장하고 발전하는 관계입니다.');
  }
  // 일지 원진 검사
  else if (YUAN_JIN[branch1] === branch2) {
    score -= 8;
    analysisItems.push('일지가 원진 관계로 감정적인 오해가 생기기 쉬우니 소통이 중요합니다.');
  }

  // 분석 텍스트가 없으면 기본 문구
  if (analysisItems.length === 0) {
    analysisItems.push('일주 간에 특별한 충돌 없이 서로 맞춰가며 지낼 수 있는 관계입니다.');
  }

  score = Math.max(40, Math.min(100, score));
  return { score, analysis: analysisItems.join(' ') };
}

/**
 * 천간합 검사
 */
function checkStemCombination(stem1: string, stem2: string): boolean {
  return getStemCombinationInfo(stem1, stem2) !== null;
}

/**
 * 천간합 상세 정보 반환
 */
function getStemCombinationInfo(stem1: string, stem2: string): { result: Element; name: string } | null {
  for (const combo of Object.values(STEM_COMBINATION_RESULT)) {
    const [a, b] = combo.stems;
    if ((stem1 === a && stem2 === b) || (stem1 === b && stem2 === a)) {
      return { result: combo.result, name: combo.name };
    }
  }
  return null;
}

/**
 * 조언 생성
 */
function generateAdvice(
  elementResult: { score: number },
  branchResult: { score: number },
  dayPillarResult: { score: number },
  totalScore: number
): string[] {
  const advice: string[] = [];

  if (totalScore >= 80) {
    advice.push('서로에 대한 감사의 마음이 더 큰 행복을 가져옵니다.');
    advice.push('함께하는 시간이 두 분의 인연을 더욱 깊게 합니다.');
    advice.push('좋은 기운을 나누며 함께 성장하세요.');
  } else if (totalScore >= 60) {
    advice.push('서로의 다름이 관계를 더 풍요롭게 만듭니다.');
    advice.push('대화를 통해 서로를 더 깊이 알아가세요.');
    advice.push('작은 감사 표현이 큰 행복으로 돌아옵니다.');
  } else {
    advice.push('다른 기운의 조합이 새로운 가능성을 열어줍니다.');
    advice.push('서로의 강점을 발견하고 칭찬해 주세요.');
    advice.push('함께하는 시간이 두 분을 더 가깝게 만들어요.');
    advice.push('천천히 서로를 알아가는 과정 자체가 소중합니다.');
  }

  // 특정 영역별 추가 조언
  if (elementResult.score < 60) {
    advice.push('다른 성향이 오히려 서로를 보완해줄 수 있어요.');
  }
  if (branchResult.score < 60) {
    advice.push('생활 리듬을 맞춰가며 새로운 조화를 만들어보세요.');
  }
  if (dayPillarResult.score < 60) {
    advice.push('일상의 작은 배려가 특별한 관계를 만듭니다.');
  }

  return advice.slice(0, 4); // 최대 4개
}

/**
 * 요약 생성
 */
function generateSummary(
  totalScore: number,
  elementResult: { score: number },
  branchResult: { score: number }
): string {
  if (totalScore >= 90) {
    return '천생연분의 궁합입니다! 서로를 위해 태어난 듯한 특별한 인연이에요.';
  }
  if (totalScore >= 80) {
    return '아주 좋은 궁합입니다. 서로의 기운이 조화롭게 어울리는 관계에요.';
  }
  if (totalScore >= 70) {
    return '좋은 궁합입니다. 함께할수록 서로에게 긍정적인 영향을 주는 관계에요.';
  }
  if (totalScore >= 60) {
    return '균형 잡힌 궁합입니다. 서로 다른 기운이 조화를 이루며 보완해요.';
  }
  if (totalScore >= 50) {
    return '성장하는 궁합입니다. 서로의 다름이 오히려 새로운 시각을 열어줘요.';
  }
  return '도전적인 궁합입니다. 강한 끌림과 함께 깊은 배움이 있는 관계에요.';
}

// ============================================
// 세부 궁합 분석 함수들
// ============================================

/**
 * 등급 반환
 */
function getGrade(score: number): string {
  if (score >= 90) return '천생연분';
  if (score >= 80) return '매우 좋음';
  if (score >= 70) return '좋음';
  if (score >= 60) return '보통';
  if (score >= 50) return '노력 필요';
  return '주의 필요';
}

/**
 * 속궁합 (정서적 친밀도) 분석
 * 일주와 시주의 조화를 중심으로 분석
 */
function analyzeIntimacyCompatibility(saju1: SajuResult, saju2: SajuResult): DetailedCompatibility {
  const dayStem1 = saju1.pillars.day.stem;
  const dayStem2 = saju2.pillars.day.stem;
  const dayBranch1 = saju1.pillars.day.branch;
  const dayBranch2 = saju2.pillars.day.branch;

  let score = 65;
  const details: string[] = [];

  // 일간합 (천간합) - 가장 중요
  const stemCombo = getStemCombinationInfo(dayStem1, dayStem2);
  if (stemCombo) {
    score += 25;
    details.push(`일간이 ${stemCombo.name}으로 정서적 교감이 매우 깊습니다.`);
    details.push('서로에게 끌리는 자연스러운 인력이 있어 함께할 때 편안함을 느낍니다.');
  }

  // 일지 육합
  if (SIX_HARMONIES[dayBranch1] === dayBranch2) {
    score += 20;
    details.push('일지가 육합 관계로 정서적 유대감이 매우 깊습니다.');
    details.push('말하지 않아도 서로의 마음을 알 수 있는 깊은 교감이 있습니다.');
  }
  // 일지 육충
  else if (SIX_CLASHES[dayBranch1] === dayBranch2) {
    score -= 10;
    details.push('일지가 육충 관계로 감정적 충돌이 있을 수 있습니다.');
    details.push('오해가 생기기 쉬우니 솔직한 대화가 중요합니다.');
  }
  // 삼합
  else if (THREE_HARMONIES[dayBranch1]?.includes(dayBranch2)) {
    score += 12;
    details.push('일지가 삼합 관계로 정서적으로 조화롭습니다.');
  }

  // 음양 조화 (갑을병정무기경신임계 중 양/음)
  const isYang1 = ['갑', '병', '무', '경', '임'].includes(dayStem1);
  const isYang2 = ['갑', '병', '무', '경', '임'].includes(dayStem2);

  if (isYang1 !== isYang2) {
    score += 8;
    details.push('음양이 조화를 이루어 서로를 보완하는 관계입니다.');
  }

  score = Math.max(40, Math.min(100, score));

  if (details.length === 0) {
    details.push('정서적으로 무난한 궁합입니다.');
    details.push('서로를 이해하려는 노력으로 친밀도를 높일 수 있습니다.');
  }

  return {
    score,
    grade: getGrade(score),
    title: '속궁합 (정서적 친밀도)',
    analysis: score >= 70
      ? '서로에게 자연스럽게 끌리며 깊은 정서적 교감이 가능한 관계입니다.'
      : score >= 50
      ? '서로를 이해하려는 노력이 필요하지만 깊은 유대가 가능합니다.'
      : '정서적 교류에 노력이 필요하지만 다른 영역에서 보완할 수 있습니다.',
    details,
  };
}

/**
 * 성격궁합 분석
 * 일간의 오행 관계를 중심으로 분석
 */
function analyzePersonalityCompatibility(saju1: SajuResult, saju2: SajuResult): DetailedCompatibility {
  const dayStem1 = saju1.pillars.day.stem;
  const dayStem2 = saju2.pillars.day.stem;
  const element1 = getElementFromStem(dayStem1);
  const element2 = getElementFromStem(dayStem2);

  let score = 65;
  const details: string[] = [];

  const elementNames: Record<Element, { name: string; traits: string }> = {
    wood: { name: '목(木)', traits: '진취적이고 성장 지향적인 성향' },
    fire: { name: '화(火)', traits: '열정적이고 적극적인 성향' },
    earth: { name: '토(土)', traits: '안정적이고 신중한 성향' },
    metal: { name: '금(金)', traits: '결단력 있고 정의로운 성향' },
    water: { name: '수(水)', traits: '지혜롭고 유연한 성향' },
  };

  details.push(`첫 번째 분: ${elementNames[element1].name} - ${elementNames[element1].traits}`);
  details.push(`두 번째 분: ${elementNames[element2].name} - ${elementNames[element2].traits}`);

  // 같은 오행
  if (element1 === element2) {
    score = 72;
    details.push('같은 오행으로 비견 관계입니다. 성향이 비슷해 이해하기 쉽지만 경쟁심이 생길 수 있습니다.');
  }
  // 상생 관계
  else if (ELEMENT_GENERATES[element1] === element2 || ELEMENT_GENERATES[element2] === element1) {
    score = 85;
    details.push('상생 관계로 서로의 성향이 자연스럽게 조화됩니다.');
    details.push('한 분이 다른 분의 에너지를 북돋아 주는 좋은 관계입니다.');
  }
  // 상극 관계
  else if (ELEMENT_CONTROLS[element1] === element2 || ELEMENT_CONTROLS[element2] === element1) {
    score = 55;
    details.push('상극 관계로 성향 차이가 있습니다.');
    details.push('다른 시각이 오히려 서로를 보완해줄 수 있습니다.');
  }
  // 기타
  else {
    score = 70;
    details.push('서로 다른 성향이 조화를 이룰 수 있습니다.');
  }

  return {
    score,
    grade: getGrade(score),
    title: '성격궁합',
    analysis: score >= 70
      ? '서로의 성격이 잘 어울려 함께 있을 때 편안함을 느낍니다.'
      : '성격 차이가 있지만 이것이 서로를 보완하는 장점이 됩니다.',
    details,
  };
}

/**
 * 재물궁합 분석
 * 재성(財星)과 관련된 요소 분석
 */
function analyzeWealthCompatibility(saju1: SajuResult, saju2: SajuResult): DetailedCompatibility {
  const dayStem1 = saju1.pillars.day.stem;
  const dayStem2 = saju2.pillars.day.stem;
  const element1 = getElementFromStem(dayStem1);
  const element2 = getElementFromStem(dayStem2);

  // 재성은 일간이 극하는 오행
  const wealthElement1 = ELEMENT_CONTROLS[element1];
  const wealthElement2 = ELEMENT_CONTROLS[element2];

  let score = 65;
  const details: string[] = [];

  // 상대가 나의 재성 오행인 경우 (재물 관계)
  if (element2 === wealthElement1) {
    score += 15;
    details.push('첫 번째 분에게 두 번째 분이 재물의 기운을 가져다주는 관계입니다.');
  }
  if (element1 === wealthElement2) {
    score += 15;
    details.push('두 번째 분에게 첫 번째 분이 재물의 기운을 가져다주는 관계입니다.');
  }

  // 토(土) 기운이 많으면 재물 안정
  const branches1 = [saju1.pillars.year.branch, saju1.pillars.month.branch, saju1.pillars.day.branch];
  const branches2 = [saju2.pillars.year.branch, saju2.pillars.month.branch, saju2.pillars.day.branch];
  const earthBranches = ['축', '진', '미', '술'];

  const earthCount = [...branches1, ...branches2].filter(b => earthBranches.includes(b)).length;
  if (earthCount >= 2) {
    score += 8;
    details.push('토(土) 기운이 함께하여 재물을 안정적으로 유지할 수 있습니다.');
  }

  // 금(金) 기운 - 금전적 결단력
  const metalBranches = ['신', '유'];
  const metalCount = [...branches1, ...branches2].filter(b => metalBranches.includes(b)).length;
  if (metalCount >= 2) {
    score += 5;
    details.push('금(金) 기운이 함께하여 재물 관리에 결단력이 있습니다.');
  }

  score = Math.max(40, Math.min(100, score));

  if (details.length === 0) {
    details.push('재물적으로 무난한 궁합입니다.');
    details.push('함께 노력하면 안정적인 경제 생활이 가능합니다.');
  }

  details.push(score >= 70
    ? '함께할 때 재물운이 상승하는 좋은 조합입니다.'
    : '서로 협력하여 재물을 모으면 좋은 결과를 얻을 수 있습니다.');

  return {
    score,
    grade: getGrade(score),
    title: '재물궁합',
    analysis: score >= 70
      ? '함께할 때 재물운이 좋아지는 관계입니다.'
      : '협력하여 재물을 관리하면 안정적인 경제생활이 가능합니다.',
    details,
  };
}

/**
 * 소통궁합 분석
 * 식상(食傷)과 인성(印星) 관계 분석
 */
function analyzeCommunicationCompatibility(saju1: SajuResult, saju2: SajuResult): DetailedCompatibility {
  const dayStem1 = saju1.pillars.day.stem;
  const dayStem2 = saju2.pillars.day.stem;
  const monthBranch1 = saju1.pillars.month.branch;
  const monthBranch2 = saju2.pillars.month.branch;

  let score = 65;
  const details: string[] = [];

  // 천간합 - 소통 원활
  const stemCombo = getStemCombinationInfo(dayStem1, dayStem2);
  if (stemCombo) {
    score += 20;
    details.push('천간합으로 말하지 않아도 통하는 깊은 교감이 있습니다.');
  }

  // 월지 육합 - 가치관 소통
  if (SIX_HARMONIES[monthBranch1] === monthBranch2) {
    score += 15;
    details.push('월지가 육합 관계로 가치관과 생각이 통합니다.');
  }
  // 월지 육충 - 가치관 충돌
  else if (SIX_CLASHES[monthBranch1] === monthBranch2) {
    score -= 10;
    details.push('월지가 육충 관계로 가치관 차이가 있을 수 있습니다.');
    details.push('서로 다른 생각을 존중하면 오히려 성장의 기회가 됩니다.');
  }

  // 삼합 - 같은 방향성
  if (THREE_HARMONIES[monthBranch1]?.includes(monthBranch2)) {
    score += 10;
    details.push('월지가 삼합 관계로 같은 방향을 바라보며 소통합니다.');
  }

  score = Math.max(40, Math.min(100, score));

  if (details.length === 0) {
    details.push('소통에 무난한 궁합입니다.');
    details.push('대화를 통해 서로를 이해하려는 노력이 관계를 깊게 합니다.');
  }

  return {
    score,
    grade: getGrade(score),
    title: '소통궁합',
    analysis: score >= 70
      ? '서로의 생각과 감정이 잘 통하는 관계입니다.'
      : '대화를 통해 서로를 이해하면 깊은 소통이 가능합니다.',
    details,
  };
}

/**
 * 가정궁합 분석
 * 년주와 월주의 조화 분석 (가정, 가족 관련)
 */
function analyzeFamilyCompatibility(saju1: SajuResult, saju2: SajuResult): DetailedCompatibility {
  const yearBranch1 = saju1.pillars.year.branch;
  const yearBranch2 = saju2.pillars.year.branch;
  const monthBranch1 = saju1.pillars.month.branch;
  const monthBranch2 = saju2.pillars.month.branch;

  let score = 65;
  const details: string[] = [];

  // 년지 육합 - 가문/가족 화합
  if (SIX_HARMONIES[yearBranch1] === yearBranch2) {
    score += 18;
    details.push('년지가 육합 관계로 양가 가족 간의 화합이 좋습니다.');
    details.push('가정을 이루면 조화롭고 화목한 가정이 될 수 있습니다.');
  }
  // 년지 육충
  else if (SIX_CLASHES[yearBranch1] === yearBranch2) {
    score -= 8;
    details.push('년지가 육충 관계로 양가 조율이 필요할 수 있습니다.');
    details.push('서로의 가족을 이해하고 존중하면 좋은 관계를 만들 수 있습니다.');
  }

  // 삼합 - 가족 시너지
  if (THREE_HARMONIES[yearBranch1]?.includes(yearBranch2)) {
    score += 12;
    details.push('년지가 삼합 관계로 가정을 이루면 시너지가 납니다.');
  }

  // 월지 조화 - 생활 환경
  if (SIX_HARMONIES[monthBranch1] === monthBranch2) {
    score += 12;
    details.push('월지가 육합 관계로 생활 환경과 리듬이 잘 맞습니다.');
  } else if (THREE_HARMONIES[monthBranch1]?.includes(monthBranch2)) {
    score += 8;
    details.push('월지가 삼합 관계로 함께 생활할 때 조화롭습니다.');
  }

  score = Math.max(40, Math.min(100, score));

  if (details.length === 0) {
    details.push('가정적으로 무난한 궁합입니다.');
    details.push('서로 배려하며 함께하면 행복한 가정을 꾸릴 수 있습니다.');
  }

  return {
    score,
    grade: getGrade(score),
    title: '가정궁합',
    analysis: score >= 70
      ? '함께 화목한 가정을 이룰 수 있는 좋은 궁합입니다.'
      : '서로 배려하며 노력하면 행복한 가정을 만들 수 있습니다.',
    details,
  };
}

/**
 * 미래궁합 분석
 * 대운/세운의 방향성 분석
 */
function analyzeFutureCompatibility(saju1: SajuResult, saju2: SajuResult): DetailedCompatibility {
  const element1 = getElementFromStem(saju1.pillars.day.stem);
  const element2 = getElementFromStem(saju2.pillars.day.stem);
  const monthBranch1 = saju1.pillars.month.branch;
  const monthBranch2 = saju2.pillars.month.branch;
  const yearBranch1 = saju1.pillars.year.branch;
  const yearBranch2 = saju2.pillars.year.branch;

  let score = 65;
  const details: string[] = [];

  // 상생 관계 - 함께 성장
  if (ELEMENT_GENERATES[element1] === element2 || ELEMENT_GENERATES[element2] === element1) {
    score += 15;
    details.push('상생 관계로 함께할수록 서로 발전하는 미래가 기대됩니다.');
  }

  // 삼합이 많으면 미래 시너지
  let harmonyCount = 0;
  if (THREE_HARMONIES[yearBranch1]?.includes(yearBranch2)) harmonyCount++;
  if (THREE_HARMONIES[monthBranch1]?.includes(monthBranch2)) harmonyCount++;

  if (harmonyCount >= 2) {
    score += 12;
    details.push('여러 삼합이 있어 함께하는 미래에 큰 시너지가 기대됩니다.');
  } else if (harmonyCount === 1) {
    score += 8;
    details.push('삼합의 기운이 있어 함께 성장하는 미래가 기대됩니다.');
  }

  // 천간합 - 운명적 인연
  const stemCombo = getStemCombinationInfo(saju1.pillars.day.stem, saju2.pillars.day.stem);
  if (stemCombo) {
    score += 15;
    details.push('천간합으로 운명적인 인연이며 함께하는 미래가 밝습니다.');
  }

  score = Math.max(40, Math.min(100, score));

  if (details.length === 0) {
    details.push('미래적으로 무난한 궁합입니다.');
    details.push('함께 노력하며 같은 목표를 향해 나아가면 좋은 미래가 펼쳐집니다.');
  }

  // 종합 미래 조언
  if (score >= 80) {
    details.push('오래도록 함께하며 서로 발전하는 관계가 될 것입니다.');
  } else if (score >= 60) {
    details.push('함께 노력하면 더 나은 미래를 만들어갈 수 있습니다.');
  } else {
    details.push('서로의 장점을 살리며 함께하면 좋은 결과를 얻을 수 있습니다.');
  }

  return {
    score,
    grade: getGrade(score),
    title: '미래궁합',
    analysis: score >= 70
      ? '함께하는 미래가 밝은 좋은 인연입니다.'
      : '함께 노력하며 성장하면 좋은 미래를 만들 수 있습니다.',
    details,
  };
}

export default { calculateCompatibility };
