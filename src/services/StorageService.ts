import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { UserProfile, SajuResult, Settings, Fortune, FortuneHistory, SavedPerson } from '../types';
import { SecureStorageService } from './SecureStorageService';

// AsyncStorage 키 (일반 데이터용)
const STORAGE_KEYS = {
  PROFILE: '@saju_profile',           // Legacy (마이그레이션 후 제거)
  SAJU_RESULT: '@saju_result',        // Legacy (마이그레이션 후 제거)
  SETTINGS: '@saju_settings',         // Legacy (마이그레이션 후 제거)
  ONBOARDING_COMPLETE: '@onboarding_complete',  // 민감하지 않음
  SAVED_PEOPLE: '@saved_people',      // Legacy (마이그레이션 후 제거)
};

// 보안 저장소 키 (민감 데이터용)
const SECURE_KEYS = {
  PROFILE: 'profile',
  SAJU_RESULT: 'saju_result',
  SETTINGS: 'settings',
  SAVED_PEOPLE: 'saved_people',
};

// 기본 설정
const DEFAULT_SETTINGS: Settings = {
  tone: 'friendly',
  length: 'medium',
  notificationEnabled: false,
  notificationTime: '08:00',
};

/**
 * 스토리지 서비스
 */
export class StorageService {
  private static db: SQLite.SQLiteDatabase | null = null;

