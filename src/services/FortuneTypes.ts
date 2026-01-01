/**
 * 다양한 운세 종류 생성기
 * 각 운세는 출처가 명확한 전통 자료를 기반으로 합니다.
 */

// ============================================
// 공통: 용신 기반 행운 정보 (하도낙서 河圖洛書 기반)
// ============================================

// 오행별 행운 숫자 (하도낙서 기반)
const ELEMENT_LUCKY_NUMBERS: Record<string, string> = {
  '목': '3, 8',
  '화': '2, 7',
  '토': '5, 10',
  '금': '4, 9',
  '수': '1, 6',
};

// 오행별 행운 색상
const ELEMENT_LUCKY_COLORS: Record<string, string> = {
  '목': '초록색',
  '화': '빨간색',
  '토': '노란색',
  '금': '흰색',
  '수': '검은색',
};

// 오행별 행운 방향
const ELEMENT_LUCKY_DIRECTIONS: Record<string, string> = {
  '목': '동쪽',
  '화': '남쪽',
  '토': '중앙',
  '금': '서쪽',
  '수': '북쪽',
};

// 천간에서 오행 추출
const STEM_TO_ELEMENT: Record<string, string> = {
  '갑': '목', '을': '목', '병': '화', '정': '화', '무': '토',
  '기': '토', '경': '금', '신': '금', '임': '수', '계': '수',
};

// 오행 상생 관계
const FIVE_ELEMENTS_GENERATES: Record<string, string> = {
  '목': '화', '화': '토', '토': '금', '금': '수', '수': '목',
};

/**
 * 일간(dayMaster)에서 용신을 계산하고 해당 오행의 행운 정보 반환
 * 억부용신(抑扶用神) 간소화 버전: 일간이 강하면 설기, 약하면 생조
 */
export function getYongsinBasedLuckyInfo(dayMaster: string): {
  yongsinElement: string;
  number: string;
  color: string;
  direction: string;
} {
  const dayMasterElement = STEM_TO_ELEMENT[dayMaster] || '목';

  // 간소화된 용신 결정: 일간 오행을 생해주는 오행이 용신 (생조 방식)
  // 실제로는 사주 전체 분석이 필요하지만, 여기서는 일관성을 위해 생조 방식 사용
  const generatesMe = Object.keys(FIVE_ELEMENTS_GENERATES).find(
    k => FIVE_ELEMENTS_GENERATES[k] === dayMasterElement
  ) || '수';

  return {
    yongsinElement: generatesMe,
    number: ELEMENT_LUCKY_NUMBERS[generatesMe] || '5, 10',
    color: ELEMENT_LUCKY_COLORS[generatesMe] || '노란색',
    direction: ELEMENT_LUCKY_DIRECTIONS[generatesMe] || '중앙',
  };
}

// ============================================
// 신년운세 (명리학 대운/세운론 기반)
// ============================================

// 60갑자 천간지지 순환 (년도 계산용)
const HEAVENLY_STEMS_CYCLE = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const EARTHLY_BRANCHES_CYCLE = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
const BRANCH_ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
const BRANCH_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const STEM_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// 현재 연도의 천간지지 계산
function getYearGanji(year: number): { stem: string; branch: string; stemHanja: string; branchHanja: string; animal: string } {
  const stemIndex = (year - 4) % 10;
  const branchIndex = (year - 4) % 12;
  return {
    stem: HEAVENLY_STEMS_CYCLE[stemIndex],
    branch: EARTHLY_BRANCHES_CYCLE[branchIndex],
    stemHanja: STEM_HANJA[stemIndex],
    branchHanja: BRANCH_HANJA[branchIndex],
    animal: BRANCH_ANIMALS[branchIndex],
  };
}

// 천간 오행
const STEM_ELEMENTS: Record<string, string> = {
  '갑': '목', '을': '목', '병': '화', '정': '화', '무': '토',
  '기': '토', '경': '금', '신': '금', '임': '수', '계': '수',
};

// 십신 관계 계산
function getTenGodRelation(myStem: string, yearStem: string): string {
  const myElement = STEM_ELEMENTS[myStem];
  const yearElement = STEM_ELEMENTS[yearStem];

  const generates: Record<string, string> = { '목': '화', '화': '토', '토': '금', '금': '수', '수': '목' };
  const controls: Record<string, string> = { '목': '토', '토': '수', '수': '화', '화': '금', '금': '목' };

  const myYin = ['을', '정', '기', '신', '계'].includes(myStem);
  const yearYin = ['을', '정', '기', '신', '계'].includes(yearStem);
  const samePolarity = myYin === yearYin;

  if (myElement === yearElement) return samePolarity ? '비견' : '겁재';
  if (generates[myElement] === yearElement) return samePolarity ? '식신' : '상관';
  if (generates[yearElement] === myElement) return samePolarity ? '정인' : '편인';
  if (controls[myElement] === yearElement) return samePolarity ? '정재' : '편재';
  if (controls[yearElement] === myElement) return samePolarity ? '정관' : '편관';
  return '비견';
}

// 십신별 운세 해석
const TEN_GOD_FORTUNES: Record<string, { summary: string; score: number; advice: string }> = {
  '비견': { summary: '동료나 형제와의 협력이 중요한 해입니다. 경쟁보다 협력을 통해 발전할 수 있습니다.', score: 75, advice: '혼자서 무리하기보다 주변의 도움을 받으세요.' },
  '겁재': { summary: '경쟁과 도전의 해입니다. 자신감을 갖고 적극적으로 나서면 좋은 성과가 있습니다.', score: 72, advice: '과한 경쟁심은 줄이고 협력을 모색하세요.' },
  '식신': { summary: '건강운과 식복이 좋은 해입니다. 음식 관련 일에서 좋은 성과가 기대됩니다.', score: 83, advice: '건강관리에 투자하면 좋은 결과가 있습니다.' },
  '상관': { summary: '표현력이 좋아지며 예술이나 창작 활동에 좋은 해입니다.', score: 78, advice: '긍정적인 표현으로 좋은 인연을 만드세요.' },
  '정재': { summary: '재물운이 좋으며 투자나 사업에서 좋은 성과가 기대됩니다.', score: 90, advice: '안정적인 투자가 큰 수익으로 돌아옵니다.' },
  '편재': { summary: '부수입이나 부업에서 좋은 성과가 있을 수 있습니다.', score: 82, advice: '새로운 수입원을 적극적으로 모색하세요.' },
  '정관': { summary: '직장운이 좋으며 승진이나 취업에 유리한 해입니다.', score: 88, advice: '책임감 있는 자세가 좋은 결과를 가져옵니다.' },
  '편관': { summary: '변화와 도약의 기회가 있는 해입니다.', score: 72, advice: '변화를 기회로 삼아 적극적으로 도전하세요.' },
  '정인': { summary: '학업운과 학습운이 좋으며 자격증이나 공부에 좋은 시기입니다.', score: 85, advice: '배움에 투자하면 좋은 결실을 맺을 수 있습니다.' },
  '편인': { summary: '창의적인 아이디어가 빛나는 해로 예술과 문화 분야에서 좋은 성과가 기대됩니다.', score: 80, advice: '새로운 분야에 도전해보세요.' },
};

// 월별 운세 생성 (12운성 기반)
function generateMonthlyFortune(): Array<{month: number; content: string; luck: 'good' | 'normal' | 'bad'}> {
  const monthly = [];
  const monthlyHints = [
    { luck: 'good' as const, content: '새로운 시작에 좋은 달입니다. 계획했던 일을 추진하세요.' },
    { luck: 'normal' as const, content: '평온한 달입니다. 내실을 다지기 좋습니다.' },
    { luck: 'good' as const, content: '인간관계가 활발해지는 달입니다. 네트워킹에 좋습니다.' },
    { luck: 'normal' as const, content: '안정적인 달입니다. 큰 변화는 피하세요.' },
    { luck: 'good' as const, content: '재물운이 좋은 달입니다. 투자에 좋은 시기입니다.' },
    { luck: 'bad' as const, content: '주의가 필요한 달입니다. 건강관리에 신경쓰세요.' },
    { luck: 'good' as const, content: '직장운이 좋은 달입니다. 승진이나 이직에 좋습니다.' },
    { luck: 'normal' as const, content: '평화로운 달입니다. 가족과 시간을 보내세요.' },
    { luck: 'good' as const, content: '학업운이 좋은 달입니다. 공부나 자격증에 좋습니다.' },
    { luck: 'bad' as const, content: '구설수에 주의하세요. 말조심이 필요합니다.' },
    { luck: 'good' as const, content: '하반기 마무리에 좋은 달입니다. 성과를 정리하세요.' },
    { luck: 'normal' as const, content: '새해 준비에 좋은 달입니다. 계획을 세우세요.' },
  ];

  for (let i = 1; i <= 12; i++) {
    monthly.push({
      month: i,
      ...monthlyHints[i - 1],
    });
  }

  return monthly;
}

