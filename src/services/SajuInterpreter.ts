/**
 * 사주 해석 생성 서비스
 * 5레이어 해석 아키텍처를 기반으로 풍부한 해석 콘텐츠 생성
 */

import { SajuResult } from '../types';
import {
  DayMasterInterpretation,
  StrengthInterpretation,
  ElementInterpretation,
  TenGodInterpretation,
  DaeunInterpretation,
  SajuFullInterpretation,
  StrengthLevel,
  ElementStatus,
  TenGodPosition,
  DayMasterStem,
  TenGodType,
  Element,
} from '../types/sajuAnalysis';
import {
  DAY_MASTER_DATABASE,
  STRENGTH_DATABASE,
  ELEMENT_DATABASE,
  TEN_GOD_DATABASE,
} from '../data/sajuInterpretations';

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 강약 점수에서 레벨 결정
 */
function getStrengthLevel(score: number): StrengthLevel {
  if (score >= 80) return 'very_strong';
  if (score >= 65) return 'strong';
  if (score >= 45) return 'balanced';
  if (score >= 30) return 'weak';
  return 'very_weak';
}

/**
 * 오행 비율에서 상태 결정
 */
function getElementStatus(ratio: number): ElementStatus {
  if (ratio >= 40) return 'excess';
  if (ratio >= 20) return 'adequate';
  if (ratio >= 10) return 'deficient';
  return 'critical';
}

/**
 * 십신 개수에서 위치 결정
 */
function getTenGodPosition(count: number): TenGodPosition {
  if (count >= 3) return 'strong';
  if (count >= 1) return 'moderate';
  return 'weak';
}

/**
 * 천간을 Element로 변환
 */
function stemToElement(stem: string): Element {
  const mapping: Record<string, Element> = {
    '갑': 'wood', '을': 'wood',
    '병': 'fire', '정': 'fire',
    '무': 'earth', '기': 'earth',
    '경': 'metal', '신': 'metal',
    '임': 'water', '계': 'water',
  };
  return mapping[stem] || 'earth';
}

/**
 * 오행 한글명 가져오기
 */
function getElementKorean(element: Element): string {
  const mapping: Record<Element, string> = {
    wood: '나무 기운',
    fire: '불 기운',
    earth: '흙 기운',
    metal: '금속 기운',
    water: '물 기운',
  };
  return mapping[element];
}

// ============================================
// 메인 해석 서비스 클래스
// ============================================

export class SajuInterpreter {
  /**
   * 일간(日干) 해석 생성
   */
  static interpretDayMaster(dayMaster: string): DayMasterInterpretation | null {
    const stem = dayMaster as DayMasterStem;
    const baseData = DAY_MASTER_DATABASE[stem];

    if (!baseData) {
      return null;
    }

    return {
      stem,
      ...baseData,
    };
  }

  /**
   * 일간 강약 해석 생성
   */
  static interpretStrength(
    score: number,
    reasons?: string[]
  ): StrengthInterpretation {
    const level = getStrengthLevel(score);
    const baseData = STRENGTH_DATABASE[level];

    let description = baseData.description;

    // reasons가 있으면 설명에 추가
    if (reasons && reasons.length > 0) {
      const reasonText = reasons.map(r => `• ${r}`).join('\n');
      description = `${baseData.description}\n\n[판단 근거]\n${reasonText}`;
    }

    return {
      score,
      level,
      ...baseData,
      description,
    };
  }

  /**
   * 오행 균형 해석 생성
   */
  static interpretElements(
    elements: Record<string, number>,
    yongsin?: string,
    gishin?: string
  ): ElementInterpretation[] {
    const total = Object.values(elements).reduce((a, b) => a + b, 0) || 1;

    return Object.entries(elements).map(([element, count]) => {
      const elementKey = element as Element;
      const ratio = Math.round((count / total) * 100);
      const status = getElementStatus(ratio);
      const baseData = ELEMENT_DATABASE[elementKey];

      if (!baseData) {
        return {
          element: elementKey,
          count,
          ratio,
          status,
          koreanName: getElementKorean(elementKey),
          title: '기운',
          description: '',
          inMe: '',
          inLife: '',
          boostMethods: [],
          reduceMethods: [],
          color: '',
          direction: '',
          number: '',
        };
      }

      // 용신/기신에 따른 추가 설명
      let description = baseData.description;
      if (yongsin === element) {
        description += '\n\n✨ 이 기운은 당신에게 가장 도움이 되는 기운이에요! 적극적으로 활용하면 운이 좋아져요.';
      } else if (gishin === element) {
        description += '\n\n⚠️ 이 기운은 당신에게 주의가 필요한 기운이에요. 너무 많으면 균형이 깨질 수 있어요.';
      }

      return {
        element: elementKey,
        count,
        ratio,
        status,
        ...baseData,
        description,
      };
    }).sort((a, b) => b.ratio - a.ratio); // 비율 높은 순 정렬
  }

