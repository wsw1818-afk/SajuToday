/**
 * 푸시 알림 서비스
 * 매일 운세 알림 기능
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// 알림 설정 키
const NOTIFICATION_ENABLED_KEY = '@notification_enabled';
const NOTIFICATION_TIME_KEY = '@notification_time';

// 기본 알림 시간 (오전 8시)
const DEFAULT_HOUR = 8;
const DEFAULT_MINUTE = 0;

// 알림 채널 설정 (Android)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('알림 권한이 거부되었습니다.');
      return false;
    }

    // Android 채널 설정
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily-fortune', {
        name: '오늘의 운세',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8B5CF6',
        sound: 'default',
      });
    }

    return true;
  } catch (error) {
    console.error('알림 권한 요청 오류:', error);
    return false;
  }
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

    if (enabled) {
      const time = await getNotificationTime();
      await scheduleDailyNotification(time.hour, time.minute);
    } else {
      await cancelAllNotifications();
    }
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

    // 알림이 활성화되어 있으면 다시 예약
    const enabled = await getNotificationEnabled();
    if (enabled) {
      await scheduleDailyNotification(hour, minute);
    }
  } catch (error) {
    console.error('알림 시간 저장 오류:', error);
  }
}

/**
 * 매일 운세 알림 예약
 */
export async function scheduleDailyNotification(hour: number, minute: number): Promise<void> {
  try {
    // 기존 알림 취소
    await cancelAllNotifications();

    // 오늘의 운세 메시지 목록
    const fortuneMessages = [
      '오늘도 좋은 하루가 되길 바라며, 운세를 확인해보세요!',
      '새로운 하루가 시작됐어요. 오늘의 운세는?',
      '당신의 오늘 운세가 도착했습니다!',
      '오늘 하루도 행운이 가득하길! 운세를 확인해보세요.',
      '좋은 아침이에요! 오늘의 운세가 기다리고 있어요.',
      '오늘의 사주 풀이가 준비됐어요. 확인해볼까요?',
      '운명의 한 줄, 오늘의 메시지를 확인하세요!',
      '하루를 시작하기 전, 오늘의 운세 체크!',
    ];

    const randomMessage = fortuneMessages[Math.floor(Math.random() * fortuneMessages.length)];

    // 매일 반복 알림 예약
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '오늘의 운세',
        body: randomMessage,
        data: { screen: 'Home' },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hour,
        minute: minute,
      },
    });

    console.log(`매일 ${hour}:${minute.toString().padStart(2, '0')} 알림 예약 완료`);
  } catch (error) {
    console.error('알림 예약 오류:', error);
  }
}

/**
 * 모든 알림 취소
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('모든 예약 알림 취소됨');
  } catch (error) {
    console.error('알림 취소 오류:', error);
  }
}

/**
 * 예약된 알림 목록 가져오기
 */
export async function getScheduledNotifications() {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('예약 알림 조회 오류:', error);
    return [];
  }
}

/**
 * 테스트 알림 전송 (즉시)
 */
export async function sendTestNotification(): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '사주투데이 테스트',
        body: '알림이 정상적으로 작동합니다!',
        sound: 'default',
      },
      trigger: null, // 즉시 전송
    });
  } catch (error) {
    console.error('테스트 알림 오류:', error);
  }
}

/**
 * 알림 초기화 (앱 시작 시 호출)
 */
export async function initializeNotifications(): Promise<void> {
  try {
    const enabled = await getNotificationEnabled();
    if (enabled) {
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        const time = await getNotificationTime();
        await scheduleDailyNotification(time.hour, time.minute);
      }
    }
  } catch (error) {
    console.error('알림 초기화 오류:', error);
  }
}
