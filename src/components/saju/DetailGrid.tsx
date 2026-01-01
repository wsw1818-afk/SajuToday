import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Compass, Clock, LucideIcon } from 'lucide-react-native';

interface DetailItemProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  colorDot?: string;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, icon: Icon, colorDot }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}</Text>
    <View style={styles.detailValueContainer}>
      <Text style={styles.detailValue}>{value}</Text>
      {colorDot && <View style={[styles.colorDot, { backgroundColor: colorDot }]} />}
      {Icon && <Icon size={14} color="#A8A29E" />}
    </View>
  </View>
);

interface DetailGridProps {
  luckyColor: string;
  luckyColorName: string;
  luckyNumber: string;
  luckyDirection: string;
  luckyTime: string;
}

const DetailGrid: React.FC<DetailGridProps> = ({
  luckyColor,
  luckyColorName,
  luckyNumber,
  luckyDirection,
  luckyTime,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.gridRow}>
        <DetailItem label="행운의 색" value={luckyColorName} colorDot={luckyColor} />
        <View style={styles.spacer} />
        <DetailItem label="행운의 숫자" value={luckyNumber} />
      </View>
      <View style={styles.verticalSpacer} />
      <View style={styles.gridRow}>
        <DetailItem label="행운의 방향" value={luckyDirection} icon={Compass} />
        <View style={styles.spacer} />
        <DetailItem label="행운의 시간" value={luckyTime} icon={Clock} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spacer: {
    width: 10,
  },
  verticalSpacer: {
    height: 10,
  },
  detailItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F5F5F4',
    height: 90,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#78716C',
    marginBottom: 6,
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1917',
    lineHeight: 22,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});

export default DetailGrid;
