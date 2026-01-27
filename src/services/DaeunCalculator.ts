/**
 * 대운(大運) 및 세운(歲運) 계산 서비스
 * 10년 단위 운세 흐름과 연간 운세를 분석합니다.
 */

// 천간
const HEAVENLY_STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
// 지지
const EARTHLY_BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

// 천간 오행
const STEM_ELEMENTS: Record<string, string> = {
  '갑': '목', '을': '목', '병': '화', '정': '화', '무': '토',
  '기': '토', '경': '금', '신': '금', '임': '수', '계': '수'
};

// 지지 오행
const BRANCH_ELEMENTS: Record<string, string> = {
  '자': '수', '축': '토', '인': '목', '묘': '목', '진': '토', '사': '화',
  '오': '화', '미': '토', '신': '금', '유': '금', '술': '토', '해': '수'
};

// 오행 상생 관계
const ELEMENT_GENERATES: Record<string, string> = {
  '목': '화', '화': '토', '토': '금', '금': '수', '수': '목'
};

// 오행 상극 관계
const ELEMENT_CONTROLS: Record<string, string> = {
  '목': '토', '화': '금', '토': '수', '금': '목', '수': '화'
};

// 십신 계산
const TEN_GODS: Record<string, Record<string, string>> = {
  '갑': { '갑': '비견', '을': '겁재', '병': '식신', '정': '상관', '무': '편재', '기': '정재', '경': '편관', '신': '정관', '임': '편인', '계': '정인' },
  '을': { '을': '비견', '갑': '겁재', '정': '식신', '병': '상관', '기': '편재', '무': '정재', '신': '편관', '경': '정관', '계': '편인', '임': '정인' },
  '병': { '병': '비견', '정': '겁재', '무': '식신', '기': '상관', '경': '편재', '신': '정재', '임': '편관', '계': '정관', '갑': '편인', '을': '정인' },
  '정': { '정': '비견', '병': '겁재', '기': '식신', '무': '상관', '신': '편재', '경': '정재', '계': '편관', '임': '정관', '을': '편인', '갑': '정인' },
  '무': { '무': '비견', '기': '겁재', '경': '식신', '신': '상관', '임': '편재', '계': '정재', '갑': '편관', '을': '정관', '병': '편인', '정': '정인' },
  '기': { '기': '비견', '무': '겁재', '신': '식신', '경': '상관', '계': '편재', '임': '정재', '을': '편관', '갑': '정관', '정': '편인', '병': '정인' },
  '경': { '경': '비견', '신': '겁재', '임': '식신', '계': '상관', '갑': '편재', '을': '정재', '병': '편관', '정': '정관', '무': '편인', '기': '정인' },
  '신': { '신': '비견', '경': '겁재', '계': '식신', '임': '상관', '을': '편재', '갑': '정재', '정': '편관', '병': '정관', '기': '편인', '무': '정인' },
  '임': { '임': '비견', '계': '겁재', '갑': '식신', '을': '상관', '병': '편재', '정': '정재', '무': '편관', '기': '정관', '경': '편인', '신': '정인' },
  '계': { '계': '비견', '임': '겁재', '을': '식신', '갑': '상관', '정': '편재', '병': '정재', '기': '편관', '무': '정관', '신': '편인', '경': '정인' },
};

// 십신 해석
const TEN_GOD_MEANINGS: Record<string, { keyword: string; good: string; bad: string }> = {
  '비견': { keyword: '경쟁/독립', good: '독립심, 자신감, 경쟁력 상승', bad: '고집, 경쟁자 출현, 손재' },
  '겁재': { keyword: '협력/경쟁', good: '파트너십, 협력 관계', bad: '재물 손실, 배신, 다툼' },
  '식신': { keyword: '표현/재능', good: '재능 발휘, 건강, 자녀운', bad: '체력 소모, 과식, 나태' },
  '상관': { keyword: '창의/반항', good: '창의력, 언변, 예술성', bad: '구설수, 관재, 반항심' },
  '편재': { keyword: '사업/투자', good: '사업운, 투자 수익, 이성운', bad: '투기 실패, 돈 문제' },
  '정재': { keyword: '안정/저축', good: '안정적 수입, 저축, 결혼운', bad: '인색, 융통성 부족' },
  '편관': { keyword: '권력/도전', good: '승진, 명예, 추진력', bad: '사고, 관재, 스트레스' },
  '정관': { keyword: '명예/직장', good: '승진, 안정, 사회적 인정', bad: '경직, 압박감' },
  '편인': { keyword: '학문/변화', good: '공부, 자격증, 새로운 기술', bad: '불안정, 방황, 건강' },
  '정인': { keyword: '학문/보호', good: '학업 성취, 어른 도움, 자격', bad: '의존성, 게으름' },
};

