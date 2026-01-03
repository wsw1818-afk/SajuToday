import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularProgressProps {
  score: number;
  color: string;
  emoji?: string;
  size?: number;
  strokeWidth?: number;
  showScore?: boolean;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  score,
  color,
  emoji,
  size = 48,
  strokeWidth = 3,
  showScore = false,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E5E5"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      <View style={styles.iconContainer}>
        {showScore ? (
          <Text style={[styles.scoreText, { color, fontSize: size * 0.24 }]}>{score}</Text>
        ) : emoji ? (
          <Text style={styles.emojiText}>{emoji}</Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'absolute',
  },
  scoreText: {
    fontWeight: 'bold',
  },
  emojiText: {
    fontSize: 16,
  },
});

export default CircularProgress;
