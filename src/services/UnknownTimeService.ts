/**
 * 시간 모름 고도화 서비스
 * - 시간을 모르는 사용자를 위한 추정/분석 기능
 * - 12시주별 운세 미리보기
 * - 시간 추정 힌트 제공
 */

import { FourPillars, Pillar, SajuResult, Element } from '../types';
import { SajuCalculator } from './SajuCalculator';
import { HEAVENLY_STEMS, EARTHLY_BRANCHES, HIDDEN_STEMS } from '../data/saju';

// 12시진 정보
export const TWELVE_HOURS = [
  { branch: '자', time: '23:00-01:00', animal: '쥐', element: 'water', traits: '지혜, 시작' },
  { branch: '축', time: '01:00-03:00', animal: '소', element: 'earth', traits: '성실, 인내' },
  { branch: '인', time: '03:00-05:00', animal: '호랑이', element: 'wood', traits: '용기, 진취' },
  { branch: '묘', time: '05:00-07:00', animal: '토끼', element: 'wood', traits: '유연, 평화' },
  { branch: '진', time: '07:00-09:00', animal: '용', element: 'earth', traits: '권위, 야망' },
  { branch: '사', time: '09:00-11:00', animal: '뱀', element: 'fire', traits: '지혜, 통찰' },
  { branch: '오', time: '11:00-13:00', animal: '말', element: 'fire', traits: '열정, 활력' },
  { branch: '미', time: '13:00-15:00', animal: '양', element: 'earth', traits: '온화, 예술' },
  { branch: '신', time: '15:00-17:00', animal: '원숭이', element: 'metal', traits: '재치, 융통' },
  { branch: '유', time: '17:00-19:00', animal: '닭', element: 'metal', traits: '정확, 성실' },
  { branch: '술', time: '19:00-21:00', animal: '개', element: 'earth', traits: '충성, 정의' },
  { branch: '해', time: '21:00-23:00', animal: '돼지', element: 'water', traits: '풍요, 관대' },
];

// 시간 추정 질문
export const TIME_ESTIMATION_QUESTIONS = [
  {
    id: 'energy_peak',
    question: '하루 중 가장 에너지가 넘치는 시간대는?',
    options: [
      { label: '새벽~아침 (03:00-09:00)', hint: ['인', '묘', '진'] },
      { label: '아침~점심 (09:00-13:00)', hint: ['사', '오'] },
      { label: '점심~저녁 (13:00-19:00)', hint: ['미', '신', '유'] },
      { label: '저녁~밤 (19:00-01:00)', hint: ['술', '해', '자'] },
      { label: '밤~새벽 (01:00-03:00)', hint: ['축'] },
    ],
  },
  {
    id: 'personality_type',
    question: '자신의 성격을 가장 잘 표현하는 것은?',
    options: [
      { label: '지적이고 분석적인 편', hint: ['자', '사'] },
      { label: '성실하고 꾸준한 편', hint: ['축', '유'] },
      { label: '적극적이고 도전적인 편', hint: ['인', '오'] },
      { label: '온화하고 협력적인 편', hint: ['묘', '미'] },
      { label: '야심차고 리더십 있는 편', hint: ['진'] },
      { label: '재치있고 적응력 좋은 편', hint: ['신'] },
      { label: '의리있고 정직한 편', hint: ['술'] },
      { label: '관대하고 여유로운 편', hint: ['해'] },
    ],
  },
  {
    id: 'decision_style',
    question: '중요한 결정을 내릴 때의 스타일은?',
    options: [
      { label: '직감과 영감을 따름', hint: ['자', '해'] },
      { label: '신중하게 오래 고민함', hint: ['축', '미'] },
      { label: '과감하게 빠르게 결정', hint: ['인', '오'] },
      { label: '주변 의견을 참고함', hint: ['묘', '유'] },
      { label: '논리적으로 분석 후 결정', hint: ['진', '사'] },
      { label: '상황에 따라 유연하게', hint: ['신', '술'] },
    ],
  },
];

// 시주별 특성 상세
export interface HourPillarAnalysis {
  branch: string;
  animal: string;
  timeRange: string;
  traits: string;
  element: Element;
  stemOptions: string[]; // 일간에 따른 가능한 시간
  personality: string;
  career: string;
  health: string;
  luckyColor: string;
}

/**
 * 일간에 따른 12시주 전체 분석
 */