export interface Daeun {
  order: number;           // 대운 순번 (1, 2, 3...)
  startAge: number;        // 시작 나이
  endAge: number;          // 끝 나이
  gan: string;             // 천간
  ji: string;              // 지지
  ganJi: string;           // 천간+지지 (예: 갑자)
  element: string;         // 주요 오행
  tenGod: string;          // 십신
  score: number;           // 운세 점수 (1-100)
  keyword: string;         // 핵심 키워드
  description: string;     // 설명
  goodAspects: string[];   // 좋은 점
  badAspects: string[];    // 주의할 점
  isCurrent: boolean;      // 현재 대운인지
}

export interface Seun {
  year: number;            // 연도
  age: number;             // 나이
  gan: string;             // 천간
  ji: string;              // 지지
  ganJi: string;           // 천간+지지
  animal: string;          // 띠
  tenGod: string;          // 십신
  score: number;           // 운세 점수
  keyword: string;         // 핵심 키워드
  description: string;     // 설명
  monthlyHighlight: string;// 주요 달
  isCurrent: boolean;      // 올해인지
}

export interface DaeunAnalysis {
  daeunList: Daeun[];      // 대운 목록
  currentDaeun: Daeun | null; // 현재 대운
  nextDaeun: Daeun | null; // 다음 대운
  seunList: Seun[];        // 최근 세운 목록
  currentSeun: Seun | null;// 올해 세운
  lifeGraph: { age: number; score: number }[]; // 인생 그래프
  summary: string;         // 종합 요약
  advice: string;          // 조언
}

// 띠 이름
const ANIMAL_NAMES = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

/**
 * 대운 시작 나이 계산 (성별과 생년에 따라 다름)
 */
function calculateDaeunStartAge(
  birthYear: number,
  birthMonth: number,
  gender: 'male' | 'female'
): number {
  // 년간의 음양 확인
  const stemIndex = (birthYear - 4) % 10;
  const isYangYear = stemIndex % 2 === 0; // 갑병무경임 = 양

  // 남자 양년생, 여자 음년생 = 순행 (절기까지 남은 일수)
  // 남자 음년생, 여자 양년생 = 역행 (절기부터 지난 일수)
  const isForward = (gender === 'male' && isYangYear) || (gender === 'female' && !isYangYear);

  // 간략화: 평균 대운수 사용 (실제로는 절기 계산 필요)
  // 생월에 따라 대략적인 대운수 계산
  const baseAge = Math.floor((birthMonth * 3 + 1) / 12) + 1;

  return Math.max(1, Math.min(baseAge, 10));
}

/**
 * 대운 천간지지 계산
 */
function calculateDaeunGanJi(
  monthGan: string,
  monthJi: string,
  order: number,
  isForward: boolean
): { gan: string; ji: string } {
  const ganIndex = HEAVENLY_STEMS.indexOf(monthGan);
  const jiIndex = EARTHLY_BRANCHES.indexOf(monthJi);

  const direction = isForward ? 1 : -1;
  const newGanIndex = (ganIndex + direction * order + 10) % 10;
  const newJiIndex = (jiIndex + direction * order + 12) % 12;

  return {
    gan: HEAVENLY_STEMS[newGanIndex],
    ji: EARTHLY_BRANCHES[newJiIndex]
  };
}

/**
 * 운세 점수 계산
 */
function calculateFortuneScore(
  dayGan: string,
  targetGan: string,
  targetJi: string
): number {
  const dayElement = STEM_ELEMENTS[dayGan];
  const ganElement = STEM_ELEMENTS[targetGan];
  const jiElement = BRANCH_ELEMENTS[targetJi];

  let score = 50; // 기본 점수

  // 천간 관계
  if (ganElement === dayElement) {
    score += 10; // 비화
  } else if (ELEMENT_GENERATES[ganElement] === dayElement) {
    score += 20; // 생해줌
  } else if (ELEMENT_GENERATES[dayElement] === ganElement) {
    score += 5; // 설기
  } else if (ELEMENT_CONTROLS[ganElement] === dayElement) {
    score -= 15; // 극받음
  } else if (ELEMENT_CONTROLS[dayElement] === ganElement) {
    score += 15; // 극함
  }

  // 지지 관계
  if (jiElement === dayElement) {
    score += 8;
  } else if (ELEMENT_GENERATES[jiElement] === dayElement) {
    score += 15;
  } else if (ELEMENT_CONTROLS[jiElement] === dayElement) {
    score -= 10;
  }

  // 십신에 따른 조정
  const tenGod = TEN_GODS[dayGan]?.[targetGan] || '';
  if (['정관', '정인', '정재'].includes(tenGod)) {
    score += 10;
  } else if (['편관', '겁재', '상관'].includes(tenGod)) {
    score -= 5;
  }

  return Math.max(20, Math.min(95, score));
}

