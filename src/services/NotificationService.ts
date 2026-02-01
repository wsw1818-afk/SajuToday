/**
 * 푸시 알림 및 스트릭 서비스
 *
 * expo-notifications 네이티브 모듈이 필요하여 알림은 현재 비활성화됨
 * 스트릭(연속 출석) 기능은 활성화됨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// 스트릭 데이터 키
const STREAK_DATA_KEY = '@streak_data';

// 스트릭 데이터 인터페이스
export interface StreakData {
  currentStreak: number;       // 현재 연속 출석일
  longestStreak: number;       // 최장 연속 출석일
  lastVisitDate: string;       // 마지막 방문일 (YYYY-MM-DD)
  totalVisits: number;         // 총 방문 횟수
  weeklyBonusUnlocked: boolean; // 7일 보너스 해금 여부
  monthlyBonusUnlocked: boolean; // 30일 보너스 해금 여부
}

// 기본 스트릭 데이터
const DEFAULT_STREAK_DATA: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastVisitDate: '',
  totalVisits: 0,
  weeklyBonusUnlocked: false,
  monthlyBonusUnlocked: false,
};

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
  } catch (error) {
    console.error('알림 시간 저장 오류:', error);
  }
}

/**
 * 매일 운세 알림 예약 - stub
 */
export async function scheduleDailyNotification(hour: number, minute: number): Promise<void> {
  // 알림 예약 저장 (실제 알림은 앱 업데이트 후 작동)
}

/**
 * 모든 알림 취소 - stub
 */
export async function cancelAllNotifications(): Promise<void> {
  // 알림 취소 (stub)
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
  return false;
}

/**
 * 알림 초기화 - stub
 */
export async function initializeNotifications(): Promise<void> {
  // 푸시 알림 기능이 비활성화되어 있음 (dev client 재빌드 필요)
}

// ========================================
// 스트릭 (연속 출석) 기능
// ========================================

/**
 * 스트릭 데이터 불러오기
 */
export async function getStreakData(): Promise<StreakData> {
  try {
    const data = await AsyncStorage.getItem(STREAK_DATA_KEY);
    return data ? JSON.parse(data) : DEFAULT_STREAK_DATA;
  } catch {
    return DEFAULT_STREAK_DATA;
  }
}

/**
 * 스트릭 데이터 저장
 */
export async function saveStreakData(data: StreakData): Promise<void> {
  try {
    await AsyncStorage.setItem(STREAK_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('스트릭 데이터 저장 실패:', error);
  }
}

/**
 * 출석 체크 (앱 실행 시 호출)
 */
export async function checkInToday(): Promise<{
  streakData: StreakData;
  isNewDay: boolean;
  reward?: {
    type: 'weekly' | 'monthly' | 'milestone';
    message: string;
    emoji: string;
  };
}> {
  // 로컬 시간 기준으로 날짜 생성 (UTC 문제 방지)
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const streakData = await getStreakData();

  // 이미 오늘 체크인한 경우
  if (streakData.lastVisitDate === today) {
    return { streakData, isNewDay: false };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  let newStreak = 1;
  let reward: { type: 'weekly' | 'monthly' | 'milestone'; message: string; emoji: string } | undefined;

  // 어제 방문했으면 연속 출석
  if (streakData.lastVisitDate === yesterdayStr) {
    newStreak = streakData.currentStreak + 1;
  }

  // 7일 연속 보너스 (처음 달성 시)
  if (newStreak === 7 && !streakData.weeklyBonusUnlocked) {
    reward = {
      type: 'weekly',
      message: '7일 연속 출석 달성! 주간 종합운세가 해금되었어요!',
      emoji: '🎉',
    };
  }

  // 30일 연속 보너스 (처음 달성 시)
  if (newStreak === 30 && !streakData.monthlyBonusUnlocked) {
    reward = {
      type: 'monthly',
      message: '30일 연속 출석! 월간 특별 운세가 해금되었어요!',
      emoji: '🏆',
    };
  }

  // 마일스톤 보상 (매번)
  if (!reward) {
    if (newStreak === 3) {
      reward = { type: 'milestone', message: '3일 연속 출석! 꾸준히 잘하고 있어요!', emoji: '🌟' };
    } else if (newStreak === 14) {
      reward = { type: 'milestone', message: '2주 연속 출석! 대단해요!', emoji: '💪' };
    } else if (newStreak === 50) {
      reward = { type: 'milestone', message: '50일 연속 출석! 운세의 달인이에요!', emoji: '🔥' };
    } else if (newStreak === 100) {
      reward = { type: 'milestone', message: '100일 연속 출석! 운세 마스터 달성!', emoji: '👑' };
    } else if (newStreak === 365) {
      reward = { type: 'milestone', message: '1년 연속 출석! 전설적인 기록이에요!', emoji: '🏅' };
    }
  }

  const updatedData: StreakData = {
    currentStreak: newStreak,
    longestStreak: Math.max(newStreak, streakData.longestStreak),
    lastVisitDate: today,
    totalVisits: streakData.totalVisits + 1,
    weeklyBonusUnlocked: newStreak >= 7 ? true : streakData.weeklyBonusUnlocked,
    monthlyBonusUnlocked: newStreak >= 30 ? true : streakData.monthlyBonusUnlocked,
  };

  await saveStreakData(updatedData);

  return { streakData: updatedData, isNewDay: true, reward };
}

/**
 * 스트릭 레벨 계산
 */
export function getStreakLevel(streak: number): {
  level: number;
  title: string;
  emoji: string;
  nextMilestone: number;
  progress: number;
} {
  if (streak >= 365) {
    return { level: 7, title: '전설', emoji: '🏅', nextMilestone: 365, progress: 100 };
  }
  if (streak >= 100) {
    return { level: 6, title: '마스터', emoji: '👑', nextMilestone: 365, progress: Math.min(100, (streak / 365) * 100) };
  }
  if (streak >= 50) {
    return { level: 5, title: '달인', emoji: '🔥', nextMilestone: 100, progress: (streak / 100) * 100 };
  }
  if (streak >= 30) {
    return { level: 4, title: '고수', emoji: '🏆', nextMilestone: 50, progress: (streak / 50) * 100 };
  }
  if (streak >= 14) {
    return { level: 3, title: '숙련자', emoji: '💪', nextMilestone: 30, progress: (streak / 30) * 100 };
  }
  if (streak >= 7) {
    return { level: 2, title: '러버', emoji: '💛', nextMilestone: 14, progress: (streak / 14) * 100 };
  }
  if (streak >= 3) {
    return { level: 1, title: '입문자', emoji: '🌟', nextMilestone: 7, progress: (streak / 7) * 100 };
  }
  return { level: 0, title: '새싹', emoji: '🌱', nextMilestone: 3, progress: (streak / 3) * 100 };
}

/**
 * 스트릭 리셋 (테스트용)
 */
export async function resetStreakData(): Promise<void> {
  await AsyncStorage.removeItem(STREAK_DATA_KEY);
}
