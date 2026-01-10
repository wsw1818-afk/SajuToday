/**
 * 사주 분석 유틸리티 함수 모음
 * ProfileScreen.tsx에서 분리한 분석 로직
 */

import { HEAVENLY_STEMS, EARTHLY_BRANCHES, SEXAGENARY_CYCLE } from '../data/saju';

// 오행 한글 이름
export const ELEMENT_KOREAN: Record<string, string> = {
  wood: '목(木)', fire: '화(火)', earth: '토(土)', metal: '금(金)', water: '수(水)',
};

// 오행별 색상
export const ELEMENT_COLOR: Record<string, string> = {
  wood: '청색/녹색', fire: '적색/분홍', earth: '황색/갈색', metal: '백색/은색', water: '흑색/남색',
};

// 오행별 방향
export const ELEMENT_DIRECTION: Record<string, string> = {
  wood: '동쪽', fire: '남쪽', earth: '중앙', metal: '서쪽', water: '북쪽',
};

// 오행별 숫자
export const ELEMENT_NUMBER: Record<string, string> = {
  wood: '3, 8', fire: '2, 7', earth: '5, 10', metal: '4, 9', water: '1, 6',
};

// 오행 상생상극 관계
export const ELEMENT_RELATIONS: Record<string, { generates: string; generatedBy: string; controls: string }> = {
  wood: { generates: 'fire', generatedBy: 'water', controls: 'earth' },
  fire: { generates: 'earth', generatedBy: 'wood', controls: 'metal' },
  earth: { generates: 'metal', generatedBy: 'fire', controls: 'water' },
  metal: { generates: 'water', generatedBy: 'earth', controls: 'wood' },
  water: { generates: 'wood', generatedBy: 'metal', controls: 'fire' },
};

// 한자 변환 헬퍼
export const getStemHanja = (stem: string): string => {
  const hanjaMap: Record<string, string> = {
    '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
    '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸',
  };
  return hanjaMap[stem] || '';
};

export const getBranchHanja = (branch: string): string => {
  const hanjaMap: Record<string, string> = {
    '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳',
    '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥',
  };
  return hanjaMap[branch] || '';
};

/**
 * 대운 계산 함수
 */
export function calculateDaeun(sajuResult: any, profile: any) {
  const { pillars, dayMasterInfo } = sajuResult;
  const monthStem = pillars.month.stem;
  const monthBranch = pillars.month.branch;

  // 년간의 음양과 성별로 대운 방향 결정
  const yearStemInfo = HEAVENLY_STEMS.find(s => s.korean === pillars.year.stem);
  const isYearYang = yearStemInfo?.yinYang === 'yang';
  const isMale = profile.gender === 'male';
  const isForward = (isYearYang && isMale) || (!isYearYang && !isMale);

  // 월주의 60갑자 순서 찾기
  const monthGanjiIndex = SEXAGENARY_CYCLE.findIndex(
    c => c.stem === monthStem && c.branch === monthBranch
  );

  // 대운 리스트 생성 (8개 대운)
  const daeunList = [];
  for (let i = 1; i <= 8; i++) {
    let newIndex;
    if (isForward) {
      newIndex = (monthGanjiIndex + i) % 60;
    } else {
      newIndex = (monthGanjiIndex - i + 60) % 60;
    }
    const ganji = SEXAGENARY_CYCLE[newIndex];
    const stemInfo = HEAVENLY_STEMS.find(s => s.korean === ganji.stem);
    const branchInfo = EARTHLY_BRANCHES.find(b => b.korean === ganji.branch);

    daeunList.push({
      order: i,
      startAge: i * 10,
      endAge: (i + 1) * 10 - 1,
      stem: ganji.stem,
      branch: ganji.branch,
      korean: ganji.korean,
      stemElement: stemInfo?.element,
      branchElement: branchInfo?.element,
    });
  }

  // 현재 나이 계산
  const birthYear = parseInt(profile.birthDate.split('-')[0]);
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear + 1;

  // 현재 대운 찾기
  const currentDaeun = daeunList.find(d => age >= d.startAge && age <= d.endAge) || daeunList[0];

  // 현재 대운 해석 생성
  const elementMeaning: Record<string, string> = {
    wood: '성장과 발전의 시기입니다. 새로운 시작이나 도전에 유리하며, 배움과 자기계발에 좋은 때입니다.',
    fire: '열정과 활동의 시기입니다. 적극적으로 나서면 성과를 얻을 수 있고, 인간관계가 활발해집니다.',
    earth: '안정과 결실의 시기입니다. 그동안의 노력이 결실을 맺고, 기반을 다지기 좋은 때입니다.',
    metal: '정리와 수확의 시기입니다. 불필요한 것을 정리하고 핵심에 집중하면 좋은 성과를 얻습니다.',
    water: '지혜와 준비의 시기입니다. 내면을 성찰하고 다음을 준비하는 데 좋은 때입니다.',
  };

  let interpretation = '';
  if (currentDaeun) {
    const mainElement = currentDaeun.stemElement || 'earth';
    interpretation = elementMeaning[mainElement];

    if (mainElement === dayMasterInfo.element) {
      interpretation += ' 대운의 기운이 본인과 같아 자신감이 높아지는 시기입니다.';
    }
  }

  return {
    direction: isForward ? '순행' : '역행',
    list: daeunList,
    current: currentDaeun,
    age,
    interpretation,
  };
}