/**
 * 대운/세운 종합 분석
 */
export function analyzeDaeunSeun(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  birthHour: number | null,
  gender: 'male' | 'female',
  dayGan: string,
  monthGan: string,
  monthJi: string
): DaeunAnalysis {
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthYear + 1; // 한국 나이

  // 년간의 음양으로 순역 결정
  const stemIndex = (birthYear - 4) % 10;
  const isYangYear = stemIndex % 2 === 0;
  const isForward = (gender === 'male' && isYangYear) || (gender === 'female' && !isYangYear);

  // 대운 시작 나이
  const daeunStartAge = calculateDaeunStartAge(birthYear, birthMonth, gender);

  // 대운 목록 생성 (8개 대운)
  const daeunList: Daeun[] = [];
  let currentDaeun: Daeun | null = null;
  let nextDaeun: Daeun | null = null;

  for (let i = 0; i < 8; i++) {
    const startAge = daeunStartAge + i * 10;
    const endAge = startAge + 9;
    const { gan, ji } = calculateDaeunGanJi(monthGan, monthJi, i + 1, isForward);
    const tenGod = TEN_GODS[dayGan]?.[gan] || '비견';
    const score = calculateFortuneScore(dayGan, gan, ji);
    const meaning = TEN_GOD_MEANINGS[tenGod] || TEN_GOD_MEANINGS['비견'];

    const isCurrent = currentAge >= startAge && currentAge <= endAge;
    const isNext = currentAge < startAge && !nextDaeun;

    const daeun: Daeun = {
      order: i + 1,
      startAge,
      endAge,
      gan,
      ji,
      ganJi: `${gan}${ji}`,
      element: STEM_ELEMENTS[gan],
      tenGod,
      score,
      keyword: meaning.keyword,
      description: generateDaeunDescription(tenGod, score, startAge, endAge),
      goodAspects: [meaning.good],
      badAspects: [meaning.bad],
      isCurrent
    };

    daeunList.push(daeun);

    if (isCurrent) currentDaeun = daeun;
    if (isNext) nextDaeun = daeun;
  }

  // 세운 목록 생성 (과거 2년 + 올해 + 미래 5년)
  const seunList: Seun[] = [];
  let currentSeun: Seun | null = null;

  for (let yearOffset = -2; yearOffset <= 5; yearOffset++) {
    const year = currentYear + yearOffset;
    const age = year - birthYear + 1;
    const stemIdx = (year - 4) % 10;
    const branchIdx = (year - 4) % 12;
    const gan = HEAVENLY_STEMS[stemIdx];
    const ji = EARTHLY_BRANCHES[branchIdx];
    const animal = ANIMAL_NAMES[branchIdx];
    const tenGod = TEN_GODS[dayGan]?.[gan] || '비견';
    const score = calculateFortuneScore(dayGan, gan, ji);
    const meaning = TEN_GOD_MEANINGS[tenGod] || TEN_GOD_MEANINGS['비견'];

    const isCurrent = yearOffset === 0;

    const seun: Seun = {
      year,
      age,
      gan,
      ji,
      ganJi: `${gan}${ji}`,
      animal,
      tenGod,
      score,
      keyword: meaning.keyword,
      description: generateSeunDescription(tenGod, score, year),
      monthlyHighlight: getMonthlyHighlight(score),
      isCurrent
    };

    seunList.push(seun);

    if (isCurrent) currentSeun = seun;
  }

  // 인생 그래프 생성
  const lifeGraph: { age: number; score: number }[] = [];
  for (const daeun of daeunList) {
    for (let age = daeun.startAge; age <= daeun.endAge; age++) {
      // 대운 점수 + 약간의 변동
      const variation = Math.sin(age * 0.5) * 10;
      lifeGraph.push({
        age,
        score: Math.max(20, Math.min(95, daeun.score + variation))
      });
    }
  }

  // 종합 요약
  const summary = generateSummary(currentDaeun, currentSeun, currentAge);
  const advice = generateAdvice(currentDaeun, currentSeun);

  return {
    daeunList,
    currentDaeun,
    nextDaeun,
    seunList,
    currentSeun,
    lifeGraph,
    summary,
    advice
  };
}

