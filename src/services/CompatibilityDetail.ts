/**
 * 궁합 상세 분석 서비스
 * 천간합, 지지합, 충, 형, 해 등 다양한 관계를 분석합니다.
 */

// 천간
const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
// 지지
const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

// 천간 오행
const STEM_ELEMENT: Record<string, string> = {
  '갑': '목', '을': '목', '병': '화', '정': '화', '무': '토',
  '기': '토', '경': '금', '신': '금', '임': '수', '계': '수',
};

// 지지 오행
const BRANCH_ELEMENT: Record<string, string> = {
  '자': '수', '축': '토', '인': '목', '묘': '목', '진': '토', '사': '화',
  '오': '화', '미': '토', '신': '금', '유': '금', '술': '토', '해': '수',
};

// ============================================
// 1. 천간합 (天干合) - 성격 궁합
// ============================================

const STEM_HARMONY: Record<string, { partner: string; result: string; meaning: string }> = {
  '갑': { partner: '기', result: '토', meaning: '갑기합토(甲己合土) - 리더와 조력자가 만나 안정을 이룸' },
  '을': { partner: '경', result: '금', meaning: '을경합금(乙庚合金) - 부드러움과 강함이 만나 결실을 맺음' },
  '병': { partner: '신', result: '수', meaning: '병신합수(丙辛合水) - 열정과 세련됨이 만나 지혜가 됨' },
  '정': { partner: '임', result: '목', meaning: '정임합목(丁壬合木) - 따뜻함과 깊음이 만나 성장함' },
  '무': { partner: '계', result: '화', meaning: '무계합화(戊癸合火) - 포용과 감성이 만나 열정이 됨' },
  '기': { partner: '갑', result: '토', meaning: '갑기합토(甲己合土) - 조력자와 리더가 만나 안정을 이룸' },
  '경': { partner: '을', result: '금', meaning: '을경합금(乙庚合金) - 강함과 부드러움이 만나 결실을 맺음' },
  '신': { partner: '병', result: '수', meaning: '병신합수(丙辛合水) - 세련됨과 열정이 만나 지혜가 됨' },
  '임': { partner: '정', result: '목', meaning: '정임합목(丁壬合木) - 깊음과 따뜻함이 만나 성장함' },
  '계': { partner: '무', result: '화', meaning: '무계합화(戊癸合火) - 감성과 포용이 만나 열정이 됨' },
};

// ============================================
// 2. 지지 육합 (六合) - 인연의 깊이
// ============================================

const BRANCH_YUKAP: Record<string, { partner: string; result: string; meaning: string }> = {
  '자': { partner: '축', result: '토', meaning: '자축합토(子丑合土) - 지혜와 성실이 만나 안정을 이룸' },
  '인': { partner: '해', result: '목', meaning: '인해합목(寅亥合木) - 진취성과 지혜가 만나 성장함' },
  '묘': { partner: '술', result: '화', meaning: '묘술합화(卯戌合火) - 온화함과 의리가 만나 열정이 됨' },
  '진': { partner: '유', result: '금', meaning: '진유합금(辰酉合金) - 포용과 결단이 만나 결실을 맺음' },
  '사': { partner: '신', result: '수', meaning: '사신합수(巳申合水) - 지혜와 활동이 만나 흐름이 됨' },
  '오': { partner: '미', result: '화/토', meaning: '오미합(午未合) - 열정과 온화가 만나 풍요로움' },
  '축': { partner: '자', result: '토', meaning: '자축합토(子丑合土) - 성실과 지혜가 만나 안정을 이룸' },
  '해': { partner: '인', result: '목', meaning: '인해합목(寅亥合木) - 지혜와 진취성이 만나 성장함' },
  '술': { partner: '묘', result: '화', meaning: '묘술합화(卯戌合火) - 의리와 온화함이 만나 열정이 됨' },
  '유': { partner: '진', result: '금', meaning: '진유합금(辰酉合金) - 결단과 포용이 만나 결실을 맺음' },
  '신': { partner: '사', result: '수', meaning: '사신합수(巳申合水) - 활동과 지혜가 만나 흐름이 됨' },
  '미': { partner: '오', result: '화/토', meaning: '오미합(午未合) - 온화와 열정이 만나 풍요로움' },
};

// ============================================
// 3. 지지 삼합 (三合) - 팀워크
// ============================================

