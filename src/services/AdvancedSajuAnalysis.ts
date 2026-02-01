/**
 * 고급 사주 분석 서비스
 * - 지장간(地藏干) 분석
 * - 삼합(三合) 분석
 * - 육해(六害) 및 형벌(刑罰) 분석
 * - 일간 강약(强弱) 판단
 * - 용신(用神)/기신(忌神) 추출
 */

import { FourPillars, Pillar, Element } from '../types';
import {
  HIDDEN_STEMS,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  FIVE_ELEMENTS,
  getStemByKorean,
  getBranchByKorean,
} from '../data/saju';

// ========================================
// 타입 정의
// ========================================

export interface HiddenStemInfo {
  main: string;
  middle: string | null;
  residue: string | null;
  mainElement: Element;
  middleElement: Element | null;
  residueElement: Element | null;
}

export interface HiddenStemAnalysis {
  year: HiddenStemInfo | null;
  month: HiddenStemInfo | null;
  day: HiddenStemInfo | null;
  hour: HiddenStemInfo | null;
  summary: string;
  hiddenTraits: string[];
}

export interface ThreeCombine {
  branches: string[];
  element: Element;
  name: string;
  description: string;
}

export interface ThreeCombineAnalysis {
  found: ThreeCombine[];
  halfCombines: { branches: string[]; missing: string; element: Element; name: string }[];
  summary: string;
}

export interface SixHarm {
  pair: [string, string];
  name: string;
  description: string;
}

export interface Punishment {
  type: 'self' | 'mutual' | 'ungrateful' | 'rude';
  branches: string[];
  name: string;
  description: string;
}

export interface HarmPunishmentAnalysis {
  harms: SixHarm[];
  punishments: Punishment[];
  summary: string;
}

export interface DayMasterStrength {
  strength: 'extreme-strong' | 'strong' | 'neutral' | 'weak' | 'extreme-weak';
  score: number; // 0-100 (50 = 중화)
  reasons: string[];
  analysis: string;
}

export interface YongsinAnalysis {
  yongsin: Element[];        // 용신 (도움이 되는 오행)
  heeshin: Element[];        // 희신 (용신을 돕는 오행)
  gishin: Element[];         // 기신 (해로운 오행)
  gushin: Element[];         // 구신 (기신을 돕는 오행)
  summary: string;
  recommendations: {
    colors: string[];
    directions: string[];
    numbers: number[];
    advice: string[];
  };
}

export interface AdvancedAnalysisResult {
  hiddenStems: HiddenStemAnalysis;
  threeCombines: ThreeCombineAnalysis;
  harmsPunishments: HarmPunishmentAnalysis;
  dayMasterStrength: DayMasterStrength;
  yongsin: YongsinAnalysis;
  overallSummary: string;
}

// ========================================
// 상수 정의
// ========================================

// 삼합 (三合)
const THREE_COMBINES: ThreeCombine[] = [
  { branches: ['신', '자', '진'], element: 'water', name: '신자진 수국', description: '물의 기운이 모여 지혜와 유연함이 강해집니다' },
  { branches: ['해', '묘', '미'], element: 'wood', name: '해묘미 목국', description: '나무의 기운이 모여 성장과 발전의 힘이 강해집니다' },
  { branches: ['인', '오', '술'], element: 'fire', name: '인오술 화국', description: '불의 기운이 모여 열정과 추진력이 강해집니다' },
  { branches: ['사', '유', '축'], element: 'metal', name: '사유축 금국', description: '금의 기운이 모여 결단력과 실행력이 강해집니다' },
];

// 육해 (六害) - 서로 해치는 관계
const SIX_HARMS: SixHarm[] = [
  { pair: ['자', '미'], name: '자미해', description: '마음이 맞지 않아 갈등이 생기기 쉽습니다' },
  { pair: ['축', '오'], name: '축오해', description: '서로 다른 방향을 향해 충돌이 있을 수 있습니다' },
  { pair: ['인', '사'], name: '인사해', description: '경쟁과 시기로 인한 갈등이 있을 수 있습니다' },
  { pair: ['묘', '진'], name: '묘진해', description: '기대와 현실의 차이로 실망할 수 있습니다' },
  { pair: ['신', '해'], name: '신해해', description: '신뢰 문제로 관계가 어려워질 수 있습니다' },
  { pair: ['유', '술'], name: '유술해', description: '말과 행동의 불일치로 오해가 생길 수 있습니다' },
];

