/**
 * 사주 앱 공용 상수 정의
 * 중복 정의를 방지하기 위해 모든 서비스에서 이 파일을 임포트하여 사용
 */

import { Element } from '../types';

// ============================================
// 오행(五行) 관계 정의
// ============================================

/** 오행 상생 관계 (서로 돕는 관계) */
export const ELEMENT_GENERATES: Record<Element, Element> = {
  wood: 'fire',   // 목생화
  fire: 'earth',  // 화생토
  earth: 'metal', // 토생금
  metal: 'water', // 금생수
  water: 'wood',  // 수생목
} as const;

/** 오행 상극 관계 (서로 억제하는 관계) */
export const ELEMENT_CONTROLS: Record<Element, Element> = {
  wood: 'earth',  // 목극토
  earth: 'water', // 토극수
  water: 'fire',  // 수극화
  fire: 'metal',  // 화극금
  metal: 'wood',  // 금극목
} as const;

/** 오행 상생상극 통합 (FortuneGenerator 호환) */
export const ELEMENT_RELATIONS = {
  generates: ELEMENT_GENERATES,
  controls: ELEMENT_CONTROLS,
} as const;

// ============================================
// 지지(地支) 관계 정의
// ============================================

/** 육합 관계 (최상의 지지 궁합) */
export const SIX_HARMONIES: Record<string, string> = {
  '자': '축', '축': '자',
  '인': '해', '해': '인',
  '묘': '술', '술': '묘',
  '진': '유', '유': '진',
  '사': '신', '신': '사',
  '오': '미', '미': '오',
} as const;

/** 삼합 관계 (좋은 지지 궁합) */
export const THREE_HARMONIES: Record<string, string[]> = {
  '자': ['진', '신'], // 수국
  '축': ['사', '유'], // 금국
  '인': ['오', '술'], // 화국
  '묘': ['미', '해'], // 목국
  '진': ['자', '신'],
  '사': ['축', '유'],
  '오': ['인', '술'],
  '미': ['묘', '해'],
  '신': ['자', '진'],
  '유': ['축', '사'],
  '술': ['인', '오'],
  '해': ['묘', '미'],
} as const;

/** 육충 관계 (나쁜 지지 궁합) */
export const SIX_CLASHES: Record<string, string> = {
  '자': '오', '오': '자',
  '축': '미', '미': '축',
  '인': '신', '신': '인',
  '묘': '유', '유': '묘',
  '진': '술', '술': '진',
  '사': '해', '해': '사',
} as const;

/** 육해 관계 (해로운 지지 궁합) */
export const SIX_HARMS: Record<string, string> = {
  '자': '미', '미': '자',
  '축': '오', '오': '축',
  '인': '사', '사': '인',
  '묘': '진', '진': '묘',
  '신': '해', '해': '신',
  '유': '술', '술': '유',
} as const;

/** 원진 관계 (서로 미워하는 관계) */
export const YUAN_JIN: Record<string, string> = {
  '자': '미', '미': '자',
  '축': '오', '오': '축',
  '인': '유', '유': '인',
  '묘': '신', '신': '묘',
  '진': '해', '해': '진',
  '사': '술', '술': '사',
} as const;

/** 방합 관계 (같은 방향 지지) */
export const DIRECTION_GROUPS: Record<string, string[]> = {
  '인': ['묘', '진'], // 동방목
  '묘': ['인', '진'],
  '진': ['인', '묘'],
  '사': ['오', '미'], // 남방화
  '오': ['사', '미'],
  '미': ['사', '오'],
  '신': ['유', '술'], // 서방금
  '유': ['신', '술'],
  '술': ['신', '유'],
  '해': ['자', '축'], // 북방수
  '자': ['해', '축'],
  '축': ['해', '자'],
} as const;

// ============================================
// 지지-띠 매핑
// ============================================

/** 지지와 띠 매핑 */
export const BRANCH_TO_ZODIAC: Record<string, { name: string; emoji: string }> = {
  '자': { name: '쥐띠', emoji: '🐭' },
  '축': { name: '소띠', emoji: '🐮' },
  '인': { name: '호랑이띠', emoji: '🐯' },
  '묘': { name: '토끼띠', emoji: '🐰' },
  '진': { name: '용띠', emoji: '🐲' },
  '사': { name: '뱀띠', emoji: '🐍' },
  '오': { name: '말띠', emoji: '🐴' },
  '미': { name: '양띠', emoji: '🐑' },
  '신': { name: '원숭이띠', emoji: '🐵' },
  '유': { name: '닭띠', emoji: '🐔' },
  '술': { name: '개띠', emoji: '🐶' },
  '해': { name: '돼지띠', emoji: '🐷' },
} as const;