export function generateYearlyFortune(birthDate: string, dayMaster: string) {
  const currentYear = new Date().getFullYear();
  const yearInfo = getYearGanji(currentYear);
  const yearName = `${yearInfo.stem}${yearInfo.branch}년(${yearInfo.stemHanja}${yearInfo.branchHanja}年)`;
  const animalName = `${yearInfo.animal}띠 해`;

  // 십신 관계 계산
  const tenGod = getTenGodRelation(dayMaster, yearInfo.stem);
  const fortune = TEN_GOD_FORTUNES[tenGod] || TEN_GOD_FORTUNES['비견'];

  // 지지 오행 (올해 띠의 오행)
  const branchElements: Record<string, string> = {
    '자': '수', '축': '토', '인': '목', '묘': '목', '진': '토', '사': '화',
    '오': '화', '미': '토', '신': '금', '유': '금', '술': '토', '해': '수',
  };
  const yearElement = branchElements[yearInfo.branch] || '토';
  const elementNames: Record<string, string> = { '목': '木', '화': '火', '토': '土', '금': '金', '수': '水' };

  // 용신 색상
  const elementColors: Record<string, string> = { '목': '초록색', '화': '빨간색', '토': '노란색', '금': '흰색', '수': '검은색' };
  const elementNumbers: Record<string, string> = { '목': '3, 8', '화': '2, 7', '토': '5, 10', '금': '4, 9', '수': '1, 6' };
  const elementDirections: Record<string, string> = { '목': '동쪽', '화': '남쪽', '토': '중앙', '금': '서쪽', '수': '북쪽' };
  const elementItems: Record<string, string> = { '목': '식물', '화': '조명', '토': '도자기', '금': '금속 장신구', '수': '수정' };

  return {
    summary: `${currentYear}년 ${yearName}은 ${dayMaster} 일간에게 ${tenGod}(${tenGod === '비견' || tenGod === '겁재' ? '比劫' : tenGod})의 해입니다. ${fortune.summary}`,
    score: fortune.score,
    yearInfo: {
      year: currentYear,
      name: yearName,
      animal: animalName,
      tenGod: tenGod,
    },
    categories: [
      {
        emoji: '💰',
        title: '재물운',
        content: `${yearName}은 ${yearElement}(${elementNames[yearElement]})의 기운이 강한 해입니다. ${tenGod === '정재' || tenGod === '편재' ? '재물운이 특히 좋아 투자나 사업에서 좋은 성과가 기대됩니다.' : '재물의 흐름이 활발해지며, 꾸준한 노력이 결실을 맺습니다.'}`,
        score: tenGod === '정재' ? 90 : tenGod === '편재' ? 85 : 78,
        advice: '안정적인 재테크가 큰 수익으로 돌아옵니다.',
      },
      {
        emoji: '💼',
        title: '직장/사업운',
        content: `${tenGod === '정관' || tenGod === '편관' ? '직장운이 특히 좋은 해입니다. 승진이나 이직에 유리한 시기입니다.' : '변화의 기운이 있는 해입니다. 새로운 기회가 찾아올 수 있으니 준비하세요.'}`,
        score: tenGod === '정관' ? 88 : tenGod === '편관' ? 80 : 78,
        advice: '준비된 기회에 도전하면 좋은 결과가 있습니다.',
      },
      {
        emoji: '❤️',
        title: '애정운',
        content: '인연을 만나기 좋은 해입니다. 적극적으로 활동하면 좋은 만남이 있습니다. 연인이 있다면 관계가 더욱 깊어질 수 있습니다.',
        score: 75 + (fortune.score % 10),
        advice: '상대방의 이야기에 귀 기울이면 관계가 더 좋아집니다.',
      },
      {
        emoji: '🏥',
        title: '건강운',
        content: `${yearElement}(${elementNames[yearElement]}) 기운이 강한 해이므로 ${yearElement === '화' ? '심장, 혈압' : yearElement === '목' ? '간, 눈' : yearElement === '금' ? '폐, 피부' : yearElement === '수' ? '신장, 뼈' : '소화기'} 관련 건강에 신경 쓰세요.`,
        score: 72 + (fortune.score % 8),
        advice: '규칙적인 운동과 충분한 휴식이 건강의 비결입니다.',
      },
      {
        emoji: '👨‍👩‍👧‍👦',
        title: '형제/동료운',
        content: `${tenGod === '비견' || tenGod === '겁재' ? '형제자매나 동료와의 관계가 특히 중요한 해입니다. 협력하면 큰 성과를 얻을 수 있습니다.' : '주변 사람들과의 조화가 좋은 해입니다. 네트워킹이 새로운 기회를 가져옵니다.'}`,
        score: tenGod === '비견' ? 78 : 70 + (fortune.score % 10),
        advice: '협력과 배려가 좋은 관계를 만듭니다.',
      },
    ],
    monthly: generateMonthlyFortune(),
    luckyInfo: {
      ...getYongsinBasedLuckyInfo(dayMaster),
      item: elementItems[getYongsinBasedLuckyInfo(dayMaster).yongsinElement] || '도자기',
    },
    tip: `${currentYear}년은 ${yearInfo.animal}의 해입니다. ${fortune.advice}`,
  };
}

// ============================================
// 토정비결 (조선시대 토정 이지함 선생 저술 기반)
// ============================================

// 토정비결 괘(卦) 해석 (64괘 중 대표적인 것들)
const TOJEONG_FORTUNES: Array<{
  name: string;
  fortune: string;
  advice: string;
  lucky: 'great' | 'good' | 'normal' | 'caution';
}> = [
  {
    name: '건위천(乾爲天)',
    fortune: '하늘이 높고 넓으니 만사형통하는 상입니다. 적극적으로 나아가면 좋은 결과가 있을 것입니다.',
    advice: '겸손을 잃지 않으면 더 큰 복이 옵니다.',
    lucky: 'great',
  },
  {
    name: '곤위지(坤爲地)',
    fortune: '땅처럼 낮은 자세로 내실을 다지는 것이 좋은 해입니다. 욕심을 버리고 충실하게 생활하세요.',
    advice: '인내하면 때가 오니 조급해하지 마세요.',
    lucky: 'good',
  },
  {
    name: '수뢰둔(水雷屯)',
    fortune: '초창기의 어려움이 있으나 꾸준히 나아가면 결국 성공할 수 있습니다.',
    advice: '어려울 때일수록 기본에 충실하세요.',
    lucky: 'normal',
  },
  {
    name: '산수몽(山水蒙)',
    fortune: '배움의 해입니다. 새로운 것을 배우거나 실력을 쌓기에 좋은 해입니다.',
    advice: '스승이나 선배의 조언을 귀담아 들으세요.',
    lucky: 'good',
  },
  {
    name: '화천대유(火天大有)',
    fortune: '크게 얻는 상입니다. 재물운과 명예운이 함께 좋아지는 대길한 해입니다.',
    advice: '베풀면 더 큰 복이 돌아옵니다.',
    lucky: 'great',
  },
  {
    name: '지산겸(地山謙)',
    fortune: '겸손하면 복이 오는 해입니다. 낮은 자세로 일하면 인정받을 수 있습니다.',
    advice: '자만하지 말고 한결같이 노력하세요.',
    lucky: 'good',
  },
  {
    name: '택지췌(澤地萃)',
    fortune: '모이는 상입니다. 사람들이 모이고 기회가 모이니 적극적으로 활동하세요.',
    advice: '좋은 인연을 소중히 하세요.',
    lucky: 'great',
  },
  {
    name: '산지박(山地剝)',
    fortune: '주의가 필요한 해입니다. 무리하지 말고 현상 유지에 집중하세요.',
    advice: '새로운 일은 미루고 기존 일에 충실하세요.',
    lucky: 'caution',
  },
];

export function generateTojeongFortune(birthDate: string, dayMaster: string = '갑') {
  // 생년월일로 괘 결정 (간단한 해시 함수 사용)
  const dateHash = birthDate.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fortuneIndex = dateHash % TOJEONG_FORTUNES.length;
  const fortune = TOJEONG_FORTUNES[fortuneIndex];

  return {
    summary: fortune.fortune,
    score: fortune.lucky === 'great' ? 90 : fortune.lucky === 'good' ? 78 : fortune.lucky === 'normal' ? 65 : 50,
    categories: [
      {
        emoji: '📜',
        title: '괘상 해석',
        content: `당신의 올해 괘는 "${fortune.name}"입니다.\n\n${fortune.fortune}`,
        advice: fortune.advice,
      },
      {
        emoji: '💰',
        title: '재물운',
        content: fortune.lucky === 'great' ? '재물이 모이는 상입니다. 투자나 저축에 좋은 해입니다.' :
                 fortune.lucky === 'good' ? '안정적인 재물운입니다. 무리하지 않으면 좋은 결과가 있습니다.' :
                 fortune.lucky === 'normal' ? '보통의 재물운입니다. 절약하고 검소하게 생활하세요.' :
                 '재물 손실에 주의하세요. 투자보다 저축이 좋습니다.',
        score: fortune.lucky === 'great' ? 88 : fortune.lucky === 'good' ? 75 : fortune.lucky === 'normal' ? 60 : 45,
      },
      {
        emoji: '👔',
        title: '직업운',
        content: fortune.lucky === 'great' ? '승진이나 성공의 기회가 많습니다. 적극적으로 도전하세요.' :
                 fortune.lucky === 'good' ? '안정적인 직업운입니다. 꾸준히 노력하면 인정받습니다.' :
                 fortune.lucky === 'normal' ? '무난한 직업운입니다. 현재 위치에서 최선을 다하세요.' :
                 '직장 생활에 어려움이 있을 수 있습니다. 인내가 필요합니다.',
        score: fortune.lucky === 'great' ? 90 : fortune.lucky === 'good' ? 78 : fortune.lucky === 'normal' ? 62 : 48,
      },
      {
        emoji: '❤️',
        title: '가정/인연운',
        content: fortune.lucky === 'great' ? '가정에 경사가 있을 수 있습니다. 좋은 인연도 기대됩니다.' :
                 fortune.lucky === 'good' ? '가족 간 화목한 해입니다. 인연운도 좋습니다.' :
                 fortune.lucky === 'normal' ? '평화로운 가정운입니다. 감사하는 마음을 갖으세요.' :
                 '가족 간 갈등에 주의하세요. 대화로 풀어가세요.',
        score: fortune.lucky === 'great' ? 85 : fortune.lucky === 'good' ? 72 : fortune.lucky === 'normal' ? 58 : 42,
      },
    ],
    luckyInfo: getYongsinBasedLuckyInfo(dayMaster),
    tip: fortune.lucky === 'caution'
      ? '올해는 내실을 다지는 해입니다. 차근차근 준비하면 다음 해에 더 큰 성과를 얻을 수 있습니다.'
      : '좋은 운에 겸손과 감사가 더해지면 복이 배가 됩니다.',
  };
}

