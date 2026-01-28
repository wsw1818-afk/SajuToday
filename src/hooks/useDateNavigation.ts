/**
 * 날짜 네비게이션 커스텀 훅
 * HomeScreen의 날짜 선택 관련 로직을 분리하여 성능 개선
 */

import { useState, useMemo, useCallback } from 'react';
import { formatLunarFromISO } from '../utils/dateFormatter';

interface UseDateNavigationResult {
  // 상태
  selectedDate: Date;
  isToday: boolean;
  isFuture: boolean;

  // 포맷된 문자열
  selectedDateStr: string;     // 2024년 1월 28일 (화)
  headerDateStr: string;       // 1월 28일 (화)
  selectedLunarStr: string;    // 음력 12월 18일

  // 액션
  setSelectedDate: (date: Date) => void;
  handlePrevDay: () => void;
  handleNextDay: () => void;
  handleResetToToday: () => void;
}

/**
 * 날짜 네비게이션 훅
 */
export function useDateNavigation(initialDate?: Date): UseDateNavigationResult {
  const [selectedDate, setSelectedDate] = useState(() => initialDate || new Date());

  // 오늘인지 확인
  const isToday = useMemo(() => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  }, [selectedDate]);

  // 미래인지 확인
  const isFuture = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected > today;
  }, [selectedDate]);

  // 긴 날짜 포맷 (2024년 1월 28일 (화))
  const selectedDateStr = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][selectedDate.getDay()];
    return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
  }, [selectedDate]);

  // 헤더용 짧은 날짜 포맷 (1월 28일 (화))
  const headerDateStr = useMemo(() => {
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][selectedDate.getDay()];
    return `${month}월 ${day}일 (${dayOfWeek})`;
  }, [selectedDate]);

  // 음력 날짜 포맷
  const selectedLunarStr = useMemo(() => {
    try {
      return formatLunarFromISO(selectedDate.toISOString());
    } catch {
      const month = selectedDate.getMonth() + 1;
      const day = selectedDate.getDate();
      return `음력 ${month}월 ${day}일 (추정)`;
    }
  }, [selectedDate]);

  // 이전 날짜로 이동
  const handlePrevDay = useCallback(() => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  }, []);

  // 다음 날짜로 이동
  const handleNextDay = useCallback(() => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  }, []);

  // 오늘로 돌아가기
  const handleResetToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  return {
    selectedDate,
    isToday,
    isFuture,
    selectedDateStr,
    headerDateStr,
    selectedLunarStr,
    setSelectedDate,
    handlePrevDay,
    handleNextDay,
    handleResetToToday,
  };
}

export default useDateNavigation;
