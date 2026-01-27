/**
 * 행운 아이템 및 부적 정보 서비스
 * 오행 기반 행운의 색상, 숫자, 방향, 음식, 아이템, 부적 정보 제공
 */

// 오행별 행운 정보
interface LuckyInfo {
  colors: string[];
  colorEmojis: string[];
  numbers: number[];
  directions: string[];
  foods: string[];
  items: string[];
  gemstones: string[];
  flowers: string[];
  animals: string[];
}

const ELEMENT_LUCKY_INFO: Record<string, LuckyInfo> = {
  '목': {
    colors: ['초록색', '청록색', '연두색', '에메랄드색'],
    colorEmojis: ['💚', '🌿', '🍀', '🌲'],
    numbers: [3, 8, 13, 18, 23, 28],
    directions: ['동쪽', '동남쪽'],
    foods: ['시금치', '브로콜리', '녹차', '신맛나는 과일', '식초류'],
    items: ['나무 소품', '식물 화분', '대나무 제품', '녹색 지갑'],
    gemstones: ['에메랄드', '비취', '페리도트', '말라카이트'],
    flowers: ['난초', '대나무', '소나무', '녹색 식물'],
    animals: ['호랑이', '토끼', '용']
  },
  '화': {
    colors: ['빨간색', '주황색', '보라색', '분홍색'],
    colorEmojis: ['❤️', '🧡', '💜', '💗'],
    numbers: [2, 7, 12, 17, 22, 27],
    directions: ['남쪽', '남동쪽'],
    foods: ['고추', '토마토', '딸기', '쓴맛 음식', '커피'],
    items: ['양초', '조명', '붉은 소품', '삼각형 장식'],
    gemstones: ['루비', '가넷', '산호', '카넬리안'],
    flowers: ['장미', '튤립', '홍매화', '작약'],
    animals: ['말', '뱀', '봉황']
  },
  '토': {
    colors: ['노란색', '베이지색', '갈색', '황토색'],
    colorEmojis: ['💛', '🤎', '🟤', '🟡'],
    numbers: [5, 10, 15, 20, 25, 30],
    directions: ['중앙', '남서쪽', '북동쪽'],
    foods: ['고구마', '호박', '옥수수', '단맛 음식', '꿀'],
    items: ['도자기', '흙 화분', '황토 제품', '사각형 장식'],
    gemstones: ['호박석', '황옥', '시트린', '타이거아이'],
    flowers: ['해바라기', '국화', '민들레', '카네이션'],
    animals: ['소', '양', '개', '용']
  },
  '금': {
    colors: ['흰색', '금색', '은색', '베이지색'],
    colorEmojis: ['🤍', '💛', '🩶', '⬜'],
    numbers: [4, 9, 14, 19, 24, 29],
    directions: ['서쪽', '북서쪽'],
    foods: ['무', '배', '양파', '매운맛 음식', '생강'],
    items: ['금속 소품', '동전', '시계', '원형 장식'],
    gemstones: ['다이아몬드', '수정', '백금', '진주'],
    flowers: ['백합', '목련', '치자', '흰 장미'],
    animals: ['닭', '원숭이', '호랑이']
  },
  '수': {
    colors: ['검은색', '파란색', '남색', '보라색'],
    colorEmojis: ['🖤', '💙', '💜', '🩵'],
    numbers: [1, 6, 11, 16, 21, 26],
    directions: ['북쪽', '북서쪽'],
    foods: ['미역', '다시마', '검은콩', '짠맛 음식', '조개류'],
    items: ['수정 구슬', '유리 제품', '물 관련 소품', '곡선형 장식'],
    gemstones: ['사파이어', '아쿠아마린', '라피스라줄리', '터키석'],
    flowers: ['수선화', '연꽃', '물망초', '파란 수국'],
    animals: ['돼지', '쥐', '거북이']
  }
};

// 부적 정보
interface TalismanInfo {
  name: string;
  purpose: string;
  description: string;
  emoji: string;
  elements: string[];
  bestTime: string;
}

