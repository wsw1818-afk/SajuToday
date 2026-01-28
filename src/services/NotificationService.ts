/**
 * 푸시 알림 서비스 (Stub)
 *
 * expo-notifications 네이티브 모듈이 필요하여 현재 비활성화됨
 * dev client 재빌드 후 활성화 예정
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// 알림 설정 키
const NOTIFICATION_ENABLED_KEY = '@notification_enabled';
const NOTIFICATION_TIME_KEY = '@notification_time';

// 기본 알림 시간 (오전 8시)
const DEFAULT_HOUR = 8;
const DEFAULT_MINUTE = 0;

/**
 * 알림 기능 사용 가능 여부 - 현재 비활성화
 */
export function isNotificationsAvailable(): boolean {
  return false;
}

/**
 * 알림 권한 요청 - stub
 */
export async function requestNotificationPermission(): Promise<boolean> {
  console.log('푸시 알림 기능이 비활성화되어 있습니다. (dev client 재빌드 필요)');
  return false;
}

/**
 * 알림 활성화 상태 가져오기
 */
export async function getNotificationEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * 알림 활성화 상태 저장
 */
export async function setNotificationEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, enabled ? 'true' : 'false');
    console.log(`알림 설정 저장됨: ${enabled} (실제 알림은 앱 업데이트 후 작동)`);
  } catch (error) {
    console.error('알림 설정 저장 오류:', error);
  }
}

/**
 * 알림 시간 가져오기
 */
export async function getNotificationTime(): Promise<{ hour: number; minute: number }> {
  try {
    const value = await AsyncStorage.getItem(NOTIFICATION_TIME_KEY);
    if (value) {
      return JSON.parse(value);
    }
  } catch {
    // 기본값 반환
  }
  return { hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE };
}

/**
 * 알림 시간 저장
 */
export async function setNotificationTime(hour: number, minute: number): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_TIME_KEY, JSON.stringify({ hour, minute }));
    console.log(`알림 시간 저장됨: ${hour}:${minute} (실제 알림은 앱 업데이트 후 작동)`);
  } catch (error) {
    console.error('알림 시간 저장 오류:', error);
  }
}

/**
 * 매일 운세 알림 예약 - stub
 */
export async function scheduleDailyNotification(hour: number, minute: number): Promise<void> {
  console.log(`알림 예약 저장됨: ${hour}:${minute} (실제 알림은 앱 업데이트 후 작동)`);
}

/**
 * 모든 알림 취소 - stub
 */
export async function cancelAllNotifications(): Promise<void> {
  console.log('알림 취소됨 (stub)');
}

/**
 * 예약된 알림 목록 가져오기 - stub
 */
export async function getScheduledNotifications() {
  return [];
}

/**
 * 테스트 알림 전송 - stub
 */
export async function sendTestNotification(): Promise<boolean> {
  console.log('테스트 알림 기능이 비활성화되어 있습니다. (dev client 재빌드 필요)');
  return false;
}

/**
 * 알림 초기화 - stub
 */
export async function initializeNotifications(): Promise<void> {
  console.log('푸시 알림 기능이 비활성화되어 있습니다. (dev client 재빌드 필요)');
}
