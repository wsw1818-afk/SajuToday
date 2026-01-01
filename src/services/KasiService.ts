import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { TodayInfo, Pillar } from '../types';
import { getTodayGanji } from './SajuCalculator';
import { SOLAR_TERMS } from '../data/saju';

// KASI API 기본 URL
const KASI_BASE_URL = 'http://apis.data.go.kr/B090041/openapi/service';
const LUNAR_API_URL = `${KASI_BASE_URL}/LrsrCldInfoService`;
const SPECIAL_DAY_API_URL = `${KASI_BASE_URL}/SpcdeInfoService`;

// API 키 (app.json extra에서 가져옴)
const API_KEY = Constants.expoConfig?.extra?.kasiApiKey || '';

// 캐시 키 접두사
const CACHE_PREFIX = '@kasi_cache_';

interface LunarInfo {
  lunYear: number;
  lunMonth: number;
  lunDay: number;
  isLeapMonth: boolean;
  yearGanji: string;
  monthGanji: string;
  dayGanji: string;
}

interface SolarTermInfo {
  date: string;
  name: string;
}

interface HolidayInfo {
  date: string;
  name: string;
  isHoliday: boolean;
}

/**
 * KASI API 서비스
 */
export class KasiService {
  /**
   * 양력 -> 음력 변환
   */
  static async solarToLunar(solarDate: string): Promise<LunarInfo | null> {
    const cacheKey = `${CACHE_PREFIX}lunar_${solarDate}`;

    // 캐시 확인
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.log('Cache read error:', e);
    }

    const [year, month, day] = solarDate.split('-');

    try {
      const response = await axios.get(`${LUNAR_API_URL}/getLunCalInfo`, {
        params: {
          ServiceKey: API_KEY,
          solYear: year,
          solMonth: month,
          solDay: day,
        },
        timeout: 10000,
      });

      // XML 응답 파싱 (간단한 정규식 사용)
      const xml = response.data;

      const lunYear = this.extractXmlValue(xml, 'lunYear');
      const lunMonth = this.extractXmlValue(xml, 'lunMonth');
      const lunDay = this.extractXmlValue(xml, 'lunDay');
      const lunLeapmonth = this.extractXmlValue(xml, 'lunLeapmonth');
      const lunSecha = this.extractXmlValue(xml, 'lunSecha');
      const lunWolgeon = this.extractXmlValue(xml, 'lunWolgeon');
      const lunIljin = this.extractXmlValue(xml, 'lunIljin');

      if (!lunYear || !lunMonth || !lunDay) {
        return null;
      }

      const result: LunarInfo = {
        lunYear: parseInt(lunYear, 10),
        lunMonth: parseInt(lunMonth, 10),
        lunDay: parseInt(lunDay, 10),
        isLeapMonth: lunLeapmonth === '윤',
        yearGanji: lunSecha || '',
        monthGanji: lunWolgeon || '',
        dayGanji: lunIljin || '',
      };

      // 캐시 저장 (영구)
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
      } catch (e) {
        console.log('Cache write error:', e);
      }