const BRANCH_SAMHAP: Record<string, { group: string[]; element: string; meaning: string }> = {
  '신': { group: ['신', '자', '진'], element: '수', meaning: '신자진 수국(水局) - 지혜와 유연함의 조화' },
  '자': { group: ['신', '자', '진'], element: '수', meaning: '신자진 수국(水局) - 지혜와 유연함의 조화' },
  '진': { group: ['신', '자', '진'], element: '수', meaning: '신자진 수국(水局) - 지혜와 유연함의 조화' },
  '해': { group: ['해', '묘', '미'], element: '목', meaning: '해묘미 목국(木局) - 성장과 발전의 조화' },
  '묘': { group: ['해', '묘', '미'], element: '목', meaning: '해묘미 목국(木局) - 성장과 발전의 조화' },
  '미': { group: ['해', '묘', '미'], element: '목', meaning: '해묘미 목국(木局) - 성장과 발전의 조화' },
  '인': { group: ['인', '오', '술'], element: '화', meaning: '인오술 화국(火局) - 열정과 활력의 조화' },
  '오': { group: ['인', '오', '술'], element: '화', meaning: '인오술 화국(火局) - 열정과 활력의 조화' },
  '술': { group: ['인', '오', '술'], element: '화', meaning: '인오술 화국(火局) - 열정과 활력의 조화' },
  '사': { group: ['사', '유', '축'], element: '금', meaning: '사유축 금국(金局) - 결단과 실행의 조화' },
  '유': { group: ['사', '유', '축'], element: '금', meaning: '사유축 금국(金局) - 결단과 실행의 조화' },
  '축': { group: ['사', '유', '축'], element: '금', meaning: '사유축 금국(金局) - 결단과 실행의 조화' },
};

// ============================================
// 4. 지지 충 (沖) - 갈등 포인트
// ============================================

const BRANCH_CHUNG: Record<string, { partner: string; meaning: string; advice: string }> = {
  '자': { partner: '오', meaning: '자오충(子午沖) - 물과 불의 대립', advice: '감정과 열정의 균형이 필요해요' },
  '축': { partner: '미', meaning: '축미충(丑未沖) - 토끼리의 대립', advice: '고집을 내려놓으면 풀려요' },
  '인': { partner: '신', meaning: '인신충(寅申沖) - 나무와 쇠의 대립', advice: '서로의 방식을 인정하세요' },
  '묘': { partner: '유', meaning: '묘유충(卯酉沖) - 나무와 쇠의 대립', advice: '부드러움과 단호함의 조화' },
  '진': { partner: '술', meaning: '진술충(辰戌沖) - 용과 개의 대립', advice: '서로의 영역을 존중하세요' },
  '사': { partner: '해', meaning: '사해충(巳亥沖) - 뱀과 돼지의 대립', advice: '느린 것과 빠른 것의 조화' },
  '오': { partner: '자', meaning: '자오충(子午沖) - 불과 물의 대립', advice: '열정과 이성의 균형' },
  '미': { partner: '축', meaning: '축미충(丑未沖) - 토끼리의 대립', advice: '양보가 관계를 살려요' },
  '신': { partner: '인', meaning: '인신충(寅申沖) - 쇠와 나무의 대립', advice: '실행력의 방향을 맞추세요' },
  '유': { partner: '묘', meaning: '묘유충(卯酉沖) - 쇠와 나무의 대립', advice: '날카로움을 부드럽게' },
  '술': { partner: '진', meaning: '진술충(辰戌沖) - 개와 용의 대립', advice: '주도권 다툼 주의' },
  '해': { partner: '사', meaning: '사해충(巳亥沖) - 돼지와 뱀의 대립', advice: '속도를 맞추세요' },
};

// ============================================
// 5. 지지 형 (刑) - 상처 주는 관계
// ============================================

