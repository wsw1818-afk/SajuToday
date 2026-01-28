/**
 * 운세 공유 서비스
 * 텍스트 형태로 운세 공유 기능
 */

import { Share, Alert } from 'react-native';

export interface ShareableContent {
  title: string;
  message: string;
  type: 'daily' | 'compatibility' | 'sinsal' | 'lucky';
}

/**
 * 텍스트 형태로 운세 공유
 */
export async function shareFortuneText(content: ShareableContent): Promise<boolean> {
  try {
    const shareMessage = `${content.title}\n\n${content.message}\n\n📱 사주투데이 앱에서 나의 운세 확인하기`;

    const result = await Share.share({
      message: shareMessage,
      title: content.title,
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error('Share failed:', error);
    return false;
  }
}

/**
 * 오늘의 운세 공유 메시지 생성
 */
export function createDailyFortuneMessage(
  name: string,
  date: string,
  score: number,
  keywords: string[],
  luckyColor: string,
  luckyNumber: string
): ShareableContent {
  const scoreEmoji = score >= 80 ? '🌟' : score >= 60 ? '😊' : score >= 40 ? '😐' : '💪';

  return {
    title: `${name}님의 오늘의 운세`,
    message: `📅 ${date}\n\n` +
      `${scoreEmoji} 오늘의 운세 점수: ${score}점\n\n` +
      `✨ 키워드: ${keywords.join(', ')}\n\n` +
      `🎨 행운의 색: ${luckyColor}\n` +
      `🔢 행운의 숫자: ${luckyNumber}`,
    type: 'daily',
  };
}

/**
 * 궁합 결과 공유 메시지 생성
 */
export function createCompatibilityMessage(
  name1: string,
  name2: string,
  score: number,
  summary: string
): ShareableContent {
  const heartEmoji = score >= 80 ? '💕' : score >= 60 ? '💗' : score >= 40 ? '💛' : '💔';

  return {
    title: `${name1} ♥ ${name2} 궁합 결과`,
    message: `${heartEmoji} 궁합 점수: ${score}점\n\n` +
      `📝 ${summary}`,
    type: 'compatibility',
  };
}

/**
 * 신살 분석 공유 메시지 생성
 */
export function createSinsalMessage(
  name: string,
  goodCount: number,
  badCount: number,
  mainSinsal: string
): ShareableContent {
  return {
    title: `${name}님의 신살 분석`,
    message: `⚡ 신살 분석 결과\n\n` +
      `✅ 길신: ${goodCount}개\n` +
      `⚠️ 흉신: ${badCount}개\n\n` +
      `🔮 대표 신살: ${mainSinsal}`,
    type: 'sinsal',
  };
}

/**
 * 행운 정보 공유 메시지 생성
 */
export function createLuckyItemsMessage(
  name: string,
  colors: string[],
  numbers: number[],
  direction: string
): ShareableContent {
  return {
    title: `${name}님의 행운 정보`,
    message: `🍀 오늘의 행운 정보\n\n` +
      `🎨 행운의 색: ${colors.slice(0, 3).join(', ')}\n` +
      `🔢 행운의 숫자: ${numbers.slice(0, 3).join(', ')}\n` +
      `🧭 행운의 방향: ${direction}`,
    type: 'lucky',
  };
}

/**
 * 공유 가능한 링크 생성 (딥링크)
 */
export function createShareLink(type: string, id?: string): string {
  const baseUrl = 'sajutoday://';
  if (id) {
    return `${baseUrl}${type}/${id}`;
  }
  return `${baseUrl}${type}`;
}
