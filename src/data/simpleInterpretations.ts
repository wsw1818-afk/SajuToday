/**
 * 쉬운 해석 모드 데이터
 * 전문 용어를 일반인이 이해하기 쉽게 풀어서 설명합니다.
 */

// ============================================
// 격국(格局) 쉬운 해석
// ============================================

export const SIMPLE_GYEOKGUK: Record<string, { simple: string; emoji: string; keyword: string }> = {
  '비견격': {
    simple: '친구나 동료와 함께할 때 힘이 나는 타입이에요. 혼자보다 팀으로 일할 때 성공 확률이 높아요.',
    emoji: '🤝',
    keyword: '협동형',
  },
  '겁재격': {
    simple: '경쟁심이 강하고 승부욕이 있어요. 도전을 즐기고 위기에 강한 타입이에요.',
    emoji: '🔥',
    keyword: '도전형',
  },
  '식신격': {
    simple: '먹고 사는 복이 있는 사주예요. 맛있는 것을 좋아하고, 남에게 베푸는 것을 즐겨요.',
    emoji: '🍀',
    keyword: '풍요형',
  },
  '상관격': {
    simple: '창의력이 뛰어나고 예술적 재능이 있어요. 틀에 박힌 일보다 자유로운 일이 맞아요.',
    emoji: '🎨',
    keyword: '창의형',
  },
  '편재격': {
    simple: '사업 수완이 있고 돈 벌 기회를 잘 잡아요. 투자나 사업에 재능이 있어요.',
    emoji: '💰',
    keyword: '사업형',
  },
  '정재격': {
    simple: '꾸준히 모아서 부를 쌓는 타입이에요. 안정적인 수입과 저축을 중시해요.',
    emoji: '🏦',
    keyword: '안정형',
  },
  '편관격': {
    simple: '리더십이 있고 권위가 있어요. 조직에서 높은 자리에 오를 가능성이 높아요.',
    emoji: '👔',
    keyword: '리더형',
  },
  '정관격': {
    simple: '성실하고 책임감이 강해요. 공무원이나 대기업처럼 안정적인 조직에서 빛나요.',
    emoji: '📋',
    keyword: '모범형',
  },
  '편인격': {
    simple: '학문이나 종교, 철학에 관심이 많아요. 깊이 파고드는 연구 분야에 적합해요.',
    emoji: '📚',
    keyword: '연구형',
  },
  '정인격': {
    simple: '배움의 복이 있어요. 시험운이 좋고, 자격증이나 학위 취득에 유리해요.',
    emoji: '🎓',
    keyword: '학업형',
  },
};

// ============================================
// 십신(十神) 쉬운 해석
// ============================================

export const SIMPLE_TEN_GODS: Record<string, { simple: string; emoji: string; meaning: string }> = {
  '비견': {
    simple: '나와 비슷한 사람 (친구, 동료, 형제)',
    emoji: '👫',
    meaning: '협력하면 좋은 결과, 경쟁하면 피곤해요',
  },
  '겁재': {
    simple: '나와 경쟁하는 사람',
    emoji: '⚔️',
    meaning: '긴장감을 주지만 성장의 기회도 줘요',
  },
  '식신': {
    simple: '내가 낳은 것, 내 재능과 표현',
    emoji: '🌱',
    meaning: '먹는 복, 재능, 자녀운과 관련',
  },
  '상관': {
    simple: '내 생각을 표현하는 것',
    emoji: '💡',
    meaning: '창의력, 반항심, 예술적 재능',
  },
  '편재': {
    simple: '내가 다루는 큰 돈',
    emoji: '💵',
    meaning: '투자, 사업, 아버지, 남자의 애인',
  },
  '정재': {
    simple: '내가 꾸준히 모으는 돈',
    emoji: '💴',
    meaning: '월급, 저축, 남자의 아내',
  },
  '편관': {
    simple: '나를 통제하는 힘',
    emoji: '⚡',
    meaning: '스트레스, 직장 상사, 여자의 애인',
  },
  '정관': {
    simple: '나를 이끄는 바른 힘',
    emoji: '🎖️',
    meaning: '명예, 승진, 직장, 여자의 남편',
  },
  '편인': {
    simple: '나를 도와주지만 부담도 주는 것',
    emoji: '📖',
    meaning: '학문, 종교, 어머니, 의외의 도움',
  },
  '정인': {
    simple: '나를 따뜻하게 도와주는 것',
    emoji: '🤱',
    meaning: '어머니, 학업, 자격증, 인정',
  },
};