const BRANCH_HYUNG: Record<string, { type: string; partners: string[]; meaning: string; advice: string }> = {
  '인': { type: '삼형', partners: ['사', '신'], meaning: '인사신 삼형(三刑)', advice: '서로 상처주기 쉬워 거리두기 필요' },
  '사': { type: '삼형', partners: ['인', '신'], meaning: '인사신 삼형(三刑)', advice: '말조심, 다툼 주의' },
  '신': { type: '삼형', partners: ['인', '사'], meaning: '인사신 삼형(三刑)', advice: '감정 조절이 중요해요' },
  '축': { type: '삼형', partners: ['술', '미'], meaning: '축술미 삼형(三刑)', advice: '고집 부리면 관계가 악화돼요' },
  '술': { type: '삼형', partners: ['축', '미'], meaning: '축술미 삼형(三刑)', advice: '서로 양보가 필요해요' },
  '미': { type: '삼형', partners: ['축', '술'], meaning: '축술미 삼형(三刑)', advice: '상대방 입장에서 생각하세요' },
  '자': { type: '무례지형', partners: ['묘'], meaning: '자묘형(子卯刑)', advice: '예의를 지키면 괜찮아요' },
  '묘': { type: '무례지형', partners: ['자'], meaning: '자묘형(子卯刑)', advice: '상대 의견 무시하지 마세요' },
};

// ============================================
// 6. 지지 해 (害) - 방해 관계
// ============================================

const BRANCH_HAE: Record<string, { partner: string; meaning: string; advice: string }> = {
  '자': { partner: '미', meaning: '자미해(子未害)', advice: '겉으로는 좋아 보여도 속으로 방해해요' },
  '축': { partner: '오', meaning: '축오해(丑午害)', advice: '서로의 성공을 질투할 수 있어요' },
  '인': { partner: '사', meaning: '인사해(寅巳害)', advice: '믿었던 사람에게 배신당할 수 있어요' },
  '묘': { partner: '진', meaning: '묘진해(卯辰害)', advice: '사소한 일로 감정이 상해요' },
  '신': { partner: '해', meaning: '신해해(申亥害)', advice: '이해관계가 엇갈려요' },
  '유': { partner: '술', meaning: '유술해(酉戌害)', advice: '작은 오해가 큰 갈등이 돼요' },
  '미': { partner: '자', meaning: '자미해(子未害)', advice: '가까운 사이에 상처를 줘요' },
  '오': { partner: '축', meaning: '축오해(丑午害)', advice: '경쟁 관계가 되기 쉬워요' },
  '사': { partner: '인', meaning: '인사해(寅巳害)', advice: '신뢰를 쌓는 데 시간이 걸려요' },
  '진': { partner: '묘', meaning: '묘진해(卯辰害)', advice: '말 한마디에 상처받아요' },
  '해': { partner: '신', meaning: '신해해(申亥害)', advice: '협력보다 경쟁이 되기 쉬워요' },
  '술': { partner: '유', meaning: '유술해(酉戌害)', advice: '오해가 쌓이지 않게 소통하세요' },
};

// ============================================
// 궁합 분석 결과 타입
// ============================================

export interface CompatibilityRelation {
  type: string;
  found: boolean;
  location: string;
  detail: string;
  effect: 'good' | 'bad' | 'neutral';
  score: number; // -20 ~ +20
  advice: string;
}

export interface DetailedCompatibility {
  totalScore: number; // 0~100
  grade: string; // 천생연분, 좋은 인연, 보통, 주의 필요, 어려운 인연
  summary: string;
  stemAnalysis: CompatibilityRelation[]; // 천간 분석
  branchAnalysis: CompatibilityRelation[]; // 지지 분석
  strengths: string[]; // 장점
  challenges: string[]; // 도전 과제
  advice: string; // 종합 조언
  simpleInterpretation: string; // 쉬운 해석
}

// ============================================
// 궁합 분석 함수
// ============================================