// 형벌 (刑罰)
const PUNISHMENTS = {
  // 삼형 (三刑)
  mutual: [
    { branches: ['인', '사', '신'], name: '인사신 삼형', description: '무은지형(無恩之刑) - 은혜를 모르는 형벌. 배신이나 은혜를 저버리는 일이 있을 수 있습니다' },
    { branches: ['축', '술', '미'], name: '축술미 삼형', description: '지세지형(持勢之刑) - 권세를 믿는 형벌. 권력이나 지위로 인한 문제가 있을 수 있습니다' },
  ],
  // 자형 (自刑)
  self: [
    { branches: ['진', '진'], name: '진진 자형', description: '스스로를 해치는 기운이 있어 자기 관리가 필요합니다' },
    { branches: ['오', '오'], name: '오오 자형', description: '과한 열정이 화가 되어 돌아올 수 있습니다' },
    { branches: ['유', '유'], name: '유유 자형', description: '완벽주의가 스트레스의 원인이 될 수 있습니다' },
    { branches: ['해', '해'], name: '해해 자형', description: '지나친 생각이 우울함을 가져올 수 있습니다' },
  ],
  // 상형 (相刑) - 2글자 형
  ungrateful: [
    { branches: ['자', '묘'], name: '자묘형', description: '무례지형(無禮之刑) - 예의 없는 형벌. 예절이나 질서 문제가 있을 수 있습니다' },
  ],
};

// 오행별 색상, 방향, 숫자
const ELEMENT_ATTRIBUTES: Record<Element, { color: string; direction: string; numbers: number[] }> = {
  wood: { color: '초록색, 청색', direction: '동쪽', numbers: [3, 8] },
  fire: { color: '빨간색, 자주색', direction: '남쪽', numbers: [2, 7] },
  earth: { color: '노란색, 갈색', direction: '중앙', numbers: [5, 10] },
  metal: { color: '흰색, 금색', direction: '서쪽', numbers: [4, 9] },
  water: { color: '검은색, 파란색', direction: '북쪽', numbers: [1, 6] },
};

// ========================================
// 지장간 분석
// ========================================

function getHiddenStemInfo(branch: string): HiddenStemInfo | null {
  const hidden = HIDDEN_STEMS[branch];
  if (!hidden) return null;

  const mainStem = getStemByKorean(hidden.main);
  const middleStem = hidden.middle ? getStemByKorean(hidden.middle) : null;
  const residueStem = hidden.residue ? getStemByKorean(hidden.residue) : null;

  return {
    main: hidden.main,
    middle: hidden.middle,
    residue: hidden.residue,
    mainElement: mainStem?.element || 'earth',
    middleElement: middleStem?.element || null,
    residueElement: residueStem?.element || null,
  };
}

export function analyzeHiddenStems(pillars: FourPillars): HiddenStemAnalysis {
  const year = getHiddenStemInfo(pillars.year.branch);
  const month = getHiddenStemInfo(pillars.month.branch);
  const day = getHiddenStemInfo(pillars.day.branch);
  const hour = pillars.hour ? getHiddenStemInfo(pillars.hour.branch) : null;

  const hiddenTraits: string[] = [];
  const allHidden = [year, month, day, hour].filter(Boolean) as HiddenStemInfo[];

  // 지장간에서 드러나는 숨은 특성 분석
  const hiddenElements: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };

  allHidden.forEach(h => {
    hiddenElements[h.mainElement]++;
    if (h.middleElement) hiddenElements[h.middleElement]++;
    if (h.residueElement) hiddenElements[h.residueElement]++;
  });

  // 가장 많은 숨은 오행 찾기
  const maxHiddenElement = Object.entries(hiddenElements)
    .sort((a, b) => b[1] - a[1])[0];

  if (maxHiddenElement[1] >= 3) {
    const elementKorean = FIVE_ELEMENTS[maxHiddenElement[0] as Element].korean;
    hiddenTraits.push(`내면에 ${elementKorean}(${maxHiddenElement[0]})의 기운이 강하게 숨어있습니다`);
  }

  // 천간과 지장간의 차이 분석
  const dayMasterElement = getStemByKorean(pillars.day.stem)?.element;
  if (dayMasterElement && day) {
    if (dayMasterElement !== day.mainElement) {
      const surfaceElement = FIVE_ELEMENTS[dayMasterElement].korean;
      const hiddenElement = FIVE_ELEMENTS[day.mainElement].korean;
      hiddenTraits.push(`겉으로는 ${surfaceElement}의 성향이지만, 내면에는 ${hiddenElement}의 기질이 숨어있습니다`);
    }
  }

  const summary = hiddenTraits.length > 0
    ? hiddenTraits.join('. ')
    : '천간과 지장간이 조화를 이루어 내외가 일치하는 편입니다';

  return {
    year,
    month,
    day,
    hour,
    summary,
    hiddenTraits,
  };
}

