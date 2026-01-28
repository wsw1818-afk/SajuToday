import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { TodayInfo, Pillar } from '../types';
import { getTodayGanji } from './SajuCalculator';
import { SOLAR_TERMS } from '../data/saju';

// KASI API 기본 URL
const KASI_BASE_URL = 'http://apis.data.go.kr/B090041/openapi/service';
const LUNAR_API_URL = `${KASI_BASE_URL}/LrsrCldInfoService`;
const SPECIAL_DAY_API_URL = `${KASI_BASE_URL}/SpcdeInfoService`;

// API 키 (환경변수에서 가져옴 - .env 파일)
const API_KEY = process.env.EXPO_PUBLIC_KASI_API_KEY || '';

// 캐시 키 접두사
const CACHE_PREFIX = '@kasi_cache_';

// 캐시 만료 시간 (밀리초)
const CACHE_TTL = {
  LUNAR: 365 * 24 * 60 * 60 * 1000,    // 음력 데이터: 1년 (변하지 않음)
  GANJI: 365 * 24 * 60 * 60 * 1000,    // 간지 데이터: 1년 (변하지 않음)
  SOLAR_TERMS: 365 * 24 * 60 * 60 * 1000,  // 절기 데이터: 1년
  HOLIDAYS: 30 * 24 * 60 * 60 * 1000,  // 공휴일 데이터: 30일
  TODAY_INFO: 24 * 60 * 60 * 1000,     // 오늘 정보: 24시간
};

// 캐시 데이터 타입
interface CacheData<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// 네트워크 상태
let isOnline = true;
let networkUnsubscribe: (() => void) | null = null;

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
 * 오프라인 캐시 전략:
 * - 캐시 우선: 캐시가 있으면 즉시 반환 (TTL 확인)
 * - 백그라운드 갱신: 온라인이면 백그라운드에서 API 호출 후 캐시 갱신
 * - 오프라인 폴백: 오프라인이면 만료된 캐시라도 반환
 */