// ============================================
// 오행(五行) 쉬운 해석
// ============================================

export const SIMPLE_FIVE_ELEMENTS: Record<string, {
  simple: string;
  emoji: string;
  personality: string;
  strength: string;
  weakness: string;
  luckyColor: string;
  luckyFood: string;
}> = {
  '목': {
    simple: '나무처럼 성장하고 뻗어나가는 기운',
    emoji: '🌲',
    personality: '진취적이고 정의로우며, 리더십이 있어요',
    strength: '추진력, 성장 욕구, 결단력',
    weakness: '고집이 세고 급할 수 있어요',
    luckyColor: '초록색, 청록색',
    luckyFood: '신맛 음식 (레몬, 식초, 매실)',
  },
  '화': {
    simple: '불처럼 뜨겁고 밝은 기운',
    emoji: '🔥',
    personality: '열정적이고 표현력이 좋으며, 사교성이 뛰어나요',
    strength: '열정, 카리스마, 밝은 에너지',
    weakness: '쉽게 흥분하고 지칠 수 있어요',
    luckyColor: '빨간색, 주황색, 분홍색',
    luckyFood: '쓴맛 음식 (커피, 녹차, 쑥)',
  },
  '토': {
    simple: '땅처럼 안정적이고 포용하는 기운',
    emoji: '⛰️',
    personality: '신뢰감 있고 현실적이며, 중재를 잘해요',
    strength: '안정감, 신뢰, 현실 감각',
    weakness: '변화를 두려워하고 느릴 수 있어요',
    luckyColor: '노란색, 갈색, 베이지색',
    luckyFood: '단맛 음식 (꿀, 고구마, 대추)',
  },
  '금': {
    simple: '쇠처럼 단단하고 날카로운 기운',
    emoji: '⚔️',
    personality: '결단력 있고 정확하며, 원칙을 중시해요',
    strength: '결단력, 정확함, 실행력',
    weakness: '냉정하고 융통성이 부족할 수 있어요',
    luckyColor: '흰색, 금색, 은색',
    luckyFood: '매운맛 음식 (고추, 생강, 마늘)',
  },
  '수': {
    simple: '물처럼 유연하고 깊은 기운',
    emoji: '💧',
    personality: '지혜롭고 적응력이 좋으며, 통찰력이 있어요',
    strength: '지혜, 적응력, 유연함',
    weakness: '우유부단하고 감정 기복이 있을 수 있어요',
    luckyColor: '검은색, 파란색, 남색',
    luckyFood: '짠맛 음식 (소금, 해산물, 미역)',
  },
};

// ============================================
// 용신(用神) 쉬운 해석
// ============================================

