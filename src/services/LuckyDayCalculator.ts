/**
 * 길일(吉日) 계산 서비스 (Phase 1-2)
 * 앞으로 14일간의 길흉 + 이벤트별 길일 추천
 */

import { SajuResult } from '../types';
import { getDayGanji } from './MonthlyDailyFortune';
import { getTenGod, stemToElement } from '../utils/elementConverter';
import { analyzeDayMasterStrength, analyzeYongsin } from './AdvancedSajuAnalysis';

const BRANCH_HARMONY: Record<string, string> = {
  '자': '축', '축': '자', '인': '해', '해': '인',
  '묘': '술', '술': '묘', '진': '유', '유': '진',
  '사': '신', '신': '사', '오': '미', '미': '오',
};

const BRANCH_CLASH: Record<string, string> = {
  '자': '오', '오': '자', '축': '미', '미': '축',
  '인': '신', '신': '인', '묘': '유', '유': '묘',
  '진': '술', '술': '진', '사': '해', '해': '사',
};

// 도화살: 인오술→묘, 사유축→오, 신자진→유, 해묘미→자
const DOHUA: Record<string, string> = {
  '인': '묘', '오': '묘', '술': '묘',
  '사': '오', '유': '오', '축': '오',
  '신': '유', '자': '유', '진': '유',
  '해': '자', '묘': '자', '미': '자',
};

// 역마살
const YEOKMA: Record<string, string> = {
  '인': '신', '오': '신', '술': '신',
  '사': '해', '유': '해', '축': '해',
  '신': '인', '자': '인', '진': '인',
  '해': '사', '묘': '사', '미': '사',
};

export interface DailyLuck {
  date: Date;
  dateStr: string;       // 4/5 (토)
  ganJi: string;         // 정미
  score: number;
  grade: string;         // 대길/길/보통/주의/흉
  emoji: string;
  reason: string;        // 명리학적 근거 한 줄
  eventTags: string[];   // ['결혼', '계약', ...]
}

export interface LuckyDays {
  next14Days: DailyLuck[];
  byEvent: {
    marriage: DailyLuck | null;     // 결혼/약혼 (육합 + 정관)
    moving: DailyLuck | null;       // 이사 (역마살 + 길일)
    contract: DailyLuck | null;     // 계약 (정관 + 정재)
    exam: DailyLuck | null;         // 시험 (정인 + 식신)
    meeting: DailyLuck | null;      // 만남/연애 (도화 + 식신)
  };
  nextBestDay: DailyLuck | null;    // 앞으로 가장 좋은 날
  nextBestDday: number;             // D-Day
}

function formatDateStr(date: Date): string {
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  return `${date.getMonth() + 1}/${date.getDate()} (${dayOfWeek})`;
}

function getGrade(score: number): string {
  if (score >= 80) return '대길';
  if (score >= 60) return '길';
  if (score >= 45) return '보통';
  if (score >= 30) return '주의';
  return '흉';
}

function getEmoji(score: number): string {
  if (score >= 80) return '⭐';
  if (score >= 65) return '🌸';
  if (score >= 50) return '🌿';
  if (score >= 35) return '⛅';
  return '🌧️';
}

function calculateDayScore(sajuResult: SajuResult, date: Date): { score: number; reason: string; tags: string[]; tenGod: string; ganji: { stem: string; branch: string } } {
  const ganji = getDayGanji(date);
  const tenGod = getTenGod(sajuResult.dayMaster, ganji.stem);
  const myDayBranch = sajuResult.pillars.day.branch;

  // 기본 점수 (십신별)
  const baseScores: Record<string, number> = {
    '비견': 65, '겁재': 45, '식신': 80, '상관': 55,
    '편재': 78, '정재': 72, '편관': 40, '정관': 75,
    '편인': 58, '정인': 73,
  };
  let score = baseScores[tenGod] || 60;
  const reasons: string[] = [];
  const tags: string[] = [];

  // 지지 합/충
  if (BRANCH_HARMONY[myDayBranch] === ganji.branch) {
    score += 10;
    reasons.push('조화의 날');
    tags.push('marriage', 'meeting');
  }
  if (BRANCH_CLASH[myDayBranch] === ganji.branch) {
    score -= 15;
    reasons.push('충돌의 날');
  }

  // 신살
  if (DOHUA[myDayBranch] === ganji.branch) {
    score += 5;
    tags.push('meeting');
  }
  if (YEOKMA[myDayBranch] === ganji.branch) {
    tags.push('moving');
  }

  // 용신 보정
  try {
    const dayMasterStrength = analyzeDayMasterStrength(sajuResult.pillars, sajuResult.elements);
    const yongsinResult = analyzeYongsin(sajuResult.pillars, sajuResult.elements, dayMasterStrength);
    const stemEl = stemToElement(ganji.stem);
    if (stemEl) {
      if (yongsinResult.yongsin.includes(stemEl as any)) score += 12;
      else if (yongsinResult.heeshin.includes(stemEl as any)) score += 6;
      else if (yongsinResult.gushin.includes(stemEl as any)) score -= 6;
      else if (yongsinResult.gishin.includes(stemEl as any)) score -= 12;
    }
  } catch (e) {
    // 용신 분석 실패 시 무시
  }

  // 이벤트별 태그 추가
  if (tenGod === '정관' || tenGod === '정재') tags.push('contract');
  if (tenGod === '정인' || tenGod === '식신') tags.push('exam');

  score = Math.max(20, Math.min(98, score));
  if (reasons.length === 0) {
    reasons.push(`${tenGod}의 날`);
  }

  return { score, reason: reasons.join(' · '), tags, tenGod, ganji };
}

export function calculateLuckyDays(sajuResult: SajuResult, fromDate: Date = new Date()): LuckyDays {
  const next14Days: DailyLuck[] = [];
  const eventCandidates: Record<string, DailyLuck[]> = {
    marriage: [], moving: [], contract: [], exam: [], meeting: [],
  };

  // 앞으로 14일 계산
  for (let i = 0; i < 14; i++) {
    const d = new Date(fromDate);
    d.setDate(d.getDate() + i);
    const result = calculateDayScore(sajuResult, d);
    const luck: DailyLuck = {
      date: d,
      dateStr: formatDateStr(d),
      ganJi: result.ganji.stem + result.ganji.branch,
      score: result.score,
      grade: getGrade(result.score),
      emoji: getEmoji(result.score),
      reason: result.reason,
      eventTags: result.tags,
    };
    next14Days.push(luck);

    // 이벤트별 후보 누적 (점수 60 이상만)
    if (luck.score >= 60) {
      result.tags.forEach(tag => {
        if (eventCandidates[tag]) eventCandidates[tag].push(luck);
      });
    }
  }

  // 이벤트별 가장 좋은 날 1개씩
  const byEvent = {
    marriage: pickBest(eventCandidates.marriage),
    moving: pickBest(eventCandidates.moving),
    contract: pickBest(eventCandidates.contract),
    exam: pickBest(eventCandidates.exam),
    meeting: pickBest(eventCandidates.meeting),
  };

  // 앞으로 가장 좋은 날 (오늘 제외)
  const futureBest = next14Days.slice(1).sort((a, b) => b.score - a.score)[0] || null;
  const nextBestDday = futureBest ? Math.floor((futureBest.date.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return {
    next14Days,
    byEvent,
    nextBestDay: futureBest,
    nextBestDday,
  };
}

function pickBest(candidates: DailyLuck[]): DailyLuck | null {
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => b.score - a.score)[0];
}