// ============================================
// 별자리 운세 (서양 점성술 기반)
// ============================================

const ZODIAC_SIGNS: Record<string, {
  name: string;
  emoji: string;
  element: string;
  dates: [number, number, number, number]; // [시작월, 시작일, 끝월, 끝일]
}> = {
  aries: { name: '양자리', emoji: '♈', element: '불', dates: [3, 21, 4, 19] },
  taurus: { name: '황소자리', emoji: '♉', element: '흙', dates: [4, 20, 5, 20] },
  gemini: { name: '쌍둥이자리', emoji: '♊', element: '공기', dates: [5, 21, 6, 20] },
  cancer: { name: '게자리', emoji: '♋', element: '물', dates: [6, 21, 7, 22] },
  leo: { name: '사자자리', emoji: '♌', element: '불', dates: [7, 23, 8, 22] },
  virgo: { name: '처녀자리', emoji: '♍', element: '흙', dates: [8, 23, 9, 22] },
  libra: { name: '천칭자리', emoji: '♎', element: '공기', dates: [9, 23, 10, 22] },
  scorpio: { name: '전갈자리', emoji: '♏', element: '물', dates: [10, 23, 11, 21] },
  sagittarius: { name: '사수자리', emoji: '♐', element: '불', dates: [11, 22, 12, 21] },
  capricorn: { name: '염소자리', emoji: '♑', element: '흙', dates: [12, 22, 1, 19] },
  aquarius: { name: '물병자리', emoji: '♒', element: '공기', dates: [1, 20, 2, 18] },
  pisces: { name: '물고기자리', emoji: '♓', element: '물', dates: [2, 19, 3, 20] },
};

const ZODIAC_FORTUNES: Record<string, {
  overall: string;
  love: string;
  money: string;
  health: string;
  advice: string;
}> = {
  aries: {
    overall: '새로운 도전에 적합한 시기입니다. 용기를 갖고 앞으로 나아가세요.',
    love: '적극적인 표현이 좋은 결과를 가져옵니다.',
    money: '충동적인 소비를 자제하면 재물운이 좋아집니다.',
    health: '격한 운동보다 균형 잡힌 운동이 좋습니다.',
    advice: '성급한 판단은 피하세요.',
  },
  taurus: {
    overall: '안정을 추구하며 실속을 챙기기 좋은 시기입니다.',
    love: '진실한 마음이 상대에게 전해집니다.',
    money: '착실한 저축이 빛을 발합니다.',
    health: '규칙적인 생활이 건강의 비결입니다.',
    advice: '변화를 두려워하지 마세요.',
  },
  gemini: {
    overall: '다양한 경험과 배움의 기회가 많습니다.',
    love: '소통이 원활해져 관계가 좋아집니다.',
    money: '다양한 수입원을 고려해보세요.',
    health: '정신 건강에도 관심을 기울이세요.',
    advice: '한 가지에 집중하는 연습이 필요합니다.',
  },
  cancer: {
    overall: '가정과 관계된 일에서 행복을 느낄 수 있습니다.',
    love: '감정을 표현하는 것이 관계에 도움이 됩니다.',
    money: '가족을 위한 지출에 보람을 느낍니다.',
    health: '스트레스 관리가 중요합니다.',
    advice: '과거에 연연하지 말고 앞으로 나아가세요.',
  },
  leo: {
    overall: '리더십을 발휘할 기회가 많습니다.',
    love: '자신감이 매력이 됩니다.',
    money: '큰 투자보다 작은 성과가 더 값집니다.',
    health: '과로하지 말고 휴식을 취하세요.',
    advice: '겸손함이 더 큰 존경을 받습니다.',
  },
  virgo: {
    overall: '세심한 계획이 성과로 이어집니다.',
    love: '상대방의 작은 것에도 관심을 보이세요.',
    money: '절약과 계획적인 소비가 좋습니다.',
    health: '건강 검진을 받아보세요.',
    advice: '완벽을 추구하기보다 진행을 선택하세요.',
  },
  libra: {
    overall: '인간관계에서 균형을 찾는 시기입니다.',
    love: '조화로운 관계가 행복의 열쇠입니다.',
    money: '공정한 거래가 신뢰를 쌓습니다.',
    health: '균형 잡힌 식단이 중요합니다.',
    advice: '결정을 미루지 마세요.',
  },
  scorpio: {
    overall: '깊이 있는 통찰력이 빛나는 시기입니다.',
    love: '진정한 감정을 공유하면 관계가 깊어집니다.',
    money: '투자에 대한 감이 좋습니다.',
    health: '감정을 억누르지 마세요.',
    advice: '집착을 버리면 더 많은 것이 옵니다.',
  },
  sagittarius: {
    overall: '모험과 탐험에 좋은 시기입니다.',
    love: '자유로운 연애가 즐겁습니다.',
    money: '예상치 못한 수입이 있을 수 있습니다.',
    health: '야외 활동이 건강에 좋습니다.',
    advice: '현실적인 계획도 필요합니다.',
  },
  capricorn: {
    overall: '목표를 향해 꾸준히 나아가는 시기입니다.',
    love: '진지한 관계가 안정을 줍니다.',
    money: '장기 투자가 좋은 결과를 낳습니다.',
    health: '무리하지 말고 적절한 휴식을 취하세요.',
    advice: '때로는 유연함도 필요합니다.',
  },
  aquarius: {
    overall: '독창적인 아이디어가 빛나는 시기입니다.',
    love: '특별한 인연을 만날 수 있습니다.',
    money: '혁신적인 방법으로 수익을 창출할 수 있습니다.',
    health: '새로운 건강 습관을 시작해보세요.',
    advice: '너무 이상에만 치우치지 마세요.',
  },
  pisces: {
    overall: '직관이 강해지는 시기입니다.',
    love: '감정적 교류가 깊어집니다.',
    money: '예술적 활동에서 수익을 찾을 수 있습니다.',
    health: '명상이나 요가가 도움이 됩니다.',
    advice: '현실도 놓치지 마세요.',
  },
};

function getZodiacSign(birthDate: string): string {
  const [, month, day] = birthDate.split('-').map(Number);

  for (const [key, sign] of Object.entries(ZODIAC_SIGNS)) {
    const [startMonth, startDay, endMonth, endDay] = sign.dates;

    if (startMonth === 12 && endMonth === 1) {
      // 염소자리 (12/22 ~ 1/19)
      if ((month === 12 && day >= startDay) || (month === 1 && day <= endDay)) {
        return key;
      }
    } else if (
      (month === startMonth && day >= startDay) ||
      (month === endMonth && day <= endDay)
    ) {
      return key;
    }
  }

  return 'aries'; // 기본값
}

export function generateZodiacFortune(birthDate: string, dayMaster: string = '갑') {
  const signKey = getZodiacSign(birthDate);
  const sign = ZODIAC_SIGNS[signKey];
  const fortune = ZODIAC_FORTUNES[signKey];

  // 생년월일 기반 해시로 일관된 점수 생성
  const dateHash = birthDate.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const today = new Date();
  const todayHash = today.getDate() + today.getMonth() * 31;
  const combinedHash = dateHash + todayHash;

  return {
    summary: `${sign.emoji} ${sign.name} (${sign.element} 원소)\n\n${fortune.overall}`,
    score: 75 + (combinedHash % 15),
    categories: [
      {
        emoji: '🌟',
        title: '오늘의 총운',
        content: fortune.overall,
        score: 75 + ((combinedHash + 1) % 15),
        advice: fortune.advice,
      },
      {
        emoji: '❤️',
        title: '애정운',
        content: fortune.love,
        score: 70 + ((combinedHash + 2) % 20),
      },
      {
        emoji: '💰',
        title: '금전운',
        content: fortune.money,
        score: 68 + ((combinedHash + 3) % 22),
      },
      {
        emoji: '🏥',
        title: '건강운',
        content: fortune.health,
        score: 72 + ((combinedHash + 4) % 18),
      },
    ],
    luckyInfo: getYongsinBasedLuckyInfo(dayMaster),
  };
}

// ============================================
// 꿈풀이 (전통 해몽서/주공해몽 기반)
// ============================================

interface DreamItem {
  name: string;
  meaning: string;
  luck: 'good' | 'normal' | 'bad';
}

interface DreamCategory {
  emoji: string;
  title: string;
  items: DreamItem[];
}

