import {
  Pillar,
  FourPillars,
  Elements,
  YinYang,
  TenGods,
  Relations,
  SajuResult,
  Element,
  YinYangType,
} from '../types';
import {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  SEXAGENARY_CYCLE,
  SOLAR_TERMS,
  SIX_COMBINES,
  SIX_CLASHES,
  FIVE_ELEMENTS,
  TEN_GODS,
  DAY_MASTER_TRAITS,
  getStemByKorean,
  getBranchByKorean,
} from '../data/saju';

/**
 * 줄리안 데이 넘버(JDN) 기반 일진 계산
 * 시간대 영향 없이 순수 날짜 차이로 계산
 * 검증: 2026-02-07 = 임자(壬子) = index 48
 */
function getJulianDayNumber(year: number, month: number, day: number): number {
  // 그레고리력 → JDN 변환 공식
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

// JDN 기준 60갑자 오프셋: JDN % 60 과 실제 간지 index의 차이
// 검증: 2026-02-07 JDN=2461744, 실제 일진=임자(壬子)=index 48
// 2461744 % 60 = 44, 실제 index=48, 오프셋=48-44=4
const JDN_GANJI_OFFSET = 4;

/**
 * 사주 계산기 클래스
 */
export class SajuCalculator {
  private birthDate: Date;
  private birthTime: string | null;

  // 자시(23:00-01:00) 처리를 위한 플래그
  private isZiShiNextDay: boolean = false;

  constructor(birthDate: string, birthTime: string | null) {
    // UTC 시간대 문제 방지: 날짜 문자열을 직접 파싱하여 로컬 날짜로 생성
    // new Date("YYYY-MM-DD")는 UTC 자정으로 해석되어 시간대에 따라 날짜가 다를 수 있음
    const [year, month, day] = birthDate.split('-').map(Number);
    this.birthDate = new Date(year, month - 1, day);
    this.birthTime = birthTime;
    
    // 23:00-23:59는 다음 날의 자시로 처리
    if (birthTime) {
      const [hours] = birthTime.split(':').map(Number);
      if (hours >= 23) {
        this.isZiShiNextDay = true;
        this.birthDate = new Date(year, month - 1, day + 1);
      }
    }
  }

  /**
   * 전체 사주 계산
   */
  calculate(): SajuResult {
    const pillars = this.calculateFourPillars();
    const elements = this.calculateElements(pillars);
    const yinYang = this.calculateYinYang(pillars);
    const dayMaster = pillars.day.stem;
    const dayMasterStem = getStemByKorean(dayMaster);
    const tenGods = this.calculateTenGods(dayMaster, pillars);
    const relations = this.calculateRelations(pillars);

    return {
      pillars,
      elements,
      yinYang,
      dayMaster,
      dayMasterInfo: {
        element: dayMasterStem?.element || 'wood',
        yinYang: dayMasterStem?.yinYang || 'yang',
        meaning: dayMasterStem?.meaning || '',
      },
      tenGods,
      relations,
      computedAt: new Date().toISOString(),
    };
  }

  /**
   * 4주 계산
   */
  private calculateFourPillars(): FourPillars {
    const yearPillar = this.calculateYearPillar();
    const monthPillar = this.calculateMonthPillar(yearPillar.stem);
    const dayPillar = this.calculateDayPillar();
    const hourPillar = this.birthTime
      ? this.calculateHourPillar(dayPillar.stem)
      : null;

    return {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar,
    };
  }

  /**
   * 년주 계산
   * - 입춘(立春, 약 2월 4일) 이전이면 전년도 간지 사용
   * - 참고: 입춘은 매년 2월 3일, 4일, 또는 5일에 해당 (천문 현상)
   * - 정확한 계산을 위해서는 KASI API에서 절기 정보를 받아오는 것이 좋음
   */
  private calculateYearPillar(): Pillar {
    let year = this.birthDate.getFullYear();
    const month = this.birthDate.getMonth() + 1;
    const day = this.birthDate.getDate();

    // 입춘 날짜는 매년 미세하게 변동:
    // 2024년: 2월 4일
    // 2025년: 2월 3일  
    // 2026년: 2월 4일
    // TODO: 정확한 입춘 날짜를 위해 KASI API 연동 권장
    const ipChunDay = this.getIpChunDay(year);
    
    if (month === 1 || (month === 2 && day < ipChunDay)) {
      year -= 1;
    }

    // (년도 - 4) % 60 = 60갑자 인덱스 (갑자년 = 4, 8, 12, ...)
    // 1984년 = 갑자년
    const index = ((year - 4) % 60 + 60) % 60;
    const cycle = SEXAGENARY_CYCLE[index];

    return {
      stem: cycle.stem,
      branch: cycle.branch,
    };
  }

  /**
   * 연도별 입춘(立春) 날짜 반환
   * 1900-2100년 범위의 주요 연도들
   * 정확한 값은 KASI API에서 조회 권장
   */
  private getIpChunDay(year: number): number {
    // 주요 연도별 입춘 날짜 (2월 X일)
    const ipChunDates: Record<number, number> = {
      2020: 4, 2021: 3, 2022: 4, 2023: 4, 2024: 4,
      2025: 3, 2026: 4, 2027: 4, 2028: 4, 2029: 3,
      2030: 4, 2031: 4, 2032: 4, 2033: 3, 2034: 4,
    };
    
    // 알려진 연도면 해당 값 사용, 아니면 기본값 4
    return ipChunDates[year] || 4;
  }

  /**
   * 월주 계산
   * - 절기 기준으로 월 변경
   * - 년간에 따른 월간 계산
   */
  private calculateMonthPillar(yearStem: string): Pillar {
    const month = this.birthDate.getMonth() + 1;
    const day = this.birthDate.getDate();

    // 절기 기준 월 결정 (간략화된 버전)
    let monthIndex = this.getMonthIndexBySolarTerm(month, day);

    // 월지 (인월=1월(음력), 묘월=2월, ...)
    const branchIndex = (monthIndex + 2) % 12; // 인(寅)부터 시작
    const branch = EARTHLY_BRANCHES[branchIndex].korean;

    // 월간 계산: 년간에 따른 공식
    // 갑기년 -> 병인월 시작, 을경년 -> 무인월, 병신년 -> 경인월, 정임년 -> 임인월, 무계년 -> 갑인월
    const yearStemIndex = HEAVENLY_STEMS.findIndex(s => s.korean === yearStem);
    const monthStemStartIndex = (yearStemIndex % 5) * 2 + 2; // 갑기->2(병), 을경->4(무), 병신->6(경), 정임->8(임), 무계->0(갑)
    const stemIndex = (monthStemStartIndex + monthIndex) % 10;
    const stem = HEAVENLY_STEMS[stemIndex].korean;

    return { stem, branch };
  }

  /**
   * 절기 기준 월 인덱스 (0 = 인월, 1 = 묘월, ...)
   * - 절기는 천문 현상이므로 매년 미세하게 변동됨
   * - 정확한 계산을 위해 KASI API 연동 권장
   */
  private getMonthIndexBySolarTerm(month: number, day: number): number {
    // 절기 시작일 (대략적인 날짜)
    // 참고: 실제 절기는 매년 ±1일 정도 변동
    const solarTermDays: Record<number, number> = {
      1: 6,   // 소한 (1월 5-7일)
      2: 4,   // 입춘 (2월 3-5일)
      3: 6,   // 경칩 (3월 5-7일)
      4: 5,   // 청명 (4월 4-6일)
      5: 6,   // 입하 (5월 5-7일)
      6: 6,   // 망종 (6월 5-7일)
      7: 7,   // 소서 (7월 6-8일)
      8: 8,   // 입추 (8월 7-9일)
      9: 8,   // 백로 (9월 7-9일)
      10: 8,  // 한로 (10월 8-9일)
      11: 7,  // 입동 (11월 7-8일)
      12: 7,  // 대설 (12월 6-8일)
    };

    // 절기 이전이면 전월
    const termDay = solarTermDays[month] || 6;
    let adjustedMonth = month;
    if (day < termDay) {
      adjustedMonth = month === 1 ? 12 : month - 1;
    }

    // 인월(1월) = 0, 묘월(2월) = 1, ..., 축월(12월) = 11
    // 양력 2월 -> 인월(0), 3월 -> 묘월(1), ..., 1월 -> 축월(11)
    return (adjustedMonth + 10) % 12;
  }

  /**
   * 일주 계산
   * - 기준일로부터 일수 계산 후 60갑자 순환
   * - 23:00-23:59는 다음 날로 처리 (자시는 다음 날의 시작)
   */
  private calculateDayPillar(): Pillar {
    const year = this.birthDate.getFullYear();
    const month = this.birthDate.getMonth() + 1;
    const day = this.birthDate.getDate();
    const jdn = getJulianDayNumber(year, month, day);
    const index = ((jdn + JDN_GANJI_OFFSET) % 60 + 60) % 60;
    const cycle = SEXAGENARY_CYCLE[index];

    return {
      stem: cycle.stem,
      branch: cycle.branch,
    };
  }

  /**
   * 원래 입력된 생년월일 반환 (자시 보정 전)
   * - 프로필 저장 등 표시용으로 사용
   */
  getOriginalBirthDate(): Date {
    if (this.isZiShiNextDay) {
      // 하루를 되돌림
      const original = new Date(this.birthDate);
      original.setDate(original.getDate() - 1);
      return original;
    }
    return this.birthDate;
  }

  /**
   * 시주 계산
   * - 시간대를 지지로 변환
   * - 일간에 따른 시간 계산
   */
  private calculateHourPillar(dayStem: string): Pillar {
    if (!this.birthTime) {
      return { stem: '', branch: '' };
    }

    const [hours, minutes] = this.birthTime.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;

    // 자시(23:00-01:00) 처리: 23:00 이후는 다음 날 자시
    if (hours >= 23) {
      totalMinutes = (hours - 23) * 60 + minutes;
    }

    // 시지 결정 (2시간 단위)
    // 자시(23-01), 축시(01-03), 인시(03-05), ...
    let branchIndex: number;
    if (hours >= 23 || hours < 1) {
      branchIndex = 0; // 자
    } else {
      branchIndex = Math.floor((hours + 1) / 2);
    }

    const branch = EARTHLY_BRANCHES[branchIndex].korean;

    // 시간 계산: 일간에 따른 공식
    // 갑기일 -> 갑자시 시작, 을경일 -> 병자시, 병신일 -> 무자시, 정임일 -> 경자시, 무계일 -> 임자시
    const dayStemIndex = HEAVENLY_STEMS.findIndex(s => s.korean === dayStem);
    const hourStemStartIndex = (dayStemIndex % 5) * 2;
    const stemIndex = (hourStemStartIndex + branchIndex) % 10;
    const stem = HEAVENLY_STEMS[stemIndex].korean;

    return { stem, branch };
  }

  /**
   * 오행 분포 계산
   */
  private calculateElements(pillars: FourPillars): Elements {
    const elements: Elements = {
      wood: 0,
      fire: 0,
      earth: 0,
      metal: 0,
      water: 0,
    };

    // 천간 오행 카운트
    const stems = [pillars.year.stem, pillars.month.stem, pillars.day.stem];
    if (pillars.hour) stems.push(pillars.hour.stem);

    stems.forEach(stem => {
      const stemInfo = getStemByKorean(stem);
      if (stemInfo) {
        elements[stemInfo.element]++;
      }
    });

    // 지지 오행 카운트
    const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch];
    if (pillars.hour) branches.push(pillars.hour.branch);

    branches.forEach(branch => {
      const branchInfo = getBranchByKorean(branch);
      if (branchInfo) {
        elements[branchInfo.element]++;
      }
    });

    return elements;
  }

  /**
   * 음양 비율 계산
   */
  private calculateYinYang(pillars: FourPillars): YinYang {
    const result: YinYang = { yin: 0, yang: 0 };

    // 천간
    const stems = [pillars.year.stem, pillars.month.stem, pillars.day.stem];
    if (pillars.hour) stems.push(pillars.hour.stem);

    stems.forEach(stem => {
      const stemInfo = getStemByKorean(stem);
      if (stemInfo) {
        result[stemInfo.yinYang]++;
      }
    });

    // 지지
    const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch];
    if (pillars.hour) branches.push(pillars.hour.branch);

    branches.forEach(branch => {
      const branchInfo = getBranchByKorean(branch);
      if (branchInfo) {
        result[branchInfo.yinYang]++;
      }
    });

    return result;
  }

  /**
   * 십신 계산
   */
  private calculateTenGods(dayMaster: string, pillars: FourPillars): TenGods {
    const dayMasterStem = getStemByKorean(dayMaster);
    if (!dayMasterStem) {
      return { year: '', month: '', hour: null };
    }

    return {
      year: this.getTenGod(dayMasterStem, pillars.year.stem),
      month: this.getTenGod(dayMasterStem, pillars.month.stem),
      hour: pillars.hour ? this.getTenGod(dayMasterStem, pillars.hour.stem) : null,
    };
  }

  /**
   * 특정 천간의 십신 계산
   */
  private getTenGod(dayMaster: { element: Element; yinYang: YinYangType }, targetStem: string): string {
    const target = getStemByKorean(targetStem);
    if (!target) return '';

    const dayElement = dayMaster.element;
    const dayYinYang = dayMaster.yinYang;
    const targetElement = target.element;
    const targetYinYang = target.yinYang;
    const sameYinYang = dayYinYang === targetYinYang;

    // 같은 오행
    if (dayElement === targetElement) {
      return sameYinYang ? '비견' : '겁재';
    }

    // 내가 생하는 오행 (식상)
    if (FIVE_ELEMENTS[dayElement].generates === targetElement) {
      return sameYinYang ? '식신' : '상관';
    }

    // 내가 극하는 오행 (재성)
    if (FIVE_ELEMENTS[dayElement].controls === targetElement) {
      return sameYinYang ? '편재' : '정재';
    }

    // 나를 극하는 오행 (관성)
    if (FIVE_ELEMENTS[targetElement].controls === dayElement) {
      return sameYinYang ? '편관' : '정관';
    }

    // 나를 생하는 오행 (인성)
    if (FIVE_ELEMENTS[targetElement].generates === dayElement) {
      return sameYinYang ? '편인' : '정인';
    }

    return '';
  }

  /**
   * 합충 관계 계산
   */
  private calculateRelations(pillars: FourPillars): Relations {
    const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch];
    if (pillars.hour) branches.push(pillars.hour.branch);

    const clashes: string[] = [];
    const combines: string[] = [];

    // 모든 지지 쌍에 대해 합충 체크
    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        const pair = [branches[i], branches[j]];

        // 육충 체크
        const clash = SIX_CLASHES.find(
          c => (c.pair[0] === pair[0] && c.pair[1] === pair[1]) ||
               (c.pair[0] === pair[1] && c.pair[1] === pair[0])
        );
        if (clash) {
          clashes.push(clash.meaning);
        }

        // 육합 체크
        const combine = SIX_COMBINES.find(
          c => (c.pair[0] === pair[0] && c.pair[1] === pair[1]) ||
               (c.pair[0] === pair[1] && c.pair[1] === pair[0])
        );
        if (combine) {
          combines.push(combine.meaning);
        }
      }
    }

    return { clashes, combines };
  }
}