const TALISMANS: TalismanInfo[] = [
  {
    name: '재물부',
    purpose: '재물운 상승',
    description: '금전 운이 상승하고 재물이 들어오는 부적입니다. 지갑이나 금고 근처에 두면 좋습니다.',
    emoji: '💰',
    elements: ['금', '토'],
    bestTime: '보름달이 뜨는 날'
  },
  {
    name: '학업부',
    purpose: '시험 합격, 학업 성취',
    description: '집중력을 높이고 시험운을 상승시키는 부적입니다. 책상이나 필통 근처에 두세요.',
    emoji: '📚',
    elements: ['목', '화'],
    bestTime: '새벽 5-7시 (卯時)'
  },
  {
    name: '연애부',
    purpose: '좋은 인연 만남',
    description: '좋은 이성을 만나게 해주는 부적입니다. 침실이나 가방에 지니고 다니세요.',
    emoji: '💕',
    elements: ['화', '목'],
    bestTime: '칠월 칠석, 발렌타인데이'
  },
  {
    name: '건강부',
    purpose: '건강 회복, 무병장수',
    description: '건강을 지키고 병을 예방하는 부적입니다. 침대 머리맡에 두면 좋습니다.',
    emoji: '💪',
    elements: ['목', '수'],
    bestTime: '입춘, 단오'
  },
  {
    name: '액막이부',
    purpose: '재앙 방지, 액운 제거',
    description: '나쁜 기운을 막고 재앙을 방지하는 부적입니다. 현관문 안쪽에 붙이세요.',
    emoji: '🛡️',
    elements: ['금', '수'],
    bestTime: '동지, 그믐날'
  },
  {
    name: '승진부',
    purpose: '승진, 취업, 사업 성공',
    description: '직장에서 인정받고 승진하는 부적입니다. 사무실 책상에 두세요.',
    emoji: '🏆',
    elements: ['화', '토'],
    bestTime: '새해 첫날, 입춘'
  },
  {
    name: '가정화목부',
    purpose: '가정의 평화와 화합',
    description: '가족 간의 불화를 막고 화목을 가져오는 부적입니다. 거실에 두세요.',
    emoji: '🏠',
    elements: ['토', '목'],
    bestTime: '추석, 설날'
  },
  {
    name: '사업번창부',
    purpose: '장사 번창, 사업 성공',
    description: '사업이 번창하고 손님이 많이 오게 하는 부적입니다. 가게 입구나 금고 근처에 두세요.',
    emoji: '🏪',
    elements: ['금', '화'],
    bestTime: '정월 대보름'
  }
];

// 일간(천간)별 용신 오행 매핑
const DAY_MASTER_YONGSIN: Record<string, string[]> = {
  '갑': ['화', '토'], // 목 일간 - 설기하는 화, 재성의 토
  '을': ['화', '토'],
  '병': ['토', '금'], // 화 일간 - 설기하는 토, 재성의 금
  '정': ['토', '금'],
  '무': ['금', '수'], // 토 일간 - 설기하는 금, 재성의 수
  '기': ['금', '수'],
  '경': ['수', '목'], // 금 일간 - 설기하는 수, 재성의 목
  '신': ['수', '목'],
  '임': ['목', '화'], // 수 일간 - 설기하는 목, 재성의 화
  '계': ['목', '화']
};

// 일간별 기본 오행
const DAY_MASTER_ELEMENT: Record<string, string> = {
  '갑': '목', '을': '목',
  '병': '화', '정': '화',
  '무': '토', '기': '토',
  '경': '금', '신': '금',
  '임': '수', '계': '수'
};

// 오행 상생 관계
const ELEMENT_GENERATES: Record<string, string> = {
  '목': '화', // 목생화
  '화': '토', // 화생토
  '토': '금', // 토생금
  '금': '수', // 금생수
  '수': '목'  // 수생목
};

// 오행 상극 관계 (내가 극하는 것)
const ELEMENT_CONTROLS: Record<string, string> = {
  '목': '토', // 목극토
  '화': '금', // 화극금
  '토': '수', // 토극수
  '금': '목', // 금극목
  '수': '화'  // 수극화
};

export interface DailyLuckyInfo {
  date: string;
  dayGanji: string;
  luckyElement: string;
  luckyColors: string[];
  luckyColorEmojis: string[];
  luckyNumbers: number[];
  luckyDirection: string;
  luckyFood: string;
  luckyItem: string;
  avoidElement: string;
  avoidColor: string;
  avoidDirection: string;
  advice: string;
}

export interface PersonalLuckyInfo {
  primaryElement: string;
  supportElement: string;
  luckyColors: string[];
  luckyColorEmojis: string[];
  luckyNumbers: number[];
  luckyDirections: string[];
  luckyFoods: string[];
  luckyItems: string[];
  luckyGemstones: string[];
  luckyFlowers: string[];
  luckyAnimals: string[];
  avoidElement: string;
  avoidColors: string[];
  recommendedTalismans: TalismanInfo[];
}

/**
 * 오늘의 행운 정보 계산
 */
