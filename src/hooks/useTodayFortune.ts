import { useMemo } from 'react';
import { SajuResult } from '../types';
import { getDayGanji } from '../services/MonthlyDailyFortune';
import { ILJU_60_INTERPRETATIONS } from '../data/fortuneMessages';
import { getTenGod, TEN_GOD_MEANINGS } from '../utils/elementConverter';

export interface TodayFortune {
  dayGanji: { stem: string; branch: string };
  score: number;
  overall: {
    summary: string;
    advice: string;
    detail: string;
  };
  myIlju: string;
  todayIlju: string;
  tenGod: string;
  wealth: { advice: string; score?: number };
  love: { advice: string; score?: number };
  work: { advice: string; score?: number };
  health: { advice: string; score?: number };
  luckyPoints: {
    color: string;
    number: string;
    direction: string;
    item: string;
  };
  activities: {
    good: string[];
    avoid: string[];
  };
  caution: string[];
}

// 지지 육합
const BRANCH_HARMONY: Record<string, string> = {
  '자': '축', '축': '자', '인': '해', '해': '인',
  '묘': '술', '술': '묘', '진': '유', '유': '진',
  '사': '신', '신': '사', '오': '미', '미': '오',
};

// 지지 육충
const BRANCH_CLASH: Record<string, string> = {
  '자': '오', '오': '자', '축': '미', '미': '축',
  '인': '신', '신': '인', '묘': '유', '유': '묘',
  '진': '술', '술': '진', '사': '해', '해': '사',
};

// 지지 삼형
const BRANCH_PUNISHMENT: Record<string, string[]> = {
  '인': ['사', '신'], '사': ['인', '신'], '신': ['인', '사'],
  '축': ['술', '미'], '술': ['축', '미'], '미': ['축', '술'],
  '자': ['묘'], '묘': ['자'],
};

// 지지 관계 분석 → 점수 보정값 반환
function getBranchBonus(myBranch: string, todayBranch: string): { bonus: number; type: string; desc: string } {
  if (BRANCH_HARMONY[myBranch] === todayBranch) {
    return { bonus: 10, type: '육합', desc: '육합(六合)의 날 — 조화와 협력이 빛나는 길한 기운이 감돕니다.' };
  }
  if (BRANCH_CLASH[myBranch] === todayBranch) {
    return { bonus: -15, type: '육충', desc: '육충(六沖)의 날 — 충돌과 변동이 많으니 각별히 조심하세요.' };
  }
  if (BRANCH_PUNISHMENT[myBranch]?.includes(todayBranch)) {
    return { bonus: -12, type: '형살', desc: '형살(刑煞)의 날 — 갈등과 마찰에 주의하고 말조심하세요.' };
  }
  return { bonus: 0, type: '', desc: '' };
}