  /**
   * 십신 해석 생성
   */
  static interpretTenGods(
    tenGods: Record<string, number>
  ): TenGodInterpretation[] {
    return Object.entries(tenGods)
      .filter(([_, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5) // 상위 5개
      .map(([tenGod, count]) => {
        const tenGodKey = tenGod as TenGodType;
        const position = getTenGodPosition(count);
        const baseData = TEN_GOD_DATABASE[tenGodKey];

        if (!baseData) {
          return {
            tenGod: tenGodKey,
            count,
            position,
            symbol: '',
            role: '',
            hanja: '',
            meaning: '',
            behavior: '',
            relationship: '',
            maximize: [],
            watchout: [],
          };
        }

        return {
          tenGod: tenGodKey,
          count,
          position,
          ...baseData,
        };
      });
  }

  /**
   * 대운 해석 생성 (간략 버전)
   */
  static interpretDaeun(
    age: string,
    ganji: string,
    dayMaster: string,
    options?: {
      isCurrent?: boolean;
      isPast?: boolean;
      isFuture?: boolean;
    }
  ): DaeunInterpretation {
    const stem = ganji[0];
    const element = stemToElement(stem);

    // 십신 계산 (간략)
    const tenGod = this.calculateTenGod(dayMaster, stem);

    // 테마 및 키워드 결정
    const themeData = this.getDaeunTheme(element, tenGod);

    return {
      age,
      ganji,
      element,
      tenGod,
      isCurrent: options?.isCurrent || false,
      isPast: options?.isPast || false,
      isFuture: options?.isFuture || true,
      theme: themeData.theme,
      keywords: themeData.keywords,
      opportunities: themeData.opportunities,
      challenges: themeData.challenges,
      strategy: themeData.strategy,
      story: themeData.story,
    };
  }

  /**
   * 십신 계산 (간략)
   */
  private static calculateTenGod(dayMaster: string, stem: string): TenGodType {
    const dayElement = stemToElement(dayMaster);
    const stemElement = stemToElement(stem);

    // 음양 판단
    const yangStems = ['갑', '병', '무', '경', '임'];
    const isYangDay = yangStems.includes(dayMaster);
    const isYangStem = yangStems.includes(stem);
    const sameYinYang = isYangDay === isYangStem;

    // 오행 관계에 따른 십신 결정
    if (dayElement === stemElement) {
      return sameYinYang ? '비견' : '겁재';
    }

    const generates: Record<Element, Element> = {
      wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
    };
    const controls: Record<Element, Element> = {
      wood: 'earth', fire: 'metal', earth: 'water', metal: 'wood', water: 'fire',
    };

    if (generates[dayElement] === stemElement) {
      return sameYinYang ? '식신' : '상관';
    }
    if (generates[stemElement] === dayElement) {
      return sameYinYang ? '편인' : '정인';
    }
    if (controls[dayElement] === stemElement) {
      return sameYinYang ? '편재' : '정재';
    }
    if (controls[stemElement] === dayElement) {
      return sameYinYang ? '편관' : '정관';
    }

    return '비견'; // 기본값
  }

  /**
   * 대운 테마 결정
   */
  private static getDaeunTheme(element: Element, tenGod: TenGodType) {
    const themes: Record<TenGodType, {
      theme: string;
      keywords: string[];
      opportunities: string[];
      challenges: string[];
      strategy: string;
      story: string;
    }> = {
      '비견': {
        theme: '협력과 경쟁의 시기',
        keywords: ['협력', '경쟁', '독립', '동료'],
        opportunities: ['파트너십 형성', '팀 프로젝트 성공', '네트워킹 확대'],
        challenges: ['경쟁 과열', '의견 충돌', '독단적 행동'],
        strategy: '협력을 통해 시너지를 만들되, 자신만의 정체성은 유지하세요.',
        story: '이 시기는 함께 성장하는 동반자를 만나는 때입니다.',
      },
      '겁재': {
        theme: '도전과 변화의 시기',
        keywords: ['변화', '도전', '위기', '기회'],
        opportunities: ['위기를 기회로', '새로운 시도', '돌파구 마련'],
        challenges: ['금전적 손실', '과도한 경쟁', '스트레스'],
        strategy: '변화를 두려워하지 말고, 신중하게 기회를 포착하세요.',
        story: '시련을 통해 더 강해지는 시기입니다.',
      },
      '식신': {
        theme: '창조와 표현의 시기',
        keywords: ['창의', '표현', '즐거움', '재능'],
        opportunities: ['창작 활동 성공', '재능 발휘', '인정받음'],
        challenges: ['방종', '과식', '현실 도피'],
        strategy: '창의력을 마음껏 발휘하되, 현실 감각을 잃지 마세요.',
        story: '당신의 재능이 꽃피는 시기입니다.',
      },
      '상관': {
        theme: '혁신과 변화의 시기',
        keywords: ['혁신', '변화', '솔직함', '도전'],
        opportunities: ['기존 틀 깨기', '새로운 방법 발견', '솔직한 소통'],
        challenges: ['권위와 충돌', '감정 조절', '적 만들기'],
        strategy: '변화를 추구하되, 부드러운 방법으로 접근하세요.',
        story: '낡은 것을 버리고 새것을 받아들이는 시기입니다.',
      },
      '편재': {
        theme: '재물과 확장의 시기',
        keywords: ['재물', '투자', '확장', '기회'],
        opportunities: ['예상 밖의 수입', '투자 성공', '사업 확장'],
        challenges: ['과욕', '도박성 투자', '금전 손실'],
        strategy: '기회를 잡되, 탐욕은 버리세요.',
        story: '재물운이 열리는 시기입니다.',
      },
      '정재': {
        theme: '안정과 축적의 시기',
        keywords: ['안정', '저축', '성실', '기반'],
        opportunities: ['안정적 수입 증가', '자산 형성', '신뢰 구축'],
        challenges: ['인색함', '변화 거부', '융통성 부족'],
        strategy: '꾸준히 쌓아가되, 때로는 투자도 필요합니다.',
        story: '든든한 기반을 만드는 시기입니다.',
      },
      '편관': {
        theme: '시련과 성장의 시기',
        keywords: ['시련', '극복', '성장', '인내'],
        opportunities: ['역경 극복', '내면 성장', '강해지기'],
        challenges: ['압박감', '건강 악화', '스트레스'],
        strategy: '인내하며 한 걸음씩 나아가세요. 도움을 요청해도 됩니다.',
        story: '고생 끝에 낙이 오는 시기입니다.',
      },
      '정관': {
        theme: '명예와 책임의 시기',
        keywords: ['명예', '책임', '인정', '승진'],
        opportunities: ['승진', '사회적 인정', '리더십 발휘'],
        challenges: ['과도한 책임', '융통성 부족', '피로'],
        strategy: '책임을 다하되, 자신을 돌보는 것도 잊지 마세요.',
        story: '당신의 노력이 인정받는 시기입니다.',
      },
      '편인': {
        theme: '지혜와 탐구의 시기',
        keywords: ['지혜', '직관', '연구', '독특함'],
        opportunities: ['깊은 통찰', '전문성 개발', '창의적 발견'],
        challenges: ['현실 도피', '고립', '비현실적 기대'],
        strategy: '직관을 믿되, 현실과의 균형을 유지하세요.',
        story: '내면의 지혜를 발견하는 시기입니다.',
      },
      '정인': {
        theme: '배움과 보호의 시기',
        keywords: ['배움', '보호', '멘토', '성장'],
        opportunities: ['학문적 성취', '멘토 만남', '자기 계발'],
        challenges: ['의존', '수동성', '실천 부족'],
        strategy: '배움을 실천으로 옮기세요. 보호받되 의존하지 마세요.',
        story: '지혜로운 조언자를 만나는 시기입니다.',
      },
    };

    return themes[tenGod] || themes['비견'];
  }

  /**
   * 전체 해석 생성
   */
  static generateFullInterpretation(
    sajuResult: SajuResult,
    options?: {
      strengthScore?: number;
      strengthReasons?: string[];
      yongsin?: string;
      gishin?: string;
    }
  ): SajuFullInterpretation | null {
    try {
      // 1. 일간 해석
      const dayMaster = this.interpretDayMaster(sajuResult.dayMaster);
      if (!dayMaster) return null;

      // 2. 강약 해석
      const strengthScore = options?.strengthScore ?? 50;
      const strengthReasons = options?.strengthReasons ?? [];
      const strength = this.interpretStrength(strengthScore, strengthReasons);

      // 3. 오행 해석
      const elementsRecord: Record<string, number> = {
        wood: sajuResult.elements?.wood ?? 0,
        fire: sajuResult.elements?.fire ?? 0,
        earth: sajuResult.elements?.earth ?? 0,
        metal: sajuResult.elements?.metal ?? 0,
        water: sajuResult.elements?.water ?? 0,
      };
      const elements = this.interpretElements(
        elementsRecord,
        options?.yongsin,
        options?.gishin
      );

      // 4. 십신 해석
      const tenGodCounts: Record<string, number> = {};
      if (sajuResult.pillars) {
        Object.values(sajuResult.pillars).forEach((pillar: any) => {
          if (pillar?.tenGod) {
            tenGodCounts[pillar.tenGod] = (tenGodCounts[pillar.tenGod] || 0) + 1;
          }
          if (pillar?.branchTenGod) {
            tenGodCounts[pillar.branchTenGod] = (tenGodCounts[pillar.branchTenGod] || 0) + 1;
          }
        });
      }
      const tenGods = this.interpretTenGods(tenGodCounts);

      // 5. 대운 해석 (현재 대운만)
      const daeun: DaeunInterpretation[] = [];
      // 실제 대운 데이터가 있으면 변환

      // 6. 종합 조언 생성
      const summary = {
        coreMessage: `${dayMaster.symbol}의 기운을 가진 당신은 ${dayMaster.nature}처럼 살아갑니다.`,
        lifeTheme: dayMaster.metaphor,
        currentAdvice: strength.dos[0] || '오늘도 당신답게 살아가세요.',
        futureDirection: dayMaster.career,
      };

      return {
        dayMaster,
        strength,
        elements,
        tenGods,
        daeun,
        summary,
      };
    } catch (error) {
      console.error('SajuInterpreter error:', error);
      return null;
    }
  }
}

export default SajuInterpreter;
