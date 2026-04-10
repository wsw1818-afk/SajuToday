import { useMemo } from 'react';
import { SajuResult, Element, UserProfile } from '../types';
import { getDayGanji } from '../services/MonthlyDailyFortune';
import { ILJU_60_INTERPRETATIONS } from '../data/fortuneMessages';
import { getTenGod, TEN_GOD_MEANINGS, stemToElement } from '../utils/elementConverter';
import { analyzeDayMasterStrength, analyzeYongsin } from '../services/AdvancedSajuAnalysis';
import { generatePersonalNarrative } from '../services/generatePersonalNarrative';
import { analyzeDaeunSeun } from '../services/DaeunCalculator';

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
    return { bonus: 10, type: '조화', desc: '오늘은 기운이 서로 잘 맞아서 조화와 협력이 빛나는 날이에요!' };
  }
  if (BRANCH_CLASH[myBranch] === todayBranch) {
    return { bonus: -15, type: '충돌', desc: '오늘은 기운이 정면으로 부딪히는 날이에요. 충돌과 변동이 많으니 각별히 조심하세요.' };
  }
  if (BRANCH_PUNISHMENT[myBranch]?.includes(todayBranch)) {
    return { bonus: -12, type: '마찰', desc: '오늘은 갈등과 마찰이 생기기 쉬운 날이에요. 말조심하고 분쟁을 피하세요.' };
  }
  return { bonus: 0, type: '', desc: '' };
}

// 일진 기준 신살 판별 (일지 vs 오늘 지지)
// 도화살: 인오술→묘, 사유축→오, 신자진→유, 해묘미→자
const DOHUA: Record<string, string> = {
  '인':'묘','오':'묘','술':'묘',
  '사':'오','유':'오','축':'오',
  '신':'유','자':'유','진':'유',
  '해':'자','묘':'자','미':'자',
};
// 역마살: 인오술→신, 사유축→해, 신자진→인, 해묘미→사
const YEOKMA: Record<string, string> = {
  '인':'신','오':'신','술':'신',
  '사':'해','유':'해','축':'해',
  '신':'인','자':'인','진':'인',
  '해':'사','묘':'사','미':'사',
};
// 천을귀인 (일간 기준)
const CHEONUL: Record<string, string[]> = {
  '갑': ['축','미'], '을': ['자','신'], '병': ['해','유'], '정': ['해','유'],
  '무': ['축','미'], '기': ['자','신'], '경': ['축','미'], '신': ['인','오'],
  '임': ['묘','사'], '계': ['묘','사'],
};

// 겁살: 인오술→사, 사유축→인, 신자진→해, 해묘미→신
const GEOBSAL: Record<string, string> = {
  '인':'사','오':'사','술':'사',
  '사':'인','유':'인','축':'인',
  '신':'해','자':'해','진':'해',
  '해':'신','묘':'신','미':'신',
};
// 망신살: 인오술→해, 사유축→인, 신자진→사, 해묘미→신
const MANGSIN: Record<string, string> = {
  '인':'해','오':'해','술':'해',
  '사':'인','유':'인','축':'인',
  '신':'사','자':'사','진':'사',
  '해':'신','묘':'신','미':'신',
};
// 장성살: 인오술→오, 사유축→유, 신자진→자, 해묘미→묘
const JANGSEONG: Record<string, string> = {
  '인':'오','오':'오','술':'오',
  '사':'유','유':'유','축':'유',
  '신':'자','자':'자','진':'자',
  '해':'묘','묘':'묘','미':'묘',
};

function getDailySinsalBonus(myBranch: string, todayBranch: string): number {
  let bonus = 0;
  // 도화살 (이성운 상승, 매력 +)
  if (DOHUA[myBranch] === todayBranch) bonus += 3;
  // 역마살 (이동/변화 기운, 양면적)
  if (YEOKMA[myBranch] === todayBranch) bonus += 0; // 양면이라 점수 보정 없음
  // 겁살 (재물/신체 손실 주의)
  if (GEOBSAL[myBranch] === todayBranch) bonus -= 5;
  // 망신살 (체면 손상 주의)
  if (MANGSIN[myBranch] === todayBranch) bonus -= 4;
  // 장성살 (리더십/추진력 상승)
  if (JANGSEONG[myBranch] === todayBranch) bonus += 4;
  return bonus;
}

// 천을귀인 확인 (일간 기준, 외부에서 호출)
function hasCheoneulGuin(dayStem: string, todayBranch: string): boolean {
  return CHEONUL[dayStem]?.includes(todayBranch) || false;
}

