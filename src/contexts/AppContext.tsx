import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, SajuResult, Settings, Fortune, TodayInfo } from '../types';
import StorageService from '../services/StorageService';
import KasiService from '../services/KasiService';
import { SajuCalculator } from '../services/SajuCalculator';

interface AppContextType {
  // 상태
  isLoading: boolean;
  isOnboardingComplete: boolean;
  profile: UserProfile | null;
  sajuResult: SajuResult | null;
  settings: Settings;
  todayInfo: TodayInfo | null;
  todayFortune: Fortune | null;

  // 액션
  setProfile: (profile: UserProfile) => Promise<void>;
  setSajuResult: (result: SajuResult) => Promise<void>;
  setSettings: (settings: Settings) => Promise<void>;
  setTodayFortune: (fortune: Fortune) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refreshTodayInfo: () => Promise<void>;
  calculateSaju: (birthDate: string, birthTime: string | null) => SajuResult;
  resetApp: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [sajuResult, setSajuResultState] = useState<SajuResult | null>(null);
  const [settings, setSettingsState] = useState<Settings>({
    tone: 'friendly',
    length: 'medium',
    notificationEnabled: false,
    notificationTime: '08:00',
  });
  const [todayInfo, setTodayInfo] = useState<TodayInfo | null>(null);
  const [todayFortune, setTodayFortuneState] = useState<Fortune | null>(null);

  // 앱 초기화
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // 데이터베이스 초기화
      await StorageService.initDatabase();

      // 저장된 데이터 로드
      const [
        savedProfile,
        savedSajuResult,
        savedSettings,
        onboardingComplete,
      ] = await Promise.all([
        StorageService.getProfile(),
        StorageService.getSajuResult(),
        StorageService.getSettings(),
        StorageService.isOnboardingComplete(),
      ]);

      if (savedProfile) setProfileState(savedProfile);
      if (savedSajuResult) setSajuResultState(savedSajuResult);
      if (savedSettings) setSettingsState(savedSettings);
      setIsOnboardingComplete(onboardingComplete);

      // 오늘 정보 로드
      await refreshTodayInfo();

      // 오늘 운세 로드
      const today = new Date().toISOString().split('T')[0];
      const savedFortune = await StorageService.getFortune(today);
      if (savedFortune) setTodayFortuneState(savedFortune);
    } catch (error) {
      console.error('App initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setProfile = async (newProfile: UserProfile) => {
    await StorageService.saveProfile(newProfile);
    setProfileState(newProfile);
  };

  const setSajuResult = async (result: SajuResult) => {
    await StorageService.saveSajuResult(result);
    setSajuResultState(result);
  };

  const setSettings = async (newSettings: Settings) => {
    await StorageService.saveSettings(newSettings);
    setSettingsState(newSettings);
  };

  const setTodayFortune = async (fortune: Fortune) => {
    const today = new Date().toISOString().split('T')[0];
    await StorageService.saveFortune(today, fortune);
    setTodayFortuneState(fortune);
  };

  const completeOnboarding = async () => {
    await StorageService.setOnboardingComplete(true);
    setIsOnboardingComplete(true);
  };

  const refreshTodayInfo = async () => {
    try {
      const info = await KasiService.getTodayInfo();
      setTodayInfo(info);
    } catch (error) {
      console.error('Failed to refresh today info:', error);
    }
  };

  const calculateSaju = (birthDate: string, birthTime: string | null): SajuResult => {
    const calculator = new SajuCalculator(birthDate, birthTime);
    return calculator.calculate();
  };

  const resetApp = async () => {
    await StorageService.clearAll();
    setProfileState(null);
    setSajuResultState(null);
    setSettingsState({
      tone: 'friendly',
      length: 'medium',
      notificationEnabled: false,
      notificationTime: '08:00',
    });
    setIsOnboardingComplete(false);
    setTodayFortuneState(null);
  };

  const value: AppContextType = {
    isLoading,
    isOnboardingComplete,
    profile,
    sajuResult,
    settings,
    todayInfo,
    todayFortune,
    setProfile,
    setSajuResult,
    setSettings,
    setTodayFortune,
    completeOnboarding,
    refreshTodayInfo,
    calculateSaju,
    resetApp,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
