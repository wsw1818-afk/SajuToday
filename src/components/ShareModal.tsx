/**
 * 공유 모달 컴포넌트
 * 운세 공유 옵션을 선택할 수 있는 바텀시트
 */

import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Share,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FortuneCard from './FortuneCard';
import { FortuneCardData, createShareMessage } from '../services/FortuneCardService';

const { width, height } = Dimensions.get('window');

// react-native-view-shot 동적 로드
let captureRef: ((viewRef: any, options?: any) => Promise<string>) | null = null;
try {
  captureRef = require('react-native-view-shot').captureRef;
} catch {
  // 모듈 미설치
}

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  cardData: FortuneCardData;
  isDark?: boolean;
}

type ShareType = 'card' | 'text' | 'simple';

export default function ShareModal({ visible, onClose, cardData, isDark = false }: ShareModalProps) {
  const insets = useSafeAreaInsets();
  const cardRef = useRef<View>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewMode, setPreviewMode] = useState<ShareType | null>(null);

  // 카드 이미지로 공유
  const handleShareCard = useCallback(async () => {
    if (!captureRef || !cardRef.current) {
      // 모듈이 없으면 텍스트로 대체
      handleShareText();
      return;
    }

    setIsCapturing(true);
    try {
      const uri = await captureRef(cardRef.current, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      const message = `${cardData.userName}님의 오늘 운세\n\n📱 사주투데이 앱에서 확인하세요!`;

      if (Platform.OS === 'ios') {
        await Share.share({ url: uri, message });
      } else {
        await Share.share({ message, url: uri });
      }
      onClose();
    } catch (error) {
      console.error('카드 공유 실패:', error);
      // 실패시 텍스트로 대체
      handleShareText();
    } finally {
      setIsCapturing(false);
    }
  }, [cardData, onClose]);

  // 상세 텍스트로 공유
  const handleShareText = useCallback(async () => {
    const message = createShareMessage(cardData);
    try {
      await Share.share({ message });
      onClose();
    } catch (error) {
      console.error('텍스트 공유 실패:', error);
    }
  }, [cardData, onClose]);

  // 간단 텍스트로 공유
  const handleShareSimple = useCallback(async () => {
    const emoji = cardData.overallScore >= 80 ? '🌟' : cardData.overallScore >= 60 ? '😊' : '💪';
    const message = `${emoji} 오늘 운세 ${cardData.overallScore}점!\n` +
      `"${cardData.scoreComment}"\n\n` +
      `📱 사주투데이 앱에서 나도 확인하기`;

    try {
      await Share.share({ message });
      onClose();
    } catch (error) {
      console.error('간단 공유 실패:', error);
    }
  }, [cardData, onClose]);

  // 미리보기 토글
  const togglePreview = useCallback((type: ShareType) => {
    setPreviewMode(previewMode === type ? null : type);
  }, [previewMode]);

  const bgColor = isDark ? '#1C1917' : '#FFFFFF';
  const textColor = isDark ? '#FAFAF9' : '#1C1917';
  const subTextColor = isDark ? '#A8A29E' : '#78716C';
  const borderColor = isDark ? '#3D3D3D' : '#E7E5E4';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, { backgroundColor: bgColor, paddingBottom: insets.bottom + 20 }]}>
              {/* 헤더 */}
              <View style={styles.header}>
                <View style={[styles.handle, { backgroundColor: borderColor }]} />
                <Text style={[styles.title, { color: textColor }]}>운세 공유하기</Text>
                <Text style={[styles.subtitle, { color: subTextColor }]}>
                  친구들에게 오늘의 운세를 공유해보세요
                </Text>
              </View>

              {/* 카드 미리보기 (선택시) */}
              {previewMode === 'card' && (
                <View style={styles.previewContainer}>
                  <View style={styles.cardPreview}>
                    <FortuneCard ref={cardRef} data={cardData} isDark={isDark} />
                  </View>
                </View>
              )}

              {/* 텍스트 미리보기 */}
              {previewMode === 'text' && (
                <View style={[styles.textPreview, { backgroundColor: isDark ? '#292524' : '#F5F5F4', borderColor }]}>
                  <Text style={[styles.previewText, { color: textColor }]} numberOfLines={8}>
                    {createShareMessage(cardData)}
                  </Text>
                </View>
              )}

              {/* 간단 미리보기 */}
              {previewMode === 'simple' && (
                <View style={[styles.textPreview, { backgroundColor: isDark ? '#292524' : '#F5F5F4', borderColor }]}>
                  <Text style={[styles.previewText, { color: textColor }]}>
                    {cardData.overallScore >= 80 ? '🌟' : cardData.overallScore >= 60 ? '😊' : '💪'} 오늘 운세 {cardData.overallScore}점!{'\n'}
                    "{cardData.scoreComment}"{'\n\n'}
                    📱 사주투데이 앱에서 나도 확인하기
                  </Text>
                </View>
              )}

              {/* 공유 옵션들 */}
              <View style={styles.options}>
                {/* 카드 이미지 공유 */}
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    { borderColor },
                    previewMode === 'card' && styles.optionButtonActive
                  ]}
                  onPress={() => togglePreview('card')}
                  onLongPress={handleShareCard}
                  disabled={isCapturing}
                >
                  <View style={[styles.optionIcon, { backgroundColor: '#8B5CF615' }]}>
                    <Text style={styles.optionEmoji}>🖼️</Text>
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionTitle, { color: textColor }]}>카드 이미지</Text>
                    <Text style={[styles.optionDesc, { color: subTextColor }]}>예쁜 카드로 공유</Text>
                  </View>
                  {isCapturing ? (
                    <ActivityIndicator size="small" color="#8B5CF6" />
                  ) : (
                    <Text style={styles.optionArrow}>→</Text>
                  )}
                </TouchableOpacity>

                {/* 상세 텍스트 공유 */}
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    { borderColor },
                    previewMode === 'text' && styles.optionButtonActive
                  ]}
                  onPress={() => togglePreview('text')}
                  onLongPress={handleShareText}
                >
                  <View style={[styles.optionIcon, { backgroundColor: '#10B98115' }]}>
                    <Text style={styles.optionEmoji}>📝</Text>
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionTitle, { color: textColor }]}>상세 텍스트</Text>
                    <Text style={[styles.optionDesc, { color: subTextColor }]}>점수, 조언, 키워드 모두</Text>
                  </View>
                  <Text style={styles.optionArrow}>→</Text>
                </TouchableOpacity>

                {/* 간단 공유 */}
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    { borderColor },
                    previewMode === 'simple' && styles.optionButtonActive
                  ]}
                  onPress={() => togglePreview('simple')}
                  onLongPress={handleShareSimple}
                >
                  <View style={[styles.optionIcon, { backgroundColor: '#F59E0B15' }]}>
                    <Text style={styles.optionEmoji}>💬</Text>
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionTitle, { color: textColor }]}>간단히</Text>
                    <Text style={[styles.optionDesc, { color: subTextColor }]}>점수와 한마디만</Text>
                  </View>
                  <Text style={styles.optionArrow}>→</Text>
                </TouchableOpacity>
              </View>

              {/* 공유 버튼 */}
              {previewMode && (
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => {
                    if (previewMode === 'card') handleShareCard();
                    else if (previewMode === 'text') handleShareText();
                    else handleShareSimple();
                  }}
                  disabled={isCapturing}
                >
                  {isCapturing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.shareButtonText}>📤 공유하기</Text>
                  )}
                </TouchableOpacity>
              )}

              {/* 안내 문구 */}
              <Text style={[styles.hint, { color: subTextColor }]}>
                탭하여 미리보기, 길게 눌러 바로 공유
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: height * 0.85,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 20,
    transform: [{ scale: 0.6 }],
    marginVertical: -60,
  },
  cardPreview: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  textPreview: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  previewText: {
    fontSize: 13,
    lineHeight: 20,
  },
  options: {
    gap: 12,
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionButtonActive: {
    borderColor: '#8B5CF6',
    borderWidth: 2,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 13,
  },
  optionArrow: {
    fontSize: 18,
    color: '#A8A29E',
  },
  shareButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 8,
  },
});
