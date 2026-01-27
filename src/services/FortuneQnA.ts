/**
 * 운세 질문 답변 서비스
 * 사용자의 구체적인 질문에 사주 기반으로 답변합니다.
 */

// 오행 매핑
const STEM_ELEMENT: Record<string, string> = {
  '갑': '목', '을': '목', '병': '화', '정': '화', '무': '토',
  '기': '토', '경': '금', '신': '금', '임': '수', '계': '수',
};

const BRANCH_ELEMENT: Record<string, string> = {
  '자': '수', '축': '토', '인': '목', '묘': '목', '진': '토', '사': '화',
  '오': '화', '미': '토', '신': '금', '유': '금', '술': '토', '해': '수',
};

// 십신 (Ten Gods)
const TEN_GODS = {
  '비견': '형제, 동료, 경쟁자',
  '겁재': '형제, 경쟁, 다툼',
  '식신': '재능, 표현, 음식',
  '상관': '반항, 창의, 예술',
  '편재': '투자, 부동산, 아버지',
  '정재': '월급, 저축, 안정',
  '편관': '권력, 직장, 스트레스',
  '정관': '명예, 승진, 직업',
  '편인': '학문, 종교, 어머니',
  '정인': '학업, 자격증, 어머니',
};

// 오행 상생상극
const GENERATES: Record<string, string> = {
  '목': '화', '화': '토', '토': '금', '금': '수', '수': '목',
};

// 현재 연도 간지 계산
function getYearGanji(year: number): { stem: string; branch: string } {
  const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
  const stemIndex = (year - 4) % 10;
  const branchIndex = (year - 4) % 12;
  return { stem: STEMS[stemIndex], branch: BRANCHES[branchIndex] };
}

// ============================================
// 질문 카테고리 정의
// ============================================

export type QuestionCategory =
  | 'career_change'    // 이직/전직
  | 'career_promotion' // 승진
  | 'career_business'  // 사업/창업
  | 'love_timing'      // 연애 시기
  | 'love_marriage'    // 결혼 시기
  | 'love_current'     // 현재 연애
  | 'wealth_investment'// 투자
  | 'wealth_income'    // 재물운
  | 'move_house'       // 이사
  | 'health_general'   // 건강 전반
  | 'study_exam'       // 시험/자격증
  | 'relationship';    // 인간관계

export interface Question {
  id: QuestionCategory;
  title: string;
  question: string;
  icon: string;
  relatedTenGods: string[]; // 관련 십신
}

export const QUESTIONS: Question[] = [
  {
    id: 'career_change',
    title: '이직/전직',
    question: '올해 이직하면 좋을까요?',
    icon: '💼',
    relatedTenGods: ['정관', '편관', '역마'],
  },
  {
    id: 'career_promotion',
    title: '승진/성공',
    question: '올해 승진 가능할까요?',
    icon: '📈',
    relatedTenGods: ['정관', '정인', '편인'],
  },
  {
    id: 'career_business',
    title: '사업/창업',
    question: '사업을 시작해도 될까요?',
    icon: '🏢',
    relatedTenGods: ['편재', '식신', '상관'],
  },
  {
    id: 'love_timing',
    title: '연애 시기',
    question: '좋은 인연이 들어올까요?',
    icon: '💕',
    relatedTenGods: ['정재', '편재', '정관', '편관'],
  },
  {
    id: 'love_marriage',
    title: '결혼 시기',
    question: '올해 결혼해도 될까요?',
    icon: '💍',
    relatedTenGods: ['정재', '정관', '천을귀인'],
  },
  {
    id: 'love_current',
    title: '현재 연애',
    question: '지금 만나는 사람과 잘 될까요?',
    icon: '❤️',
    relatedTenGods: ['정재', '편재', '비견'],
  },
  {
    id: 'wealth_investment',
    title: '투자 운',
    question: '투자해도 될까요?',
    icon: '💰',
    relatedTenGods: ['편재', '정재', '식신'],
  },
  {
    id: 'wealth_income',
    title: '재물 운',
    question: '올해 재물운은 어떤가요?',
    icon: '🤑',
    relatedTenGods: ['정재', '편재'],
  },
  {
    id: 'move_house',
    title: '이사 운',
    question: '이사 가도 괜찮을까요?',
    icon: '🏠',
    relatedTenGods: ['역마', '편인', '정인'],
  },
  {
    id: 'health_general',
    title: '건강 운',
    question: '건강에 주의할 점이 있을까요?',
    icon: '🏥',
    relatedTenGods: ['비견', '겁재', '편인'],
  },
  {
    id: 'study_exam',
    title: '시험/학업',
    question: '시험에 합격할 수 있을까요?',
    icon: '📚',
    relatedTenGods: ['정인', '편인', '문창귀인'],
  },
  {
    id: 'relationship',
    title: '인간관계',
    question: '인간관계 운은 어떤가요?',
    icon: '🤝',
    relatedTenGods: ['비견', '겁재', '식신'],
  },
];