export function generateDreamFortune(dayMaster: string = '갑') {
  const dreamCategories: DreamCategory[] = [
    {
      emoji: '🐉',
      title: '동물 꿈',
      items: [
        { name: '용꿈', meaning: '큰 행운과 성공을 상징합니다. 승진, 합격, 당첨 등 좋은 소식이 있을 수 있습니다.', luck: 'good' },
        { name: '뱀꿈', meaning: '재물운을 상징합니다. 특히 큰 뱀은 큰 재물을, 뱀이 집에 들어오면 재물이 들어옴을 의미합니다.', luck: 'good' },
        { name: '돼지꿈', meaning: '재물과 복을 상징합니다. 돼지가 크고 살쪘을수록 더 큰 재물을 의미합니다.', luck: 'good' },
        { name: '개꿈', meaning: '충성과 우정을 상징합니다. 개가 짖으면 주변의 경고를 의미할 수 있습니다.', luck: 'normal' },
        { name: '호랑이꿈', meaning: '권위와 힘을 상징합니다. 호랑이에게 쫓기면 어려움이 있을 수 있습니다.', luck: 'normal' },
        { name: '쥐꿈', meaning: '다산과 부지런함을 상징하지만, 손해를 볼 수도 있으니 주의하세요.', luck: 'normal' },
      ],
    },
    {
      emoji: '💧',
      title: '자연 꿈',
      items: [
        { name: '물꿈', meaning: '맑은 물은 행운을, 탁한 물은 어려움을 상징합니다.', luck: 'normal' },
        { name: '불꿈', meaning: '정열과 변화를 상징합니다. 불에 타는 꿈은 걱정 해소를 의미합니다.', luck: 'good' },
        { name: '산꿈', meaning: '높은 산을 오르면 성공을, 내려오면 안정을 의미합니다.', luck: 'good' },
        { name: '바다꿈', meaning: '무한한 가능성을 상징합니다. 파도가 높으면 변화가 클 수 있습니다.', luck: 'normal' },
        { name: '하늘꿈', meaning: '맑은 하늘은 행운을, 구름 낀 하늘은 고민을 의미합니다.', luck: 'good' },
        { name: '비꿈', meaning: '시련 후 좋은 결과를 상징합니다. 비 개인 후 무지개는 대길합니다.', luck: 'normal' },
      ],
    },
    {
      emoji: '👨‍👩‍👧‍👦',
      title: '사람 꿈',
      items: [
        { name: '돌아가신 분 꿈', meaning: '조상의 보호를 상징합니다. 좋은 모습이면 길조입니다.', luck: 'good' },
        { name: '아기 꿈', meaning: '새로운 시작과 희망을 상징합니다. 태몽일 수도 있습니다.', luck: 'good' },
        { name: '연인 꿈', meaning: '관계의 발전을 상징합니다. 다투는 꿈은 화해를 의미합니다.', luck: 'normal' },
        { name: '낯선 사람 꿈', meaning: '새로운 인연을 상징합니다. 그 사람의 모습이 중요합니다.', luck: 'normal' },
        { name: '유명인 꿈', meaning: '그 사람의 특성을 닮고 싶은 욕구를 의미합니다.', luck: 'normal' },
        { name: '친구 꿈', meaning: '그 친구와의 관계나 자신의 일부를 반영합니다.', luck: 'normal' },
      ],
    },
    {
      emoji: '🎁',
      title: '행운 상징 꿈',
      items: [
        { name: '금/보석 꿈', meaning: '재물운 상승을 상징합니다. 특히 금은보화를 얻는 꿈은 대길합니다.', luck: 'good' },
        { name: '꽃꿈', meaning: '기쁜 소식과 행복을 상징합니다. 꽃다발을 받으면 좋은 일이 있습니다.', luck: 'good' },
        { name: '과일 꿈', meaning: '풍요와 수확을 상징합니다. 익은 과일은 성공을 의미합니다.', luck: 'good' },
        { name: '시험 합격 꿈', meaning: '실제로 좋은 결과를 얻을 징조입니다.', luck: 'good' },
        { name: '결혼 꿈', meaning: '싱글은 인연을, 기혼은 화목을 상징합니다.', luck: 'good' },
        { name: '승진/성공 꿈', meaning: '실제 성취를 예고하는 길몽입니다.', luck: 'good' },
      ],
    },
    {
      emoji: '⚠️',
      title: '주의 상징 꿈',
      items: [
        { name: '이빨 빠지는 꿈', meaning: '가족의 건강이나 재물 손실에 주의하세요. 하지만 새 이가 나면 길조입니다.', luck: 'bad' },
        { name: '쫓기는 꿈', meaning: '현실의 압박감을 반영합니다. 스트레스 관리가 필요합니다.', luck: 'bad' },
        { name: '떨어지는 꿈', meaning: '불안감을 반영합니다. 자신감을 가지세요.', luck: 'bad' },
        { name: '길을 잃는 꿈', meaning: '방향성 상실을 의미합니다. 계획을 재점검하세요.', luck: 'normal' },
        { name: '시험 망치는 꿈', meaning: '준비 부족에 대한 불안입니다. 더 열심히 준비하세요.', luck: 'normal' },
        { name: '물에 빠지는 꿈', meaning: '감정적 어려움을 상징합니다. 주변에 도움을 구하세요.', luck: 'bad' },
      ],
    },
  ];

  return {
    summary: '꿈은 무의식이 보내는 메시지입니다. 전통 해몽서의 지혜로 꿈의 의미를 풀어드립니다.',
    dreamCategories,
    luckyInfo: {
      ...getYongsinBasedLuckyInfo(dayMaster),
      item: '달맞이꽃',
    },
  };
}

// ============================================
// 띠 운세 (12지 동물띠 기반)
// ============================================

const ZODIAC_ANIMALS: Record<number, {
  name: string;
  emoji: string;
  element: string;
  personality: string;
}> = {
  0: { name: '원숭이띠', emoji: '🐵', element: '금(金)', personality: '영리하고 재치 있으며 다재다능합니다.' },
  1: { name: '닭띠', emoji: '🐔', element: '금(金)', personality: '부지런하고 성실하며 자신감이 있습니다.' },
  2: { name: '개띠', emoji: '🐕', element: '토(土)', personality: '충직하고 정의로우며 의리가 있습니다.' },
  3: { name: '돼지띠', emoji: '🐷', element: '수(水)', personality: '낙천적이고 순수하며 복이 많습니다.' },
  4: { name: '쥐띠', emoji: '🐀', element: '수(水)', personality: '똑똒하고 기민하며 적응력이 뛰어납니다.' },
  5: { name: '소띠', emoji: '🐂', element: '토(土)', personality: '근면 성실하고 인내심이 강합니다.' },
  6: { name: '호랑이띠', emoji: '🐯', element: '목(木)', personality: '용맹하고 자존심이 강하며 리더십이 있습니다.' },
  7: { name: '토끼띠', emoji: '🐰', element: '목(木)', personality: '온순하고 상냥하며 예술적 감각이 있습니다.' },
  8: { name: '용띠', emoji: '🐲', element: '토(土)', personality: '카리스마 있고 야망이 크며 운이 좋습니다.' },
  9: { name: '뱀띠', emoji: '🐍', element: '화(火)', personality: '지혜롭고 신중하며 직관력이 뛰어납니다.' },
  10: { name: '말띠', emoji: '🐴', element: '화(火)', personality: '활발하고 사교적이며 자유를 사랑합니다.' },
  11: { name: '양띠', emoji: '🐑', element: '토(土)', personality: '온화하고 예술적이며 동정심이 많습니다.' },
};

