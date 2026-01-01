import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CompatCardProps {
  luckyZodiac: string;
  luckyEmoji: string;
  cautionZodiac: string;
  cautionEmoji: string;
}

const CompatCard: React.FC<CompatCardProps> = ({
  luckyZodiac,
  luckyEmoji,
  cautionZodiac,
  cautionEmoji,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <Text style={styles.label}>오늘의 귀인</Text>
        <View style={styles.row}>
          <Text style={styles.emoji}>{luckyEmoji}</Text>
          <Text style={styles.value}>{luckyZodiac}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={[styles.item, { alignItems: 'flex-end' }]}>
        <Text style={styles.label}>주의할 띠</Text>
        <View style={styles.row}>
          <Text style={styles.value}>{cautionZodiac}</Text>
          <Text style={styles.emoji}>{cautionEmoji}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#292524',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  item: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: '#A8A29E',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 20,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
});

export default CompatCard;
