/**
 * 개인 맞춤 서술형 운세 풀이 생성 엔진
 * 사용자의 사주 변수를 텍스트에 직접 녹여넣어
 * 같은 날이라도 사람마다 완전히 다른 풀이를 생성한다.
 */

import { Element } from '../types';
import {
  ELEMENT_DISPLAY,
  INTERACTION_METAPHORS,
  TWELVE_STAGE_INTROS,
  TWELVE_STAGE_TABLE,
  TENGOD_NARRATIVES,
  CATEGORY_NARRATIVES,
  TIME_TIPS,
  DAESAE_BACKDROP,
} from '../data/fortuneNarratives';
import {
  ELEMENT_DISPLAY_SHAMAN,
  INTERACTION_METAPHORS_SHAMAN,
  TWELVE_STAGE_INTROS_SHAMAN,
  TENGOD_NARRATIVES_SHAMAN,
  CATEGORY_NARRATIVES_SHAMAN,
  TIME_TIPS_SHAMAN,
  DAESAE_BACKDROP_SHAMAN,
} from '../data/fortuneNarratives_shaman';

// ===== 스타일 타입 =====
export type NarrativeStyle = 'formal' | 'shaman';

// 스타일별 데이터 세트
function getStyleData(style: NarrativeStyle) {
  if (style === 'shaman') {
    return {
      elementDisplay: ELEMENT_DISPLAY_SHAMAN,
      interactions: INTERACTION_METAPHORS_SHAMAN,
      stageIntros: TWELVE_STAGE_INTROS_SHAMAN,
      tenGodNarratives: TENGOD_NARRATIVES_SHAMAN,
      categoryNarratives: CATEGORY_NARRATIVES_SHAMAN,
      timeTips: TIME_TIPS_SHAMAN,
      backdrop: DAESAE_BACKDROP_SHAMAN,
    };
  }
  return {
    elementDisplay: ELEMENT_DISPLAY,
    interactions: INTERACTION_METAPHORS,
    stageIntros: TWELVE_STAGE_INTROS,
    tenGodNarratives: TENGOD_NARRATIVES,
    categoryNarratives: CATEGORY_NARRATIVES,
    timeTips: TIME_TIPS,
    backdrop: DAESAE_BACKDROP,
  };
}

// ===== AI 생성 통문장 데이터 =====
let AI_NARRATIVES: { overall: Record<string, string>; categories: Record<string, string> } | null = null;
try {
  AI_NARRATIVES = require('../data/generated/narratives_generated.json');
} catch (e) {
  console.warn('AI narratives JSON 로드 실패, 템플릿 폴백 사용:', e);
}

// ===== 타입 정의 =====

export interface NarrativeParams {
  myElement: Element;             // 일간 오행
  myStem: string;                 // 일간 천간 (갑~계)
  todayElement: Element;          // 오늘 천간 오행
  todayBranch: string;            // 오늘 지지
  tenGod: string;                 // 십신
  strength: string;               // 'strong'|'weak'|'extreme-strong'|'extreme-weak'|'neutral'
  yongsinType: string;            // 'yongsin'|'heeshin'|'gushin'|'gishin'|'neutral'
  branchType: string;             // '조화'|'충돌'|'마찰'|''
  daeSaeContext?: string;         // 'favorable'|'neutral'|'challenging' 등
  dateHash: number;               // 날짜+사주 해시
  style?: NarrativeStyle;         // 'formal'(기본) | 'shaman'(점쟁이)
}

export interface NarrativeResult {
  overall: string;   // 종합 풀이 (400~600자)
  wealth: string;    // 재물운 (80~120자)
  love: string;      // 연애운
  work: string;      // 직장운
  health: string;    // 건강운
  timeTip: string;   // 시간대 팁
  daeSaeNote: string; // 대운/세운 1줄
  stageName: string;  // 12운성 쉬운 이름
}

// ===== 헬퍼 함수 =====

/** 해시 기반 배열 선택 */
function pick(arr: string[], hash: number, salt: number = 0): string {
  if (!arr || arr.length === 0) return '';
  return arr[((hash + salt) & 0x7FFFFFFF) % arr.length];
}

/** 12운성 조회 */
export function getTwelveStage(stem: string, branch: string): string {
  const table = TWELVE_STAGE_TABLE[stem];
  if (!table) return '관대'; // 기본값
  return table[branch] || '관대';
}