// 2025년 을사년(뱀띠 해) 기준 띠별 운세
const ANIMAL_YEARLY_FORTUNE: Record<number, {
  overall: string;
  score: number;
  wealth: { content: string; score: number };
  career: { content: string; score: number };
  love: { content: string; score: number };
  health: { content: string; score: number };
  advice: string;
}> = {
  0: { // 원숭이띠
    overall: '2025년은 원숭이띠에게 기회가 많은 해입니다. 사(巳)와 신(申)이 합하여 변화와 발전의 기운이 있습니다.',
    score: 82,
    wealth: { content: '재물운이 좋습니다. 새로운 투자 기회가 생길 수 있으니 신중하게 판단하세요.', score: 80 },
    career: { content: '직장에서 인정받을 기회가 많습니다. 적극적으로 자신을 어필하세요.', score: 85 },
    love: { content: '인연운이 활발합니다. 새로운 만남이나 관계 발전이 기대됩니다.', score: 78 },
    health: { content: '과로에 주의하세요. 적절한 휴식이 필요합니다.', score: 72 },
    advice: '변화를 두려워하지 마세요. 적극적인 자세가 행운을 부릅니다.',
  },
  1: { // 닭띠
    overall: '2025년은 닭띠에게 안정적인 해입니다. 꾸준히 노력하면 좋은 결과가 있습니다.',
    score: 75,
    wealth: { content: '안정적인 재물운입니다. 큰 투자보다 저축이 좋습니다.', score: 72 },
    career: { content: '묵묵히 일하면 인정받습니다. 인내심이 필요합니다.', score: 75 },
    love: { content: '기존 관계가 더 돈독해질 수 있습니다.', score: 70 },
    health: { content: '호흡기 건강에 신경 쓰세요.', score: 68 },
    advice: '조급해하지 말고 차근차근 진행하세요.',
  },
  2: { // 개띠
    overall: '2025년은 개띠에게 도전의 해입니다. 새로운 것에 도전하면 좋은 결과가 있습니다.',
    score: 78,
    wealth: { content: '부업이나 부수입에서 좋은 성과가 있을 수 있습니다.', score: 75 },
    career: { content: '이직이나 전직을 고민하셨다면 좋은 시기입니다.', score: 80 },
    love: { content: '솔직한 표현이 관계 발전에 도움이 됩니다.', score: 72 },
    health: { content: '스트레스 관리에 신경 쓰세요.', score: 70 },
    advice: '의리를 지키되 자신의 발전도 놓치지 마세요.',
  },
  3: { // 돼지띠
    overall: '2025년은 돼지띠에게 충돌의 기운이 있는 해입니다. 뱀띠 해와 상충하니 주의가 필요합니다.',
    score: 60,
    wealth: { content: '재물 손실에 주의하세요. 무리한 투자는 피하세요.', score: 55 },
    career: { content: '현상 유지에 집중하세요. 큰 변화는 미루는 것이 좋습니다.', score: 60 },
    love: { content: '갈등이 생길 수 있으니 대화로 풀어가세요.', score: 58 },
    health: { content: '건강 검진을 받아보세요. 예방이 중요합니다.', score: 55 },
    advice: '올해는 무리하지 말고 내실을 다지는 해로 삼으세요.',
  },
  4: { // 쥐띠
    overall: '2025년은 쥐띠에게 희망적인 해입니다. 새로운 시작에 좋은 시기입니다.',
    score: 80,
    wealth: { content: '재물운이 상승합니다. 작은 투자가 큰 수익으로 이어질 수 있습니다.', score: 82 },
    career: { content: '능력을 인정받을 기회가 많습니다. 자신감을 가지세요.', score: 80 },
    love: { content: '좋은 인연을 만날 수 있습니다. 적극적으로 활동하세요.', score: 78 },
    health: { content: '전반적으로 양호합니다. 규칙적인 생활이 중요합니다.', score: 75 },
    advice: '기회를 잡을 준비를 해두세요.',
  },
  5: { // 소띠
    overall: '2025년은 소띠에게 노력이 결실을 맺는 해입니다.',
    score: 76,
    wealth: { content: '착실히 모은 재물이 빛을 발합니다.', score: 75 },
    career: { content: '성실함이 인정받습니다. 꾸준히 노력하세요.', score: 78 },
    love: { content: '안정적인 관계가 이어집니다.', score: 72 },
    health: { content: '소화기 건강에 주의하세요.', score: 70 },
    advice: '서두르지 말고 자신의 페이스를 유지하세요.',
  },
  6: { // 호랑이띠
    overall: '2025년은 호랑이띠에게 주의가 필요한 해입니다. 뱀띠 해와 상충하는 기운이 있습니다.',
    score: 62,
    wealth: { content: '재물 관리에 신중하세요. 계획적인 지출이 필요합니다.', score: 60 },
    career: { content: '직장에서 갈등이 생길 수 있습니다. 인내심을 가지세요.', score: 62 },
    love: { content: '오해가 생기기 쉬우니 대화를 많이 하세요.', score: 58 },
    health: { content: '과로와 스트레스에 주의하세요.', score: 60 },
    advice: '올해는 겸손하게 처신하고 충돌을 피하세요.',
  },
  7: { // 토끼띠
    overall: '2025년은 토끼띠에게 평화로운 해입니다. 안정 속에서 성장할 수 있습니다.',
    score: 74,
    wealth: { content: '안정적인 수입이 이어집니다. 무리한 투자는 피하세요.', score: 72 },
    career: { content: '차분하게 일하면 좋은 성과가 있습니다.', score: 75 },
    love: { content: '부드러운 관계가 이어집니다.', score: 76 },
    health: { content: '전반적으로 양호합니다.', score: 74 },
    advice: '평화를 유지하면서 자신의 목표를 향해 나아가세요.',
  },
  8: { // 용띠
    overall: '2025년은 용띠에게 발전의 해입니다. 큰 기회가 찾아올 수 있습니다.',
    score: 85,
    wealth: { content: '재물운이 좋습니다. 투자에 좋은 시기입니다.', score: 85 },
    career: { content: '승진이나 성공의 기회가 많습니다.', score: 88 },
    love: { content: '매력이 빛나는 해입니다. 좋은 인연이 기대됩니다.', score: 82 },
    health: { content: '활력이 넘칩니다. 하지만 과신은 금물입니다.', score: 78 },
    advice: '큰 꿈을 향해 적극적으로 도전하세요.',
  },
  9: { // 뱀띠 (본명년)
    overall: '2025년은 뱀띠에게 본명년입니다. 자기 자신을 돌아보고 새롭게 시작하기 좋은 해입니다.',
    score: 70,
    wealth: { content: '본명년에는 재물의 변동이 있을 수 있습니다. 보수적으로 관리하세요.', score: 65 },
    career: { content: '변화보다는 내실을 다지는 것이 좋습니다.', score: 68 },
    love: { content: '자신을 먼저 돌보세요. 관계도 더 깊어질 수 있습니다.', score: 70 },
    health: { content: '건강 관리에 특히 신경 쓰세요.', score: 65 },
    advice: '본명년에는 빨간색 소품을 지니면 액막이가 됩니다.',
  },
  10: { // 말띠
    overall: '2025년은 말띠에게 활동적인 해입니다. 에너지가 넘치는 한 해가 될 것입니다.',
    score: 79,
    wealth: { content: '활발한 활동이 수입으로 이어집니다.', score: 78 },
    career: { content: '새로운 프로젝트나 도전에 좋은 시기입니다.', score: 80 },
    love: { content: '만남이 많아집니다. 좋은 인연을 기대하세요.', score: 77 },
    health: { content: '에너지 소모가 많으니 휴식도 챙기세요.', score: 72 },
    advice: '열정을 가지되 너무 무리하지는 마세요.',
  },
  11: { // 양띠
    overall: '2025년은 양띠에게 조화로운 해입니다. 주변의 도움으로 발전할 수 있습니다.',
    score: 77,
    wealth: { content: '협력을 통한 이익이 있습니다.', score: 75 },
    career: { content: '팀워크가 좋은 성과를 냅니다.', score: 78 },
    love: { content: '따뜻한 관계가 이어집니다.', score: 80 },
    health: { content: '정서적 안정이 건강에 도움이 됩니다.', score: 75 },
    advice: '혼자보다 함께할 때 더 큰 성과를 얻습니다.',
  },
};

function getAnimalSign(birthYear: number): number {
  return birthYear % 12;
}

export function generateAnimalFortune(birthDate: string, dayMaster: string = '갑') {
  const year = parseInt(birthDate.split('-')[0], 10);
  const animalIndex = getAnimalSign(year);
  const animal = ZODIAC_ANIMALS[animalIndex];
  const fortune = ANIMAL_YEARLY_FORTUNE[animalIndex];

  return {
    summary: `${animal.emoji} ${animal.name} (${animal.element})\n${animal.personality}\n\n${fortune.overall}`,
    score: fortune.score,
    animalInfo: {
      name: animal.name,
      emoji: animal.emoji,
      element: animal.element,
      personality: animal.personality,
    },
    categories: [
      {
        emoji: '💰',
        title: '재물운',
        content: fortune.wealth.content,
        score: fortune.wealth.score,
      },
      {
        emoji: '💼',
        title: '직장/사업운',
        content: fortune.career.content,
        score: fortune.career.score,
      },
      {
        emoji: '❤️',
        title: '애정운',
        content: fortune.love.content,
        score: fortune.love.score,
      },
      {
        emoji: '🏥',
        title: '건강운',
        content: fortune.health.content,
        score: fortune.health.score,
      },
    ],
    luckyInfo: getYongsinBasedLuckyInfo(dayMaster),
    caution: fortune.advice,
  };
}

// ============================================
// 오늘의 길운 (Lucky Info - 명리학 용신론 기반)
// ============================================

// 일간(日干)별 용신 색상 - 명리학 용신론 기반
const YONGSHIN_COLORS: Record<string, { color: string; element: string; reason: string }> = {
  '갑': { color: '초록색', element: '목(木)', reason: '갑목 일간에게 목(木) 기운이 자신을 돕는 색입니다.' },
  '을': { color: '연두색', element: '목(木)', reason: '을목 일간에게 부드러운 목(木) 기운이 어울립니다.' },
  '병': { color: '빨간색', element: '화(火)', reason: '병화 일간에게 화(火) 기운이 활력을 더합니다.' },
  '정': { color: '분홍색', element: '화(火)', reason: '정화 일간에게 부드러운 화(火) 기운이 어울립니다.' },
  '무': { color: '노란색', element: '토(土)', reason: '무토 일간에게 토(土) 기운이 안정을 줍니다.' },
  '기': { color: '갈색', element: '토(土)', reason: '기토 일간에게 부드러운 토(土) 기운이 어울립니다.' },
  '경': { color: '흰색', element: '금(金)', reason: '경금 일간에게 금(金) 기운이 결단력을 더합니다.' },
  '신': { color: '은색', element: '금(金)', reason: '신금 일간에게 부드러운 금(金) 기운이 어울립니다.' },
  '임': { color: '검은색', element: '수(水)', reason: '임수 일간에게 수(水) 기운이 지혜를 더합니다.' },
  '계': { color: '파란색', element: '수(水)', reason: '계수 일간에게 부드러운 수(水) 기운이 어울립니다.' },
};

// 일간별 행운의 방향 - 오행 방위론 기반
const YONGSHIN_DIRECTIONS: Record<string, { direction: string; reason: string }> = {
  '갑': { direction: '동쪽', reason: '목(木) 기운은 동쪽에서 옵니다.' },
  '을': { direction: '동쪽', reason: '목(木) 기운은 동쪽에서 옵니다.' },
  '병': { direction: '남쪽', reason: '화(火) 기운은 남쪽에서 옵니다.' },
  '정': { direction: '남쪽', reason: '화(火) 기운은 남쪽에서 옵니다.' },
  '무': { direction: '중앙', reason: '토(土) 기운은 중앙에서 옵니다.' },
  '기': { direction: '중앙', reason: '토(土) 기운은 중앙에서 옵니다.' },
  '경': { direction: '서쪽', reason: '금(金) 기운은 서쪽에서 옵니다.' },
  '신': { direction: '서쪽', reason: '금(金) 기운은 서쪽에서 옵니다.' },
  '임': { direction: '북쪽', reason: '수(水) 기운은 북쪽에서 옵니다.' },
  '계': { direction: '북쪽', reason: '수(水) 기운은 북쪽에서 옵니다.' },
};