/**
 * 세운 계산 함수 (올해 운세)
 */
export function calculateSaeun(year: number, sajuResult?: any) {
  const baseYear = 1984; // 갑자년
  const diff = year - baseYear;
  const index = ((diff % 60) + 60) % 60;
  const ganji = SEXAGENARY_CYCLE[index];

  const stemInfo = HEAVENLY_STEMS.find(s => s.korean === ganji.stem);
  const branchInfo = EARTHLY_BRANCHES.find(b => b.korean === ganji.branch);

  const yearMeaning: Record<string, string> = {
    wood: '올해는 새로운 시작과 성장의 해입니다. 도전정신을 발휘하고 배움에 투자하세요.',
    fire: '올해는 열정과 활력의 해입니다. 적극적으로 행동하고 인맥을 넓히기 좋습니다.',
    earth: '올해는 안정과 내실의 해입니다. 기반을 다지고 실속을 챙기세요.',
    metal: '올해는 결단과 정리의 해입니다. 과감하게 결정하고 불필요한 것을 정리하세요.',
    water: '올해는 지혜와 유연함의 해입니다. 상황에 맞게 적응하고 내면을 성찰하세요.',
  };

  const mainElement = stemInfo?.element || 'earth';
  let interpretation = yearMeaning[mainElement];

  // 충 관계 확인
  if (sajuResult) {
    const yearBranch = sajuResult.pillars.year.branch;
    const clashPairs: Record<string, string> = {
      '자': '오', '오': '자', '축': '미', '미': '축',
      '인': '신', '신': '인', '묘': '유', '유': '묘',
      '진': '술', '술': '진', '사': '해', '해': '사',
    };
    if (clashPairs[yearBranch] === ganji.branch) {
      interpretation += '\n\n【沖】 올해는 본인 띠와 충이 되는 해입니다. 변화가 많을 수 있으니 신중하게 결정하세요.';
    }
  }

  return {
    year,
    stem: ganji.stem,
    branch: ganji.branch,
    korean: ganji.korean,
    hanja: ganji.hanja,
    stemElement: stemInfo?.element,
    branchElement: branchInfo?.element,
    animal: branchInfo?.animal,
    interpretation,
  };
}

/**
 * 용신 분석 함수
 */
