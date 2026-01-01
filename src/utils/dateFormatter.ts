/**
 * 날짜 포맷팅 유틸리티
 * 앱 전반에서 사용하는 날짜 관련 포맷팅 함수들
 */

import { DAYS_OF_WEEK } from '../data/constants';

/**
 * 날짜를 "M월 D일 (요일)" 형식으로 변환
 * @example formatDateWithDayOfWeek(new Date()) // "1월 15일 (수)"
 */
export function formatDateWithDayOfWeek(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = DAYS_OF_WEEK[date.getDay()];
  return `${month}월 ${day}일 (${dayOfWeek})`;
}

/**
 * 날짜를 "YYYY년 M월 D일" 형식으로 변환
 * @example formatDateFull(new Date()) // "2024년 1월 15일"
 */
export function formatDateFull(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

/**
 * 날짜를 "YYYY-MM-DD" ISO 형식으로 변환
 * @example formatDateISO(new Date()) // "2024-01-15"
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * ISO 날짜 문자열에서 음력 날짜 문자열 생성
 * @example formatLunarFromISO("2024-01-15") // "음력 1월 15일"
 */
export function formatLunarFromISO(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return '음력 정보 없음';

  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  return `음력 ${month}월 ${day}일`;
}

/**
 * 시간을 "HH:MM" 형식으로 변환
 * @example formatTime(new Date()) // "14:30"
 */
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 나이 계산 (한국식 - 태어난 해 + 1)
 * @example calculateKoreanAge("1990-05-15") // 35 (2024년 기준)
 */
export function calculateKoreanAge(birthDate: string): number {
  const birthYear = parseInt(birthDate.split('-')[0], 10);
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear + 1;
}

/**
 * 나이 계산 (만 나이)
 * @example calculateAge("1990-05-15") // 33 (2024년 1월 기준)
 */
export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}