/**
 * 오늘 간지 계산
 */
export function getTodayGanji(date: Date = new Date()): Pillar {
  const diffTime = date.getTime() - BASE_DATE.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const index = ((diffDays + BASE_GANJI_INDEX) % 60 + 60) % 60;
  const cycle = SEXAGENARY_CYCLE[index];

  return {
    stem: cycle.stem,
    branch: cycle.branch,
  };
}

/**
 * 일간별 특성 조회
 */
export function getDayMasterTraits(dayMaster: string) {
  return DAY_MASTER_TRAITS[dayMaster] || null;
}

/**
 * 일간과 오늘 일진의 십신 관계
 * - getTenGod 메서드를 public으로 추출하여 사용
 */
export function getTodayRelation(dayMaster: string, todayStem: string): string {
  const dayMasterStem = getStemByKorean(dayMaster);
  const todayStemInfo = getStemByKorean(todayStem);
  
  if (!dayMasterStem || !todayStemInfo) return '';

  // 십신 계산 로직 (getTenGod과 동일)
  const dayElement = dayMasterStem.element;
  const dayYinYang = dayMasterStem.yinYang;
  const targetElement = todayStemInfo.element;
  const targetYinYang = todayStemInfo.yinYang;
  const sameYinYang = dayYinYang === targetYinYang;

  // 같은 오행
  if (dayElement === targetElement) {
    return sameYinYang ? '비견' : '겁재';
  }

  // 내가 생하는 오행 (식상)
  if (FIVE_ELEMENTS[dayElement].generates === targetElement) {
    return sameYinYang ? '식신' : '상관';
  }

  // 내가 극하는 오행 (재성)
  if (FIVE_ELEMENTS[dayElement].controls === targetElement) {
    return sameYinYang ? '편재' : '정재';
  }

  // 나를 극하는 오행 (관성)
  if (FIVE_ELEMENTS[targetElement].controls === dayElement) {
    return sameYinYang ? '편관' : '정관';
  }

  // 나를 생하는 오행 (인성)
  if (FIVE_ELEMENTS[targetElement].generates === dayElement) {
    return sameYinYang ? '편인' : '정인';
  }

  return '';
}

/**
 * 사주 계산 헬퍼 함수 (SavedPeopleScreen 등에서 사용)
 * @param birthDate 생년월일 (YYYY-MM-DD)
 * @param birthTime 시간 (HH:mm or null)
 * @param calendar 달력 유형 ('solar' | 'lunar') - 현재 양력만 지원
 * @param isLeapMonth 윤달 여부 - 현재 미사용
 */
export function calculateSaju(
  birthDate: string,
  birthTime: string | null,
  calendar?: 'solar' | 'lunar',
  isLeapMonth?: boolean
): SajuResult {
  const calculator = new SajuCalculator(birthDate, birthTime);
  return calculator.calculate();
}