// ============================================
// 오행별 색상/방향/숫자/시간
// ============================================

/** 오행별 색상 */
export const ELEMENT_COLORS: Record<Element, { name: string; hex: string }[]> = {
  wood: [
    { name: '초록', hex: '#22C55E' },
    { name: '청록', hex: '#14B8A6' },
    { name: '연두', hex: '#84CC16' },
  ],
  fire: [
    { name: '빨강', hex: '#EF4444' },
    { name: '주황', hex: '#F97316' },
    { name: '분홍', hex: '#EC4899' },
  ],
  earth: [
    { name: '노랑', hex: '#EAB308' },
    { name: '베이지', hex: '#D4A574' },
    { name: '갈색', hex: '#A16207' },
  ],
  metal: [
    { name: '흰색', hex: '#F5F5F5' },
    { name: '은색', hex: '#C0C0C0' },
    { name: '금색', hex: '#FFD700' },
  ],
  water: [
    { name: '검정', hex: '#171717' },
    { name: '남색', hex: '#312E81' },
    { name: '파랑', hex: '#3B82F6' },
  ],
} as const;

/** 색상 이름-HEX 매핑 (HomeScreen 등에서 사용) */
export const COLOR_NAME_TO_HEX: Record<string, string> = {
  // 목 (wood)
  '초록': '#22C55E',
  '청록': '#14B8A6',
  '연두': '#84CC16',
  // 화 (fire)
  '빨강': '#EF4444',
  '주황': '#F97316',
  '분홍': '#EC4899',
  // 토 (earth)
  '노랑': '#EAB308',
  '베이지': '#D4A574',
  '갈색': '#A16207',
  // 금 (metal)
  '흰색': '#F5F5F5',
  '은색': '#C0C0C0',
  '금색': '#FFD700',
  // 수 (water)
  '검정': '#171717',
  '남색': '#312E81',
  '파랑': '#3B82F6',
} as const;

/** 오행별 방향 */
export const ELEMENT_DIRECTIONS: Record<Element, string> = {
  wood: '동쪽',
  fire: '남쪽',
  earth: '중앙',
  metal: '서쪽',
  water: '북쪽',
} as const;

/** 오행별 숫자 */
export const ELEMENT_NUMBERS: Record<Element, number[]> = {
  wood: [3, 8],
  fire: [2, 7],
  earth: [5, 10],
  metal: [4, 9],
  water: [1, 6],
} as const;

/** 오행별 시간대 */
export const ELEMENT_TIMES: Record<Element, string> = {
  wood: '오전 5-9시',
  fire: '오전 9시-오후 1시',
  earth: '오후 1-3시, 7-9시',
  metal: '오후 3-7시',
  water: '오후 9시-오전 1시',
} as const;

// ============================================
// 천간-오행 매핑
// ============================================

/** 천간을 오행으로 변환 */
export const STEM_TO_ELEMENT: Record<string, Element> = {
  '갑': 'wood', '을': 'wood',
  '병': 'fire', '정': 'fire',
  '무': 'earth', '기': 'earth',
  '경': 'metal', '신': 'metal',
  '임': 'water', '계': 'water',
} as const;

/** 천간을 한글 오행으로 변환 */
export const STEM_TO_KOREAN_ELEMENT: Record<string, string> = {
  '갑': '목', '을': '목',
  '병': '화', '정': '화',
  '무': '토', '기': '토',
  '경': '금', '신': '금',
  '임': '수', '계': '수',
} as const;

// ============================================
// UI 상수
// ============================================

/** 요일 배열 */
export const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** 12지지 배열 */
export const ZODIAC_CHARS = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const;

/** 팔괘 (SajuWheel에서 사용) */
export const TRIGRAMS: readonly ('solid' | 'broken')[][] = [
  ['solid', 'solid', 'solid'],    // 건 (☰)
  ['broken', 'solid', 'solid'],   // 태 (☱)
  ['solid', 'broken', 'solid'],   // 이 (☲)
  ['broken', 'broken', 'solid'],  // 진 (☳)
  ['solid', 'solid', 'broken'],   // 손 (☴)
  ['broken', 'solid', 'broken'],  // 감 (☵)
  ['solid', 'broken', 'broken'],  // 간 (☶)
  ['broken', 'broken', 'broken'], // 곤 (☷)
] as const;