export function useTodayFortune(sajuResult: SajuResult | null, targetDate?: Date, profile?: UserProfile | null): TodayFortune | null {
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

    // 용신/기신 분석 → 오늘 오행이 나에게 이로운지 해로운지 판별
    const dayMasterStrength = analyzeDayMasterStrength(sajuResult.pillars, sajuResult.elements);
    const yongsinResult = analyzeYongsin(sajuResult.pillars, sajuResult.elements, dayMasterStrength);
    const todayStemElement = (stemToElement(dayGanji.stem) || 'earth') as Element;
    // 용신/희신이면 +, 기신/구신이면 -
    let yongsinBonus = 0;
    let yongsinType: 'yongsin' | 'heeshin' | 'gushin' | 'gishin' | 'neutral' = 'neutral';
    if (yongsinResult.yongsin.includes(todayStemElement)) { yongsinBonus = 15; yongsinType = 'yongsin'; }
    else if (yongsinResult.heeshin.includes(todayStemElement)) { yongsinBonus = 8; yongsinType = 'heeshin'; }
    else if (yongsinResult.gushin.includes(todayStemElement)) { yongsinBonus = -8; yongsinType = 'gushin'; }
    else if (yongsinResult.gishin.includes(todayStemElement)) { yongsinBonus = -15; yongsinType = 'gishin'; }

    // 일진 기준 신살 판별 (일지 vs 오늘 지지 + 천을귀인)
    let sinsalBonus = getDailySinsalBonus(myDayPillar.branch, dayGanji.branch);
    if (hasCheoneulGuin(sajuResult.dayMaster, dayGanji.branch)) sinsalBonus += 8;

    // 4주(년/월/시) 지지 vs 오늘 지지 관계 분석
    let pillarBonus = 0;
    // 년주 지지 vs 오늘 지지 (사회운)
    const yearBranch = sajuResult.pillars.year?.branch;
    if (yearBranch) {
      if (BRANCH_HARMONY[yearBranch] === dayGanji.branch) pillarBonus += 3;
      if (BRANCH_CLASH[yearBranch] === dayGanji.branch) pillarBonus -= 3;
      if (BRANCH_PUNISHMENT[yearBranch]?.includes(dayGanji.branch)) pillarBonus -= 2;
    }
    // 월주 지지 vs 오늘 지지 (직장운)
    const monthBranch = sajuResult.pillars.month?.branch;
    if (monthBranch) {
      if (BRANCH_HARMONY[monthBranch] === dayGanji.branch) pillarBonus += 4;
      if (BRANCH_CLASH[monthBranch] === dayGanji.branch) pillarBonus -= 5;
      if (BRANCH_PUNISHMENT[monthBranch]?.includes(dayGanji.branch)) pillarBonus -= 3;
    }
    // 시주 지지 vs 오늘 지지 (건강운) - 시주가 있을 때만
    const hourBranch = sajuResult.pillars.hour?.branch;
    if (hourBranch) {
      if (BRANCH_HARMONY[hourBranch] === dayGanji.branch) pillarBonus += 2;
      if (BRANCH_CLASH[hourBranch] === dayGanji.branch) pillarBonus -= 2;
      if (BRANCH_PUNISHMENT[hourBranch]?.includes(dayGanji.branch)) pillarBonus -= 1;
    }

    // 공망(空亡) 판별: 일주 기준
    const STEMS_LIST = ['갑','을','병','정','무','기','경','신','임','계'];
    const BRANCHES_LIST = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
    let gongmangBonus = 0;
    const stemIdx = STEMS_LIST.indexOf(sajuResult.dayMaster);
    const branchIdx = BRANCHES_LIST.indexOf(myDayPillar.branch);
    if (stemIdx >= 0 && branchIdx >= 0) {
      const startBranch = (branchIdx - stemIdx + 12) % 12;
      const gongmang1 = BRANCHES_LIST[(startBranch + 10) % 12];
      const gongmang2 = BRANCHES_LIST[(startBranch + 11) % 12];
      if (dayGanji.branch === gongmang1 || dayGanji.branch === gongmang2) {
        gongmangBonus = -6;
      }
    }

    // 대운/세운 바탕색 판별
    let daeSaeContext: string = 'neutral';
    let daeSaeBonus = 0;
    if (profile?.birthDate) {
      try {
        const birthParts = profile.birthDate.split('-').map(Number);
        const daeunResult = analyzeDaeunSeun(
          birthParts[0], birthParts[1], birthParts[2],
          profile.birthTime ? parseInt(profile.birthTime.split(':')[0]) : null,
          profile.gender || 'male',
          sajuResult.dayMaster,
          sajuResult.pillars.month.stem,
          sajuResult.pillars.month.branch
        );
        // 현재 대운이 용신/기신인지 판별
        if (daeunResult.currentDaeun) {
          const daeunElement = (stemToElement(daeunResult.currentDaeun.gan) || 'earth') as Element;
          if (yongsinResult.yongsin.includes(daeunElement)) { daeSaeBonus = 8; daeSaeContext = 'favorable'; }
          else if (yongsinResult.heeshin.includes(daeunElement)) { daeSaeBonus = 4; daeSaeContext = 'slightly_favorable'; }
          else if (yongsinResult.gushin.includes(daeunElement)) { daeSaeBonus = -4; daeSaeContext = 'slightly_challenging'; }
          else if (yongsinResult.gishin.includes(daeunElement)) { daeSaeBonus = -8; daeSaeContext = 'challenging'; }
        }
        // 세운(올해) 보정 추가
        if (daeunResult.currentSeun) {
          const seunElement = (stemToElement(daeunResult.currentSeun.gan) || 'earth') as Element;
          if (yongsinResult.yongsin.includes(seunElement)) daeSaeBonus += 4;
          else if (yongsinResult.gishin.includes(seunElement)) daeSaeBonus -= 4;
        }
      } catch (_e) {
        // 대운 계산 실패 시 무시
      }
    }

    const fortuneBase = calculateFortuneByTenGod(tenGod, myIljuData, sajuResult, todayIlju, todayStr, branchResult, yongsinType, dayGanji, dayMasterStrength.strength, daeSaeContext);

    // 카테고리별 점수 계산 (용신 + 지지 + 신살 + 4주보정 + 공망 + 대운/세운 보정 통합)
    const totalBonus = yongsinBonus + sinsalBonus + pillarBonus + gongmangBonus + daeSaeBonus;
    const baseScore = Math.max(20, Math.min(98, fortuneBase.score + totalBonus));
    const hash = getHash(`${sajuResult.dayMaster}-${todayStr}`);
    const branchBonus = branchResult.bonus;
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
  }, [sajuResult, targetDateStr, profile?.birthDate, profile?.birthTime, profile?.gender]);
}