// ========================================
// 삼합 분석
// ========================================

export function analyzeThreeCombines(pillars: FourPillars): ThreeCombineAnalysis {
  const branches = [
    pillars.year.branch,
    pillars.month.branch,
    pillars.day.branch,
    ...(pillars.hour ? [pillars.hour.branch] : []),
  ];

  const found: ThreeCombine[] = [];
  const halfCombines: { branches: string[]; missing: string; element: Element; name: string }[] = [];

  THREE_COMBINES.forEach(tc => {
    const matchCount = tc.branches.filter(b => branches.includes(b)).length;

    if (matchCount === 3) {
      found.push(tc);
    } else if (matchCount === 2) {
      const presentBranches = tc.branches.filter(b => branches.includes(b));
      const missingBranch = tc.branches.find(b => !branches.includes(b))!;
      halfCombines.push({
        branches: presentBranches,
        missing: missingBranch,
        element: tc.element,
        name: `반${tc.name.slice(0, -1)}`,
      });
    }
  });

  let summary = '';
  if (found.length > 0) {
    const names = found.map(f => f.name).join(', ');
    summary = `${names}이(가) 형성되어 ${found[0].description}`;
  } else if (halfCombines.length > 0) {
    const firstHalf = halfCombines[0];
    summary = `${firstHalf.name}의 기운이 있으나, ${firstHalf.missing}이(가) 없어 완전하지 않습니다. 해당 오행의 해에 좋은 기회가 올 수 있습니다.`;
  } else {
    summary = '뚜렷한 삼합 구조는 없으나, 이는 다양한 기운이 고르게 분포되어 있음을 의미합니다.';
  }

  return { found, halfCombines, summary };
}

// ========================================
// 육해/형벌 분석
// ========================================

export function analyzeHarmsPunishments(pillars: FourPillars): HarmPunishmentAnalysis {
  const branches = [
    pillars.year.branch,
    pillars.month.branch,
    pillars.day.branch,
    ...(pillars.hour ? [pillars.hour.branch] : []),
  ];

  const harms: SixHarm[] = [];
  const punishments: Punishment[] = [];

  // 육해 체크
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const harm = SIX_HARMS.find(h =>
        (h.pair[0] === branches[i] && h.pair[1] === branches[j]) ||
        (h.pair[0] === branches[j] && h.pair[1] === branches[i])
      );
      if (harm) {
        harms.push(harm);
      }
    }
  }

  // 삼형 체크 (3글자 형벌)
  PUNISHMENTS.mutual.forEach(p => {
    const matchCount = p.branches.filter(b => branches.includes(b)).length;
    if (matchCount >= 2) {
      punishments.push({
        type: 'mutual',
        branches: p.branches.filter(b => branches.includes(b)),
        name: p.name,
        description: p.description,
      });
    }
  });

  // 자형 체크 (같은 지지가 2개 이상)
  const branchCounts: Record<string, number> = {};
  branches.forEach(b => {
    branchCounts[b] = (branchCounts[b] || 0) + 1;
  });

  PUNISHMENTS.self.forEach(p => {
    const branch = p.branches[0];
    if (branchCounts[branch] >= 2) {
      punishments.push({
        type: 'self',
        branches: [branch, branch],
        name: p.name,
        description: p.description,
      });
    }
  });

  // 상형 체크 (2글자 형벌)
  PUNISHMENTS.ungrateful.forEach(p => {
    if (branches.includes(p.branches[0]) && branches.includes(p.branches[1])) {
      punishments.push({
        type: 'ungrateful',
        branches: p.branches,
        name: p.name,
        description: p.description,
      });
    }
  });

  let summary = '';
  const issues: string[] = [];

  if (harms.length > 0) {
    issues.push(`육해(${harms.map(h => h.name).join(', ')})가 있어 인간관계에서 갈등이 생길 수 있습니다`);
  }
  if (punishments.length > 0) {
    issues.push(`형벌(${punishments.map(p => p.name).join(', ')})이 있어 주의가 필요한 부분이 있습니다`);
  }

  if (issues.length === 0) {
    summary = '사주에 육해나 형벌이 없어 대체로 평탄한 관계 운입니다.';
  } else {
    summary = issues.join('. ') + '. 하지만 이를 인식하고 노력하면 극복할 수 있습니다.';
  }

  return { harms, punishments, summary };
}

