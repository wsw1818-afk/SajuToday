/**
 * 신살(神殺) 계산기
 * 사주의 길신(吉神)과 흉신(凶神)을 계산합니다.
 */

import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../data/saju';

// 천간 인덱스
const STEM_INDEX: Record<string, number> = {
  '갑': 0, '을': 1, '병': 2, '정': 3, '무': 4,
  '기': 5, '경': 6, '신': 7, '임': 8, '계': 9,
};

// 지지 인덱스
const BRANCH_INDEX: Record<string, number> = {
  '자': 0, '축': 1, '인': 2, '묘': 3, '진': 4, '사': 5,
  '오': 6, '미': 7, '신': 8, '유': 9, '술': 10, '해': 11,
};

// 지지 한자
const BRANCH_HANJA: Record<string, string> = {
  '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳',
  '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥',
};

// ============================================
// 길신(吉神) 계산
// ============================================

/**
 * 천을귀인(天乙貴人) - 귀인의 도움을 받는 신살
 * 일간 기준으로 특정 지지에 천을귀인이 있음
 */
const CHEONUL_GUIIN: Record<string, string[]> = {
  '갑': ['축', '미'], '을': ['자', '신'], '병': ['해', '유'], '정': ['해', '유'],
  '무': ['축', '미'], '기': ['자', '신'], '경': ['축', '미'], '신': ['인', '오'],
  '임': ['묘', '사'], '계': ['묘', '사'],
};

/**
 * 천덕귀인(天德貴人) - 하늘의 덕으로 재난을 피함
 * 월지 기준
 */
const CHEONDUK_GUIIN: Record<string, string> = {
  '인': '정', '묘': '신', '진': '임', '사': '신',
  '오': '해', '미': '갑', '신': '계', '유': '인',
  '술': '병', '해': '을', '자': '사', '축': '경',
};

/**
 * 월덕귀인(月德貴人) - 달의 덕으로 질병이 회복됨
 * 월지 기준
 */
const WOLDUK_GUIIN: Record<string, string> = {
  '인': '병', '묘': '갑', '진': '임', '사': '경',
  '오': '병', '미': '갑', '신': '임', '유': '경',
  '술': '병', '해': '갑', '자': '임', '축': '경',
};

/**
 * 문창귀인(文昌貴人) - 학업운, 시험운
 * 일간 기준
 */
const MUNCHANG_GUIIN: Record<string, string> = {
  '갑': '사', '을': '오', '병': '신', '정': '유', '무': '신',
  '기': '유', '경': '해', '신': '자', '임': '인', '계': '묘',
};

/**
 * 학당귀인(學堂貴人) - 배움의 복
 * 일간 기준
 */
const HAKDANG_GUIIN: Record<string, string> = {
  '갑': '해', '을': '해', '병': '인', '정': '인', '무': '인',
  '기': '사', '경': '사', '신': '신', '임': '신', '계': '해',
};

/**
 * 금여록(金輿祿) - 배우자 복, 부귀
 * 일간 기준
 */
const GEUMYEO_LOK: Record<string, string> = {
  '갑': '진', '을': '사', '병': '미', '정': '신', '무': '미',
  '기': '신', '경': '술', '신': '해', '임': '축', '계': '인',
};

/**
 * 천관귀인(天官貴人) - 관운, 승진운
 * 일간 기준
 */
const CHEONGWAN_GUIIN: Record<string, string> = {
  '갑': '미', '을': '진', '병': '사', '정': '인', '무': '사',
  '기': '인', '경': '해', '신': '술', '임': '유', '계': '신',
};

// ============================================
// 흉신(凶神) 계산
// ============================================

/**
 * 도화살(桃花殺) - 이성 인기, 바람기
 * 년지/일지 기준
 */
const DOHWA_SAL: Record<string, string> = {
  '인': '묘', '오': '묘', '술': '묘',  // 인오술 → 묘
  '신': '유', '자': '유', '진': '유',  // 신자진 → 유
  '사': '오', '유': '오', '축': '오',  // 사유축 → 오
  '해': '자', '묘': '자', '미': '자',  // 해묘미 → 자
};

