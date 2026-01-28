/**
 * SecureStorageService 테스트
 */

import { SecureStorageService } from '../services/SecureStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage 모킹
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('SecureStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setSecureItem / getSecureItem', () => {
    it('문자열을 암호화하여 저장하고 복호화하여 조회할 수 있어야 한다', async () => {
      const key = 'test_key';
      const value = '테스트 데이터';

      // 저장 테스트
      await SecureStorageService.setSecureItem(key, value);
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);

      // 저장된 값 확인 (암호화되어 있어야 함)
      const [savedKey, savedValue] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      expect(savedKey).toBe('@secure_test_key');
      expect(savedValue).not.toBe(value); // 암호화되어 원본과 다름
      expect(typeof savedValue).toBe('string');

      // 조회 테스트를 위해 저장된 값을 모킹
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(savedValue);

      const retrieved = await SecureStorageService.getSecureItem(key);
      expect(retrieved).toBe(value);
    });

    it('한글, 이모지, 특수문자를 포함한 문자열을 처리할 수 있어야 한다', async () => {
      const key = 'unicode_test';
      const value = '한글 테스트 🎉 특수문자!@#$%^&*()';

      await SecureStorageService.setSecureItem(key, value);
      const [, savedValue] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(savedValue);
      const retrieved = await SecureStorageService.getSecureItem(key);

      expect(retrieved).toBe(value);
    });

    it('존재하지 않는 키를 조회하면 null을 반환해야 한다', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await SecureStorageService.getSecureItem('nonexistent_key');
      expect(result).toBeNull();
    });
  });

  describe('setSecureObject / getSecureObject', () => {
    it('객체를 암호화하여 저장하고 복호화하여 조회할 수 있어야 한다', async () => {
      const key = 'user_profile';
      const profile = {
        name: '홍길동',
        birthDate: '1990-01-15',
        birthTime: '13:30',
      };

      await SecureStorageService.setSecureObject(key, profile);
      const [, savedValue] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(savedValue);
      const retrieved = await SecureStorageService.getSecureObject<typeof profile>(key);

      expect(retrieved).toEqual(profile);
    });

    it('배열을 암호화하여 저장하고 복호화하여 조회할 수 있어야 한다', async () => {
      const key = 'saved_people';
      const people = [
        { id: '1', name: '아버지' },
        { id: '2', name: '어머니' },
      ];

      await SecureStorageService.setSecureObject(key, people);
      const [, savedValue] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(savedValue);
      const retrieved = await SecureStorageService.getSecureObject<typeof people>(key);

      expect(retrieved).toEqual(people);
    });
  });

  describe('removeSecureItem', () => {
    it('저장된 데이터를 삭제할 수 있어야 한다', async () => {
      const key = 'test_key';

      await SecureStorageService.removeSecureItem(key);

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@secure_test_key');
    });
  });

  describe('migrateToSecure', () => {
    it('레거시 데이터를 보안 저장소로 마이그레이션해야 한다', async () => {
      const secureKey = 'profile';
      const legacyKey = '@saju_profile';
      const legacyData = JSON.stringify({ name: '테스트' });

      // 보안 저장소에 데이터 없음
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(null)  // 보안 저장소 확인
        .mockResolvedValueOnce(legacyData);  // 레거시 저장소

      const result = await SecureStorageService.migrateToSecure(secureKey, legacyKey);

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('이미 마이그레이션된 경우 건너뛰어야 한다', async () => {
      const secureKey = 'profile';
      const legacyKey = '@saju_profile';

      // 보안 저장소에 이미 데이터 있음
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('encrypted_data');

      const result = await SecureStorageService.migrateToSecure(secureKey, legacyKey);

      expect(result).toBe(true);
      // setItem은 호출되지 않아야 함 (마이그레이션 안 함)
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });
});
