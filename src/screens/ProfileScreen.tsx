import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { useApp } from '../contexts/AppContext';
import Card from '../components/common/Card';
import PillarCard from '../components/saju/PillarCard';
import ElementChart from '../components/saju/ElementChart';
import { DAY_MASTER_TRAITS, HEAVENLY_STEMS, EARTHLY_BRANCHES, SEXAGENARY_CYCLE } from '../data/saju';
import { Element } from '../types';
import { SajuCalculator } from '../services/SajuCalculator';

// 대운 계산 함수
function calculateDaeun(sajuResult: any, profile: any) {
  const { pillars, dayMasterInfo } = sajuResult;
  const monthStem = pillars.month.stem;
  const monthBranch = pillars.month.branch;

  // 년간의 음양과 성별로 대운 방향 결정 (기본값: 순행)
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
  const age = currentYear - birthYear + 1; // 한국 나이

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

    // 일간과의 관계 추가
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

// 세운 계산 함수 (올해 운세)
function calculateSaeun(year: number, sajuResult?: any) {
  const baseYear = 1984; // 갑자년
  const diff = year - baseYear;
  const index = ((diff % 60) + 60) % 60;
  const ganji = SEXAGENARY_CYCLE[index];

  const stemInfo = HEAVENLY_STEMS.find(s => s.korean === ganji.stem);
  const branchInfo = EARTHLY_BRANCHES.find(b => b.korean === ganji.branch);

  // 세운 해석 생성
  const yearMeaning: Record<string, string> = {
    wood: '올해는 새로운 시작과 성장의 해입니다. 도전정신을 발휘하고 배움에 투자하세요.',
    fire: '올해는 열정과 활력의 해입니다. 적극적으로 행동하고 인맥을 넓히기 좋습니다.',
    earth: '올해는 안정과 내실의 해입니다. 기반을 다지고 실속을 챙기세요.',
    metal: '올해는 결단과 정리의 해입니다. 과감하게 결정하고 불필요한 것을 정리하세요.',
    water: '올해는 지혜와 유연함의 해입니다. 상황에 맞게 적응하고 내면을 성찰하세요.',
  };

  const mainElement = stemInfo?.element || 'earth';
  let interpretation = yearMeaning[mainElement];

  // 띠와 관련된 해석 추가
  if (sajuResult) {
    const yearBranch = sajuResult.pillars.year.branch;
    // 충 관계 확인 (간단한 충 쌍)
    const clashPairs: Record<string, string> = {
      '자': '오', '오': '자',
      '축': '미', '미': '축',
      '인': '신', '신': '인',
      '묘': '유', '유': '묘',
      '진': '술', '술': '진',
      '사': '해', '해': '사',
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

// 용신 분석 함수
function analyzeYongsin(sajuResult: any) {
  const { elements, dayMasterInfo } = sajuResult;
  const dayElement = dayMasterInfo.element;

  const elementRelations: Record<string, { generates: string; generatedBy: string; controls: string }> = {
    wood: { generates: 'fire', generatedBy: 'water', controls: 'earth' },
    fire: { generates: 'earth', generatedBy: 'wood', controls: 'metal' },
    earth: { generates: 'metal', generatedBy: 'fire', controls: 'water' },
    metal: { generates: 'water', generatedBy: 'earth', controls: 'wood' },
    water: { generates: 'wood', generatedBy: 'metal', controls: 'fire' },
  };

  const elementKorean: Record<string, string> = {
    wood: '목(木)', fire: '화(火)', earth: '토(土)', metal: '금(金)', water: '수(水)',
  };

  const elementColor: Record<string, string> = {
    wood: '청색/녹색', fire: '적색/분홍', earth: '황색/갈색', metal: '백색/은색', water: '흑색/남색',
  };

  const elementDirection: Record<string, string> = {
    wood: '동쪽', fire: '남쪽', earth: '중앙', metal: '서쪽', water: '북쪽',
  };

  const elementNumber: Record<string, string> = {
    wood: '3, 8', fire: '2, 7', earth: '5, 10', metal: '4, 9', water: '1, 6',
  };

  // 일간 강약 분석
  const sameElement = elements[dayElement as keyof typeof elements] || 0;
  const generatingElement = elements[elementRelations[dayElement].generatedBy as keyof typeof elements] || 0;
  const supportingPower = sameElement + generatingElement;

  const isStrong = supportingPower >= 4;

  let yongsin: string;
  let gisin: string;

  if (isStrong) {
    yongsin = elementRelations[dayElement].generates;
    gisin = elementRelations[dayElement].generatedBy;
  } else {
    yongsin = elementRelations[dayElement].generatedBy;
    gisin = elementRelations[dayElement].controls;
  }

  // 용신 활용 조언 생성
  const yongsinAdvice: Record<string, string> = {
    wood: '나무 기운을 보충하세요. 녹색 식물을 가까이하고, 아침 산책이나 등산이 좋습니다. 동쪽 방향이 유리합니다.',
    fire: '불 기운을 보충하세요. 밝은 조명, 따뜻한 색상의 옷, 활발한 운동이 도움됩니다. 남쪽 방향이 유리합니다.',
    earth: '흙 기운을 보충하세요. 도자기, 돌, 황토 등을 활용하고, 규칙적인 생활이 중요합니다.',
    metal: '금 기운을 보충하세요. 금속 액세서리, 흰색 계열 옷, 결단력 있는 행동이 좋습니다. 서쪽 방향이 유리합니다.',
    water: '물 기운을 보충하세요. 수영, 목욕, 물 가까이 가는 것이 좋습니다. 북쪽 방향이 유리합니다.',
  };

  // 기신 주의 조언
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
      korean: elementKorean[yongsin],
      color: elementColor[yongsin],
      direction: elementDirection[yongsin],
      number: elementNumber[yongsin],
      advice: yongsinAdvice[yongsin],
    },
    gisin: {
      element: gisin,
      korean: elementKorean[gisin],
      warning: gisinWarning[gisin],
    },
  };
}

// 건강 분석 함수
function analyzeHealth(sajuResult: any) {
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

// 육친 분석 함수
function analyzeFamily(sajuResult: any) {
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

  // 형제운 (비견/겁재) 체크 - 사주에 있는지 확인
  const hasBigyeon = tenGods.year === '비견' || tenGods.month === '비견' || tenGods.hour === '비견';
  const hasGeobjae = tenGods.year === '겁재' || tenGods.month === '겁재' || tenGods.hour === '겁재';
  const hasSiblingInSaju = hasBigyeon || hasGeobjae;

  // 형제운을 항상 맨 앞에 추가 (사주에 없어도 기본 정보 제공)
  if (!hasSiblingInSaju) {
    // 사주에 비견/겁재가 없는 경우 - 형제운 약함으로 표시
    familyAnalysis.push({
      pillar: '기본',
      tenGod: '비견',
      relation: '형제/친구',
      meaning: '사주에 비견/겁재 없음',
      interpretation: '형제자매나 친구와의 인연이 약한 편입니다. 혼자 힘으로 성장하는 경우가 많고, 독립심이 강합니다. 나중에 인연이 생기면 오히려 더 소중히 여기게 됩니다.',
    });
  }

  if (tenGods.year && familyMapping[tenGods.year]) {
    familyAnalysis.push({
      pillar: '년주',
      tenGod: tenGods.year,
      ...familyMapping[tenGods.year],
    });
  }

  if (tenGods.month && familyMapping[tenGods.month]) {
    familyAnalysis.push({
      pillar: '월주',
      tenGod: tenGods.month,
      ...familyMapping[tenGods.month],
    });
  }

  if (tenGods.hour && familyMapping[tenGods.hour]) {
    familyAnalysis.push({
      pillar: '시주',
      tenGod: tenGods.hour,
      ...familyMapping[tenGods.hour],
    });
  }

  return familyAnalysis;
}

// 일주론 상세 분석 (60갑자별 일주 해석)
function analyzeIljuDetail(sajuResult: any) {
  const { pillars, dayMaster, dayMasterInfo } = sajuResult;
  const dayBranch = pillars.day.branch;
  const ilju = `${dayMaster}${dayBranch}`;

  // 한자 조회 헬퍼
  const getStemHanja = (stem: string): string => {
    const hanjaMap: Record<string, string> = {
      '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
      '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸',
    };
    return hanjaMap[stem] || '';
  };

  const getBranchHanja = (branch: string): string => {
    const hanjaMap: Record<string, string> = {
      '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳',
      '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥',
    };
    return hanjaMap[branch] || '';
  };

  // 60갑자 일주별 상세 해석 (전체 60개)
  const iljuInterpretations: Record<string, {
    title: string;
    hanja?: string;
    personality: string;
    strengths: string;
    weaknesses: string;
    love: string;
    career: string;
    advice: string;
  }> = {
    // ===== 갑(甲) 일간 =====
    '갑자': {
      title: '갑자(甲子)일주 - 큰 나무가 물 위에 떠 있는 형상',
      personality: '총명하고 지적 호기심이 왕성합니다. 새로운 것을 배우는 것을 좋아하며, 독창적인 사고방식을 가지고 있습니다. 겉으로는 차분해 보이지만 내면에는 강한 야망과 의지가 있습니다.',
      strengths: '머리가 비상하고 학습능력이 뛰어납니다. 어떤 분야든 빠르게 습득하며, 창의적인 아이디어를 내는 데 능합니다.',
      weaknesses: '지나치게 생각이 많아 행동이 늦어질 수 있습니다. 완벽주의 성향이 있어 스스로를 몰아붙이기도 합니다.',
      love: '지적인 대화가 통하는 사람에게 끌립니다. 감정보다 이성을 앞세우는 경향이 있어 속마음을 잘 드러내지 않습니다.',
      career: '학자, 연구원, IT/기술직, 기획자, 작가, 교육자',
      advice: '생각만 하지 말고 실행에 옮기세요. 때로는 완벽하지 않아도 시작하는 것이 중요합니다.',
    },
    '갑인': {
      title: '갑인(甲寅)일주 - 큰 나무가 숲에서 우뚝 선 형상',
      personality: '리더십이 강하고 당당합니다. 자신감이 넘치며 목표를 향해 곧게 나아갑니다. 정의롭고 불의를 보면 참지 못합니다.',
      strengths: '추진력이 뛰어나고 결단력이 있습니다. 사람들에게 신뢰를 주며 자연스럽게 리더 역할을 맡습니다.',
      weaknesses: '고집이 세고 융통성이 부족할 수 있습니다. 다른 의견을 수용하기 어려울 때가 있습니다.',
      love: '당당하고 자기 주관이 뚜렷한 사람에게 끌립니다. 상대방을 보호하려는 본능이 강합니다.',
      career: 'CEO, 정치인, 군인, 경찰, 변호사, 스포츠 지도자',
      advice: '가끔은 한 발 물러서서 다른 사람의 의견도 들어보세요.',
    },
    '갑진': {
      title: '갑진(甲辰)일주 - 큰 나무가 용의 기운을 받는 형상',
      personality: '야망이 크고 큰 꿈을 품고 있습니다. 변화를 두려워하지 않으며 새로운 도전을 즐깁니다. 자존심이 강하고 목표 달성에 대한 의지가 굳건합니다.',
      strengths: '상상력이 풍부하고 창조적입니다. 위기 상황에서도 침착하게 대처하며, 큰 그림을 볼 줄 압니다.',
      weaknesses: '현실보다 이상에 치우칠 수 있습니다. 자존심이 상하면 쉽게 포기하기도 합니다.',
      love: '자신의 꿈을 이해하고 응원해주는 사람에게 끌립니다. 파트너와 함께 성장하고 싶어합니다.',
      career: '벤처사업가, 예술가, 건축가, 크리에이터, 발명가',
      advice: '꿈을 현실로 만들기 위해 구체적인 계획을 세우세요.',
    },
    '갑오': {
      title: '갑오(甲午)일주 - 나무가 불꽃처럼 타오르는 형상',
      personality: '열정적이고 활동적입니다. 에너지가 넘치며 무엇이든 적극적으로 도전합니다. 표현력이 뛰어나고 사교적입니다.',
      strengths: '밝은 에너지로 주변을 이끕니다. 시작하는 힘이 강하고 새로운 일에 두려움이 없습니다.',
      weaknesses: '열정이 과하면 지치기 쉽습니다. 끈기가 부족하여 마무리가 약할 수 있습니다.',
      love: '열정적이고 활발한 연애를 합니다. 상대방에게 많은 관심과 애정을 표현합니다.',
      career: '연예인, 마케팅, 영업, 스포츠, 이벤트 기획, 교육',
      advice: '시작한 일은 끝까지 마무리하는 습관을 들이세요.',
    },
    '갑신': {
      title: '갑신(甲申)일주 - 나무가 날카로운 도끼를 만난 형상',
      personality: '명석하고 논리적입니다. 비판적 사고를 잘하며 문제의 핵심을 빠르게 파악합니다. 언변이 좋고 설득력이 있습니다.',
      strengths: '분석력과 판단력이 뛰어납니다. 협상과 토론에 능하며 갈등을 조정하는 능력이 있습니다.',
      weaknesses: '지나친 비판으로 관계가 소원해질 수 있습니다. 내면의 갈등이 클 수 있습니다.',
      love: '지적으로 대등한 상대를 원합니다. 논쟁도 소통의 일부라고 생각합니다.',
      career: '변호사, 컨설턴트, 평론가, 기자, 교수, 분석가',
      advice: '비판만 하지 말고 대안도 함께 제시하세요.',
    },
    '갑술': {
      title: '갑술(甲戌)일주 - 나무가 가을 땅에 서 있는 형상',
      personality: '성실하고 책임감이 강합니다. 맡은 일은 끝까지 해내며, 원칙을 중시합니다. 의리 있고 신의를 지킵니다.',
      strengths: '꾸준하고 믿음직합니다. 어떤 상황에서도 흔들리지 않는 중심이 있습니다.',
      weaknesses: '융통성이 부족하고 고집이 셀 수 있습니다. 변화에 적응이 느릴 수 있습니다.',
      love: '한결같은 사랑을 합니다. 오래된 관계를 소중히 여기고 변함없이 헌신합니다.',
      career: '공무원, 교사, 법조인, 회계사, 품질관리',
      advice: '때로는 원칙을 유연하게 적용하는 지혜도 필요합니다.',
    },
    // ===== 을(乙) 일간 =====
    '을축': {
      title: '을축(乙丑)일주 - 작은 나무가 비옥한 땅에 뿌리내린 형상',
      personality: '인내심이 강하고 끈기가 있습니다. 겉으로는 유순해 보이지만 속은 단단합니다. 현실적이고 실용적입니다.',
      strengths: '꾸준히 노력하여 목표를 이룹니다. 재물을 모으는 능력이 있고, 안정적인 삶을 추구합니다.',
      weaknesses: '변화를 두려워하고 익숙한 것에 안주하려는 경향이 있습니다.',
      love: '안정적이고 신뢰할 수 있는 사람을 선호합니다. 한번 정을 주면 변함없이 헌신합니다.',
      career: '금융업, 부동산, 농업, 요식업, 공무원',
      advice: '가끔은 모험도 필요합니다. 새로운 것에 도전하는 용기를 가지세요.',
    },
    '을묘': {
      title: '을묘(乙卯)일주 - 꽃나무가 봄에 활짝 핀 형상',
      personality: '부드럽고 유연하며 사교적입니다. 적응력이 뛰어나고 주변과 조화를 잘 이룹니다. 예술적 감각이 있습니다.',
      strengths: '인맥 관리에 능하고 협력을 잘 이끌어냅니다. 갈등을 부드럽게 해결합니다.',
      weaknesses: '결단력이 부족할 수 있습니다. 남의 눈치를 많이 보기도 합니다.',
      love: '로맨틱하고 감성적인 연애를 합니다. 상대방의 마음을 잘 읽습니다.',
      career: '디자이너, 플로리스트, 상담사, 외교관, 서비스업',
      advice: '자신의 주관을 갖고 표현하는 용기를 기르세요.',
    },
    '을사': {
      title: '을사(乙巳)일주 - 덩굴이 뜨거운 불에 닿은 형상',
      personality: '재치 있고 임기응변에 능합니다. 머리 회전이 빠르고 상황 판단이 정확합니다. 야망이 있고 성취욕이 강합니다.',
      strengths: '변화하는 상황에 빠르게 적응합니다. 사람들의 마음을 읽고 원하는 것을 캐치합니다.',
      weaknesses: '지나치게 계산적으로 보일 수 있습니다. 내면에 불안감이 있을 수 있습니다.',
      love: '상대방에게 헌신하면서도 자신의 목표를 놓지 않습니다.',
      career: '사업가, 마케터, 전략기획, 투자, 방송',
      advice: '진심을 보여주세요. 계산만으로는 깊은 관계를 만들 수 없습니다.',
    },
    '을미': {
      title: '을미(乙未)일주 - 화초가 따뜻한 흙에서 자라는 형상',
      personality: '온화하고 포용력이 있습니다. 사람을 잘 돌보고 세심하게 배려합니다. 가정적이고 평화를 사랑합니다.',
      strengths: '사람들에게 편안함을 줍니다. 갈등을 중재하고 화합을 이끌어냅니다.',
      weaknesses: '우유부단할 수 있습니다. 자신보다 남을 먼저 챙기다 지치기도 합니다.',
      love: '헌신적이고 따뜻한 사랑을 합니다. 가정을 매우 소중히 여깁니다.',
      career: '간호사, 사회복지사, 교사, 요리사, 상담사',
      advice: '자신도 소중히 여기세요. 나를 먼저 채워야 남도 채울 수 있습니다.',
    },
    '을유': {
      title: '을유(乙酉)일주 - 작은 나무가 날카로운 도끼와 함께 있는 형상',
      personality: '섬세하고 예민합니다. 미적 감각이 뛰어나고 완벽주의적 성향이 있습니다. 자기 기준이 명확합니다.',
      strengths: '디테일에 강하고 정교한 일을 잘합니다. 아름다움을 추구합니다.',
      weaknesses: '스스로에게 가혹할 수 있습니다. 남에게도 높은 기준을 요구하기도 합니다.',
      love: '깔끔하고 세련된 사람에게 끌립니다. 상대에게도 높은 기준을 가집니다.',
      career: '디자이너, 주얼리, 미용, 패션, 편집자, 예술가',
      advice: '완벽함보다 과정을 즐기세요.',
    },
    '을해': {
      title: '을해(乙亥)일주 - 연꽃이 물 위에 피어난 형상',
      personality: '순수하고 이상적입니다. 내면이 깊고 정신적인 가치를 중시합니다. 예술적이고 창조적입니다.',
      strengths: '영감이 풍부하고 창의력이 뛰어납니다. 순수한 마음으로 사람들에게 감동을 줍니다.',
      weaknesses: '현실 감각이 부족할 수 있습니다. 세상과 타협하기 어려워합니다.',
      love: '영혼의 교감을 원합니다. 깊고 의미 있는 사랑을 추구합니다.',
      career: '예술가, 작가, 음악가, 종교인, 철학자, 치료사',
      advice: '이상을 현실에서 구현하는 방법을 찾으세요.',
    },
    // ===== 병(丙) 일간 =====
    '병자': {
      title: '병자(丙子)일주 - 태양이 북쪽 물 위에 떠오른 형상',
      personality: '밝고 활발하면서도 내면에 깊이가 있습니다. 겉은 따뜻하지만 속은 냉철합니다. 지적 호기심이 강합니다.',
      strengths: '이성과 감성의 균형이 있습니다. 분석하면서도 직관을 활용합니다.',
      weaknesses: '내면에 갈등이 생기면 혼란스러워집니다. 마음과 생각이 다를 때가 있습니다.',
      love: '열정적이면서도 깊이 있는 관계를 원합니다. 지적 대화와 감정적 교류 모두 중요합니다.',
      career: '연구원, 의사, 심리학자, 방송인, 교수',
      advice: '마음과 머리의 조화를 찾으세요.',
    },
    '병인': {
      title: '병인(丙寅)일주 - 아침 해가 동쪽 숲에서 떠오르는 형상',
      personality: '활기차고 희망적입니다. 새로운 시작에 강하고 도전정신이 넘칩니다. 리더십과 카리스마가 있습니다.',
      strengths: '주변에 활력을 불어넣습니다. 선구자 역할을 하며 새로운 길을 개척합니다.',
      weaknesses: '성급하고 참을성이 부족할 수 있습니다. 시작은 좋으나 마무리가 약할 수 있습니다.',
      love: '적극적이고 주도적으로 연애합니다. 상대를 이끌고 싶어합니다.',
      career: 'CEO, 정치인, 방송인, 스포츠, 사업가',
      advice: '시작한 일을 끝까지 책임지는 모습을 보여주세요.',
    },
    '병진': {
      title: '병진(丙辰)일주 - 태양이 구름 위로 솟아오른 형상',
      personality: '야망이 크고 자신감이 넘칩니다. 큰 무대에서 빛나고 싶어하며, 인정받고자 하는 욕구가 강합니다.',
      strengths: '대범하고 배짱이 있습니다. 무대 위에서 빛나는 재능이 있습니다.',
      weaknesses: '자만심에 빠지기 쉽습니다. 작은 일은 소홀히 할 수 있습니다.',
      love: '자신을 존경하고 추켜세워주는 사람에게 끌립니다.',
      career: '연예인, 정치인, 경영자, 교수, 강사',
      advice: '겸손을 배우세요. 높이 올라갈수록 낮은 자세가 필요합니다.',
    },
    '병오': {
      title: '병오(丙午)일주 - 태양이 중천에 뜬 가장 밝은 형상',
      personality: '밝고 열정적이며 주변을 환하게 만드는 에너지가 있습니다. 자신감이 넘치고 표현력이 뛰어납니다.',
      strengths: '카리스마가 있고 사람들을 끌어당기는 매력이 있습니다. 연설, 공연, 발표에서 두각을 나타냅니다.',
      weaknesses: '자기중심적이 될 수 있고, 급한 성격 때문에 충동적인 결정을 내리기도 합니다.',
      love: '연애에 적극적이고 열정적입니다. 자신을 인정해주는 사람에게 끌립니다.',
      career: '연예인, 아나운서, 정치인, 영업직, 강사, 이벤트 기획자',
      advice: '가끔은 조명을 끄고 쉬어가세요. 지나친 열정은 번아웃을 불러올 수 있습니다.',
    },
    '병신': {
      title: '병신(丙申)일주 - 태양이 서쪽으로 기우는 형상',
      personality: '밝으면서도 날카롭습니다. 직관과 논리를 함께 갖추고 있으며, 비판적 사고력이 뛰어납니다.',
      strengths: '복잡한 문제를 빠르게 분석합니다. 말솜씨가 좋고 설득력이 있습니다.',
      weaknesses: '너무 날카로워서 사람들에게 상처를 줄 수 있습니다.',
      love: '언어로 사랑을 표현합니다. 대화가 통하는 사람을 원합니다.',
      career: '변호사, 컨설턴트, 아나운서, 기자, MC',
      advice: '따뜻한 말 한마디가 날카로운 비판보다 효과적일 때가 있습니다.',
    },
    '병술': {
      title: '병술(丙戌)일주 - 저녁노을이 지는 형상',
      personality: '따뜻하고 포근합니다. 가정적이며 안정을 추구합니다. 책임감이 강하고 의리가 있습니다.',
      strengths: '사람들에게 안정감을 줍니다. 끝까지 책임지는 모습이 신뢰를 줍니다.',
      weaknesses: '변화를 두려워하고 보수적일 수 있습니다.',
      love: '가정을 소중히 여기고 헌신적입니다. 안정적인 관계를 원합니다.',
      career: '교사, 공무원, 사회복지사, 요리사, 부동산',
      advice: '새로운 변화도 받아들이는 유연함을 가지세요.',
    },
    // ===== 정(丁) 일간 =====
    '정축': {
      title: '정축(丁丑)일주 - 작은 불꽃이 땅에서 타오르는 형상',
      personality: '섬세하고 끈기가 있습니다. 작은 일에도 정성을 다하며, 한 분야를 깊이 파고드는 집중력이 있습니다.',
      strengths: '꼼꼼하고 세밀한 작업에 강합니다. 오랫동안 집중하는 인내심이 있습니다.',
      weaknesses: '시야가 좁아질 수 있습니다. 융통성이 부족할 때가 있습니다.',
      love: '조용하지만 깊은 사랑을 합니다. 표현은 서툴지만 마음은 깊습니다.',
      career: '연구원, 기술자, 장인, 세공사, 요리사',
      advice: '가끔은 큰 그림도 보세요.',
    },
    '정묘': {
      title: '정묘(丁卯)일주 - 촛불이 봄꽃 사이에 빛나는 형상',
      personality: '따뜻하고 감성적입니다. 예술적 감각이 뛰어나고 아름다움을 추구합니다. 부드러운 카리스마가 있습니다.',
      strengths: '사람들의 마음을 움직이는 힘이 있습니다. 창조적이고 예술적입니다.',
      weaknesses: '감정적으로 흔들리기 쉽습니다. 현실적인 문제에 약할 수 있습니다.',
      love: '로맨틱하고 헌신적입니다. 사랑에 빠지면 모든 것을 바칩니다.',
      career: '예술가, 디자이너, 뮤지션, 작가, 상담사',
      advice: '감정에 휘둘리지 않는 객관성도 필요합니다.',
    },
    '정사': {
      title: '정사(丁巳)일주 - 화염이 더욱 뜨거워진 형상',
      personality: '열정적이고 야망이 있습니다. 목표를 향해 불타는 의지가 있으며, 자기 확신이 강합니다.',
      strengths: '에너지가 넘치고 추진력이 있습니다. 어려운 상황에서도 포기하지 않습니다.',
      weaknesses: '지나치게 뜨거워서 주변을 불편하게 할 수 있습니다. 급한 성격입니다.',
      love: '열정적이고 강렬한 사랑을 합니다. 질투심이 강할 수 있습니다.',
      career: '사업가, 예술가, 정치인, 홍보, 마케팅',
      advice: '열정을 조절하는 법을 배우세요.',
    },
    '정미': {
      title: '정미(丁未)일주 - 촛불이 따뜻한 흙에서 빛나는 형상',
      personality: '온화하고 가정적입니다. 사람들을 보살피는 것을 좋아하며, 안정적인 환경을 추구합니다.',
      strengths: '배려심이 깊고 포용력이 있습니다. 가정을 잘 돌봅니다.',
      weaknesses: '자신보다 남을 먼저 챙기다 지칩니다. 결단력이 부족할 수 있습니다.',
      love: '헌신적이고 따뜻한 사랑을 합니다. 가정을 최우선으로 생각합니다.',
      career: '요리사, 교사, 간호사, 상담사, 사회복지사',
      advice: '자신의 필요도 챙기세요.',
    },
    '정유': {
      title: '정유(丁酉)일주 - 촛불이 금속에 비치는 형상',
      personality: '섬세하고 예리합니다. 아름다움에 대한 안목이 있으며, 완벽을 추구합니다. 지적이고 분석적입니다.',
      strengths: '미적 감각이 뛰어나고 디테일에 강합니다. 논리적 사고력이 있습니다.',
      weaknesses: '비판적이고 까다로울 수 있습니다. 자신에게도 타인에게도 엄격합니다.',
      love: '세련되고 지적인 사람에게 끌립니다. 외모와 내면 모두 중요합니다.',
      career: '디자이너, 예술가, 평론가, 편집자, 주얼리',
      advice: '완벽함보다 따뜻함을 선택할 때도 있습니다.',
    },
    '정해': {
      title: '정해(丁亥)일주 - 촛불이 깊은 물 위에 비치는 형상',
      personality: '감성적이고 직관력이 뛰어납니다. 예술적 감각이 있으며, 내면이 깊고 복잡합니다.',
      strengths: '창의력과 상상력이 풍부합니다. 사람의 마음을 읽는 능력이 있어 상담이나 치유 분야에 재능이 있습니다.',
      weaknesses: '감정 기복이 있을 수 있고, 현실보다 이상에 빠지기 쉽습니다.',
      love: '영적으로 교감할 수 있는 사람을 찾습니다. 깊은 사랑을 추구합니다.',
      career: '예술가, 작가, 심리상담사, 치료사, 종교인, 철학자',
      advice: '현실에도 발을 딛고 계세요. 이상과 현실의 균형이 중요합니다.',
    },
    // ===== 무(戊) 일간 =====
    '무자': {
      title: '무자(戊子)일주 - 큰 산 아래 깊은 물이 흐르는 형상',
      personality: '듬직하면서도 지혜롭습니다. 겉은 묵직하지만 속은 깊은 생각으로 가득합니다. 현실적이면서도 통찰력이 있습니다.',
      strengths: '안정감을 주면서도 전략적입니다. 큰 그림을 그리며 차근차근 나아갑니다.',
      weaknesses: '행동이 느릴 수 있습니다. 지나치게 신중해서 기회를 놓치기도 합니다.',
      love: '안정적이고 지적인 사람에게 끌립니다. 깊은 대화를 즐깁니다.',
      career: '투자, 부동산, 전략기획, 경영, 연구',
      advice: '때로는 직관을 믿고 빠르게 움직이세요.',
    },
    '무인': {
      title: '무인(戊寅)일주 - 큰 산에 나무가 우거진 형상',
      personality: '포용력이 크고 듬직합니다. 사람을 품는 능력이 있으며, 자연스러운 리더십이 있습니다.',
      strengths: '사람들에게 신뢰를 줍니다. 조직을 이끌고 키우는 능력이 있습니다.',
      weaknesses: '고집이 세고 움직임이 느릴 수 있습니다.',
      love: '파트너를 든든히 지켜주고 싶어합니다. 가장 역할에 충실합니다.',
      career: '경영자, 교육자, 정치인, 부동산, 농업',
      advice: '변화에 유연하게 대처하세요.',
    },
    '무진': {
      title: '무진(戊辰)일주 - 큰 산이 용과 함께하는 형상',
      personality: '듬직하고 포용력이 넓습니다. 큰 그릇을 가졌으며, 야망이 크고 큰일을 도모합니다.',
      strengths: '배짱이 있고 대범합니다. 큰 사업이나 프로젝트를 이끌 수 있는 능력이 있습니다.',
      weaknesses: '고집이 세고 자만심에 빠지기 쉽습니다. 세부적인 것을 놓치기도 합니다.',
      love: '자신을 존경하고 따라주는 사람에게 끌립니다. 가장 역할을 충실히 합니다.',
      career: '기업 경영, 정치, 건설업, 부동산 개발, 투자업',
      advice: '작은 것도 소중히 여기세요. 디테일이 성공을 좌우할 때가 있습니다.',
    },
    '무오': {
      title: '무오(戊午)일주 - 큰 산에서 불이 타오르는 형상',
      personality: '듬직하면서도 열정이 있습니다. 무게감 있게 일을 추진하며, 따뜻한 카리스마가 있습니다.',
      strengths: '신뢰를 주면서도 활력이 있습니다. 사람들을 모으고 이끄는 능력이 있습니다.',
      weaknesses: '완고하고 고집이 셀 수 있습니다. 열정이 과하면 무리하기도 합니다.',
      love: '든든하면서도 따뜻한 사랑을 합니다. 가정을 소중히 여깁니다.',
      career: '경영, 교육, 종교, 정치, 부동산',
      advice: '가끔은 쉬어가세요.',
    },
    '무신': {
      title: '무신(戊申)일주 - 큰 산에 날카로운 바위가 있는 형상',
      personality: '실용적이고 효율을 추구합니다. 불필요한 것을 정리하고 핵심에 집중합니다.',
      strengths: '판단력이 빠르고 정확합니다. 문제 해결 능력이 뛰어납니다.',
      weaknesses: '차갑게 느껴질 수 있습니다. 감정보다 효율을 앞세웁니다.',
      love: '현실적이고 합리적인 사람을 원합니다.',
      career: '엔지니어, 건축, 금융, 컨설팅',
      advice: '효율만큼 따뜻함도 중요합니다.',
    },
    '무술': {
      title: '무술(戊戌)일주 - 두 개의 산이 겹친 형상',
      personality: '묵직하고 변하지 않습니다. 한번 정한 것은 쉽게 바꾸지 않으며, 원칙을 중시합니다.',
      strengths: '신뢰감을 줍니다. 흔들리지 않는 중심이 있습니다.',
      weaknesses: '너무 고집스럽고 융통성이 없을 수 있습니다.',
      love: '변함없는 사랑을 합니다. 오래된 관계를 소중히 여깁니다.',
      career: '부동산, 건설, 공무원, 법조, 농업',
      advice: '때로는 변화도 필요합니다.',
    },
    // ===== 기(己) 일간 =====
    '기축': {
      title: '기축(己丑)일주 - 비옥한 논밭의 형상',
      personality: '성실하고 꾸준합니다. 묵묵히 일하며 성과를 쌓아갑니다. 현실적이고 실용적입니다.',
      strengths: '인내심이 강하고 끈기가 있습니다. 재물을 모으는 능력이 있습니다.',
      weaknesses: '융통성이 부족하고 변화를 싫어합니다.',
      love: '안정적이고 헌신적입니다. 가정을 잘 돌봅니다.',
      career: '금융, 부동산, 농업, 요식업, 회계',
      advice: '가끔은 새로운 것에 도전하세요.',
    },
    '기묘': {
      title: '기묘(己卯)일주 - 화단에 꽃이 핀 형상',
      personality: '부드럽고 섬세합니다. 예술적 감각이 있으며, 아름다움을 가꾸는 것을 좋아합니다.',
      strengths: '미적 감각이 뛰어나고 세심합니다. 사람을 편하게 해줍니다.',
      weaknesses: '결단력이 부족할 수 있습니다. 우유부단할 때가 있습니다.',
      love: '상대방을 잘 돌봅니다. 헌신적이고 따뜻합니다.',
      career: '플로리스트, 인테리어, 요리, 미용, 서비스업',
      advice: '자신의 의견도 분명히 표현하세요.',
    },
    '기사': {
      title: '기사(己巳)일주 - 뜨거운 모래밭의 형상',
      personality: '머리 회전이 빠르고 재치가 있습니다. 상황 판단이 빠르며 적응력이 뛰어납니다.',
      strengths: '임기응변에 능하고 말솜씨가 좋습니다. 사람들과 잘 어울립니다.',
      weaknesses: '지나치게 계산적으로 보일 수 있습니다.',
      love: '똑똑하고 센스 있는 사람에게 끌립니다.',
      career: '영업, 마케팅, 홍보, 방송, 서비스업',
      advice: '진심도 함께 보여주세요.',
    },
    '기미': {
      title: '기미(己未)일주 - 넓은 들판의 형상',
      personality: '온화하고 포용력이 있습니다. 사람을 잘 돌보고 편안하게 해줍니다.',
      strengths: '배려심이 깊고 인내심이 강합니다. 갈등을 중재합니다.',
      weaknesses: '우유부단하고 자기주장이 약할 수 있습니다.',
      love: '헌신적이고 가정적입니다.',
      career: '교사, 상담사, 사회복지, 요식업',
      advice: '자신의 주장도 당당히 하세요.',
    },
    '기유': {
      title: '기유(己酉)일주 - 흙 속의 금광석 형상',
      personality: '섬세하고 예리합니다. 가치 있는 것을 알아보는 안목이 있습니다.',
      strengths: '분석력이 뛰어나고 미적 감각이 있습니다.',
      weaknesses: '비판적이고 까다로울 수 있습니다.',
      love: '세련되고 가치관이 맞는 사람을 원합니다.',
      career: '감정, 주얼리, 디자인, 금융, 예술',
      advice: '비판보다 칭찬을 먼저 하세요.',
    },
    '기해': {
      title: '기해(己亥)일주 - 논밭에 물이 가득한 형상',
      personality: '생각이 깊고 지혜롭습니다. 현실적이면서도 통찰력이 있습니다.',
      strengths: '지혜와 현실감각이 조화됩니다. 장기적인 관점을 가집니다.',
      weaknesses: '생각이 많아 행동이 늦을 수 있습니다.',
      love: '깊은 대화를 나눌 수 있는 사람을 원합니다.',
      career: '연구, 기획, 농업, 교육',
      advice: '생각을 행동으로 옮기세요.',
    },
    // ===== 경(庚) 일간 =====
    '경자': {
      title: '경자(庚子)일주 - 날카로운 칼이 물에 담긴 형상',
      personality: '날카로우면서도 냉철합니다. 분석력이 뛰어나고 판단이 빠릅니다.',
      strengths: '논리적이고 객관적입니다. 복잡한 문제를 빠르게 해결합니다.',
      weaknesses: '차갑게 느껴질 수 있습니다. 감정 표현이 서툽니다.',
      love: '지적인 대화가 통하는 사람에게 끌립니다.',
      career: '법조, 금융, IT, 분석, 전략',
      advice: '따뜻함도 함께 보여주세요.',
    },
    '경인': {
      title: '경인(庚寅)일주 - 도끼가 나무를 만난 형상',
      personality: '강인하고 결단력이 있습니다. 목표를 향해 곧게 나아갑니다.',
      strengths: '추진력이 뛰어나고 불굴의 의지가 있습니다.',
      weaknesses: '무리하게 밀어붙일 수 있습니다. 갈등이 생기기 쉽습니다.',
      love: '강한 사람끼리 끌립니다. 서로 자극이 되는 관계를 원합니다.',
      career: '군인, 경찰, 외과의, 기계, 스포츠',
      advice: '부드러움도 힘입니다.',
    },
    '경진': {
      title: '경진(庚辰)일주 - 광산에서 보석이 나온 형상',
      personality: '야망이 크고 성취욕이 강합니다. 큰 성공을 꿈꿉니다.',
      strengths: '결단력과 추진력이 있습니다. 위기에 강합니다.',
      weaknesses: '조급해질 수 있습니다. 과정보다 결과에 집착하기도 합니다.',
      love: '성공한 사람, 야망이 있는 사람에게 끌립니다.',
      career: '사업가, 정치인, 금융, 투자',
      advice: '과정도 즐기세요.',
    },
    '경오': {
      title: '경오(庚午)일주 - 불에 달궈진 쇠의 형상',
      personality: '열정적이면서도 강합니다. 정의롭고 불의를 참지 못합니다.',
      strengths: '뜨거운 정의감이 있습니다. 카리스마 있는 리더십이 있습니다.',
      weaknesses: '급하고 공격적일 수 있습니다. 충동적인 결정을 내리기도 합니다.',
      love: '열정적이고 강렬한 사랑을 합니다.',
      career: '군인, 경찰, 운동선수, 정치인',
      advice: '분노를 다스리는 법을 배우세요.',
    },
    '경신': {
      title: '경신(庚申)일주 - 쇠가 쇠를 만나 날카롭게 빛나는 형상',
      personality: '결단력이 있고 실행력이 뛰어납니다. 정의롭고 불의와 타협하지 않습니다.',
      strengths: '빠른 판단력과 결단력이 장점입니다. 복잡한 상황을 깔끔하게 정리합니다.',
      weaknesses: '날카로워서 주변 사람들에게 상처를 줄 수 있습니다. 융통성이 부족합니다.',
      love: '상대방에게도 명확한 기준을 요구합니다. 솔직하고 직접적인 표현을 합니다.',
      career: '법조인, 외과의사, 군인, 경찰, 운동선수, 기계공학자',
      advice: '때로는 부드러움도 힘입니다. 강함만이 정답이 아닙니다.',
    },
    '경술': {
      title: '경술(庚戌)일주 - 가을 땅에 쇠가 묻힌 형상',
      personality: '원칙적이고 책임감이 강합니다. 한번 결정하면 끝까지 밀어붙입니다.',
      strengths: '신뢰할 수 있고 일관성이 있습니다.',
      weaknesses: '융통성이 없고 완고합니다.',
      love: '믿음직하고 책임감 있는 사람을 원합니다.',
      career: '법조, 경찰, 군인, 공무원',
      advice: '때로는 유연함도 필요합니다.',
    },
    // ===== 신(辛) 일간 =====
    '신축': {
      title: '신축(辛丑)일주 - 보석이 땅에 묻힌 형상',
      personality: '인내심이 강하고 가치를 알아봅니다. 끈기 있게 목표를 향해 나아갑니다.',
      strengths: '꾸준하고 성실합니다. 재물을 모으는 능력이 있습니다.',
      weaknesses: '완고하고 변화를 싫어합니다.',
      love: '안정적이고 신뢰할 수 있는 관계를 원합니다.',
      career: '금융, 보석, 감정, 부동산',
      advice: '변화도 가치가 있습니다.',
    },
    '신묘': {
      title: '신묘(辛卯)일주 - 보석이 나무 사이에 있는 형상',
      personality: '섬세하고 예술적입니다. 아름다움을 추구하며, 센스가 있습니다.',
      strengths: '미적 감각이 뛰어나고 창조적입니다.',
      weaknesses: '예민하고 상처받기 쉽습니다.',
      love: '세련되고 감성적인 사람에게 끌립니다.',
      career: '디자이너, 예술가, 뮤지션, 패션',
      advice: '마음을 단단하게 하세요.',
    },
    '신사': {
      title: '신사(辛巳)일주 - 보석이 불에 빛나는 형상',
      personality: '빛나고 싶은 욕구가 강합니다. 인정받고자 하며, 섬세하면서도 야망이 있습니다.',
      strengths: '눈에 띄는 재능이 있습니다. 빛나는 자리에서 능력을 발휘합니다.',
      weaknesses: '질투와 경쟁심이 강할 수 있습니다.',
      love: '자신을 빛나게 해주는 사람에게 끌립니다.',
      career: '연예인, 디자이너, 주얼리, 패션',
      advice: '다른 사람의 빛도 인정하세요.',
    },
    '신미': {
      title: '신미(辛未)일주 - 흙 속의 옥돌 형상',
      personality: '온화하면서도 내면에 가치를 품고 있습니다. 겸손하지만 능력이 있습니다.',
      strengths: '진정한 가치를 알아보는 눈이 있습니다.',
      weaknesses: '자신을 드러내는 것을 꺼립니다.',
      love: '진심을 알아주는 사람을 원합니다.',
      career: '감정, 예술, 교육, 상담',
      advice: '자신의 가치를 당당히 드러내세요.',
    },
    '신유': {
      title: '신유(辛酉)일주 - 보석이 빛나는 형상',
      personality: '예리하고 완벽주의적입니다. 높은 기준을 가지고 있으며, 섬세합니다.',
      strengths: '미적 감각이 뛰어나고 정교한 일을 잘합니다.',
      weaknesses: '까다롭고 비판적입니다. 자신에게도 엄격합니다.',
      love: '완벽에 가까운 사람을 찾습니다.',
      career: '주얼리, 디자인, 예술, 비평, 편집',
      advice: '불완전함도 아름다울 수 있습니다.',
    },
    '신해': {
      title: '신해(辛亥)일주 - 보석이 물에 잠긴 형상',
      personality: '감성적이고 지혜롭습니다. 아름다움과 지혜를 함께 추구합니다.',
      strengths: '직관력이 뛰어나고 예술적 감각이 있습니다.',
      weaknesses: '감정에 휩쓸리기 쉽습니다.',
      love: '깊은 감성적 교류를 원합니다.',
      career: '예술가, 작가, 상담사, 철학자',
      advice: '현실에도 발을 딛으세요.',
    },
    // ===== 임(壬) 일간 =====
    '임자': {
      title: '임자(壬子)일주 - 큰 바다가 깊이를 더하는 형상',
      personality: '지혜롭고 통찰력이 뛰어납니다. 겉으로는 고요하지만 내면에는 깊은 생각이 흐릅니다.',
      strengths: '분석력과 판단력이 뛰어납니다. 감정에 휘둘리지 않고 이성적으로 대처합니다.',
      weaknesses: '냉정해 보여서 거리감을 느끼게 할 수 있습니다. 감정 표현이 서툽니다.',
      love: '지적인 대화를 나눌 수 있는 사람에게 끌립니다. 깊고 진지한 관계를 추구합니다.',
      career: '학자, 연구원, 철학자, 전략가, 투자분석가',
      advice: '가끔은 머리보다 마음의 소리를 들어보세요.',
    },
    '임인': {
      title: '임인(壬寅)일주 - 물이 나무를 키우는 형상',
      personality: '지혜로우면서도 진취적입니다. 새로운 것을 배우고 성장시키는 것을 좋아합니다.',
      strengths: '사람과 조직을 키우는 능력이 있습니다. 배움에 대한 열정이 있습니다.',
      weaknesses: '지나치게 이상적일 수 있습니다.',
      love: '함께 성장할 수 있는 관계를 원합니다.',
      career: '교육, 연구, 투자, 멘토링',
      advice: '이상과 현실의 균형을 찾으세요.',
    },
    '임진': {
      title: '임진(壬辰)일주 - 용이 물을 만난 형상',
      personality: '야망이 크고 큰 꿈을 품고 있습니다. 변화무쌍하며 잠재력이 큽니다.',
      strengths: '기회를 잘 포착하고 큰일을 도모합니다.',
      weaknesses: '변덕스럽고 예측하기 어렵습니다.',
      love: '자신의 꿈을 이해해주는 사람을 원합니다.',
      career: '사업가, 투자, 정치, 예술',
      advice: '꾸준함도 성공의 열쇠입니다.',
    },
    '임오': {
      title: '임오(壬午)일주 - 물과 불이 만난 형상',
      personality: '내면에 갈등이 있지만 그것이 창조적 에너지가 됩니다. 복잡하고 다층적입니다.',
      strengths: '다양한 감정과 생각을 활용합니다. 창조적입니다.',
      weaknesses: '마음이 안정되지 않을 수 있습니다.',
      love: '복잡한 내면을 이해해주는 사람이 필요합니다.',
      career: '예술, 창작, 상담, 치유',
      advice: '내면의 갈등을 창작으로 승화하세요.',
    },
    '임신': {
      title: '임신(壬申)일주 - 물이 금속을 만난 형상',
      personality: '지혜롭고 언변이 좋습니다. 논리적이면서도 유연합니다.',
      strengths: '설득력이 있고 협상에 능합니다.',
      weaknesses: '말이 너무 많을 수 있습니다.',
      love: '대화가 잘 통하는 사람을 원합니다.',
      career: '외교, 컨설팅, 언론, 교육',
      advice: '말보다 행동으로 보여주세요.',
    },
    '임술': {
      title: '임술(壬戌)일주 - 물이 땅에 스며드는 형상',
      personality: '깊이 있고 신중합니다. 한번 결정하면 쉽게 바꾸지 않습니다.',
      strengths: '끈기와 인내심이 있습니다.',
      weaknesses: '고집이 세고 느립니다.',
      love: '안정적이고 믿을 수 있는 관계를 원합니다.',
      career: '연구, 농업, 부동산, 장기투자',
      advice: '때로는 유연함도 필요합니다.',
    },
    // ===== 계(癸) 일간 =====
    '계축': {
      title: '계축(癸丑)일주 - 이슬이 땅에 스며든 형상',
      personality: '섬세하고 인내심이 강합니다. 조용히 실력을 쌓아갑니다.',
      strengths: '꾸준하고 성실합니다. 집중력이 뛰어납니다.',
      weaknesses: '소극적이고 표현이 서툽니다.',
      love: '조용하지만 깊은 사랑을 합니다.',
      career: '연구, 기술, 농업, 세공',
      advice: '자신을 더 표현하세요.',
    },
    '계묘': {
      title: '계묘(癸卯)일주 - 이슬이 꽃잎에 맺힌 형상',
      personality: '감성적이고 섬세합니다. 예술적 감각이 뛰어나고 아름다움을 사랑합니다.',
      strengths: '창의력이 풍부하고 감수성이 깊습니다.',
      weaknesses: '현실적인 면이 부족할 수 있습니다.',
      love: '로맨틱하고 감성적인 사랑을 합니다.',
      career: '예술가, 작가, 디자이너, 뮤지션',
      advice: '현실 감각도 키우세요.',
    },
    '계사': {
      title: '계사(癸巳)일주 - 물이 불 옆에 있는 형상',
      personality: '지혜롭고 영민합니다. 상황 판단이 빠르고 임기응변에 능합니다.',
      strengths: '머리 회전이 빠르고 센스가 있습니다.',
      weaknesses: '내면에 갈등이 있을 수 있습니다.',
      love: '똑똑하고 센스 있는 사람에게 끌립니다.',
      career: '기획, 마케팅, 컨설팅, 투자',
      advice: '마음의 평화도 중요합니다.',
    },
    '계미': {
      title: '계미(癸未)일주 - 이슬이 따뜻한 흙에 스며든 형상',
      personality: '온화하고 배려심이 깊습니다. 사람을 돌보는 것을 좋아합니다.',
      strengths: '포용력이 있고 세심합니다.',
      weaknesses: '자신보다 남을 먼저 챙기다 지칩니다.',
      love: '헌신적이고 따뜻한 사랑을 합니다.',
      career: '간호, 상담, 교육, 복지',
      advice: '자신도 소중히 여기세요.',
    },
    '계유': {
      title: '계유(癸酉)일주 - 이슬이 금속에 맺힌 형상',
      personality: '섬세하고 예리합니다. 미적 감각이 뛰어나고 완벽을 추구합니다.',
      strengths: '정교한 일을 잘하고 안목이 있습니다.',
      weaknesses: '비판적이고 까다롭습니다.',
      love: '세련되고 품격 있는 사람을 원합니다.',
      career: '디자인, 주얼리, 예술, 편집',
      advice: '완벽함을 내려놓으면 편해집니다.',
    },
    '계해': {
      title: '계해(癸亥)일주 - 작은 물이 큰 바다에 합쳐진 형상',
      personality: '깊고 넓은 내면을 가졌습니다. 지혜롭고 통찰력이 뛰어납니다.',
      strengths: '직관력이 뛰어나고 깊이 생각합니다.',
      weaknesses: '현실에서 멀어지기 쉽습니다.',
      love: '영혼의 교류를 원합니다.',
      career: '철학, 예술, 종교, 치유, 상담',
      advice: '현실에도 발을 딛고 계세요.',
    },
  };

  // 기본 일주 해석 (나머지 일주)
  const elementPersonality: Record<Element, string> = {
    wood: '성장하고 발전하려는 욕구가 강합니다. 새로운 시작을 좋아하며 진취적입니다.',
    fire: '열정적이고 활발합니다. 주변을 밝게 만들고 에너지가 넘칩니다.',
    earth: '안정적이고 신뢰감을 줍니다. 현실적이며 실용적인 사고를 합니다.',
    metal: '원칙을 중시하고 결단력이 있습니다. 공정하고 정의를 추구합니다.',
    water: '지혜롭고 적응력이 뛰어납니다. 깊이 생각하고 통찰력이 있습니다.',
  };

  const element = dayMasterInfo.element as Element;
  const yinYangTrait = dayMasterInfo.yinYang === 'yang' ? '적극적이고 외향적인 성향도 가지고 있습니다.' : '신중하고 내면이 깊은 성향도 가지고 있습니다.';

  const strengthsByElement: Record<Element, string> = {
    wood: '추진력, 성장 욕구, 정의로움, 리더십',
    fire: '열정, 표현력, 카리스마, 사교성',
    earth: '안정감, 신뢰, 현실감각, 포용력',
    metal: '결단력, 정확함, 원칙, 실행력',
    water: '지혜, 적응력, 통찰력, 유연함',
  };

  const weaknessesByElement: Record<Element, string> = {
    wood: '고집, 융통성 부족, 급한 성격',
    fire: '충동적, 쉽게 지침, 주목받고 싶은 욕구',
    earth: '변화 두려움, 우유부단, 고지식함',
    metal: '냉정함, 완고함, 융통성 부족',
    water: '우유부단, 감정적 기복, 현실 도피',
  };

  const loveByElement: Record<Element, string> = {
    wood: '함께 성장해나갈 수 있는 관계를 추구합니다.',
    fire: '열정을 함께 나눌 수 있는 사람을 원합니다.',
    earth: '안정적이고 믿을 수 있는 사람을 선호합니다.',
    metal: '원칙과 기준이 맞는 사람을 찾습니다.',
    water: '지적 교감이 되는 사람에게 끌립니다.',
  };

  const careerByElement: Record<Element, string> = {
    wood: '교육, 의료, 환경, 스타트업, 건축, 법조계',
    fire: '연예, 마케팅, 영업, 요식업, 패션, 이벤트',
    earth: '부동산, 금융, 농업, 건설, 공무원, 회계',
    metal: '법조계, 금융, 제조업, 의료(외과), 엔지니어링',
    water: '연구, IT, 유통, 무역, 상담, 철학',
  };

  const adviceByElement: Record<Element, string> = {
    wood: '꺾이지 않는 것도 좋지만, 때로는 유연하게 휘어지는 것이 더 강합니다.',
    fire: '열정을 태우되 자신을 불사르지 마세요. 쉬어가는 것도 중요합니다.',
    earth: '안전지대에서 벗어나는 용기가 필요합니다.',
    metal: '강함과 부드러움의 균형을 찾으세요.',
    water: '흐르는 물처럼 유연하되, 목표는 잃지 마세요.',
  };

  const defaultInterpretation = {
    title: `${ilju}(${getStemHanja(dayMaster)}${getBranchHanja(dayBranch)})일주`,
    hanja: `${getStemHanja(dayMaster)}${getBranchHanja(dayBranch)}`,
    personality: `${elementPersonality[element]} ${yinYangTrait}`,
    strengths: strengthsByElement[element] || '',
    weaknesses: weaknessesByElement[element] || '',
    love: loveByElement[element] || '',
    career: careerByElement[element] || '',
    advice: adviceByElement[element] || '',
  };

  return iljuInterpretations[ilju] || defaultInterpretation;
}

// 연애/결혼운 상세 분석
function analyzeLoveAndMarriage(sajuResult: any, profile: any) {
  const { tenGods, dayMaster, dayMasterInfo, pillars } = sajuResult;
  const isMale = profile?.gender === 'male';

  // 배우자성 찾기
  const spouseStar = isMale
    ? (tenGods.year === '정재' || tenGods.month === '정재' || tenGods.hour === '정재' ? '정재' :
       tenGods.year === '편재' || tenGods.month === '편재' || tenGods.hour === '편재' ? '편재' : null)
    : (tenGods.year === '정관' || tenGods.month === '정관' || tenGods.hour === '정관' ? '정관' :
       tenGods.year === '편관' || tenGods.month === '편관' || tenGods.hour === '편관' ? '편관' : null);

  // 일지(배우자궁) 분석
  const spousePalace = pillars.day.branch;
  const spousePalaceInfo = EARTHLY_BRANCHES.find(b => b.korean === spousePalace);

  // 연애 스타일
  const loveStyleByDayMaster: Record<string, { style: string; idealType: string; warning: string }> = {
    '갑': {
      style: '연애에서도 리더 역할을 하려 합니다. 상대방을 이끌고 보호하려는 본능이 강합니다.',
      idealType: '리더십을 인정하면서도 지적으로 대등한 대화가 가능한 사람',
      warning: '너무 주도적이면 상대방이 숨 막힐 수 있어요.',
    },
    '을': {
      style: '부드럽게 상대에게 다가가고 적응력이 뛰어납니다.',
      idealType: '든든하게 지켜줄 수 있는 안정적인 사람',
      warning: '지나치게 맞추다 보면 자신을 잃을 수 있어요.',
    },
    '병': {
      style: '열정적이고 적극적입니다. 사랑에 빠지면 모든 것을 바칩니다.',
      idealType: '열정을 받아줄 수 있는 넓은 그릇을 가진 사람',
      warning: '불같은 사랑이 식으면 급격히 식을 수 있어요.',
    },
    '정': {
      style: '섬세하고 따뜻하게 상대를 배려합니다.',
      idealType: '섬세함을 알아주고 감성적 교감이 되는 사람',
      warning: '속마음을 잘 표현하지 않으면 오해가 생길 수 있어요.',
    },
    '무': {
      style: '안정적이고 든든합니다. 변함없이 사랑합니다.',
      idealType: '자신을 의지하고 가정적인 가치를 공유하는 사람',
      warning: '너무 무덤덤하면 사랑받지 못한다고 느낄 수 있어요.',
    },
    '기': {
      style: '헌신적이고 포용력이 있습니다.',
      idealType: '헌신에 감사할 줄 아는 따뜻한 사람',
      warning: '지나친 헌신은 관계의 균형을 깨뜨릴 수 있어요.',
    },
    '경': {
      style: '직진적이고 솔직합니다.',
      idealType: '솔직함을 받아줄 수 있는 단단한 성격의 사람',
      warning: '너무 직설적이면 상처를 줄 수 있어요.',
    },
    '신': {
      style: '섬세하고 까다롭습니다.',
      idealType: '품격이 있고 세련된 사람',
      warning: '너무 까다로우면 인연을 놓칠 수 있어요.',
    },
    '임': {
      style: '깊고 넓은 사랑을 합니다.',
      idealType: '지적이고 대화가 통하는 사람',
      warning: '감정 표현이 서툴러 보일 수 있어요.',
    },
    '계': {
      style: '감성적이고 낭만적입니다.',
      idealType: '감성을 이해하고 함께 느낄 수 있는 사람',
      warning: '감정 기복이 있을 수 있어요.',
    },
  };

  const loveStyle = loveStyleByDayMaster[dayMaster] || {
    style: '자신만의 독특한 연애 스타일을 가지고 있습니다.',
    idealType: '자신을 있는 그대로 이해해주는 사람',
    warning: '서로의 다름을 인정하고 존중하는 것이 중요합니다.',
  };

  // 배우자 유형
  let spouseType = '';
  if (spousePalaceInfo) {
    const elementSpouse: Record<string, string> = {
      wood: '성장 지향적이고 진취적인 배우자를 만날 가능성이 높습니다.',
      fire: '열정적이고 활발한 배우자를 만날 수 있습니다.',
      earth: '안정적이고 현실적인 배우자를 만날 가능성이 높습니다.',
      metal: '원칙이 분명하고 결단력 있는 배우자를 만날 수 있습니다.',
      water: '지혜롭고 적응력 있는 배우자를 만날 가능성이 높습니다.',
    };
    spouseType = elementSpouse[spousePalaceInfo.element] || '';
  }

  let marriageHint = '';
  if (spouseStar) {
    marriageHint = '배우자성이 사주에 있어 결혼 인연이 있습니다.';
  } else {
    marriageHint = '대운에서 배우자성이 올 때 인연을 만날 수 있습니다.';
  }

  return {
    loveStyle,
    spouseType,
    marriageHint,
    spousePalace: spousePalaceInfo?.animal || '',
  };
}

// 재물운 상세 분석
function analyzeWealth(sajuResult: any) {
  const { tenGods, dayMaster } = sajuResult;

  const hasJeongJae = tenGods.year === '정재' || tenGods.month === '정재' || tenGods.hour === '정재';
  const hasPyeonJae = tenGods.year === '편재' || tenGods.month === '편재' || tenGods.hour === '편재';

  let wealthStyle = '';
  let wealthAdvice = '';
  let investmentStyle = '';

  if (hasJeongJae && hasPyeonJae) {
    wealthStyle = '정재와 편재가 모두 있어 안정적인 수입과 투자 모두 가능합니다.';
    investmentStyle = '분산 투자가 적합합니다.';
    wealthAdvice = '본업에서 안정적인 수입을 유지하면서 투자로 자산을 늘려가세요.';
  } else if (hasJeongJae) {
    wealthStyle = '꾸준한 노력으로 재물을 모으는 타입입니다.';
    investmentStyle = '안전자산 위주가 좋습니다.';
    wealthAdvice = '시간이 걸리더라도 꾸준함이 승리합니다.';
  } else if (hasPyeonJae) {
    wealthStyle = '사업 수완이 있고 큰 돈이 오가는 편입니다.';
    investmentStyle = '적극적인 투자가 가능하지만 리스크 관리가 중요합니다.';
    wealthAdvice = '들어온 돈의 일부는 반드시 저축하세요.';
  } else {
    wealthStyle = '돈에 대한 욕심이 적거나 다른 가치를 추구하는 타입입니다.';
    investmentStyle = '자기계발에 투자하세요.';
    wealthAdvice = '실력을 키우면 돈은 따라옵니다.';
  }

  const wealthByDayMaster: Record<string, string> = {
    '갑': '큰 사업이나 프로젝트에서 재물을 얻을 수 있습니다.',
    '을': '인맥을 통해 재물 기회가 옵니다.',
    '병': '인기나 명성을 통해 재물이 따라옵니다.',
    '정': '기술이나 재능을 통해 재물을 얻습니다.',
    '무': '부동산이나 안정적인 자산에서 수익이 있습니다.',
    '기': '서비스업에서 재물을 얻습니다.',
    '경': '전문 기술 분야에서 재물을 얻습니다.',
    '신': '섬세한 기술이나 예술 분야에서 기회가 있습니다.',
    '임': '아이디어나 지식을 활용해 재물을 얻습니다.',
    '계': '창의성이나 감성적인 분야에서 기회가 있습니다.',
  };

  return {
    wealthStyle,
    investmentStyle,
    wealthAdvice,
    dayMasterWealth: wealthByDayMaster[dayMaster] || '',
  };
}

// 직업적성 상세 분석
function analyzeCareerDetail(sajuResult: any) {
  const { tenGods, dayMaster, pillars } = sajuResult;
  const monthTenGod = tenGods.month;

  const careerByTenGod: Record<string, {
    field: string;
    specific: string[];
    style: string;
    success: string;
  }> = {
    '비견': {
      field: '독립/경쟁 분야',
      specific: ['프리랜서', '개인사업', '스포츠', '창업'],
      style: '혼자서도 잘하며 경쟁 환경에서 동기부여를 받습니다.',
      success: '자기 브랜드를 만들어 성공할 수 있습니다.',
    },
    '겁재': {
      field: '협업/동업 분야',
      specific: ['공동창업', '파트너십 사업', '팀 스포츠', '영업'],
      style: '함께 일할 때 시너지가 납니다.',
      success: '좋은 파트너를 만나면 크게 성공합니다.',
    },
    '식신': {
      field: '창작/서비스 분야',
      specific: ['요리사', '작가', '콘텐츠 크리에이터', '교육'],
      style: '창의력을 발휘하는 일에 재능이 있습니다.',
      success: '자신만의 콘텐츠로 인정받을 수 있습니다.',
    },
    '상관': {
      field: '예술/자유 분야',
      specific: ['예술가', '연예인', '디자이너', '프리랜서'],
      style: '자유롭게 일할 때 능력이 발휘됩니다.',
      success: '독보적인 위치에 오를 수 있습니다.',
    },
    '편재': {
      field: '사업/투자 분야',
      specific: ['사업가', '투자자', '영업', '무역'],
      style: '돈의 흐름을 읽는 능력이 있습니다.',
      success: '사업이나 투자로 큰 재물을 모읍니다.',
    },
    '정재': {
      field: '안정/관리 분야',
      specific: ['회계사', '은행원', '공무원', '대기업'],
      style: '안정적인 환경에서 능력을 발휘합니다.',
      success: '한 분야에서 오래 일하며 전문가가 됩니다.',
    },
    '편관': {
      field: '권력/통제 분야',
      specific: ['군인', '경찰', '검찰', '관리자'],
      style: '조직을 이끄는 능력이 있습니다.',
      success: '조직의 수장이 될 수 있습니다.',
    },
    '정관': {
      field: '명예/안정 분야',
      specific: ['공무원', '판사', '대기업 임원', '교수'],
      style: '안정적인 직업에서 빛을 발합니다.',
      success: '사회적 명예와 안정적인 지위를 얻습니다.',
    },
    '편인': {
      field: '전문/기술 분야',
      specific: ['연구원', '기술자', 'IT 전문가', '발명가'],
      style: '독특한 분야에서 전문성을 발휘합니다.',
      success: '특별한 기술로 인정받습니다.',
    },
    '정인': {
      field: '교육/학문 분야',
      specific: ['교사', '교수', '연구원', '컨설턴트'],
      style: '배우고 가르치는 것을 좋아합니다.',
      success: '많은 사람에게 영향을 줄 수 있습니다.',
    },
  };

  const careerInfo = monthTenGod ? careerByTenGod[monthTenGod] : null;

  const careerByDayMaster: Record<string, string> = {
    '갑': 'CEO, 정치인, 사업가, 군 장교, 스포츠 감독',
    '을': '외교관, 상담사, 마케터, 디자이너',
    '병': '연예인, 정치인, 강사, 이벤트 기획자',
    '정': '예술가, 요리사, 상담사, 교사',
    '무': '공무원, 건설업, 부동산, 금융업',
    '기': '요식업, 호텔리어, 사회복지사',
    '경': '외과의사, 변호사, 군인, 엔지니어',
    '신': '보석세공, 정밀공학, 예술가, 에디터',
    '임': '학자, 전략가, 컨설턴트, IT 기획자',
    '계': '시인, 음악가, 심리상담사, 마케터',
  };

  return {
    careerInfo: careerInfo || {
      field: '다양한 분야',
      specific: ['자신의 관심사를 따르세요'],
      style: '자신만의 스타일로 일합니다.',
      success: '좋아하는 일을 하면 성공이 따라옵니다.',
    },
    dayMasterCareer: careerByDayMaster[dayMaster] || '',
  };
}

// 쉽게 풀어쓴 설명 생성 함수
function generateSimpleExplanation(sajuResult: any, traits: any) {
  const { dayMaster, dayMasterInfo, elements, yinYang, tenGods, relations, pillars } = sajuResult;

  // 오행별 쉬운 설명
  const elementSimple: Record<string, string> = {
    wood: '나무',
    fire: '불',
    earth: '흙',
    metal: '쇠',
    water: '물',
  };

  // 일간별 성격 상세 설명 (더 길고 논리적으로)
  const dayMasterDetailed: Record<string, { basic: string; strength: string; weakness: string; advice: string; relationship: string }> = {
    '갑': {
      basic: '갑목(甲木)은 사주에서 큰 나무, 대들보, 원목을 상징합니다. 숲에서 하늘을 향해 곧게 뻗어 올라가는 소나무처럼, 당신은 곧은 심성과 당당한 기개를 타고났습니다.',
      strength: '리더십이 뛰어나고 정의감이 강합니다. 어려운 상황에서도 쉽게 굽히지 않는 강인한 정신력을 가지고 있으며, 큰 그림을 그리고 목표를 향해 꾸준히 나아가는 추진력이 있습니다. 주변 사람들에게 든든한 존재로 인식되며, 자연스럽게 사람들을 이끄는 카리스마가 있습니다.',
      weakness: '때로는 너무 고집스럽거나 융통성이 부족해 보일 수 있습니다. 자신의 신념이 강해서 다른 사람의 의견을 수용하는 데 시간이 걸릴 수 있고, 변화에 적응하는 것보다 자신의 방식을 고수하려는 경향이 있습니다.',
      advice: '때로는 바람에 흔들리는 유연함도 필요합니다. 굳건함을 유지하되, 상황에 따라 적절히 양보하고 협력하는 지혜를 기르면 더 큰 성장을 이룰 수 있습니다.',
      relationship: '진정성 있는 관계를 추구하며, 한번 맺은 인연을 오래 유지합니다. 가족과 친구에게 헌신적이며, 신뢰를 바탕으로 한 깊은 관계를 선호합니다.',
    },
    '을': {
      basic: '을목(乙木)은 덩굴, 풀, 꽃과 같은 부드러운 식물을 상징합니다. 바위틈에서도 피어나는 작은 풀처럼, 당신은 어떤 환경에서도 적응하고 생존하는 놀라운 유연성을 가지고 있습니다.',
      strength: '적응력과 유연성이 뛰어납니다. 다양한 사람들과 쉽게 어울리고, 갈등 상황에서 조율자 역할을 잘 수행합니다. 부드러운 카리스마로 사람들의 마음을 얻으며, 끈기와 인내심으로 어려운 상황을 극복합니다. 외유내강(外柔內剛)의 성격으로, 겉으로는 부드럽지만 내면은 강합니다.',
      weakness: '때로는 결정을 미루거나 너무 많은 것을 고려하느라 우유부단해 보일 수 있습니다. 자기주장이 약해 보일 수 있고, 다른 사람의 의견에 쉽게 영향을 받을 수 있습니다.',
      advice: '부드러움은 당신의 강점입니다. 하지만 때로는 명확하게 자신의 입장을 표현하고, 결단을 내리는 연습도 필요합니다. 유연함과 결단력의 균형을 찾으세요.',
      relationship: '조화로운 관계를 중시하며, 상대방의 기분을 잘 살핍니다. 갈등을 피하고 평화로운 관계를 유지하려 노력하며, 세심한 배려로 주변 사람들에게 사랑받습니다.',
    },
    '병': {
      basic: '병화(丙火)는 태양, 큰 불, 화롯불을 상징합니다. 온 세상을 밝게 비추는 태양처럼, 당신은 주변을 환하게 만드는 밝은 에너지와 열정을 타고났습니다.',
      strength: '열정적이고 활동적이며, 어디서든 주목받는 존재감이 있습니다. 낙천적인 성격으로 주변 분위기를 밝게 만들고, 사람들에게 희망과 용기를 줍니다. 표현력이 뛰어나고 설득력이 있어서 리더나 연설가로서의 재능이 있습니다. 정직하고 솔직해서 신뢰를 얻기 쉽습니다.',
      weakness: '때로는 너무 강렬하거나 급한 성격이 문제가 될 수 있습니다. 참을성이 부족하고, 감정의 기복이 있을 수 있습니다. 에너지가 넘쳐서 무리하게 일을 추진하다가 지칠 수 있습니다.',
      advice: '태양도 때로는 구름 뒤에 쉬어야 합니다. 열정을 유지하되, 에너지를 적절히 분배하고 휴식을 취하는 것이 중요합니다. 깊이 있는 사고와 인내심을 기르면 더 큰 성과를 이룰 수 있습니다.',
      relationship: '따뜻하고 정이 넘치며, 주변 사람들을 챙기는 것을 좋아합니다. 활발한 사교 활동을 즐기고, 많은 사람들과 교류하며 에너지를 얻습니다.',
    },
    '정': {
      basic: '정화(丁火)는 촛불, 등불, 모닥불을 상징합니다. 어둠 속에서 은은하게 빛나는 촛불처럼, 당신은 조용하지만 따뜻한 빛으로 주변을 밝히는 섬세한 존재입니다.',
      strength: '섬세하고 배려심이 깊습니다. 분위기를 잘 읽고 상대방의 감정을 세심하게 살피는 능력이 있습니다. 창의력과 예술적 감각이 뛰어나며, 깊이 있는 사고력을 가지고 있습니다. 묵묵히 맡은 일을 해내는 성실함이 있고, 신중하게 결정을 내립니다.',
      weakness: '때로는 너무 예민하거나 걱정이 많을 수 있습니다. 자신의 감정을 표현하는 데 소극적이고, 갈등 상황에서 스트레스를 많이 받을 수 있습니다. 완벽주의적 성향으로 스스로를 힘들게 할 수 있습니다.',
      advice: '당신의 섬세함은 소중한 재능입니다. 하지만 때로는 자신의 감정과 생각을 더 적극적으로 표현해 보세요. 완벽하지 않아도 괜찮다는 것을 기억하고, 스스로에게 관대해지세요.',
      relationship: '진심 어린 관계를 중시하며, 소수의 사람들과 깊은 유대를 형성합니다. 말보다 행동으로 마음을 표현하고, 묵묵히 곁에서 지지해 주는 든든한 존재입니다.',
    },
    '무': {
      basic: '무토(戊土)는 산, 언덕, 넓은 대지를 상징합니다. 우뚝 솟은 산처럼, 당신은 든든하고 안정적인 존재감으로 주변 사람들에게 신뢰를 줍니다.',
      strength: '듬직하고 신뢰감이 있습니다. 한번 정한 것은 끝까지 지키려 하고, 약속을 중시합니다. 포용력이 커서 다양한 사람들을 품어줄 수 있으며, 어려운 상황에서도 흔들리지 않는 안정감을 제공합니다. 현실적이고 실용적인 판단력을 가지고 있습니다.',
      weakness: '때로는 너무 고집스럽거나 변화를 싫어할 수 있습니다. 새로운 것을 시도하는 데 소극적이고, 기존의 방식을 고수하려는 경향이 있습니다. 감정 표현이 서툴어 무뚝뚝해 보일 수 있습니다.',
      advice: '안정은 당신의 강점이지만, 때로는 변화도 필요합니다. 새로운 경험에 마음을 열고, 감정을 표현하는 연습을 해보세요. 유연성을 기르면 더 넓은 세상을 만날 수 있습니다.',
      relationship: '한번 맺은 인연을 오래 유지하며, 묵묵히 곁을 지켜주는 타입입니다. 말보다 행동으로 사랑을 표현하고, 가족과 친구에게 헌신적입니다.',
    },
    '기': {
      basic: '기토(己土)는 농토, 정원의 흙, 비옥한 땅을 상징합니다. 만물을 품고 키워내는 기름진 땅처럼, 당신은 포용력과 배려심으로 주변 사람들을 따뜻하게 감싸줍니다.',
      strength: '포용력이 넓고 배려심이 깊습니다. 사람들의 성장을 돕는 것에서 기쁨을 느끼고, 조용히 뒤에서 지원하는 역할을 잘 수행합니다. 현실적이고 실용적이며, 꼼꼼하게 일을 처리합니다. 인내심이 강하고, 묵묵히 자신의 역할을 해냅니다.',
      weakness: '때로는 자기 자신보다 다른 사람을 먼저 챙기다가 정작 자신은 소홀히 할 수 있습니다. 걱정이 많고 소심해 보일 수 있으며, 결정을 내리는 데 시간이 걸릴 수 있습니다.',
      advice: '다른 사람을 돌보는 것도 좋지만, 자기 자신도 소중히 여기세요. 때로는 "아니오"라고 말하는 것도 필요합니다. 자신의 욕구와 감정을 표현하는 연습을 해보세요.',
      relationship: '헌신적이고 따뜻한 관계를 형성합니다. 상대방의 필요를 먼저 살피고, 조용히 지지해 주는 든든한 존재입니다. 가정과 가족을 중시합니다.',
    },
    '경': {
      basic: '경금(庚金)은 철, 바위, 광석을 상징합니다. 강철처럼 단단하고 날카로운 검처럼, 당신은 강한 의지력과 결단력으로 목표를 향해 나아갑니다.',
      strength: '결단력이 뛰어나고 의지가 강합니다. 정의감이 있고 원칙을 중시하며, 불의를 보면 참지 못합니다. 한번 결심하면 끝까지 밀고 나가는 추진력이 있고, 어려운 상황에서도 용기를 잃지 않습니다. 직설적이고 솔직해서 신뢰를 얻습니다.',
      weakness: '때로는 너무 강하거나 공격적으로 보일 수 있습니다. 융통성이 부족하고, 자신의 방식을 고집하는 경향이 있습니다. 상대방의 감정을 고려하지 않고 직설적으로 말해서 상처를 줄 수 있습니다.',
      advice: '강함 속에 부드러움을 품으세요. 원칙도 중요하지만, 때로는 상황에 따라 유연하게 대처하는 것이 현명합니다. 상대방의 입장에서 생각해보고, 표현 방식을 부드럽게 하는 연습을 해보세요.',
      relationship: '의리가 있고 약속을 중시합니다. 진정한 친구에게는 한없이 충실하며, 어려울 때 든든하게 곁을 지켜줍니다. 표현은 서툴지만 마음은 따뜻합니다.',
    },
    '신': {
      basic: '신금(辛金)은 보석, 금, 장신구를 상징합니다. 원석에서 갈고 닦아 빛나는 보석처럼, 당신은 섬세하고 예리한 감각으로 아름다움을 추구합니다.',
      strength: '섬세하고 예리한 감각을 가지고 있습니다. 미적 감각이 뛰어나고, 완벽주의적 성향으로 높은 품질의 결과물을 만들어냅니다. 분석력이 좋고, 세부사항까지 꼼꼼하게 살핍니다. 자존심이 강하고, 자기만의 가치관이 확고합니다.',
      weakness: '때로는 너무 예민하거나 까다로워 보일 수 있습니다. 완벽주의로 인해 스스로를 힘들게 하고, 다른 사람에게도 높은 기준을 요구할 수 있습니다. 비판에 민감하고, 상처받기 쉽습니다.',
      advice: '완벽함을 추구하는 것은 좋지만, 때로는 충분히 좋은 것으로 만족하는 법도 배우세요. 자신과 타인에게 조금 더 관대해지면, 더 편안하고 행복한 삶을 살 수 있습니다.',
      relationship: '깊이 있는 관계를 선호하며, 진심으로 이해해주는 사람을 만나면 마음을 엽니다. 겉으로는 차가워 보일 수 있지만, 내면은 따뜻하고 섬세합니다.',
    },
    '임': {
      basic: '임수(壬水)는 큰 강, 바다, 호수를 상징합니다. 넓고 깊은 바다처럼, 당신은 깊은 지혜와 넓은 포용력으로 다양한 것들을 수용합니다.',
      strength: '지혜롭고 통찰력이 있습니다. 상황을 깊이 분석하고, 본질을 꿰뚫어 보는 능력이 있습니다. 적응력이 뛰어나고, 다양한 환경에서 자신의 길을 찾아갑니다. 포용력이 커서 다양한 사람들과 어울릴 수 있고, 열린 마음으로 새로운 것을 받아들입니다.',
      weakness: '때로는 너무 흘러가듯 살거나, 방향성이 불분명해 보일 수 있습니다. 깊이 생각하다 행동이 늦어질 수 있고, 감정을 숨기는 경향이 있어 속마음을 알기 어려울 수 있습니다.',
      advice: '흘러가는 물도 때로는 방향을 정해야 합니다. 깊은 생각도 좋지만, 적절한 때에 결정을 내리고 행동하세요. 감정을 표현하고 나누는 것도 관계에서 중요합니다.',
      relationship: '깊이 있는 대화와 지적인 교류를 즐깁니다. 상대방을 이해하려 노력하고, 조언자로서의 역할을 잘 수행합니다. 신비로운 매력으로 사람들을 끌어당깁니다.',
    },
    '계': {
      basic: '계수(癸水)는 이슬, 샘물, 비를 상징합니다. 맑은 샘물이 조용히 흘러 모든 것을 적시듯, 당신은 순수하고 섬세한 감성으로 주변을 촉촉하게 적셔줍니다.',
      strength: '감수성이 풍부하고 직관력이 뛰어납니다. 작은 것도 세심하게 살피고, 다른 사람의 감정을 잘 이해합니다. 창의력이 있고, 예술적 재능을 가진 경우가 많습니다. 조용히 스며들듯 주변에 영향을 미치며, 은근한 힘이 있습니다.',
      weakness: '때로는 너무 예민하거나 감정적으로 흔들릴 수 있습니다. 작은 일에도 상처받기 쉽고, 걱정이 많아 불안해할 수 있습니다. 자기 의견을 적극적으로 표현하는 데 어려움을 느낄 수 있습니다.',
      advice: '당신의 섬세함과 직관력은 특별한 재능입니다. 하지만 때로는 마음의 경계를 세우고, 자신을 보호하는 것도 필요합니다. 자신감을 기르고, 자신의 의견을 표현하는 연습을 해보세요.',
      relationship: '깊은 정서적 연결을 추구합니다. 말없이도 서로를 이해하는 관계를 원하며, 세심한 배려로 상대방을 감동시킵니다. 진심을 알아주는 사람에게 마음을 엽니다.',
    },
  };

  // 십신 상세 설명
  const tenGodDetailed: Record<string, { meaning: string; influence: string }> = {
    '비견': {
      meaning: '비견(比肩)은 나와 같은 오행의 기운으로, 형제자매, 동료, 친구, 경쟁자를 상징합니다.',
      influence: '자립심이 강하고 주체성이 뚜렷합니다. 동료나 친구와의 인연이 깊고, 함께 성장하는 관계를 형성합니다. 다만 경쟁 상황에서 갈등이 생길 수 있으니, 협력과 경쟁의 균형을 잘 맞추는 것이 중요합니다.',
    },
    '겁재': {
      meaning: '겁재(劫財)는 나를 도와주면서도 경쟁하는 기운으로, 형제자매, 동업자, 라이벌을 상징합니다.',
      influence: '사교성이 좋고 활동적입니다. 동업이나 협력 관계에서 능력을 발휘하지만, 재물 관리에 주의가 필요합니다. 나눔과 협력의 정신을 가지되, 자신의 것도 지킬 줄 아는 균형이 필요합니다.',
    },
    '식신': {
      meaning: '식신(食神)은 내가 낳은 기운으로, 표현력, 창작력, 먹는 복, 자녀를 상징합니다.',
      influence: '표현력과 창작력이 뛰어나고, 풍요로운 삶을 누릴 수 있습니다. 먹는 복이 있어 미식을 즐기고, 예술이나 창작 활동에 재능이 있습니다. 낙천적인 성격으로 인기가 많습니다.',
    },
    '상관': {
      meaning: '상관(傷官)은 재능을 발휘하고 표현하는 기운으로, 창의력, 언변, 자유로운 영혼을 상징합니다.',
      influence: '뛰어난 재능과 독창적인 사고력을 가지고 있습니다. 자유분방하고 관습에 얽매이지 않으며, 예술이나 창작 분야에서 두각을 나타냅니다. 다만 권위에 도전하는 성향이 있어, 조직 생활에서는 유연성이 필요합니다.',
    },
    '편재': {
      meaning: '편재(偏財)는 움직이는 재물, 사업 수완, 투자 능력을 상징합니다.',
      influence: '사업 감각이 뛰어나고 투자에 재능이 있습니다. 활동적으로 재물을 창출하며, 인맥을 활용한 사업에 적합합니다. 다만 도박이나 무리한 투자는 조심해야 하며, 계획적인 재물 관리가 필요합니다.',
    },
    '정재': {
      meaning: '정재(正財)는 꾸준한 재물, 급여, 안정적인 수입을 상징합니다.',
      influence: '성실한 노력으로 재물을 모으는 타입입니다. 안정적인 직장 생활에 적합하고, 계획적으로 저축하며 차근차근 재산을 불려갑니다. 신용이 있고 믿음직스러워 재정 관련 업무에서 신뢰받습니다.',
    },
    '편관': {
      meaning: '편관(偏官) 또는 칠살(七殺)은 권력, 통제력, 카리스마를 상징합니다.',
      influence: '강한 추진력과 리더십을 가지고 있습니다. 조직을 이끌고 사람들을 통솔하는 능력이 뛰어나며, 어려운 상황에서 진가를 발휘합니다. 다만 때로는 공격적으로 보일 수 있으니, 부드러운 리더십도 함께 기르면 좋습니다.',
    },
    '정관': {
      meaning: '정관(正官)은 명예, 직위, 사회적 인정을 상징합니다.',
      influence: '직장 운이 좋고 사회적으로 인정받기 쉽습니다. 규칙과 질서를 중시하며, 책임감이 강합니다. 공무원, 대기업, 전문직 등 안정적인 조직에서 능력을 발휘하며, 승진과 명예를 얻을 가능성이 높습니다.',
    },
    '편인': {
      meaning: '편인(偏印)은 특별한 지혜, 창의적 사고, 학문적 재능을 상징합니다.',
      influence: '독특한 사고방식과 창의력을 가지고 있습니다. 전통적인 학문보다 특수한 분야에서 재능을 발휘하며, 연구나 발명에 적합합니다. 직관력이 뛰어나고, 남들이 보지 못하는 것을 발견하는 능력이 있습니다.',
    },
    '정인': {
      meaning: '정인(正印)은 배움, 학업, 좋은 스승, 어머니의 보살핌을 상징합니다.',
      influence: '학업운이 좋고 좋은 스승을 만나기 쉽습니다. 배움에 대한 열정이 있고, 지식을 쌓아가는 것에서 기쁨을 느낍니다. 교육자나 학자로서의 재능이 있으며, 어머니나 윗어른의 도움을 받을 수 있습니다.',
    },
  };

  // 합충 상세 설명
  const relationDetailed: Record<string, { name: string; meaning: string; influence: string }> = {
    '자오충': {
      name: '자오충(子午沖)',
      meaning: '자(子·쥐)와 오(午·말)의 충돌로, 물과 불의 대립을 나타냅니다.',
      influence: '급격한 변화나 이동수가 있을 수 있습니다. 감정의 기복이 있거나, 직장이나 거주지의 변화가 생길 수 있습니다. 하지만 이 충돌의 에너지를 잘 활용하면, 정체된 상황을 타개하고 새로운 기회를 만들 수 있습니다.',
    },
    '축미충': {
      name: '축미충(丑未沖)',
      meaning: '축(丑·소)과 미(未·양)의 충돌로, 토끼리의 대립을 나타냅니다.',
      influence: '재물이나 부동산 관련 변동이 있을 수 있습니다. 저장해둔 것들의 이동이나 정리가 필요할 수 있고, 인간관계에서 의견 충돌이 있을 수 있습니다. 신중한 재물 관리와 소통이 중요합니다.',
    },
    '인신충': {
      name: '인신충(寅申沖)',
      meaning: '인(寅·호랑이)과 신(申·원숭이)의 충돌로, 나무와 금속의 대립을 나타냅니다.',
      influence: '직장이나 건강에 주의가 필요합니다. 이동이나 여행이 잦을 수 있고, 급하게 결정을 내려야 하는 상황이 생길 수 있습니다. 건강 관리에 신경 쓰고, 중요한 결정은 신중하게 하세요.',
    },
    '묘유충': {
      name: '묘유충(卯酉沖)',
      meaning: '묘(卯·토끼)와 유(酉·닭)의 충돌로, 나무와 금속의 대립을 나타냅니다.',
      influence: '대인관계에서 갈등이 생길 수 있습니다. 의견 차이나 오해로 인한 불화가 있을 수 있으니, 소통에 더 신경 쓰세요. 관계를 풀어가려는 노력이 좋은 결과를 가져옵니다.',
    },
    '진술충': {
      name: '진술충(辰戌沖)',
      meaning: '진(辰·용)과 술(戌·개)의 충돌로, 토끼리의 대립을 나타냅니다.',
      influence: '환경 변화나 이사수가 있을 수 있습니다. 직장이나 생활환경의 변화가 생기거나, 새로운 시작을 하게 될 수 있습니다. 변화를 두려워하지 말고, 새로운 기회로 받아들이세요.',
    },
    '사해충': {
      name: '사해충(巳亥沖)',
      meaning: '사(巳·뱀)와 해(亥·돼지)의 충돌로, 불과 물의 대립을 나타냅니다.',
      influence: '여행운이나 이동수가 있을 수 있습니다. 먼 곳으로의 이동이나 해외 인연이 생길 수 있습니다. 변화를 통해 새로운 경험과 성장의 기회를 얻을 수 있습니다.',
    },
  };

  // 오행 분포 상세 해석
  const getElementBalance = () => {
    const total = Object.values(elements).reduce((a: number, b: any) => a + (b as number), 0);
    const sorted = Object.entries(elements).sort((a, b) => (b[1] as number) - (a[1] as number));
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];
    const secondStrongest = sorted[1];

    let balance = '';

    // 가장 강한 오행 분석
    if ((strongest[1] as number) >= 3) {
      balance += `당신의 사주에서 ${elementSimple[strongest[0]]}(${getElementHanja(strongest[0])})의 기운이 가장 강합니다.\n\n`;
      switch (strongest[0]) {
        case 'wood':
          balance += '목(木)의 기운이 강하다는 것은 성장하고 발전하려는 욕구가 크다는 의미입니다. 나무가 위로 뻗어 올라가듯, 새로운 시작과 도전을 좋아하고, 창의적인 아이디어가 풍부합니다. 봄의 기운처럼 생명력이 넘치고 희망적이며, 주변을 긍정적으로 이끄는 힘이 있습니다.';
          break;
        case 'fire':
          balance += '화(火)의 기운이 강하다는 것은 열정적이고 활동적인 에너지를 가졌다는 의미입니다. 태양처럼 빛나고 따뜻하며, 사람들에게 영감과 활력을 줍니다. 표현력이 뛰어나고 카리스마가 있어 자연스럽게 주목받습니다.';
          break;
        case 'earth':
          balance += '토(土)의 기운이 강하다는 것은 안정적이고 신뢰감 있는 성품을 가졌다는 의미입니다. 땅처럼 든든하게 주변을 지지해주며, 현실적이고 실용적인 판단력이 있습니다. 변화보다 안정을 추구하고, 한번 맺은 인연을 소중히 여깁니다.';
          break;
        case 'metal':
          balance += '금(金)의 기운이 강하다는 것은 원칙과 결단력이 뛰어나다는 의미입니다. 쇠처럼 날카롭고 명확한 판단력을 가지고 있으며, 정의롭고 깔끔한 것을 좋아합니다. 한번 정하면 끝까지 밀고 나가는 추진력이 있습니다.';
          break;
        case 'water':
          balance += '수(水)의 기운이 강하다는 것은 지혜롭고 적응력이 뛰어나다는 의미입니다. 물처럼 어디든 흘러가며 환경에 유연하게 대처하고, 깊이 생각하고 분석하는 능력이 있습니다. 직관력도 뛰어나 상황의 본질을 꿰뚫어 봅니다.';
          break;
      }
    }

    // 부족한 오행 분석
    if ((weakest[1] as number) === 0) {
      balance += `\n\n반면, ${elementSimple[weakest[0]]}(${getElementHanja(weakest[0])})의 기운이 없어 보완이 필요합니다.\n\n`;
      switch (weakest[0]) {
        case 'wood':
          balance += '목(木)의 기운이 부족하면 때로는 새로운 시작이나 변화를 꺼리거나, 추진력이 부족하게 느껴질 수 있습니다. 나무를 상징하는 초록색을 활용하거나, 동쪽 방향을 의식하면 도움이 됩니다. 식물을 가꾸거나 산책을 통해 나무의 기운을 보충해보세요.';
          break;
        case 'fire':
          balance += '화(火)의 기운이 부족하면 열정이나 자신감이 약해지거나, 자신을 표현하는 데 소극적일 수 있습니다. 붉은색이나 주황색을 활용하고, 남쪽 방향을 의식하면 도움이 됩니다. 적극적으로 자신을 표현하고 열정을 불태우는 연습을 해보세요.';
          break;
        case 'earth':
          balance += '토(土)의 기운이 부족하면 불안정하거나 뿌리 내리지 못하는 느낌이 들 수 있습니다. 황색이나 베이지색을 활용하고, 규칙적인 생활 습관을 만들면 도움이 됩니다. 안정적인 환경을 만들고 신뢰할 수 있는 관계를 구축해보세요.';
          break;
        case 'metal':
          balance += '금(金)의 기운이 부족하면 결단력이 약하거나 쉽게 결정을 미루게 될 수 있습니다. 흰색이나 금색을 활용하고, 서쪽 방향을 의식하면 도움이 됩니다. 명확한 원칙을 세우고 작은 것부터 결단하는 연습을 해보세요.';
          break;
        case 'water':
          balance += '수(水)의 기운이 부족하면 유연성이 떨어지거나 새로운 환경에 적응하는 데 어려움을 겪을 수 있습니다. 검은색이나 파란색을 활용하고, 북쪽 방향을 의식하면 도움이 됩니다. 다양한 관점에서 생각해보고 유연하게 대처하는 연습을 해보세요.';
          break;
      }
    }

    // 오행 상생 관계 설명
    balance += '\n\n[오행의 상생 관계]\n';
    balance += '목(木)은 화(火)를 생하고, 화(火)는 토(土)를 생하고, 토(土)는 금(金)을 생하고, 금(金)은 수(水)를 생하고, 수(水)는 목(木)을 생합니다. ';
    balance += '당신에게 부족한 기운은 그것을 생해주는 오행을 보충하면 자연스럽게 채워집니다.';

    return balance;
  };

  // 오행 한자
  const getElementHanja = (element: string) => {
    const hanjaMap: Record<string, string> = {
      wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
    };
    return hanjaMap[element] || '';
  };

  // 음양 균형 상세 해석
  const getYinYangBalance = () => {
    const { yang, yin } = yinYang;
    let result = '';

    result += `당신의 사주에서 양(陽)의 기운은 ${yang}개, 음(陰)의 기운은 ${yin}개입니다.\n\n`;

    if (yang > yin + 2) {
      result += '양(陽)의 기운이 압도적으로 강합니다.\n\n';
      result += '양의 기운이 강한 사람은 적극적이고 외향적인 성향을 가집니다. 새로운 일을 시작하는 것을 좋아하고, 가만히 있기보다 움직이면서 에너지를 발산합니다. 리더십이 있고 추진력이 강하며, 도전적인 상황에서 빛을 발합니다.\n\n';
      result += '다만, 때로는 너무 급하게 행동하거나 참을성이 부족할 수 있습니다. 조용히 생각하고 기다리는 시간도 필요합니다. 음(陰)의 기운을 보충하기 위해 명상이나 독서 등 정적인 활동을 해보세요.';
    } else if (yin > yang + 2) {
      result += '음(陰)의 기운이 압도적으로 강합니다.\n\n';
      result += '음의 기운이 강한 사람은 신중하고 내향적인 성향을 가집니다. 깊이 생각하고 관찰하는 것을 좋아하며, 내면의 세계가 풍부합니다. 직관력이 뛰어나고 세심한 배려로 주변 사람들에게 편안함을 줍니다.\n\n';
      result += '다만, 때로는 너무 소극적이거나 결정을 미루게 될 수 있습니다. 적극적으로 표현하고 행동하는 연습이 필요합니다. 양(陽)의 기운을 보충하기 위해 운동이나 사교 활동 등 활동적인 취미를 가져보세요.';
    } else {
      result += '음양의 균형이 잘 잡혀 있습니다.\n\n';
      result += '음양이 균형을 이룬 사주는 상황에 따라 유연하게 대처할 수 있는 장점이 있습니다. 적극적으로 나서야 할 때와 신중하게 기다려야 할 때를 본능적으로 구분하며, 극단으로 치우치지 않는 안정적인 성향을 가집니다.\n\n';
      result += '이 균형을 잘 유지하면서, 상황에 맞게 양과 음의 기운을 적절히 발휘하세요.';
    }

    return result;
  };

  // 일주 분석 추가
  const getIljuAnalysis = () => {
    if (!pillars?.day) return null;

    const dayStem = pillars.day.stem;
    const dayBranch = pillars.day.branch;
    const ilju = `${dayStem}${dayBranch}`;

    return `당신의 일주는 ${ilju}입니다. 일주는 사주에서 '나 자신'을 가장 직접적으로 나타내는 기둥으로, 성격의 핵심과 배우자 운을 보여줍니다. 천간인 ${dayStem}은 나의 겉으로 드러나는 성격과 의지를, 지지인 ${dayBranch}은 나의 내면과 숨겨진 성향을 나타냅니다.`;
  };

  // 종합 조언 생성
  const getOverallAdvice = () => {
    const dayMasterElement = dayMasterInfo?.element || 'wood';
    let advice = '종합적으로 보았을 때, ';

    // 일간 오행에 따른 조언
    switch (dayMasterElement) {
      case 'wood':
        advice += '당신은 성장과 발전을 추구하는 목(木)의 기운을 타고났습니다. 새로운 도전을 두려워하지 말고, 끊임없이 배우고 성장하세요. 유연함을 잃지 않으면서도 자신의 방향을 잃지 않는 것이 중요합니다.';
        break;
      case 'fire':
        advice += '당신은 열정과 활력이 넘치는 화(火)의 기운을 타고났습니다. 그 에너지를 긍정적인 방향으로 발산하고, 주변을 밝게 비추세요. 다만 때로는 차분하게 에너지를 충전하는 시간도 필요합니다.';
        break;
      case 'earth':
        advice += '당신은 안정과 신뢰를 상징하는 토(土)의 기운을 타고났습니다. 주변 사람들에게 든든한 존재가 되어주되, 때로는 변화도 받아들이세요. 안정 속에서 성장하는 지혜를 발휘하세요.';
        break;
      case 'metal':
        advice += '당신은 결단력과 원칙을 상징하는 금(金)의 기운을 타고났습니다. 정의롭고 올바른 길을 가되, 때로는 부드러움도 필요합니다. 강함과 유연함의 조화를 이루세요.';
        break;
      case 'water':
        advice += '당신은 지혜와 적응력을 상징하는 수(水)의 기운을 타고났습니다. 깊은 통찰력으로 상황을 파악하되, 생각만 하지 말고 행동으로 옮기세요. 흐르는 물처럼 자연스럽게 자신의 길을 찾아가세요.';
        break;
    }

    return advice;
  };

  // 성격 설명 조합
  const getPersonalityDescription = () => {
    const detailed = dayMasterDetailed[dayMaster];
    if (!detailed) return '당신만의 독특한 매력이 있습니다.';

    return `${detailed.basic}\n\n` +
      `[장점]\n${detailed.strength}\n\n` +
      `[주의할 점]\n${detailed.weakness}\n\n` +
      `[조언]\n${detailed.advice}\n\n` +
      `[대인관계]\n${detailed.relationship}`;
  };

  // 십신 의미 조합
  const getTenGodDescription = (tenGod: string) => {
    const detailed = tenGodDetailed[tenGod];
    if (!detailed) return null;
    return `${detailed.meaning}\n\n${detailed.influence}`;
  };

  // 충 의미 조합
  const getClashDescription = () => {
    if (!relations.clashes || relations.clashes.length === 0) return null;

    return relations.clashes.map((clash: string) => {
      const detailed = relationDetailed[clash];
      if (!detailed) return `${clash}의 기운이 있습니다.`;
      return `${detailed.name}\n${detailed.meaning}\n\n${detailed.influence}`;
    }).join('\n\n---\n\n');
  };

  return {
    personality: getPersonalityDescription(),
    elementBalance: getElementBalance(),
    yinYangBalance: getYinYangBalance(),
    iljuAnalysis: getIljuAnalysis(),
    tenGodMeaning: tenGods.year ? getTenGodDescription(tenGods.year) : null,
    monthTenGod: tenGods.month ? getTenGodDescription(tenGods.month) : null,
    clashMeaning: getClashDescription(),
    overallAdvice: getOverallAdvice(),
  };
}

export default function ProfileScreen() {
  const { profile } = useApp();

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>프로필 정보가 없습니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 사주를 실시간으로 재계산 (저장된 데이터의 UTC 버그 문제 해결)
  const sajuResult = useMemo(() => {
    const calculator = new SajuCalculator(profile.birthDate, profile.birthTime);
    return calculator.calculate();
  }, [profile.birthDate, profile.birthTime]);

  const traits = DAY_MASTER_TRAITS[sajuResult.dayMaster];
  const { pillars, elements, yinYang, dayMaster, dayMasterInfo, tenGods, relations } = sajuResult;

  // 쉬운 설명 생성
  const simpleExplanation = useMemo(() => {
    return generateSimpleExplanation(sajuResult, traits);
  }, [sajuResult, traits]);

  // 대운/세운 계산
  const daeunInfo = useMemo(() => {
    return calculateDaeun(sajuResult, profile);
  }, [sajuResult, profile]);

  const saeunInfo = useMemo(() => {
    return calculateSaeun(new Date().getFullYear(), sajuResult);
  }, [sajuResult]);

  // 용신 분석
  const yongsinInfo = useMemo(() => {
    return analyzeYongsin(sajuResult);
  }, [sajuResult]);

  // 건강 분석
  const healthInfo = useMemo(() => {
    return analyzeHealth(sajuResult);
  }, [sajuResult]);

  // 육친 분석
  const familyInfo = useMemo(() => {
    return analyzeFamily(sajuResult);
  }, [sajuResult]);

  // 일주론 상세 분석
  const iljuDetail = useMemo(() => {
    return analyzeIljuDetail(sajuResult);
  }, [sajuResult]);

  // 연애/결혼운 분석
  const loveInfo = useMemo(() => {
    return analyzeLoveAndMarriage(sajuResult, profile);
  }, [sajuResult, profile]);

  // 재물운 분석
  const wealthInfo = useMemo(() => {
    return analyzeWealth(sajuResult);
  }, [sajuResult]);

  // 직업적성 상세 분석
  const careerDetail = useMemo(() => {
    return analyzeCareerDetail(sajuResult);
  }, [sajuResult]);

  // 오행 한글 변환
  const elementToKorean = (element: string | undefined) => {
    const map: Record<string, string> = {
      wood: '목(木)', fire: '화(火)', earth: '토(土)', metal: '금(金)', water: '수(水)',
    };
    return element ? map[element] || element : '-';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>내 사주</Text>
          <Text style={styles.subtitle}>
            {profile.birthDate.replace(/-/g, '.')}
            {profile.birthTime && ` ${profile.birthTime}`}
            {profile.calendar === 'lunar' && ' (음력)'}
          </Text>
        </View>

        {/* 4주 */}
        <Card title="사주 팔자 (四柱八字)" style={styles.card}>
          <View style={styles.easyExplainBox}>
            <Text style={styles.easyExplainTitle}>卦 사주 팔자란?</Text>
            <Text style={styles.easyExplainText}>
              태어난 연·월·일·시를 한자로 표현한 것입니다.{'\n'}
              • 년주: 태어난 해 → 조상운, 어린 시절{'\n'}
              • 월주: 태어난 달 → 부모운, 사회생활{'\n'}
              • 일주: 태어난 날 → 나 자신, 배우자{'\n'}
              • 시주: 태어난 시간 → 자녀운, 말년
            </Text>
          </View>
          <View style={styles.pillarsContainer}>
            <PillarCard pillar={pillars.hour} label="시주" />
            <PillarCard pillar={pillars.day} label="일주 (나)" />
            <PillarCard pillar={pillars.month} label="월주" />
            <PillarCard pillar={pillars.year} label="년주" isYearPillar />
          </View>
          <View style={styles.pillarExplainBox}>
            <Text style={styles.pillarExplainText}>
              위 글자는 천간(하늘 기운), 아래 글자는 지지(땅 기운)입니다.{'\n'}
              일주의 위 글자가 바로 '나'를 나타내는 일간입니다.
            </Text>
          </View>
        </Card>

        {/* 쉽게 풀어쓴 내 사주 - 맨 위에 배치 */}
        <View style={styles.simpleExplanationCard}>
          <View style={styles.simpleExplanationHeader}>
            <Text style={styles.simpleExplanationEmoji}>命</Text>
            <Text style={styles.simpleExplanationTitle}>쉽게 풀어쓴 내 사주</Text>
          </View>
          <Text style={styles.simpleExplanationSubtitle}>
            어려운 사주 용어를 쉽게 설명해드려요
          </Text>

          {/* 나의 성격 */}
          <View style={styles.simpleSection}>
            <Text style={styles.simpleSectionTitle}>性 나의 타고난 성격</Text>
            <Text style={styles.simpleSectionContent}>{simpleExplanation.personality}</Text>
          </View>

          {/* 오행 분석 */}
          {simpleExplanation.elementBalance && (
            <View style={styles.simpleSection}>
              <Text style={styles.simpleSectionTitle}>五行 나의 기운 (오행 분석)</Text>
              <Text style={styles.simpleSectionContent}>{simpleExplanation.elementBalance}</Text>
            </View>
          )}

          {/* 음양 분석 */}
          <View style={styles.simpleSection}>
            <Text style={styles.simpleSectionTitle}>陰陽 나의 성향 (음양 분석)</Text>
            <Text style={styles.simpleSectionContent}>{simpleExplanation.yinYangBalance}</Text>
          </View>

          {/* 십신 - 년주 */}
          {simpleExplanation.tenGodMeaning && (
            <View style={styles.simpleSection}>
              <Text style={styles.simpleSectionTitle}>祖 부모/조상과의 인연 (년주)</Text>
              <Text style={styles.simpleSectionContent}>{simpleExplanation.tenGodMeaning}</Text>
            </View>
          )}

          {/* 십신 - 월주 */}
          {simpleExplanation.monthTenGod && (
            <View style={styles.simpleSection}>
              <Text style={styles.simpleSectionTitle}>業 직장/사회생활 (월주)</Text>
              <Text style={styles.simpleSectionContent}>{simpleExplanation.monthTenGod}</Text>
            </View>
          )}

          {/* 충 관계 */}
          {simpleExplanation.clashMeaning && (
            <View style={styles.simpleSection}>
              <Text style={styles.simpleSectionTitle}>沖 주의할 점 (충)</Text>
              <Text style={styles.simpleSectionContent}>{simpleExplanation.clashMeaning}</Text>
              <Text style={styles.simpleTip}>
                ※ 충이 있다고 나쁜 것만은 아닙니다. 변화와 발전의 기회가 될 수 있어요!
              </Text>
            </View>
          )}

          {/* 일주 분석 */}
          {simpleExplanation.iljuAnalysis && (
            <View style={styles.simpleSection}>
              <Text style={styles.simpleSectionTitle}>日柱 일주 분석</Text>
              <Text style={styles.simpleSectionContent}>{simpleExplanation.iljuAnalysis}</Text>
            </View>
          )}

          {/* 종합 조언 */}
          {simpleExplanation.overallAdvice && (
            <View style={[styles.simpleSection, styles.adviceSection]}>
              <Text style={styles.simpleSectionTitle}>💡 종합 조언</Text>
              <Text style={styles.simpleSectionContent}>{simpleExplanation.overallAdvice}</Text>
            </View>
          )}
        </View>

        {/* 일간 (Day Master) */}
        <Card title="일간 - 나의 본성" style={styles.card}>
          <View style={styles.easyExplainBox}>
            <Text style={styles.easyExplainTitle}>日干 일간이란?</Text>
            <Text style={styles.easyExplainText}>
              일주의 천간(위 글자)으로, 사주에서 '나 자신'을 의미합니다.{'\n'}
              일간을 통해 타고난 성격과 기질을 알 수 있어요.
            </Text>
          </View>
          <View style={styles.dayMasterContainer}>
            <View style={styles.dayMasterMain}>
              <Text style={styles.dayMasterChar}>{dayMaster}</Text>
              <Text style={styles.dayMasterMeaning}>{dayMasterInfo.meaning}</Text>
            </View>
            <View style={styles.dayMasterDetails}>
              <View style={styles.dayMasterDetail}>
                <Text style={styles.detailLabel}>오행</Text>
                <Text style={styles.detailValue}>
                  {dayMasterInfo.element === 'wood' && '목(木) - 나무'}
                  {dayMasterInfo.element === 'fire' && '화(火) - 불'}
                  {dayMasterInfo.element === 'earth' && '토(土) - 흙'}
                  {dayMasterInfo.element === 'metal' && '금(金) - 쇠'}
                  {dayMasterInfo.element === 'water' && '수(水) - 물'}
                </Text>
              </View>
              <View style={styles.dayMasterDetail}>
                <Text style={styles.detailLabel}>음양</Text>
                <Text style={styles.detailValue}>
                  {dayMasterInfo.yinYang === 'yang' ? '양(陽) - 적극적' : '음(陰) - 신중함'}
                </Text>
              </View>
            </View>
          </View>

          {traits && (
            <View style={styles.traitsContainer}>
              <View style={styles.traitRow}>
                <Text style={styles.traitLabel}>나를 표현하는 키워드</Text>
                <View style={styles.keywordsContainer}>
                  {traits.keywords.map((keyword: string, i: number) => (
                    <View key={i} style={styles.keywordBadge}>
                      <Text style={styles.keywordText}>{keyword}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.traitRow}>
                <Text style={styles.traitLabel}>타고난 강점</Text>
                <Text style={styles.traitValue}>{traits.strengths.join(', ')}</Text>
              </View>
              <View style={styles.traitRow}>
                <Text style={styles.traitLabel}>조심할 점</Text>
                <Text style={styles.traitValue}>{traits.weaknesses.join(', ')}</Text>
              </View>
              <View style={styles.traitRow}>
                <Text style={styles.traitLabel}>잘 맞는 분야</Text>
                <Text style={styles.traitValue}>{traits.career.join(', ')}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* 오행 분포 */}
        <Card title="오행 분포" style={styles.card}>
          <View style={styles.easyExplainBox}>
            <Text style={styles.easyExplainTitle}>五行 오행이란?</Text>
            <Text style={styles.easyExplainText}>
              세상 모든 것을 5가지 기운(목·화·토·금·수)으로 나눈 것입니다.{'\n'}
              • 목(木) 나무: 성장, 시작, 봄{'\n'}
              • 화(火) 불: 열정, 활동, 여름{'\n'}
              • 토(土) 흙: 안정, 중재, 환절기{'\n'}
              • 금(金) 쇠: 결단, 정리, 가을{'\n'}
              • 수(水) 물: 지혜, 적응, 겨울
            </Text>
          </View>
          <ElementChart elements={elements} />
          {simpleExplanation.elementBalance && (
            <View style={styles.easyResultBox}>
              <Text style={styles.easyResultTitle}>氣 내 오행 분석</Text>
              <Text style={styles.easyResultText}>{simpleExplanation.elementBalance}</Text>
            </View>
          )}
        </Card>

        {/* 음양 비율 */}
        <Card title="음양 비율" style={styles.card}>
          <View style={styles.easyExplainBox}>
            <Text style={styles.easyExplainTitle}>陰陽 음양이란?</Text>
            <Text style={styles.easyExplainText}>
              세상의 모든 기운을 두 가지로 나눈 것입니다.{'\n'}
              • 양(陽): 밝음, 움직임, 적극적, 외향적, 남성적{'\n'}
              • 음(陰): 어둠, 고요함, 신중함, 내향적, 여성적{'\n\n'}
              둘 다 필요하며, 균형이 중요합니다!
            </Text>
          </View>
          <View style={styles.yinYangContainer}>
            <View style={styles.yinYangBar}>
              <View
                style={[
                  styles.yangBar,
                  { flex: yinYang.yang },
                ]}
              >
                <Text style={styles.yangText}>양 {yinYang.yang}</Text>
              </View>
              <View
                style={[
                  styles.yinBar,
                  { flex: yinYang.yin },
                ]}
              >
                <Text style={styles.yinText}>음 {yinYang.yin}</Text>
              </View>
            </View>
          </View>
          <View style={styles.easyResultBox}>
            <Text style={styles.easyResultTitle}>氣 내 음양 분석</Text>
            <Text style={styles.easyResultText}>{simpleExplanation.yinYangBalance}</Text>
          </View>
        </Card>

        {/* 십신 */}
        <Card title="십신 - 나와 세상의 관계" style={styles.card}>
          <View style={styles.easyExplainBox}>
            <Text style={styles.easyExplainTitle}>十神 십신이란?</Text>
            <Text style={styles.easyExplainText}>
              나(일간)를 기준으로 다른 글자들과의 관계를 나타냅니다.{'\n'}
              마치 가족 관계처럼, 기운들 사이에도 관계가 있어요!
            </Text>
          </View>
          <View style={styles.tenGodsContainer}>
            <View style={styles.tenGodItem}>
              <View style={styles.tenGodHeader}>
                <Text style={styles.tenGodPillarBadge}>년주</Text>
                <Text style={styles.tenGodDescription}>조상/부모 · 어린 시절</Text>
              </View>
              <Text style={styles.tenGodValue}>{tenGods.year || '-'}</Text>
              {tenGods.year && (
                <Text style={styles.tenGodExplain}>
                  {tenGods.year === '비견' && '→ 친구나 동료 같은 에너지. 협력도 하고 경쟁도 하는 관계입니다.'}
                  {tenGods.year === '겁재' && '→ 형제자매 같은 에너지. 함께하면 힘이 되지만 욕심은 금물!'}
                  {tenGods.year === '식신' && '→ 표현력과 식복의 에너지. 말솜씨가 좋고 먹는 즐거움을 아는 타입.'}
                  {tenGods.year === '상관' && '→ 창의력과 자유의 에너지. 규칙보다 창작을 좋아하는 예술가 기질.'}
                  {tenGods.year === '편재' && '→ 재물을 움직이는 에너지. 사업 수완이 있고 투자 감각이 좋아요.'}
                  {tenGods.year === '정재' && '→ 꾸준히 모으는 에너지. 성실하게 일해서 차곡차곡 재물을 모읍니다.'}
                  {tenGods.year === '편관' && '→ 통솔하는 에너지. 리더십이 있고 조직을 이끄는 능력이 있어요.'}
                  {tenGods.year === '정관' && '→ 명예와 안정의 에너지. 사회적 인정과 직장운이 좋습니다.'}
                  {tenGods.year === '편인' && '→ 독특한 지혜의 에너지. 창의적 사고와 특별한 재능이 있어요.'}
                  {tenGods.year === '정인' && '→ 배움의 에너지. 학업운이 좋고 좋은 스승을 만나기 쉬워요.'}
                </Text>
              )}
            </View>
            <View style={styles.tenGodItem}>
              <View style={styles.tenGodHeader}>
                <Text style={styles.tenGodPillarBadge}>월주</Text>
                <Text style={styles.tenGodDescription}>사회생활 · 직장운</Text>
              </View>
              <Text style={styles.tenGodValue}>{tenGods.month || '-'}</Text>
              {tenGods.month && (
                <Text style={styles.tenGodExplain}>
                  {tenGods.month === '비견' && '→ 직장에서 동료와의 협력이 중요합니다. 팀워크를 발휘하세요.'}
                  {tenGods.month === '겁재' && '→ 동업이나 협업에서 역할 분담이 명확해야 합니다.'}
                  {tenGods.month === '식신' && '→ 창작, 요리, 서비스 분야에서 능력을 발휘합니다.'}
                  {tenGods.month === '상관' && '→ 자유로운 환경이 맞아요. 프리랜서나 예술 분야 추천.'}
                  {tenGods.month === '편재' && '→ 사업이나 영업 분야에서 성과를 내기 좋습니다.'}
                  {tenGods.month === '정재' && '→ 안정적인 직장에서 꾸준히 성장하는 타입입니다.'}
                  {tenGods.month === '편관' && '→ 관리직, 리더 역할에서 능력을 발휘합니다.'}
                  {tenGods.month === '정관' && '→ 공무원, 대기업 등 안정적인 조직과 잘 맞습니다.'}
                  {tenGods.month === '편인' && '→ 기술직, 연구직 등 전문 분야에서 두각을 나타냅니다.'}
                  {tenGods.month === '정인' && '→ 교육, 컨설팅 등 지식을 활용하는 분야에 적합합니다.'}
                </Text>
              )}
            </View>
            {tenGods.hour && (
              <View style={styles.tenGodItem}>
                <View style={styles.tenGodHeader}>
                  <Text style={styles.tenGodPillarBadge}>시주</Text>
                  <Text style={styles.tenGodDescription}>자녀운 · 말년</Text>
                </View>
                <Text style={styles.tenGodValue}>{tenGods.hour}</Text>
                <Text style={styles.tenGodExplain}>
                  {tenGods.hour === '비견' && '→ 말년에 친구나 동료가 많고, 자녀도 독립적인 성향입니다.'}
                  {tenGods.hour === '겁재' && '→ 말년에 형제자매나 친구와의 관계가 중요해집니다.'}
                  {tenGods.hour === '식신' && '→ 말년에 먹는 복이 있고, 자녀복도 좋습니다.'}
                  {tenGods.hour === '상관' && '→ 말년에 창작 활동이나 취미생활이 활발해집니다.'}
                  {tenGods.hour === '편재' && '→ 말년에 재물운이 좋고, 자녀가 사업 수완이 있습니다.'}
                  {tenGods.hour === '정재' && '→ 말년에 안정적인 재물운, 자녀가 성실합니다.'}
                  {tenGods.hour === '편관' && '→ 말년에 사회적 활동이 활발하고, 자녀가 리더십이 있습니다.'}
                  {tenGods.hour === '정관' && '→ 말년에 명예로운 생활, 자녀가 안정적인 삶을 삽니다.'}
                  {tenGods.hour === '편인' && '→ 말년에 배움을 즐기고, 자녀가 독특한 재능이 있습니다.'}
                  {tenGods.hour === '정인' && '→ 말년에 학문을 즐기고, 자녀가 효도하는 타입입니다.'}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* 합충 관계 */}
        {(relations.clashes.length > 0 || relations.combines.length > 0) && (
          <Card title="합충 - 기운의 조화와 충돌" style={styles.card}>
            <View style={styles.easyExplainBox}>
              <Text style={styles.easyExplainTitle}>合沖 합충이란?</Text>
              <Text style={styles.easyExplainText}>
                사주 글자들끼리 서로 영향을 주고받는 관계예요.{'\n'}
                • 합(合): 두 글자가 서로 끌려 새로운 기운을 만듭니다{'\n'}
                • 충(沖): 두 글자가 부딪혀 변화와 움직임이 생깁니다{'\n\n'}
                합충은 좋고 나쁨이 아니라, 삶의 특성을 나타냅니다!
              </Text>
            </View>
            {relations.combines.length > 0 && (
              <View style={styles.combineSection}>
                <Text style={styles.combineTitle}>合 합(合) - 서로 끌리는 관계</Text>
                <View style={styles.relationBadges}>
                  {relations.combines.map((combine: string, i: number) => (
                    <View key={i} style={[styles.relationBadge, styles.combineBadge]}>
                      <Text style={styles.combineText}>{combine}</Text>
                    </View>
                  ))}
                </View>
                {relations.combines.map((combine: string, i: number) => {
                  const combineDetails: Record<string, { meaning: string; effect: string; advice: string }> = {
                    '자축합': { meaning: '쥐(子)와 소(丑)의 만남 → 토(土)로 변화', effect: '안정을 추구하고 기반을 다지는 힘이 있습니다. 부동산, 안정적인 투자에 유리합니다.', advice: '변화보다 안정을 선택하는 것이 좋습니다.' },
                    '인해합': { meaning: '호랑이(寅)와 돼지(亥)의 만남 → 목(木)으로 변화', effect: '성장과 발전의 에너지가 강합니다. 새로운 시작, 학업, 자기계발에 유리합니다.', advice: '배움과 성장에 투자하세요.' },
                    '묘술합': { meaning: '토끼(卯)와 개(戌)의 만남 → 화(火)로 변화', effect: '열정과 활동의 기운이 있습니다. 사람들과의 교류, 표현 활동에 유리합니다.', advice: '적극적으로 나서면 좋은 결과가 있습니다.' },
                    '진유합': { meaning: '용(辰)과 닭(酉)의 만남 → 금(金)으로 변화', effect: '결단력과 실행력이 강해집니다. 투자, 계약, 결정에 유리합니다.', advice: '결정이 필요할 때 과감하게 선택하세요.' },
                    '사신합': { meaning: '뱀(巳)과 원숭이(申)의 만남 → 수(水)로 변화', effect: '지혜와 유연함의 기운이 있습니다. 지적 활동, 기획에 유리합니다.', advice: '머리를 쓰는 일에서 성과를 얻습니다.' },
                    '오미합': { meaning: '말(午)과 양(未)의 만남 → 토(土) 또는 화(火)', effect: '따뜻하고 포용력 있는 기운이 있습니다. 대인관계, 서비스업에 유리합니다.', advice: '사람들과 함께할 때 행운이 옵니다.' },
                  };
                  const detail = combineDetails[combine];
                  return detail ? (
                    <View key={i} style={styles.combineDetailBox}>
                      <Text style={styles.combineDetailTitle}>○ {combine}</Text>
                      <Text style={styles.combineDetailMeaning}>{detail.meaning}</Text>
                      <Text style={styles.combineDetailEffect}>• 효과: {detail.effect}</Text>
                      <Text style={styles.combineDetailAdvice}>• 조언: {detail.advice}</Text>
                    </View>
                  ) : null;
                })}
                <View style={styles.combineExplainBox}>
                  <Text style={styles.combineExplainText}>
                    합이 있으면 좋은 인연을 만나기 쉽고, 사람들과 조화롭게 지내는 편이에요.{'\n'}
                    협력 관계가 잘 이루어지고, 함께하면 더 좋은 결과를 얻을 수 있어요.
                  </Text>
                </View>
              </View>
            )}
            {relations.clashes.length > 0 && (
              <View style={styles.clashSection}>
                <Text style={styles.clashTitle}>沖 충(沖) - 부딪히는 관계</Text>
                <View style={styles.relationBadges}>
                  {relations.clashes.map((clash: string, i: number) => (
                    <View key={i} style={[styles.relationBadge, styles.clashBadge]}>
                      <Text style={styles.clashText}>{clash}</Text>
                    </View>
                  ))}
                </View>
                {relations.clashes.map((clash: string, i: number) => {
                  const clashDetails: Record<string, { meaning: string; effect: string; caution: string; positive: string }> = {
                    '자오충': { meaning: '쥐(子)와 말(午)의 충돌 - 남북 대립', effect: '급격한 변화, 이동수가 있습니다. 마음이 불안정하거나 갈등이 생길 수 있습니다.', caution: '급한 결정, 무리한 이동은 피하세요.', positive: '변화의 에너지를 활용하면 도약의 기회가 됩니다.' },
                    '축미충': { meaning: '소(丑)와 양(未)의 충돌 - 토끼리 충돌', effect: '재물, 부동산 관련 변동이 있을 수 있습니다. 고집으로 인한 갈등 주의.', caution: '재물 거래에 신중해야 합니다.', positive: '묵은 것을 정리하고 새출발할 수 있습니다.' },
                    '인신충': { meaning: '호랑이(寅)와 원숭이(申)의 충돌 - 역마충', effect: '이동, 변화가 많습니다. 직장, 건강에 변동이 있을 수 있습니다.', caution: '과로와 사고에 주의하세요.', positive: '활동적인 삶, 해외/출장 기회가 많습니다.' },
                    '묘유충': { meaning: '토끼(卯)와 닭(酉)의 충돌 - 동서 대립', effect: '대인관계 갈등, 구설수가 있을 수 있습니다. 문서 관련 주의.', caution: '말조심, 계약서 꼼꼼히 확인하세요.', positive: '결단력이 생기고 새로운 관계가 열립니다.' },
                    '진술충': { meaning: '용(辰)과 개(戌)의 충돌 - 관문충', effect: '환경 변화, 이사, 이직의 가능성이 있습니다.', caution: '급격한 변화에 적응 시간이 필요합니다.', positive: '새로운 기회, 새 터전에서의 시작에 유리합니다.' },
                    '사해충': { meaning: '뱀(巳)과 돼지(亥)의 충돌 - 역마충', effect: '여행, 이동, 변화가 많습니다. 해외 인연이 있을 수 있습니다.', caution: '물가, 여행 중 안전에 주의하세요.', positive: '글로벌한 기회, 새로운 경험이 많습니다.' },
                  };
                  const detail = clashDetails[clash];
                  return detail ? (
                    <View key={i} style={styles.clashDetailBox}>
                      <Text style={styles.clashDetailTitle}>○ {clash}</Text>
                      <Text style={styles.clashDetailMeaning}>{detail.meaning}</Text>
                      <Text style={styles.clashDetailEffect}>• 효과: {detail.effect}</Text>
                      <Text style={styles.clashDetailCaution}>• 주의: {detail.caution}</Text>
                      <Text style={styles.clashDetailPositive}>• 긍정적 측면: {detail.positive}</Text>
                    </View>
                  ) : null;
                })}
                <View style={styles.clashExplainBox}>
                  <Text style={styles.clashExplainText}>
                    {simpleExplanation.clashMeaning || '충이 있으면 변화가 많고 활동적인 삶을 살게 됩니다.'}
                  </Text>
                  <Text style={styles.clashTip}>
                    ※ 충이 나쁜 건 아닙니다. 변화의 에너지이므로 이사, 이직, 새로운 시작의 기회가 될 수 있어요.
                  </Text>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* 대운/세운 분석 */}
        <Card title="운의 흐름 (대운/세운)" style={styles.card}>
          <View style={styles.easyExplainBox}>
            <Text style={styles.easyExplainTitle}>運 대운/세운이란?</Text>
            <Text style={styles.easyExplainText}>
              • 대운(大運): 10년 단위로 바뀌는 인생의 큰 흐름{'\n'}
              • 세운(歲運): 매년 바뀌는 그해의 운세{'\n\n'}
              대운은 인생의 계절, 세운은 날씨와 같습니다.
            </Text>
          </View>

          {/* 현재 대운 */}
          <View style={styles.fortuneFlowSection}>
            <Text style={styles.fortuneFlowTitle}>大運 현재 대운 ({daeunInfo.direction})</Text>
            <View style={styles.currentFortuneBox}>
              <Text style={styles.currentFortuneAge}>만 {daeunInfo.age}세</Text>
              {daeunInfo.current && (
                <View style={styles.fortuneGanjiBox}>
                  <Text style={styles.fortuneGanji}>{daeunInfo.current.korean}</Text>
                  <Text style={styles.fortuneRange}>
                    {daeunInfo.current.startAge}~{daeunInfo.current.endAge}세
                  </Text>
                  <Text style={styles.fortuneElement}>
                    {elementToKorean(daeunInfo.current.stemElement)} / {elementToKorean(daeunInfo.current.branchElement)}
                  </Text>
                </View>
              )}
            </View>
            {/* 대운 해석 */}
            {daeunInfo.interpretation && (
              <View style={styles.fortuneInterpretation}>
                <Text style={styles.fortuneInterpretationText}>{daeunInfo.interpretation}</Text>
              </View>
            )}
          </View>

          {/* 대운 목록 */}
          <View style={styles.daeunListContainer}>
            <Text style={styles.daeunListTitle}>대운 흐름</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.daeunList}>
                {daeunInfo.list.map((daeun, index) => (
                  <View
                    key={index}
                    style={[
                      styles.daeunItem,
                      daeunInfo.current?.order === daeun.order && styles.daeunItemCurrent,
                    ]}
                  >
                    <Text style={styles.daeunGanji}>{daeun.korean}</Text>
                    <Text style={styles.daeunAge}>{daeun.startAge}~{daeun.endAge}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* 올해 세운 */}
          <View style={styles.fortuneFlowSection}>
            <Text style={styles.fortuneFlowTitle}>歲運 {saeunInfo.year}년 세운</Text>
            <View style={styles.saeunBox}>
              <View style={styles.saeunMain}>
                <Text style={styles.saeunGanji}>{saeunInfo.korean}</Text>
                <Text style={styles.saeunHanja}>({saeunInfo.hanja})</Text>
              </View>
              <View style={styles.saeunDetails}>
                <Text style={styles.saeunDetail}>• 띠: {saeunInfo.animal}띠</Text>
                <Text style={styles.saeunDetail}>• 천간: {saeunInfo.stem} - {elementToKorean(saeunInfo.stemElement)}</Text>
                <Text style={styles.saeunDetail}>• 지지: {saeunInfo.branch} - {elementToKorean(saeunInfo.branchElement)}</Text>
              </View>
            </View>
            {/* 세운 해석 */}
            {saeunInfo.interpretation && (
              <View style={styles.saeunInterpretation}>
                <Text style={styles.saeunInterpretationText}>{saeunInfo.interpretation}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* 용신 분석 및 행운 정보 */}
        <Card title="나의 용신 & 행운 정보" style={styles.card}>
          <View style={styles.easyExplainBox}>
            <Text style={styles.easyExplainTitle}>【用神】 용신이란?</Text>
            <Text style={styles.easyExplainText}>
              사주의 균형을 맞춰주는 나에게 필요한 오행입니다.{'\n'}
              용신의 기운을 활용하면 운이 좋아집니다.
            </Text>
          </View>

          {/* 신강/신약 */}
          <View style={styles.strengthSection}>
            <View style={styles.strengthBadge}>
              <Text style={styles.strengthText}>{yongsinInfo.strengthDesc}</Text>
            </View>
            <Text style={styles.strengthExplain}>{yongsinInfo.strengthExplain}</Text>
          </View>

          {/* 용신 정보 */}
          <View style={styles.yongsinSection}>
            <View style={styles.yongsinCard}>
              <Text style={styles.yongsinLabel}>用神 용신 (필요한 기운)</Text>
              <Text style={styles.yongsinElement}>{yongsinInfo.yongsin.korean}</Text>
            </View>
            <View style={[styles.yongsinCard, styles.gisinCard]}>
              <Text style={styles.gisinLabel}>忌神 기신 (피할 기운)</Text>
              <Text style={styles.gisinElement}>{yongsinInfo.gisin.korean}</Text>
            </View>
          </View>

          {/* 용신 활용 조언 */}
          {yongsinInfo.yongsin.advice && (
            <View style={styles.yongsinAdviceBox}>
              <Text style={styles.yongsinAdviceTitle}>【活用】 용신 활용법</Text>
              <Text style={styles.yongsinAdviceText}>{yongsinInfo.yongsin.advice}</Text>
            </View>
          )}

          {/* 기신 주의 경고 */}
          {yongsinInfo.gisin.warning && (
            <View style={styles.gisinWarningBox}>
              <Text style={styles.gisinWarningTitle}>【忌】 기신 주의사항</Text>
              <Text style={styles.gisinWarningText}>{yongsinInfo.gisin.warning}</Text>
            </View>
          )}

          {/* 행운 정보 */}
          <View style={styles.luckySection}>
            <Text style={styles.luckySectionTitle}>【吉】 나의 행운 정보</Text>
            <View style={styles.luckyGrid}>
              <View style={styles.luckyItem}>
                <Text style={styles.luckyLabel}>色 행운색</Text>
                <Text style={styles.luckyValue}>{yongsinInfo.yongsin.color}</Text>
              </View>
              <View style={styles.luckyItem}>
                <Text style={styles.luckyLabel}>方 행운방향</Text>
                <Text style={styles.luckyValue}>{yongsinInfo.yongsin.direction}</Text>
              </View>
              <View style={styles.luckyItem}>
                <Text style={styles.luckyLabel}>數 행운숫자</Text>
                <Text style={styles.luckyValue}>{yongsinInfo.yongsin.number}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* 건강 분석 */}
        <Card title="건강 취약점 분석" style={styles.card}>
          <View style={styles.easyExplainBox}>
            <Text style={styles.easyExplainTitle}>【健康】 오행과 건강</Text>
            <Text style={styles.easyExplainText}>
              사주에서 부족하거나 과한 오행은{'\n'}
              해당 장기에 취약할 수 있음을 나타냅니다.
            </Text>
          </View>

          {healthInfo.weakElements.length > 0 && (
            <View style={styles.healthSection}>
              <Text style={styles.healthSectionTitle}>【缺】 부족한 오행 - 주의 필요</Text>
              {healthInfo.weakElements.map((item: any, index: number) => (
                <View key={index} style={styles.healthItem}>
                  <Text style={styles.healthElement}>{elementToKorean(item.element)}</Text>
                  <View style={styles.healthInterpretationBox}>
                    <Text style={styles.healthInterpretationText}>{item.interpretation}</Text>
                  </View>
                  <View style={styles.healthDetailRow}>
                    <Text style={styles.healthDetailLabel}>관련 부위</Text>
                    <Text style={styles.healthDetailValue}>{item.organs}</Text>
                  </View>
                  <View style={styles.healthDetailRow}>
                    <Text style={styles.healthDetailLabel}>주의 증상</Text>
                    <Text style={styles.healthDetailValue}>{item.symptoms}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {healthInfo.strongElements.length > 0 && (
            <View style={styles.healthSection}>
              <Text style={styles.healthSectionTitle}>【過】 과다한 오행 - 관리 필요</Text>
              {healthInfo.strongElements.map((item: any, index: number) => (
                <View key={index} style={styles.healthItem}>
                  <Text style={styles.healthElement}>{elementToKorean(item.element)}</Text>
                  <View style={styles.healthInterpretationBox}>
                    <Text style={styles.healthInterpretationText}>{item.interpretation}</Text>
                  </View>
                  <View style={styles.healthDetailRow}>
                    <Text style={styles.healthDetailLabel}>관련 부위</Text>
                    <Text style={styles.healthDetailValue}>{item.organs}</Text>
                  </View>
                  <View style={styles.healthDetailRow}>
                    <Text style={styles.healthDetailLabel}>주의 증상</Text>
                    <Text style={styles.healthDetailValue}>{item.symptoms}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {healthInfo.weakElements.length === 0 && healthInfo.strongElements.length === 0 && (
            <View style={styles.easyResultBox}>
              <Text style={styles.easyResultTitle}>【和】 균형 잡힌 사주</Text>
              <Text style={styles.easyResultText}>
                오행이 비교적 균형 잡혀 있어 특별히 취약한 부위가 없습니다.{'\n'}
                전반적인 건강 관리에 신경 쓰시면 됩니다.
              </Text>
            </View>
          )}
        </Card>

        {/* 육친 분석 */}
        {familyInfo.length > 0 && (
          <Card title="육친 관계 분석" style={styles.card}>
            <View style={styles.easyExplainBox}>
              <Text style={styles.easyExplainTitle}>【六親】 육친이란?</Text>
              <Text style={styles.easyExplainText}>
                사주에서 나타나는 가족/인간관계의 특성입니다.{'\n'}
                각 주(柱)가 나타내는 관계와 의미를 해석합니다.
              </Text>
            </View>

            {familyInfo.map((item, index) => (
              <View key={index} style={styles.familyItem}>
                <View style={styles.familyHeader}>
                  <Text style={styles.familyPillar}>{item.pillar}</Text>
                  <Text style={styles.familyTenGod}>{item.tenGod}</Text>
                  <Text style={styles.familyRelationBadge}>{item.relation}</Text>
                </View>
                <View style={styles.familyInterpretationBox}>
                  <Text style={styles.familyInterpretationText}>{item.interpretation}</Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* 일주론 상세 분석 */}
        {iljuDetail && (
          <Card title="日柱 일주론 상세 분석" style={styles.card}>
            <View style={styles.easyExplainBox}>
              <Text style={styles.easyExplainTitle}>【日柱論】 일주론이란?</Text>
              <Text style={styles.easyExplainText}>
                일주(日柱)는 나를 가장 잘 나타내는 핵심 기둥입니다.{'\n'}
                60갑자 일주별로 타고난 성격과 인생의 특성을 상세히 해석합니다.
              </Text>
            </View>

            {/* 일주 제목 */}
            <View style={styles.iljuHeaderSection}>
              <Text style={styles.iljuTitle}>{iljuDetail.title}</Text>
              {iljuDetail.hanja && (
                <View style={styles.iljuHanjaBox}>
                  <Text style={styles.iljuHanja}>{iljuDetail.hanja}</Text>
                </View>
              )}
            </View>

            {/* 기본 성격 */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>【性】 기본 성격</Text>
              <Text style={styles.detailSectionText}>{iljuDetail.personality}</Text>
            </View>

            {/* 강점 */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>【長】 타고난 강점</Text>
              <Text style={styles.detailSectionText}>{iljuDetail.strengths}</Text>
            </View>

            {/* 약점 */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>【愼】 주의할 점</Text>
              <Text style={styles.detailSectionText}>{iljuDetail.weaknesses}</Text>
            </View>

            {/* 연애 */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>【緣】 연애 성향</Text>
              <Text style={styles.detailSectionText}>{iljuDetail.love}</Text>
            </View>

            {/* 직업 */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>【業】 적합한 직업</Text>
              <Text style={styles.detailSectionText}>{iljuDetail.career}</Text>
            </View>

            {/* 조언 */}
            <View style={styles.adviceBox}>
              <Text style={styles.adviceTitle}>【訓】 인생 조언</Text>
              <Text style={styles.adviceText}>{iljuDetail.advice}</Text>
            </View>
          </Card>
        )}

        {/* 연애/결혼운 분석 */}
        {loveInfo && (
          <Card title="緣 연애/결혼운 분석" style={styles.card}>
            <View style={styles.easyExplainBox}>
              <Text style={styles.easyExplainTitle}>【婚】 배우자궁과 배우자성</Text>
              <Text style={styles.easyExplainText}>
                • 배우자궁(日支): 일주의 지지로, 배우자의 특성을 나타냅니다{'\n'}
                • 배우자성: 정재/편재(남), 정관/편관(여)으로 인연 유형을 봅니다
              </Text>
            </View>

            {/* 연애 스타일 */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>【緣】 나의 연애 스타일</Text>
              <Text style={styles.detailSectionText}>{loveInfo.loveStyle.style}</Text>
            </View>

            {/* 이상형 */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>【配】 어울리는 이상형</Text>
              <Text style={styles.detailSectionText}>{loveInfo.loveStyle.idealType}</Text>
            </View>

            {/* 연애 주의점 */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>【愼】 연애 시 주의점</Text>
              <Text style={styles.detailSectionText}>{loveInfo.loveStyle.warning}</Text>
            </View>

            {/* 배우자 유형 */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>【配】 만나기 쉬운 배우자 유형</Text>
              <Text style={styles.detailSectionText}>{loveInfo.spouseType}</Text>
            </View>

            {/* 결혼 조언 */}
            <View style={styles.adviceBox}>
              <Text style={styles.adviceTitle}>【婚運】 결혼운 포인트</Text>
              <Text style={styles.adviceText}>{loveInfo.marriageHint}</Text>
            </View>
          </Card>
        )}

        {/* 재물운 분석 */}
        {wealthInfo && (
          <Card title="財 재물운 분석" style={styles.card}>
            <View style={styles.easyExplainBox}>
              <Text style={styles.easyExplainTitle}>【財星】 재성이란?</Text>
              <Text style={styles.easyExplainText}>
                사주에서 재물을 나타내는 별입니다.{'\n'}
                • 정재(正財): 꾸준히 모으는 안정적 재물{'\n'}
                • 편재(偏財): 사업수완, 투자로 버는 재물
              </Text>
            </View>

            {/* 재물 스타일 */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>【財運】 나의 재물 스타일</Text>
              <Text style={styles.detailSectionText}>{wealthInfo.wealthStyle}</Text>
            </View>

            {/* 일간별 재물 특성 */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>【日干】 일간별 재물 특성</Text>
              <Text style={styles.detailSectionText}>{wealthInfo.dayMasterWealth}</Text>
            </View>

            {/* 투자 스타일 */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>【投資】 투자/사업 스타일</Text>
              <Text style={styles.detailSectionText}>{wealthInfo.investmentStyle}</Text>
            </View>

            {/* 재물 조언 */}
            <View style={styles.adviceBox}>
              <Text style={styles.adviceTitle}>【訓】 재물운 조언</Text>
              <Text style={styles.adviceText}>{wealthInfo.wealthAdvice}</Text>
            </View>
          </Card>
        )}

        {/* 직업적성 상세 분석 */}
        {careerDetail && (
          <Card title="業 직업적성 상세 분석" style={styles.card}>
            <View style={styles.easyExplainBox}>
              <Text style={styles.easyExplainTitle}>【月柱】 월주 십신과 직업</Text>
              <Text style={styles.easyExplainText}>
                월주는 사회생활과 직장운을 나타내며,{'\n'}
                월주의 십신으로 적합한 직업 분야를 알 수 있습니다.
              </Text>
            </View>

            {/* 적합 분야 */}
            {careerDetail.careerInfo && (
              <>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>【分野】 적합한 분야</Text>
                  <Text style={styles.detailSectionText}>{careerDetail.careerInfo.field}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>【適職】 추천 직업</Text>
                  <Text style={styles.detailSectionText}>{careerDetail.careerInfo.specific.join(', ')}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>【術】 업무 스타일</Text>
                  <Text style={styles.detailSectionText}>{careerDetail.careerInfo.style}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>【成功】 성공 포인트</Text>
                  <Text style={styles.detailSectionText}>{careerDetail.careerInfo.success}</Text>
                </View>
              </>
            )}

            {/* 일간별 직업 특성 */}
            <View style={styles.adviceBox}>
              <Text style={styles.adviceTitle}>【訓】 일간별 직업 조언</Text>
              <Text style={styles.adviceText}>{careerDetail.dayMasterCareer}</Text>
            </View>
          </Card>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  card: {
    marginBottom: SPACING.md,
  },
  pillarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
  },
  dayMasterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  dayMasterMain: {
    alignItems: 'center',
    marginRight: SPACING.xl,
  },
  dayMasterChar: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dayMasterMeaning: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  dayMasterDetails: {
    flex: 1,
  },
  dayMasterDetail: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  detailLabel: {
    width: 40,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  traitsContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.md,
  },
  traitRow: {
    marginBottom: SPACING.sm,
  },
  traitLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  traitValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  keywordBadge: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  keywordText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  yinYangContainer: {
    paddingVertical: SPACING.sm,
  },
  yinYangBar: {
    flexDirection: 'row',
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  yangBar: {
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yinBar: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yangText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: FONT_SIZES.sm,
  },
  yinText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: FONT_SIZES.sm,
  },
  tenGodsContainer: {
    gap: SPACING.md,
  },
  tenGodItem: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  tenGodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tenGodPillarBadge: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.white,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.sm,
  },
  tenGodDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  tenGodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tenGodLabel: {
    width: 50,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  tenGodValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  tenGodExplain: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  tenGodMeaning: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  relationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  relationLabel: {
    width: 50,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  relationBadges: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  relationBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  combineBadge: {
    backgroundColor: `${COLORS.success}20`,
  },
  combineText: {
    color: COLORS.success,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  clashBadge: {
    backgroundColor: `${COLORS.error}20`,
  },
  clashText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  // 합충 섹션 스타일
  combineSection: {
    marginBottom: SPACING.lg,
  },
  combineTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#059669',
    marginBottom: SPACING.sm,
  },
  combineExplainBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  combineExplainText: {
    fontSize: FONT_SIZES.sm,
    color: '#065F46',
    lineHeight: 20,
  },
  clashSection: {
    marginBottom: SPACING.md,
  },
  clashTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: SPACING.sm,
  },
  clashExplainBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  clashExplainText: {
    fontSize: FONT_SIZES.sm,
    color: '#991B1B',
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  clashTip: {
    fontSize: FONT_SIZES.sm,
    color: '#047857',
    backgroundColor: '#D1FAE5',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  // 기타 스타일
  pillarExplainBox: {
    backgroundColor: '#F5F5F4',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  pillarExplainText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
  // 쉬운 설명 카드 스타일
  simpleExplanationCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#FCD34D',
    ...SHADOWS.sm,
  },
  simpleExplanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  simpleExplanationEmoji: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  simpleExplanationTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: '#92400E',
  },
  simpleExplanationSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: '#B45309',
    marginBottom: SPACING.lg,
  },
  simpleSection: {
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  simpleSectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#78350F',
    marginBottom: SPACING.sm,
  },
  simpleSectionContent: {
    fontSize: FONT_SIZES.md,
    color: '#451A03',
    lineHeight: 24,
  },
  simpleTip: {
    fontSize: FONT_SIZES.sm,
    color: '#92400E',
    marginTop: SPACING.sm,
    fontStyle: 'italic',
    backgroundColor: '#FEF3C7',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  adviceSection: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
    paddingLeft: SPACING.md,
    marginTop: SPACING.md,
  },
  // 쉬운 설명 박스 스타일 (각 카드 내부용)
  easyExplainBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  easyExplainTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: SPACING.sm,
  },
  easyExplainText: {
    fontSize: FONT_SIZES.sm,
    color: '#1E3A8A',
    lineHeight: 20,
  },
  easyResultBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  easyResultTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: SPACING.sm,
  },
  easyResultText: {
    fontSize: FONT_SIZES.sm,
    color: '#064E3B',
    lineHeight: 20,
  },
  relationSection: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  relationMeaning: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginLeft: 50,
    lineHeight: 18,
  },
  // 대운/세운 스타일
  fortuneFlowSection: {
    marginBottom: SPACING.lg,
  },
  fortuneFlowTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  currentFortuneBox: {
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentFortuneAge: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  fortuneGanjiBox: {
    alignItems: 'center',
  },
  fortuneGanji: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  fortuneRange: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  fortuneElement: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  daeunListContainer: {
    marginBottom: SPACING.lg,
  },
  daeunListTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  daeunList: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  daeunItem: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    minWidth: 60,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  daeunItemCurrent: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
  },
  daeunGanji: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  daeunAge: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  saeunBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  saeunMain: {
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  saeunGanji: {
    fontSize: 32,
    fontWeight: '700',
    color: '#92400E',
  },
  saeunHanja: {
    fontSize: FONT_SIZES.sm,
    color: '#B45309',
  },
  saeunDetails: {
    flex: 1,
  },
  saeunDetail: {
    fontSize: FONT_SIZES.sm,
    color: '#78350F',
    marginBottom: 4,
  },
  // 용신 스타일
  strengthSection: {
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  strengthBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.sm,
  },
  strengthText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  strengthExplain: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  yongsinSection: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  yongsinCard: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  gisinCard: {
    backgroundColor: '#FEF2F2',
  },
  yongsinLabel: {
    fontSize: FONT_SIZES.sm,
    color: '#065F46',
    marginBottom: SPACING.xs,
  },
  yongsinElement: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: '#059669',
  },
  gisinLabel: {
    fontSize: FONT_SIZES.sm,
    color: '#991B1B',
    marginBottom: SPACING.xs,
  },
  gisinElement: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: '#DC2626',
  },
  luckySection: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  luckySectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  luckyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  luckyItem: {
    alignItems: 'center',
  },
  luckyLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  luckyValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  // 건강 스타일
  healthSection: {
    marginBottom: SPACING.md,
  },
  healthSectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  healthItem: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  healthElement: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  healthOrgan: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  healthSymptom: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  healthAdvice: {
    fontSize: FONT_SIZES.sm,
    color: '#059669',
    marginTop: SPACING.xs,
  },
  healthInterpretationBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  healthInterpretationText: {
    fontSize: FONT_SIZES.sm,
    color: '#166534',
    lineHeight: 20,
  },
  healthDetailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  healthDetailLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    width: 70,
  },
  healthDetailValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    flex: 1,
  },
  // 육친 스타일
  familyItem: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  familyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  familyPillar: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.white,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  familyTenGod: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  familyRelationBadge: {
    fontSize: FONT_SIZES.sm,
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  familyInterpretationBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  familyInterpretationText: {
    fontSize: FONT_SIZES.sm,
    color: '#92400E',
    lineHeight: 20,
  },
  familyRelation: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  familyMeaning: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  // 대운/세운 해석 스타일
  fortuneInterpretation: {
    backgroundColor: '#EEF2FF',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  fortuneInterpretationText: {
    fontSize: FONT_SIZES.sm,
    color: '#3730A3',
    lineHeight: 20,
  },
  saeunInterpretation: {
    backgroundColor: '#FEF3C7',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  saeunInterpretationText: {
    fontSize: FONT_SIZES.sm,
    color: '#92400E',
    lineHeight: 20,
  },
  // 용신 조언/경고 스타일
  yongsinAdviceBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  yongsinAdviceTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: SPACING.xs,
  },
  yongsinAdviceText: {
    fontSize: FONT_SIZES.sm,
    color: '#047857',
    lineHeight: 20,
  },
  gisinWarningBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  gisinWarningTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: SPACING.xs,
  },
  gisinWarningText: {
    fontSize: FONT_SIZES.sm,
    color: '#B91C1C',
    lineHeight: 20,
  },
  // 일주론/상세 분석 스타일
  iljuHeaderSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  iljuTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  iljuHanjaBox: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  iljuHanja: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.primary,
  },
  detailSection: {
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailSectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  detailSectionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  adviceBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  adviceTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: SPACING.sm,
  },
  adviceText: {
    fontSize: FONT_SIZES.sm,
    color: '#78350F',
    lineHeight: 22,
  },
  // 합충 상세 설명 스타일
  combineDetailBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  combineDetailTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: SPACING.xs,
  },
  combineDetailMeaning: {
    fontSize: FONT_SIZES.sm,
    color: '#047857',
    marginBottom: SPACING.xs,
    fontStyle: 'italic',
  },
  combineDetailEffect: {
    fontSize: FONT_SIZES.sm,
    color: '#064E3B',
    lineHeight: 20,
    marginBottom: 4,
  },
  combineDetailAdvice: {
    fontSize: FONT_SIZES.sm,
    color: '#059669',
    lineHeight: 20,
    fontWeight: '500',
  },
  clashDetailBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  clashDetailTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: SPACING.xs,
  },
  clashDetailMeaning: {
    fontSize: FONT_SIZES.sm,
    color: '#B91C1C',
    marginBottom: SPACING.xs,
    fontStyle: 'italic',
  },
  clashDetailEffect: {
    fontSize: FONT_SIZES.sm,
    color: '#7F1D1D',
    lineHeight: 20,
    marginBottom: 4,
  },
  clashDetailCaution: {
    fontSize: FONT_SIZES.sm,
    color: '#DC2626',
    lineHeight: 20,
    marginBottom: 4,
  },
  clashDetailPositive: {
    fontSize: FONT_SIZES.sm,
    color: '#059669',
    lineHeight: 20,
    fontWeight: '500',
    backgroundColor: '#ECFDF5',
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.xs,
  },
});