// ========================================
// 일간 강약 판단
// ========================================

export function analyzeDayMasterStrength(pillars: FourPillars, elements: Record<Element, number>): DayMasterStrength {
  const dayMaster = getStemByKorean(pillars.day.stem);
  if (!dayMaster) {
    return { strength: 'neutral', score: 50, reasons: [], analysis: '분석할 수 없습니다' };
  }

  const myElement = dayMaster.element;
  const reasons: string[] = [];
  let score = 50; // 기본 점수

  // 1. 월령 분석 (가장 중요, ±15점)
  const monthBranch = getBranchByKorean(pillars.month.branch);
  if (monthBranch) {
    const monthElement = monthBranch.element;
    const generatingElement = Object.entries(FIVE_ELEMENTS)
      .find(([_, v]) => v.generates === myElement)?.[0] as Element | undefined;

    if (monthElement === myElement) {
      score += 15;
      reasons.push('월령이 일간과 같은 오행으로 득령(得令)');
    } else if (generatingElement && monthElement === generatingElement) {
      score += 10;
      reasons.push('월령이 일간을 생해주어 힘을 얻음');
    } else if (FIVE_ELEMENTS[monthElement].controls === myElement) {
      score -= 15;
      reasons.push('월령이 일간을 극하여 실령(失令)');
    }
  }

  // 2. 비겁(비견, 겁재) 분석 (±10점)
  const bijeobCount = elements[myElement];
  if (bijeobCount >= 3) {
    score += 10;
    reasons.push(`비견/겁재가 ${bijeobCount}개로 많아 힘이 강함`);
  } else if (bijeobCount === 0) {
    score -= 10;
    reasons.push('비견/겁재가 없어 외로운 사주');
  }

  // 3. 인성(나를 생하는 오행) 분석 (±8점)
  const generatingElement = Object.entries(FIVE_ELEMENTS)
    .find(([_, v]) => v.generates === myElement)?.[0] as Element | undefined;

  if (generatingElement) {
    const inseongCount = elements[generatingElement];
    if (inseongCount >= 2) {
      score += 8;
      reasons.push(`인성(${FIVE_ELEMENTS[generatingElement].korean})이 강해 지원을 받음`);
    }
  }

  // 4. 관성(나를 극하는 오행) 분석 (±8점)
  const controllingElement = Object.entries(FIVE_ELEMENTS)
    .find(([_, v]) => v.controls === myElement)?.[0] as Element | undefined;

  if (controllingElement) {
    const gwanseongCount = elements[controllingElement];
    if (gwanseongCount >= 3) {
      score -= 12;
      reasons.push(`관성(${FIVE_ELEMENTS[controllingElement].korean})이 과다하여 압박이 큼`);
    } else if (gwanseongCount >= 2) {
      score -= 5;
      reasons.push(`관성의 제약이 적당히 있음`);
    }
  }

  // 5. 재성(내가 극하는 오행) 분석 (±5점)
  const controlledElement = FIVE_ELEMENTS[myElement].controls;
  const jaeseongCount = elements[controlledElement];
  if (jaeseongCount >= 3 && score < 55) {
    score -= 8;
    reasons.push(`재성(${FIVE_ELEMENTS[controlledElement].korean})이 과다하여 기운을 빼앗김`);
  }

  // 6. 지장간 분석 (추가 보정)
  const hiddenStems = analyzeHiddenStems(pillars);
  const allHidden = [hiddenStems.year, hiddenStems.month, hiddenStems.day, hiddenStems.hour]
    .filter(Boolean) as HiddenStemInfo[];

  let hiddenSupport = 0;
  allHidden.forEach(h => {
    if (h.mainElement === myElement) hiddenSupport++;
    if (h.middleElement === myElement) hiddenSupport += 0.5;
    if (h.residueElement === myElement) hiddenSupport += 0.3;
  });

  if (hiddenSupport >= 2) {
    score += 5;
    reasons.push('지장간에서 일간을 돕는 기운이 있음');
  }

  // 점수 범위 제한
  score = Math.max(0, Math.min(100, score));

  // 강약 판정
  let strength: DayMasterStrength['strength'];
  if (score >= 75) {
    strength = 'extreme-strong';
  } else if (score >= 60) {
    strength = 'strong';
  } else if (score >= 40) {
    strength = 'neutral';
  } else if (score >= 25) {
    strength = 'weak';
  } else {
    strength = 'extreme-weak';
  }

  const strengthDescriptions: Record<typeof strength, string> = {
    'extreme-strong': '극강(極强) - 일간의 힘이 매우 강합니다. 겸손함이 필요하며, 자신을 낮추는 것이 좋습니다.',
    'strong': '신강(身强) - 일간의 힘이 강합니다. 자신감 있게 추진하되, 관성과 재성의 도움을 받으면 좋습니다.',
    'neutral': '중화(中和) - 일간의 힘이 적당합니다. 균형 잡힌 사주로 융통성 있게 대처하면 좋습니다.',
    'weak': '신약(身弱) - 일간의 힘이 약합니다. 인성과 비겁의 도움을 받으면 좋습니다.',
    'extreme-weak': '극약(極弱) - 일간의 힘이 매우 약합니다. 조용히 흐름을 따르는 것이 좋습니다.',
  };

  return {
    strength,
    score,
    reasons,
    analysis: strengthDescriptions[strength],
  };
}

