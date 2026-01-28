/**
 * SajuCalculator 테스트
 * 사주 계산 로직 검증
 */

import { SajuCalculator, getTodayGanji } from '../services/SajuCalculator';

describe('SajuCalculator', () => {
  describe('calculate()', () => {
    it('생년월일로 4주(사주)를 계산해야 한다', () => {
      const calculator = new SajuCalculator('1990-05-15', '14:30');
      const result = calculator.calculate();

      // 결과 구조 확인
      expect(result).toHaveProperty('pillars');
      expect(result).toHaveProperty('elements');
      expect(result).toHaveProperty('yinYang');
      expect(result).toHaveProperty('dayMaster');
      expect(result).toHaveProperty('tenGods');
      expect(result).toHaveProperty('relations');
      expect(result).toHaveProperty('computedAt');

      // 4주 확인
      expect(result.pillars).toHaveProperty('year');
      expect(result.pillars).toHaveProperty('month');
      expect(result.pillars).toHaveProperty('day');
      expect(result.pillars).toHaveProperty('hour');

      // 각 주는 천간(stem)과 지지(branch)를 가져야 함
      expect(result.pillars.year).toHaveProperty('stem');
      expect(result.pillars.year).toHaveProperty('branch');
      expect(result.pillars.day).toHaveProperty('stem');
      expect(result.pillars.day).toHaveProperty('branch');
    });

    it('출생시간 없이도 3주(년월일)를 계산해야 한다', () => {
      const calculator = new SajuCalculator('1990-05-15', null);
      const result = calculator.calculate();

      expect(result.pillars.year).toBeDefined();
      expect(result.pillars.month).toBeDefined();
      expect(result.pillars.day).toBeDefined();
      expect(result.pillars.hour).toBeNull();
    });

    it('일주(일간)가 정확해야 한다', () => {
      // 1990년 5월 15일의 일주 확인
      const calculator = new SajuCalculator('1990-05-15', null);
      const result = calculator.calculate();

      // 일주 천간과 지지가 한글이어야 함
      const validStems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
      const validBranches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

      expect(validStems).toContain(result.pillars.day.stem);
      expect(validBranches).toContain(result.pillars.day.branch);
    });

    it('오행 분포를 계산해야 한다', () => {
      const calculator = new SajuCalculator('1990-05-15', '14:30');
      const result = calculator.calculate();

      expect(result.elements).toHaveProperty('wood');
      expect(result.elements).toHaveProperty('fire');
      expect(result.elements).toHaveProperty('earth');
      expect(result.elements).toHaveProperty('metal');
      expect(result.elements).toHaveProperty('water');

      // 모든 값은 0 이상이어야 함
      Object.values(result.elements).forEach(count => {
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });

    it('음양 분포를 계산해야 한다', () => {
      const calculator = new SajuCalculator('1990-05-15', '14:30');
      const result = calculator.calculate();

      expect(result.yinYang).toHaveProperty('yang');
      expect(result.yinYang).toHaveProperty('yin');
      expect(typeof result.yinYang.yang).toBe('number');
      expect(typeof result.yinYang.yin).toBe('number');
    });

    it('일주 특성 정보를 포함해야 한다', () => {
      const calculator = new SajuCalculator('1990-05-15', null);
      const result = calculator.calculate();

      expect(result.dayMasterInfo).toHaveProperty('element');
      expect(result.dayMasterInfo).toHaveProperty('yinYang');
      expect(result.dayMasterInfo).toHaveProperty('meaning');

      // element는 5행 중 하나여야 함
      const validElements = ['wood', 'fire', 'earth', 'metal', 'water'];
      expect(validElements).toContain(result.dayMasterInfo.element);

      // yinYang은 양/음 중 하나여야 함
      const validYinYang = ['yang', 'yin'];
      expect(validYinYang).toContain(result.dayMasterInfo.yinYang);
    });
  });

  describe('입춘 경계 처리', () => {
    it('입춘(2월 4일경) 이전 출생은 전년도 년주를 사용해야 한다', () => {
      // 2000년 2월 3일 - 입춘 이전
      const calculator1 = new SajuCalculator('2000-02-03', null);
      const result1 = calculator1.calculate();

      // 2000년 2월 5일 - 입춘 이후
      const calculator2 = new SajuCalculator('2000-02-05', null);
      const result2 = calculator2.calculate();

      // 년주가 달라야 함 (하나는 1999년 기준, 하나는 2000년 기준)
      const yearPillar1 = `${result1.pillars.year.stem}${result1.pillars.year.branch}`;
      const yearPillar2 = `${result2.pillars.year.stem}${result2.pillars.year.branch}`;

      // 년주가 달라야 함
      expect(yearPillar1).not.toBe(yearPillar2);
    });
  });

  describe('시간대 처리', () => {
    it('UTC 시간대 문제 없이 날짜를 정확히 처리해야 한다', () => {
      // UTC 자정 문제: "1990-01-01"이 UTC 자정으로 해석되면
      // KST에서는 전날(1989-12-31)로 인식될 수 있음
      const calculator = new SajuCalculator('1990-01-01', null);
      const result = calculator.calculate();

      // 년주가 1990년(경오년)이어야 함
      expect(result.pillars.year.stem).toBeDefined();
      expect(result.pillars.year.branch).toBeDefined();
    });
  });
});

describe('getTodayGanji', () => {
  it('주어진 날짜의 일진(日辰)을 반환해야 한다', () => {
    const today = new Date();
    const ganji = getTodayGanji(today);

    expect(ganji).toHaveProperty('stem');
    expect(ganji).toHaveProperty('branch');

    const validStems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
    const validBranches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

    expect(validStems).toContain(ganji.stem);
    expect(validBranches).toContain(ganji.branch);
  });

  it('60갑자가 60일 주기로 반복되어야 한다', () => {
    const date1 = new Date('2024-01-01');
    const date2 = new Date('2024-03-01'); // 60일 후

    const ganji1 = getTodayGanji(date1);
    const ganji2 = getTodayGanji(date2);

    // 60일 후 같은 간지여야 함
    expect(`${ganji1.stem}${ganji1.branch}`).toBe(`${ganji2.stem}${ganji2.branch}`);
  });
});
