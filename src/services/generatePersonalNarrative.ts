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
interface AINarrativesV1 {
  overall: Record<string, string>;
  categories: Record<string, string>;
}

// Council 합의 (2026-04-18): 가짜 bucket 7배 폐기
// 검증 결과 bucket 0~6 본문 자카드 유사도 0.95 = prefix만 다른 동일 본문
// 새 구조: 단락 셔플 (4슬롯 × 평균 12변형 = 그룹당 18,262가지 진짜 다양성)
interface AINarrativesSlots {
  overall_slots: Record<string, {
    slot0: string[];  // 도입
    slot1: string[];  // 핵심
    slot2: string[];  // 조언
    slot3: string[];  // 마무리
  }>;
  categories: Record<string, string>;
  meta?: { version: string; overall_groups: number };
}

let AI_SLOTS: AINarrativesSlots | null = null;
let AI_NARRATIVES: AINarrativesV1 | null = null;  // 폴백용
let AI_VERSION: 'slots_v1' | 'v1plus' | 'v1' = 'v1';

// 우선순위: slots_v1 (단락 셔플) > v1plus (가짜 bucket) > v1 (원본)
try {
  AI_SLOTS = require('../data/generated/narratives_slots_v1.json');
  AI_VERSION = 'slots_v1';
} catch (e) {
  try {
    AI_NARRATIVES = require('../data/generated/narratives_generated_v1plus.json');
    AI_VERSION = 'v1plus';
  } catch (e2) {
    try {
      AI_NARRATIVES = require('../data/generated/narratives_generated.json');
      AI_VERSION = 'v1';
    } catch (e3) {
      console.warn('AI narratives JSON 로드 실패, 템플릿 폴백 사용:', e3);
    }
  }
}

// Council 합의 (2026-04-18): ILJU_INTROS 폐기
// 원인: 60갑자 × 5변형 = 300개 도입부에 명리학 용어 + 모욕어 동음("병신 일주") 노출
// 검증: "병신(丙申)" 등 264건 노출 → 출시 즉시 1점 리뷰 폭탄 위험
// slot0(단락 셔플 도입부)가 이미 도입부 역할 충분, 이중 도입 불필요

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
  myIlju?: string;                // Phase 2: 일주 60갑자 (예: '갑자') — 도입부 표시용
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

/**
 * MurmurHash3 fmix32 finalizer (로컬 사본 — useTodayFortune의 export와 동일)
 * 약한 입력(연속 dateHash)을 비선형 avalanche로 분산 → mod N 충돌 제거
 * Council 9번째 합의 (수학자 Engineer 1순위)
 */