export function analyzeDetailedCompatibility(
  person1Saju: any,
  person2Saju: any,
  person1Profile: any,
  person2Profile: any
): DetailedCompatibility {
  const { pillars: p1 } = person1Saju;
  const { pillars: p2 } = person2Saju;

  const stemAnalysis: CompatibilityRelation[] = [];
  const branchAnalysis: CompatibilityRelation[] = [];
  const strengths: string[] = [];
  const challenges: string[] = [];

  let baseScore = 50;

  // 천간 분석 (일간 중심)
  const day1Stem = p1.day.stem;
  const day2Stem = p2.day.stem;

  // 천간합 체크
  const stemHarmony = STEM_HARMONY[day1Stem];
  if (stemHarmony && stemHarmony.partner === day2Stem) {
    stemAnalysis.push({
      type: '천간합',
      found: true,
      location: '일간',
      detail: stemHarmony.meaning,
      effect: 'good',
      score: 15,
      advice: '서로의 부족한 점을 채워주는 최고의 궁합이에요',
    });
    baseScore += 15;
    strengths.push('일간이 천간합으로 성격이 잘 맞아요');
  }

  // 지지 분석 (년지, 월지, 일지, 시지)
  const locations = ['년지', '월지', '일지', '시지'];
  const p1Branches = [p1.year.branch, p1.month.branch, p1.day.branch, p1.hour.branch];
  const p2Branches = [p2.year.branch, p2.month.branch, p2.day.branch, p2.hour.branch];

  // 일지(배우자궁) 분석이 가장 중요
  const day1Branch = p1.day.branch;
  const day2Branch = p2.day.branch;

  // 지지 육합 체크 (일지)
  const yukap = BRANCH_YUKAP[day1Branch];
  if (yukap && yukap.partner === day2Branch) {
    branchAnalysis.push({
      type: '육합',
      found: true,
      location: '일지(배우자궁)',
      detail: yukap.meaning,
      effect: 'good',
      score: 20,
      advice: '전생의 인연처럼 끌리는 최상의 궁합이에요',
    });
    baseScore += 20;
    strengths.push('배우자궁이 육합으로 깊은 인연이에요');
  }

  // 지지 충 체크 (일지)
  const chung = BRANCH_CHUNG[day1Branch];
  if (chung && chung.partner === day2Branch) {
    branchAnalysis.push({
      type: '충',
      found: true,
      location: '일지(배우자궁)',
      detail: chung.meaning,
      effect: 'bad',
      score: -15,
      advice: chung.advice,
    });
    baseScore -= 15;
    challenges.push('배우자궁이 충으로 갈등이 생길 수 있어요');
  }

  // 지지 형 체크 (일지)
  const hyung = BRANCH_HYUNG[day1Branch];
  if (hyung && hyung.partners.includes(day2Branch)) {
    branchAnalysis.push({
      type: '형',
      found: true,
      location: '일지(배우자궁)',
      detail: hyung.meaning,
      effect: 'bad',
      score: -12,
      advice: hyung.advice,
    });
    baseScore -= 12;
    challenges.push('배우자궁에 형이 있어 서로 상처줄 수 있어요');
  }

  // 지지 해 체크 (일지)
  const hae = BRANCH_HAE[day1Branch];
  if (hae && hae.partner === day2Branch) {
    branchAnalysis.push({
      type: '해',
      found: true,
      location: '일지(배우자궁)',
      detail: hae.meaning,
      effect: 'bad',
      score: -8,
      advice: hae.advice,
    });
    baseScore -= 8;
    challenges.push('배우자궁에 해가 있어 방해 요소가 있어요');
  }

  // 삼합 체크 (전체 지지)
  const p1SamhapInfo = BRANCH_SAMHAP[day1Branch];
  const p2SamhapInfo = BRANCH_SAMHAP[day2Branch];

  if (p1SamhapInfo && p2SamhapInfo && p1SamhapInfo.element === p2SamhapInfo.element) {
    branchAnalysis.push({
      type: '삼합',
      found: true,
      location: '일지',
      detail: `같은 ${p1SamhapInfo.element}국(局)에 속해 협력이 잘 돼요`,
      effect: 'good',
      score: 10,
      advice: '함께 일하면 시너지가 나는 관계예요',
    });
    baseScore += 10;
    strengths.push('같은 삼합 그룹으로 팀워크가 좋아요');
  }

  // 오행 조화 분석
  const p1Element = STEM_ELEMENT[day1Stem];
  const p2Element = STEM_ELEMENT[day2Stem];

  const elementRelation: Record<string, Record<string, { relation: string; score: number; meaning: string }>> = {
    '목': {
      '화': { relation: '상생', score: 8, meaning: '나무가 불을 키워줘요' },
      '수': { relation: '상생', score: 8, meaning: '물이 나무를 키워줘요' },
      '금': { relation: '상극', score: -5, meaning: '쇠가 나무를 자를 수 있어요' },
      '토': { relation: '상극', score: -3, meaning: '나무가 땅을 뚫어요' },
      '목': { relation: '비화', score: 5, meaning: '같은 나무끼리 이해가 깊어요' },
    },
    '화': {
      '토': { relation: '상생', score: 8, meaning: '불이 땅을 따뜻하게 해요' },
      '목': { relation: '상생', score: 8, meaning: '나무가 불을 키워줘요' },
      '수': { relation: '상극', score: -5, meaning: '물이 불을 꺼요' },
      '금': { relation: '상극', score: -3, meaning: '불이 쇠를 녹여요' },
      '화': { relation: '비화', score: 5, meaning: '같은 불끼리 열정적이에요' },
    },
    '토': {
      '금': { relation: '상생', score: 8, meaning: '땅에서 금속이 나와요' },
      '화': { relation: '상생', score: 8, meaning: '불이 땅을 따뜻하게 해요' },
      '목': { relation: '상극', score: -5, meaning: '나무가 땅을 뚫어요' },
      '수': { relation: '상극', score: -3, meaning: '땅이 물을 막아요' },
      '토': { relation: '비화', score: 5, meaning: '같은 땅끼리 안정적이에요' },
    },
    '금': {
      '수': { relation: '상생', score: 8, meaning: '쇠에서 물이 생겨요' },
      '토': { relation: '상생', score: 8, meaning: '땅에서 금속이 나와요' },
      '화': { relation: '상극', score: -5, meaning: '불이 쇠를 녹여요' },
      '목': { relation: '상극', score: -3, meaning: '쇠가 나무를 자를 수 있어요' },
      '금': { relation: '비화', score: 5, meaning: '같은 쇠끼리 단단해요' },
    },
    '수': {
      '목': { relation: '상생', score: 8, meaning: '물이 나무를 키워요' },
      '금': { relation: '상생', score: 8, meaning: '쇠에서 물이 생겨요' },
      '토': { relation: '상극', score: -5, meaning: '땅이 물을 막아요' },
      '화': { relation: '상극', score: -3, meaning: '물이 불을 꺼요' },
      '수': { relation: '비화', score: 5, meaning: '같은 물끼리 깊어요' },
    },
  };

  const elementRel = elementRelation[p1Element]?.[p2Element];
  if (elementRel) {
    baseScore += elementRel.score;
    if (elementRel.score > 0) {
      strengths.push(`오행이 ${elementRel.relation}으로 ${elementRel.meaning}`);
    } else if (elementRel.score < 0) {
      challenges.push(`오행이 ${elementRel.relation}이라 ${elementRel.meaning}`);
    }
  }

  // 점수 범위 조정
  const totalScore = Math.max(0, Math.min(100, baseScore));

  // 등급 결정
  let grade = '';
  if (totalScore >= 85) grade = '천생연분';
  else if (totalScore >= 70) grade = '좋은 인연';
  else if (totalScore >= 50) grade = '보통';
  else if (totalScore >= 35) grade = '노력 필요';
  else grade = '어려운 인연';

  // 종합 요약
  let summary = '';
  if (totalScore >= 85) {
    summary = '하늘이 맺어준 인연이에요. 서로를 위해 태어난 것 같은 최상의 궁합입니다.';
  } else if (totalScore >= 70) {
    summary = '잘 맞는 좋은 인연이에요. 함께하면 행복해질 수 있어요.';
  } else if (totalScore >= 50) {
    summary = '평범한 궁합이에요. 서로 노력하면 좋은 관계를 유지할 수 있어요.';
  } else if (totalScore >= 35) {
    summary = '맞지 않는 부분이 있어요. 서로를 이해하려는 노력이 필요해요.';
  } else {
    summary = '어려운 점이 많은 궁합이에요. 신중하게 생각하세요.';
  }

  // 종합 조언
  let advice = '';
  if (strengths.length > challenges.length) {
    advice = '장점이 많은 궁합이에요. 서로의 좋은 점을 인정하고 감사하면 더 좋아져요.';
  } else if (challenges.length > strengths.length) {
    advice = '도전 과제가 있지만, 진심으로 노력하면 극복할 수 있어요. 대화가 중요해요.';
  } else {
    advice = '균형 잡힌 관계예요. 서로 배려하며 천천히 알아가세요.';
  }

  // 쉬운 해석
  const simpleInterpretation = `
${person1Profile?.name || '상대1'}님과 ${person2Profile?.name || '상대2'}님의 궁합 점수는 ${totalScore}점으로 "${grade}"이에요.
${summary}
${strengths.length > 0 ? `\n좋은 점: ${strengths[0]}` : ''}
${challenges.length > 0 ? `\n주의할 점: ${challenges[0]}` : ''}
  `.trim();

  return {
    totalScore,
    grade,
    summary,
    stemAnalysis,
    branchAnalysis,
    strengths,
    challenges,
    advice,
    simpleInterpretation,
  };
}