export function useTodayFortune(sajuResult: SajuResult | null, targetDate?: Date): TodayFortune | null {
  // Date 객체를 문자열로 변환하여 의존성 비교가 정확하게 되도록 함
  const formatLocal = (d: Date) => `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
  const targetDateStr = targetDate ? formatLocal(targetDate) : formatLocal(new Date());

  return useMemo(() => {
    if (!sajuResult) return null;

    // targetDateStr을 기준으로 날짜 생성 (의존성과 일치)
    const today = new Date(targetDateStr + 'T12:00:00');
    const todayStr = targetDateStr;

    const dayGanji = getDayGanji(today);
    const myDayPillar = sajuResult.pillars.day;
    const myIlju = `${myDayPillar.stem}${myDayPillar.branch}`;
    const todayIlju = `${dayGanji.stem}${dayGanji.branch}`;
    const tenGod = getTenGod(sajuResult.dayMaster, dayGanji.stem);
    const myIljuData = ILJU_60_INTERPRETATIONS[myIlju];

    // 지지 관계 분석 (일지 vs 오늘 지지)
    const branchResult = getBranchBonus(myDayPillar.branch, dayGanji.branch);

    const fortuneBase = calculateFortuneByTenGod(tenGod, myIljuData, sajuResult, todayIlju, todayStr, branchResult);

    // 카테고리별 점수 계산 (지지 관계도 카테고리별 차등 반영)
    const baseScore = fortuneBase.score;
    const hash = getHash(`${sajuResult.dayMaster}-${todayStr}`);
    const branchBonus = branchResult.bonus;
    // 애정운·직장운은 지지 영향 강화, 재물운·건강운은 약화
    const wealthScore = Math.max(20, Math.min(98, baseScore + Math.round(branchBonus * 0.5) + ((hash % 15) - 7)));
    const loveScore = Math.max(20, Math.min(98, baseScore + Math.round(branchBonus * 1.3) + (((hash >> 4) % 15) - 7)));
    const workScore = Math.max(20, Math.min(98, baseScore + Math.round(branchBonus * 1.2) + (((hash >> 8) % 15) - 7)));
    const healthScore = Math.max(20, Math.min(98, baseScore + Math.round(branchBonus * 0.4) + (((hash >> 12) % 15) - 7)));

    return {
      dayGanji,
      score: fortuneBase.score,
      overall: {
        summary: fortuneBase.summary,
        advice: fortuneBase.advice,
        detail: fortuneBase.detail,
      },
      myIlju,
      todayIlju,
      tenGod,
      wealth: { advice: fortuneBase.wealth, score: wealthScore },
      love: { advice: fortuneBase.love, score: loveScore },
      work: { advice: fortuneBase.work, score: workScore },
      health: { advice: fortuneBase.health, score: healthScore },
      luckyPoints: fortuneBase.luckyPoints,
      activities: fortuneBase.activities,
      caution: fortuneBase.caution,
    };
  }, [sajuResult, targetDateStr]);
}

function calculateFortuneByTenGod(
  tenGod: string,
  myIljuData: any,
  sajuResult: SajuResult,
  todayIlju: string,
  todayStr: string,
  branchResult: { bonus: number; type: string; desc: string } = { bonus: 0, type: '', desc: '' }
) {
  // 모든 데이터가 없을 때도 풍부한 기본값 제공
  const defaultData = {
    summary: '오늘은 새로운 기회가 열리는 날입니다.',
    advice: '평소보다 한 걸음 더 나아가세요. 작은 노력이 큰 결실을 맺을 것입니다.',
    detail: '오늘의 기운은 변화와 성장을 내포하고 있습니다. 당신의 노력이 주변에 긍정적인 영향을 미치며, 예상치 못한 곳에서 도움의 손길이 닿을 것입니다. 주변 사람들과의 교류 속에서 새로운 인사이트를 얻게 되며, 이는 앞으로의 중요한 밑거름이 될 것입니다.',
    score: 60,
    wealth: '금전운이 안정적입니다. 정기적인 수입 외에 작은 추가 수입이 있을 수 있으며, 예상했던 지출보다 적게 나갈 가능성이 높습니다. 다만 큰 투자는 신중히 검토하세요.',
    love: '대인관계에서 따뜻한 교류가 이루어집니다. 가까운 사람과의 대화가 심적으로 큰 위로가 되며, 새로운 인연도 자연스럽게 시작될 수 있습니다. 솔직한 마음을 표현필 때입니다.',
    work: '업무에서 꾸준한 노력이 인정받는 날입니다. 맡은 일을 성실히 처리하면 상사나 동료들로부터 좋은 평가를 받을 것입니다. 새로운 프로젝트 제안도 고려필 만합니다.',
    health: '전반적인 컨디션이 양호합니다. 다만 작은 피로가 누적되어 있을 수 있으니, 적절한 휴식과 스트레칭으로 관리하세요. 가벼운 산책이 도움이 될 것입니다.',
    luckyPoints: { color: '하얀색', number: '3, 7, 21', direction: '남동쪽', item: '수첩과 펜' },
    activities: {
      good: ['중요한 미팅', '계약 협상', '학습과 자기계발', '욕동', '정리 정돈'],
      avoid: ['무리한 약속', '지나친 음주', '충동적 소비'],
    },
    caution: ['급하게 결정하지 마세요', '남의 말을 경청하세요', '과신은 금물입니다'],
  };
  
  const tenGodPatterns: Record<string, any> = {
    '비견': {
      score: 65,
      summary: '자신감과 추진력이 넘치는 날입니다.',
      advice: '협력을 통해 더 큰 성과를 이루세요. 혼자보다 함께할 때 힘이 배가 됩니다.',
      detail: '비견은 같은 성별의 도움과 협력을 의미합니다. 오늘은 주변에서 같은 생각을 가진 사람들과 팀을 이루어 일하기에 최적의 날입니다. 혼자서는 어려웠던 일도 동료들과 함께하면 쉽게 해결할 수 있으며, 토론 속에서 새로운 아이디어가 샘솟을 것입니다. 대인관계에서도 활기가 넘치며, 친구들과의 만남이 큰 즐거움이 될 것입니다. 다만 경쟁심이 지나치지 않도록 주의하고, 상대방의 의견도 존중하는 자세가 필요합니다.',
      wealth: '협력을 통한 수익 증대가 예상됩니다. 공동 투자나 파트너십이 유리하며, 친구나 동료의 소개로 좋은 재물 기회가 올 수 있습니다. 다만 돈 거래는 신중히 하세요.',
      love: '친구처럼 편안하고 자연스러운 관계가 형성됩니다. 연애보다는 우정이 먼저인 관계가 오래갈 수 있으며, 친구 소개로 인연이 닿을 가능성이 높습니다.',
      work: '팀 프로젝트와 협업이 매우 강조되는 날입니다. 혼자 하는 일보다 여러 사람과 함께하는 업무에서 큰 성과를 거둘 것입니다. 회의와 브레인스토밍에 적극적으로 참여하세요.',
      health: '에너지가 충만하여 운동하기에 좋은 날입니다. 특히 단체 운동이나 팀 스포츠가 피로를 풀고 활력을 불어넣어 줄 것입니다. 다만 과도한 경쟁은 스트레스를 유발할 수 있으니 주의하세요.',
      luckyPoints: { color: '파란색', number: '1, 6, 10', direction: '북쪽', item: '시계' },
      activities: { good: ['팀 미팅', '협상', '단체 운동', '네트워킹', '스터디'], avoid: ['독단적 행동', '무리한 경쟁', '독서실'] },
      caution: ['경쟁 심화로 인한 스트레스 주의', '과신은 금물입니다', '동료와의 마찰에 주의하세요'],
    },
    '겁재': {
      score: 45,
      summary: '경쟁과 손실에 주의해야 하는 날입니다.',
      advice: '금전 거래와 경쟁 상황을 피하세요. 지키는 것이 버는 것입니다.',
      detail: '겁재(劫財)는 재물을 빼앗기는 기운입니다. 오늘은 예상치 못한 지출이나 손실이 생기기 쉬운 날입니다. 주변에 경쟁자가 나타나거나, 남의 부탁을 들어주다 본인이 손해를 볼 수 있습니다. 보증이나 돈 빌려주기는 절대 피하세요. 친한 사이일수록 금전 거래는 독이 됩니다. 카드 분실이나 소매치기에도 주의가 필요하며, 달콤한 투자 제안은 100% 의심하세요. 오늘 하루만 참으면 내일은 나아질 것입니다.',
      wealth: '재물 손실이 우려되는 날입니다. 보증, 대출, 투자 모두 피하세요. 예상 못한 지출이 생길 수 있으니 비상금을 확보해두고, 있는 돈을 지키는 데 집중하세요. 달콤한 제안일수록 함정이 숨어 있습니다.',
      love: '질투심과 소유욕이 폭발할 수 있습니다. 연인에게 집착하면 관계가 무너질 수 있으니, 한 발 물러서는 지혜가 필요합니다. 오늘 시작하는 새 인연은 금전적 문제로 이어지기 쉽습니다.',
      work: '직장에서 억울한 일을 당하거나 공을 뺏길 수 있습니다. 중요한 아이디어는 공개하지 말고, 동료의 부탁도 신중히 판단하세요. 오늘은 묵묵히 자기 일만 하는 것이 최선입니다.',
      health: '스트레스가 극심해질 수 있습니다. 두통, 소화불량, 불면증에 주의하세요. 충분한 수면이 필수이며, 격한 운동보다 가벼운 산책이 좋습니다. 음주는 절대 피하세요.',
      luckyPoints: { color: '빨간색', number: '2, 7, 16', direction: '남쪽', item: '지갑' },
      activities: { good: ['경쟁 준비', '자기 계발', '문제 해결'], avoid: ['무리한 지출', '도박', '충동적 구매'] },
      caution: ['경쟁 과열로 인한 갈등 주의', '금전적 압박에 대비하세요', '피로 누적에 주의하세요'],
    },
    '식신': {
      score: 80,
      summary: '창의력과 표현력이 빛나는 날입니다.',
      advice: '당신의 재능을 마음껏 발휘하세요. 세상이 당신의 창의성을 기다리고 있습니다.',
      detail: '식신은 창의성, 예술, 즐거움을 의미합니다. 오늘은 당신의 표현력과 창의력이 최고조에 달하는 날입니다. 새로운 아이디어가 끊임없이 떠오르고, 주변 사람들은 당신의 재능에 감탄할 것입니다. 예술 활동이나 창작 작업에 최적의 날이며, 음식과 미각도 예민해져서 맛있는 음식을 즐기기에도 좋습니다. 자신을 표현하는데 주저하지 마세요.',
      wealth: '창의적 아이디어가 수익으로 이어집니다. 새로운 사업 아이템이나 콘텐츠로 돈을 벌 기회가 생길 수 있습니다. 음식 관련 사업이나 예술 분야에서 특히 유리합니다.',
      love: '즐거운 만남과 로맨틱한 시간이 예상됩니다. 데이트에서 새로운 경험을 하게 되며, 솔직한 표현이 상대방의 마음을 움직일 것입니다. 미각을 공유하는 시간이 특히 좋습니다.',
      work: '기획, 창작, 발표가 매우 강조되는 날입니다. 회의에서의 아이디어 제안이 큰 호응을 얻을 것이며, 프레젠테이션도 성공적일 것입니다. 디자인이나 기획 업무에 집중하세요.',
      health: '식욕이 왕성하고 소화가 잘되는 날입니다. 다만 과식은 피하고, 영양가 있는 음식을 골고루 섭취하세요. 창의적 활동이 스트레스 해소에 도움이 됩니다.',
      luckyPoints: { color: '노란색', number: '5, 0, 22', direction: '중앙', item: '펜' },
      activities: { good: ['창작 활동', '취미', '맛집 탐방', '발표', '요리'], avoid: ['과식', '단조로운 일상', '비판적인 사람들'] },
      caution: ['지나친 낙관으로 인한 실수 주의', '과식으로 인한 소화불량 주의', '지출 관리 필요'],
    },
    '상관': {
      score: 50,
      summary: '말조심이 필요한 날입니다. 입이 화를 부를 수 있습니다.',
      advice: '오늘은 말을 아끼세요. 하고 싶은 말이 있어도 한 번 더 삼키세요.',
      detail: '상관(傷官)은 권위에 대한 반항과 날카로운 언변을 의미합니다. 오늘은 윗사람에게 대들거나 불필요한 논쟁에 휘말리기 쉬운 날입니다. 자기 주장이 지나치게 강해져 주변과 마찰이 생기고, 한마디 말이 돌이킬 수 없는 결과를 초래할 수 있습니다. SNS에 감정적인 글을 올리거나, 단체 채팅에서 날카로운 의견을 내는 것도 위험합니다. 솔직함은 미덕이지만, 오늘만큼은 침묵이 금입니다. 창작 활동이나 혼자 하는 작업에 에너지를 돌리면 좋겠습니다.',
      wealth: '충동적 소비가 극심해질 수 있습니다. 스트레스를 쇼핑으로 풀려 하면 큰 낭비로 이어집니다. 계획에 없던 지출은 절대 피하고, 투자도 감정적 판단이 되기 쉬우니 미루세요.',
      love: '연인에게 상처가 되는 말을 내뱉기 쉽습니다. 사소한 불만이 큰 싸움으로 번질 수 있으니, 오늘은 불만 표출을 참으세요. 솔로라면 첫인상에서 실수할 수 있으니 만남을 미루는 것이 좋습니다.',
      work: '상사나 윗사람과 충돌 위험이 높습니다. 아무리 옳은 말이라도 오늘은 참으세요. 회의에서 반박하거나 불만을 표출하면 돌이킬 수 없습니다. 묵묵히 주어진 일만 처리하세요.',
      health: '에너지가 과도하게 소모됩니다. 두통, 목 통증, 소화 장애에 주의하세요. 격한 감정이 신체에 영향을 줄 수 있으니, 명상이나 심호흡으로 마음을 다스리세요.',
      luckyPoints: { color: '초록색', number: '3, 8, 15', direction: '동쪽', item: '노트북' },
      activities: { good: ['새로운 시도', '기획', '운동', '솔직한 대화'], avoid: ['고집 피우기', '옛날 방식 고수', '비협조적인 태도'] },
      caution: ['감정 조절에 주의하세요', '타인과 마찰 가능성', '변화가 너무 급격하면 반발을 살 수 있습니다'],
    },
    '편재': {
      score: 82,
      summary: '큰 재물운이 들어오는 날입니다!',
      advice: '기회를 놓치지 마세요. 오늘의 선택이 미래의 부를 결정합니다.',
      detail: '편재는 예상 밖의 수입, 투자 수익을 의미합니다. 오늘은 재물운이 매우 강하게 작용하는 날로, 예상치 못한 곳에서 수입이 생기거나 투자한 것에서 큰 수익이 발생할 수 있습니다. 새로운 수입원을 찾기에도 최적의 시기이며, 영업이나 부업에서도 좋은 성과가 예상됩니다. 다만 과욕은 금물이며, 무리한 차입이나 도박성 투자는 절대 피해야 합니다.',
      wealth: '예상 밖의 수입이나 투자 수익이 생깁니다. 보너스, 성과급, 또는 투자 수익이 기대되며, 새로운 부업 기회도 생길 수 있습니다. 하지만 도박성 투자는 피하세요.',
      love: '물질적 안정감이 관계에 긍정적인 영향을 줍니다. 선물이나 특별한 경험을 공유하며 관계를 돈독히 할 수 있습니다. 다만 돈으로 감정을 사려는 시도는 주의하세요.',
      work: '성과 보상과 보너스가 기대되는 날입니다. 영업이나 수익 창출 업무에서 특히 좋은 결과가 있을 것입니다. 새로운 고객 유치에 집중하세요.',
      health: '활력이 넘치는 날입니다. 좋은 에너지가 건강에도 긍정적이며, 활발한 활동이 피로를 오히려 풀어줄 것입니다. 다만 과식이나 음주는 주의하세요.',
      luckyPoints: { color: '금색', number: '4, 9, 18', direction: '서쪽', item: '동전 지갑' },
      activities: { good: ['투자', '영업', '부업', '재무 상담', '경매 참여'], avoid: ['도박성 투자', '무리한 차입', '충동적 구매'] },
      caution: ['과욕은 금물입니다', '무리한 차입 절대 금지', '도박성 투자는 손실의 지름길입니다'],
    },
    '정재': {
      score: 72,
      summary: '안정적인 수입과 자산 형성의 날입니다.',
      advice: '꾸준함이 부를 만듭니다. 작은 저축이 큰 자산이 됩니다.',
      detail: '정재는 정규 수입, 안정적인 자산을 의미합니다. 오늘은 금전 관리와 저축에 매우 좋은 날로, 꾸준한 노력이 자산으로 이어지는 시기입니다. 급여 협상이나 연봉 상승에도 유리하며, 장기적인 재무 계획을 세우기에 적합합니다. 안정성을 추구하는 것이 오늘의 키워드이며, 무모한 도전보다는 현재의 기반을 다지는 것이 중요합니다.',
      wealth: '정규 수입 증대와 저축 운이 강합니다. 급여 협상이나 연봉 인상에 좋은 결과가 예상되며, 장기적인 투자나 부동산 관련 결정도 긍정적일 것입니다.',
      love: '안정적이고 진지한 관계가 형성됩니다. 플래시한 관계보다는 서로를 존중하고 배려하는 성숙한 사랑이 가능합니다. 미래를 함께 계획하기 좋은 날입니다.',
      work: '급여 협상, 연봉 상승, 승진 등에서 좋은 소식이 있을 것입니다. 성실한 태도가 인정받으며, 장기적인 프로젝트에서도 안정적인 성과가 예상됩니다.',
      health: '규칙적인 생활 습관이 건강을 지킵니다. 정해진 시간에 식사하고 수면을 취하는 것이 중요합니다. 안정적인 일상이 면역력을 높여줍니다.',
      luckyPoints: { color: '갈색', number: '5, 0, 25', direction: '중앙', item: '통장' },
      activities: { good: ['재무 계획', '저축', '연봉 협상', '장기 투자'], avoid: ['낭비', '충동적 소비', '무모한 도전'] },
      caution: ['지나친 보수성은 기회를 놓칠 수 있습니다', '변화를 너무 두려워하지 마세요', '현재 안주에 빠지지 마세요'],
    },
    '편관': {
      score: 35,
      summary: '강한 시련과 압박이 찾아오는 힘든 날입니다.',
      advice: '오늘은 몸을 사리세요. 새로운 일은 미루고, 있는 것을 지키는 데 집중하세요.',
      detail: '편관(七殺)은 명리학에서 가장 강한 극제(克制)의 기운입니다. 오늘은 통제할 수 없는 외부의 압박이 밀려올 수 있습니다. 상사의 갑작스러운 질책, 예기치 못한 사고, 법적 문제, 건강 이상 등이 발생할 수 있는 날이니 각별한 주의가 필요합니다. 무리한 도전은 절대 금물이며, 위험한 활동이나 밤늦게 돌아다니는 것은 피하세요. 가능하다면 집에서 조용히 쉬는 것이 최선입니다. 이 기운은 하루면 지나가니 참을성 있게 버티세요.',
      wealth: '큰 손실이 우려되는 날입니다. 투자, 계약, 보증 모두 절대 금지입니다. 평소 안전하다고 생각했던 자산에서도 문제가 생길 수 있으니, 금전 관련 결정은 모두 미루세요. 사기에 특히 주의하세요.',
      love: '관계에서 심한 갈등이 발생할 수 있습니다. 연인과 감정적 충돌이 일어나면 이별까지 갈 수 있으니, 오늘은 민감한 대화를 피하세요. 참고 넘기면 내일은 괜찮아질 것입니다.',
      work: '상사나 거래처로부터 강한 압박이 예상됩니다. 불합리한 요구를 받아도 정면으로 대응하지 마세요. 오늘은 인내가 최고의 전략입니다. 실수가 치명적 결과를 낳을 수 있으니 모든 일을 두 번 확인하세요.',
      health: '사고와 부상에 각별히 주의하세요. 운전 시 특히 조심하고, 격한 운동이나 위험한 활동은 피하세요. 두통, 혈압 상승, 급성 통증이 올 수 있으니 몸이 보내는 신호에 귀 기울이세요.',
      luckyPoints: { color: '검정색', number: '1, 6, 11', direction: '북쪽', item: '수호석' },
      activities: { good: ['문제 해결', '인내심 발휘', '식', '정리'], avoid: ['회피', '무책임한 태도', '무리한 도전'] },
      caution: ['무리한 도전은 위험합니다', '건강 악화에 주의하세요', '책임감이 과해져 번아웃 될 수 있습니다'],
    },
    '정관': {
      score: 75,
      summary: '권위와 명예가 따르는 날입니다.',
      advice: '당신의 능력을 자신있게 보여주세요. 세상이 당신을 주목하고 있습니다.',
      detail: '정관은 명예, 권위, 승진을 의미합니다. 오늘은 상사나 권위자의 인정을 받기에 최적의 날입니다. 공식적인 자리에서 좋은 평가를 받을 것이며, 승진이나 인사에서 긍정적인 소식이 있을 수 있습니다. 책임감 있는 태도가 높이 평가받으며, 리더십을 발휘하기에도 좋은 날입니다. 다만 융통성도 필요하니 너무 경직되지 마세요.',
      wealth: '승진이나 인사에서의 수익 증가가 예상됩니다. 명예로운 수익이며, 공직이나 대기업에서 특히 좋은 결과가 있습니다. 장기적인 안정성을 고려하세요.',
      love: '안정적이고 진지한 관계가 형성됩니다. 서로를 존중하는 성숙한 사랑이 가능하며, 상대방이 진심으로 신뢰할 수 있는 모습을 보여주세요.',
      work: '승진, 인정, 상사와의 좋은 관계가 강조됩니다. 공식적인 발표나 보고에서 좋은 평가를 받을 것이며, 리더십을 발휘하기에 좋은 날입니다.',
      health: '규칙적인 생활이 건강을 지킵니다. 정해진 시간에 일하고 식하는 습관이 중요하며, 과도한 스트레스는 피하세요. 건강검진도 고려해보세요.',
      luckyPoints: { color: '남색', number: '6, 1, 19', direction: '북서쪽', item: '명함' },
      activities: { good: ['공식 행사', '발표', '보고', '상사와의 면담'], avoid: ['반항적 태도', '규칙 어김', '무모한 행동'] },
      caution: ['융통성 부족으로 인한 갈등 주의', '과도한 책임감에 주의하세요', '윗사람과의 마찰을 피하세요'],
    },
    '편인': {
      score: 55,
      summary: '혼란과 불안감이 생기기 쉬운 날입니다.',
      advice: '현실에 발을 딛고 서세요. 공상보다 실천이 필요합니다.',
      detail: '편인(偏印)이 강하게 작용하면 현실감각이 흐려지고 불안감이 엄습합니다. 오늘은 쓸데없는 걱정에 시달리거나, 비현실적인 계획에 빠져 시간을 낭비하기 쉬운 날입니다. 직감이 예민해지는 것은 좋지만, 근거 없는 의심이나 불안으로 번질 수 있습니다. 혼자만의 세계에 갇히지 말고, 주변 사람들과 대화하며 현실 감각을 유지하세요. 중요한 결정은 오늘 내리지 말고, 평소 하던 일을 묵묵히 해나가는 것이 최선입니다.',
      wealth: '판단력이 흐려져 잘못된 투자 결정을 내리기 쉽습니다. "이번엔 다를 거야"라는 생각이 드는 투자는 100% 함정입니다. 금전적 결정은 모두 내일로 미루세요.',
      love: '의심과 불안이 관계를 흔들 수 있습니다. 상대방의 말을 지나치게 해석하거나, 근거 없는 의심을 품지 마세요. 오늘은 연락 빈도를 줄이는 것이 오히려 도움이 됩니다.',
      work: '집중력이 떨어지고 실수가 잦아질 수 있습니다. 중요한 보고서나 발표는 오늘 마무리하지 마세요. 여러 번 검토해도 오류가 생길 수 있으니, 꼼꼼히 확인하세요.',
      health: '정신적 피로와 불면증에 주의하세요. 쓸데없는 걱정으로 수면의 질이 떨어질 수 있습니다. 자기 전 스마트폰을 내려놓고, 따뜻한 차 한 잔으로 마음을 달래세요.',
      luckyPoints: { color: '보라색', number: '4, 9, 13', direction: '서쪽', item: '책' },
      activities: { good: ['학습', '연구', '명상', '창의적 활동'], avoid: ['편견', '고정관념', '현실 도피'] },
      caution: ['현실성 부족으로 인한 실패 주의', '비현실적 계획은 수정이 필요합니다', '혼자만의 세계에 빠지지 마세요'],
    },
    '정인': {
      score: 73,
      summary: '지혜와 보호의 기운이 강한 날입니다.',
      advice: '배움에는 끝이 없습니다. 오늘 배운 것이 미래를 바꿉니다.',
      detail: '정인은 학문, 지혜, 보호를 의미합니다. 오늘은 배움과 성찰에 최적의 날로, 스승이나 조언자의 도움을 받을 수 있습니다. 공부하거나 자격증을 취득하기에 좋은 날이며, 따뜻한 보호의 기운이 당신을 감쌉니다. 가족과의 시간도 특히 좋으며, 멘토의 조언이 큰 도움이 될 것입니다. 다만 지나친 의존은 피하세요.',
      wealth: '학문이나 자격증으로 수익이 생길 수 있습니다. 교육 사업이나 강의, 상담 등으로 돈을 벌 기회가 생기며, 장기적으로 안정적인 수입원이 될 것입니다.',
      love: '따뜻한 보호와 배려가 관계를 돈독히 합니다. 서로를 돌보는 관계가 형성되며, 가족 같은 편안함이 느껴집니다. 조언을 아끼지 마세요.',
      work: '교육, 상담, 자격증 취득에 강점을 보입니다. 멘토나 선배의 조언을 적극적으로 구하고, 배움의 자세를 유지하세요. 인내심이 중요합니다.',
      health: '양생과 휴식이 필요합니다. 충분한 수면과 영양가 있는 음식이 건강을 지키며, 가벼운 산책도 도움이 됩니다. 스트레스는 긍정적으로 해소하세요.',
      luckyPoints: { color: '하늘색', number: '1, 6, 24', direction: '북쪽', item: '차 한 잔' },
      activities: { good: ['학습', '자격증', '휴식', '멘토와의 대화', '가족과의 시간'], avoid: ['게으름', '의존', '미루기'] },
      caution: ['지나친 의존성에 주의하세요', '보호만 받으려는 태도는 문제입니다', '혼자 해결할 능력도 키우세요'],
    },
  };
  
  const pattern = tenGodPatterns[tenGod] ? { ...tenGodPatterns[tenGod] } : { ...defaultData };

  // 날짜별 변화를 위한 해시 계산
  const dateHash = getHash(`${todayStr}-${sajuResult.dayMaster}`);
  const iljuHash = getHash(`${todayIlju}-${sajuResult.pillars.day.stem}`);

  // 날짜별 부가 메시지 풀
  const dailyTips = [
    '오늘은 특히 오전 시간대가 길합니다.',
    '점심 이후에 좋은 소식이 있을 수 있습니다.',
    '저녁 무렵 인연이 닿을 수 있습니다.',
    '새벽 시간 명상이 도움이 됩니다.',
    '오후 3시경이 결정에 좋은 시간입니다.',
    '아침 일찍 움직이면 유리합니다.',
    '해 질 녘 산책이 마음을 정화합니다.',
    '정오에 중요한 연락이 올 수 있습니다.',
  ];

  const dailyActions = [
    '주변 정리정돈', '감사 인사', '물 많이 마시기', '깊은 호흡',
    '일기 쓰기', '가벼운 산책', '좋은 음악 듣기', '창문 열기',
    '스트레칭', '긍정 확언', '독서', '명상', '일찍 자기',
  ];

  const dailyCautions = [
    '서두르면 실수합니다', '과식에 주의하세요', '말조심이 필요합니다',
    '충동구매를 피하세요', '늦은 밤 외출은 자제하세요', '과로에 주의하세요',
    '감정적 대응은 피하세요', '중요한 결정은 내일로 미루세요',
  ];

  // 날짜 기반으로 메시지 선택
  const tipIdx = dateHash % dailyTips.length;
  const actionIdx = iljuHash % dailyActions.length;
  const cautionIdx = (dateHash + iljuHash) % dailyCautions.length;

  // 운세 내용에 날짜별 변화 추가
  pattern.advice = `${pattern.advice} ${dailyTips[tipIdx]}`;
  pattern.activities = {
    good: [dailyActions[actionIdx], dailyActions[(actionIdx + 3) % dailyActions.length], ...pattern.activities.good.slice(0, 3)],
    avoid: pattern.activities.avoid,
  };
  pattern.caution = [dailyCautions[cautionIdx], ...pattern.caution.slice(0, 2)];

  // 행운 아이템도 날짜별 변화
  const luckyColors = ['빨간색', '파란색', '초록색', '노란색', '보라색', '흰색', '검정색', '분홍색', '하늘색', '금색'];
  const luckyItems = ['열쇠', '동전', '손수건', '거울', '수첩', '펜', '시계', '반지', '목걸이', '팔찌', '모자', '안경'];
  const luckyDirections = ['동쪽', '서쪽', '남쪽', '북쪽', '동남쪽', '동북쪽', '서남쪽', '서북쪽'];

  pattern.luckyPoints = {
    color: luckyColors[dateHash % luckyColors.length],
    number: `${(dateHash % 9) + 1}, ${((iljuHash % 9) + 1)}`,
    direction: luckyDirections[iljuHash % luckyDirections.length],
    item: luckyItems[(dateHash + iljuHash) % luckyItems.length],
  };

  // 일주 데이터가 있으면 더 풍부하게 병합
  if (myIljuData) {
    pattern.detail = `[${sajuResult.pillars.day.stem}${sajuResult.pillars.day.branch} 일주의 특성] ${myIljuData.summary}\n\n[${todayIlju} 일진의 운세] ${pattern.detail}`;
    pattern.activities.good = [...myIljuData.goodActivities.slice(0, 2), ...pattern.activities.good.slice(0, 4)];
    pattern.activities.avoid = [...myIljuData.avoidSituations.slice(0, 2), ...pattern.activities.avoid.slice(0, 2)];
    pattern.caution = [...myIljuData.caution.slice(0, 1), ...pattern.caution.slice(0, 2)];
  }

  // 해시 기반 점수 미세 조정 (범위 확대: ±7)
  const hash = getHash(`${sajuResult.dayMaster}-${todayStr}`);
  const scoreVariation = (hash % 15) - 7;
  // 지지 관계 보정 반영
  pattern.score = Math.max(20, Math.min(95, pattern.score + branchResult.bonus + scoreVariation));

  // 지지 관계가 있으면 상세 설명에 추가
  if (branchResult.type) {
    pattern.detail = `⚡ ${branchResult.desc}\n\n${pattern.detail}`;
    // 육충/형살이면 주의사항에 추가
    if (branchResult.bonus < 0) {
      pattern.caution = [branchResult.desc, ...pattern.caution.slice(0, 2)];
    }
  }

  return pattern;
}

function getHash(str: string): number {
  return (str.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)) >>> 0;
}