export function getDailyLuckyInfo(dayGan: string, dayJi: string): DailyLuckyInfo {
  const today = new Date();
  const dayElement = DAY_MASTER_ELEMENT[dayGan] || '목';
  const luckyElement = ELEMENT_GENERATES[dayElement]; // 일간이 생하는 오행이 길
  const avoidElement = ELEMENT_CONTROLS[dayElement]; // 일간이 극하는 오행은 주의

  const luckyInfo = ELEMENT_LUCKY_INFO[luckyElement];
  const avoidInfo = ELEMENT_LUCKY_INFO[avoidElement];

  // 오늘의 조언 생성
  const advices = [
    `오늘은 ${luckyElement}의 기운이 좋습니다. ${luckyInfo.colors[0]} 계열을 활용하세요.`,
    `${luckyInfo.directions[0]} 방향으로 이동하면 좋은 기운을 받을 수 있습니다.`,
    `오늘의 행운 음식은 ${luckyInfo.foods[Math.floor(Math.random() * luckyInfo.foods.length)]}입니다.`,
    `${avoidInfo.colors[0]} 계열은 피하는 것이 좋겠습니다.`,
    `숫자 ${luckyInfo.numbers[0]}과 ${luckyInfo.numbers[1]}이 오늘의 행운 숫자입니다.`
  ];

  return {
    date: `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`,
    dayGanji: `${dayGan}${dayJi}`,
    luckyElement,
    luckyColors: luckyInfo.colors.slice(0, 3),
    luckyColorEmojis: luckyInfo.colorEmojis.slice(0, 3),
    luckyNumbers: luckyInfo.numbers.slice(0, 3),
    luckyDirection: luckyInfo.directions[0],
    luckyFood: luckyInfo.foods[Math.floor(Math.random() * luckyInfo.foods.length)],
    luckyItem: luckyInfo.items[Math.floor(Math.random() * luckyInfo.items.length)],
    avoidElement,
    avoidColor: avoidInfo.colors[0],
    avoidDirection: avoidInfo.directions[0],
    advice: advices[Math.floor(Math.random() * advices.length)]
  };
}

/**
 * 개인 사주 기반 행운 정보 계산
 */
export function getPersonalLuckyInfo(
  dayGan: string,
  sajuPaljaElements?: Record<string, number>
): PersonalLuckyInfo {
  // 일간의 기본 오행
  const myElement = DAY_MASTER_ELEMENT[dayGan] || '목';

  // 용신 오행들
  const yongsinElements = DAY_MASTER_YONGSIN[dayGan] || ['화', '토'];
  const primaryElement = yongsinElements[0];
  const supportElement = yongsinElements[1];

  // 피해야 할 오행 (나를 극하는 오행)
  const avoidElement = Object.entries(ELEMENT_CONTROLS)
    .find(([_, target]) => target === myElement)?.[0] || '금';

  // 행운 정보 수집
  const primaryInfo = ELEMENT_LUCKY_INFO[primaryElement];
  const supportInfo = ELEMENT_LUCKY_INFO[supportElement];
  const avoidInfo = ELEMENT_LUCKY_INFO[avoidElement];

  // 추천 부적 찾기
  const recommendedTalismans = TALISMANS.filter(t =>
    t.elements.includes(primaryElement) || t.elements.includes(supportElement)
  );

  return {
    primaryElement,
    supportElement,
    luckyColors: [...primaryInfo.colors.slice(0, 2), ...supportInfo.colors.slice(0, 2)],
    luckyColorEmojis: [...primaryInfo.colorEmojis.slice(0, 2), ...supportInfo.colorEmojis.slice(0, 2)],
    luckyNumbers: [...primaryInfo.numbers.slice(0, 2), ...supportInfo.numbers.slice(0, 2)],
    luckyDirections: [...primaryInfo.directions, ...supportInfo.directions],
    luckyFoods: [...primaryInfo.foods.slice(0, 2), ...supportInfo.foods.slice(0, 2)],
    luckyItems: [...primaryInfo.items.slice(0, 2), ...supportInfo.items.slice(0, 2)],
    luckyGemstones: [...primaryInfo.gemstones.slice(0, 2), ...supportInfo.gemstones.slice(0, 2)],
    luckyFlowers: [...primaryInfo.flowers.slice(0, 2), ...supportInfo.flowers.slice(0, 2)],
    luckyAnimals: [...new Set([...primaryInfo.animals, ...supportInfo.animals])].slice(0, 4),
    avoidElement,
    avoidColors: avoidInfo.colors.slice(0, 2),
    recommendedTalismans: recommendedTalismans.slice(0, 4)
  };
}

/**
 * 모든 부적 목록 반환
 */
export function getAllTalismans(): TalismanInfo[] {
  return TALISMANS;
}

/**
 * 특정 목적의 부적 찾기
 */
export function findTalismanByPurpose(keyword: string): TalismanInfo[] {
  return TALISMANS.filter(t =>
    t.purpose.includes(keyword) || t.description.includes(keyword)
  );
}

