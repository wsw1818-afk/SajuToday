import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useApp } from '../contexts/AppContext';
import { useDaeunData, CurrentDaeun } from '../hooks/useDaeunData';
import { DaeunPillar } from '../hooks/useDaeunData';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_HEIGHT = 200;
const BAR_WIDTH = 40;

const YearFortuneScreen: React.FC = () => {
  const { sajuResult, profile } = useApp();
  const birthDate = profile?.birthDate ? new Date(profile.birthDate) : null;
  const gender = profile?.gender || undefined;
  const { pillars, currentDaeun } = useDaeunData(sajuResult, birthDate, gender);
  const [selectedPillar, setSelectedPillar] = useState<CurrentDaeun | null>(currentDaeun);

  const stats = useMemo(() => {
    if (!pillars.length) return null;
    const scores = pillars.map((p) => p.score);
    return {
      average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      max: Math.max(...scores),
      min: Math.min(...scores),
      bestPeriod: pillars.find((p) => p.score === Math.max(...scores)),
    };
  }, [pillars]);

  const handlePillarPress = useCallback((pillar: DaeunPillar, index: number) => {
    setSelectedPillar({ pillar, yearIndex: index });
  }, []);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFC107';
    return '#F44336';
  };

  const renderBarChart = () => {
    if (!pillars.length) return null;

    const maxScore = 100;
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>대운 흐름</Text>
        <View style={styles.barsContainer}>
          {pillars.map((pillar, index) => {
            const isCurrent = currentDaeun?.yearIndex === index;
            const isSelected = selectedPillar?.yearIndex === index;
            
            return (
              <TouchableOpacity
                key={index}
                onPress={() => handlePillarPress(pillar, index)}
                style={styles.barWrapper}
              >
                <View style={styles.barInfo}>
                  <Text style={[styles.barLabel, isCurrent && styles.currentLabel]}>
                    {pillar.startYear}
                  </Text>
                </View>
                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${(pillar.score / maxScore) * 100}%`,
                        backgroundColor: getScoreColor(pillar.score),
                      },
                      isCurrent && styles.currentBar,
                      isSelected && styles.selectedBar,
                    ]}
                  />
                </View>
                <Text style={styles.barScore}>{pillar.score}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  if (!sajuResult || !pillars.length) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>사주 정보가 없습니다</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>대운 (10년 운세)</Text>
        <Text style={styles.subtitle}>10년 주기로 변하는 큰 운세 흐름</Text>
      </View>

      {/* 통계 카드 */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.average}</Text>
            <Text style={styles.statLabel}>평균 운세</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.max}</Text>
            <Text style={styles.statLabel}>최고 점수</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pillars.length}</Text>
            <Text style={styles.statLabel}>총 대운</Text>
          </View>
        </View>
      )}

      {/* 차트 */}
      {renderBarChart()}

      {/* 선택된 대운 상세 */}
      {selectedPillar && (
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>
            {selectedPillar.pillar.startYear}년 ~ {selectedPillar.pillar.endYear}년 대
          </Text>
          <Text style={styles.detailGanji}>
            {selectedPillar.pillar.stem}{selectedPillar.pillar.branch}
          </Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>
              운세 점수: {selectedPillar.pillar.score}점
            </Text>
          </View>
          <Text style={styles.detailDescription}>
            {selectedPillar.pillar.description}
          </Text>
          {currentDaeun?.yearIndex === selectedPillar.yearIndex && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentText}>현재 대운</Text>
            </View>
          )}
        </View>
      )}

      {/* 현재 대운 요약 */}
      {currentDaeun && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>현재 대운 요약</Text>
          <Text style={styles.summaryGanji}>
            {currentDaeun.pillar.stem}{currentDaeun.pillar.branch}
          </Text>
          <Text style={styles.summaryPeriod}>
            {currentDaeun.pillar.startYear} ~ {currentDaeun.pillar.endYear}년
          </Text>
          <Text style={styles.summaryDescription}>
            {currentDaeun.pillar.description}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  barInfo: {
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
  },
  currentLabel: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  barBackground: {
    width: BAR_WIDTH,
    height: CHART_HEIGHT - 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
  },
  currentBar: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  selectedBar: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  barScore: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  detailCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailGanji: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12,
  },
  scoreBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  detailDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },
  currentBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  currentText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#E8F5E9',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  summaryGanji: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  summaryPeriod: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  summaryDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default YearFortuneScreen;