// ========================================
// 용신/기신 분석
// ========================================

export function analyzeYongsin(
  pillars: FourPillars,
  elements: Record<Element, number>,
  dayMasterStrength: DayMasterStrength
): YongsinAnalysis {
  const dayMaster = getStemByKorean(pillars.day.stem);
  if (!dayMaster) {
    return {
      yongsin: [],
      heeshin: [],
      gishin: [],
      gushin: [],
      summary: '분석할 수 없습니다',
      recommendations: { colors: [], directions: [], numbers: [], advice: [] },
    };
  }

  const myElement = dayMaster.element;
  const yongsin: Element[] = [];
  const heeshin: Element[] = [];
  const gishin: Element[] = [];
  const gushin: Element[] = [];

  // 오행 관계 맵
  const generatingMe = Object.entries(FIVE_ELEMENTS)
    .find(([_, v]) => v.generates === myElement)?.[0] as Element | undefined;
  const generatedByMe = FIVE_ELEMENTS[myElement].generates;
  const controllingMe = Object.entries(FIVE_ELEMENTS)
    .find(([_, v]) => v.controls === myElement)?.[0] as Element | undefined;
  const controlledByMe = FIVE_ELEMENTS[myElement].controls;

  if (dayMasterStrength.strength === 'strong' || dayMasterStrength.strength === 'extreme-strong') {
    // 신강 사주: 설기(泄氣)와 극기(剋氣)가 필요
    // 용신: 식상(내가 생하는 것), 재성(내가 극하는 것)
    yongsin.push(generatedByMe, controlledByMe);
    // 희신: 관성(나를 극하는 것)
    if (controllingMe) heeshin.push(controllingMe);
    // 기신: 인성, 비겁
    if (generatingMe) gishin.push(generatingMe);
    gishin.push(myElement);
  } else if (dayMasterStrength.strength === 'weak' || dayMasterStrength.strength === 'extreme-weak') {
    // 신약 사주: 생기(生氣)와 방조(幇助)가 필요
    // 용신: 인성(나를 생하는 것), 비겁(같은 오행)
    if (generatingMe) yongsin.push(generatingMe);
    yongsin.push(myElement);
    // 희신: 인성을 생하는 것
    const generatingInseong = generatingMe
      ? Object.entries(FIVE_ELEMENTS).find(([_, v]) => v.generates === generatingMe)?.[0] as Element | undefined
      : undefined;
    if (generatingInseong) heeshin.push(generatingInseong);
    // 기신: 관성, 재성
    if (controllingMe) gishin.push(controllingMe);
    gishin.push(controlledByMe);
    // 구신: 식상
    gushin.push(generatedByMe);
  } else {
    // 중화 사주: 균형 유지
    // 부족한 오행이 용신
    const minElement = Object.entries(elements)
      .filter(([e]) => e !== myElement)
      .sort((a, b) => a[1] - b[1])[0]?.[0] as Element | undefined;

    if (minElement) {
      yongsin.push(minElement);
      const generatingMin = Object.entries(FIVE_ELEMENTS)
        .find(([_, v]) => v.generates === minElement)?.[0] as Element | undefined;
      if (generatingMin) heeshin.push(generatingMin);
    }

    // 과다한 오행이 기신
    const maxElement = Object.entries(elements)
      .sort((a, b) => b[1] - a[1])[0]?.[0] as Element | undefined;
    if (maxElement && maxElement !== myElement && elements[maxElement] >= 3) {
      gishin.push(maxElement);
    }
  }

  // 추천 사항 생성
  const recommendations = {
    colors: yongsin.map(e => ELEMENT_ATTRIBUTES[e].color),
    directions: yongsin.map(e => ELEMENT_ATTRIBUTES[e].direction),
    numbers: yongsin.flatMap(e => ELEMENT_ATTRIBUTES[e].numbers),
    advice: [] as string[],
  };

  // 조언 생성
  if (dayMasterStrength.strength === 'strong' || dayMasterStrength.strength === 'extreme-strong') {
    recommendations.advice.push('자신의 기운을 적절히 발산하는 활동이 좋습니다');
    recommendations.advice.push('다른 사람을 돕거나 베푸는 일이 길합니다');
    recommendations.advice.push(`${FIVE_ELEMENTS[generatedByMe].korean}, ${FIVE_ELEMENTS[controlledByMe].korean} 관련 직업이나 활동이 유리합니다`);
  } else if (dayMasterStrength.strength === 'weak' || dayMasterStrength.strength === 'extreme-weak') {
    recommendations.advice.push('무리하지 않고 자신을 보호하는 것이 중요합니다');
    recommendations.advice.push('든든한 지원자나 멘토를 찾는 것이 좋습니다');
    if (generatingMe) {
      recommendations.advice.push(`${FIVE_ELEMENTS[generatingMe].korean}, ${FIVE_ELEMENTS[myElement].korean} 관련 직업이나 활동이 유리합니다`);
    }
  } else {
    recommendations.advice.push('균형 잡힌 사주로 다양한 분야에서 활동할 수 있습니다');
    recommendations.advice.push('부족한 기운을 보충하면 더욱 좋습니다');
  }

  const yongsinNames = yongsin.map(e => FIVE_ELEMENTS[e].korean).join(', ');
  const gishinNames = gishin.length > 0 ? gishin.map(e => FIVE_ELEMENTS[e].korean).join(', ') : '없음';

  const summary = `용신은 ${yongsinNames}이고, 기신은 ${gishinNames}입니다. ${recommendations.advice[0]}`;

  return {
    yongsin,
    heeshin,
    gishin,
    gushin,
    summary,
    recommendations,
  };
}