function calculateFortuneByTenGod(
  tenGod: string,
  myIljuData: any,
  sajuResult: SajuResult,
  todayIlju: string,
  todayStr: string,
  branchResult: { bonus: number; type: string; desc: string } = { bonus: 0, type: '', desc: '' },
  yongsinType: 'yongsin' | 'heeshin' | 'gushin' | 'gishin' | 'neutral' = 'neutral',
  dayGanji: { stem: string; branch: string } = { stem: '갑', branch: '자' },
  strengthStr: string = 'neutral',
  daeSaeCtx: string = 'neutral'
) {
  // 모든 데이터가 없을 때도 풍부한 기본값 제공
  const defaultData = {
    summary: '평온하게 흘러가는 하루예요.',
    advice: '평소처럼 차분하게 보내세요. 작은 노력이 큰 결실을 맺을 거예요.',
    detail: '오늘은 큰 변화 없이 안정적으로 흘러가는 날이에요. 무리하지 않고 평소 하던 일을 꾸준히 하면 좋은 결과가 있을 거예요. 주변 사람들과의 소통에서 작은 기쁨을 찾을 수 있어요.',
    score: 60,
    wealth: '금전적으로 안정적인 날이에요. 큰 변동 없이 평소대로 관리하면 돼요. 다만 큰 투자는 신중히 검토하세요.',
    love: '가까운 사람과 따뜻한 대화를 나눠보세요. 소소하지만 확실한 행복을 느낄 수 있는 날이에요.',
    work: '맡은 일을 성실히 처리하면 좋은 평가를 받을 수 있어요. 차분하게 하루를 보내세요.',
    health: '전반적으로 괜찮지만, 작은 피로가 쌓여 있을 수 있어요. 적절한 휴식과 스트레칭을 잊지 마세요.',
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
      summary: '나와 비슷한 기운이 강해지는 날이에요.',
      advice: '혼자보다 함께할 때 힘이 배가 됩니다. 동료와 협력하세요.',
      detail: '오늘은 나와 비슷한 에너지가 주변에 가득한 날이에요. 같은 생각을 가진 사람들과 팀을 이루어 일하면 최고의 결과를 얻을 수 있습니다. 혼자서는 어려웠던 일도 동료들과 함께하면 쉽게 해결되고, 토론 속에서 새로운 아이디어가 샘솟을 거예요. 대인관계도 활기차고, 친구들과의 만남이 큰 즐거움이 됩니다. 다만 경쟁심이 지나치면 갈등으로 번질 수 있으니 상대방 의견도 존중하세요.',
      wealth: '함께 하면 돈이 보여요. 공동 투자나 파트너십이 유리하고, 친구나 동료 소개로 좋은 기회가 올 수 있습니다. 다만 돈 거래는 신중히 하세요.',
      love: '친구처럼 편안하고 자연스러운 관계가 좋아요. 역지로 꾸미기보다 있는 그대로의 모습이 매력적인 날이에요. 친구 소개로 인연이 닿을 수도 있습니다.',
      work: '팀워크가 빛나는 날이에요. 혼자 하는 일보다 여러 사람과 함께하는 업무에서 큰 성과를 거둘 수 있어요. 회의나 브레인스토밍에 적극 참여하세요.',
      health: '에너지가 충만해서 운동하기 좋은 날이에요. 특히 단체 운동이나 팀 스포츠가 피로를 풀고 활력을 불어넣어 줄 거예요. 다만 무리한 경쟁은 피하세요.',
      luckyPoints: { color: '파란색', number: '1, 6, 10', direction: '북쪽', item: '시계' },
      activities: { good: ['팀 미팅', '협상', '단체 운동', '네트워킹', '스터디'], avoid: ['독단적 행동', '무리한 경쟁', '독서실'] },
      caution: ['경쟁 심화로 인한 스트레스 주의', '과신은 금물입니다', '동료와의 마찰에 주의하세요'],
    },
    '겁재': {
      score: 45,
      summary: '뜻하지 않은 손실에 주의해야 하는 날이에요.',
      advice: '돈 거래를 피하고, 있는 것을 지키는 데 집중하세요.',
      detail: '오늘은 나도 모르게 돈이나 기회가 빠져나가기 쉬운 날이에요. 주변에서 경쟁자가 나타나거나, 남의 부탁을 들어주다 본인이 손해를 볼 수 있어요. 보증이나 돈 빌려주기는 절대 피하세요. 친한 사이일수록 금전 거래는 독이 됩니다. 달콤한 투자 제안이 온다면 100% 의심하세요. 오늘 하루만 참으면 내일은 나아질 거예요.',
      wealth: '재물 손실이 우려돼요. 보증, 대출, 투자 모두 오늘은 안 돼요. 예상 못한 지출이 생길 수 있으니 지갑을 단단히 닫아두세요. 있는 돈을 지키는 것이 곧 버는 거예요.',
      love: '질투심이나 집착이 강해질 수 있어요. 연인에게 너무 매달리면 역효과가 나요. 한 발 물러서서 여유를 보여주세요. 오늘 새로 시작하는 인연은 나중에 돈 문제로 번질 수 있어요.',
      work: '직장에서 억울한 일을 당하거나 내 공을 뺏길 수 있어요. 중요한 아이디어는 공개하지 말고, 동료의 부탁도 신중히 판단하세요. 오늘은 묵묵히 자기 일만 하는 게 최선이에요.',
      health: '스트레스가 극심해질 수 있어요. 두통, 소화불량, 불면증에 주의하세요. 격한 운동보다 가벼운 산책이 좋고, 음주는 절대 피하세요.',
      luckyPoints: { color: '빨간색', number: '2, 7, 16', direction: '남쪽', item: '지갑' },
      activities: { good: ['경쟁 준비', '자기 계발', '문제 해결'], avoid: ['무리한 지출', '도박', '충동적 구매'] },
      caution: ['경쟁 과열로 인한 갈등 주의', '금전적 압박에 대비하세요', '피로 누적에 주의하세요'],
    },
    '식신': {
      score: 80,
      summary: '창의력과 즐거움이 넘치는 날이에요!',
      advice: '재능을 마음껏 발휘하세요. 오늘 떠오르는 아이디어를 놓치지 마세요.',
      detail: '오늘은 머릿속에서 아이디어가 샘솟고, 표현력이 최고조에 달하는 날이에요. 무언가를 만들고 표현하는 데 최적의 날이니, 글쓰기, 요리, 그림, 음악 등 창작 활동을 해보세요. 주변 사람들이 당신의 재능에 감탄할 거예요. 맛있는 음식을 즐기기에도 좋은 날이니 점심에 맛집을 가는 것도 추천해요.',
      wealth: '반짝이는 아이디어가 돈이 될 수 있어요. 새로운 사업 아이템이나 콘텐츠로 수익을 낼 기회가 생길 수 있어요. 음식이나 예술 관련 분야에서 특히 유리해요.',
      love: '즐거운 만남과 로맨틱한 시간이 기다리고 있어요. 솔직하게 마음을 표현하면 상대방이 감동받을 거예요. 함께 맛집을 가거나 문화 생활을 즐기면 관계가 더 깊어져요.',
      work: '기획, 창작, 발표에서 빛나는 날이에요. 회의에서 아이디어를 던지면 큰 호응을 얻을 거예요. 디자인이나 기획 업무에 집중하세요.',
      health: '식욕이 왕성하고 컨디션이 좋아요. 다만 과식은 주의! 영양가 있는 음식을 골고루 드세요. 즐거운 활동이 스트레스 해소에 큰 도움이 돼요.',
      luckyPoints: { color: '노란색', number: '5, 0, 22', direction: '중앙', item: '펜' },
      activities: { good: ['창작 활동', '취미', '맛집 탐방', '발표', '요리'], avoid: ['과식', '단조로운 일상', '비판적인 사람들'] },
      caution: ['지나친 낙관으로 인한 실수 주의', '과식으로 인한 소화불량 주의', '지출 관리 필요'],
    },
    '상관': {
      score: 50,
      summary: '말조심이 필요한 날이에요. 입이 화를 부를 수 있어요.',
      advice: '하고 싶은 말이 있어도 한 번 더 삼키세요. 침묵이 금이에요.',
      detail: '오늘은 윗사람에게 대들거나 불필요한 논쟁에 휘말리기 쉬운 날이에요. 자기 주장이 지나치게 강해져서 주변과 마찰이 생기고, 한마디 말이 돌이킬 수 없는 결과를 초래할 수 있어요. SNS에 감정적인 글을 올리거나 단체 채팅에서 날카로운 의견을 내는 것도 위험해요. 솔직함은 좋지만, 오늘만큼은 조용히 있는 게 나아요. 대신 창작 활동이나 혼자 하는 작업에 에너지를 쏟으면 좋은 결과가 있을 거예요.',
      wealth: '스트레스를 쇼핑으로 풀면 큰 낭비로 이어져요. 계획에 없던 지출은 절대 피하고, 투자도 감정적 판단이 되기 쉬우니 오늘은 미루세요.',
      love: '연인에게 상처 되는 말을 내뱉기 쉬운 날이에요. 사소한 불만이 큰 싸움으로 번질 수 있으니, 오늘은 꾹 참으세요. 솔로라면 첫인상에서 실수할 수 있으니 만남을 미루는 게 좋아요.',
      work: '윗사람과 충돌 위험이 높아요. 아무리 옳은 말이라도 오늘은 참으세요. 회의에서 반박하거나 불만을 드러내면 돌이킬 수 없어요. 묵묵히 주어진 일만 처리하세요.',
      health: '에너지가 과하게 소모돼요. 두통, 목 통증, 소화불량에 주의하세요. 감정이 몸에 영향을 줄 수 있으니, 심호흡이나 명상으로 마음을 다스리세요.',
      luckyPoints: { color: '초록색', number: '3, 8, 15', direction: '동쪽', item: '노트북' },
      activities: { good: ['새로운 시도', '기획', '운동', '솔직한 대화'], avoid: ['고집 피우기', '옛날 방식 고수', '비협조적인 태도'] },
      caution: ['감정 조절에 주의하세요', '타인과 마찰 가능성', '변화가 너무 급격하면 반발을 살 수 있습니다'],
    },
    '편재': {
      score: 82,
      summary: '뜻밖의 행운이 찾아올 수 있는 날이에요!',
      advice: '기회가 보이면 잡으세요! 다만 욕심을 부리면 역효과가 나요.',
      detail: '오늘은 예상치 못한 곳에서 좋은 소식이 올 수 있는 날이에요. 뜻밖의 수입이 생기거나, 그동안 노력했던 것에서 결실이 맺힐 수 있어요. 새로운 수입원을 찾기에도 좋은 시기예요. 다만 과욕은 금물! 무리한 투자나 도박은 오늘의 행운을 한순간에 날려버릴 수 있으니 조심하세요.',
      wealth: '뜻밖의 수입이 생길 수 있어요! 보너스, 성과급, 또는 부업 기회가 기대돼요. 다만 "확실한 수익"이라며 다가오는 제안은 한 번 더 확인하세요.',
      love: '여유로운 마음이 매력을 높여줘요. 선물이나 특별한 경험을 함께 나누면 관계가 더 좋아져요. 다만 돈으로 마음을 사려 하면 역효과가 나요.',
      work: '성과가 인정받고 보상이 따르는 날이에요. 영업이나 고객 응대에서 특히 좋은 결과가 있을 거예요. 적극적으로 움직이세요.',
      health: '활력이 넘쳐요! 활발하게 움직이면 오히려 피로가 풀려요. 다만 과식이나 음주는 주의하세요.',
      luckyPoints: { color: '금색', number: '4, 9, 18', direction: '서쪽', item: '동전 지갑' },
      activities: { good: ['투자', '영업', '부업', '재무 상담', '경매 참여'], avoid: ['도박성 투자', '무리한 차입', '충동적 구매'] },
      caution: ['과욕은 금물입니다', '무리한 차입 절대 금지', '도박성 투자는 손실의 지름길입니다'],
    },
    '정재': {
      score: 72,
      summary: '꾸준한 노력이 빛을 발하는 안정적인 날이에요.',
      advice: '작은 것부터 차근차근 쌓아가세요. 급하게 굴면 오히려 손해예요.',
      detail: '오늘은 성실하게 해온 일이 보상받는 날이에요. 급격한 변화보다는 지금까지 해온 것을 꾸준히 이어가는 것이 좋아요. 금전 관리나 저축 계획을 세우기에 딱 좋은 날이고, 연봉 협상이나 계약도 좋은 결과가 기대돼요. 한 방을 노리기보다 착실하게 쌓아가는 자세가 오늘의 행운을 부른답니다.',
      wealth: '안정적인 수입이 기대돼요. 급여 협상이나 계약에서 좋은 조건을 이끌어낼 수 있어요. 장기 투자나 저축을 시작하기 좋은 날이에요.',
      love: '진지하고 안정적인 관계가 좋아요. 화려한 연애보다 서로를 배려하는 편안한 관계가 오래갑니다. 미래를 함께 이야기해보세요.',
      work: '성실한 태도가 인정받는 날이에요. 꼼꼼하게 일 처리하면 상사에게 좋은 평가를 받을 수 있어요.',
      health: '규칙적인 생활이 건강의 열쇠예요. 제때 먹고, 제때 자는 것만으로도 컨디션이 좋아져요.',
      luckyPoints: { color: '갈색', number: '5, 0, 25', direction: '중앙', item: '통장' },
      activities: { good: ['재무 계획', '저축', '연봉 협상', '장기 투자'], avoid: ['낭비', '충동적 소비', '무모한 도전'] },
      caution: ['지나친 보수성은 기회를 놓칠 수 있습니다', '변화를 너무 두려워하지 마세요', '현재 안주에 빠지지 마세요'],
    },
    '편관': {
      score: 35,
      summary: '외부의 강한 압박이 있는 힘든 날이에요.',
      advice: '오늘은 몸을 사리세요. 새로운 일은 미루고, 조용히 버티는 게 최선이에요.',
      detail: '오늘은 내 뜻대로 되지 않는 일이 생기기 쉬운 날이에요. 갑작스러운 질책, 예상 못한 문제, 건강 이상 등이 찾아올 수 있어요. 무리한 도전은 절대 금물이고, 위험한 활동이나 밤늦게 돌아다니는 건 피하세요. 가능하다면 집에서 조용히 쉬는 게 최선이에요. 이 기운은 하루면 지나가니 참을성 있게 버티세요. 내일은 분명 나아질 거예요.',
      wealth: '큰 손실이 우려돼요. 투자, 계약, 보증 모두 오늘은 절대 안 돼요. 금전 관련 결정은 모두 내일로 미루세요. 달콤한 제안이 와도 절대 넘어가지 마세요.',
      love: '감정적 충돌이 크게 일어날 수 있어요. 민감한 대화는 피하고, 연인과 다투더라도 오늘은 꾹 참으세요. 내일이면 괜찮아질 거예요.',
      work: '윗사람이나 거래처로부터 강한 압박이 올 수 있어요. 불합리한 요구를 받아도 정면 대응은 위험해요. 오늘은 인내가 최고의 전략이에요. 실수가 치명적일 수 있으니 모든 일을 두 번 확인하세요.',
      health: '사고와 부상에 특히 조심하세요. 운전할 때 더욱 주의하고, 격한 운동이나 위험한 활동은 피하세요. 몸이 보내는 신호에 귀 기울이세요.',
      luckyPoints: { color: '검정색', number: '1, 6, 11', direction: '북쪽', item: '수호석' },
      activities: { good: ['문제 해결', '인내심 발휘', '식', '정리'], avoid: ['회피', '무책임한 태도', '무리한 도전'] },
      caution: ['무리한 도전은 위험합니다', '건강 악화에 주의하세요', '책임감이 과해져 번아웃 될 수 있습니다'],
    },
    '정관': {
      score: 75,
      summary: '인정받고 빛나는 날이에요!',
      advice: '능력을 자신 있게 보여주세요. 오늘 당신의 노력이 주목받아요.',
      detail: '오늘은 윗사람이나 주변에서 당신을 인정해주는 날이에요. 공식적인 자리에서 좋은 평가를 받을 수 있고, 승진이나 좋은 소식이 있을 수도 있어요. 책임감 있는 태도가 높이 평가받으니 성실하게 임하세요. 리더십을 발휘하기에도 좋은 날이지만, 너무 딱딱하면 주변이 불편해할 수 있으니 적당한 유연함도 보여주세요.',
      wealth: '정당한 보상이 따르는 날이에요. 승진이나 연봉 인상 소식이 있을 수 있고, 안정적인 수입 증가가 기대돼요.',
      love: '진지하고 성숙한 관계가 좋아요. 서로를 존중하는 모습이 상대방에게 큰 매력으로 다가와요. 신뢰를 보여주세요.',
      work: '상사에게 인정받기 좋은 날이에요. 공식 발표나 보고에서 빛날 수 있어요. 리더십을 발휘해보세요.',
      health: '규칙적인 생활이 건강의 비결이에요. 과도한 업무 스트레스만 주의하면 괜찮아요.',
      luckyPoints: { color: '남색', number: '6, 1, 19', direction: '북서쪽', item: '명함' },
      activities: { good: ['공식 행사', '발표', '보고', '상사와의 면담'], avoid: ['반항적 태도', '규칙 어김', '무모한 행동'] },
      caution: ['융통성 부족으로 인한 갈등 주의', '과도한 책임감에 주의하세요', '윗사람과의 마찰을 피하세요'],
    },
    '편인': {
      score: 55,
      summary: '집중력이 흐려지고 불안한 기운이 있는 날이에요.',
      advice: '현실에 집중하세요. 쓸데없는 걱정은 내려놓고 지금 할 일에만 집중하세요.',
      detail: '오늘은 머릿속이 복잡해지고 쓸데없는 걱정이 많아지기 쉬운 날이에요. 직감이 예민해지는 건 좋지만, 근거 없는 의심이나 불안으로 번질 수 있어요. 혼자만의 생각에 빠지지 말고, 주변 사람들과 대화하면서 현실 감각을 유지하세요. 중요한 결정은 오늘 내리지 말고, 평소 하던 일을 묵묵히 해나가는 게 최선이에요.',
      wealth: '판단력이 흐려져서 잘못된 결정을 내리기 쉬워요. "이번엔 다를 거야"라는 생각이 드는 투자는 100% 함정이에요. 돈 관련 결정은 모두 내일로 미루세요.',
      love: '의심과 불안이 관계를 흔들 수 있어요. 상대방의 말을 너무 깊이 해석하거나, 없는 의심을 만들지 마세요. 오늘은 연락을 줄이는 게 오히려 도움이 돼요.',
      work: '집중력이 떨어지고 실수가 잦아질 수 있어요. 중요한 보고서나 발표는 오늘 마무리하지 마세요. 꼼꼼히 두세 번 확인하는 게 안전해요.',
      health: '잠이 잘 안 오거나 쓸데없는 걱정에 시달릴 수 있어요. 자기 전 스마트폰을 내려놓고, 따뜻한 차 한 잔으로 마음을 달래세요.',
      luckyPoints: { color: '보라색', number: '4, 9, 13', direction: '서쪽', item: '책' },
      activities: { good: ['학습', '연구', '명상', '창의적 활동'], avoid: ['편견', '고정관념', '현실 도피'] },
      caution: ['현실성 부족으로 인한 실패 주의', '비현실적 계획은 수정이 필요합니다', '혼자만의 세계에 빠지지 마세요'],
    },
    '정인': {
      score: 73,
      summary: '누군가의 도움이 찾아오는 따뜻한 날이에요.',
      advice: '주변의 조언에 귀 기울이세요. 오늘 배운 것이 미래를 바꿀 수 있어요.',
      detail: '오늘은 주변에서 따뜻한 도움의 손길이 찾아오는 날이에요. 공부하거나 새로운 것을 배우기에 최적의 날이고, 선배나 멘토의 조언이 큰 도움이 될 거예요. 가족과 보내는 시간도 특히 좋고, 편안한 보호의 기운이 당신을 감싸줘요. 다만 남에게 너무 기대지 말고, 스스로 결정하는 연습도 필요해요.',
      wealth: '배움이 돈이 되는 날이에요. 자격증이나 교육 관련 투자가 장기적으로 좋은 수입원이 될 수 있어요.',
      love: '서로를 돌보는 따뜻한 관계가 좋아요. 편안하고 가족 같은 분위기에서 사랑이 깊어져요. 진심 어린 조언이 관계를 더 단단하게 만들어요.',
      work: '선배나 멘토의 도움을 받기 좋은 날이에요. 모르는 건 적극적으로 물어보세요. 배우는 자세가 좋은 평가로 이어져요.',
      health: '충분한 휴식이 필요해요. 잘 먹고 잘 자는 것만으로도 컨디션이 좋아져요. 가벼운 산책도 큰 도움이 돼요.',
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
    pattern.detail = `${myIljuData.summary}\n\n${pattern.detail}`;
    pattern.activities.good = [...myIljuData.goodActivities.slice(0, 2), ...pattern.activities.good.slice(0, 4)];
    pattern.activities.avoid = [...myIljuData.avoidSituations.slice(0, 2), ...pattern.activities.avoid.slice(0, 2)];
    pattern.caution = [...myIljuData.caution.slice(0, 1), ...pattern.caution.slice(0, 2)];
  }

  // 해시 기반 점수 미세 조정 (범위 확대: ±7)
  const hash = getHash(`${sajuResult.dayMaster}-${todayStr}`);
  const scoreVariation = (hash % 15) - 7;
  // 지지 관계 보정 반영
  pattern.score = Math.max(20, Math.min(95, pattern.score + branchResult.bonus + scoreVariation));

  // 개인 맞춤 서술형 풀이 엔진으로 텍스트 교체
  const myElement = (stemToElement(sajuResult.dayMaster) || 'wood') as Element;
  const todayElement = (stemToElement(dayGanji.stem) || 'earth') as Element;
  const narrative = generatePersonalNarrative({
    myElement,
    myStem: sajuResult.dayMaster,
    todayElement,
    todayBranch: dayGanji.branch,
    tenGod,
    strength: strengthStr,
    yongsinType,
    branchType: branchResult.type,
    daeSaeContext: daeSaeCtx,
    dateHash: hash,
  });

  // 엔진 결과로 텍스트 교체 (점수/luckyPoints/activities/caution은 기존 유지)
  pattern.summary = `${narrative.stageName}의 날`;
  pattern.detail = narrative.overall;

  // 신살 특수 문구 삽입
  const myDayBranch = sajuResult.pillars.day.branch;
  if (DOHUA[myDayBranch] === dayGanji.branch) {
    pattern.detail = `💫 오늘은 매력이 유독 빛나는 날이에요. 이성의 시선이 집중될 수 있어요. 외모에 신경 쓰면 좋은 인연이 닿을 수 있어요.\n\n${pattern.detail}`;
  }
  if (YEOKMA[myDayBranch] === dayGanji.branch) {
    pattern.detail = `🚗 오늘은 움직이면 좋은 날이에요. 새로운 곳에 가거나, 평소 안 하던 활동을 하면 행운이 따라와요. 출장이나 여행 계획이 있다면 좋은 타이밍이에요.\n\n${pattern.detail}`;
  }
  if (hasCheoneulGuin(sajuResult.dayMaster, dayGanji.branch)) {
    pattern.detail = `🌟 오늘은 귀한 도움이 오는 날이에요. 어려운 일이 있어도 누군가가 나서서 도와줄 거예요. 필요한 게 있다면 주저 말고 주변에 요청해보세요.\n\n${pattern.detail}`;
  }

  pattern.wealth = narrative.wealth;
  pattern.love = narrative.love;
  pattern.work = narrative.work;
  pattern.health = narrative.health;

  return pattern;
}

function getHash(str: string): number {
  return (str.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)) >>> 0;
}
