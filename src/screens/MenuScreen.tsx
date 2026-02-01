import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../contexts/AppContext';

const { width } = Dimensions.get('window');

export default function MenuScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useApp();

  const handleNavigate = (screen: string, params?: any) => {
    // 메뉴 닫으면서 바로 해당 화면으로 이동 (홈화면 깜빡임 방지)
    navigation.replace(screen, params);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>메뉴</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* 사용자 정보 */}
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {profile?.name?.[0] || '사'}
          </Text>
        </View>
        <View>
          <Text style={styles.userName}>{profile?.name || '사용자'}님</Text>
          <Text style={styles.userDesc}>오늘도 좋은 하루 되세요</Text>
        </View>
      </View>

      {/* 메뉴 아이템 */}
      <View style={styles.menuItems}>
        {/* 궁합 보기 */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleNavigate('Compatibility')}
        >
          <View style={[styles.menuItemIcon, { backgroundColor: '#EC489915' }]}>
            <Text style={[styles.menuIconText, { color: '#EC4899' }]}>💕</Text>
          </View>
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemLabel}>사주 궁합</Text>
            <Text style={styles.menuItemDesc}>두 사람의 궁합을 분석해보세요</Text>
          </View>
        </TouchableOpacity>

        {/* 월간 캘린더 */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleNavigate('Calendar')}
        >
          <View style={[styles.menuItemIcon, { backgroundColor: '#6366F115' }]}>
            <Text style={[styles.menuIconText, { color: '#6366F1' }]}>📅</Text>
          </View>
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemLabel}>월간 운세</Text>
            <Text style={styles.menuItemDesc}>한 달의 운세를 한눈에 확인하세요</Text>
          </View>
        </TouchableOpacity>

        {/* 저장된 사람 */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleNavigate('SavedPeople')}
        >
          <View style={[styles.menuItemIcon, { backgroundColor: '#10B98115' }]}>
            <Text style={[styles.menuIconText, { color: '#10B981' }]}>👤</Text>
          </View>
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemLabel}>저장된 사람</Text>
            <Text style={styles.menuItemDesc}>궁합 볼 사람들을 관리하세요</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1917',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#78716C',
    fontWeight: '300',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6B5B45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1917',
  },
  userDesc: {
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
  menuIconText: {
    fontSize: 20,
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
});
