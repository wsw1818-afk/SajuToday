/**
 * 사주 해석 관련 타입 정의
 * 5레이어 해석 아키텍처를 기반으로 함
 *
 * Layer 1: 원시 데이터 (Data)
 * Layer 2: 의미 부여 (Meaning)
 * Layer 3: 의미 해석 (Interpretation)
 * Layer 4: 실전 조언 (Advice)
 * Layer 5: 스토리텔링 (Story)
 */

// ============================================
// 기본 타입
// ============================================

export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
export type YinYang = 'yang' | 'yin';
export type StrengthLevel = 'very_strong' | 'strong' | 'balanced' | 'weak' | 'very_weak';
export type ElementStatus = 'excess' | 'adequate' | 'deficient' | 'critical';
export type TenGodPosition = 'strong' | 'moderate' | 'weak';

export type TenGodType =
  | '비견' | '겁재'
  | '식신' | '상관'
  | '편재' | '정재'
  | '편관' | '정관'
  | '편인' | '정인';

export type DayMasterStem = '갑' | '을' | '병' | '정' | '무' | '기' | '경' | '신' | '임' | '계';

// ============================================
// 일간(日干) 해석 타입
// ============================================

export interface DayMasterInterpretation {
  // Layer 1: Data
  stem: DayMasterStem;
  element: Element;
  yinYang: YinYang;

  // Layer 2: Meaning
  symbol: string;        // "큰 나무", "태양", "바위" 등
  nature: string;        // "곧고 정직", "밝고 따뜻", "강하고 단호"
  koreanName: string;    // "갑목(甲木)"

  // Layer 3: Interpretation
  personality: string[]; // 3-5개 특성
  strengths: string[];   // 강점 3개
  weaknesses: string[];  // 약점 3개

  // Layer 4: Advice
  career: string;        // 적합한 직업 방향
  relationships: string; // 대인관계 조언
  health: string;        // 건강 관리
  growthPoints: string[]; // 성장 포인트 3개

  // Layer 5: Story
  metaphor: string;      // "당신은...처럼"
  quote: string;         // 인용구 또는 긍정 확언
}

// ============================================
// 일간 강약 해석 타입
// ============================================

export interface StrengthInterpretation {
  // Layer 1: Data
  score: number;
  level: StrengthLevel;

  // Layer 2-3: Interpretation
  title: string;           // "균형 잡힌 힘"
  subtitle: string;        // "유연한 대응력"
  description: string;     // 상세 설명

  // Layer 4: Advice
  dos: string[];           // "이렇게 하세요" 3-5개
  donts: string[];         // "이렇게 하지 마세요" 3-5개
  bestPartners: string[];  // "이런 사람과 함께"
  avoidPartners: string[]; // "이런 사람은 주의"

  // Layer 5: Story
  metaphor: string;
  season: string;          // 계절 비유
}

// ============================================
// 오행 균형 해석 타입
// ============================================

export interface ElementInterpretation {
  // Layer 1: Data
  element: Element;
  count: number;
  ratio: number;
  status: ElementStatus;

  // Layer 2-3: Interpretation
  koreanName: string;    // "목(木)"
  title: string;         // "성장의 기운"
  description: string;
  inMe: string;          // 내 안에서의 역할
  inLife: string;        // 삶에서의 영향

  // Layer 4: Advice
  boostMethods: string[];  // 이 오행을 키우는 방법
  reduceMethods: string[]; // 과다시 줄이는 방법
  color: string;           // 대표 색상
  direction: string;       // 대표 방향
  number: string;          // 행운의 숫자
}

// ============================================
// 십신(十神) 해석 타입
// ============================================

export interface TenGodInterpretation {
  // Layer 1: Data
  tenGod: TenGodType;
  count: number;
  position: TenGodPosition;

  // Layer 2: Meaning
  symbol: string;      // "나와 같은 사람", "스승", "재물"
  role: string;        // "경쟁자이자 협력자"
  hanja: string;       // "比肩"

  // Layer 3: Interpretation
  meaning: string;     // 심리적 의미
  behavior: string;    // 행동 패턴
  relationship: string; // 인간관계에서의 역할

  // Layer 4: Advice
  maximize: string[];  // 강점 극대화
  watchout: string[];  // 주의사항
}

// ============================================
// 대운(大運) 해석 타입
// ============================================

export interface DaeunInterpretation {
  // Layer 1: Data
  age: string;
  ganji: string;
  element: Element;
  tenGod: TenGodType;
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;

  // Layer 3: Interpretation
  theme: string;         // "성장과 도약", "안정과 정리"
  keywords: string[];    // ["변화", "도전", "기회"]

  // Layer 4: Advice
  opportunities: string[]; // 이 대운의 기회
  challenges: string[];    // 이 대운의 과제
  strategy: string;        // 대처 전략

  // Layer 5: Story
  story: string;           // "이 시기에는..."
}

// ============================================
// 종합 해석 타입
// ============================================

export interface SajuFullInterpretation {
  dayMaster: DayMasterInterpretation;
  strength: StrengthInterpretation;
  elements: ElementInterpretation[];
  tenGods: TenGodInterpretation[];
  daeun: DaeunInterpretation[];

  // 종합 조언
  summary: {
    coreMessage: string;      // 핵심 메시지
    lifeTheme: string;        // 인생 테마
    currentAdvice: string;    // 현재 시점 조언
    futureDirection: string;  // 미래 방향
  };
}

// ============================================
// 데이터베이스 타입
// ============================================

export type DayMasterDatabase = Record<DayMasterStem, Omit<DayMasterInterpretation, 'stem'>>;
export type StrengthDatabase = Record<StrengthLevel, Omit<StrengthInterpretation, 'score' | 'level'>>;
export type ElementDatabase = Record<Element, Omit<ElementInterpretation, 'element' | 'count' | 'ratio' | 'status'>>;
export type TenGodDatabase = Record<TenGodType, Omit<TenGodInterpretation, 'tenGod' | 'count' | 'position'>>;
