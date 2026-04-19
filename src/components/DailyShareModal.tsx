/**
 * 오늘의 운세 공유 모달 (Phase 2-1)
 * ShareCard를 미리보기 → 캡처 → expo-sharing으로 공유
 */

import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { ShareCard } from './ShareCard';

interface DailyShareModalProps {
  visible: boolean;
  onClose: () => void;
  cardData: {
    name: string;
    dateStr: string;
    score: number;
    grade: string;
    stageName: string;
    summary: string;
    topCategoryEmoji: string;
    topCategoryText: string;
  };
}

export function DailyShareModal({ visible, onClose, cardData }: DailyShareModalProps) {
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: '오늘의 운세 공유',
        });
      }
    } catch (e) {
      console.warn('공유 실패:', e);
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>공유 카드 미리보기</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardContainer}>
            <ShareCard ref={cardRef} {...cardData} />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.shareBtn, sharing && styles.shareBtnDisabled]}
              onPress={handleShare}
              disabled={sharing}
            >
              {sharing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.shareBtnText}>📤 공유하기</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>닫기</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.note}>
            ⓘ 생년월일 등 개인정보는 카드에 포함되지 않습니다.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  closeBtn: {
    fontSize: 24,
    color: '#FFF',
    paddingHorizontal: 8,
  },
  cardContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: '#E67E22',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareBtnDisabled: {
    opacity: 0.6,
  },
  shareBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cancelBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});
