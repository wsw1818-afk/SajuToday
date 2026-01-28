import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// 운세 카드용 스켈레톤
export const FortuneCardSkeleton: React.FC = () => (
  <View style={styles.fortuneCardSkeleton}>
    <View style={styles.fortuneCardRow}>
      <Skeleton width={60} height={60} borderRadius={30} />
      <View style={styles.fortuneCardContent}>
        <Skeleton width={80} height={16} style={{ marginBottom: 8 }} />
        <Skeleton width={120} height={14} />
      </View>
    </View>
  </View>
);

// LuckCard용 스켈레톤
export const LuckCardSkeleton: React.FC = () => (
  <View style={styles.luckCardSkeleton}>
    <Skeleton width={50} height={50} borderRadius={25} />
    <Skeleton width={40} height={12} style={{ marginTop: 8 }} />
    <Skeleton width={60} height={14} style={{ marginTop: 4 }} />
  </View>
);

// 전체 홈 화면 스켈레톤
export const HomeScreenSkeleton: React.FC = () => (
  <View style={styles.homeSkeletonContainer}>
    {/* 제목 영역 */}
    <View style={styles.titleSkeleton}>
      <Skeleton width={150} height={26} style={{ marginBottom: 8 }} />
      <Skeleton width={200} height={16} />
    </View>

    {/* 사주 휠 영역 */}
    <View style={styles.wheelSkeleton}>
      <Skeleton width={200} height={200} borderRadius={100} />
    </View>

    {/* 일주 해석 영역 */}
    <View style={styles.iljuSkeleton}>
      <Skeleton width="100%" height={120} borderRadius={16} />
    </View>

    {/* 날짜 네비게이터 */}
    <View style={styles.dateNavSkeleton}>
      <Skeleton width="100%" height={80} borderRadius={16} />
    </View>

    {/* LuckCard 영역 */}
    <View style={styles.luckRowSkeleton}>
      <LuckCardSkeleton />
      <LuckCardSkeleton />
      <LuckCardSkeleton />
    </View>

    {/* 탭 영역 */}
    <View style={styles.tabSkeleton}>
      <Skeleton width="100%" height={44} borderRadius={12} />
    </View>

    {/* 콘텐츠 영역 */}
    <View style={styles.contentSkeleton}>
      <Skeleton width="100%" height={100} borderRadius={16} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={150} borderRadius={16} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E7E5E4',
  },
  fortuneCardSkeleton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  fortuneCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fortuneCardContent: {
    flex: 1,
    marginLeft: 16,
  },
  luckCardSkeleton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  homeSkeletonContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FDFBF7',
  },
  titleSkeleton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  wheelSkeleton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iljuSkeleton: {
    marginBottom: 20,
  },
  dateNavSkeleton: {
    marginBottom: 20,
  },
  luckRowSkeleton: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  tabSkeleton: {
    marginBottom: 16,
  },
  contentSkeleton: {
    flex: 1,
  },
});

export default Skeleton;