function generateDaeunDescription(tenGod: string, score: number, startAge: number, endAge: number): string {
  const level = score >= 70 ? '좋은' : score >= 50 ? '평온한' : '도전적인';
  const meaning = TEN_GOD_MEANINGS[tenGod]?.keyword || '변화';

  return `${startAge}~${endAge}세는 ${meaning}의 기운이 강한 ${level} 시기입니다. ` +
    `${tenGod} 대운으로 ${score >= 60 ? '전반적으로 순조로운 흐름' : '노력이 필요한 시기'}입니다.`;
}

function generateSeunDescription(tenGod: string, score: number, year: number): string {
  const level = score >= 70 ? '행운의' : score >= 50 ? '안정적인' : '시련의';

  return `${year}년은 ${tenGod}의 기운이 작용하는 ${level} 해입니다.`;
}

function getMonthlyHighlight(score: number): string {
  if (score >= 70) return '3월, 7월, 11월이 특히 좋습니다';
  if (score >= 50) return '봄과 가을에 기회가 많습니다';
  return '여름에 조심하고, 겨울에 재충전하세요';
}

function generateSummary(
  currentDaeun: Daeun | null,
  currentSeun: Seun | null,
  currentAge: number
): string {
  if (!currentDaeun || !currentSeun) {
    return '대운과 세운 분석을 통해 인생의 흐름을 파악할 수 있습니다.';
  }

  const daeunLevel = currentDaeun.score >= 65 ? '좋은' : currentDaeun.score >= 45 ? '평온한' : '도전적인';
  const seunLevel = currentSeun.score >= 65 ? '순조로운' : currentSeun.score >= 45 ? '무난한' : '시련이 있는';

  return `현재 ${currentAge}세로 ${currentDaeun.ganJi} 대운 중입니다. ` +
    `${daeunLevel} 대운 흐름 속에서 올해는 ${seunLevel} 해입니다. ` +
    `대운 십신 ${currentDaeun.tenGod}과 세운 십신 ${currentSeun.tenGod}의 조합으로 ` +
    `${currentDaeun.keyword}와 ${currentSeun.keyword}에 집중하면 좋겠습니다.`;
}

function generateAdvice(
  currentDaeun: Daeun | null,
  currentSeun: Seun | null
): string {
  if (!currentDaeun || !currentSeun) {
    return '사주팔자를 기반으로 대운과 세운을 분석해보세요.';
  }

  const avgScore = (currentDaeun.score + currentSeun.score) / 2;

  if (avgScore >= 70) {
    return '운이 좋은 시기입니다. 새로운 도전과 투자에 적극적으로 임하세요. 다만 과욕은 금물입니다.';
  } else if (avgScore >= 55) {
    return '안정적인 시기입니다. 현재 하는 일에 충실하면서 내실을 다지세요. 큰 변화보다 점진적 발전이 좋습니다.';
  } else if (avgScore >= 40) {
    return '인내가 필요한 시기입니다. 무리한 확장보다 현상 유지에 집중하고, 건강과 인간관계에 신경 쓰세요.';
  } else {
    return '시련의 시기입니다. 큰 결정은 미루고, 내면 성장과 준비에 집중하세요. 이 시기가 지나면 좋은 운이 옵니다.';
  }
}

/**
 * 대운 전환기 정보
 */
export function getDaeunTransition(daeunList: Daeun[], currentAge: number): {
  isTransitioning: boolean;
  yearsUntilNext: number;
  nextDaeun: Daeun | null;
  message: string;
} {
  const currentDaeun = daeunList.find(d => d.isCurrent);
  const nextDaeun = daeunList.find(d => d.startAge > currentAge);

  if (!currentDaeun || !nextDaeun) {
    return {
      isTransitioning: false,
      yearsUntilNext: 0,
      nextDaeun: null,
      message: ''
    };
  }

  const yearsUntilNext = nextDaeun.startAge - currentAge;
  const isTransitioning = yearsUntilNext <= 2;

  let message = '';
  if (isTransitioning) {
    message = `${yearsUntilNext}년 후 ${nextDaeun.ganJi} 대운으로 전환됩니다. ` +
      `${nextDaeun.tenGod} 대운이 시작되니 ${nextDaeun.keyword} 관련 변화에 대비하세요.`;
  }

  return {
    isTransitioning,
    yearsUntilNext,
    nextDaeun,
    message
  };
}