// ============================================
// 답변 생성
// ============================================

export interface Answer {
  question: Question;
  result: 'positive' | 'neutral' | 'negative';
  score: number; // 0~100
  summary: string;
  details: string[];
  timing: string; // 좋은 시기
  advice: string;
  caution: string;
}

export function generateAnswer(
  questionId: QuestionCategory,
  sajuResult: any,
  profile: any
): Answer {
  const question = QUESTIONS.find(q => q.id === questionId);
  if (!question) {
    throw new Error('Unknown question');
  }

  const { dayMaster, tenGods, pillars } = sajuResult;
  const currentYear = new Date().getFullYear();
  const yearGanji = getYearGanji(currentYear);

  const dayMasterElement = STEM_ELEMENT[dayMaster];
  const yearElement = STEM_ELEMENT[yearGanji.stem];
  const isMale = profile?.gender === 'male';

  // 기본 점수 계산 (세운과 일간의 관계)
  let baseScore = 60;

  // 상생 관계면 점수 증가
  if (GENERATES[yearElement] === dayMasterElement) {
    baseScore += 15; // 세운이 일간을 생함
  } else if (GENERATES[dayMasterElement] === yearElement) {
    baseScore += 5; // 일간이 세운을 생함 (설기)
  }

  // 십신 분석
  const hasTenGod = (godName: string): boolean => {
    return Object.values(tenGods || {}).includes(godName);
  };

  let score = baseScore;
  let summary = '';
  const details: string[] = [];
  let timing = '';
  let advice = '';
  let caution = '';

  switch (questionId) {
    // ============================================
    // 직업/커리어
    // ============================================
    case 'career_change':
      // 이직운: 역마살, 관성 체크
      if (hasTenGod('정관') || hasTenGod('편관')) {
        score += 10;
        details.push('관성이 있어 직장 인연이 좋습니다.');
      }
      // 세운 분석
      if (yearElement === '목' || yearElement === '수') {
        score += 5;
        details.push('올해는 새로운 시작에 유리한 기운입니다.');
      }

      if (score >= 70) {
        summary = '이직하기 좋은 시기입니다. 적극적으로 도전하세요.';
        timing = '봄(3~5월) 또는 가을(9~11월)이 유리합니다.';
        advice = '준비가 되었다면 망설이지 마세요. 좋은 기회가 옵니다.';
        caution = '급하게 결정하지 말고 조건을 꼼꼼히 비교하세요.';
      } else if (score >= 50) {
        summary = '이직은 가능하지만 신중해야 합니다.';
        timing = '상반기보다 하반기가 나을 수 있습니다.';
        advice = '현재 직장의 장점도 고려하세요.';
        caution = '감정적인 이직은 피하세요. 준비를 철저히 하세요.';
      } else {
        summary = '지금은 이직보다 현재 위치에서 실력을 쌓을 때입니다.';
        timing = '내년 이후를 노려보세요.';
        advice = '급하게 움직이지 말고 때를 기다리세요.';
        caution = '충동적인 퇴사는 후회를 부릅니다.';
      }
      break;

    case 'career_promotion':
      if (hasTenGod('정관')) {
        score += 15;
        details.push('정관이 있어 승진운이 좋습니다.');
      }
      if (hasTenGod('정인') || hasTenGod('편인')) {
        score += 10;
        details.push('인성이 있어 인정받기 좋습니다.');
      }

      if (score >= 70) {
        summary = '승진 가능성이 높습니다. 자신감을 가지세요.';
        timing = '상반기에 기회가 올 수 있습니다.';
        advice = '성과를 어필하고 적극적으로 임하세요.';
        caution = '동료와의 관계도 소홀히 하지 마세요.';
      } else if (score >= 50) {
        summary = '노력하면 승진할 수 있습니다.';
        timing = '하반기까지 꾸준히 노력하세요.';
        advice = '묵묵히 실력을 쌓으세요.';
        caution = '조급해하지 마세요. 때가 오면 인정받습니다.';
      } else {
        summary = '올해 승진은 어려울 수 있습니다.';
        timing = '내년을 준비하세요.';
        advice = '기본기를 다지는 데 집중하세요.';
        caution = '불만을 표출하면 역효과가 납니다.';
      }
      break;

    case 'career_business':
      if (hasTenGod('편재')) {
        score += 15;
        details.push('편재가 있어 사업 수완이 있습니다.');
      }
      if (hasTenGod('식신')) {
        score += 10;
        details.push('식신이 있어 아이디어가 풍부합니다.');
      }
      if (hasTenGod('상관')) {
        score += 5;
        details.push('상관이 있어 창의력이 뛰어납니다. 다만 신중함이 필요합니다.');
      }

      if (score >= 75) {
        summary = '사업을 시작하기 좋은 시기입니다.';
        timing = '봄~여름에 시작하면 유리합니다.';
        advice = '철저한 준비 후 과감하게 도전하세요.';
        caution = '파트너 선택을 신중히 하세요.';
      } else if (score >= 55) {
        summary = '소규모로 시작하면 가능합니다.';
        timing = '테스트 기간을 충분히 가지세요.';
        advice = '본업을 유지하면서 부업으로 시작하세요.';
        caution = '초기 투자를 최소화하세요.';
      } else {
        summary = '지금은 준비 기간입니다.';
        timing = '1~2년 후를 목표로 준비하세요.';
        advice = '자금과 인맥을 쌓는 데 집중하세요.';
        caution = '빚을 내서 시작하는 것은 위험합니다.';
      }
      break;

    // ============================================
    // 연애/결혼
    // ============================================
    case 'love_timing':
      const spouseStar = isMale
        ? (hasTenGod('정재') || hasTenGod('편재'))
        : (hasTenGod('정관') || hasTenGod('편관'));

      if (spouseStar) {
        score += 15;
        details.push('배우자성이 있어 연애 인연이 좋습니다.');
      }

      if (score >= 70) {
        summary = '올해 좋은 인연이 들어올 가능성이 높습니다.';
        timing = '봄(4~5월)과 가을(9~10월)에 인연이 올 수 있습니다.';
        advice = '적극적으로 모임에 나가고 소개팅에 응하세요.';
        caution = '첫인상에만 끌리지 말고 천천히 알아가세요.';
      } else if (score >= 50) {
        summary = '인연이 올 수 있지만 적극성이 필요합니다.';
        timing = '하반기에 기회가 더 많습니다.';
        advice = '외모나 매력을 가꾸는 노력을 하세요.';
        caution = '이상만 높이지 말고 열린 마음을 가지세요.';
      } else {
        summary = '올해는 자기 계발에 집중하는 것이 좋습니다.';
        timing = '내년 이후 인연이 들어올 수 있습니다.';
        advice = '혼자만의 시간을 즐기며 성장하세요.';
        caution = '억지로 만남을 갖으면 좋지 않은 인연을 만날 수 있습니다.';
      }
      break;

    case 'love_marriage':
      if (hasTenGod('정재') && isMale) {
        score += 15;
        details.push('정재가 있어 결혼 운이 좋습니다.');
      }
      if (hasTenGod('정관') && !isMale) {
        score += 15;
        details.push('정관이 있어 결혼 인연이 좋습니다.');
      }

      if (score >= 70) {
        summary = '결혼하기 좋은 해입니다.';
        timing = '봄(4~6월) 또는 가을(9~11월)이 좋습니다.';
        advice = '서로의 가족과 인사를 나누고 준비를 시작하세요.';
        caution = '결혼 준비 과정에서 다툼이 없도록 양보하세요.';
      } else if (score >= 50) {
        summary = '결혼 가능하지만 준비가 더 필요합니다.';
        timing = '하반기 이후가 더 안정적입니다.';
        advice = '급하게 진행하지 말고 충분히 준비하세요.';
        caution = '경제적 준비가 부족하면 미루는 것이 낫습니다.';
      } else {
        summary = '올해보다 내년이 더 좋을 수 있습니다.';
        timing = '1~2년 후를 목표로 준비하세요.';
        advice = '관계를 더 깊이 다지는 시간을 가지세요.';
        caution = '주변 압박에 밀려 서두르지 마세요.';
      }
      break;

    case 'love_current':
      if (score >= 65) {
        summary = '현재 연인과 좋은 관계가 지속될 수 있습니다.';
        details.push('서로의 장점을 인정하고 존중하는 관계입니다.');
        timing = '관계가 더 깊어질 수 있는 시기입니다.';
        advice = '소통을 많이 하고 서로를 이해하려 노력하세요.';
        caution = '당연하게 여기지 말고 표현을 자주 하세요.';
      } else if (score >= 45) {
        summary = '노력하면 잘 될 수 있습니다.';
        details.push('서로 맞추어가는 과정이 필요합니다.');
        timing = '위기가 올 수 있지만 극복 가능합니다.';
        advice = '대화로 문제를 풀어가세요.';
        caution = '감정적으로 대응하면 상처만 커집니다.';
      } else {
        summary = '관계를 점검해볼 필요가 있습니다.';
        details.push('근본적인 가치관 차이가 있을 수 있습니다.');
        timing = '냉정하게 생각해볼 시간이 필요합니다.';
        advice = '서로에게 진심인지 확인하세요.';
        caution = '미련에 이끌려 관계를 유지하면 더 힘들어집니다.';
      }
      break;

    // ============================================
    // 재물
    // ============================================
    case 'wealth_investment':
      if (hasTenGod('편재')) {
        score += 10;
        details.push('편재가 있어 투자 감각이 있습니다.');
      }
      if (hasTenGod('식신')) {
        score += 5;
        details.push('식신이 있어 돈 버는 아이디어가 있습니다.');
      }

      if (score >= 70) {
        summary = '투자하기 좋은 시기입니다.';
        timing = '상반기에 시작하면 좋습니다.';
        advice = '분산 투자를 권장합니다.';
        caution = '욕심을 부리면 손해를 볼 수 있습니다.';
      } else if (score >= 50) {
        summary = '소액 투자는 괜찮습니다.';
        timing = '급등락에 일희일비하지 마세요.';
        advice = '안정적인 자산에 투자하세요.';
        caution = '빚을 내서 투자하면 안 됩니다.';
      } else {
        summary = '올해는 투자보다 저축이 좋습니다.';
        timing = '내년 이후 기회를 노리세요.';
        advice = '종잣돈을 모으는 데 집중하세요.';
        caution = '고수익을 약속하는 제안을 조심하세요.';
      }
      break;

    case 'wealth_income':
      if (hasTenGod('정재') || hasTenGod('편재')) {
        score += 15;
        details.push('재성이 있어 재물 운이 있습니다.');
      }

      if (score >= 70) {
        summary = '올해 재물운이 좋습니다.';
        details.push('수입이 늘거나 예상치 못한 돈이 들어올 수 있습니다.');
        timing = '상반기와 4분기가 특히 좋습니다.';
        advice = '기회가 오면 놓치지 마세요.';
        caution = '들어온 만큼 나가지 않도록 관리하세요.';
      } else if (score >= 50) {
        summary = '평균적인 재물운입니다.';
        details.push('큰 변화는 없지만 안정적입니다.');
        timing = '꾸준히 노력하면 점점 나아집니다.';
        advice = '부수입 창출을 고민해보세요.';
        caution = '충동 구매를 자제하세요.';
      } else {
        summary = '지출에 주의해야 하는 해입니다.';
        details.push('예상치 못한 지출이 생길 수 있습니다.');
        timing = '하반기부터 조금씩 나아질 수 있습니다.';
        advice = '비상금을 마련해두세요.';
        caution = '보증이나 빚은 절대 피하세요.';
      }
      break;

    // ============================================
    // 기타
    // ============================================
    case 'move_house':
      // 역마 기운 체크
      if (yearElement === '목' || yearElement === '화') {
        score += 10;
        details.push('올해는 이동에 좋은 기운입니다.');
      }

      if (score >= 65) {
        summary = '이사해도 좋습니다.';
        timing = '봄(3~5월) 또는 가을(9~10월)이 좋습니다.';
        advice = `${dayMasterElement === '목' ? '동쪽이나 남쪽' :
                   dayMasterElement === '화' ? '남쪽' :
                   dayMasterElement === '토' ? '중앙 지역' :
                   dayMasterElement === '금' ? '서쪽' : '북쪽이나 동쪽'} 방향이 길합니다.`;
        caution = '손 없는 날을 택일하세요.';
      } else {
        summary = '올해는 현재 위치에서 안정을 취하는 것이 좋습니다.';
        timing = '내년 봄 이후를 고려하세요.';
        advice = '급하지 않다면 미루세요.';
        caution = '무리한 이사는 건강이나 재물에 영향을 줄 수 있습니다.';
      }
      break;

    case 'health_general':
      let weakOrgan = '';
      switch (dayMasterElement) {
        case '목': weakOrgan = '간, 담, 눈'; break;
        case '화': weakOrgan = '심장, 소장, 혀'; break;
        case '토': weakOrgan = '위장, 비장, 입'; break;
        case '금': weakOrgan = '폐, 대장, 피부'; break;
        case '수': weakOrgan = '신장, 방광, 귀'; break;
      }

      summary = `주의해야 할 장기는 ${weakOrgan}입니다.`;
      details.push(`${dayMasterElement} 오행이 강한 분은 ${weakOrgan} 계통이 약할 수 있습니다.`);
      timing = '환절기에 특히 주의하세요.';
      advice = '정기 검진을 받고, 해당 부위를 보강하는 음식을 섭취하세요.';
      caution = '과로와 스트레스를 피하세요.';
      break;

    case 'study_exam':
      if (hasTenGod('정인') || hasTenGod('편인')) {
        score += 15;
        details.push('인성이 있어 학업 운이 좋습니다.');
      }

      if (score >= 70) {
        summary = '시험 합격 가능성이 높습니다.';
        timing = '봄~여름에 보는 시험이 유리합니다.';
        advice = '계획대로 꾸준히 준비하세요.';
        caution = '자만하지 말고 끝까지 긴장하세요.';
      } else if (score >= 50) {
        summary = '노력하면 합격할 수 있습니다.';
        timing = '예상보다 힘들 수 있으니 일찍 준비하세요.';
        advice = '부족한 부분을 집중 보완하세요.';
        caution = '컨디션 관리가 중요합니다.';
      } else {
        summary = '한 번 더 준비가 필요할 수 있습니다.';
        timing = '다음 기회를 노리는 것도 방법입니다.';
        advice = '기초부터 탄탄히 다지세요.';
        caution = '무리한 도전보다 확실한 준비가 중요합니다.';
      }
      break;

    case 'relationship':
      if (hasTenGod('비견') || hasTenGod('겁재')) {
        details.push('형제/친구 인연이 있습니다.');
      }
      if (hasTenGod('식신')) {
        score += 10;
        details.push('식신이 있어 사교성이 좋습니다.');
      }

      if (score >= 65) {
        summary = '인간관계 운이 좋습니다.';
        timing = '새로운 인연을 만들기 좋은 시기입니다.';
        advice = '적극적으로 사람들과 교류하세요.';
        caution = '모든 사람을 다 만족시킬 수는 없습니다.';
      } else {
        summary = '깊은 관계보다 넓은 관계가 유리합니다.';
        timing = '갈등이 생기면 거리를 두세요.';
        advice = '가까운 사람들에게 먼저 잘하세요.';
        caution = '험담이나 뒷말에 휘말리지 마세요.';
      }
      break;

    default:
      summary = '사주를 기반으로 분석한 결과입니다.';
      advice = '궁금한 점이 있으면 다른 질문도 해보세요.';
      caution = '운세는 참고만 하시고, 최종 결정은 본인이 하세요.';
  }

  // 결과 판정
  let result: Answer['result'];
  if (score >= 65) result = 'positive';
  else if (score >= 45) result = 'neutral';
  else result = 'negative';

  return {
    question,
    result,
    score,
    summary,
    details,
    timing,
    advice,
    caution,
  };
}