export const SIMPLE_YONGSIN: Record<string, {
  simple: string;
  howToUse: string;
  luckyItems: string[];
  luckyActivities: string[];
}> = {
  '목': {
    simple: '나무 기운이 필요해요. 푸른 것, 자라는 것이 행운을 가져와요.',
    howToUse: '식물 키우기, 등산, 산책이 도움이 돼요',
    luckyItems: ['관엽식물', '나무 소품', '초록색 지갑'],
    luckyActivities: ['숲속 산책', '정원 가꾸기', '새벽 운동'],
  },
  '화': {
    simple: '불 기운이 필요해요. 밝은 것, 뜨거운 것이 행운을 가져와요.',
    howToUse: '햇빛 많이 쬐기, 밝은 옷 입기, 남쪽 방향이 좋아요',
    luckyItems: ['빨간색 액세서리', '양초', '조명'],
    luckyActivities: ['일광욕', '요리', '열정적인 운동'],
  },
  '토': {
    simple: '땅 기운이 필요해요. 안정적인 것, 중심이 되는 것이 행운을 가져와요.',
    howToUse: '규칙적인 생활, 집안 정리, 도자기나 흙 관련 활동이 좋아요',
    luckyItems: ['도자기', '황토 제품', '노란색 소품'],
    luckyActivities: ['텃밭 가꾸기', '명상', '집 꾸미기'],
  },
  '금': {
    simple: '쇠 기운이 필요해요. 반짝이는 것, 단단한 것이 행운을 가져와요.',
    howToUse: '금속 액세서리, 흰색 계열 옷, 서쪽 방향이 좋아요',
    luckyItems: ['금/은 액세서리', '시계', '흰색 아이템'],
    luckyActivities: ['악기 연주', '정리정돈', '절제하는 생활'],
  },
  '수': {
    simple: '물 기운이 필요해요. 흐르는 것, 지혜로운 것이 행운을 가져와요.',
    howToUse: '물 많이 마시기, 수영, 북쪽 방향이 좋아요',
    luckyItems: ['수정', '어항', '검은색/파란색 소품'],
    luckyActivities: ['수영', '독서', '명상', '여행'],
  },
};

// ============================================
// 일간(日干) 쉬운 해석
// ============================================

export const SIMPLE_DAY_MASTER: Record<string, {
  emoji: string;
  nickname: string;
  simple: string;
  personality: string;
  loveStyle: string;
  careerStyle: string;
}> = {
  '갑': {
    emoji: '🌳',
    nickname: '큰 나무',
    simple: '하늘 높이 자라는 큰 나무처럼 목표를 향해 곧게 나아가요',
    personality: '리더십이 강하고 정의로우며, 당당하게 자기 길을 가요',
    loveStyle: '연인을 보호하고 이끌려 해요. 존경받고 싶어해요',
    careerStyle: '조직의 리더, 경영자, 변호사, 교육자에 적합해요',
  },
  '을': {
    emoji: '🌿',
    nickname: '작은 풀',
    simple: '유연한 풀처럼 상황에 맞춰 적응하며 끈질기게 살아남아요',
    personality: '부드럽지만 강인하고, 상황 적응력이 뛰어나요',
    loveStyle: '상대에게 맞추면서 은근히 내 뜻대로 이끌어요',
    careerStyle: '디자이너, 상담사, 비서, 마케터에 적합해요',
  },
  '병': {
    emoji: '☀️',
    nickname: '태양',
    simple: '태양처럼 밝고 따뜻하게 주변을 비춰요',
    personality: '열정적이고 밝으며, 어디서든 주목받아요',
    loveStyle: '화끈하게 사랑하고, 아낌없이 표현해요',
    careerStyle: '연예인, 영업, 마케팅, 리더에 적합해요',
  },
  '정': {
    emoji: '🕯️',
    nickname: '촛불',
    simple: '촛불처럼 은은하게 빛나며 주변을 따뜻하게 해요',
    personality: '섬세하고 예민하며, 분위기를 잘 읽어요',
    loveStyle: '깊고 따뜻하게 사랑하고, 섬세하게 배려해요',
    careerStyle: '예술가, 작가, 심리상담가, 요리사에 적합해요',
  },
  '무': {
    emoji: '🏔️',
    nickname: '큰 산',
    simple: '산처럼 묵직하고 듬직하게 자리를 지켜요',
    personality: '믿음직하고 안정적이며, 포용력이 커요',
    loveStyle: '변함없이 한결같이 사랑하고 지켜줘요',
    careerStyle: '부동산, 건설, 금융, 공무원에 적합해요',
  },
  '기': {
    emoji: '🌾',
    nickname: '논밭',
    simple: '기름진 땅처럼 만물을 키워내고 품어줘요',
    personality: '온화하고 헌신적이며, 배려심이 깊어요',
    loveStyle: '아낌없이 베풀고 헌신적으로 사랑해요',
    careerStyle: '농업, 요식업, 교육, 복지에 적합해요',
  },
  '경': {
    emoji: '⚔️',
    nickname: '쇠칼',
    simple: '칼처럼 날카롭고 단호하게 결정하고 실행해요',
    personality: '직선적이고 단호하며, 의리가 있어요',
    loveStyle: '솔직하고 직진적으로 표현해요',
    careerStyle: '군인, 검찰, 외과의사, 운동선수에 적합해요',
  },
  '신': {
    emoji: '💎',
    nickname: '보석',
    simple: '보석처럼 섬세하고 아름답게 빛나요',
    personality: '섬세하고 까다로우며, 품격을 중시해요',
    loveStyle: '세련되고 품위있게 사랑하고, 기준이 높아요',
    careerStyle: '패션, 보석, 미용, 금융에 적합해요',
  },
  '임': {
    emoji: '🌊',
    nickname: '바다',
    simple: '바다처럼 깊고 넓으며, 많은 것을 품어요',
    personality: '지혜롭고 포용력이 있으며, 끊임없이 흘러요',
    loveStyle: '깊고 넓게 사랑하지만 표현이 서툴러요',
    careerStyle: '학자, 연구원, 무역, 운송에 적합해요',
  },
  '계': {
    emoji: '💦',
    nickname: '시냇물',
    simple: '시냇물처럼 맑고 섬세하게 흘러요',
    personality: '감성적이고 직관적이며, 눈치가 빨라요',
    loveStyle: '감성적이고 낭만적으로 사랑해요',
    careerStyle: '예술, 작가, 상담, 서비스업에 적합해요',
  },
};

