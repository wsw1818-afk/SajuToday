import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Pillar, Element } from '../../types';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, ELEMENT_COLORS } from '../../utils/theme';
import { getStemByKorean, getBranchByKorean } from '../../data/saju';

interface PillarCardProps {
  pillar: Pillar | null;
  label: string;
  showEmpty?: boolean;
}

export function PillarCard({ pillar, label, showEmpty = true }: PillarCardProps) {
  if (!pillar && !showEmpty) return null;

  const stemInfo = pillar ? getStemByKorean(pillar.stem) : null;
  const branchInfo = pillar ? getBranchByKorean(pillar.branch) : null;

  const stemColor = stemInfo ? ELEMENT_COLORS[stemInfo.element] : COLORS.textLight;
  const branchColor = branchInfo ? ELEMENT_COLORS[branchInfo.element] : COLORS.textLight;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pillarBox}>
        {pillar ? (
          <>
            <View style={[styles.charBox, { backgroundColor: `${stemColor}20` }]}>
              <Text style={[styles.char, { color: stemColor }]}>{pillar.stem}</Text>
              <Text style={[styles.hanja, { color: stemColor }]}>{stemInfo?.hanja}</Text>
            </View>
            <View style={[styles.charBox, { backgroundColor: `${branchColor}20` }]}>
              <Text style={[styles.char, { color: branchColor }]}>{pillar.branch}</Text>
              <Text style={[styles.hanja, { color: branchColor }]}>{branchInfo?.hanja}</Text>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.charBox, styles.emptyBox]}>
              <Text style={styles.emptyChar}>?</Text>
            </View>
            <View style={[styles.charBox, styles.emptyBox]}>
              <Text style={styles.emptyChar}>?</Text>
            </View>
          </>
        )}
      </View>
      {branchInfo && (
        <Text style={styles.animal}>{branchInfo.animal}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 70,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  pillarBox: {
    alignItems: 'center',
  },
  charBox: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  char: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
  },
  hanja: {
    fontSize: FONT_SIZES.xs,
    marginTop: -4,
  },
  emptyBox: {
    backgroundColor: COLORS.divider,
  },
  emptyChar: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textLight,
  },
  animal: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});

export default PillarCard;
