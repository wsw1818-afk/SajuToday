/**
 * 운세 카드 이미지 생성 서비스
 * SNS 공유용 예쁜 운세 카드 생성
 */

import { Share, Platform } from 'react-native';
// Note: expo-file-system은 현재 미사용
// import * as FileSystem from 'expo-file-system';

// react-native-view-shot은 설치 후 사용 가능
// npm install react-native-view-shot
let captureRef: ((viewRef: any, options?: any) => Promise<string>) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  captureRef = require('react-native-view-shot').captureRef;
} catch {
  // 모듈이 설치되지 않은 경우 null
}

export interface FortuneCardData {
  userName: string;
  date: string;
  dayPillar: string;          // 일주 (예: 갑자)
  overallScore: number;
  scoreComment: string;
  keywords: string[];
  luckyColor: string;
  luckyNumber: string;
  oneLineAdvice: string;
}

/**
 * 점수에 따른 코멘트 반환
 */
export function getScoreComment(score: number): string {
  if (score >= 90) return '최고의 하루가 될 거예요!';
  if (score >= 80) return '좋은 기운이 가득해요!';
  if (score >= 70) return '무난한 하루가 예상돼요';
  if (score >= 60) return '차분하게 보내세요';
  return '조심스럽게 움직이세요';
}

/**
 * 점수에 따른 이모지 반환
 */
export function getScoreEmoji(score: number): string {
  if (score >= 90) return '✨';
  if (score >= 80) return '🌟';
  if (score >= 70) return '💪';
  if (score >= 60) return '🌱';
  return '🛡️';
}

/**
 * 점수에 따른 등급 반환
 */
export function getScoreGrade(score: number): string {
  if (score >= 90) return '대길';
  if (score >= 80) return '길';
  if (score >= 70) return '중길';
  if (score >= 60) return '평';
  return '소흉';
}

/**
 * 공유용 텍스트 메시지 생성
 */
export function createShareMessage(data: FortuneCardData): string {
  const emoji = getScoreEmoji(data.overallScore);
  const grade = getScoreGrade(data.overallScore);

  return `${emoji} ${data.date} 운세 ${emoji}

📊 종합 점수: ${data.overallScore}점 (${grade})
🎯 ${data.scoreComment}

🔮 나의 일주: ${data.dayPillar}
💡 오늘의 조언: ${data.oneLineAdvice}

🏷️ #${data.keywords.join(' #')}

🎨 행운의 색: ${data.luckyColor}
🔢 행운의 숫자: ${data.luckyNumber}

━━━━━━━━━━━━━━━━━━
📱 사주투데이 앱에서 확인하세요!`;
}

/**
 * 카드 뷰 캡처하여 이미지로 저장
 * react-native-view-shot이 설치된 경우에만 작동
 */
export async function captureFortuneCard(viewRef: any): Promise<string | null> {
  if (!captureRef) {
    console.warn('react-native-view-shot이 설치되지 않았습니다. npm install react-native-view-shot');
    return null;
  }

  try {
    const uri = await captureRef(viewRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });
    return uri;
  } catch (error) {
    console.error('카드 캡처 실패:', error);
    return null;
  }
}

/**
 * 이미지 공유 (네이티브)
 */
export async function shareFortuneCardImage(
  imageUri: string,
  message: string
): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      // 웹에서는 텍스트만 공유
      await Share.share({ message });
      return true;
    }

    // 네이티브에서는 이미지 + 텍스트 공유
    const result = await Share.share({
      message,
      url: imageUri,
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error('카드 공유 실패:', error);
    return false;
  }
}

/**
 * 텍스트만 공유
 */
export async function shareFortuneText(data: FortuneCardData): Promise<boolean> {
  try {
    const message = createShareMessage(data);
    const result = await Share.share({ message });
    return result.action === Share.sharedAction;
  } catch (error) {
    console.error('텍스트 공유 실패:', error);
    return false;
  }
}

export default {
  getScoreComment,
  getScoreEmoji,
  getScoreGrade,
  createShareMessage,
  captureFortuneCard,
  shareFortuneCardImage,
  shareFortuneText,
};