/** 플레이스홀더 치환 */
function resolve(template: string, ctx: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => ctx[key] || '');
}

/** 오행 상호작용 키 생성 */
function getInteractionKey(my: Element, today: Element): string {
  return `${my}_${today}`;
}

/** 신강/신약 쉬운 표현 */
function getStrengthDesc(strength: string): string {
  if (strength === 'extreme-strong' || strength === 'strong') return '기운이 강한 편';
  if (strength === 'extreme-weak' || strength === 'weak') return '기운이 약한 편';
  return '기운이 균형 잡힌 편';
}

/** 신강/신약에 따른 부가 설명 */
function getStrengthContext(strength: string, yongsinType: string, myName: string): string {
  if (yongsinType === 'yongsin') {
    if (strength === 'weak' || strength === 'extreme-weak') {
      return `당신은 ${myName}의 기운이 약한 편이라, 이런 보충의 날이 특히 소중해요. 오늘 들어오는 에너지를 충분히 흡수하세요.`;
    }
    if (strength === 'strong' || strength === 'extreme-strong') {
      return `당신은 ${myName}의 기운이 강한 편인데, 오늘 들어오는 에너지가 그 힘을 적절히 조율해줘요.`;
    }
  }
  if (yongsinType === 'gishin') {
    if (strength === 'weak' || strength === 'extreme-weak') {
      return `당신은 ${myName}의 기운이 약한 편이라, 오늘의 부담이 더 크게 느껴질 수 있어요. 무리하지 말고 에너지를 아끼세요.`;
    }
    if (strength === 'strong' || strength === 'extreme-strong') {
      return `다행히 당신은 ${myName}의 기운이 강한 편이라, 오늘의 어려움도 충분히 이겨낼 힘이 있어요.`;
    }
  }
  return '';
}

// ===== 메인 생성 함수 =====