export function analyzeAllHourPillars(
  dayStem: string,
  birthDate: string
): HourPillarAnalysis[] {
  const dayStemIndex = HEAVENLY_STEMS.findIndex(s => s.korean === dayStem);
  if (dayStemIndex === -1) return [];

  // 시간 시작 공식: 갑기일->갑자시, 을경일->병자시, 병신일->무자시, 정임일->경자시, 무계일->임자시
  const hourStemStartIndex = (dayStemIndex % 5) * 2;

  return TWELVE_HOURS.map((hour, branchIndex) => {
    const stemIndex = (hourStemStartIndex + branchIndex) % 10;
    const stem = HEAVENLY_STEMS[stemIndex].korean;

    const branchInfo = EARTHLY_BRANCHES.find(b => b.korean === hour.branch);

    return {
      branch: hour.branch,
      animal: hour.animal,
      timeRange: hour.time,
      traits: hour.traits,
      element: (branchInfo?.element || 'earth') as Element,
      stemOptions: [stem],
      personality: getHourPersonality(hour.branch),
      career: getHourCareer(hour.branch),
      health: getHourHealth(hour.branch),
      luckyColor: getHourLuckyColor(hour.branch),
    };
  });
}

/**
 * 시주별 성격 특성
 */
function getHourPersonality(branch: string): string {
  const personalities: Record<string, string> = {
    '자': '직관력이 뛰어나고 새로운 시작에 강합니다. 밤에 더 창의적인 아이디어가 떠오릅니다.',
    '축': '끈기와 인내심이 강합니다. 한 번 시작한 일은 끝까지 해내는 성실함이 있습니다.',
    '인': '진취적이고 도전을 두려워하지 않습니다. 리더십과 추진력이 뛰어납니다.',
    '묘': '섬세하고 평화를 사랑합니다. 예술적 감각과 협상 능력이 좋습니다.',
    '진': '야망이 크고 권위가 있습니다. 큰 목표를 세우고 달성하는 능력이 있습니다.',
    '사': '지혜롭고 통찰력이 있습니다. 복잡한 문제를 분석하는 능력이 뛰어납니다.',
    '오': '열정적이고 활동적입니다. 사람들에게 에너지를 주는 밝은 성격입니다.',
    '미': '예술적 감각이 뛰어나고 온화합니다. 창작 활동에서 재능을 발휘합니다.',
    '신': '재치와 융통성이 있습니다. 변화에 빠르게 적응하고 기회를 잡습니다.',
    '유': '정확하고 꼼꼼합니다. 디테일에 강하고 완벽주의 성향이 있습니다.',
    '술': '의리와 정의감이 강합니다. 신뢰할 수 있는 친구이자 동료입니다.',
    '해': '관대하고 여유롭습니다. 물질적으로도 정신적으로도 풍요로운 삶을 추구합니다.',
  };
  return personalities[branch] || '';
}

/**
 * 시주별 적합 직업
 */
function getHourCareer(branch: string): string {
  const careers: Record<string, string> = {
    '자': '연구원, 기획자, 작가, 프로그래머, 야간 업무',
    '축': '금융, 농업, 부동산, 관리직, 장기 프로젝트',
    '인': '경영, 스포츠, 군/경찰, 스타트업, 모험적 직종',
    '묘': '예술가, 디자이너, 상담사, 외교관, 서비스업',
    '진': 'CEO, 정치인, 건축가, 대규모 사업, 공공기관',
    '사': '학자, 전략가, 의사, 변호사, 분석가',
    '오': '연예인, 마케터, 영업, 이벤트, 교육',
    '미': '예술가, 요리사, 패션, 인테리어, 콘텐츠 제작',
    '신': '기술직, 발명가, 무역, IT, 컨설팅',
    '유': '회계사, 품질관리, 감정사, 정밀 기술직, 미용',
    '술': '법조인, 경비, 보안, 사회복지, 수의사',
    '해': '무역, 유통, 금융, 종교, 여행업',
  };
  return careers[branch] || '';
}

/**
 * 시주별 건강 주의사항
 */
function getHourHealth(branch: string): string {
  const health: Record<string, string> = {
    '자': '신장, 방광 건강에 주의. 충분한 수분 섭취 필요.',
    '축': '비장, 위장 건강에 주의. 규칙적인 식사 중요.',
    '인': '간, 담 건강에 주의. 스트레스 관리 필요.',
    '묘': '간, 담 건강에 주의. 눈 건강도 체크.',
    '진': '비장, 위장 건강에 주의. 과식 주의.',
    '사': '심장, 소장 건강에 주의. 열을 다스려야.',
    '오': '심장, 소장 건강에 주의. 충분한 휴식 필요.',
    '미': '비장, 위장 건강에 주의. 소화기 관리.',
    '신': '폐, 대장 건강에 주의. 호흡기 관리.',
    '유': '폐, 대장 건강에 주의. 피부 건강도 체크.',
    '술': '비장, 위장 건강에 주의. 정기 검진 권장.',
    '해': '신장, 방광 건강에 주의. 혈압 관리.',
  };
  return health[branch] || '';
}

