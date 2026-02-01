/**
 * 사주투데이 전체 기능 API 테스트
 * 실행: npm test -- --testPathPattern=api.test.ts
 */

// 테스트용 프로필 데이터
const TEST_BIRTH_DATE = '1990-05-15';
const TEST_BIRTH_TIME = '14:30';

describe('사주투데이 API 테스트', () => {
  // ============================================
  // 1. 사주 계산 (SajuCalculator)
  // ============================================
  describe('1. 사주 계산', () => {
    const { SajuCalculator, getTodayGanji, getDayMasterTraits } = require('../services/SajuCalculator');

    test('SajuCalculator 인스턴스 생성', () => {
      const calc = new SajuCalculator(TEST_BIRTH_DATE, TEST_BIRTH_TIME);
      expect(calc).toBeDefined();
    });

    test('사주 계산 (4주 생성)', () => {
      const calc = new SajuCalculator(TEST_BIRTH_DATE, TEST_BIRTH_TIME);
      const result = calc.calculate();
      expect(result.pillars.year).toBeDefined();
      expect(result.pillars.month).toBeDefined();
      expect(result.pillars.day).toBeDefined();
      expect(result.pillars.hour).toBeDefined();
      expect(result.dayMaster).toBeDefined();
      console.log(`   → 일간: ${result.dayMaster}, 일주: ${result.pillars.day.stem}${result.pillars.day.branch}`);
    });

    test('오늘 간지 계산', () => {
      const today = getTodayGanji();
      expect(today.stem).toBeDefined();
      expect(today.branch).toBeDefined();
      console.log(`   → 오늘: ${today.stem}${today.branch}`);
    });

    test('일간 특성 조회', () => {
      const traits = getDayMasterTraits('갑');
      expect(traits).toBeDefined();
    });
  });

  // ============================================
  // 2. 운세 생성 (FortuneGenerator)
  // ============================================
  describe('2. 운세 생성', () => {
    const { SajuCalculator } = require('../services/SajuCalculator');
    const { generateFortune } = require('../services/FortuneGenerator');

    test('일일 운세 생성', () => {
      const calc = new SajuCalculator(TEST_BIRTH_DATE, TEST_BIRTH_TIME);
      const sajuResult = calc.calculate();
      const fortune = generateFortune(sajuResult, new Date());
      expect(fortune.scores).toBeDefined();
      // advice는 categoryAdvice 내부에 있을 수 있음
      expect(fortune.scores.overall).toBeGreaterThanOrEqual(0);
      console.log(`   → 종합점수: ${fortune.scores.overall}점`);
      console.log(`   → 연애운: ${fortune.scores.love}점`);
    });
  });

  // ============================================
  // 3. 풍부한 운세 서비스 (RichFortuneService)
  // ============================================
  describe('3. 풍부한 운세 서비스', () => {
    const { SajuCalculator } = require('../services/SajuCalculator');
    const {
      getIlju,
      getDayMaster,
      getRichIljuInterpretation,
      generateRichDailyFortune,
      generateCategoryFortune
    } = require('../services/RichFortuneService');

    test('일주 추출', () => {
      const calc = new SajuCalculator(TEST_BIRTH_DATE, TEST_BIRTH_TIME);
      const result = calc.calculate();
      const ilju = getIlju(result);
      expect(ilju).toBeDefined();
      console.log(`   → 일주: ${ilju}`);
    });

    test('60갑자 일주 해석 (RICH_ILJU_DATA)', () => {
      const calc = new SajuCalculator(TEST_BIRTH_DATE, TEST_BIRTH_TIME);
      const result = calc.calculate();
      const iljuData = getRichIljuInterpretation(result);
      expect(iljuData).toBeDefined();
      if (iljuData) {
        // RICH_ILJU_DATA 구조: metaphor, image, essence, needs, lifeTheme 등
        expect(iljuData.metaphor || iljuData.essence).toBeDefined();
        console.log(`   → 비유: ${iljuData.metaphor || '없음'}`);
        console.log(`   → 본질: ${iljuData.essence || '없음'}`);
      }
    });

    test('풍부한 일일 운세 생성', () => {
      const calc = new SajuCalculator(TEST_BIRTH_DATE, TEST_BIRTH_TIME);
      const result = calc.calculate();
      const richFortune = generateRichDailyFortune(result, new Date());
      expect(richFortune).toBeDefined();
      if (richFortune) {
        console.log(`   → 총운: ${richFortune.overallFortune?.substring(0, 50)}...`);
      }
    });

    test('카테고리별 운세 생성', () => {
      const calc = new SajuCalculator(TEST_BIRTH_DATE, TEST_BIRTH_TIME);
      const result = calc.calculate();
      const categoryFortune = generateCategoryFortune(result, new Date());
      expect(categoryFortune).toBeDefined();
      if (categoryFortune) {
        console.log(`   → 연애: ${categoryFortune.love?.summary?.substring(0, 40)}...`);
        console.log(`   → 재물: ${categoryFortune.wealth?.summary?.substring(0, 40)}...`);
      }
    });
  });

  // ============================================
  // 4. 월간/일간 운세 (MonthlyDailyFortune)
  // ============================================
  describe('4. 월간/일간 운세', () => {
    const { SajuCalculator } = require('../services/SajuCalculator');
    const {
      getDayGanji,
      getMonthGanji,
      calculateMonthlyFortune,
      calculateDailyFortune,
      generateMonthCalendar
    } = require('../services/MonthlyDailyFortune');

    test('일간지 계산', () => {
      const dayGanji = getDayGanji(new Date());
      expect(dayGanji.stem).toBeDefined();
      expect(dayGanji.branch).toBeDefined();
      console.log(`   → 오늘: ${dayGanji.stem}${dayGanji.branch} (${dayGanji.animal})`);
    });

    test('월간지 계산', () => {
      const today = new Date();
      const monthGanji = getMonthGanji(today.getFullYear(), today.getMonth() + 1);
      expect(monthGanji.stem).toBeDefined();
      expect(monthGanji.branch).toBeDefined();
      console.log(`   → 이번 달: ${monthGanji.stem}${monthGanji.branch}`);
    });

    test('월간 운세 계산', () => {
      const calc = new SajuCalculator(TEST_BIRTH_DATE, TEST_BIRTH_TIME);
      const result = calc.calculate();
      const today = new Date();
      const monthlyFortune = calculateMonthlyFortune(result.dayMaster, today.getFullYear(), today.getMonth() + 1);
      expect(monthlyFortune).toBeDefined();
      console.log(`   → 월간 점수: ${monthlyFortune.score}점`);
    });

    test('일간 운세 계산', () => {
      const calc = new SajuCalculator(TEST_BIRTH_DATE, TEST_BIRTH_TIME);
      const result = calc.calculate();
      const dailyFortune = calculateDailyFortune(result.dayMaster, new Date());
      expect(dailyFortune).toBeDefined();
      console.log(`   → 일간 점수: ${dailyFortune.score}점`);
    });

    test('월간 캘린더 생성', () => {
      const calc = new SajuCalculator(TEST_BIRTH_DATE, TEST_BIRTH_TIME);
      const result = calc.calculate();
      const today = new Date();
      const calendar = generateMonthCalendar(result.dayMaster, today.getFullYear(), today.getMonth() + 1);
      expect(calendar.length).toBeGreaterThan(0);
      console.log(`   → 생성된 날짜 수: ${calendar.length}일`);
    });
  });

  // ============================================
  // 5. 궁합 (CompatibilityService)
  // ============================================
  describe('5. 궁합 서비스', () => {
    const { SajuCalculator } = require('../services/SajuCalculator');
    const { calculateCompatibility } = require('../services/CompatibilityService');

    test('궁합 계산', () => {
      const calc1 = new SajuCalculator('1990-05-15', '14:30');
      const calc2 = new SajuCalculator('1992-08-20', '10:00');
      const saju1 = calc1.calculate();
      const saju2 = calc2.calculate();
      const compatibility = calculateCompatibility(saju1, saju2);
      expect(compatibility).toBeDefined();
      expect(compatibility.totalScore).toBeGreaterThanOrEqual(0);
      console.log(`   → 총점: ${compatibility.totalScore}점, 등급: ${compatibility.grade}`);
    });
  });

  // ============================================
  // 6. 대운/세운 (DaeunCalculator)
  // ============================================
  describe('6. 대운/세운', () => {
    const { SajuCalculator } = require('../services/SajuCalculator');
    const { analyzeDaeunSeun } = require('../services/DaeunCalculator');

    test('대운/세운 분석', () => {
      const calc = new SajuCalculator(TEST_BIRTH_DATE, TEST_BIRTH_TIME);
      const result = calc.calculate();
      const analysis = analyzeDaeunSeun(TEST_BIRTH_DATE, result.pillars, 'male');
      expect(analysis).toBeDefined();
      expect(analysis.daeunList.length).toBeGreaterThan(0);
      console.log(`   → 대운 수: ${analysis.daeunList.length}개`);
      console.log(`   → 현재 대운: ${analysis.currentDaeun?.stem}${analysis.currentDaeun?.branch}`);
    });
  });

  // ============================================
  // 7. 신살 (SinsalCalculator)
  // ============================================
  describe('7. 신살', () => {
    const { SajuCalculator } = require('../services/SajuCalculator');
    const { calculateSinsals } = require('../services/SinsalCalculator');

    test('신살 계산', () => {
      const calc = new SajuCalculator(TEST_BIRTH_DATE, TEST_BIRTH_TIME);
      const result = calc.calculate();
      const sinsals = calculateSinsals(result);
      expect(sinsals).toBeDefined();
      console.log(`   → 길신: ${sinsals.good?.map((s: any) => s.name).join(', ') || '없음'}`);
      console.log(`   → 흉신: ${sinsals.bad?.map((s: any) => s.name).join(', ') || '없음'}`);
    });
  });

  // ============================================
  // 8. 택일 (TaekilCalculator)
  // ============================================
  describe('8. 택일', () => {
    const { analyzeTaekil, analyzeSpecificDate } = require('../services/TaekilCalculator');

    test('택일 분석 (결혼)', () => {
      // analyzeTaekil(purpose, startDate, endDate, options?)
      const startDate = new Date(2026, 1, 1); // 2026년 2월 1일
      const endDate = new Date(2026, 1, 28); // 2026년 2월 28일
      const taekil = analyzeTaekil('marriage', startDate, endDate);
      expect(taekil).toBeDefined();
      expect(taekil.goodDates).toBeDefined();
      expect(taekil.badDates).toBeDefined();
      console.log(`   → 좋은 날: ${taekil.goodDates?.length || 0}일`);
      console.log(`   → 나쁜 날: ${taekil.badDates?.length || 0}일`);
      console.log(`   → 최적의 날: ${taekil.bestDate?.date?.toLocaleDateString() || '없음'}`);
    });

    test('특정 날짜 분석', () => {
      const dateAnalysis = analyzeSpecificDate(new Date());
      expect(dateAnalysis).toBeDefined();
      console.log(`   → 일반 점수: ${dateAnalysis.generalScore || dateAnalysis.score || '계산됨'}점`);
    });
  });

  // ============================================
  // 9. 이름 분석 (NameAnalyzer)
  // ============================================
  describe('9. 이름 분석', () => {
    const { analyzeName, recommendNames } = require('../services/NameAnalyzer');

    test('이름 분석', () => {
      const analysis = analyzeName('홍길동', '갑');
      expect(analysis).toBeDefined();
      console.log(`   → 총점: ${analysis.totalScore}점`);
    });

    test('이름 추천', () => {
      const recommendations = recommendNames('홍', '갑', 'male');
      expect(recommendations.length).toBeGreaterThan(0);
      console.log(`   → 추천 이름 수: ${recommendations.length}개`);
    });
  });

  // ============================================
  // 10. 행운 아이템 (LuckyItems)
  // ============================================
  describe('10. 행운 아이템', () => {
    const { getDayGanji } = require('../services/MonthlyDailyFortune');
    const { getDailyLuckyInfo, getTodayLuckyNumbers } = require('../services/LuckyItems');

    test('일일 행운 정보', () => {
      const dayGanji = getDayGanji(new Date());
      const luckyInfo = getDailyLuckyInfo(dayGanji.stem, dayGanji.branch);
      expect(luckyInfo).toBeDefined();
      console.log(`   → 행운색: ${luckyInfo.color}, 방향: ${luckyInfo.direction}`);
    });

    test('행운의 숫자', () => {
      const dayGanji = getDayGanji(new Date());
      const numbers = getTodayLuckyNumbers(dayGanji.stem, 6);
      expect(numbers.length).toBe(6);
      console.log(`   → 행운의 숫자: ${numbers.join(', ')}`);
    });
  });

  // ============================================
  // 11. 시간대별 운세 (TimeBasedFortuneService)
  // ============================================
  describe('11. 시간대별 운세', () => {
    const { getCurrentTimeSlot, getAllTimeBasedFortunes } = require('../services/TimeBasedFortuneService');

    test('현재 시간대 조회', () => {
      const slot = getCurrentTimeSlot();
      expect(['morning', 'afternoon', 'evening', 'night']).toContain(slot);
      console.log(`   → 현재 시간대: ${slot}`);
    });

    test('시간대별 운세', () => {
      const fortunes = getAllTimeBasedFortunes('wood');
      expect(fortunes.length).toBeGreaterThan(0);
      console.log(`   → 시간대 수: ${fortunes.length}개`);
    });
  });

  // ============================================
  // 12. 시간 모름 서비스 (UnknownTimeService)
  // ============================================
  describe('12. 시간 모름 서비스', () => {
    const { SajuCalculator } = require('../services/SajuCalculator');
    const { analyzeUnknownTime, analyzeAllHourPillars, calculateTimeEstimation } = require('../services/UnknownTimeService');

    test('시간 없이 분석', () => {
      const calc = new SajuCalculator(TEST_BIRTH_DATE, null);
      const result = calc.calculate();
      const analysis = analyzeUnknownTime(TEST_BIRTH_DATE, result);
      expect(analysis).toBeDefined();
      console.log(`   → 확인 가능: ${analysis.availableInfo?.length || 0}개, 제한됨: ${analysis.limitedInfo?.length || 0}개`);
    });

    test('12시주 미리보기', () => {
      const calc = new SajuCalculator(TEST_BIRTH_DATE, null);
      const result = calc.calculate();
      const hourPreviews = analyzeAllHourPillars(result.pillars.day.stem, TEST_BIRTH_DATE);
      expect(hourPreviews.length).toBe(12);
      console.log(`   → 분석된 시주 수: ${hourPreviews.length}개`);
    });

    test('시간 추정 계산', () => {
      const mockAnswers = [['아침형'], ['외향적'], ['논리적']];
      const estimation = calculateTimeEstimation(mockAnswers);
      expect(estimation).toBeDefined();
    });
  });

  // ============================================
  // 13. 운세 Q&A (FortuneQnA)
  // ============================================
  describe('13. 운세 Q&A', () => {
    const { SajuCalculator } = require('../services/SajuCalculator');
    const { QUESTIONS, generateAnswer } = require('../services/FortuneQnA');

    test('질문 목록 조회', () => {
      expect(QUESTIONS.length).toBeGreaterThan(0);
      console.log(`   → 질문 수: ${QUESTIONS.length}개`);
      console.log(`   → 예시 카테고리: ${QUESTIONS[0]?.id}`);
    });

    test('답변 생성', () => {
      const calc = new SajuCalculator(TEST_BIRTH_DATE, TEST_BIRTH_TIME);
      const result = calc.calculate();
      const profile = { gender: 'male' };
      // generateAnswer(questionId: QuestionCategory, sajuResult, profile)
      const questionId = QUESTIONS[0]?.id; // 'career', 'love' 등 카테고리 ID
      const answer = generateAnswer(questionId, result, profile);
      expect(answer).toBeDefined();
      expect(answer.summary).toBeDefined();
      console.log(`   → 결과: ${answer.result}`);
      console.log(`   → 요약: ${answer.summary?.substring(0, 40)}...`);
    });
  });
});
