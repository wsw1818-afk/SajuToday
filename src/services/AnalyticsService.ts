/**
 * Analytics & Error Tracking Service
 * - Sentry 에러 트래킹
 * - 사용자 행동 분석
 * - 성능 모니터링
 */

import * as Application from 'expo-application';
import Constants from 'expo-constants';

// 환경 변수 (실제 배포 시 설정)
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';
const ANALYTICS_ENABLED = process.env.EXPO_PUBLIC_ANALYTICS_ENABLED === 'true';

// 이벤트 타입 정의
export type AnalyticsEvent =
  | 'app_open'
  | 'screen_view'
  | 'fortune_view'
  | 'compatibility_check'
  | 'profile_update'
  | 'share_fortune'
  | 'bookmark_add'
  | 'notification_tap'
  | 'error_occurred'
  | 'feature_used';

export interface AnalyticsEventData {
  screen?: string;
  fortuneType?: string;
  compatibilityScore?: number;
  errorMessage?: string;
  featureName?: string;
  [key: string]: any;
}

// 세션 정보
let sessionId: string = '';
let sessionStartTime: number = 0;

/**
 * Analytics 초기화
 */
export function initializeAnalytics(): void {
  sessionId = generateSessionId();
  sessionStartTime = Date.now();

  // Sentry 초기화 (실제 배포 시 활성화)
  if (SENTRY_DSN) {
    // Sentry.init({ dsn: SENTRY_DSN });
  }

  // 앱 시작 이벤트
  trackEvent('app_open', {
    version: Application.nativeApplicationVersion || 'unknown',
    buildNumber: Application.nativeBuildVersion || 'unknown',
    platform: Constants.platform?.ios ? 'ios' : 'android',
  });
}

/**
 * 이벤트 트래킹
 */
export function trackEvent(
  event: AnalyticsEvent,
  data?: AnalyticsEventData
): void {
  if (!ANALYTICS_ENABLED && !__DEV__) {
    return;
  }

  const eventData = {
    event,
    sessionId,
    timestamp: new Date().toISOString(),
    sessionDuration: Date.now() - sessionStartTime,
    ...data,
  };

  // 실제 배포 시 서버로 전송
  // sendToAnalyticsServer(eventData);
}

/**
 * 화면 조회 트래킹
 */
export function trackScreenView(screenName: string, params?: object): void {
  trackEvent('screen_view', {
    screen: screenName,
    ...params,
  });
}

/**
 * 운세 조회 트래킹
 */
export function trackFortuneView(
  fortuneType: string,
  additionalData?: object
): void {
  trackEvent('fortune_view', {
    fortuneType,
    ...additionalData,
  });
}

/**
 * 에러 트래킹
 */
export function trackError(
  error: Error | string,
  context?: object
): void {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  trackEvent('error_occurred', {
    errorMessage,
    errorStack,
    ...context,
  });

  // Sentry에 에러 전송 (실제 배포 시 활성화)
  if (SENTRY_DSN) {
    // Sentry.captureException(error);
  }

  console.error('[Analytics] Error tracked:', errorMessage);
}

/**
 * 기능 사용 트래킹
 */
export function trackFeatureUsage(
  featureName: string,
  additionalData?: object
): void {
  trackEvent('feature_used', {
    featureName,
    ...additionalData,
  });
}

/**
 * 사용자 속성 설정
 */
export function setUserProperties(properties: {
  userId?: string;
  birthYear?: number;
  gender?: string;
  hasNotification?: boolean;
}): void {
  // Sentry 사용자 정보 설정
  if (SENTRY_DSN && properties.userId) {
    // Sentry.setUser({ id: properties.userId });
  }
}

/**
 * 성능 측정 시작
 */
export function startPerformanceMeasure(name: string): () => void {
  const startTime = Date.now();

  return () => {
    const duration = Date.now() - startTime;
  };
}

/**
 * 세션 ID 생성
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 서버로 이벤트 전송 (실제 배포 시 구현)
 */
async function sendToAnalyticsServer(eventData: object): Promise<void> {
  // 실제 구현 시:
  // await fetch('https://your-analytics-server.com/events', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(eventData),
  // });
}

// 기본 내보내기
export default {
  initializeAnalytics,
  trackEvent,
  trackScreenView,
  trackFortuneView,
  trackError,
  trackFeatureUsage,
  setUserProperties,
  startPerformanceMeasure,
};