// ========================================
// 종합 분석
// ========================================

export function performAdvancedAnalysis(pillars: FourPillars, elements: Record<Element, number>): AdvancedAnalysisResult {
  const hiddenStems = analyzeHiddenStems(pillars);
  const threeCombines = analyzeThreeCombines(pillars);
  const harmsPunishments = analyzeHarmsPunishments(pillars);
  const dayMasterStrength = analyzeDayMasterStrength(pillars, elements);
  const yongsin = analyzeYongsin(pillars, elements, dayMasterStrength);

  // 종합 요약 생성
  const summaryParts: string[] = [];

  // 강약
  const strengthKorean = {
    'extreme-strong': '극강',
    'strong': '신강',
    'neutral': '중화',
    'weak': '신약',
    'extreme-weak': '극약',
  }[dayMasterStrength.strength];
  summaryParts.push(`일간은 ${strengthKorean}(${dayMasterStrength.score}점)입니다`);

  // 삼합
  if (threeCombines.found.length > 0) {
    summaryParts.push(threeCombines.found[0].name + '이 형성되어 있습니다');
  }

  // 형해
  if (harmsPunishments.harms.length > 0 || harmsPunishments.punishments.length > 0) {
    summaryParts.push('일부 형해(刑害)가 있어 주의가 필요합니다');
  }

  // 용신
  const yongsinKorean = yongsin.yongsin.map(e => FIVE_ELEMENTS[e].korean).join('과 ');
  summaryParts.push(`용신은 ${yongsinKorean}입니다`);

  const overallSummary = summaryParts.join('. ') + '.';

  return {
    hiddenStems,
    threeCombines,
    harmsPunishments,
    dayMasterStrength,
    yongsin,
    overallSummary,
  };
}
