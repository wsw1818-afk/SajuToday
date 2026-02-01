import { useMemo } from 'react';
import { SajuResult } from '../types';
import { analyzeDaeunSeun, Daeun } from '../services/DaeunCalculator';

export interface DaeunPillar {
  startYear: number;
  endYear: number;
  age: number;
  stem: string;
  branch: string;
  score: number;
  description: string;
}

export interface CurrentDaeun {
  pillar: DaeunPillar;
  yearIndex: number;
}

export function useDaeunData(
  sajuResult: SajuResult | null,
  birthDate: Date | null,
  gender?: 'male' | 'female'
): {
  pillars: DaeunPillar[];
  currentDaeun: CurrentDaeun | null;
  analysis: ReturnType<typeof analyzeDaeunSeun> | null;
} {
  return useMemo(() => {
    if (!sajuResult || !birthDate || !gender) {
      return { pillars: [], currentDaeun: null, analysis: null };
    }

    const currentPillar = sajuResult.pillars.day;
    const monthPillar = sajuResult.pillars.month;
    
    if (!currentPillar || !monthPillar) {
      return { pillars: [], currentDaeun: null, analysis: null };
    }

    const analysis = analyzeDaeunSeun(
      birthDate.getFullYear(),
      birthDate.getMonth() + 1,
      birthDate.getDate(),
      null,
      gender,
      currentPillar.stem,
      monthPillar.stem,
      monthPillar.branch
    );

    const pillars: DaeunPillar[] = analysis.daeunList.map((d: Daeun) => ({
      startYear: d.startAge + birthDate.getFullYear() - 1,
      endYear: d.endAge + birthDate.getFullYear() - 1,
      age: d.startAge,
      stem: d.gan,
      branch: d.ji,
      score: d.score,
      description: d.description,
    }));

    const currentYear = new Date().getFullYear();
    const currentIndex = pillars.findIndex(
      (p) => currentYear >= p.startYear && currentYear <= p.endYear
    );

    return {
      pillars,
      currentDaeun:
        currentIndex >= 0
          ? { pillar: pillars[currentIndex], yearIndex: currentIndex }
          : null,
      analysis,
    };
  }, [sajuResult, birthDate, gender]);
}
