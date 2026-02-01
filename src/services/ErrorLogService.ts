/**
 * 에러 로깅 서비스
 * 앱 내 에러를 수집, 저장, 분석하는 서비스
 *
 * 기능:
 * - 에러 로그 로컬 저장 (최근 100개)
 * - 에러 심각도 분류 (critical, error, warning, info)
 * - 컨텍스트 정보 포함 (화면, 사용자 액션 등)
 * - 프로덕션에서는 원격 로깅 서비스로 전송 가능 (Sentry, Crashlytics 등)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// 에러 심각도
export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';

// 에러 카테고리
export type ErrorCategory =
  | 'network'      // 네트워크 관련
  | 'storage'      // 저장소 관련
  | 'api'          // API 호출 관련
  | 'ui'           // UI 렌더링 관련
  | 'calculation'  // 사주 계산 관련
  | 'navigation'   // 네비게이션 관련
  | 'unknown';     // 기타

// 에러 로그 항목
export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  screen?: string;
  userAction?: string;
  deviceInfo?: {
    platform: string;
    version: string;
  };
}

// 저장소 키
const ERROR_LOG_KEY = '@error_logs';
const MAX_LOGS = 100;

// 현재 화면 추적 (네비게이션에서 설정)
let currentScreen = 'Unknown';

/**
 * 에러 로깅 서비스
 */
export class ErrorLogService {
  /**
   * 현재 화면 설정 (네비게이션 이벤트에서 호출)
   */
  static setCurrentScreen(screen: string): void {
    currentScreen = screen;
  }