function fmix32Local(h: number): number {
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

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
  // Council 합의 (2026-04-18): 가짜 bucket 7배 폐기 + 단락 셔플로 진짜 다양성
  // 검증: bucket 0~6 본문 유사도 0.95 = prefix만 다른 동일 본문이었음
  // 신 구조: 같은 (십신, 용신) 그룹의 12운성 슬롯 풀에서 4슬롯 독립 선택
  // → 그룹당 12^4 = 20,736가지 조합 (사용자 핵심 우려 "1달 같은 톤 1번" 충족)
  const yKey2 = yKey === 'yongsin' ? 'yongsin' : yKey === 'gishin' ? 'gishin' : 'neutral';
  const baseKey = `${tenGod}_${yKey2}_${twelveStage}`;  // 폴백용 (slots 없을 때)
  const groupKey = `${tenGod}_${yKey2}`;  // 슬롯 그룹 키

  let aiOverall: string | undefined;
  if (AI_SLOTS?.overall_slots?.[groupKey]) {
    // 단락 셔플 (신 방식)
    const pools = AI_SLOTS.overall_slots[groupKey];
    const slot0Hash = fmix32Local(dateHash ^ 0x12345678);
    const slot1Hash = fmix32Local(dateHash ^ 0x87654321);
    const slot2Hash = fmix32Local(dateHash ^ 0xabcdef01);
    const slot3Hash = fmix32Local(dateHash ^ 0xfedcba98);
    const s0 = pools.slot0[slot0Hash % pools.slot0.length] || '';
    const s1 = pools.slot1[slot1Hash % pools.slot1.length] || '';
    const s2 = pools.slot2[slot2Hash % pools.slot2.length] || '';
    const s3 = pools.slot3[slot3Hash % pools.slot3.length] || '';
    aiOverall = [s0, s1, s2, s3].filter(Boolean).join(' ');
  } else if (AI_NARRATIVES?.overall) {
    // 폴백: 기존 v1plus 데이터
    aiOverall = AI_NARRATIVES.overall[baseKey];
  }

  let overall: string;
  if (aiOverall && aiOverall.length > 50) {
    // AI 통문장 사용 + 지지 관계 문구 추가
    overall = branchNote ? `${aiOverall}\n\n${branchNote}` : aiOverall;
  } else {
    // 폴백: 기존 파트별 조합
    const overallParts = [part1, part2, part3, strengthCtx, branchNote].filter(Boolean);
    overall = overallParts.join('\n\n');
  }

  // Phase 2 + Council 핫픽스: 일주 도입부 prepend (5변형 + 시작 prefix 7종)
  // 사용자 신고: "잠시 돌아보면, 이 며칠씩 이어 나와"
  // 원인: dateHash >>> 7 % 5 → 인접 날짜 hash 거의 동일 → 12일 연속 같은 prefix
  // 해결: 매일 60갑자 중 하나로 바뀌는 todayBranch (12지지) + todayElement 조합 사용
  //       12지지 직접 인덱스 → 매일 확실히 변경 (12일 주기)
  // Council 합의 (2026-04-18 사용자 신고: "병화 신금, 병신 일주 등 같은 멘트 중복"):
  // 데이터 검증 결과: ilju_intros.json에 "병신 일주" 등 명리학 용어 + 한국어 모욕어 동음
  //   "병신(丙申)" — 일반 사용자에겐 욕설로 인식 → 출시 즉시 1점 리뷰 폭탄 위험
  //   명리학 용어 264건 노출 (병화 11, 신금 19, 일주 121 등)
  // Council 5명 일치 결론: 일주 도입부 완전 폐기 (slot0가 이미 도입부 역할 충분)
  // → "병신/임신/병화/신금" 노출 위험 즉시 0, JSON 0.45MB → 더 작아짐
  // 향후 출시 후 자연 비유 기반 재작성 검토 (Designer 가이드라인 기록됨)
  // ILJU_INTROS는 더 이상 사용 안 함 (require는 유지, 데이터는 무시)

  // Council A안: 희신/구신 명리학 용어 표시 제거 (사용자 인지부담)
  // 일반 사용자는 "희신/구신" 의미 모름. 노출하면 "오늘의 고민" 위젯 함정 반복

  // === 파트4: 카테고리별 풀이 ===
  const catKey = `${tenGod}_${yKey}`;
  // Council 합의: 카테고리는 가짜 bucket 1~6 폐기 후 원본 키만 사용 (짧은 본문이라 셔플 위험)
  const wealthKey = `wealth_${tenGod}_${yKey2}`;
  const loveKey = `love_${tenGod}_${yKey2}`;
  const workKey = `work_${tenGod}_${yKey2}`;
  const healthKey = `health_${tenGod}_${yKey2}`;
  // slots_v1 우선, v1plus 폴백
  const categoriesData = AI_SLOTS?.categories ?? AI_NARRATIVES?.categories;
  const aiWealth = categoriesData?.[wealthKey];
  const aiLove = categoriesData?.[loveKey];
  const aiWork = categoriesData?.[workKey];
  const aiHealth = categoriesData?.[healthKey];

  // Council A안: 12운성 카테고리 보정 제거 (결정박스 함정 회피)
  // 사용자 일주는 고정이라 같은 운성 시기에 매일 같은 한 줄 = 결정박스 시즌2 위험
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
