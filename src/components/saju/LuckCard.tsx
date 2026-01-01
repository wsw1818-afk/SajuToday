import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import CircularProgress from './CircularProgress';

interface LuckCardProps {
  label: string;
  icon: LucideIcon;
  color: string;
  value: string;
  score: number;
}

const LuckCard: React.FC<LuckCardProps> = ({ label, icon, color, value, score }) => {
  return (
    <View style={styles.container}>
      <CircularProgress score={score} color={color} icon={icon} iconColor={color} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5F5F4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1917',
  },
});

export default LuckCard;
