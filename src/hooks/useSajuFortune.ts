/**
 * 사주 운세 계산 커스텀 훅
 * HomeScreen의 useMemo 로직을 분리하여 재사용성과 가독성 향상
 */

import { useMemo } from 'react';
import { SajuCalculator } from '../services/SajuCalculator';
import { generateFortune } from '../services/FortuneGenerator';
import { generateComprehensiveFortune } from '../services/FortuneTypes';
import {
  getRichIljuInterpretation,
  generateRichDailyFortune,
  generateCategoryFortune,
} from '../services/RichFortuneService';
import { getScoreMessage } from '../data/simpleInterpretations';
import { UserProfile } from '../types';

interface TodayInfo {
  date?: string;
  ganji?: {
    stem: string;
    branch: string;
  };
  solarTerm?: string;
}

interface UseSajuFortuneProps {
  profile: UserProfile | null;
  todayInfo: TodayInfo | null;
  selectedDate: Date;
}

export function useSajuFortune({ profile, todayInfo, selectedDate }: UseSajuFortuneProps) {
  // 선택한 날짜의 타임스탬프 (메모이제이션 의존성용)
  const selectedDateTimestamp = selectedDate.getTime();

  // 사주를 실시간으로 재계산
  const sajuResult = useMemo(() => {
    if (!profile) return null;
    const calculator = new SajuCalculator(profile.birthDate, profile.birthTime);
    return calculator.calculate();
  }, [profile?.birthDate, profile?.birthTime]);

  // 선택한 날짜 기준 운세 생성
  const fortune = useMemo(() =>
    generateFortune(sajuResult, selectedDate),
    [sajuResult, selectedDateTimestamp]
  );

  // 종합운세 생성
  const comprehensiveFortune = useMemo(() => {
    if (!profile?.birthDate || !sajuResult?.dayMaster) return null;
    return generateComprehensiveFortune(
      profile.birthDate,
      sajuResult.dayMaster,
      profile.name || '사용자',
      selectedDate
    );
  }, [profile?.birthDate, profile?.name, sajuResult?.dayMaster, selectedDateTimestamp]);

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