// 일간별 행운의 물건 - 오행 상생 기반
const YONGSHIN_ITEMS: Record<string, { item: string; reason: string }> = {
  '갑': { item: '관엽식물, 나무 소품', reason: '목(木) 기운을 북돋아 주는 물건입니다.' },
  '을': { item: '꽃다발, 허브화분', reason: '부드러운 목(木) 기운을 더해주는 물건입니다.' },
  '병': { item: '조명, 양초', reason: '화(火) 기운을 활성화하는 물건입니다.' },
  '정': { item: '향초, 따뜻한 음료', reason: '부드러운 화(火) 기운을 더해주는 물건입니다.' },
  '무': { item: '도자기, 흙 화분', reason: '토(土) 기운을 안정시키는 물건입니다.' },
  '기': { item: '크리스탈, 천연석', reason: '부드러운 토(土) 기운을 더해주는 물건입니다.' },
  '경': { item: '금속 장신구, 시계', reason: '금(金) 기운을 강화하는 물건입니다.' },
  '신': { item: '은 액세서리, 동전', reason: '부드러운 금(金) 기운을 더해주는 물건입니다.' },
  '임': { item: '수정, 어항', reason: '수(水) 기운을 활성화하는 물건입니다.' },
  '계': { item: '분수, 수반', reason: '부드러운 수(水) 기운을 더해주는 물건입니다.' },
};

// 일간별 피해야 할 것들 - 오행 상극 기반 (기신)
const GISHIN_WARNINGS: Record<string, { color: string; direction: string; reason: string }> = {
  '갑': { color: '흰색/은색', direction: '서쪽', reason: '금(金)이 목(木)을 극합니다.' },
  '을': { color: '흰색/은색', direction: '서쪽', reason: '금(金)이 목(木)을 극합니다.' },
  '병': { color: '검은색/파란색', direction: '북쪽', reason: '수(水)가 화(火)를 극합니다.' },
  '정': { color: '검은색/파란색', direction: '북쪽', reason: '수(水)가 화(火)를 극합니다.' },
  '무': { color: '초록색', direction: '동쪽', reason: '목(木)이 토(土)를 극합니다.' },
  '기': { color: '초록색', direction: '동쪽', reason: '목(木)이 토(土)를 극합니다.' },
  '경': { color: '빨간색', direction: '남쪽', reason: '화(火)가 금(金)을 극합니다.' },
  '신': { color: '빨간색', direction: '남쪽', reason: '화(火)가 금(金)을 극합니다.' },
  '임': { color: '노란색/갈색', direction: '중앙', reason: '토(土)가 수(水)를 극합니다.' },
  '계': { color: '노란색/갈색', direction: '중앙', reason: '토(土)가 수(水)를 극합니다.' },
};

// ============================================
// 5신 체계 (용신/희신/기신/구신/한신) - 명리학 핵심 이론
// 출처: 적천수(滴天髓), 자평진전(子平眞詮)
// ============================================

/**
 * 5신 체계 설명
 * - 용신(用神): 사주에서 가장 필요한 오행, 사주의 균형을 맞추는 핵심
 * - 희신(喜神): 용신을 돕는 오행, 용신을 생하거나 도움
 * - 기신(忌神): 용신을 극하거나 방해하는 오행
 * - 구신(仇神): 기신을 돕는 오행, 기신을 생함
 * - 한신(閑神): 사주에 영향이 미미한 중립적 오행
 */

// 오행 상극 관계
const FIVE_ELEMENTS_CONTROLS: Record<string, string> = {
  '목': '토', // 목극토
  '토': '수', // 토극수
  '수': '화', // 수극화
  '화': '금', // 화극금
  '금': '목', // 금극목
};

// 오행별 한자
const ELEMENT_HANJA: Record<string, string> = {
  '목': '木', '화': '火', '토': '土', '금': '金', '수': '水',
};

// 5신 분류 결과 타입
interface FiveSpiritAnalysis {
  yongsin: { element: string; hanja: string; description: string };
  heesin: { element: string; hanja: string; description: string };
  gisin: { element: string; hanja: string; description: string };
  gusin: { element: string; hanja: string; description: string };
  hansin: { element: string; hanja: string; description: string };
  summary: string;
  advice: string;
}

/**
 * 5신 분석 함수
 * 일간 오행과 사주 오행 분포를 기반으로 용신/희신/기신/구신/한신 분석
 * @param dayMasterElement 일간 오행 (목/화/토/금/수)
 * @param elements 사주 오행 분포 { 목: n, 화: n, 토: n, 금: n, 수: n }
 */
export function analyzeFiveSpirits(
  dayMasterElement: string,
  elements: Record<string, number>
): FiveSpiritAnalysis {
  // 일간이 강한지 약한지 판단 (비겁+인성 vs 식상+재성+관성)
  const myElement = dayMasterElement;
  const generatesMe = Object.keys(FIVE_ELEMENTS_GENERATES).find(
    k => FIVE_ELEMENTS_GENERATES[k] === myElement
  ) || '수';
  const iGenerate = FIVE_ELEMENTS_GENERATES[myElement];
  const iControl = FIVE_ELEMENTS_CONTROLS[myElement];
  const controlsMe = Object.keys(FIVE_ELEMENTS_CONTROLS).find(
    k => FIVE_ELEMENTS_CONTROLS[k] === myElement
  ) || '금';

  // 나를 돕는 세력 (비겁: 같은 오행, 인성: 나를 생하는 오행)
  const helpForce = (elements[myElement] || 0) + (elements[generatesMe] || 0);
  // 나를 약화시키는 세력 (식상, 재성, 관성)
  const weakenForce = (elements[iGenerate] || 0) + (elements[iControl] || 0) + (elements[controlsMe] || 0);

  const isStrong = helpForce > weakenForce;

  // 용신 결정 (억부용신 기준 - 적천수 이론)
  // 강하면 설기(식상/재성) 필요, 약하면 생조(인성/비겁) 필요
  let yongsinElement: string;
  let heesinElement: string;
  let gisinElement: string;
  let gusinElement: string;
  let hansinElement: string;

  if (isStrong) {
    // 일간이 강하면: 용신 = 식상(내가 생하는 것) 또는 재성(내가 극하는 것)
    yongsinElement = iGenerate; // 식상 (설기)
    heesinElement = iControl; // 재성 (용신 도움)
    gisinElement = generatesMe; // 인성 (용신 방해)
    gusinElement = myElement; // 비겁 (기신 도움)
    hansinElement = controlsMe; // 관성 (중립)
  } else {
    // 일간이 약하면: 용신 = 인성(나를 생하는 것) 또는 비겁(같은 오행)
    yongsinElement = generatesMe; // 인성 (생조)
    heesinElement = myElement; // 비겁 (용신 도움)
    gisinElement = controlsMe; // 관성 (용신 방해)
    gusinElement = iControl; // 재성 (기신 도움)
    hansinElement = iGenerate; // 식상 (중립)
  }

  return {
    yongsin: {
      element: yongsinElement,
      hanja: ELEMENT_HANJA[yongsinElement],
      description: `${yongsinElement}(${ELEMENT_HANJA[yongsinElement]}) - 사주에서 가장 필요한 오행입니다. 이 기운이 강해지면 운이 좋아집니다.`,
    },
    heesin: {
      element: heesinElement,
      hanja: ELEMENT_HANJA[heesinElement],
      description: `${heesinElement}(${ELEMENT_HANJA[heesinElement]}) - 용신을 돕는 오행입니다. 용신과 함께 길운을 만듭니다.`,
    },
    gisin: {
      element: gisinElement,
      hanja: ELEMENT_HANJA[gisinElement],
      description: `${gisinElement}(${ELEMENT_HANJA[gisinElement]}) - 용신을 방해하는 오행입니다. 이 기운이 강해지면 주의가 필요합니다.`,
    },
    gusin: {
      element: gusinElement,
      hanja: ELEMENT_HANJA[gusinElement],
      description: `${gusinElement}(${ELEMENT_HANJA[gusinElement]}) - 기신을 돕는 오행입니다. 기신과 함께 흉운을 만들 수 있습니다.`,
    },
    hansin: {
      element: hansinElement,
      hanja: ELEMENT_HANJA[hansinElement],
      description: `${hansinElement}(${ELEMENT_HANJA[hansinElement]}) - 영향이 미미한 중립적 오행입니다.`,
    },
    summary: isStrong
      ? `일간이 강하여 설기(泄氣)가 필요합니다. ${yongsinElement}(${ELEMENT_HANJA[yongsinElement]}) 기운이 용신입니다.`
      : `일간이 약하여 생조(生助)가 필요합니다. ${yongsinElement}(${ELEMENT_HANJA[yongsinElement]}) 기운이 용신입니다.`,
    advice: isStrong
      ? `${yongsinElement} 색상(${getElementColor(yongsinElement)})의 물건이나 ${getElementDirection(yongsinElement)} 방향이 길합니다.`
      : `${yongsinElement} 색상(${getElementColor(yongsinElement)})의 물건이나 ${getElementDirection(yongsinElement)} 방향이 길합니다.`,
  };
}