  /**
   * 고유 ID 생성
   */
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 에러 로그 추가
   */
  static async logError(
    error: Error | string,
    options: {
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      context?: Record<string, unknown>;
      userAction?: string;
    } = {}
  ): Promise<void> {
    const {
      severity = 'error',
      category = 'unknown',
      context,
      userAction,
    } = options;

    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    const entry: ErrorLogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      severity,
      category,
      message: errorMessage,
      stack: errorStack,
      context,
      screen: currentScreen,
      userAction,
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version.toString(),
      },
    };

    // 로컬에 저장
    await this.saveLog(entry);

    // 프로덕션에서 심각한 에러는 원격 전송 (TODO: 실제 구현 시 활성화)
    // if (!__DEV__ && (severity === 'critical' || severity === 'error')) {
    //   await this.sendToRemote(entry);
    // }
  }

  /**
   * 네트워크 에러 로깅
   */
  static async logNetworkError(
    error: Error | string,
    endpoint?: string,
    statusCode?: number
  ): Promise<void> {
    await this.logError(error, {
      severity: statusCode && statusCode >= 500 ? 'error' : 'warning',
      category: 'network',
      context: { endpoint, statusCode },
    });
  }

  /**
   * API 에러 로깅
   */
  static async logApiError(
    error: Error | string,
    apiName: string,
    params?: Record<string, unknown>
  ): Promise<void> {
    await this.logError(error, {
      severity: 'error',
      category: 'api',
      context: { apiName, params },
    });
  }

  /**
   * 스토리지 에러 로깅
   */
  static async logStorageError(
    error: Error | string,
    operation: 'read' | 'write' | 'delete',
    key?: string
  ): Promise<void> {
    await this.logError(error, {
      severity: 'warning',
      category: 'storage',
      context: { operation, key },
    });
  }

  /**
   * UI 에러 로깅 (ErrorBoundary에서 사용)
   */
  static async logUIError(
    error: Error,
    componentStack?: string
  ): Promise<void> {
    await this.logError(error, {
      severity: 'critical',
      category: 'ui',
      context: { componentStack },
    });
  }

  /**
   * 계산 에러 로깅
   */
  static async logCalculationError(
    error: Error | string,
    calculationType: string,
    input?: unknown
  ): Promise<void> {
    await this.logError(error, {
      severity: 'error',
      category: 'calculation',
      context: { calculationType, input },
    });
  }

  /**
   * 로그 저장
   */
  private static async saveLog(entry: ErrorLogEntry): Promise<void> {
    try {
      const logsJson = await AsyncStorage.getItem(ERROR_LOG_KEY);
      const logs: ErrorLogEntry[] = logsJson ? JSON.parse(logsJson) : [];

      // 새 로그 추가
      logs.unshift(entry);

      // 최대 개수 유지
      if (logs.length > MAX_LOGS) {
        logs.splice(MAX_LOGS);
      }

      await AsyncStorage.setItem(ERROR_LOG_KEY, JSON.stringify(logs));
    } catch (e) {
      // 로그 저장 실패는 무시 (무한 루프 방지)
      console.warn('에러 로그 저장 실패:', e);
    }
  }

  /**
   * 모든 로그 조회
   */
  static async getLogs(): Promise<ErrorLogEntry[]> {
    try {
      const logsJson = await AsyncStorage.getItem(ERROR_LOG_KEY);
      return logsJson ? JSON.parse(logsJson) : [];
    } catch {
      return [];
    }
  }

  /**
   * 특정 심각도 이상의 로그만 조회
   */
  static async getLogsBySeverity(
    minSeverity: ErrorSeverity
  ): Promise<ErrorLogEntry[]> {
    const severityOrder: ErrorSeverity[] = ['info', 'warning', 'error', 'critical'];
    const minIndex = severityOrder.indexOf(minSeverity);

    const logs = await this.getLogs();
    return logs.filter(log => {
      const logIndex = severityOrder.indexOf(log.severity);
      return logIndex >= minIndex;
    });
  }

  /**
   * 카테고리별 로그 조회
   */
  static async getLogsByCategory(category: ErrorCategory): Promise<ErrorLogEntry[]> {
    const logs = await this.getLogs();
    return logs.filter(log => log.category === category);
  }

  /**
   * 최근 N개 로그 조회
   */
  static async getRecentLogs(count: number = 10): Promise<ErrorLogEntry[]> {
    const logs = await this.getLogs();
    return logs.slice(0, count);
  }

  /**
   * 로그 통계
   */
  static async getStats(): Promise<{
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<ErrorCategory, number>;
    recentCritical: ErrorLogEntry[];
  }> {
    const logs = await this.getLogs();

    const bySeverity: Record<ErrorSeverity, number> = {
      critical: 0,
      error: 0,
      warning: 0,
      info: 0,
    };

    const byCategory: Record<ErrorCategory, number> = {
      network: 0,
      storage: 0,
      api: 0,
      ui: 0,
      calculation: 0,
      navigation: 0,
      unknown: 0,
    };

    logs.forEach(log => {
      bySeverity[log.severity]++;
      byCategory[log.category]++;
    });

    return {
      total: logs.length,
      bySeverity,
      byCategory,
      recentCritical: logs.filter(l => l.severity === 'critical').slice(0, 5),
    };
  }

  /**
   * 로그 초기화
   */
  static async clearLogs(): Promise<void> {
    await AsyncStorage.removeItem(ERROR_LOG_KEY);
  }

  /**
   * 로그 내보내기 (디버깅용)
   */
  static async exportLogs(): Promise<string> {
    const logs = await this.getLogs();
    return JSON.stringify(logs, null, 2);
  }

  /**
   * 원격 서버로 전송 (TODO: 실제 구현)
   */
  // private static async sendToRemote(entry: ErrorLogEntry): Promise<void> {
  //   // Sentry, Crashlytics, 자체 서버 등으로 전송
  //   // try {
  //   //   await fetch('https://your-logging-server/api/logs', {
  //   //     method: 'POST',
  //   //     headers: { 'Content-Type': 'application/json' },
  //   //     body: JSON.stringify(entry),
  //   //   });
  //   // } catch (e) {
  //   //   console.warn('원격 로그 전송 실패:', e);
  //   // }
  // }
}

export default ErrorLogService;
