/**
 * ErrorLogService 테스트
 */

import { ErrorLogService, ErrorLogEntry, ErrorSeverity, ErrorCategory } from '../services/ErrorLogService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage 모킹
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('ErrorLogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 콘솔 출력 모킹
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logError', () => {
    it('문자열 에러를 로깅해야 한다', async () => {
      await ErrorLogService.logError('테스트 에러 메시지');

      expect(AsyncStorage.getItem).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalled();

      // 저장된 로그 확인
      const [key, value] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      expect(key).toBe('@error_logs');

      const logs: ErrorLogEntry[] = JSON.parse(value);
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('테스트 에러 메시지');
      expect(logs[0].severity).toBe('error'); // 기본값
      expect(logs[0].category).toBe('unknown'); // 기본값
    });

    it('Error 객체를 로깅해야 한다', async () => {
      const error = new Error('Error 객체 테스트');

      await ErrorLogService.logError(error);

      const [, value] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const logs: ErrorLogEntry[] = JSON.parse(value);

      expect(logs[0].message).toBe('Error 객체 테스트');
      expect(logs[0].stack).toBeDefined();
    });

    it('심각도와 카테고리를 지정할 수 있어야 한다', async () => {
      await ErrorLogService.logError('경고 메시지', {
        severity: 'warning',
        category: 'network',
      });

      const [, value] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const logs: ErrorLogEntry[] = JSON.parse(value);

      expect(logs[0].severity).toBe('warning');
      expect(logs[0].category).toBe('network');
    });

    it('컨텍스트 정보를 포함할 수 있어야 한다', async () => {
      await ErrorLogService.logError('API 에러', {
        category: 'api',
        context: { endpoint: '/api/fortune', statusCode: 500 },
      });

      const [, value] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const logs: ErrorLogEntry[] = JSON.parse(value);

      expect(logs[0].context).toEqual({
        endpoint: '/api/fortune',
        statusCode: 500,
      });
    });
  });

  describe('특화된 로깅 메서드', () => {
    it('logNetworkError가 네트워크 카테고리로 로깅해야 한다', async () => {
      await ErrorLogService.logNetworkError('연결 실패', '/api/test', 503);

      const [, value] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const logs: ErrorLogEntry[] = JSON.parse(value);

      expect(logs[0].category).toBe('network');
      expect(logs[0].severity).toBe('error'); // 500 이상
      expect(logs[0].context).toEqual({
        endpoint: '/api/test',
        statusCode: 503,
      });
    });

    it('logApiError가 API 카테고리로 로깅해야 한다', async () => {
      await ErrorLogService.logApiError('파싱 실패', 'getGanjiInfo', { date: '2024-01-01' });

      const [, value] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const logs: ErrorLogEntry[] = JSON.parse(value);

      expect(logs[0].category).toBe('api');
      expect(logs[0].context?.apiName).toBe('getGanjiInfo');
    });

    it('logUIError가 UI 카테고리로 critical 로깅해야 한다', async () => {
      const error = new Error('렌더링 에러');
      await ErrorLogService.logUIError(error, '<App> -> <HomeScreen>');

      const [, value] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const logs: ErrorLogEntry[] = JSON.parse(value);

      expect(logs[0].category).toBe('ui');
      expect(logs[0].severity).toBe('critical');
      expect(logs[0].context?.componentStack).toBe('<App> -> <HomeScreen>');
    });
  });

  describe('getLogs', () => {
    it('저장된 로그를 조회해야 한다', async () => {
      const mockLogs: ErrorLogEntry[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          severity: 'error',
          category: 'network',
          message: '테스트 에러',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockLogs));

      const logs = await ErrorLogService.getLogs();

      expect(logs).toEqual(mockLogs);
    });

    it('로그가 없으면 빈 배열을 반환해야 한다', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const logs = await ErrorLogService.getLogs();

      expect(logs).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('로그 통계를 반환해야 한다', async () => {
      const mockLogs: ErrorLogEntry[] = [
        { id: '1', timestamp: '', severity: 'critical', category: 'ui', message: '' },
        { id: '2', timestamp: '', severity: 'error', category: 'network', message: '' },
        { id: '3', timestamp: '', severity: 'error', category: 'api', message: '' },
        { id: '4', timestamp: '', severity: 'warning', category: 'storage', message: '' },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockLogs));

      const stats = await ErrorLogService.getStats();

      expect(stats.total).toBe(4);
      expect(stats.bySeverity.critical).toBe(1);
      expect(stats.bySeverity.error).toBe(2);
      expect(stats.bySeverity.warning).toBe(1);
      expect(stats.byCategory.ui).toBe(1);
      expect(stats.byCategory.network).toBe(1);
    });
  });

  describe('clearLogs', () => {
    it('모든 로그를 삭제해야 한다', async () => {
      await ErrorLogService.clearLogs();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@error_logs');
    });
  });

  describe('setCurrentScreen', () => {
    it('현재 화면을 설정하고 로그에 포함해야 한다', async () => {
      ErrorLogService.setCurrentScreen('HomeScreen');

      await ErrorLogService.logError('테스트');

      const [, value] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const logs: ErrorLogEntry[] = JSON.parse(value);

      expect(logs[0].screen).toBe('HomeScreen');
    });
  });
});
