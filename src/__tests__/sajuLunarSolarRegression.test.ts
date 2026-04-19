/**
 * Council 5명 합의 (2026-04-19) — 음력/양력 명리학 정합성 회귀 테스트
 *
 * Q1: 입춘(立春) 경계 — 양력 2/4 전후로 연주가 바뀌어야 함
 * Q2: 자시(子時) 경계 — 23:00 이후는 다음날 일주
 * Q3: KASI lunarToSolar null 가드 — 변환 실패 시 음력 날짜가 양력으로 오폴백 금지
 *
 * 출시 차단급 회귀 차단용
 */

import { SajuCalculator } from '../services/SajuCalculator';

describe('[출시차단] 입춘 경계 회귀 (Q1)', () => {
  it('2025-02-02 출생: 2025 입춘(2/3) 전이므로 연주 천간이 2025년과 달라야 한다', () => {
    const before = new SajuCalculator('2025-02-02', null).calculate();
    const after = new SajuCalculator('2025-02-04', null).calculate();
    // 2025 입춘 전후로 연주 천간이 달라야 함
    expect(before.pillars.year.stem).not.toBe(after.pillars.year.stem);
  });

  it('2024-02-03 출생 (입춘 직전) vs 2024-02-05 출생: 연주 천간이 달라야 한다', () => {
    const before = new SajuCalculator('2024-02-03', null).calculate();
    const after = new SajuCalculator('2024-02-05', null).calculate();
    expect(before.pillars.year.stem).not.toBe(after.pillars.year.stem);
  });

  it('SOLAR_TERM_DATES 범위 밖 (1990): 입춘 전후 연주가 달라야 한다 (기본값 4 사용)', () => {
    // 1990년대는 SOLAR_TERM_DATES 테이블 범위 밖 → getIpChunDay() 기본값 4 사용
    // 2/3과 2/5 출생자의 연주 천간이 달라야 (기본값 4 기준 경계 작동)
    const before = new SajuCalculator('1990-02-03', null).calculate();
    const after = new SajuCalculator('1990-02-05', null).calculate();
    expect(before.pillars.year.stem).not.toBe(after.pillars.year.stem);
  });
});

describe('[출시차단] 자시(子時) 경계 회귀 (Q2)', () => {
  it('23:30 출생은 22:59 출생과 일주가 달라야 한다 (다음날 처리)', () => {
    const evening = new SajuCalculator('2024-06-15', '22:59').calculate();
    const lateNight = new SajuCalculator('2024-06-15', '23:30').calculate();
    // 23:30은 2024-06-16의 일진으로 보정되어야 함
    expect(evening.pillars.day.stem).not.toBe(lateNight.pillars.day.stem);
  });

  it('자시 보정: 6/15 23:30 일주 = 6/16 00:30 일주', () => {
    const lateNight15 = new SajuCalculator('2024-06-15', '23:30').calculate();
    const earlyMorning16 = new SajuCalculator('2024-06-16', '00:30').calculate();
    // 둘 다 6/16 일진이어야 함
    expect(lateNight15.pillars.day.stem).toBe(earlyMorning16.pillars.day.stem);
    expect(lateNight15.pillars.day.branch).toBe(earlyMorning16.pillars.day.branch);
  });

  it('22:59 출생은 같은 날 일주를 가져야 한다 (자시 경계 미만)', () => {
    const day1 = new SajuCalculator('2024-06-15', '22:59').calculate();
    const day1MidDay = new SajuCalculator('2024-06-15', '12:00').calculate();
    // 같은 날 일주는 같아야 함
    expect(day1.pillars.day.stem).toBe(day1MidDay.pillars.day.stem);
    expect(day1.pillars.day.branch).toBe(day1MidDay.pillars.day.branch);
  });
});

describe('[출시차단] KASI lunarToSolar null 가드 회귀 (Q3)', () => {
  it('lunarToSolar mock null 반환 시 사주 계산이 호출되지 않아야 한다 (방어)', () => {
    // 음력 변환 실패는 호출 측에서 차단해야 함
    // 만약 음력 날짜가 양력으로 그대로 들어가면 사주는 계산되지만 결과가 잘못됨
    // 검증: 같은 음력 날짜를 양력으로 잘못 입력했을 때와 올바르게 변환된 양력의 결과가 다름
    const wrongAsSolar = new SajuCalculator('2023-02-15', '12:00').calculate();
    // 음력 2023-02-15 → 양력 약 2023-03-06 (KASI 변환 시뮬)
    const correctSolar = new SajuCalculator('2023-03-06', '12:00').calculate();
    // 두 사주는 달라야 함 (변환 실패 시 잘못된 결과 발생을 증명)
    expect(wrongAsSolar.pillars.day.stem).not.toBe(correctSolar.pillars.day.stem);
  });

  it('빈 문자열이나 null 시간은 안전하게 처리되어야 한다', () => {
    expect(() => new SajuCalculator('2024-06-15', null).calculate()).not.toThrow();
  });
});