// ============================================
// 대운/세운 쉬운 해석
// ============================================

export const SIMPLE_LUCK_PERIODS: Record<string, string> = {
  '대길': '아주 좋은 시기예요! 적극적으로 도전하세요.',
  '길': '좋은 시기예요. 계획한 일을 추진하기 좋아요.',
  '보통': '평범한 시기예요. 무리하지 않으면 무난해요.',
  '주의': '조심해야 하는 시기예요. 신중하게 행동하세요.',
  '흉': '어려운 시기예요. 큰 결정은 미루세요.',
};

// ============================================
// 신살(神殺) 쉬운 해석
// ============================================

export const SIMPLE_SINSAL: Record<string, {
  simple: string;
  emoji: string;
  realLife: string;
}> = {
  '천을귀인': {
    simple: '어려울 때 도와주는 사람이 꼭 나타나는 행운의 별',
    emoji: '🌟',
    realLife: '위기 상황에서 귀인이 나타나 도와줘요',
  },
  '도화살': {
    simple: '이성에게 인기가 많은 매력의 별',
    emoji: '🌸',
    realLife: '이성에게 인기 많지만, 감정 조절이 필요해요',
  },
  '역마살': {
    simple: '한 곳에 머무르지 않고 움직이는 별',
    emoji: '🐎',
    realLife: '출장, 이사, 여행이 많아요. 움직이는 일이 잘 맞아요',
  },
  '화개살': {
    simple: '예술적 재능과 종교성을 가진 별',
    emoji: '🎨',
    realLife: '창작 활동이나 정신적 수행에 재능이 있어요',
  },
  '문창귀인': {
    simple: '공부와 시험에 재능이 있는 별',
    emoji: '📚',
    realLife: '자격증, 시험, 학업에서 좋은 결과를 얻어요',
  },
  '금여록': {
    simple: '좋은 배우자를 만나는 결혼복의 별',
    emoji: '💍',
    realLife: '결혼 후 부부 금슬이 좋고 재물도 좋아져요',
  },
  '양인살': {
    simple: '강한 에너지를 가진 칼날의 별',
    emoji: '⚔️',
    realLife: '성격이 강해서 다툼 주의, 운동으로 에너지 발산하세요',
  },
  '공망': {
    simple: '노력이 허무하게 될 수 있는 빈 공간의 별',
    emoji: '🕳️',
    realLife: '결과에 집착하지 말고 과정을 즐기세요',
  },
};

