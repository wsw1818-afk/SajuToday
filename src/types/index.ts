// 사주 관련 타입
export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
export type YinYangType = 'yin' | 'yang';
export type CalendarType = 'solar' | 'lunar';
export type Gender = 'male' | 'female' | null;
export type Tone = 'friendly' | 'calm' | 'funny' | 'serious';
export type Length = 'short' | 'medium' | 'long';

// 천간 (10개)
export interface HeavenlyStem {
  order: number;
  korean: string;
  hanja: string;
  element: Element;
  yinYang: YinYangType;
  meaning: string;
}

// 지지 (12개)
export interface EarthlyBranch {
  order: number;
  korean: string;
  hanja: string;
  element: Element;
  yinYang: YinYangType;
  animal: string;
  time: string;
  month: number;
}

// 주 (천간 + 지지)
export interface Pillar {
  stem: string;
  branch: string;
}

// 4주 (년월일시)
export interface FourPillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
}

// 오행 분포
export interface Elements {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

// 음양 비율
export interface YinYang {
  yin: number;
  yang: number;
}

// 십신
export interface TenGods {
  year: string;
  month: string;
  hour: string | null;
}

// 합충 관계
export interface Relations {
  clashes: string[];
  combines: string[];
}

// 사주 계산 결과
export interface SajuResult {
  pillars: FourPillars;
  elements: Elements;
  yinYang: YinYang;
  dayMaster: string;
  dayMasterInfo: {
    element: Element;
    yinYang: YinYangType;
    meaning: string;
  };
  tenGods: TenGods;
  relations: Relations;
  computedAt: string;
}

// 사용자 프로필
export interface UserProfile {
  id: string;
  name: string; // 사용자 이름
  birthDate: string; // YYYY-MM-DD
  birthTime: string | null; // HH:mm or null
  calendar: CalendarType;
  isLeapMonth: boolean;
  gender: Gender;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

// 설정
export interface Settings {
  tone: Tone;
  length: Length;
  notificationEnabled: boolean;
  notificationTime: string;
}

// 오늘 정보
export interface TodayInfo {
  date: string;
  ganji: Pillar;
  solarTerm: string | null;
  specialDays: string[];
}

// 운세 점수
export interface FortuneScores {
  overall: number;
  money: number;
  work: number;
  love: number;
  health: number;
}

// 운세 카드
export interface FortuneCards {
  overall: string[];
  money: string[];
  work: string[];
  love: string[];
  health: string[];
}

// 상세 운세 분석
export interface DetailedAnalysis {
  title: string;           // 제목 (예: "오행 관계 분석")
  description: string;     // 상세 설명
  reason: string;          // 이유/근거
  advice: string;          // 조언
}

// 카테고리별 상세 운세
export interface DetailedFortune {
  summary: string;         // 요약
  analysis: string;        // 상세 분석
  reason: string;          // 명리학적 이유
  advice: string;          // 실천 조언
  keywords: string[];      // 관련 키워드
}

// 오행 분석 결과
export interface ElementAnalysis {
  userElement: Element;    // 사용자 일간 오행
  userElementName: string; // 사용자 오행 한글명
  todayElement: Element;   // 오늘 오행
  todayElementName: string;// 오늘 오행 한글명
  relation: string;        // 관계 (상생/상극/비화)
  relationName: string;    // 관계 한글명
  relationDescription: string; // 관계 설명
  effect: string;          // 영향
}

// 지지 분석 결과
export interface BranchAnalysis {
  userBranch: string;      // 사용자 일지
  todayBranch: string;     // 오늘 지지
  zodiac: string;          // 오늘의 띠
  relation: string | null; // 육합/삼합/육충/육해/형/원진 등
  relationDescription: string; // 관계 설명
  effect: string;          // 영향
  simpleExplanation?: string;  // 쉬운 설명 (일반인도 이해하기 쉽게)
}

// 행운 정보
export interface LuckyInfo {
  color: string;
  number: string;
  direction: string;
  time: string;
}

// 띠 궁합 정보
export interface ZodiacCompatibility {
  luckyZodiac: string;
  luckyZodiacEmoji: string;
  cautionZodiac: string;
  cautionZodiacEmoji: string;
}

// 운세 결과
export interface Fortune {
  summary: string;
  keywords: [string, string, string];
  scores: FortuneScores;
  cards: FortuneCards;
  luckyInfo: LuckyInfo;
  zodiacCompat: ZodiacCompatibility;
  do: string;
  dont: string;
  disclaimer: string;
  generatedAt: string;
  // 상세 분석 (새로 추가)
  elementAnalysis?: ElementAnalysis;   // 오행 분석
  branchAnalysis?: BranchAnalysis;     // 지지 분석
  detailedFortunes?: {                 // 카테고리별 상세 운세
    overall: DetailedFortune;
    love: DetailedFortune;
    money: DetailedFortune;
    work: DetailedFortune;
    health: DetailedFortune;
  };
  todayGanji?: {                       // 오늘의 간지
    stem: string;
    branch: string;
    fullName: string;
  };
  userDayMaster?: {                    // 사용자 일간 정보
    stem: string;
    element: Element;
    elementName: string;
  };
}

// 운세 히스토리
export interface FortuneHistory {
  id: number;
  date: string;
  fortune: Fortune;
  createdAt: string;
}

// 저장된 사람 정보 (궁합용)
export interface SavedPerson {
  id: string;
  name: string;
  birthDate: string;       // YYYY-MM-DD
  birthTime: string | null; // HH:mm or null
  gender: Gender;
  calendar: CalendarType;
  isLeapMonth: boolean;
  relation?: string;        // 관계 (예: 친구, 가족, 연인 등)
  memo?: string;            // 메모
  saju?: SajuResult;        // 사주 계산 결과 (캐시)
  createdAt: string;
  updatedAt: string;
}

// KASI API 응답
export interface KasiLunarResponse {
  lunYear: string;
  lunMonth: string;
  lunDay: string;
  lunLeapmonth: string;
  lunSecha: string;
  lunWolgeon: string;
  lunIljin: string;
}

export interface KasiSolarTermResponse {
  locdate: string;
  dateName: string;
  dateKind: string;
}

// 절기 정보
export interface SolarTerm {
  order: number;
  korean: string;
  hanja: string;
  month: number;
  approxDay: number;
  type: '절' | '기';
  description: string;
}

// 60갑자
export interface SexagenaryCycle {
  order: number;
  stem: string;
  branch: string;
  korean: string;
  hanja: string;
}

// 십신 정보
export interface TenGodInfo {
  id: string;
  korean: string;
  hanja: string;
  relation: string;
  meaning: string;
}

// 합충 정보
export interface CombineClash {
  pair: [string, string];
  result?: string;
  meaning: string;
}

// 일간별 특성
export interface DayMasterTraits {
  keywords: string[];
  strengths: string[];
  weaknesses: string[];
  career: string[];
}

// 네비게이션 타입
export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  FortuneDetail: { category: string };
  FortuneMenu: undefined;
  FortuneType: { type: string };
  CompatibilityInput: undefined;
  CompatibilityResult: { personA: SavedPerson; personB: SavedPerson };
  SavedPeople: undefined;
  DatePicker: undefined;
  Menu: undefined;
  Sinsal: undefined;
  FortuneQnA: undefined;
  FortuneCalendar: undefined;
  LuckyItems: undefined;
  // 새로운 화면들
  Daeun: undefined;
  Taekil: undefined;
  NameAnalysis: undefined;
  DreamDiary: undefined;
  FamilyGroup: undefined;
  Bookmark: undefined;
  FortuneReport: undefined;
  // 사용자 참여 기능 화면
  Compatibility: undefined;
  Calendar: undefined;
};

export type MainTabParamList = {
  Home: { selectedDate?: string } | undefined;
  Profile: undefined;
  Fortune: undefined;
  History: undefined;
  Settings: undefined;
};

export type OnboardingStackParamList = {
  NameInput: undefined;
  BirthDateInput: undefined;
  CalendarSelect: undefined;
  BirthTimeInput: undefined;
  GenderSelect: undefined;
  SajuResult: undefined;
};