      return result;
    } catch (error) {
      console.error('KASI solarToLunar error:', error);
      return null;
    }
  }

  /**
   * 음력 -> 양력 변환
   */
  static async lunarToSolar(
    lunYear: number,
    lunMonth: number,
    lunDay: number,
    isLeapMonth: boolean = false
  ): Promise<string | null> {
    const cacheKey = `${CACHE_PREFIX}solar_${lunYear}_${lunMonth}_${lunDay}_${isLeapMonth}`;

    // 캐시 확인
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (e) {
      console.log('Cache read error:', e);
    }

    try {
      const response = await axios.get(`${LUNAR_API_URL}/getSolCalInfo`, {
        params: {
          ServiceKey: API_KEY,
          lunYear: lunYear.toString(),
          lunMonth: lunMonth.toString().padStart(2, '0'),
          lunDay: lunDay.toString().padStart(2, '0'),
          leapMonth: isLeapMonth ? 'leap' : 'normal',
        },
        timeout: 10000,
      });

      const xml = response.data;
      const solYear = this.extractXmlValue(xml, 'solYear');
      const solMonth = this.extractXmlValue(xml, 'solMonth');
      const solDay = this.extractXmlValue(xml, 'solDay');

      if (!solYear) {
        return null;
      }

      const result = `${solYear}-${solMonth?.padStart(2, '0')}-${solDay?.padStart(2, '0')}`;

      // 캐시 저장
      try {
        await AsyncStorage.setItem(cacheKey, result);
      } catch (e) {
        console.log('Cache write error:', e);
      }

      return result;
    } catch (error) {
      console.error('KASI lunarToSolar error:', error);
      return null;
    }
  }

  /**
   * 24절기 조회
   */
  static async getSolarTerms(year: number): Promise<SolarTermInfo[]> {
    const cacheKey = `${CACHE_PREFIX}solarterms_${year}`;

    // 캐시 확인
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.log('Cache read error:', e);
    }

    try {
      const response = await axios.get(`${SPECIAL_DAY_API_URL}/get24DivisionsInfo`, {
        params: {
          ServiceKey: API_KEY,
          solYear: year.toString(),
          numOfRows: 50,
        },
        timeout: 10000,
      });

      const xml = response.data;
      const items = this.extractXmlItems(xml);

      const result: SolarTermInfo[] = items.map(item => ({
        date: this.formatDate(this.getItemValue(item, 'locdate') || ''),
        name: this.getItemValue(item, 'dateName') || '',
      })).filter(item => item.date && item.name);

      // 캐시 저장 (1년간)
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
      } catch (e) {
        console.log('Cache write error:', e);
      }

      return result;
    } catch (error) {
      console.error('KASI getSolarTerms error:', error);
      return [];
    }
  }

  /**
   * 공휴일 조회
   */
  static async getHolidays(year: number, month?: number): Promise<HolidayInfo[]> {
    const cacheKey = `${CACHE_PREFIX}holidays_${year}_${month || 'all'}`;

    // 캐시 확인
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.log('Cache read error:', e);
    }

    try {
      const params: Record<string, string> = {
        ServiceKey: API_KEY,
        solYear: year.toString(),
        numOfRows: '100',
      };

      if (month) {
        params.solMonth = month.toString().padStart(2, '0');
      }

      const response = await axios.get(`${SPECIAL_DAY_API_URL}/getRestDeInfo`, {
        params,
        timeout: 10000,
      });

      const xml = response.data;
      const items = this.extractXmlItems(xml);

      const result: HolidayInfo[] = items.map(item => ({
        date: this.formatDate(this.getItemValue(item, 'locdate') || ''),
        name: this.getItemValue(item, 'dateName') || '',
        isHoliday: this.getItemValue(item, 'isHoliday') === 'Y',
      })).filter(item => item.date && item.name);

      // 캐시 저장
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
      } catch (e) {
        console.log('Cache write error:', e);
      }

      return result;
    } catch (error) {
      console.error('KASI getHolidays error:', error);
      return [];
    }
  }

  /**
   * 특정 날짜의 간지(干支) 정보 조회 - KASI API 활용
   */
  static async getGanjiInfo(solarDate: string): Promise<{
    yearGanji: string;
    monthGanji: string;
    dayGanji: string;
  } | null> {
    const cacheKey = `${CACHE_PREFIX}ganji_${solarDate}`;

    // 캐시 확인
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.log('Cache read error:', e);
    }

    const [year, month, day] = solarDate.split('-');

    try {
      const response = await axios.get(`${LUNAR_API_URL}/getLunCalInfo`, {
        params: {
          ServiceKey: API_KEY,
          solYear: year,
          solMonth: month,
          solDay: day,
        },
        timeout: 10000,
      });

      const xml = response.data;

      const lunSecha = this.extractXmlValue(xml, 'lunSecha');    // 년간지 (세차)
      const lunWolgeon = this.extractXmlValue(xml, 'lunWolgeon'); // 월간지 (월건)
      const lunIljin = this.extractXmlValue(xml, 'lunIljin');     // 일간지 (일진)

      if (!lunSecha && !lunWolgeon && !lunIljin) {
        return null;
      }

      const result = {
        yearGanji: lunSecha || '',
        monthGanji: lunWolgeon || '',
        dayGanji: lunIljin || '',
      };

      // 캐시 저장 (영구)
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
      } catch (e) {
        console.log('Cache write error:', e);
      }

      return result;
    } catch (error) {
      console.error('KASI getGanjiInfo error:', error);
      return null;
    }
  }

  /**
   * 오늘 정보 조회 (간지 + 절기 + 특일)
   * KASI API를 우선 사용하고, 실패 시 로컬 계산으로 폴백
   */
  static async getTodayInfo(date: Date = new Date()): Promise<TodayInfo> {
    const dateStr = this.formatDateFromDate(date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // KASI API에서 간지 정보 가져오기 (우선)
    let ganji = getTodayGanji(date); // 기본값: 로컬 계산
    try {
      const ganjiInfo = await this.getGanjiInfo(dateStr);
      if (ganjiInfo && ganjiInfo.dayGanji && ganjiInfo.dayGanji.length === 2) {
        // dayGanji가 "갑자" 형태의 string이므로 Pillar로 변환
        ganji = {
          stem: ganjiInfo.dayGanji[0],
          branch: ganjiInfo.dayGanji[1],
        };
        console.log(`오늘 간지 (KASI API): ${ganjiInfo.dayGanji}`);
      }
    } catch (e) {
      console.log('KASI 간지 조회 실패, 로컬 계산 사용:', `${ganji.stem}${ganji.branch}`);
    }

    // 절기 확인 (KASI API)
    let solarTerm: string | null = null;
    try {
      const terms = await this.getSolarTerms(year);
      const todayTerm = terms.find(t => t.date === dateStr);
      if (todayTerm) {
        solarTerm = todayTerm.name;
      }
    } catch (e) {
      // 폴백: 대략적인 절기 계산
      const approxTerm = SOLAR_TERMS.find(t =>
        t.month === month && Math.abs(t.approxDay - day) <= 1
      );
      if (approxTerm) {
        solarTerm = approxTerm.korean;
      }
    }

    // 공휴일/특일 확인 (KASI API)
    const specialDays: string[] = [];
    try {
      const holidays = await this.getHolidays(year, month);
      const todayHolidays = holidays.filter(h => h.date === dateStr);
      todayHolidays.forEach(h => specialDays.push(h.name));
    } catch (e) {
      console.log('Holiday fetch error:', e);
    }

    return {
      date: dateStr,
      ganji,
      solarTerm,
      specialDays,
    };
  }

  // XML/JSON 헬퍼 함수들 (API가 JSON 또는 XML을 반환할 수 있음)
  private static extractXmlValue(data: any, tag: string): string | null {
    // JSON 객체인 경우
    if (typeof data === 'object' && data !== null) {
      try {
        const item = data?.response?.body?.items?.item;
        if (item) {
          const value = Array.isArray(item) ? item[0]?.[tag] : item[tag];
          return value !== undefined ? String(value) : null;
        }
      } catch (e) {
        // JSON 파싱 실패 시 null 반환
      }
      return null;
    }
    // XML 문자열인 경우
    if (typeof data === 'string') {
      const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i');
      const match = data.match(regex);
      return match ? match[1].trim() : null;
    }
    return null;
  }

  private static extractXmlItems(data: any): any[] {
    // JSON 객체인 경우
    if (typeof data === 'object' && data !== null) {
      try {
        const items = data?.response?.body?.items?.item;
        if (items) {
          return Array.isArray(items) ? items : [items];
        }
      } catch (e) {
        // JSON 파싱 실패 시 빈 배열 반환
      }
      return [];
    }
    // XML 문자열인 경우
    if (typeof data === 'string') {
      const regex = /<item>([\s\S]*?)<\/item>/gi;
      const matches = data.match(regex) || [];
      return matches;
    }
    return [];
  }

  private static getItemValue(item: any, tag: string): string | null {
    // JSON 객체인 경우
    if (typeof item === 'object' && item !== null) {
      const value = item[tag];
      return value !== undefined ? String(value) : null;
    }
    // XML 문자열인 경우
    if (typeof item === 'string') {
      const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i');
      const match = item.match(regex);
      return match ? match[1].trim() : null;
    }
    return null;
  }

  private static formatDate(locdate: string): string {
    // YYYYMMDD -> YYYY-MM-DD
    if (locdate.length === 8) {
      return `${locdate.slice(0, 4)}-${locdate.slice(4, 6)}-${locdate.slice(6, 8)}`;
    }
    return locdate;
  }

  private static formatDateFromDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export default KasiService;