// ============================================
// 점수별 쉬운 운세 해석 (누구나 이해할 수 있게)
// ============================================

export const SCORE_MESSAGES = {
  overall: {
    excellent: { // 85점 이상
      title: '오늘은 최고의 날!',
      message: '뭘 해도 잘 풀리는 날이에요. 망설이던 일이 있다면 오늘 시작해보세요!',
      advice: '자신감을 갖고 적극적으로 행동하세요',
      emoji: '🎉',
      color: '#10B981',
    },
    good: { // 70-84점
      title: '좋은 기운이 함께해요',
      message: '전반적으로 순조로운 하루가 될 거예요. 계획한 일을 진행하세요.',
      advice: '새로운 시도도 괜찮아요',
      emoji: '😊',
      color: '#3B82F6',
    },
    average: { // 55-69점
      title: '평범하지만 안정적인 날',
      message: '특별히 좋지도 나쁘지도 않아요. 기본에 충실하면 됩니다.',
      advice: '큰 결정은 내일로 미루는 게 좋아요',
      emoji: '😌',
      color: '#F59E0B',
    },
    caution: { // 40-54점
      title: '조금 조심이 필요해요',
      message: '예상치 못한 일이 생길 수 있어요. 여유를 갖고 신중하게!',
      advice: '중요한 약속이나 결정은 다른 날에 하세요',
      emoji: '⚠️',
      color: '#F97316',
    },
    warning: { // 40점 미만
      title: '오늘은 쉬어가는 날',
      message: '무리하지 마세요. 몸과 마음을 돌보며 조용히 보내세요.',
      advice: '새로운 일은 피하고 기존 일만 점검하세요',
      emoji: '🛌',
      color: '#EF4444',
    },
  },
  love: {
    excellent: {
      title: '사랑운 대박!',
      message: '연인이 있다면 더 깊어지고, 솔로라면 좋은 인연이 올 수 있어요.',
      advice: '적극적으로 마음을 표현해보세요',
      emoji: '💕',
      color: '#EC4899',
    },
    good: {
      title: '따뜻한 애정운',
      message: '주변 사람들과 좋은 관계를 유지할 수 있어요.',
      advice: '작은 관심과 배려가 큰 행복이 돼요',
      emoji: '💗',
      color: '#F472B6',
    },
    average: {
      title: '잔잔한 애정운',
      message: '특별한 변화는 없지만 안정적인 관계를 유지해요.',
      advice: '조급해하지 말고 자연스럽게',
      emoji: '💜',
      color: '#A855F7',
    },
    caution: {
      title: '오해 조심',
      message: '사소한 말다툼이나 오해가 생길 수 있어요.',
      advice: '말하기 전에 한 번 더 생각하세요',
      emoji: '💔',
      color: '#F97316',
    },
    warning: {
      title: '거리두기 필요',
      message: '지금은 관계에서 한 발 물러서는 게 좋아요.',
      advice: '강요하거나 집착하지 마세요',
      emoji: '🙅',
      color: '#EF4444',
    },
  },
  money: {
    excellent: {
      title: '돈이 들어오는 날!',
      message: '예상치 못한 수입이나 좋은 기회가 찾아올 수 있어요.',
      advice: '투자나 사업 제안을 검토해보세요',
      emoji: '💰',
      color: '#10B981',
    },
    good: {
      title: '안정적인 재물운',
      message: '수입과 지출이 균형을 이루는 날이에요.',
      advice: '계획적인 소비를 하면 더 좋아요',
      emoji: '💵',
      color: '#22C55E',
    },
    average: {
      title: '보통의 재물운',
      message: '큰 손실도 큰 수익도 없는 평범한 날이에요.',
      advice: '충동구매는 피하세요',
      emoji: '💳',
      color: '#F59E0B',
    },
    caution: {
      title: '지출 조심',
      message: '예상치 못한 지출이 생길 수 있어요.',
      advice: '여유 자금을 확보해두세요',
      emoji: '📉',
      color: '#F97316',
    },
    warning: {
      title: '재정 주의',
      message: '큰 금액을 움직이기엔 좋지 않은 날이에요.',
      advice: '투자, 계약, 대출은 미루세요',
      emoji: '🚫',
      color: '#EF4444',
    },
  },
  work: {
    excellent: {
      title: '일이 잘 풀려요!',
      message: '업무 효율이 높고 인정받을 수 있어요.',
      advice: '프레젠테이션이나 면접에 좋아요',
      emoji: '🚀',
      color: '#3B82F6',
    },
    good: {
      title: '순조로운 업무운',
      message: '계획한 대로 일이 진행되는 하루예요.',
      advice: '협업이 필요한 일을 진행하세요',
      emoji: '💼',
      color: '#6366F1',
    },
    average: {
      title: '평범한 업무일',
      message: '특별한 일 없이 평소처럼 흘러가요.',
      advice: '기본에 충실하세요',
      emoji: '📋',
      color: '#F59E0B',
    },
    caution: {
      title: '업무 집중 필요',
      message: '실수가 생기기 쉬운 날이에요.',
      advice: '중요한 서류는 두 번 확인하세요',
      emoji: '⚡',
      color: '#F97316',
    },
    warning: {
      title: '업무 스트레스 주의',
      message: '상사나 동료와 마찰이 있을 수 있어요.',
      advice: '감정적 대응은 피하고 차분하게',
      emoji: '😰',
      color: '#EF4444',
    },
  },
  health: {
    excellent: {
      title: '컨디션 최상!',
      message: '몸과 마음이 건강한 날이에요.',
      advice: '운동을 시작하기 좋아요',
      emoji: '💪',
      color: '#10B981',
    },
    good: {
      title: '건강한 하루',
      message: '무리하지 않으면 좋은 컨디션을 유지해요.',
      advice: '규칙적인 식사와 충분한 수분 섭취',
      emoji: '🏃',
      color: '#22C55E',
    },
    average: {
      title: '보통의 건강운',
      message: '특별히 신경 쓸 일은 없지만 무리는 금물',
      advice: '가벼운 스트레칭을 해보세요',
      emoji: '🧘',
      color: '#F59E0B',
    },
    caution: {
      title: '피로 누적 주의',
      message: '피로가 쌓여있을 수 있어요.',
      advice: '일찍 자고 무리한 일정은 줄이세요',
      emoji: '😴',
      color: '#F97316',
    },
    warning: {
      title: '건강 관리 필요',
      message: '면역력이 떨어져 있을 수 있어요.',
      advice: '충분히 쉬고 필요하면 병원 방문',
      emoji: '🏥',
      color: '#EF4444',
    },
  },
};

// 점수 등급 계산
export function getScoreLevel(score: number): 'excellent' | 'good' | 'average' | 'caution' | 'warning' {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 55) return 'average';
  if (score >= 40) return 'caution';
  return 'warning';
}

// 점수 기반 쉬운 메시지 가져오기
export function getScoreMessage(
  category: 'overall' | 'love' | 'money' | 'work' | 'health',
  score: number
) {
  const level = getScoreLevel(score);
  return SCORE_MESSAGES[category][level];
}

// 점수 바 색상 가져오기
export function getScoreColor(score: number): string {
  if (score >= 85) return '#10B981';
  if (score >= 70) return '#3B82F6';
  if (score >= 55) return '#F59E0B';
  if (score >= 40) return '#F97316';
  return '#EF4444';
}

// 점수 레이블 가져오기
export function getScoreLabel(score: number): string {
  if (score >= 85) return '최고';
  if (score >= 70) return '좋음';
  if (score >= 55) return '보통';
  if (score >= 40) return '주의';
  return '조심';
}
