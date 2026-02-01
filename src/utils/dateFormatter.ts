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
 * 주의: 이 함수는 실제 음력 변환을 수행하지 않으며, 
       KASI API를 통해 변환된 결과를 표시하는 용도로 사용해야 함
 * @example formatLunarFromISO("2024-01-15") // "음력 변환 필요"
 */
export function formatLunarFromISO(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return '음력 정보 없음';

  // TODO: KASI API를 통해 실제 음력 변환 수행
  // 현재는 표시만 하고 실제 변환은 하지 않음
  return `음력 정보 (변환 필요)`;
}

/**
 * 양력 날짜를 음력으로 변환 (KASI API 연동 필요)
 * @param solarDate "YYYY-MM-DD" 형식의 양력 날짜
 * @returns "음력 X월 X일" 형식의 문자열 (또는 null)
 */
export async function formatLunarFromSolar(solarDate: string): Promise<string | null> {
  // KasiService.solarToLunar를 통해 실제 변환 수행
  // 이 함수는 비동기이므로 호출하는 곳에서 await 사용 필요
  return null; // TODO: KASI API 연동
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
