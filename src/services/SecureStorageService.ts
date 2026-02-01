/**
 * 보안 저장소 서비스
 * 민감한 사용자 데이터를 암호화하여 저장합니다.
 *
 * 현재는 Base64 인코딩 + XOR 난독화를 사용합니다.
 * 프로덕션에서는 expo-secure-store 또는 react-native-encrypted-storage 권장
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { encode as btoa, decode as atob } from 'base-64';

// 간단한 XOR 암호화 키 (프로덕션에서는 더 강력한 키 관리 필요)
const ENCRYPTION_KEY = 'SajuToday2026SecureKey!@#$';

// 저장소 키 접두사
const SECURE_PREFIX = '@secure_';

/**
 * 문자열을 암호화합니다 (Base64 + XOR).
 */
function encrypt(text: string): string {
  try {
    // UTF-8 문자열을 Base64로 인코딩
    const base64 = btoa(unescape(encodeURIComponent(text)));

    // XOR 난독화
    let encrypted = '';
    for (let i = 0; i < base64.length; i++) {
      const charCode = base64.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      encrypted += String.fromCharCode(charCode);
    }

    // 다시 Base64로 인코딩
    return btoa(encrypted);
  } catch (error) {
    console.warn('Encryption failed, using base64 only:', error);
    return btoa(unescape(encodeURIComponent(text)));
  }
}

/**
 * 암호화된 문자열을 복호화합니다.
 */
function decrypt(encryptedText: string): string {
  try {
    // Base64 디코딩
    const decoded = atob(encryptedText);

    // XOR 복호화
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      decrypted += String.fromCharCode(charCode);
    }

    // Base64 디코딩하여 원본 문자열 복원
    return decodeURIComponent(escape(atob(decrypted)));
  } catch (error) {
    // 복호화 실패 시 Base64만 디코딩 시도 (마이그레이션 호환)
    try {
      return decodeURIComponent(escape(atob(encryptedText)));
    } catch {
      console.error('Decryption failed');
      return '';
    }
  }
}

/**
 * 보안 저장소 서비스
 */
export class SecureStorageService {
  /**
   * 데이터를 암호화하여 저장합니다.
   */
  static async setSecureItem(key: string, value: string): Promise<void> {
    try {
      const encryptedValue = encrypt(value);
      await AsyncStorage.setItem(`${SECURE_PREFIX}${key}`, encryptedValue);
    } catch (error) {
      console.error('SecureStorage setItem error:', error);
      throw error;
    }
  }

  /**
   * 암호화된 데이터를 복호화하여 가져옵니다.
   */
  static async getSecureItem(key: string): Promise<string | null> {
    try {
      const encryptedValue = await AsyncStorage.getItem(`${SECURE_PREFIX}${key}`);
      if (!encryptedValue) return null;
      return decrypt(encryptedValue);
    } catch (error) {
      console.error('SecureStorage getItem error:', error);
      return null;
    }
  }

  /**
   * 암호화된 데이터를 삭제합니다.
   */
  static async removeSecureItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${SECURE_PREFIX}${key}`);
    } catch (error) {
      console.error('SecureStorage removeItem error:', error);
    }
  }

  /**
   * 객체를 암호화하여 저장합니다.
   */
  static async setSecureObject<T>(key: string, value: T): Promise<void> {
    const jsonString = JSON.stringify(value);
    await this.setSecureItem(key, jsonString);
  }

  /**
   * 암호화된 객체를 복호화하여 가져옵니다.
   */
  static async getSecureObject<T>(key: string): Promise<T | null> {
    const jsonString = await this.getSecureItem(key);
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString) as T;
    } catch {
      return null;
    }
  }

  /**
   * 기존 평문 데이터를 암호화된 형식으로 마이그레이션합니다.
   */
  static async migrateToSecure(secureKey: string, legacyKey: string): Promise<boolean> {
    try {
      // 이미 마이그레이션된 경우 건너뛰기
      const secureData = await AsyncStorage.getItem(`${SECURE_PREFIX}${secureKey}`);
      if (secureData) return true;

      // 기존 평문 데이터 확인
      const legacyData = await AsyncStorage.getItem(legacyKey);
      if (!legacyData) return false;

      // 암호화하여 저장
      await this.setSecureItem(secureKey, legacyData);

      return true;
    } catch (error) {
      console.error('Migration error:', error);
      return false;
    }
  }

  /**
   * 모든 민감 데이터를 마이그레이션합니다.
   */
  static async migrateAllSensitiveData(): Promise<void> {
    const sensitiveKeys = [
      { secure: 'profile', legacy: '@saju_profile' },
      { secure: 'settings', legacy: '@saju_settings' },
    ];

    for (const { secure, legacy } of sensitiveKeys) {
      await this.migrateToSecure(secure, legacy);
    }
  }
}

export default SecureStorageService;