/**
 * 역마살(驛馬殺) - 이동수, 변동
 * 년지/일지 기준
 */
const YEOKMA_SAL: Record<string, string> = {
  '인': '신', '오': '신', '술': '신',  // 인오술 → 신
  '신': '인', '자': '인', '진': '인',  // 신자진 → 인
  '사': '해', '유': '해', '축': '해',  // 사유축 → 해
  '해': '사', '묘': '사', '미': '사',  // 해묘미 → 사
};

/**
 * 화개살(華蓋殺) - 예술성, 고독, 종교
 * 년지/일지 기준
 */
const HWAGAE_SAL: Record<string, string> = {
  '인': '술', '오': '술', '술': '술',  // 인오술 → 술
  '신': '진', '자': '진', '진': '진',  // 신자진 → 진
  '사': '축', '유': '축', '축': '축',  // 사유축 → 축
  '해': '미', '묘': '미', '미': '미',  // 해묘미 → 미
};

/**
 * 백호대살(白虎大殺) - 혈광지화, 사고
 * 월지 기준
 */
const BAEKHO_DAESAL: Record<string, string> = {
  '자': '신', '축': '유', '인': '술', '묘': '해',
  '진': '자', '사': '축', '오': '인', '미': '묘',
  '신': '진', '유': '사', '술': '오', '해': '미',
};

/**
 * 귀문관살(鬼門關殺) - 정신적 고통, 불안
 * 일지 기준으로 년지/월지/시지 확인
 */
const GWIMUN_GWANSAL: Record<string, string[]> = {
  '자': ['유'], '축': ['오'], '인': ['사', '미'], '묘': ['진', '사'],
  '진': ['묘', '인'], '사': ['인', '묘'], '오': ['축', '해'],
  '미': ['자', '인'], '신': ['해'], '유': ['술', '자'],
  '술': ['유', '미'], '해': ['오', '신'],
};

/**
 * 양인살(羊刃殺) - 강한 기운, 다툼, 칼날
 * 일간 기준
 */
const YANGIN_SAL: Record<string, string> = {
  '갑': '묘', '을': '진', '병': '오', '정': '미', '무': '오',
  '기': '미', '경': '유', '신': '술', '임': '자', '계': '축',
};

/**
 * 공망(空亡) - 허무, 노력 무효
 * 년주/일주의 60갑자 기준
 */
function calculateGongmang(stem: string, branch: string): string[] {
  const stemIdx = STEM_INDEX[stem];
  const branchIdx = BRANCH_INDEX[branch];

  // 갑자순에서 공망 계산
  const gapjaStartBranch = (branchIdx - stemIdx + 12) % 12;
  const gongmang1 = (gapjaStartBranch + 10) % 12;
  const gongmang2 = (gapjaStartBranch + 11) % 12;

  const branches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
  return [branches[gongmang1], branches[gongmang2]];
}

/**
 * 원진살(怨嗔殺) - 원한 관계, 미움
 * 년지/일지 기준
 */
const WONJIN_SAL: Record<string, string> = {
  '자': '미', '축': '오', '인': '사', '묘': '진',
  '진': '묘', '사': '인', '오': '축', '미': '자',
  '신': '해', '유': '술', '술': '유', '해': '신',
};

/**
 * 괴강살(魁罡殺) - 강한 성격, 고집
 * 일주 기준 (경진, 임진, 경술, 임술)
 */
const GOEGANG_SAL = ['경진', '임진', '경술', '임술'];

// ============================================
// 신살 분석 결과 타입
// ============================================

export interface Sinsal {
  name: string;           // 신살 이름
  hanja: string;          // 한자
  type: 'good' | 'bad';   // 길신/흉신
  found: boolean;         // 사주에 있는지
  location: string[];     // 어디에 있는지 (년주, 월주, 일주, 시주)
  description: string;    // 설명
  effect: string;         // 영향
  advice: string;         // 조언
}

