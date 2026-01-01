import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle as SvgCircle } from 'react-native-svg';
import { Menu, Bell, Sparkles, Heart, TrendingUp, X, Users, Calendar, Settings, UserPlus, Star } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../contexts/AppContext';
import { SajuWheel, LuckCard, AdviceCard, DetailGrid, CompatCard } from '../components/saju';
import { Fortune } from '../types';
import { generateFortune } from '../services/FortuneGenerator';
import { analyzeFiveSpirits } from '../services/FortuneTypes';
import { COLOR_NAME_TO_HEX, STEM_TO_KOREAN_ELEMENT } from '../data/constants';
import { formatDateWithDayOfWeek, formatLunarFromISO } from '../utils/dateFormatter';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { profile, sajuResult, todayInfo, todayFortune, setTodayFortune, refreshTodayInfo } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // 운세가 없으면 새로 생성
  useEffect(() => {
    if (!todayFortune && sajuResult) {
      const newFortune = generateFortune(sajuResult);
      setTodayFortune(newFortune);
    }
  }, [sajuResult, todayFortune]);

  // 기본 운세 (메모이제이션)
  const fortune = useMemo(() =>
    todayFortune || generateFortune(sajuResult),
    [todayFortune, sajuResult]
  );

  // 오늘 날짜 포맷 (유틸리티 함수 사용)
  const today = useMemo(() => new Date(), []);
  const dateStr = useMemo(() => formatDateWithDayOfWeek(today), [today]);

  // 음력 날짜 (유틸리티 함수 사용)
  const lunarStr = useMemo(() =>
    todayInfo?.date ? formatLunarFromISO(todayInfo.date) : '음력 정보 로딩 중',
    [todayInfo?.date]
  );

  // 운세에서 행운 정보 가져오기 (메모이제이션)
  const luckyInfo = useMemo(() => ({
    colorName: fortune.luckyInfo.color,
    colorHex: COLOR_NAME_TO_HEX[fortune.luckyInfo.color] || '#6B5B45',
    number: fortune.luckyInfo.number,
    direction: fortune.luckyInfo.direction,
    time: fortune.luckyInfo.time,
  }), [fortune.luckyInfo]);

  const luckyColorName = luckyInfo.colorName;
  const luckyColorHex = luckyInfo.colorHex;
  const luckyNumber = luckyInfo.number;
  const luckyDirection = luckyInfo.direction;
  const luckyTime = luckyInfo.time;

  // 띠 궁합 정보 (메모이제이션)
  const zodiacInfo = useMemo(() => ({
    luckyZodiac: fortune.zodiacCompat.luckyZodiac,
    luckyZodiacEmoji: fortune.zodiacCompat.luckyZodiacEmoji,
    cautionZodiac: fortune.zodiacCompat.cautionZodiac,
    cautionZodiacEmoji: fortune.zodiacCompat.cautionZodiacEmoji,
  }), [fortune.zodiacCompat]);

  const luckyZodiac = zodiacInfo.luckyZodiac;
  const luckyZodiacEmoji = zodiacInfo.luckyZodiacEmoji;
  const cautionZodiac = zodiacInfo.cautionZodiac;
  const cautionZodiacEmoji = zodiacInfo.cautionZodiacEmoji;

  // 5신 분석 (용신 정보) - 상수 임포트 사용
  const fiveSpiritAnalysis = useMemo(() => {
    if (!sajuResult?.dayMaster || !sajuResult?.elements) return null;

    const dayMasterElement = STEM_TO_KOREAN_ELEMENT[sajuResult.dayMaster] || '목';

    const elementMap: Record<string, string> = {
      'wood': '목', 'fire': '화', 'earth': '토', 'metal': '금', 'water': '수',
    };
    const koreanElements: Record<string, number> = {};
    Object.entries(sajuResult.elements).forEach(([key, value]) => {
      koreanElements[elementMap[key] || key] = value as number;
    });

    return analyzeFiveSpirits(dayMasterElement, koreanElements);
  }, [sajuResult]);

  // 핸들러 메모이제이션
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshTodayInfo();
    const newFortune = generateFortune(sajuResult);
    await setTodayFortune(newFortune);
    setIsRefreshing(false);
  }, [sajuResult, refreshTodayInfo, setTodayFortune]);

  const handleViewFullFortune = useCallback(() => {
    navigation.navigate('FortuneDetail');
  }, [navigation]);

  const handleOpenCompatibility = useCallback(() => {
    setMenuVisible(false);
    navigation.navigate('CompatibilityInput');
  }, [navigation]);

  // 메뉴 아이템 메모이제이션
  const menuItems = useMemo(() => [
    {
      icon: Star,
      label: '운세 종류',
      description: '꿈풀이, 토정비결, 별자리운세 등',
      color: '#8B5CF6',
      onPress: () => {
        setMenuVisible(false);
        navigation.navigate('FortuneMenu');
      },
    },
    {
      icon: Users,
      label: '궁합 보기',
      description: '두 사람의 사주 궁합을 확인해보세요',
      color: '#E91E63',
      onPress: handleOpenCompatibility,
    },
    {
      icon: UserPlus,
      label: '저장된 사람',
      description: '궁합 볼 사람들을 관리하세요',
      color: '#10B981',
      onPress: () => {
        setMenuVisible(false);
        navigation.navigate('SavedPeople');
      },
    },
    {
      icon: Calendar,
      label: '운세 히스토리',
      description: '지난 운세 기록을 확인하세요',
      color: '#3B82F6',
      onPress: () => {
        setMenuVisible(false);
        navigation.navigate('MainTabs', { screen: 'History' });
      },
    },
    {
      icon: Settings,
      label: '설정',
      description: '앱 설정 및 내 정보 관리',
      color: '#78716C',
      onPress: () => {
        setMenuVisible(false);
        navigation.navigate('MainTabs', { screen: 'Settings' });
      },
    },
  ], [navigation, handleOpenCompatibility]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFBF7" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.iconButton} onPress={() => setMenuVisible(true)}>
              <Menu color="#1C1917" size={24} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>사주팔자</Text>

            <TouchableOpacity style={styles.iconButton} onPress={handleOpenCompatibility}>
              <Heart color="#E91E63" size={24} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>나의 사주팔자</Text>
            <Text style={styles.subTitle}>당신의 운명을 확인해보세요</Text>
          </View>

          {/* Saju Wheel */}
          <SajuWheel
            dayPillar={sajuResult?.pillars.day}
            yearPillar={sajuResult?.pillars.year}
            monthPillar={sajuResult?.pillars.month}
            hourPillar={sajuResult?.pillars.hour}
          />
        </View>

        {/* Horoscope Section */}
        <LinearGradient
          colors={['rgba(250, 250, 249, 0.8)', 'rgba(255, 255, 255, 1)']}
          style={styles.horoscopeSheet}
        >
          <View style={styles.sheetHandle} />

          {/* Date Header */}
          <View style={styles.dateHeader}>
            <View style={styles.lunarBadge}>
              <Text style={styles.lunarText}>{lunarStr}</Text>
              <View style={styles.dotSeparator} />
              <Text style={styles.lunarText}>
                {todayInfo?.solarTerm || '평달'}
              </Text>
            </View>
            <Text style={styles.dateTitle}>{dateStr}</Text>
          </View>

          {/* Luck Cards */}
          <View style={styles.luckRow}>
            <LuckCard
              label="종합운"
              icon={Sparkles}
              color="#F59E0B"
              value={`${fortune.scores.overall}점`}
              score={fortune.scores.overall}
            />
            <LuckCard
              label="애정운"
              icon={Heart}
              color="#F43F5E"
              value={`${fortune.scores.love}점`}
              score={fortune.scores.love}
            />
            <LuckCard
              label="금전운"
              icon={TrendingUp}
              color="#10B981"
              value={fortune.scores.money >= 85 ? '대길' : `${fortune.scores.money}점`}
              score={fortune.scores.money}
            />
          </View>

          {/* Advice Card */}
          <AdviceCard
            mainText={fortune.detailedFortunes?.overall?.advice?.slice(0, 100) + (fortune.detailedFortunes?.overall?.advice && fortune.detailedFortunes.overall.advice.length > 100 ? '...' : '') || '오늘 하루도 긍정적인 마음으로 보내세요.'}
            subText={fortune.do ? `오늘 하면 좋은 것: ${fortune.do}` : '감사하는 마음으로 하루를 시작하세요.'}
          />

          {/* Detail Grid */}
          <DetailGrid
            luckyColor={luckyColorHex}
            luckyColorName={luckyColorName}
            luckyNumber={luckyNumber}
            luckyDirection={luckyDirection}
            luckyTime={luckyTime}
          />

          {/* Compatibility Card */}
          <CompatCard
            luckyZodiac={luckyZodiac}
            luckyEmoji={luckyZodiacEmoji}
            cautionZodiac={cautionZodiac}
            cautionEmoji={cautionZodiacEmoji}
          />

          {/* 용신 정보 카드 */}
          {fiveSpiritAnalysis && (
            <TouchableOpacity
              style={styles.yongsinCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('FortuneType', { type: 'fiveSpirits' })}
            >
              <View style={styles.yongsinHeader}>
                <Text style={styles.yongsinTitle}>나의 용신 (用神)</Text>
                <Text style={styles.yongsinBadge}>5신 분석</Text>
              </View>
              <View style={styles.yongsinContent}>
                <View style={styles.yongsinItem}>
                  <Text style={styles.yongsinLabel}>용신</Text>
                  <Text style={styles.yongsinValue}>
                    {fiveSpiritAnalysis.yongsin.element}({fiveSpiritAnalysis.yongsin.hanja})
                  </Text>
                </View>
                <View style={styles.yongsinDivider} />
                <View style={styles.yongsinItem}>
                  <Text style={styles.yongsinLabel}>희신</Text>
                  <Text style={styles.yongsinValue}>
                    {fiveSpiritAnalysis.heesin.element}({fiveSpiritAnalysis.heesin.hanja})
                  </Text>
                </View>
                <View style={styles.yongsinDivider} />
                <View style={styles.yongsinItem}>
                  <Text style={[styles.yongsinLabel, { color: '#EF4444' }]}>기신</Text>
                  <Text style={[styles.yongsinValue, { color: '#EF4444' }]}>
                    {fiveSpiritAnalysis.gisin.element}({fiveSpiritAnalysis.gisin.hanja})
                  </Text>
                </View>
              </View>
              <Text style={styles.yongsinHint}>터치하면 상세 분석을 볼 수 있어요 →</Text>
            </TouchableOpacity>
          )}

          {/* Action Button */}
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.9}
            onPress={handleViewFullFortune}
          >
            <Text style={styles.actionButtonText}>전체 운세 보기</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </LinearGradient>
      </ScrollView>

      {/* Corner Decoration */}
      <Svg height="100" width="100" style={styles.cornerDeco} pointerEvents="none">
        <Path
          d="M20 20 L50 20 L50 50"
          stroke="#1C1917"
          strokeWidth="2"
          strokeOpacity="0.1"
          fill="none"
        />
        <SvgCircle
          cx="35"
          cy="35"
          r="10"
          stroke="#1C1917"
          strokeWidth="1"
          strokeOpacity="0.1"
          fill="none"
        />
      </Svg>

      {/* Side Menu Modal */}
      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setMenuVisible(false)} />
          <View style={styles.menuContainer}>
            <SafeAreaView edges={['top']}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>메뉴</Text>
                <TouchableOpacity onPress={() => setMenuVisible(false)} style={styles.closeButton}>
                  <X color="#1C1917" size={24} />
                </TouchableOpacity>
              </View>

              {/* 사용자 정보 */}
              <View style={styles.menuUserInfo}>
                <View style={styles.menuUserAvatar}>
                  <Text style={styles.menuUserAvatarText}>
                    {profile?.name?.[0] || '사'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.menuUserName}>{profile?.name || '사용자'}님</Text>
                  <Text style={styles.menuUserDesc}>오늘도 좋은 하루 되세요</Text>
                </View>
              </View>

              {/* 메뉴 아이템 */}
              <View style={styles.menuItems}>
                {menuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.menuItem}
                    onPress={item.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.menuItemIcon, { backgroundColor: `${item.color}15` }]}>
                      <item.icon size={22} color={item.color} />
                    </View>
                    <View style={styles.menuItemContent}>
                      <Text style={styles.menuItemLabel}>{item.label}</Text>
                      <Text style={styles.menuItemDesc}>{item.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1917',
  },
  iconButton: {
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: '#EF4444',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  mainContent: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1917',
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 14,
    color: '#78716C',
  },
  horoscopeSheet: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: 30,
    marginTop: -20,
    minHeight: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    alignSelf: 'center',
    position: 'absolute',
    top: 12,
  },
  dateHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  lunarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 229, 228, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  lunarText: {
    fontSize: 12,
    color: '#57534E',
    fontWeight: '500',
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#A8A29E',
    marginHorizontal: 6,
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1917',
  },
  luckRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    width: '100%',
    backgroundColor: '#6B5B45',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#6B5B45',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: '#FDFBF7',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cornerDeco: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.5,
  },
  // 메뉴 모달 스타일
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    width: width * 0.8,
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1917',
  },
  closeButton: {
    padding: 4,
  },
  menuUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  menuUserAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6B5B45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuUserAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  menuUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1917',
  },
  menuUserDesc: {
    fontSize: 13,
    color: '#78716C',
    marginTop: 2,
  },
  menuItems: {
    padding: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 14,
  },
  menuItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1917',
  },
  menuItemDesc: {
    fontSize: 13,
    color: '#78716C',
    marginTop: 2,
  },
  // 용신 카드 스타일
  yongsinCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.2)',
  },
  yongsinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  yongsinTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
  },
  yongsinBadge: {
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: '#9333EA',
    fontWeight: '600',
    overflow: 'hidden',
  },
  yongsinContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  yongsinItem: {
    alignItems: 'center',
    flex: 1,
  },
  yongsinLabel: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '500',
    marginBottom: 4,
  },
  yongsinValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
  },
  yongsinDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  yongsinHint: {
    fontSize: 12,
    color: '#A8A29E',
    textAlign: 'center',
    marginTop: 12,
  },
});