export function analyzeYongsin(sajuResult: any) {
  const { elements, dayMasterInfo } = sajuResult;
  const dayElement = dayMasterInfo.element;

  // 일간 강약 분석
  const sameElement = elements[dayElement as keyof typeof elements] || 0;
  const generatingElement = elements[ELEMENT_RELATIONS[dayElement].generatedBy as keyof typeof elements] || 0;
  const supportingPower = sameElement + generatingElement;

  const isStrong = supportingPower >= 4;

  let yongsin: string;
  let gisin: string;

  if (isStrong) {
    yongsin = ELEMENT_RELATIONS[dayElement].generates;
    gisin = ELEMENT_RELATIONS[dayElement].generatedBy;
  } else {
    yongsin = ELEMENT_RELATIONS[dayElement].generatedBy;
    gisin = ELEMENT_RELATIONS[dayElement].controls;
  }

  const yongsinAdvice: Record<string, string> = {
    wood: '나무 기운을 보충하세요. 녹색 식물을 가까이하고, 아침 산책이나 등산이 좋습니다. 동쪽 방향이 유리합니다.',
    fire: '불 기운을 보충하세요. 밝은 조명, 따뜻한 색상의 옷, 활발한 운동이 도움됩니다. 남쪽 방향이 유리합니다.',
    earth: '흙 기운을 보충하세요. 도자기, 돌, 황토 등을 활용하고, 규칙적인 생활이 중요합니다.',
    metal: '금 기운을 보충하세요. 금속 액세서리, 흰색 계열 옷, 결단력 있는 행동이 좋습니다. 서쪽 방향이 유리합니다.',
    water: '물 기운을 보충하세요. 수영, 목욕, 물 가까이 가는 것이 좋습니다. 북쪽 방향이 유리합니다.',
  };

  const gisinWarning: Record<string, string> = {
    wood: '나무 기운이 과하면 고집이 세지고 무리하게 됩니다. 휴식을 취하세요.',
    fire: '불 기운이 과하면 급해지고 다툼이 생깁니다. 마음을 가라앉히세요.',
    earth: '흙 기운이 과하면 고지식해지고 변화를 거부하게 됩니다. 유연하게 생각하세요.',
    metal: '금 기운이 과하면 냉정해지고 외로워집니다. 따뜻한 마음을 가지세요.',
    water: '물 기운이 과하면 걱정이 많아지고 우유부단해집니다. 결단력을 가지세요.',
  };

  return {
    isStrong,
    strengthDesc: isStrong ? '신강(身强)' : '신약(身弱)',
    strengthExplain: isStrong
      ? '일간의 힘이 강한 편입니다. 에너지를 발산하고 활용하는 것이 좋습니다.'
      : '일간의 힘이 약한 편입니다. 에너지를 보충하고 지원받는 것이 좋습니다.',
    yongsin: {
      element: yongsin,
      korean: ELEMENT_KOREAN[yongsin],
      color: ELEMENT_COLOR[yongsin],
      direction: ELEMENT_DIRECTION[yongsin],
      number: ELEMENT_NUMBER[yongsin],
      advice: yongsinAdvice[yongsin],
    },
    gisin: {
      element: gisin,
      korean: ELEMENT_KOREAN[gisin],
      warning: gisinWarning[gisin],
    },
  };
}

/**
 * 건강 분석 함수
 */