  /**
   * SQLite 데이터베이스 초기화
   */
  static async initDatabase(): Promise<void> {
    if (this.db) return;

    this.db = await SQLite.openDatabaseAsync('sajutoday.db');

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS fortune_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        fortune_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_fortune_date ON fortune_history(date);
    `);

    // 30일 초과 데이터 삭제
    await this.cleanOldHistory();
  }

  /**
   * 30일 초과 히스토리 삭제
   */
  static async cleanOldHistory(): Promise<void> {
    if (!this.db) return;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    await this.db.runAsync('DELETE FROM fortune_history WHERE date < ?', dateStr);
  }

  // ===== 프로필 관련 (암호화 저장) =====

  /**
   * 프로필 저장 (암호화)
   */
  static async saveProfile(profile: UserProfile): Promise<void> {
    await SecureStorageService.setSecureObject(SECURE_KEYS.PROFILE, profile);
  }

  /**
   * 프로필 조회 (복호화)
   */
  static async getProfile(): Promise<UserProfile | null> {
    try {
      // 1. 보안 저장소에서 먼저 조회
      const secureProfile = await SecureStorageService.getSecureObject<UserProfile>(SECURE_KEYS.PROFILE);
      if (secureProfile) return secureProfile;

      // 2. 레거시 저장소에서 마이그레이션 시도
      const legacyData = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
      if (legacyData) {
        const profile = JSON.parse(legacyData) as UserProfile;
        // 보안 저장소로 마이그레이션
        await SecureStorageService.setSecureObject(SECURE_KEYS.PROFILE, profile);
        // 레거시 데이터 삭제 (선택적)
        await AsyncStorage.removeItem(STORAGE_KEYS.PROFILE);
        console.log('프로필 데이터를 보안 저장소로 마이그레이션 완료');
        return profile;
      }

      return null;
    } catch (error) {
      console.error('프로필 조회 실패:', error);
      return null;
    }
  }

  /**
   * 프로필 삭제
   */
  static async deleteProfile(): Promise<void> {
    await SecureStorageService.removeSecureItem(SECURE_KEYS.PROFILE);
    await AsyncStorage.removeItem(STORAGE_KEYS.PROFILE); // 레거시도 삭제
  }

  // ===== 사주 결과 관련 (암호화 저장) =====

  /**
   * 사주 결과 저장 (암호화)
   */
  static async saveSajuResult(result: SajuResult): Promise<void> {
    await SecureStorageService.setSecureObject(SECURE_KEYS.SAJU_RESULT, result);
  }

  /**
   * 사주 결과 조회 (복호화)
   */
  static async getSajuResult(): Promise<SajuResult | null> {
    try {
      // 1. 보안 저장소에서 먼저 조회
      const secureResult = await SecureStorageService.getSecureObject<SajuResult>(SECURE_KEYS.SAJU_RESULT);
      if (secureResult) return secureResult;

      // 2. 레거시 저장소에서 마이그레이션 시도
      const legacyData = await AsyncStorage.getItem(STORAGE_KEYS.SAJU_RESULT);
      if (legacyData) {
        const result = JSON.parse(legacyData) as SajuResult;
        await SecureStorageService.setSecureObject(SECURE_KEYS.SAJU_RESULT, result);
        await AsyncStorage.removeItem(STORAGE_KEYS.SAJU_RESULT);
        console.log('사주 결과를 보안 저장소로 마이그레이션 완료');
        return result;
      }

      return null;
    } catch (error) {
      console.error('사주 결과 조회 실패:', error);
      return null;
    }
  }

  // ===== 설정 관련 (암호화 저장) =====

  /**
   * 설정 저장 (암호화)
   */
  static async saveSettings(settings: Settings): Promise<void> {
    await SecureStorageService.setSecureObject(SECURE_KEYS.SETTINGS, settings);
  }

  /**
   * 설정 조회 (복호화)
   */
  static async getSettings(): Promise<Settings> {
    try {
      // 1. 보안 저장소에서 먼저 조회
      const secureSettings = await SecureStorageService.getSecureObject<Settings>(SECURE_KEYS.SETTINGS);
      if (secureSettings) return { ...DEFAULT_SETTINGS, ...secureSettings };

      // 2. 레거시 저장소에서 마이그레이션 시도
      const legacyData = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (legacyData) {
        const settings = JSON.parse(legacyData) as Settings;
        await SecureStorageService.setSecureObject(SECURE_KEYS.SETTINGS, settings);
        await AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS);
        console.log('설정을 보안 저장소로 마이그레이션 완료');
        return { ...DEFAULT_SETTINGS, ...settings };
      }

      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('설정 조회 실패:', error);
      return DEFAULT_SETTINGS;
    }
  }

  // ===== 온보딩 관련 =====

  /**
   * 온보딩 완료 여부 저장
   */
  static async setOnboardingComplete(complete: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, JSON.stringify(complete));
  }

  /**
   * 온보딩 완료 여부 조회
   */
  static async isOnboardingComplete(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
      return data ? JSON.parse(data) : false;
    } catch {
      return false;
    }
  }

  // ===== 운세 히스토리 관련 (SQLite) =====

  /**
   * 운세 저장
   */
  static async saveFortune(date: string, fortune: Fortune): Promise<void> {
    if (!this.db) await this.initDatabase();
    if (!this.db) return;

    const fortuneJson = JSON.stringify(fortune);
    const createdAt = new Date().toISOString();

    await this.db.runAsync(
      `INSERT OR REPLACE INTO fortune_history (date, fortune_json, created_at) VALUES (?, ?, ?)`,
      date,
      fortuneJson,
      createdAt
    );
  }

  /**
   * 특정 날짜 운세 조회
   */
  static async getFortune(date: string): Promise<Fortune | null> {
    if (!this.db) await this.initDatabase();
    if (!this.db) return null;

    const result = await this.db.getFirstAsync<{ fortune_json: string }>(
      'SELECT fortune_json FROM fortune_history WHERE date = ?',
      date
    );

    return result ? JSON.parse(result.fortune_json) : null;
  }

  /**
   * 전체 운세 히스토리 조회 (최근 30일)
   */
  static async getFortuneHistory(): Promise<FortuneHistory[]> {
    if (!this.db) await this.initDatabase();
    if (!this.db) return [];

    const results = await this.db.getAllAsync<{
      id: number;
      date: string;
      fortune_json: string;
      created_at: string;
    }>('SELECT * FROM fortune_history ORDER BY date DESC LIMIT 30');

    return results.map(row => ({
      id: row.id,
      date: row.date,
      fortune: JSON.parse(row.fortune_json),
      createdAt: row.created_at,
    }));
  }

  /**
   * 운세가 있는 날짜 목록 조회
   */
  static async getFortunesDates(): Promise<string[]> {
    if (!this.db) await this.initDatabase();
    if (!this.db) return [];

    const results = await this.db.getAllAsync<{ date: string }>(
      'SELECT date FROM fortune_history ORDER BY date DESC'
    );

    return results.map(row => row.date);
  }

  // ===== 저장된 사람 관리 (암호화 저장) =====

  /**
   * 저장된 사람 목록 조회 (복호화)
   */
  static async getSavedPeople(): Promise<SavedPerson[]> {
    try {
      // 1. 보안 저장소에서 먼저 조회
      const securePeople = await SecureStorageService.getSecureObject<SavedPerson[]>(SECURE_KEYS.SAVED_PEOPLE);
      if (securePeople && securePeople.length > 0) return securePeople;

      // 2. 레거시 저장소에서 마이그레이션 시도
      const legacyData = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_PEOPLE);
      if (legacyData) {
        const people = JSON.parse(legacyData) as SavedPerson[];
        if (people.length > 0) {
          await SecureStorageService.setSecureObject(SECURE_KEYS.SAVED_PEOPLE, people);
          await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_PEOPLE);
          console.log('저장된 사람 목록을 보안 저장소로 마이그레이션 완료');
        }
        return people;
      }

      return [];
    } catch (error) {
      console.error('저장된 사람 목록 조회 실패:', error);
      return [];
    }
  }

  /**
   * 사람 저장 (추가 또는 수정, 암호화)
   */
  static async savePerson(person: SavedPerson): Promise<void> {
    try {
      const people = await this.getSavedPeople();
      const existingIndex = people.findIndex(p => p.id === person.id);

      if (existingIndex >= 0) {
        // 기존 정보 업데이트
        people[existingIndex] = {
          ...person,
          updatedAt: new Date().toISOString(),
        };
      } else {
        // 새로 추가
        people.push({
          ...person,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await SecureStorageService.setSecureObject(SECURE_KEYS.SAVED_PEOPLE, people);
      console.log('사람 저장 성공:', person.name);
    } catch (error) {
      console.error('사람 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 여러 사람 한번에 저장 (암호화)
   */
  static async savePeople(people: SavedPerson[]): Promise<void> {
    await SecureStorageService.setSecureObject(SECURE_KEYS.SAVED_PEOPLE, people);
  }

  /**
   * 특정 사람 조회
   */
  static async getPerson(id: string): Promise<SavedPerson | null> {
    const people = await this.getSavedPeople();
    return people.find(p => p.id === id) || null;
  }

  /**
   * 사람 삭제 (암호화된 저장소에서)
   */
  static async deletePerson(id: string): Promise<void> {
    const people = await this.getSavedPeople();
    const filtered = people.filter(p => p.id !== id);
    await SecureStorageService.setSecureObject(SECURE_KEYS.SAVED_PEOPLE, filtered);
  }

  /**
   * 사람 검색 (이름으로)
   */
  static async searchPeople(query: string): Promise<SavedPerson[]> {
    const people = await this.getSavedPeople();
    const lowerQuery = query.toLowerCase();
    return people.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      (p.relation && p.relation.toLowerCase().includes(lowerQuery))
    );
  }

  // ===== 전체 초기화 =====

  /**
   * 모든 데이터 초기화 (보안 저장소 + 레거시 + SQLite)
   */
  static async clearAll(): Promise<void> {
    // 보안 저장소 초기화
    await SecureStorageService.removeSecureItem(SECURE_KEYS.PROFILE);
    await SecureStorageService.removeSecureItem(SECURE_KEYS.SAJU_RESULT);
    await SecureStorageService.removeSecureItem(SECURE_KEYS.SETTINGS);
    await SecureStorageService.removeSecureItem(SECURE_KEYS.SAVED_PEOPLE);

    // 레거시 저장소 초기화
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PROFILE,
      STORAGE_KEYS.SAJU_RESULT,
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.ONBOARDING_COMPLETE,
      STORAGE_KEYS.SAVED_PEOPLE,
    ]);

    // SQLite 초기화
    if (this.db) {
      await this.db.runAsync('DELETE FROM fortune_history');
    }
  }

  /**
   * 모든 민감 데이터를 보안 저장소로 마이그레이션
   * (앱 시작 시 한 번 호출)
   */
  static async migrateToSecureStorage(): Promise<void> {
    try {
      // 프로필, 설정, 저장된 사람 목록을 자동으로 마이그레이션
      // getProfile, getSettings, getSavedPeople 호출 시 자동으로 마이그레이션됨
      await this.getProfile();
      await this.getSajuResult();
      await this.getSettings();
      await this.getSavedPeople();
      console.log('보안 저장소 마이그레이션 체크 완료');
    } catch (error) {
      console.error('보안 저장소 마이그레이션 실패:', error);
    }
  }
}

export default StorageService;
