/**
 * 시간대별 운세 서비스
 * 오전/오후/저녁 시간대에 따른 맞춤 운세 제공
 */

import { Element } from '../types';

// 시간대 정의
export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

// 시간대별 운세 인터페이스
export interface TimeBasedFortune {
  timeSlot: TimeSlot;
  timeSlotName: string;
  timeRange: string;
  emoji: string;
  score: number;           // 해당 시간대 점수
  message: string;         // 메인 메시지
  activity: string;        // 추천 활동
  caution: string;         // 주의사항
  luckyHour: string;       // 이 시간대의 행운 시간
  energy: 'high' | 'medium' | 'low';
}

// 현재 시간대 확인
export function getCurrentTimeSlot(): TimeSlot {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

// 시간대 이름 반환
export function getTimeSlotName(slot: TimeSlot): string {
  switch (slot) {
    case 'morning': return '오전';
    case 'afternoon': return '오후';
    case 'evening': return '저녁';
    case 'night': return '밤';
  }
}

// 시간대 범위 반환
export function getTimeRange(slot: TimeSlot): string {
  switch (slot) {
    case 'morning': return '오전 6시 ~ 12시';
    case 'afternoon': return '오후 12시 ~ 6시';
    case 'evening': return '저녁 6시 ~ 10시';
    case 'night': return '밤 10시 ~ 오전 6시';
  }
}

// 시간대 이모지 반환
export function getTimeSlotEmoji(slot: TimeSlot): string {
  switch (slot) {
    case 'morning': return '🌅';
    case 'afternoon': return '☀️';
    case 'evening': return '🌆';
    case 'night': return '🌙';
  }
}

// 오행별 시간대 운세 데이터
const TIME_FORTUNE_DATA: Record<Element, Record<TimeSlot, Omit<TimeBasedFortune, 'timeSlot' | 'timeSlotName' | 'timeRange' | 'emoji'>>> = {
  wood: {
    morning: {
      score: 88,
      message: '나무의 기운이 가장 강한 시간입니다. 새로운 시작과 성장에 최적의 시간이에요.',
      activity: '새 프로젝트 시작, 운동, 학습',
      caution: '과욕을 부리면 에너지가 빨리 소모됩니다',
      luckyHour: '오전 7시-9시',
      energy: 'high',
    },
    afternoon: {
      score: 65,
      message: '오전의 에너지가 점차 빠져나가는 시간입니다. 무리하지 마세요.',
      activity: '기획 회의, 글쓰기, 문서 작업',
      caution: '점심 후 졸음과 집중력 저하에 주의',
      luckyHour: '오후 1시-3시',
      energy: 'medium',
    },
    evening: {
      score: 45,
      message: '나무의 기운이 크게 약해지는 시간입니다. 무리한 약속은 피하세요.',
      activity: '가벼운 스트레칭, 내일 준비',
      caution: '저녁 약속에서 실언하기 쉬워요. 말조심하세요',
      luckyHour: '저녁 7시-8시',
      energy: 'low',
    },
    night: {
      score: 35,
      message: '나무의 기운이 완전히 쉬는 시간입니다. 억지로 버티지 마세요.',
      activity: '수면, 휴식만 하세요',
      caution: '밤늦게 내리는 결정은 후회할 가능성이 높습니다',
      luckyHour: '밤 10시-11시',
      energy: 'low',
    },
  },
  fire: {
    morning: {
      score: 55,
      message: '불의 기운이 아직 약한 시간입니다. 서두르면 실수가 생겨요.',
      activity: '가벼운 준비, 차분한 계획 세우기',
      caution: '아침에 급하게 움직이면 사고 위험이 있어요',
      luckyHour: '오전 9시-11시',
      energy: 'low',
    },
    afternoon: {
      score: 92,
      message: '불의 기운이 절정인 시간입니다! 열정을 마음껏 발휘하세요.',
      activity: '프레젠테이션, 미팅, 협상',
      caution: '과열되지 않도록 수분 섭취를 충분히',
      luckyHour: '오후 2시-4시',
      energy: 'high',
    },
    evening: {
      score: 70,
      message: '열정이 부드럽게 이어지는 시간입니다.',
      activity: '친구 만남, 데이트, 문화 활동',
      caution: '감정이 과열되면 싸움으로 번질 수 있어요',
      luckyHour: '저녁 6시-8시',
      energy: 'medium',
    },
    night: {
      score: 30,
      message: '불이 꺼지는 위험한 시간입니다. 무조건 쉬세요.',
      activity: '수면 준비만 하세요',
      caution: '밤늦게 흥분하면 불면증이 올 수 있어요. 자극 금지',
      luckyHour: '밤 9시-10시',
      energy: 'low',
    },
  },
  earth: {
    morning: {
      score: 75,
      message: '흙의 기운이 안정적으로 깨어나는 시간입니다.',
      activity: '규칙적인 루틴, 건강한 아침 식사',
      caution: '급한 변화보다 꾸준함이 좋아요',
      luckyHour: '오전 7시-9시',
      energy: 'medium',
    },
    afternoon: {
      score: 82,
      message: '토의 기운이 든든하게 버티는 시간입니다. 실질적인 성과를 내세요.',
      activity: '업무 마무리, 재정 관리, 정리 정돈',
      caution: '점심 과식은 피하세요',
      luckyHour: '오후 1시-3시',
      energy: 'high',
    },
    evening: {
      score: 60,
      message: '안정감은 유지되지만 에너지가 줄어드는 시간입니다.',
      activity: '가족과 시간 보내기, 집 정리',
      caution: '저녁 늦게 큰 결정은 판단력이 흐려져 위험합니다',
      luckyHour: '저녁 7시-9시',
      energy: 'medium',
    },
    night: {
      score: 40,
      message: '흙의 기운이 무겁게 가라앉는 밤입니다. 일찍 쉬세요.',
      activity: '편안한 휴식, 수면',
      caution: '야식은 소화불량과 체중 증가의 원인이 됩니다',
      luckyHour: '밤 10시-11시',
      energy: 'low',
    },
  },
  metal: {
    morning: {
      score: 50,
      message: '금의 기운이 아직 날이 서지 않은 시간입니다.',
      activity: '정리 정돈, 계획 점검',
      caution: '아침부터 날카롭게 굴면 하루 종일 갈등이 이어져요',
      luckyHour: '오전 8시-10시',
      energy: 'low',
    },
    afternoon: {
      score: 78,
      message: '금의 기운으로 날카로운 판단력이 빛납니다.',
      activity: '분석 업무, 결정 내리기, 정산',
      caution: '너무 완벽을 추구하면 스트레스와 갈등이 생겨요',
      luckyHour: '오후 3시-5시',
      energy: 'high',
    },
    evening: {
      score: 85,
      message: '금의 기운이 정제되는 저녁입니다. 결실을 정리하세요.',
      activity: '성과 정리, 감사 표현, 자기 반성',
      caution: '비판적 언행은 관계를 해칠 수 있어요',
      luckyHour: '저녁 6시-8시',
      energy: 'high',
    },
    night: {
      score: 38,
      message: '금의 기운이 차갑게 식는 밤입니다. 외로움에 주의하세요.',
      activity: '조용한 휴식, 수면',
      caution: '밤에 날카로운 말을 하면 돌이킬 수 없습니다',
      luckyHour: '밤 9시-10시',
      energy: 'low',
    },
  },
  water: {
    morning: {
      score: 42,
      message: '물의 기운이 아직 잠에서 깨지 못한 시간입니다. 서두르지 마세요.',
      activity: '가볍게 시작하기, 물 많이 마시기',
      caution: '아침에 무리하면 하루 종일 피곤하고 실수가 잦아요',
      luckyHour: '오전 9시-11시',
      energy: 'low',
    },
    afternoon: {
      score: 62,
      message: '물의 기운이 자유롭게 흐르지만 방향을 잃기 쉬운 시간입니다.',
      activity: '창의적 작업, 브레인스토밍',
      caution: '집중력이 분산되어 중요한 일을 놓칠 수 있어요',
      luckyHour: '오후 2시-4시',
      energy: 'medium',
    },
    evening: {
      score: 78,
      message: '물의 기운이 깊어지는 저녁입니다.',
      activity: '깊은 대화, 자기 성찰',
      caution: '감정에 깊이 빠지면 우울해질 수 있어요',
      luckyHour: '저녁 7시-9시',
      energy: 'medium',
    },
    night: {
      score: 90,
      message: '물의 기운이 가장 강한 밤입니다. 지혜와 직관이 빛나요.',
      activity: '독서, 학습, 명상, 창작',
      caution: '밤새 깨어 있으면 건강을 해칩니다. 적정 시간에 취침하세요',
      luckyHour: '밤 10시-자정',
      energy: 'high',
    },
  },
};

/**
 * 시간대별 운세 가져오기
 */
export function getTimeBasedFortune(
  dayElement: Element,
  timeSlot?: TimeSlot
): TimeBasedFortune {
  const slot = timeSlot || getCurrentTimeSlot();
  const data = TIME_FORTUNE_DATA[dayElement][slot];

  return {
    timeSlot: slot,
    timeSlotName: getTimeSlotName(slot),
    timeRange: getTimeRange(slot),
    emoji: getTimeSlotEmoji(slot),
    ...data,
  };
}

/**
 * 오늘의 전체 시간대 운세 가져오기
 */
export function getAllTimeBasedFortunes(dayElement: Element): TimeBasedFortune[] {
  const slots: TimeSlot[] = ['morning', 'afternoon', 'evening', 'night'];
  return slots.map(slot => getTimeBasedFortune(dayElement, slot));
}

/**
 * 가장 좋은 시간대 찾기
 */
export function getBestTimeSlot(dayElement: Element): TimeBasedFortune {
  const all = getAllTimeBasedFortunes(dayElement);
  return all.reduce((best, current) =>
    current.score > best.score ? current : best
  );
}

/**
 * 현재 시간대 점수 가져오기
 */
export function getCurrentTimeScore(dayElement: Element): number {
  const current = getTimeBasedFortune(dayElement);
  return current.score;
}

export default {
  getCurrentTimeSlot,
  getTimeSlotName,
  getTimeRange,
  getTimeSlotEmoji,
  getTimeBasedFortune,
  getAllTimeBasedFortunes,
  getBestTimeSlot,
  getCurrentTimeScore,
};
