/**
 * 피드백 UI 컴포넌트
 * 로딩, 성공, 에러 상태를 사용자에게 친절하게 보여줍니다.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../utils/theme';

const { width } = Dimensions.get('window');

// ============================================
// 로딩 스피너 컴포넌트
// ============================================
interface LoadingSpinnerProps {
  message?: string;
  subMessage?: string;
  size?: 'small' | 'large';
}

export function LoadingSpinner({
  message = '불러오는 중이에요...',
  subMessage,
  size = 'large',
}: LoadingSpinnerProps) {
  const [dots, setDots] = useState('');

  // 로딩 애니메이션 (점 추가)
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingBox}>
        <ActivityIndicator
          size={size}
          color={COLORS.primary}
          style={styles.spinner}
        />
        <Text style={styles.loadingMessage}>{message}{dots}</Text>
        {subMessage && (
          <Text style={styles.loadingSubMessage}>{subMessage}</Text>
        )}
      </View>
    </View>
  );
}

// ============================================
// 전체 화면 로딩 오버레이
// ============================================
interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({
  visible,
  message = '잠시만 기다려주세요...',
}: LoadingOverlayProps) {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <View style={styles.overlayContent}>
        <ActivityIndicator size="large" color={COLORS.white} />
        <Text style={styles.overlayMessage}>{message}</Text>
      </View>
    </Animated.View>
  );
}

// ============================================
// 성공 메시지 컴포넌트
// ============================================
interface SuccessMessageProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
}

export function SuccessMessage({
  title = '완료!',
  message,
  onDismiss,
  autoHide = true,
  duration = 3000,
}: SuccessMessageProps) {
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    // 슬라이드 인
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();

    // 자동 숨김
    if (autoHide && onDismiss) {
      const timer = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }).start(onDismiss);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [slideAnim, autoHide, onDismiss, duration]);

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        styles.successToast,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.toastIconBox}>
        <Text style={styles.toastIcon}>✓</Text>
      </View>
      <View style={styles.toastContent}>
        <Text style={styles.toastTitle}>{title}</Text>
        <Text style={styles.toastMessage}>{message}</Text>
      </View>
      {onDismiss && (
        <TouchableOpacity style={styles.toastClose} onPress={onDismiss}>
          <Text style={styles.toastCloseText}>×</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// ============================================
// 에러 메시지 컴포넌트
// ============================================
interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorMessage({
  title = '문제가 발생했어요',
  message,
  onRetry,
  onDismiss,
}: ErrorMessageProps) {
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [slideAnim]);

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        styles.errorToast,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={[styles.toastIconBox, styles.errorIconBox]}>
        <Text style={styles.toastIcon}>!</Text>
      </View>
      <View style={styles.toastContent}>
        <Text style={[styles.toastTitle, styles.errorTitle]}>{title}</Text>
        <Text style={[styles.toastMessage, styles.errorMessage]}>{message}</Text>
      </View>
      <View style={styles.errorActions}>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity style={styles.toastClose} onPress={onDismiss}>
            <Text style={[styles.toastCloseText, styles.errorCloseText]}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

// ============================================
// 빈 상태 컴포넌트
// ============================================
interface EmptyStateProps {
  emoji?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  emoji = '📭',
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.emptyButton} onPress={onAction}>
          <Text style={styles.emptyButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============================================
// 인라인 로딩 컴포넌트 (작은 영역용)
// ============================================
interface InlineLoadingProps {
  message?: string;
}

export function InlineLoading({ message = '로딩 중' }: InlineLoadingProps) {
  return (
    <View style={styles.inlineLoadingContainer}>
      <ActivityIndicator size="small" color={COLORS.primary} />
      <Text style={styles.inlineLoadingText}>{message}...</Text>
    </View>
  );
}

// ============================================
// 전체 화면 에러 상태 컴포넌트
// ============================================
interface FullScreenErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function FullScreenError({
  title = '운세를 불러올 수 없어요',
  message = '네트워크 연결을 확인하고 다시 시도해주세요.',
  onRetry,
  retryLabel = '다시 시도',
}: FullScreenErrorProps) {
  return (
    <View style={styles.fullScreenErrorContainer}>
      <View style={styles.fullScreenErrorContent}>
        <Text style={styles.fullScreenErrorEmoji}>😔</Text>
        <Text style={styles.fullScreenErrorTitle}>{title}</Text>
        <Text style={styles.fullScreenErrorMessage}>{message}</Text>
        {onRetry && (
          <TouchableOpacity style={styles.fullScreenRetryButton} onPress={onRetry}>
            <Text style={styles.fullScreenRetryIcon}>🔄</Text>
            <Text style={styles.fullScreenRetryText}>{retryLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ============================================
// 스타일
// ============================================
const styles = StyleSheet.create({
  // 로딩 스피너
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingBox: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  spinner: {
    marginBottom: SPACING.md,
  },
  loadingMessage: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  loadingSubMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 22,
  },

  // 전체 화면 오버레이
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    alignItems: 'center',
  },
  overlayMessage: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    marginTop: SPACING.md,
    fontWeight: '600',
  },

  // 토스트 공통
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 1001,
  },
  toastIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  toastIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  toastContent: {
    flex: 1,
  },
  toastTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: FONT_SIZES.md,
    color: '#065F46',
    lineHeight: 20,
  },
  toastClose: {
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  toastCloseText: {
    fontSize: 24,
    color: '#047857',
    fontWeight: '300',
  },

  // 성공 토스트
  successToast: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: COLORS.success,
  },

  // 에러 토스트
  errorToast: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorIconBox: {
    backgroundColor: COLORS.error,
  },
  errorTitle: {
    color: '#991B1B',
  },
  errorMessage: {
    color: '#7F1D1D',
  },
  errorCloseText: {
    color: '#991B1B',
  },
  errorActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.sm,
  },
  retryButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.white,
  },

  // 빈 상태
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emptyMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  emptyButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },

  // 인라인 로딩
  inlineLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  inlineLoadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },

  // 전체 화면 에러 상태
  fullScreenErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  fullScreenErrorContent: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    paddingVertical: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    maxWidth: 320,
    width: '100%',
  },
  fullScreenErrorEmoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  fullScreenErrorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  fullScreenErrorMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  fullScreenRetryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.lg,
    gap: 8,
  },
  fullScreenRetryIcon: {
    fontSize: 18,
  },
  fullScreenRetryText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.card,
  },
});