/**
 * 오행별 행운 정보 반환
 */
export function getElementLuckyInfo(element: string): LuckyInfo | null {
  return ELEMENT_LUCKY_INFO[element] || null;
}

/**
 * 오늘의 행운 숫자 (로또 등)
 */
export function getTodayLuckyNumbers(dayGan: string, count: number = 6): number[] {
  const yongsinElements = DAY_MASTER_YONGSIN[dayGan] || ['화', '토'];
  const allNumbers: number[] = [];

  yongsinElements.forEach(element => {
    const info = ELEMENT_LUCKY_INFO[element];
    if (info) {
      allNumbers.push(...info.numbers);
    }
  });

  // 셔플하고 지정된 개수만큼 반환
  const shuffled = allNumbers.sort(() => Math.random() - 0.5);
  const selected = [...new Set(shuffled)].slice(0, count);

  // 1-45 범위 필터 및 부족한 경우 추가
  let result = selected.filter(n => n >= 1 && n <= 45);
  while (result.length < count) {
    const newNum = Math.floor(Math.random() * 45) + 1;
    if (!result.includes(newNum)) {
      result.push(newNum);
    }
  }

  return result.sort((a, b) => a - b);
}

/**
 * 시간대별 행운 정보
 */
export interface TimeSlotLucky {
  time: string;
  timeRange: string;
  element: string;
  activity: string;
  emoji: string;
}

export function getTimeSlotLucky(): TimeSlotLucky[] {
  return [
    { time: '자시', timeRange: '23:00-01:00', element: '수', activity: '명상, 계획 수립', emoji: '🌙' },
    { time: '축시', timeRange: '01:00-03:00', element: '토', activity: '깊은 수면, 휴식', emoji: '😴' },
    { time: '인시', timeRange: '03:00-05:00', element: '목', activity: '기상, 가벼운 운동', emoji: '🌅' },
    { time: '묘시', timeRange: '05:00-07:00', element: '목', activity: '학습, 독서', emoji: '📖' },
    { time: '진시', timeRange: '07:00-09:00', element: '토', activity: '아침 식사, 출근', emoji: '🍳' },
    { time: '사시', timeRange: '09:00-11:00', element: '화', activity: '중요 업무, 회의', emoji: '💼' },
    { time: '오시', timeRange: '11:00-13:00', element: '화', activity: '점심, 사교 활동', emoji: '☀️' },
    { time: '미시', timeRange: '13:00-15:00', element: '토', activity: '창의적 작업', emoji: '💡' },
    { time: '신시', timeRange: '15:00-17:00', element: '금', activity: '마무리 업무, 정리', emoji: '📋' },
    { time: '유시', timeRange: '17:00-19:00', element: '금', activity: '퇴근, 취미 활동', emoji: '🏃' },
    { time: '술시', timeRange: '19:00-21:00', element: '토', activity: '저녁 식사, 가족 시간', emoji: '🍽️' },
    { time: '해시', timeRange: '21:00-23:00', element: '수', activity: '휴식, 내일 준비', emoji: '🌃' }
  ];
}

/**
 * 월별 행운 테마
 */
export function getMonthlyLuckyTheme(month: number): {
  theme: string;
  element: string;
  focus: string;
  emoji: string;
} {
  const themes = [
    { theme: '새해 계획', element: '수', focus: '새로운 시작과 목표 설정', emoji: '🎊' },
    { theme: '성장의 시기', element: '목', focus: '학습과 자기개발', emoji: '🌱' },
    { theme: '봄의 기운', element: '목', focus: '새로운 인연과 시작', emoji: '🌸' },
    { theme: '활력의 시기', element: '화', focus: '적극적인 활동과 도전', emoji: '🔥' },
    { theme: '풍요의 시작', element: '화', focus: '열정과 에너지', emoji: '☀️' },
    { theme: '결실 준비', element: '토', focus: '안정과 준비', emoji: '🌾' },
    { theme: '하반기 시작', element: '토', focus: '재정비와 계획', emoji: '📅' },
    { theme: '수확의 시기', element: '금', focus: '결과물 정리', emoji: '🍂' },
    { theme: '풍요의 계절', element: '금', focus: '감사와 나눔', emoji: '🎑' },
    { theme: '정리의 시기', element: '토', focus: '마무리와 정리', emoji: '🍁' },
    { theme: '성찰의 시기', element: '수', focus: '내면 성찰', emoji: '❄️' },
    { theme: '마무리', element: '수', focus: '한 해 정리와 감사', emoji: '🎄' }
  ];

  return themes[month - 1] || themes[0];
}
