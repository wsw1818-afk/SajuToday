import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AdviceCardProps {
  mainText: string;
  subText?: string;
  title?: string;
}

const AdviceCard: React.FC<AdviceCardProps> = ({ mainText, subText, title = '오늘의 운세' }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.todayBadge}>
          <Text style={styles.todayBadgeText}>TODAY</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.mainText}>{mainText}</Text>
      {subText && <Text style={styles.subText}>{subText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F5F5F4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  todayBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 10,
  },
  todayBadgeText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1917',
  },
  mainText: {
    fontSize: 15,
    color: '#44403C',
    fontWeight: '400',
    lineHeight: 24,
    marginBottom: 10,
  },
  subText: {
    fontSize: 13,
    color: '#78716C',
    lineHeight: 20,
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F4',
  },
});

export default AdviceCard;
