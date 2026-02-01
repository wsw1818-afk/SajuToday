import { useMemo } from 'react';
import { SajuResult } from '../types';
import { calculateMonthlyFortune } from '../services/MonthlyDailyFortune';

export interface MonthlyFortune {
  monthGanji: { stem: string; branch: string };
  score: number;
  category: string;
  overview: string;
  wealth: string;
  career: string;
  love: string;
  health: string;
  advice: string;
  luckyDays: number[];
  cautionDays: number[];
}

export function useMonthlyFortune(
  sajuResult: SajuResult | null,
  year: number,
  month: number
): MonthlyFortune | null {
  return useMemo(() => {
    if (!sajuResult) return null;

    const fortune = calculateMonthlyFortune(
      sajuResult.dayMaster,
      year,
      month
    );

    return {
      monthGanji: fortune.ganji,
      score: fortune.score,
      category: fortune.category,
      overview: fortune.overview,
      wealth: fortune.wealth,
      career: fortune.career,
      love: fortune.love,
      health: fortune.health,
      advice: fortune.advice,
      luckyDays: fortune.luckyDays,
      cautionDays: fortune.cautionDays,
    };
  }, [sajuResult, year, month]);
}
