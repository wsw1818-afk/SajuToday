import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Elements } from '../../types';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, ELEMENT_COLORS } from '../../utils/theme';
import { FIVE_ELEMENTS } from '../../data/saju';

interface ElementChartProps {
  elements: Elements;
  showLabels?: boolean;
}

// 오행 리스트 상수 (컴포넌트 외부에 정의하여 재생성 방지)
const ELEMENT_LIST = [
  { key: 'wood' as const, ...FIVE_ELEMENTS.wood },
  { key: 'fire' as const, ...FIVE_ELEMENTS.fire },
  { key: 'earth' as const, ...FIVE_ELEMENTS.earth },
  { key: 'metal' as const, ...FIVE_ELEMENTS.metal },
  { key: 'water' as const, ...FIVE_ELEMENTS.water },
] as const;

export const ElementChart = memo(function ElementChart({ elements, showLabels = true }: ElementChartProps) {
  // 계산 결과 메모이제이션
  const { total, maxValue, chartData } = useMemo(() => {
    const total = Object.values(elements).reduce((sum, val) => sum + val, 0);
    const maxValue = Math.max(...Object.values(elements), 1);

    const chartData = ELEMENT_LIST.map(element => ({
      ...element,
      count: elements[element.key],
      barWidth: maxValue > 0 ? (elements[element.key] / maxValue) * 100 : 0,
    }));

    return { total, maxValue, chartData };
  }, [elements]);

  return (
    <View style={styles.container}>
      {chartData.map(element => (
        <View key={element.key} style={styles.row}>
          <View style={styles.labelContainer}>
            <View style={[styles.dot, { backgroundColor: element.color }]} />
            {showLabels && (
              <Text style={styles.label}>
                {element.korean}({element.hanja})
              </Text>
            )}
          </View>
          <View style={styles.barContainer}>
            <View
              style={[
                styles.bar,
                {
                  width: `${element.barWidth}%`,
                  backgroundColor: element.color,
                },
              ]}
            />
          </View>
          <Text style={styles.count}>{element.count}</Text>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  barContainer: {
    flex: 1,
    height: 16,
    backgroundColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    marginHorizontal: SPACING.sm,
  },
  bar: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  count: {
    width: 24,
    textAlign: 'right',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});

export default ElementChart;
