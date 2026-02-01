/**
 * 간지(干支) 계산 유틸리티
 * 연도, 월, 일 → 간지 변환
 */

import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../data/saju';

/**
 * 연도의 간지 정보 인터페이스
 */
export interface YearGanji {
  stem: string;        // 천간 (갑, 을, 병...)
  branch: string;      // 지지 (자, 축, 인...)
  stemHanja: string;   // 천간 한자 (甲, 乙, 丙...)
  branchHanja: string; // 지지 한자 (子, 丑, 寅...)
  animal: string;      // 띠 (쥐, 소, 호랑이...)
}

/**
 * 연도 → 년주(년간+년지) 계산
 * @param year 연도 (예: 2024)
 * @returns YearGanji 객체
 * @example
 * getYearGanji(2024) // { stem: '갑', branch: '진', stemHanja: '甲', branchHanja: '辰', animal: '용' }
 */
export function getYearGanji(year: number): YearGanji {
  const stemIndex = ((year - 4) % 10 + 10) % 10;
  const branchIndex = ((year - 4) % 12 + 12) % 12;

  return {
    stem: HEAVENLY_STEMS[stemIndex].korean,
    branch: EARTHLY_BRANCHES[branchIndex].korean,
    stemHanja: HEAVENLY_STEMS[stemIndex].hanja,
    branchHanja: EARTHLY_BRANCHES[branchIndex].hanja,
    animal: EARTHLY_BRANCHES[branchIndex].animal,
  };
}

/**
 * 연도 → 년주(간략 버전)
 * 천간과 지지만 필요한 경우 사용
 * @param year 연도
 * @returns { stem, branch }
 */
export function getYearGanjiSimple(year: number): { stem: string; branch: string } {
  const result = getYearGanji(year);
  return { stem: result.stem, branch: result.branch };
}

/**
 * 연도 → 띠 동물 계산
 * @param year 연도
 * @returns 띠 이름 (쥐, 소, 호랑이...)
 */
export function getYearAnimal(year: number): string {
  const branchIndex = ((year - 4) % 12 + 12) % 12;
  return EARTHLY_BRANCHES[branchIndex].animal;
}

/**
 * 연도 → 천간 계산
 * @param year 연도
 * @returns 천간 (갑, 을, 병...)
 */
export function getYearStem(year: number): string {
  const stemIndex = ((year - 4) % 10 + 10) % 10;
  return HEAVENLY_STEMS[stemIndex].korean;
}

/**
 * 연도 → 지지 계산
 * @param year 연도
 * @returns 지지 (자, 축, 인...)
 */
export function getYearBranch(year: number): string {
  const branchIndex = ((year - 4) % 12 + 12) % 12;
  return EARTHLY_BRANCHES[branchIndex].korean;
}