// 오행별 색상
function getElementColor(element: string): string {
  const colors: Record<string, string> = {
    '목': '초록색', '화': '빨간색', '토': '노란색', '금': '흰색', '수': '검은색',
  };
  return colors[element] || '노란색';
}

// 오행별 방향
function getElementDirection(element: string): string {
  const directions: Record<string, string> = {
    '목': '동쪽', '화': '남쪽', '토': '중앙', '금': '서쪽', '수': '북쪽',
  };
  return directions[element] || '중앙';
}

// ============================================
// 토정비결 144괘 계산법 (개선된 버전)
// 출처: 토정 이지함 선생 저술
// ============================================

/**
 * 토정비결 괘 계산
 * 상괘(연괘): (태세 + 나이) ÷ 8의 나머지 (1~8)
 * 중괘(월괘): (월건 수 + 나이) ÷ 6의 나머지 (1~6)
 * 하괘(일괘): (일진 수 + 나이) ÷ 3의 나머지 (1~3)
 * 총 144괘 조합
 */

// 월건 수 (음력 월 기준)
const MONTH_NUMBERS: Record<number, number> = {
  1: 10, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5,
  7: 4, 8: 3, 9: 2, 10: 1, 11: 12, 12: 11,
};

// 144괘 중 대표적인 괘 해석 (상괘×중괘×하괘)
const TOJEONG_144_FORTUNES: Record<string, {
  name: string;
  meaning: string;
  fortune: string;
  advice: string;
  score: number;
}> = {
  // 상괘 1 (건/乾)
  '1-1-1': { name: '건건건(乾乾乾)', meaning: '하늘 위에 하늘', fortune: '만사형통의 대길한 해입니다. 하는 일마다 순조롭고 큰 성과를 거둘 수 있습니다.', advice: '겸손을 잃지 않으면 복이 배가됩니다.', score: 95 },
  '1-1-2': { name: '건건곤(乾乾坤)', meaning: '하늘과 땅의 조화', fortune: '음양이 조화로운 해입니다. 안정 속에서 발전이 있습니다.', advice: '균형을 유지하며 나아가세요.', score: 88 },
  '1-1-3': { name: '건건감(乾乾坎)', meaning: '하늘 아래 물', fortune: '지혜로운 판단이 필요한 해입니다. 신중하면 좋은 결과가 있습니다.', advice: '성급한 결정은 피하세요.', score: 75 },
  '1-2-1': { name: '건태건(乾兌乾)', meaning: '기쁨의 기운', fortune: '즐거운 일이 많은 해입니다. 인간관계가 활발해집니다.', advice: '좋은 인연을 소중히 하세요.', score: 85 },
  '1-2-2': { name: '건태곤(乾兌坤)', meaning: '기쁨과 순종', fortune: '화합이 잘 이루어지는 해입니다.', advice: '협력을 통해 더 큰 성과를 얻습니다.', score: 82 },
  '1-2-3': { name: '건태감(乾兌坎)', meaning: '기쁨 속의 어려움', fortune: '좋은 일 중에도 작은 어려움이 있을 수 있습니다.', advice: '기쁨에 취해 방심하지 마세요.', score: 70 },
  // 중간 괘들
  '2-3-1': { name: '곤이건(坤離乾)', meaning: '땅에서 불이 타오름', fortune: '노력의 결실을 거두는 해입니다.', advice: '끈기 있게 노력하세요.', score: 80 },
  '3-4-2': { name: '감진곤(坎震坤)', meaning: '물과 우레', fortune: '변화가 많은 해입니다. 유연하게 대처하세요.', advice: '변화를 두려워하지 마세요.', score: 72 },
  '4-5-3': { name: '진손감(震巽坎)', meaning: '우레와 바람', fortune: '활동적인 해입니다. 적극적으로 나서세요.', advice: '에너지를 분산하지 마세요.', score: 78 },
  '5-6-1': { name: '손간건(巽艮乾)', meaning: '바람과 산', fortune: '안정과 발전이 함께하는 해입니다.', advice: '기본에 충실하세요.', score: 83 },
  '6-1-2': { name: '간건곤(艮乾坤)', meaning: '산 위의 하늘', fortune: '높은 목표를 향해 나아가는 해입니다.', advice: '한 걸음씩 차근차근 나아가세요.', score: 80 },
  '7-2-3': { name: '리태감(離兌坎)', meaning: '불과 연못', fortune: '감정의 기복이 있을 수 있는 해입니다.', advice: '감정 조절이 중요합니다.', score: 68 },
  '8-3-1': { name: '곤이건(坤離乾)', meaning: '땅과 불', fortune: '내실을 다지는 해입니다.', advice: '기초를 튼튼히 하세요.', score: 75 },
  // 주의가 필요한 괘들
  '8-6-3': { name: '곤간감(坤艮坎)', meaning: '땅과 산과 물', fortune: '주의가 필요한 해입니다. 무리한 일은 피하세요.', advice: '현상 유지에 집중하세요.', score: 50 },
  '7-5-3': { name: '리손감(離巽坎)', meaning: '불과 바람과 물', fortune: '변동이 많을 수 있습니다. 신중하게 행동하세요.', advice: '큰 결정은 미루세요.', score: 55 },
};

// 기본 괘 해석 (144괘 중 정의되지 않은 것들을 위한 기본값)
function getDefaultTojeongFortune(upperGua: number, middleGua: number, lowerGua: number): {
  name: string; meaning: string; fortune: string; advice: string; score: number;
} {
  const guaNames = ['건', '태', '이', '진', '손', '감', '간', '곤'];
  const baseScore = 60 + (upperGua * 2) + (middleGua * 3) - (lowerGua * 2);
  const score = Math.max(45, Math.min(90, baseScore));

  return {
    name: `${guaNames[upperGua - 1] || '건'}${guaNames[middleGua - 1] || '건'}${guaNames[lowerGua - 1] || '건'}괘`,
    meaning: '괘상 해석',
    fortune: score >= 80 ? '길운이 함께하는 해입니다. 적극적으로 활동하세요.' :
             score >= 65 ? '보통의 운입니다. 꾸준히 노력하면 좋은 결과가 있습니다.' :
             '주의가 필요한 해입니다. 무리하지 말고 내실을 다지세요.',
    advice: score >= 80 ? '좋은 기회를 놓치지 마세요.' :
            score >= 65 ? '인내심을 갖고 노력하세요.' :
            '조심스럽게 행동하고 건강에 유의하세요.',
    score,
  };
}

/**
 * 개선된 토정비결 운세 생성 함수
 */
export function generateImprovedTojeongFortune(birthDate: string, lunarBirthMonth?: number, dayMaster: string = '갑') {
  const [yearStr, monthStr, dayStr] = birthDate.split('-');
  const birthYear = parseInt(yearStr, 10);
  const birthMonth = lunarBirthMonth || parseInt(monthStr, 10);
  const birthDay = parseInt(dayStr, 10);

  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear + 1; // 한국 나이

  // 태세 (연도의 지지 수) - 간략화: 연도 % 12
  const taeSe = ((birthYear - 4) % 12) + 1;

  // 상괘 계산: (태세 + 나이) % 8, 0이면 8
  let upperGua = (taeSe + age) % 8;
  if (upperGua === 0) upperGua = 8;

  // 월건 수
  const monthNumber = MONTH_NUMBERS[birthMonth] || 1;

  // 중괘 계산: (월건 수 + 나이) % 6, 0이면 6
  let middleGua = (monthNumber + age) % 6;
  if (middleGua === 0) middleGua = 6;

  // 하괘 계산: (일진 수 + 나이) % 3, 0이면 3
  let lowerGua = (birthDay + age) % 3;
  if (lowerGua === 0) lowerGua = 3;

  // 괘 키 생성
  const guaKey = `${upperGua}-${middleGua}-${lowerGua}`;

  // 해당 괘 해석 찾기
  const fortune = TOJEONG_144_FORTUNES[guaKey] || getDefaultTojeongFortune(upperGua, middleGua, lowerGua);

  return {
    summary: fortune.fortune,
    score: fortune.score,
    guaInfo: {
      upper: upperGua,
      middle: middleGua,
      lower: lowerGua,
      name: fortune.name,
      meaning: fortune.meaning,
    },
    categories: [
      {
        emoji: '📜',
        title: '괘상 해석',
        content: `${currentYear}년 당신의 괘는 "${fortune.name}"입니다.\n\n${fortune.meaning}\n\n${fortune.fortune}`,
        advice: fortune.advice,
        score: fortune.score,
      },
      {
        emoji: '💰',
        title: '재물운',
        content: fortune.score >= 80 ? '재물이 모이는 상입니다. 투자나 저축에 좋은 해입니다.' :
                 fortune.score >= 65 ? '안정적인 재물운입니다. 무리하지 않으면 좋은 결과가 있습니다.' :
                 fortune.score >= 50 ? '보통의 재물운입니다. 절약하고 검소하게 생활하세요.' :
                 '재물 손실에 주의하세요. 투자보다 저축이 좋습니다.',
        score: Math.max(40, fortune.score - 5),
      },
      {
        emoji: '👔',
        title: '직업운',
        content: fortune.score >= 80 ? '승진이나 성공의 기회가 많습니다. 적극적으로 도전하세요.' :
                 fortune.score >= 65 ? '안정적인 직업운입니다. 꾸준히 노력하면 인정받습니다.' :
                 fortune.score >= 50 ? '무난한 직업운입니다. 현재 위치에서 최선을 다하세요.' :
                 '직장 생활에 어려움이 있을 수 있습니다. 인내가 필요합니다.',
        score: Math.max(40, fortune.score - 3),
      },
      {
        emoji: '❤️',
        title: '가정/인연운',
        content: fortune.score >= 80 ? '가정에 경사가 있을 수 있습니다. 좋은 인연도 기대됩니다.' :
                 fortune.score >= 65 ? '가족 간 화목한 해입니다. 인연운도 좋습니다.' :
                 fortune.score >= 50 ? '평화로운 가정운입니다. 감사하는 마음을 갖으세요.' :
                 '가족 간 갈등에 주의하세요. 대화로 풀어가세요.',
        score: Math.max(40, fortune.score - 8),
      },
      {
        emoji: '🏥',
        title: '건강운',
        content: fortune.score >= 80 ? '건강운이 좋습니다. 활력이 넘치는 한 해입니다.' :
                 fortune.score >= 65 ? '보통의 건강운입니다. 규칙적인 생활이 중요합니다.' :
                 fortune.score >= 50 ? '건강에 조금 더 신경 쓰세요. 무리하지 마세요.' :
                 '건강 관리에 특히 주의하세요. 정기 검진을 권합니다.',
        score: Math.max(40, fortune.score - 10),
      },
    ],
    luckyInfo: getYongsinBasedLuckyInfo(dayMaster),
    tip: fortune.score >= 70
      ? '좋은 운에 겸손과 감사가 더해지면 복이 배가 됩니다.'
      : '올해는 내실을 다지는 해입니다. 차근차근 준비하면 다음 해에 더 큰 성과를 얻을 수 있습니다.',
    calculationMethod: `상괘(${upperGua}) × 중괘(${middleGua}) × 하괘(${lowerGua}) = ${guaKey}`,
  };
}