export class KasiService {
  /**
   * 네트워크 상태 모니터링 시작
   */
  static initNetworkListener(): void {
    if (networkUnsubscribe) return; // 이미 시작됨

    networkUnsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = isOnline;
      isOnline = state.isConnected ?? false;

      if (!wasOnline && isOnline) {
        console.log('네트워크 연결됨 - 캐시 갱신 가능');
      } else if (wasOnline && !isOnline) {
        console.log('네트워크 연결 끊김 - 오프라인 모드');
      }
    });
  }

  /**
   * 네트워크 상태 모니터링 중지
   */
  static stopNetworkListener(): void {
    if (networkUnsubscribe) {
      networkUnsubscribe();
      networkUnsubscribe = null;
    }
  }

  /**
   * 현재 네트워크 상태 확인
   */
  static async checkNetworkStatus(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      isOnline = state.isConnected ?? false;
      return isOnline;
    } catch {
      return false;
    }
  }

  /**
   * 캐시 저장 (TTL 포함)
   */
  private static async setCache<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      const cacheData: CacheData<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (e) {
      console.log('캐시 저장 실패:', e);
    }
  }

  /**
   * 캐시 조회 (TTL 확인)
   * @param forceReturn true면 만료된 캐시도 반환 (오프라인 모드용)
   */
  private static async getCache<T>(key: string, forceReturn: boolean = false): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const cacheData: CacheData<T> = JSON.parse(cached);
      const isExpired = Date.now() - cacheData.timestamp > cacheData.ttl;

      if (isExpired && !forceReturn) {
        return null; // 만료됨, 새로운 데이터 필요
      }

      return cacheData.data;
    } catch (e) {
      console.log('캐시 조회 실패:', e);
      return null;
    }
  }

  /**
   * 레거시 캐시 조회 (TTL 없는 구버전 호환)
   */
  private static async getLegacyCache<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      // TTL이 없으면 레거시 데이터
      if (parsed.timestamp === undefined) {
        return parsed as T;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * 양력 -> 음력 변환
   */
  static async solarToLunar(solarDate: string): Promise<LunarInfo | null> {
    const cacheKey = `${CACHE_PREFIX}lunar_${solarDate}`;

    // 1. 캐시 확인 (유효한 캐시 우선)
    const cached = await this.getCache<LunarInfo>(cacheKey);
    if (cached) {
      return cached;
    }

    // 레거시 캐시 확인 (구버전 호환)
    const legacyCached = await this.getLegacyCache<LunarInfo>(cacheKey);
    if (legacyCached) {
      // 새 형식으로 마이그레이션
      await this.setCache(cacheKey, legacyCached, CACHE_TTL.LUNAR);
      return legacyCached;
    }

    // 2. 네트워크 상태 확인
    const online = await this.checkNetworkStatus();
    if (!online) {
      // 오프라인: 만료된 캐시라도 반환
      const expiredCache = await this.getCache<LunarInfo>(cacheKey, true);
      if (expiredCache) {
        console.log('오프라인 모드: 만료된 캐시 사용');
        return expiredCache;
      }
      console.log('오프라인 모드: 캐시 없음');
      return null;
    }

    // 3. API 호출
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

      // 캐시 저장 (1년)
      await this.setCache(cacheKey, result, CACHE_TTL.LUNAR);

      return result;
    } catch (error) {
      console.error('KASI solarToLunar error:', error);
      // API 실패 시 만료된 캐시라도 반환
      const fallbackCache = await this.getCache<LunarInfo>(cacheKey, true);
      if (fallbackCache) {
        console.log('API 실패: 만료된 캐시 폴백 사용');
        return fallbackCache;
      }
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

    // 1. 캐시 확인
    const cached = await this.getCache<string>(cacheKey);
    if (cached) {
      return cached;
    }

    // 레거시 캐시 확인 (문자열 직접 저장된 경우)
    try {
      const legacyCached = await AsyncStorage.getItem(cacheKey);
      if (legacyCached && !legacyCached.includes('timestamp')) {
        await this.setCache(cacheKey, legacyCached, CACHE_TTL.LUNAR);
        return legacyCached;
      }
    } catch {
      // 무시
    }

    // 2. 네트워크 상태 확인
    const online = await this.checkNetworkStatus();
    if (!online) {
      const expiredCache = await this.getCache<string>(cacheKey, true);
      if (expiredCache) {
        console.log('오프라인 모드: 만료된 캐시 사용');
        return expiredCache;
      }
      return null;
    }

    // 3. API 호출
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
      await this.setCache(cacheKey, result, CACHE_TTL.LUNAR);

      return result;
    } catch (error) {
      console.error('KASI lunarToSolar error:', error);
      const fallbackCache = await this.getCache<string>(cacheKey, true);
      return fallbackCache;
    }
  }

  /**
   * 24절기 조회
   */
  static async getSolarTerms(year: number): Promise<SolarTermInfo[]> {
    const cacheKey = `${CACHE_PREFIX}solarterms_${year}`;

    // 1. 캐시 확인
    const cached = await this.getCache<SolarTermInfo[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // 레거시 캐시 확인
    const legacyCached = await this.getLegacyCache<SolarTermInfo[]>(cacheKey);
    if (legacyCached) {
      await this.setCache(cacheKey, legacyCached, CACHE_TTL.SOLAR_TERMS);
      return legacyCached;
    }

    // 2. 네트워크 상태 확인
    const online = await this.checkNetworkStatus();
    if (!online) {
      const expiredCache = await this.getCache<SolarTermInfo[]>(cacheKey, true);
      if (expiredCache) {
        console.log('오프라인 모드: 만료된 절기 캐시 사용');
        return expiredCache;
      }
      // 로컬 데이터로 폴백
      return this.getLocalSolarTerms(year);
    }

    // 3. API 호출
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

      // 캐시 저장
      await this.setCache(cacheKey, result, CACHE_TTL.SOLAR_TERMS);

      return result;
    } catch (error) {
      console.error('KASI getSolarTerms error:', error);
      const fallbackCache = await this.getCache<SolarTermInfo[]>(cacheKey, true);
      if (fallbackCache) {
        return fallbackCache;
      }
      // 로컬 데이터로 폴백
      return this.getLocalSolarTerms(year);
    }
  }

  /**
   * 로컬 절기 데이터 (오프라인 폴백용)
   */
  private static getLocalSolarTerms(year: number): SolarTermInfo[] {
    return SOLAR_TERMS.map(term => ({
      date: `${year}-${term.month.toString().padStart(2, '0')}-${term.approxDay.toString().padStart(2, '0')}`,
      name: term.korean,
    }));
  }

  /**
   * 공휴일 조회
   */
  static async getHolidays(year: number, month?: number): Promise<HolidayInfo[]> {
    const cacheKey = `${CACHE_PREFIX}holidays_${year}_${month || 'all'}`;

    // 1. 캐시 확인
    const cached = await this.getCache<HolidayInfo[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // 레거시 캐시 확인
    const legacyCached = await this.getLegacyCache<HolidayInfo[]>(cacheKey);
    if (legacyCached) {
      await this.setCache(cacheKey, legacyCached, CACHE_TTL.HOLIDAYS);
      return legacyCached;
    }

    // 2. 네트워크 상태 확인
    const online = await this.checkNetworkStatus();
    if (!online) {
      const expiredCache = await this.getCache<HolidayInfo[]>(cacheKey, true);
      if (expiredCache) {
        console.log('오프라인 모드: 만료된 공휴일 캐시 사용');
        return expiredCache;
      }
      return [];
    }

    // 3. API 호출
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
      await this.setCache(cacheKey, result, CACHE_TTL.HOLIDAYS);

      return result;
    } catch (error) {
      console.error('KASI getHolidays error:', error);
      const fallbackCache = await this.getCache<HolidayInfo[]>(cacheKey, true);
      return fallbackCache || [];
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

    type GanjiResult = { yearGanji: string; monthGanji: string; dayGanji: string };

    // 1. 캐시 확인
    const cached = await this.getCache<GanjiResult>(cacheKey);
    if (cached) {
      return cached;
    }

    // 레거시 캐시 확인
    const legacyCached = await this.getLegacyCache<GanjiResult>(cacheKey);
    if (legacyCached) {
      await this.setCache(cacheKey, legacyCached, CACHE_TTL.GANJI);
      return legacyCached;
    }

    // 2. 네트워크 상태 확인
    const online = await this.checkNetworkStatus();
    if (!online) {
      const expiredCache = await this.getCache<GanjiResult>(cacheKey, true);
      if (expiredCache) {
        console.log('오프라인 모드: 만료된 간지 캐시 사용');
        return expiredCache;
      }
      return null;
    }

    // 3. API 호출
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

      const result: GanjiResult = {
        yearGanji: lunSecha || '',
        monthGanji: lunWolgeon || '',
        dayGanji: lunIljin || '',
      };

      // 캐시 저장
      await this.setCache(cacheKey, result, CACHE_TTL.GANJI);

      return result;
    } catch (error) {
      console.error('KASI getGanjiInfo error:', error);
      const fallbackCache = await this.getCache<GanjiResult>(cacheKey, true);
      return fallbackCache;
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