export interface SinsalAnalysis {
  goodSinsals: Sinsal[];   // 길신 목록
  badSinsals: Sinsal[];    // 흉신 목록
  summary: string;         // 종합 분석
  simpleInterpretation: string; // 쉬운 해석
}

// ============================================
// 신살 계산 함수
// ============================================

export function calculateSinsals(sajuResult: any): SinsalAnalysis {
  const { pillars, dayMaster } = sajuResult;

  const yearStem = pillars.year.stem;
  const yearBranch = pillars.year.branch;
  const monthStem = pillars.month.stem;
  const monthBranch = pillars.month.branch;
  const dayStem = pillars.day.stem;
  const dayBranch = pillars.day.branch;
  const hourStem = pillars.hour.stem;
  const hourBranch = pillars.hour.branch;

  const allBranches = [yearBranch, monthBranch, dayBranch, hourBranch];
  const branchLocations = ['년지', '월지', '일지', '시지'];

  const goodSinsals: Sinsal[] = [];
  const badSinsals: Sinsal[] = [];

  // ============================================
  // 길신 계산
  // ============================================

  // 1. 천을귀인
  const cheonulTargets = CHEONUL_GUIIN[dayMaster] || [];
  const cheonulLocations: string[] = [];
  allBranches.forEach((branch, idx) => {
    if (cheonulTargets.includes(branch)) {
      cheonulLocations.push(branchLocations[idx]);
    }
  });
  goodSinsals.push({
    name: '천을귀인',
    hanja: '天乙貴人',
    type: 'good',
    found: cheonulLocations.length > 0,
    location: cheonulLocations,
    description: '하늘이 내린 귀인의 도움을 받는 신살입니다.',
    effect: '위기 상황에서 귀인의 도움을 받고, 어려운 일이 잘 풀립니다.',
    advice: '사람을 소중히 여기고 인연을 잘 관리하세요.',
  });

  // 2. 천덕귀인
  const cheondukTarget = CHEONDUK_GUIIN[monthBranch];
  const cheondukLocations: string[] = [];
  [yearStem, monthStem, dayStem, hourStem].forEach((stem, idx) => {
    if (stem === cheondukTarget) {
      cheondukLocations.push(['년간', '월간', '일간', '시간'][idx]);
    }
  });
  goodSinsals.push({
    name: '천덕귀인',
    hanja: '天德貴人',
    type: 'good',
    found: cheondukLocations.length > 0,
    location: cheondukLocations,
    description: '하늘의 덕으로 재난을 피하는 신살입니다.',
    effect: '큰 재난이나 위험에서 벗어나는 힘이 있습니다.',
    advice: '덕을 쌓으면 더 큰 복을 받습니다.',
  });

  // 3. 월덕귀인
  const woldukTarget = WOLDUK_GUIIN[monthBranch];
  const woldukLocations: string[] = [];
  [yearStem, monthStem, dayStem, hourStem].forEach((stem, idx) => {
    if (stem === woldukTarget) {
      woldukLocations.push(['년간', '월간', '일간', '시간'][idx]);
    }
  });
  goodSinsals.push({
    name: '월덕귀인',
    hanja: '月德貴人',
    type: 'good',
    found: woldukLocations.length > 0,
    location: woldukLocations,
    description: '달의 덕으로 질병이 회복되는 신살입니다.',
    effect: '건강 회복력이 좋고, 병이 빨리 낫습니다.',
    advice: '건강 관리에 조금만 신경 쓰면 큰 효과를 봅니다.',
  });

  // 4. 문창귀인
  const munchangTarget = MUNCHANG_GUIIN[dayMaster];
  const munchangLocations: string[] = [];
  allBranches.forEach((branch, idx) => {
    if (branch === munchangTarget) {
      munchangLocations.push(branchLocations[idx]);
    }
  });
  goodSinsals.push({
    name: '문창귀인',
    hanja: '文昌貴人',
    type: 'good',
    found: munchangLocations.length > 0,
    location: munchangLocations,
    description: '학문과 문서에 재능이 있는 신살입니다.',
    effect: '시험운이 좋고, 공부나 자격증 취득에 유리합니다.',
    advice: '배움을 게을리 하지 마세요. 평생 학습이 행운을 가져옵니다.',
  });

  // 5. 학당귀인
  const hakdangTarget = HAKDANG_GUIIN[dayMaster];
  const hakdangLocations: string[] = [];
  allBranches.forEach((branch, idx) => {
    if (branch === hakdangTarget) {
      hakdangLocations.push(branchLocations[idx]);
    }
  });
  goodSinsals.push({
    name: '학당귀인',
    hanja: '學堂貴人',
    type: 'good',
    found: hakdangLocations.length > 0,
    location: hakdangLocations,
    description: '배움의 복이 있는 신살입니다.',
    effect: '교육 관련 직업에 적합하고, 배움이 빨라집니다.',
    advice: '가르치는 일을 하면 더욱 발전합니다.',
  });

  // 6. 금여록
  const geumyeoTarget = GEUMYEO_LOK[dayMaster];
  const geumyeoLocations: string[] = [];
  allBranches.forEach((branch, idx) => {
    if (branch === geumyeoTarget) {
      geumyeoLocations.push(branchLocations[idx]);
    }
  });
  goodSinsals.push({
    name: '금여록',
    hanja: '金輿祿',
    type: 'good',
    found: geumyeoLocations.length > 0,
    location: geumyeoLocations,
    description: '배우자 복과 부귀를 가져오는 신살입니다.',
    effect: '좋은 배우자를 만나고, 결혼 후 부유해집니다.',
    advice: '결혼 후에 더 좋은 일이 생깁니다.',
  });

  // 7. 천관귀인
  const cheongwanTarget = CHEONGWAN_GUIIN[dayMaster];
  const cheongwanLocations: string[] = [];
  allBranches.forEach((branch, idx) => {
    if (branch === cheongwanTarget) {
      cheongwanLocations.push(branchLocations[idx]);
    }
  });
  goodSinsals.push({
    name: '천관귀인',
    hanja: '天官貴人',
    type: 'good',
    found: cheongwanLocations.length > 0,
    location: cheongwanLocations,
    description: '관운과 승진운이 있는 신살입니다.',
    effect: '직장에서 인정받고, 승진이 빠릅니다.',
    advice: '조직 생활에서 좋은 성과를 낼 수 있습니다.',
  });

  // ============================================
  // 흉신 계산
  // ============================================

  // 1. 도화살
  const dohwaBase = yearBranch; // 년지 기준
  const dohwaTarget = DOHWA_SAL[dohwaBase];
  const dohwaLocations: string[] = [];
  allBranches.forEach((branch, idx) => {
    if (branch === dohwaTarget) {
      dohwaLocations.push(branchLocations[idx]);
    }
  });
  badSinsals.push({
    name: '도화살',
    hanja: '桃花殺',
    type: 'bad',
    found: dohwaLocations.length > 0,
    location: dohwaLocations,
    description: '이성에게 인기가 많은 신살입니다.',
    effect: '매력이 넘치고 이성 인기가 많습니다. 다만 바람기로 이어질 수 있습니다.',
    advice: '이성 관계에서 절제가 필요합니다. 한 사람에게 집중하세요.',
  });

  // 2. 역마살
  const yeokmaBase = yearBranch;
  const yeokmaTarget = YEOKMA_SAL[yeokmaBase];
  const yeokmaLocations: string[] = [];
  allBranches.forEach((branch, idx) => {
    if (branch === yeokmaTarget) {
      yeokmaLocations.push(branchLocations[idx]);
    }
  });
  badSinsals.push({
    name: '역마살',
    hanja: '驛馬殺',
    type: 'bad',
    found: yeokmaLocations.length > 0,
    location: yeokmaLocations,
    description: '이동과 변동이 많은 신살입니다.',
    effect: '한 곳에 정착하기 어렵고, 이동이나 변화가 많습니다.',
    advice: '움직이는 직업(영업, 무역, 여행)이 적합합니다.',
  });

  // 3. 화개살
  const hwagaeBase = yearBranch;
  const hwagaeTarget = HWAGAE_SAL[hwagaeBase];
  const hwagaeLocations: string[] = [];
  allBranches.forEach((branch, idx) => {
    if (branch === hwagaeTarget) {
      hwagaeLocations.push(branchLocations[idx]);
    }
  });
  badSinsals.push({
    name: '화개살',
    hanja: '華蓋殺',
    type: 'bad',
    found: hwagaeLocations.length > 0,
    location: hwagaeLocations,
    description: '예술성과 종교성이 있는 신살입니다.',
    effect: '예술적 재능이 뛰어나지만, 고독하고 외로울 수 있습니다.',
    advice: '예술, 종교, 철학 분야에서 성공할 수 있습니다.',
  });

  // 4. 백호대살
  const baekhoTarget = BAEKHO_DAESAL[monthBranch];
  const baekhoLocations: string[] = [];
  allBranches.forEach((branch, idx) => {
    if (branch === baekhoTarget) {
      baekhoLocations.push(branchLocations[idx]);
    }
  });
  badSinsals.push({
    name: '백호대살',
    hanja: '白虎大殺',
    type: 'bad',
    found: baekhoLocations.length > 0,
    location: baekhoLocations,
    description: '혈광지화를 조심해야 하는 신살입니다.',
    effect: '사고나 수술 등 피를 볼 일이 생길 수 있습니다.',
    advice: '위험한 행동을 피하고 안전에 주의하세요.',
  });

  // 5. 귀문관살
  const gwimunTargets = GWIMUN_GWANSAL[dayBranch] || [];
  const gwimunLocations: string[] = [];
  allBranches.forEach((branch, idx) => {
    if (idx !== 2 && gwimunTargets.includes(branch)) { // 일지 제외
      gwimunLocations.push(branchLocations[idx]);
    }
  });
  badSinsals.push({
    name: '귀문관살',
    hanja: '鬼門關殺',
    type: 'bad',
    found: gwimunLocations.length > 0,
    location: gwimunLocations,
    description: '정신적 고통과 불안이 있는 신살입니다.',
    effect: '우울함, 불안, 악몽 등 정신적 어려움이 있을 수 있습니다.',
    advice: '명상, 운동 등으로 마음의 안정을 찾으세요.',
  });

  // 6. 양인살
  const yanginTarget = YANGIN_SAL[dayMaster];
  const yanginLocations: string[] = [];
  allBranches.forEach((branch, idx) => {
    if (branch === yanginTarget) {
      yanginLocations.push(branchLocations[idx]);
    }
  });
  badSinsals.push({
    name: '양인살',
    hanja: '羊刃殺',
    type: 'bad',
    found: yanginLocations.length > 0,
    location: yanginLocations,
    description: '강한 기운으로 다툼이 생길 수 있는 신살입니다.',
    effect: '성격이 강하고 고집이 세며, 다툼에 휘말릴 수 있습니다.',
    advice: '강한 에너지를 운동이나 일에 쏟으세요.',
  });

  // 7. 공망
  const yearGongmang = calculateGongmang(yearStem, yearBranch);
  const dayGongmang = calculateGongmang(dayStem, dayBranch);
  const gongmangLocations: string[] = [];
  allBranches.forEach((branch, idx) => {
    if (yearGongmang.includes(branch) || dayGongmang.includes(branch)) {
      gongmangLocations.push(branchLocations[idx]);
    }
  });
  badSinsals.push({
    name: '공망',
    hanja: '空亡',
    type: 'bad',
    found: gongmangLocations.length > 0,
    location: gongmangLocations,
    description: '노력이 허무하게 될 수 있는 신살입니다.',
    effect: '해당 위치의 일이 허사가 되거나 공허함을 느낄 수 있습니다.',
    advice: '과정을 즐기고, 결과에 집착하지 마세요.',
  });

  // 8. 원진살
  const wonjinBase = yearBranch;
  const wonjinTarget = WONJIN_SAL[wonjinBase];
  const wonjinLocations: string[] = [];
  allBranches.forEach((branch, idx) => {
    if (branch === wonjinTarget) {
      wonjinLocations.push(branchLocations[idx]);
    }
  });
  badSinsals.push({
    name: '원진살',
    hanja: '怨嗔殺',
    type: 'bad',
    found: wonjinLocations.length > 0,
    location: wonjinLocations,
    description: '원한 관계가 생길 수 있는 신살입니다.',
    effect: '특정 띠의 사람과 갈등이 생기기 쉽습니다.',
    advice: '감정을 다스리고, 용서하는 마음을 가지세요.',
  });

  // 9. 괴강살
  const ilju = `${dayStem}${dayBranch}`;
  const goegangFound = GOEGANG_SAL.includes(ilju);
  badSinsals.push({
    name: '괴강살',
    hanja: '魁罡殺',
    type: 'bad',
    found: goegangFound,
    location: goegangFound ? ['일주'] : [],
    description: '강한 성격과 고집이 있는 신살입니다.',
    effect: '매우 강한 성격으로 리더십이 있지만, 융통성이 부족합니다.',
    advice: '강한 기운을 잘 활용하면 큰 성공을 거둘 수 있습니다.',
  });

  // ============================================
  // 종합 분석
  // ============================================

  const foundGood = goodSinsals.filter(s => s.found);
  const foundBad = badSinsals.filter(s => s.found);

  let summary = '';
  if (foundGood.length >= 3 && foundBad.length <= 2) {
    summary = '길신이 많고 흉신이 적어 전반적으로 좋은 사주입니다. 귀인의 도움을 많이 받을 수 있습니다.';
  } else if (foundBad.length >= 3 && foundGood.length <= 2) {
    summary = '흉신이 많지만, 이는 경계해야 할 부분을 알려주는 것입니다. 주의하면 오히려 전화위복이 됩니다.';
  } else {
    summary = '길신과 흉신이 적절히 섞여 균형 잡힌 사주입니다. 장점을 살리고 단점을 보완하세요.';
  }

  // 쉬운 해석
  let simpleInterpretation = '';

  if (foundGood.some(s => s.name === '천을귀인')) {
    simpleInterpretation += '어려울 때 도와주는 사람이 꼭 나타나요. ';
  }
  if (foundGood.some(s => s.name === '문창귀인')) {
    simpleInterpretation += '공부나 시험에 재능이 있어요. ';
  }
  if (foundGood.some(s => s.name === '금여록')) {
    simpleInterpretation += '좋은 배우자를 만날 운이에요. ';
  }
  if (foundBad.some(s => s.name === '도화살')) {
    simpleInterpretation += '이성에게 인기가 많지만 감정 조절이 필요해요. ';
  }
  if (foundBad.some(s => s.name === '역마살')) {
    simpleInterpretation += '한 곳에 머무르기보다 움직이는 게 좋아요. ';
  }
  if (foundBad.some(s => s.name === '화개살')) {
    simpleInterpretation += '예술적 재능이 있지만 가끔 외로움을 느껴요. ';
  }

  if (!simpleInterpretation) {
    simpleInterpretation = '특별히 강한 신살은 없어 안정적인 사주예요.';
  }

  return {
    goodSinsals,
    badSinsals,
    summary,
    simpleInterpretation: simpleInterpretation.trim(),
  };
}

// 신살 이모지
export function getSinsalEmoji(sinsal: Sinsal): string {
  const emojiMap: Record<string, string> = {
    '천을귀인': '🌟',
    '천덕귀인': '✨',
    '월덕귀인': '🌙',
    '문창귀인': '📚',
    '학당귀인': '🎓',
    '금여록': '💍',
    '천관귀인': '👔',
    '도화살': '🌸',
    '역마살': '🐎',
    '화개살': '🎨',
    '백호대살': '🐯',
    '귀문관살': '👻',
    '양인살': '⚔️',
    '공망': '🕳️',
    '원진살': '💢',
    '괴강살': '💪',
  };
  return emojiMap[sinsal.name] || '⭐';
}
