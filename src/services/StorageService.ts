import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { UserProfile, SajuResult, Settings, Fortune, FortuneHistory, SavedPerson } from '../types';

// AsyncStorage 키
const STORAGE_KEYS = {
  PROFILE: '@saju_profile',
  SAJU_RESULT: '@saju_result',
  SETTINGS: '@saju_settings',
  ONBOARDING_COMPLETE: '@onboarding_complete',
  SAVED_PEOPLE: '@saved_people',
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

  // ===== 프로필 관련 =====

  /**
   * 프로필 저장
   */
  static async saveProfile(profile: UserProfile): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }

  /**
   * 프로필 조회
   */
  static async getProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * 프로필 삭제
   */
  static async deleteProfile(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.PROFILE);
  }

  // ===== 사주 결과 관련 =====

  /**
   * 사주 결과 저장
   */
  static async saveSajuResult(result: SajuResult): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SAJU_RESULT, JSON.stringify(result));
  }

  /**
   * 사주 결과 조회
   */
  static async getSajuResult(): Promise<SajuResult | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SAJU_RESULT);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // ===== 설정 관련 =====

  /**
   * 설정 저장
   */
  static async saveSettings(settings: Settings): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  /**
   * 설정 조회
   */
  static async getSettings(): Promise<Settings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
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

  // ===== 저장된 사람 관리 =====

  /**
   * 저장된 사람 목록 조회
   */
  static async getSavedPeople(): Promise<SavedPerson[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_PEOPLE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * 사람 저장 (추가 또는 수정)
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

      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_PEOPLE, JSON.stringify(people));
      console.log('사람 저장 성공:', person.name);
    } catch (error) {
      console.error('사람 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 여러 사람 한번에 저장
   */
  static async savePeople(people: SavedPerson[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_PEOPLE, JSON.stringify(people));
  }

  /**
   * 특정 사람 조회
   */
  static async getPerson(id: string): Promise<SavedPerson | null> {
    const people = await this.getSavedPeople();
    return people.find(p => p.id === id) || null;
  }

  /**
   * 사람 삭제
   */
  static async deletePerson(id: string): Promise<void> {
    const people = await this.getSavedPeople();
    const filtered = people.filter(p => p.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_PEOPLE, JSON.stringify(filtered));
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
   * 모든 데이터 초기화
   */
  static async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PROFILE,
      STORAGE_KEYS.SAJU_RESULT,
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.ONBOARDING_COMPLETE,
      STORAGE_KEYS.SAVED_PEOPLE,
    ]);

    if (this.db) {
      await this.db.runAsync('DELETE FROM fortune_history');
    }
  }
}

export default StorageService;