export function analyzeHealth(sajuResult: any) {
  const { elements } = sajuResult;

  const elementHealth: Record<string, { organs: string; symptoms: string; advice: string; interpretation: string }> = {
    wood: {
      organs: '간, 담, 눈, 근육, 손톱',
      symptoms: '시력 저하, 근육 경련, 피로감',
      advice: '충분한 수면, 녹색 채소 섭취, 눈 휴식',
      interpretation: '목(木) 기운이 부족하면 간과 눈에 피로가 쌓이기 쉽습니다. 아침 산책으로 나무 기운을 보충하고, 당근이나 시금치 같은 녹색 채소를 자주 드세요.',
    },
    fire: {
      organs: '심장, 소장, 혀, 혈관',
      symptoms: '두근거림, 불면증, 구내염',
      advice: '명상, 심호흡, 매운 음식 자제',
      interpretation: '화(火) 기운이 부족하면 혈액순환이 약해지고 손발이 차가워질 수 있습니다. 따뜻한 차를 마시고, 가벼운 유산소 운동으로 심장을 튼튼하게 하세요.',
    },
    earth: {
      organs: '비장, 위장, 입술, 살',
      symptoms: '소화불량, 식욕 변화, 부종',
      advice: '규칙적인 식사, 과식 금지',
      interpretation: '토(土) 기운이 부족하면 소화력이 약해지고 위장 장애가 생기기 쉽습니다. 규칙적으로 식사하고, 찬 음식보다 따뜻한 음식을 드세요.',
    },
    metal: {
      organs: '폐, 대장, 코, 피부',
      symptoms: '호흡기 질환, 피부 트러블, 변비',
      advice: '심호흡 운동, 수분 섭취, 피부 보습',
      interpretation: '금(金) 기운이 부족하면 폐와 피부가 건조해지기 쉽습니다. 복식호흡을 하고 물을 자주 마시며, 피부 보습에 신경 쓰세요.',
    },
    water: {
      organs: '신장, 방광, 귀, 뼈',
      symptoms: '요통, 부종, 청력 저하',
      advice: '충분한 수분 섭취, 짠 음식 자제',
      interpretation: '수(水) 기운이 부족하면 신장 기능이 약해지고 허리가 아플 수 있습니다. 검은콩, 검은깨 등 검은색 음식이 좋고, 짠 음식은 피하세요.',
    },
  };

  const elementExcess: Record<string, string> = {
    wood: '목(木) 기운이 과하면 화를 잘 내고 스트레스를 많이 받을 수 있습니다. 마음을 편히 가지고 명상이나 스트레칭으로 긴장을 풀어주세요.',
    fire: '화(火) 기운이 과하면 가슴이 답답하고 쉽게 흥분할 수 있습니다. 심호흡으로 마음을 가라앉히고, 매운 음식을 줄이세요.',
    earth: '토(土) 기운이 과하면 소화기에 무리가 오고 살이 찌기 쉽습니다. 과식을 피하고 가벼운 운동을 규칙적으로 하세요.',
    metal: '금(金) 기운이 과하면 기관지가 예민해지고 피부 트러블이 생길 수 있습니다. 충분한 수분 섭취와 보습이 중요합니다.',
    water: '수(水) 기운이 과하면 몸이 붓고 피곤하기 쉽습니다. 짠 음식을 줄이고 가볍게 몸을 움직여주세요.',
  };

  const weakElements: string[] = [];
  const strongElements: string[] = [];

  Object.entries(elements).forEach(([element, count]) => {
    if ((count as number) === 0) {
      weakElements.push(element);
    } else if ((count as number) >= 3) {
      strongElements.push(element);
    }
  });

  return {
    weakElements: weakElements.map(e => ({
      element: e,
      ...elementHealth[e],
    })),
    strongElements: strongElements.map(e => ({
      element: e,
      ...elementHealth[e],
      interpretation: elementExcess[e],
    })),
  };
}

/**
 * 육친 분석 함수
 */
