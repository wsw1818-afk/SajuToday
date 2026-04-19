/**
 * BujeokSeal — 부적 인장 컴포넌트 (DESIGN.md BUJEOK 컨셉)
 *
 * 사용 예시:
 *   <BujeokSeal hanja="吉" size={80} />          // 큰 길 인장
 *   <BujeokSeal hanja="財" size={40} subtle />    // 작은 재 인장 (카테고리)
 *   <BujeokSeal hanja="大吉" size={60} variant="brush" />  // 손글씨 부적
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, FONTS } from '../../utils/theme';

interface BujeokSealProps {
  /** 한자 1~2글자 (예: '吉', '大吉', '財') */
  hanja: string;
  /** 인장 크기 (정사각형) */
  size?: number;
  /** subtle: 보더만 (배경 투명, 작은 인장용) */
  subtle?: boolean;
  /** variant: 'stamp' (사각 도장, 기본) | 'brush' (손글씨 인장) */
  variant?: 'stamp' | 'brush';
  /** 한자 색상 (기본 부적 적색) */
  color?: string;
  /** 추가 스타일 */
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function BujeokSeal({
  hanja,
  size = 80,
  subtle = false,
  variant = 'stamp',
  color,
  style,
  textStyle,
}: BujeokSealProps) {
  const sealColor = color ?? COLORS.primary;
  const fontSize = hanja.length === 1 ? size * 0.55 : size * 0.32;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderColor: sealColor,
          borderWidth: variant === 'brush' ? 0 : Math.max(2, size * 0.04),
          backgroundColor: subtle ? 'transparent' : COLORS.card,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: sealColor,
            fontSize,
            fontFamily: variant === 'brush' ? FONTS.brush : FONTS.serifBold,
            lineHeight: fontSize * 1.0,
          },
          textStyle,
        ]}
        allowFontScaling={false}
      >
        {hanja}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    fontWeight: '900',
  },
});

export default BujeokSeal;