/**
 * 시주별 행운의 색
 */
function getHourLuckyColor(branch: string): string {
  const colors: Record<string, string> = {
    '자': '검정, 남색',
    '축': '노랑, 베이지',
    '인': '초록, 청록',
    '묘': '연두, 민트',
    '진': '황토색, 갈색',
    '사': '빨강, 주황',
    '오': '빨강, 자주',
    '미': '연노랑, 크림',
    '신': '흰색, 은색',
    '유': '흰색, 금색',
    '술': '황갈색, 오렌지',
    '해': '검정, 파랑',
  };
  return colors[branch] || '';
}

/**
 * 시간 추정 점수 계산
 * @param answers 질문별 답변 (branchHints 배열)
 * @returns 각 시지별 점수
 */
export function calculateTimeEstimation(answers: string[][]): Record<string, number> {
  const scores: Record<string, number> = {};

  TWELVE_HOURS.forEach(hour => {
    scores[hour.branch] = 0;
  });

  answers.forEach(hints => {
    hints.forEach(branch => {
      if (scores[branch] !== undefined) {
        scores[branch]++;
      }
    });
  });

  return scores;
}

/**
 * 시간 모름 사용자를 위한 분석 결과
 */
export interface UnknownTimeAnalysis {
  // 시간 없이도 확인 가능한 정보
  availableInfo: string[];
  // 시간이 있어야 정확한 정보
  limitedInfo: string[];
  // 추천 시간 추정 결과 (질문 답변 시)
  estimatedHours?: {
    branch: string;
    score: number;
    confidence: 'high' | 'medium' | 'low';
  }[];
  // 12시주 전체 미리보기
  hourPreviews: HourPillarAnalysis[];
}

/**
 * 시간 모름 사용자 분석
 */
export function analyzeUnknownTime(
  birthDate: string,
  sajuResult: SajuResult,
  timeEstimationAnswers?: string[][]
): UnknownTimeAnalysis {
  const availableInfo = [
    '년주, 월주, 일주 (3주) 분석',
    '일간(나) 성격 특성',
    '오행 분포 (3주 기준)',
    '대운 흐름',
    '년/월/일의 합충 관계',
    '기본 운세 경향',
    '적합한 직업군',
    '연애/결혼 스타일',
  ];

  const limitedInfo = [
    '시주 분석 (정확한 시간 필요)',
    '완전한 오행 균형',
    '자녀/후손 운',
    '노년 운세 상세',
    '시간 기반 길흉 시간대',
    '더 정확한 용신/기신 판단',
  ];

  const hourPreviews = analyzeAllHourPillars(
    sajuResult.pillars.day.stem,
    birthDate
  );

  let estimatedHours: UnknownTimeAnalysis['estimatedHours'] = undefined;

  if (timeEstimationAnswers && timeEstimationAnswers.length > 0) {
    const scores = calculateTimeEstimation(timeEstimationAnswers);
    const maxScore = Math.max(...Object.values(scores));

    estimatedHours = Object.entries(scores)
      .map(([branch, score]) => ({
        branch,
        score,
        confidence: (score >= maxScore * 0.8 ? 'high' :
                    score >= maxScore * 0.5 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  return {
    availableInfo,
    limitedInfo,
    estimatedHours,
    hourPreviews,
  };
}

/**
 * 시간 모름 사용자용 간략 운세
 */
export function getUnknownTimeFortune(sajuResult: SajuResult): {
  canProvide: string[];
  limitedAccuracy: string[];
  recommendation: string;
} {
  return {
    canProvide: [
      '오늘의 전반적인 운세 흐름',
      '대인 관계 조언',
      '금전 운 경향',
      '건강 주의사항 (일주 기준)',
      '행운의 방향/색상',
    ],
    limitedAccuracy: [
      '시간대별 길흉 (시주 없이는 일반적 조언만 가능)',
      '자녀/후손 관련 운세',
      '저녁~밤 시간대 운세 정확도',
    ],
    recommendation:
      '출생 시간을 알게 되시면 설정에서 업데이트해주세요. ' +
      '더 정확하고 상세한 운세를 받아보실 수 있습니다.',
  };
}
