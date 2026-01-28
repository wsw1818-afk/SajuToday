import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CircularProgress from './CircularProgress';
import { useTheme } from '../../contexts/ThemeContext';

interface LuckCardProps {
  label: string;
  emoji: string;
  color: string;
  value: string;
  score: number;
}

const LuckCard: React.FC<LuckCardProps> = ({ label, emoji, color, value, score }) => {
  const { isDark, colors, scaledFontSize } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderColor: isDark ? colors.border : '#F5F5F4',
        },
      ]}
      accessible={true}
      accessibilityLabel={`${label} ${score}점, ${value}`}
      accessibilityRole="text"
    >
      <CircularProgress score={score} color={color} emoji={emoji} />
      <Text style={[styles.label, { color: isDark ? colors.textSecondary : '#57534E', fontSize: scaledFontSize(12) }]}>
        {label}
      </Text>
      <Text style={[styles.value, { color: isDark ? colors.text : '#1C1917', fontSize: scaledFontSize(14) }]}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 120, // 터치 영역 최소 확보
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '600',
  },
  value: {
    fontWeight: 'bold',
  },
});

export default LuckCard;