export function generatePersonalNarrative(params: NarrativeParams): NarrativeResult {
  const {
    myElement, myStem, todayElement, todayBranch,
    tenGod, strength, yongsinType, branchType,
    daeSaeContext = 'neutral', dateHash,
    style = 'shaman',
  } = params;

  // 스타일에 따라 데이터 세트 선택
  const data = getStyleData(style);

  const myDisplay = data.elementDisplay[myElement] || data.elementDisplay.wood;
  const todayDisplay = data.elementDisplay[todayElement] || data.elementDisplay.earth;
  const myName = myDisplay.name;
  const todayName = todayDisplay.name;

  // 12운성 계산 (조견표는 공통)
  const twelveStage = getTwelveStage(myStem, todayBranch);
  const stageData = data.stageIntros[twelveStage] || data.stageIntros['관대'];

  // 컨텍스트 바인딩 맵
  const ctx: Record<string, string> = {
    myName,
    todayName,
    noun: pick(myDisplay.nouns, dateHash, 1),
    verb: pick(myDisplay.verbs, dateHash, 2),
    state: pick(myDisplay.states, dateHash, 3),
    todayNoun: pick(todayDisplay.nouns, dateHash, 4),
    stageName: stageData.easyName,
    strengthDesc: getStrengthDesc(strength),
  };

  // === 파트1: 12운성 도입부 ===
  const part1 = resolve(pick(stageData.templates, dateHash, 10), ctx);

  // === 파트2: 오행 상호작용 ===
  const interactionKey = getInteractionKey(myElement, todayElement);
  const interactions = data.interactions[interactionKey] || data.interactions[`${myElement}_${myElement}`] || [];
  const part2 = interactions.length > 0 ? resolve(pick(interactions, dateHash, 20), ctx) : '';

  // === 파트3: 십신 + 용신 서술 ===
  const yKey = yongsinType === 'heeshin' ? 'yongsin' : yongsinType === 'gushin' ? 'gishin' : yongsinType;
  const tenGodData = data.tenGodNarratives[tenGod];
  const tenGodTemplates = tenGodData?.[yKey] || tenGodData?.['neutral'] || [''];
  const part3 = resolve(pick(tenGodTemplates, dateHash, 30), ctx);

  // === 신강/신약 맥락 ===
  const strengthCtx = getStrengthContext(strength, yongsinType, myName);

  // === 지지 관계 ===
  let branchNote = '';
  if (branchType === '조화') {
    branchNote = '게다가 오늘은 기운이 서로 잘 맞아서, 사람들과의 관계에서 좋은 일이 생기기 쉬운 날이에요.';
  } else if (branchType === '충돌') {
    branchNote = '다만 오늘은 기운이 정면으로 부딪히는 날이라, 주변과 마찰이 생길 수 있어요. 유연하게 대처하면 괜찮아요.';
  } else if (branchType === '마찰') {
    branchNote = '또한 갈등의 기운이 감돌고 있어요. 말조심하고 불필요한 논쟁은 피하세요.';
  }

  // === AI 생성 통문장 우선 사용 ===
  const yKey2 = yKey === 'yongsin' ? 'yongsin' : yKey === 'gishin' ? 'gishin' : 'neutral';
  const aiOverallKey = `${tenGod}_${yKey2}_${twelveStage}`;
  const aiOverall = AI_NARRATIVES?.overall?.[aiOverallKey];

  let overall: string;
  if (aiOverall && aiOverall.length > 50) {
    // AI 통문장 사용 + 지지 관계 문구 추가
    overall = branchNote ? `${aiOverall}\n\n${branchNote}` : aiOverall;
  } else {
    // 폴백: 기존 파트별 조합
    const overallParts = [part1, part2, part3, strengthCtx, branchNote].filter(Boolean);
    overall = overallParts.join('\n\n');
  }

  // === 파트4: 카테고리별 풀이 ===
  const catKey = `${tenGod}_${yKey}`;
  const aiWealth = AI_NARRATIVES?.categories?.[`wealth_${tenGod}_${yKey2}`];
  const aiLove = AI_NARRATIVES?.categories?.[`love_${tenGod}_${yKey2}`];
  const aiWork = AI_NARRATIVES?.categories?.[`work_${tenGod}_${yKey2}`];
  const aiHealth = AI_NARRATIVES?.categories?.[`health_${tenGod}_${yKey2}`];

  const wealth = (aiWealth && aiWealth.length > 20) ? aiWealth : resolveCategoryNarrative('wealth', catKey, twelveStage, ctx, dateHash, data.categoryNarratives);
  const love = (aiLove && aiLove.length > 20) ? aiLove : resolveCategoryNarrative('love', catKey, twelveStage, ctx, dateHash, data.categoryNarratives);
  const work = (aiWork && aiWork.length > 20) ? aiWork : resolveCategoryNarrative('work', catKey, twelveStage, ctx, dateHash, data.categoryNarratives);
  const health = (aiHealth && aiHealth.length > 20) ? aiHealth : resolveCategoryNarrative('health', catKey, twelveStage, ctx, dateHash, data.categoryNarratives);

  // === 파트5: 시간대 팁 ===
  const timeTipTemplates = data.timeTips[myElement] || data.timeTips.earth;
  const timeTip = resolve(pick(timeTipTemplates, dateHash, 50), ctx);

  // === 파트6: 대운/세운 바탕색 ===
  const backdropTemplates = data.backdrop[daeSaeContext] || data.backdrop['neutral'];
  const daeSaeNote = pick(backdropTemplates, dateHash, 60);

  return {
    overall,
    wealth,
    love,
    work,
    health,
    timeTip,
    daeSaeNote,
    stageName: stageData.easyName,
  };
}

/** 카테고리 풀이 조회 (십신_용신 → 12운성 → 기본 순서 폴백) */
function resolveCategoryNarrative(
  category: string,
  catKey: string,
  twelveStage: string,
  ctx: Record<string, string>,
  hash: number,
  narrativeData: Record<string, Record<string, string[]>> = CATEGORY_NARRATIVES,
): string {
  const catData = narrativeData[category];
  if (!catData) return '';

  // 1순위: 십신_용신타입 키
  const byTenGod = catData[catKey];
  if (byTenGod && byTenGod.length > 0) {
    return resolve(pick(byTenGod, hash, category.charCodeAt(0)), ctx);
  }

  // 2순위: 12운성 키 (건강운 등)
  const byStage = catData[twelveStage];
  if (byStage && byStage.length > 0) {
    return resolve(pick(byStage, hash, category.charCodeAt(0) + 10), ctx);
  }

  // 3순위: 기본
  const defaults = catData['default'];
  if (defaults && defaults.length > 0) {
    return resolve(pick(defaults, hash, category.charCodeAt(0) + 20), ctx);
  }

  return '';
}