export function analyzeFamily(sajuResult: any) {
  const { tenGods } = sajuResult;

  const familyMapping: Record<string, { relation: string; meaning: string; interpretation: string }> = {
    '비견': {
      relation: '형제/친구',
      meaning: '동료, 경쟁자, 친구 관계',
      interpretation: '나와 비슷한 사람들과의 인연이 강합니다. 좋은 친구나 동료를 만날 수 있지만, 경쟁 관계가 생기기도 해요. 협력하면서도 자기 주관을 지키는 게 중요합니다.',
    },
    '겁재': {
      relation: '형제/동업자',
      meaning: '형제자매, 동업자 관계',
      interpretation: '형제자매나 동업자와의 관계가 중요합니다. 함께 일하면 시너지를 낼 수 있지만, 재물 관리는 신중하게 하세요. 명확한 역할 분담이 필요합니다.',
    },
    '식신': {
      relation: '자녀/표현',
      meaning: '표현력, 식복, 자녀운',
      interpretation: '표현력이 뛰어나고 먹는 복이 있습니다. 요리, 글쓰기, 예술 등에서 재능을 발휘할 수 있어요. 자녀와의 관계도 원만한 편입니다.',
    },
    '상관': {
      relation: '자녀/재능',
      meaning: '재능, 자유, 자녀운',
      interpretation: '창의적이고 자유로운 영혼입니다. 예술, 연예, 프리랜서 분야에서 두각을 나타낼 수 있어요. 다만 규칙에 얽매이는 걸 싫어해서 직장생활은 맞지 않을 수 있습니다.',
    },
    '편재': {
      relation: '아버지/재물',
      meaning: '부친운, 재물운',
      interpretation: '사업 수완이 있고 돈 버는 능력이 좋습니다. 아버지와의 인연이 깊고, 투자나 사업에서 성과를 낼 수 있어요. 다만 너무 욕심내지 않는 게 좋습니다.',
    },
    '정재': {
      relation: '배우자/재물',
      meaning: '배우자운, 재물운',
      interpretation: '성실하게 일해서 재물을 모으는 타입입니다. 배우자운이 좋고, 안정적인 가정을 꾸릴 수 있어요. 꾸준함이 성공의 비결입니다.',
    },
    '편관': {
      relation: '자녀/직장',
      meaning: '자녀운, 직장운',
      interpretation: '리더십이 있고 조직을 이끄는 능력이 있습니다. 직장에서 인정받기 쉽지만, 때로는 스트레스를 받을 수 있어요. 자기 관리가 중요합니다.',
    },
    '정관': {
      relation: '배우자/명예',
      meaning: '명예운, 직장운',
      interpretation: '사회적으로 인정받는 삶을 살 수 있습니다. 공무원, 대기업 등 안정적인 직장과 인연이 깊어요. 배우자운도 좋은 편입니다.',
    },
    '편인': {
      relation: '계모/학업',
      meaning: '학업운, 예술운',
      interpretation: '창의적인 학문이나 예술에 재능이 있습니다. 독특한 사고방식으로 남다른 성취를 이룰 수 있어요. 자격증이나 기술을 익히면 큰 도움이 됩니다.',
    },
    '정인': {
      relation: '어머니',
      meaning: '모친운, 학업운, 문서운',
      interpretation: '어머니의 사랑을 많이 받고 학업운이 좋습니다. 자격증, 계약서 등 문서 관련 일이 잘 풀리는 편이에요. 배움을 좋아하고 지식을 쌓는 것이 도움됩니다.',
    },
  };

  const familyAnalysis: { pillar: string; tenGod: string; relation: string; meaning: string; interpretation: string }[] = [];

  // 형제운 체크
  const hasBigyeon = tenGods.year === '비견' || tenGods.month === '비견' || tenGods.hour === '비견';
  const hasGeobjae = tenGods.year === '겁재' || tenGods.month === '겁재' || tenGods.hour === '겁재';
  const hasSiblingInSaju = hasBigyeon || hasGeobjae;

  if (!hasSiblingInSaju) {
    familyAnalysis.push({
      pillar: '기본',
      tenGod: '비견',
      relation: '형제/친구',
      meaning: '사주에 비견/겁재 없음',
      interpretation: '형제자매나 친구와의 인연이 약한 편입니다. 혼자 힘으로 성장하는 경우가 많고, 독립심이 강합니다. 나중에 인연이 생기면 오히려 더 소중히 여기게 됩니다.',
    });
  }

  if (tenGods.year && familyMapping[tenGods.year]) {
    familyAnalysis.push({ pillar: '년주', tenGod: tenGods.year, ...familyMapping[tenGods.year] });
  }
  if (tenGods.month && familyMapping[tenGods.month]) {
    familyAnalysis.push({ pillar: '월주', tenGod: tenGods.month, ...familyMapping[tenGods.month] });
  }
  if (tenGods.hour && familyMapping[tenGods.hour]) {
    familyAnalysis.push({ pillar: '시주', tenGod: tenGods.hour, ...familyMapping[tenGods.hour] });
  }

  return familyAnalysis;
}