// 일간별 궁합 띠 - 삼합/육합 기반
const COMPATIBLE_ANIMALS: Record<string, { good: string[]; reason: string }> = {
  '갑': { good: ['호랑이띠', '토끼띠', '용띠'], reason: '목(木) 기운과 삼합/육합하는 띠입니다.' },
  '을': { good: ['호랑이띠', '토끼띠', '양띠'], reason: '목(木) 기운과 조화로운 띠입니다.' },
  '병': { good: ['뱀띠', '말띠', '양띠'], reason: '화(火) 기운과 삼합하는 띠입니다.' },
  '정': { good: ['뱀띠', '말띠', '개띠'], reason: '화(火) 기운과 조화로운 띠입니다.' },
  '무': { good: ['소띠', '용띠', '원숭이띠'], reason: '토(土) 기운과 삼합하는 띠입니다.' },
  '기': { good: ['소띠', '닭띠', '돼지띠'], reason: '토(土) 기운과 조화로운 띠입니다.' },
  '경': { good: ['원숭이띠', '닭띠', '뱀띠'], reason: '금(金) 기운과 삼합하는 띠입니다.' },
  '신': { good: ['원숭이띠', '닭띠', '용띠'], reason: '금(金) 기운과 조화로운 띠입니다.' },
  '임': { good: ['쥐띠', '돼지띠', '용띠'], reason: '수(水) 기운과 삼합하는 띠입니다.' },
  '계': { good: ['쥐띠', '돼지띠', '소띠'], reason: '수(水) 기운과 조화로운 띠입니다.' },
};

// 십이시진(十二時辰) - 하루의 길운 시간대
const LUCKY_TIME_SLOTS = [
  { name: '자시(子時)', time: '밤 11시~새벽 1시', element: '수(水)', suitable: ['임', '계', '갑', '을'] },
  { name: '축시(丑時)', time: '새벽 1시~3시', element: '토(土)', suitable: ['무', '기', '경', '신'] },
  { name: '인시(寅時)', time: '새벽 3시~5시', element: '목(木)', suitable: ['갑', '을', '병', '정'] },
  { name: '묘시(卯時)', time: '새벽 5시~7시', element: '목(木)', suitable: ['갑', '을', '병', '정'] },
  { name: '진시(辰時)', time: '오전 7시~9시', element: '토(土)', suitable: ['무', '기', '경', '신'] },
  { name: '사시(巳時)', time: '오전 9시~11시', element: '화(火)', suitable: ['병', '정', '무', '기'] },
  { name: '오시(午時)', time: '오전 11시~오후 1시', element: '화(火)', suitable: ['병', '정', '무', '기'] },
  { name: '미시(未時)', time: '오후 1시~3시', element: '토(土)', suitable: ['무', '기', '경', '신'] },
  { name: '신시(申時)', time: '오후 3시~5시', element: '금(金)', suitable: ['경', '신', '임', '계'] },
  { name: '유시(酉時)', time: '오후 5시~7시', element: '금(金)', suitable: ['경', '신', '임', '계'] },
  { name: '술시(戌時)', time: '저녁 7시~9시', element: '토(土)', suitable: ['무', '기', '경', '신'] },
  { name: '해시(亥時)', time: '밤 9시~11시', element: '수(水)', suitable: ['임', '계', '갑', '을'] },
];

export function generateLuckyInfo(birthDate: string, dayMaster?: string) {
  const today = new Date();
  const dateHash = birthDate.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const todayHash = today.getDate() + today.getMonth() * 31;
  const combinedHash = dateHash + todayHash;

  const dm = dayMaster || '갑';

  // 용신 색상
  const colorInfo = YONGSHIN_COLORS[dm] || YONGSHIN_COLORS['갑'];

  // 용신 방향
  const directionInfo = YONGSHIN_DIRECTIONS[dm] || YONGSHIN_DIRECTIONS['갑'];

  // 행운의 물건
  const itemInfo = YONGSHIN_ITEMS[dm] || YONGSHIN_ITEMS['갑'];

  // 기신 (피해야 할 것)
  const gishinInfo = GISHIN_WARNINGS[dm] || GISHIN_WARNINGS['갑'];

  // 궁합 띠
  const compatibleInfo = COMPATIBLE_ANIMALS[dm] || COMPATIBLE_ANIMALS['갑'];

  // 행운의 숫자 (하도낙서 기반 오행 숫자)
  const elementNumbers: Record<string, string> = {
    '목(木)': '3, 8',
    '화(火)': '2, 7',
    '토(土)': '5, 10',
    '금(金)': '4, 9',
    '수(水)': '1, 6',
  };
  const luckyNumbers = elementNumbers[colorInfo.element] || '5, 10';

  // 길운 시간대 (일간에 맞는 시간대 찾기)
  const suitableTimes = LUCKY_TIME_SLOTS.filter(slot =>
    slot.suitable.includes(dm)
  );
  // 오늘 날짜에 따라 시간대 선택
  const selectedTime = suitableTimes[combinedHash % suitableTimes.length] || LUCKY_TIME_SLOTS[5];

  // 오행 상생 조언
  const elementAdvice: Record<string, string> = {
    '목(木)': '나무의 기운처럼 성장과 발전에 좋은 날입니다. 새로운 시작이나 계획에 적합합니다.',
    '화(火)': '불의 기운처럼 활력과 열정이 넘치는 날입니다. 적극적인 활동에 좋습니다.',
    '토(土)': '흙의 기운처럼 안정과 신뢰가 중요한 날입니다. 중재나 조정에 적합합니다.',
    '금(金)': '쇠의 기운처럼 결단과 실행이 중요한 날입니다. 마무리나 정리에 좋습니다.',
    '수(水)': '물의 기운처럼 지혜와 유연함이 중요한 날입니다. 학습이나 연구에 적합합니다.',
  };

  return {
    summary: `오늘의 길운 정보입니다.\n\n${dm} 일간에게 ${colorInfo.element} 기운이 도움이 됩니다.`,
    score: 75 + (combinedHash % 15),
    categories: [
      {
        emoji: '🎨',
        title: '행운의 색상',
        content: `${colorInfo.color}\n\n${colorInfo.reason}`,
        score: 80 + (combinedHash % 10),
      },
      {
        emoji: '🔢',
        title: '행운의 숫자',
        content: `${luckyNumbers}\n\n${colorInfo.element}의 오행에 해당하는 하도낙서(河圖洛書) 기반 숫자입니다.`,
        score: 75 + (combinedHash % 15),
      },
      {
        emoji: '🧭',
        title: '행운의 방향',
        content: `${directionInfo.direction}\n\n${directionInfo.reason}`,
        score: 78 + (combinedHash % 12),
      },
      {
        emoji: '⏰',
        title: '길운 시간대',
        content: `${selectedTime.name} (${selectedTime.time})\n\n${selectedTime.element}의 기운이 흐르는 시간으로, ${dm} 일간에게 좋은 시간대입니다.`,
        score: 77 + (combinedHash % 13),
      },
      {
        emoji: '🎁',
        title: '행운의 물건',
        content: `${itemInfo.item}\n\n${itemInfo.reason}`,
        score: 76 + (combinedHash % 14),
      },
      {
        emoji: '🤝',
        title: '오늘 함께하면 좋은 띠',
        content: `${compatibleInfo.good.join(', ')}\n\n${compatibleInfo.reason}`,
        score: 74 + (combinedHash % 16),
      },
      {
        emoji: '⚠️',
        title: '주의할 점',
        content: `피하면 좋은 색상: ${gishinInfo.color}\n피하면 좋은 방향: ${gishinInfo.direction}\n\n${gishinInfo.reason}`,
        score: 70,
      },
    ],
    luckyInfo: {
      color: colorInfo.color,
      number: luckyNumbers,
      direction: directionInfo.direction,
      item: itemInfo.item,
    },
    advice: elementAdvice[colorInfo.element] || elementAdvice['토(土)'],
  };
}
