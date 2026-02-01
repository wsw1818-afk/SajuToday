/**
 * 사주 운세 계산 커스텀 훅 (최적화 버전)
 * 
 * 개선사항:
 * 1. 날짜 문자열 기반 메모이제이션 (timestamp 대신)
 * 2. 에러 바욍더리 추가
 * 3. 계산 결과 캐싱
 */

import { useMemo, useRef, useCallback } from 'react';
import { SajuCalculator } from '../services/SajuCalculator';
import { generateFortune } from '../services/FortuneGenerator';
import { generateComprehensiveFortune } from '../services/FortuneTypes';
import {
  getRichIljuInterpretation,
  generateRichDailyFortune,
  generateCategoryFortune,
} from '../services/RichFortuneService';
import { getScoreMessage } from '../data/simpleInterpretations';
import { UserProfile, TodayInfo, SajuResult, Fortune } from '../types';

interface UseSajuFortuneProps {
  profile: UserProfile | null;
  todayInfo: TodayInfo | null;
  selectedDate: Date;
}

interface FortuneCache {
  dateKey: string;
  result: Fortune | null;
}

// 날짜를 YYYY-MM-DD 문자열로 변환 (메모이제이션 키용)
const formatDateKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export function useSajuFortune({ profile, todayInfo, selectedDate }: UseSajuFortuneProps) {
  // 날짜 문자열 키 (timestamp 대신 사용 - 매시간 변경 방지)
  const dateKey = useMemo(() => formatDateKey(selectedDate), [selectedDate]);
  
  // 운세 캐시 (같은 날짜 재조회 방지)
  const fortuneCache = useRef<FortuneCache>({ dateKey: '', result: null });

  // 사주 계산 (생년월일 변경 시에만)
  const sajuResult = useMemo<SajuResult | null>(() => {
    if (!profile?.birthDate) return null;
    try {
      const calculator = new SajuCalculator(profile.birthDate, profile.birthTime);
      return calculator.calculate();
    } catch (error) {
      console.error('[useSajuFortune] 사주 계산 오류:', error);
      return null;
    }
  }, [profile?.birthDate, profile?.birthTime]);

  // 운세 생성 (날짜 또는 사주 변경 시) - 캐싱 적용
  const fortune = useMemo<Fortune | null>(() => {
    if (!sajuResult) return null;
    
    // 캐시 히트 확인
    if (fortuneCache.current.dateKey === dateKey && fortuneCache.current.result) {
      return fortuneCache.current.result;
    }
    
    try {
      const result = generateFortune(sajuResult, selectedDate);
      // 캐시 업데이트
      fortuneCache.current = { dateKey, result };
      return result;
    } catch (error) {
      console.error('[useSajuFortune] 운세 생성 오류:', error);
      return null;
    }
  }, [sajuResult, dateKey]); // selectedDate 대신 dateKey 사용

  // 종합운세 생성
  const comprehensiveFortune = useMemo(() => {
    if (!profile?.birthDate || !sajuResult?.dayMaster) return null;
    return generateComprehensiveFortune(
      profile.birthDate,
      sajuResult.dayMaster,
      profile.name || '사용자',
      selectedDate
    );
  }, [profile?.birthDate, profile?.name, sajuResult?.dayMaster, dateKey]);

  // 쉬운 점수 메시지
  const easyScoreMessages = useMemo(() => {
    if (!fortune) return null;
    return {
      overall: getScoreMessage('overall', fortune.scores.overall),
      love: getScoreMessage('love', fortune.scores.love),
      money: getScoreMessage('money', fortune.scores.money),
      work: getScoreMessage('work', fortune.scores.work),
      health: getScoreMessage('health', fortune.scores.health),
    };
  }, [fortune]);

  // 풍부한 일주 해석
  const richIljuData = useMemo(() => {
    return getRichIljuInterpretation(sajuResult);
  }, [sajuResult]);

  // 풍부한 오늘 운세 해석
  const richDailyFortune = useMemo(() => {
    if (!sajuResult || !todayInfo?.ganji) return null;
    const todayStem = todayInfo.ganji.stem;
    const todayBranch = todayInfo.ganji.branch;
    return generateRichDailyFortune(sajuResult, todayStem, todayBranch);
  }, [sajuResult, todayInfo?.ganji]);

  // 카테고리별 맞춤 해석
  const categoryFortune = useMemo(() => {
    if (!fortune) return null;
    return generateCategoryFortune(sajuResult, fortune.scores);
  }, [sajuResult, fortune]);

  // 오늘의 운세 해석 (쉬운 말 버전)
  const todayFortuneInterpretation = useMemo(() => {
    if (!fortune || !sajuResult || !easyScoreMessages) {
      return {
        main: '운세 정보를 불러오는 중입니다...',
        sub: '',
        emoji: '⏳',
      };
    }

    try {
      const overallMessage = easyScoreMessages.overall;
      const mainText = `${overallMessage.emoji} ${overallMessage.title}\n\n` +
        `${overallMessage.message}\n\n` +
        `💡 오늘의 조언: ${overallMessage.advice}`;

      const luckyInfo = fortune.luckyInfo || { color: '초록색', number: '3, 8', direction: '동쪽' };
      const subText = `🎨 ${luckyInfo.color} | 🔢 ${luckyInfo.number} | 🧭 ${luckyInfo.direction}`;

      return {
        main: mainText,
        sub: subText,
        emoji: overallMessage.emoji,
        color: overallMessage.color,
      };
    } catch (error) {
      console.error('운세 해석 생성 오류:', error);
      return {
        main: '오늘 하루도 긍정적인 마음으로 시작해보세요.',
        sub: '',
        emoji: '🌈',
      };
    }
  }, [fortune, sajuResult, easyScoreMessages]);

  // 로딩/에러 상태
  const isLoading = !profile;
  const hasError = profile && !sajuResult;

  return {
    sajuResult,
    fortune,
    comprehensiveFortune,
    easyScoreMessages,
    richIljuData,
    richDailyFortune,
    categoryFortune,
    todayFortuneInterpretation,
    isLoading,
    hasError,
  };
}

export default useSajuFortune;
