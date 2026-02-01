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

export function useTodayFortune(sajuResult: SajuResult | null, targetDate?: Date): TodayFortune | null {
  // Date 객체를 문자열로 변환하여 의존성 비교가 정확하게 되도록 함
  const targetDateStr = targetDate ? targetDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

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

    const fortuneBase = calculateFortuneByTenGod(tenGod, myIljuData, sajuResult, todayIlju, todayStr);

    // 카테고리별 점수 계산 (기본 점수 기반 변동)
    const baseScore = fortuneBase.score;
    const hash = getHash(`${sajuResult.dayMaster}-${todayStr}`);
    const wealthScore = Math.max(35, Math.min(95, baseScore + ((hash % 15) - 7)));
    const loveScore = Math.max(35, Math.min(95, baseScore + (((hash >> 4) % 15) - 7)));
    const workScore = Math.max(35, Math.min(95, baseScore + (((hash >> 8) % 15) - 7)));
    const healthScore = Math.max(35, Math.min(95, baseScore + (((hash >> 12) % 15) - 7)));

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
  todayStr: string
) {
  // 모든 데이터가 없을 때도 풍부한 기본값 제공
  const defaultData = {
    summary: '오늘은 새로운 기회가 열리는 날입니다.',
    advice: '평소보다 한 걸음 더 나아가세요. 작은 노력이 큰 결실을 맺을 것입니다.',
    detail: '오늘의 기운은 변화와 성장을 내포하고 있습니다. 당신의 노력이 주변에 긍정적인 영향을 미치며, 예상치 못한 곳에서 도움의 손길이 닿을 것입니다. 주변 사람들과의 교류 속에서 새로운 인사이트를 얻게 되며, 이는 앞으로의 중요한 밑거름이 될 것입니다.',
    score: 65,
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
      score: 75,
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
      score: 65,
      summary: '경쟁과 도전이 따르는 날입니다.',
      advice: '경쟁을 두려워하지 마세요. 도전 속에서 진정한 성장이 이루어집니다.',
      detail: '겁재는 경쟁자나 금전적 압박을 의미합니다. 오늘은 주변에 경쟁자가 나타나거나 예상치 못한 지출이 생길 수 있어 다소 긴장감 있는 하루가 될 것입니다. 하지만 이러한 상황을 성장의 기회로 삼는다면 큰 도약을 할 수 있습니다. 경쟁 상황에서 침착함을 유지하고, 자신의 강점을 살려 차별화를 시도하세요. 금전적으로는 다소 빠듯할 수 있으니 불필요한 지출을 줄이는 것이 좋습니다.',
      wealth: '경쟁 속에서 기회를 찾을 수 있지만, 독단적인 투자는 피하세요. 예상치 못한 지출이 생길 수 있으니 비상금을 준비해두는 것이 현명합니다.',
      love: '질투심이나 소유욕이 강해질 수 있습니다. 연인과의 관계에서 자유로운 공간을 허용하고, 지나친 의심은 관계를 해칠 수 있으니 주의하세요.',
      work: '경쟁 상황에서 자신의 능력을 입증해야 하는 날입니다. 어려운 상황일수록 침착함을 유지하고, 동료들과의 협력을 통해 위기를 극복하세요.',
      health: '스트레스가 피로로 누적될 수 있습니다. 충분한 수면과 함께 명상이나 요가로 마음을 다스리는 것이 필요합니다. 카페인 섭취는 줄이세요.',
      luckyPoints: { color: '빨간색', number: '2, 7, 16', direction: '남쪽', item: '지갑' },
      activities: { good: ['경쟁 준비', '자기 계발', '문제 해결'], avoid: ['무리한 지출', '도박', '충동적 구매'] },
      caution: ['경쟁 과열로 인한 갈등 주의', '금전적 압박에 대비하세요', '피로 누적에 주의하세요'],
    },
    '식신': {
      score: 85,
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
      score: 70,
      summary: '자기 주장과 변화를 추구하는 날입니다.',
      advice: '기존의 틀을 깨고 새로운 시도를 하세요. 변화가 성장의 시작입니다.',
      detail: '상관은 표현력, 변화, 도전 정신을 의미합니다. 오늘은 기존의 방식에서 벗어나 새로운 방법을 시도하기에 좋은 날입니다. 당신의 솔직한 의견이 주변에 긍정적인 변화를 가져올 것이며, 기존에 하지 않았던 새로운 분야에 도전해도 좋은 결과가 있을 것입니다. 다만 변화를 추구하되, 너무 급격한 변화는 주변의 반발을 살 수 있으니 점진적으로 접근하세요.',
      wealth: '변화를 통한 기회가 생기지만 변동성도 큽니다. 새로운 수입원이 생길 수 있으나, 기존 수입원도 유지하는 것이 중요합니다. 변동성이 큰 투자는 신중히 하세요.',
      love: '솔직한 대화를 통해 관계가 더 깊어집니다. 새로운 만남도 생길 수 있으며, 기존 관계에서는 변화가 필요한 시점입니다. 지루한 관계에 새로운 활력을 불어넣으세요.',
      work: '혁신과 개선안 제시가 강조됩니다. 기존 업무 방식의 문제점을 파악하고 새로운 해결책을 제시하면 높이 평가받을 것입니다. 변화를 두려워하지 마세요.',
      health: '활동량 증가가 필요합니다. 새로운 운동을 시작하거나 기존 운동 방식을 바꿔보는 것이 좋습니다. 다만 무리한 운동은 부상의 위험이 있으니 주의하세요.',
      luckyPoints: { color: '초록색', number: '3, 8, 15', direction: '동쪽', item: '노트북' },
      activities: { good: ['새로운 시도', '기획', '운동', '솔직한 대화'], avoid: ['고집 피우기', '옛날 방식 고수', '비협조적인 태도'] },
      caution: ['감정 조절에 주의하세요', '타인과 마찰 가능성', '변화가 너무 급격하면 반발을 살 수 있습니다'],
    },
    '편재': {
      score: 90,
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
      score: 80,
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
      score: 55,
      summary: '압박과 시련 속에서 성장하는 날입니다.',
      advice: '어려움을 피하지 마세요. 극복하는 과정에서 진정한 힘이 생깁니다.',
      detail: '편관은 강한 압박, 책임, 시련을 의미합니다. 오늘은 다소 어렵고 힘든 상황이 생길 수 있어 마음의 여유가 필요합니다. 업무나 생활에서 예상치 못한 책임이나 압박이 생길 수 있지만, 이를 극복하면 그만큼 큰 성장이 따를 것입니다. 인내심을 가지고 차근차근 문제를 해결해 나가세요. 무리한 도전보다는 현재의 어려움을 해결하는 것에 집중하세요.',
      wealth: '고생 끝에 낙이 있습니다. 인내심을 가지고 기다리면 좋은 결과가 생기지만, 지금은 무리한 금전적 시도는 피하는 것이 좋습니다. 현금 확보가 중요합니다.',
      love: '시험을 통한 관계 확인이 이루어집니다. 어려운 상황에서 서로를 지지해주는 관계가 진짜입니다. 일시적인 갈등이 있을 수 있으나 이해심으로 극복하세요.',
      work: '압박 속에서 업무를 처리해야 하는 날입니다. 책임이 증가하고 어려운 과제가 주어질 수 있으나, 이를 잘 극복하면 큰 성과가 될 것입니다. 인내심을 가지세요.',
      health: '피로가 누적될 수 있습니다. 충분한 식이 필수적이며, 스트레스 관리가 중요합니다. 무리한 야근이나 과로는 피하고, 가벼운 산책으로 마음을 달래세요.',
      luckyPoints: { color: '검정색', number: '1, 6, 11', direction: '북쪽', item: '수호석' },
      activities: { good: ['문제 해결', '인내심 발휘', '식', '정리'], avoid: ['회피', '무책임한 태도', '무리한 도전'] },
      caution: ['무리한 도전은 위험합니다', '건강 악화에 주의하세요', '책임감이 과해져 번아웃 될 수 있습니다'],
    },
    '정관': {
      score: 85,
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
      score: 75,
      summary: '지혜와 학습의 날입니다.',
      advice: '지식이 힘입니다. 배움의 기회를 놓치지 마세요.',
      detail: '편인은 직관, 창의적 사고, 특이한 지식을 의미합니다. 오늘은 독특한 아이디어가 떠오르고 직감이 예민해지는 날입니다. 학습이나 연구에 최적의 날이며, 평소에 알지 못했던 새로운 정보를 얻게 될 것입니다. 직감을 믿고 새로운 시도를 해도 좋은 결과가 있을 것입니다. 다만 현실성을 잃지 않도록 주의하세요.',
      wealth: '특이한 방법이나 아이디어로 수익이 생길 수 있습니다. 평범한 방식이 아닌 창의적인 접근이 돈을 벌게 할 것입니다. 지식 재산권이나 특허 관련 수익도 기대됩니다.',
      love: '독특한 매력이 발산됩니다. 평범하지 않은 사람에게 끌리게 되며, 지적인 대화가 관계를 깊게 만듭니다. 특이한 취미를 공유하며 친밀해지세요.',
      work: '창의적 문제 해결과 연구에 강점을 보이는 날입니다. 기존 방식으로는 해결되지 않던 문제를 새로운 시각으로 해결할 수 있습니다. R&D 업무에 집중하세요.',
      health: '정신적 활동이 활발합니다. 두뇌 운동이 필요하며, 명상이나 요가로 직관력을 키우는 것이 좋습니다. 다만 현실 도피는 피하세요.',
      luckyPoints: { color: '보라색', number: '4, 9, 13', direction: '서쪽', item: '책' },
      activities: { good: ['학습', '연구', '명상', '창의적 활동'], avoid: ['편견', '고정관념', '현실 도피'] },
      caution: ['현실성 부족으로 인한 실패 주의', '비현실적 계획은 수정이 필요합니다', '혼자만의 세계에 빠지지 마세요'],
    },
    '정인': {
      score: 80,
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

  // 해시 기반 점수 미세 조정
  const hash = getHash(`${sajuResult.dayMaster}-${todayStr}`);
  pattern.score = Math.max(35, Math.min(92, pattern.score + (hash % 7) - 3));

  return pattern;
}

function getHash(str: string): number {
  return str.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
}
