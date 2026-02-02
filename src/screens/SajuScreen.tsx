import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../contexts/AppContext';
import { COLORS, FONT_SIZES } from '../utils/theme';
import { SajuInterpreter } from '../services/SajuInterpreter';

// Android LayoutAnimation 활성화
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 섹션 ID 정의
const SECTION_IDS = {
  CONCEPT: 'concept',
  PILLAR: 'pillar',
  DAYMASTER: 'daymaster',
  STRENGTH: 'strength',
  ELEMENTS: 'elements',
  YONGSIN: 'yongsin',
  HIDDEN: 'hidden',
  RELATIONS: 'relations',
  TENGOD: 'tengod',
  DAEUN: 'daeun',
  ADVICE: 'advice',
} as const;

// 섹션 메뉴 정의
const SECTION_MENU = [
  { id: SECTION_IDS.CONCEPT, emoji: '📚', label: '개념' },
  { id: SECTION_IDS.PILLAR, emoji: '🏛️', label: '사주' },
  { id: SECTION_IDS.DAYMASTER, emoji: '🌟', label: '일간' },
  { id: SECTION_IDS.STRENGTH, emoji: '📊', label: '강약' },
  { id: SECTION_IDS.ELEMENTS, emoji: '🔥', label: '오행' },
  { id: SECTION_IDS.YONGSIN, emoji: '🎯', label: '용신' },
  { id: SECTION_IDS.TENGOD, emoji: '🎭', label: '십신' },
  { id: SECTION_IDS.DAEUN, emoji: '📈', label: '대운' },
];

// 접이식 섹션 컴포넌트
interface CollapsibleSectionProps {
  title: string;
  emoji?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  sectionId?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  emoji,
  children,
  defaultExpanded = false,
  sectionId,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const rotateAnim = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setExpanded(!expanded);
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={collapsibleStyles.container}>
      <TouchableOpacity
        style={collapsibleStyles.header}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={collapsibleStyles.titleContainer}>
          {emoji && <Text style={collapsibleStyles.emoji}>{emoji}</Text>}
          <Text style={collapsibleStyles.title}>{title}</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <Text style={collapsibleStyles.arrow}>▼</Text>
        </Animated.View>
      </TouchableOpacity>
      {expanded && (
        <View style={collapsibleStyles.content}>
          {children}
        </View>
      )}
    </View>
  );
};

const collapsibleStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  arrow: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  content: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});

export default function SajuScreen() {
  const insets = useSafeAreaInsets();
  const { sajuResult, profile } = useApp();
  const scrollViewRef = useRef<ScrollView>(null);
  const [sectionLayouts, setSectionLayouts] = useState<Record<string, number>>({});
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // 섹션 위치 저장
  const handleSectionLayout = useCallback((sectionId: string, y: number) => {
    setSectionLayouts(prev => ({ ...prev, [sectionId]: y }));
  }, []);

  // 섹션으로 스크롤
  const scrollToSection = useCallback((sectionId: string) => {
    const y = sectionLayouts[sectionId];
    if (y !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: y - 60, animated: true });
      setActiveSection(sectionId);
    }
  }, [sectionLayouts]);

  if (!sajuResult) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>☯</Text>
          <Text style={styles.emptyTitle}>사주 정보가 없습니다</Text>
          <Text style={styles.emptyDesc}>프로필에서 생년월일을 입력해주세요</Text>
        </View>
      </View>
    );
  }

  const { pillars, dayMaster, dayMasterInfo, elements, tenGods, relations } = sajuResult;
  
  // 기본값 처리
  const safePillars = pillars || { year: { stem: '-', branch: '-' }, month: { stem: '-', branch: '-' }, day: { stem: '-', branch: '-' }, hour: null };
  const safeDayMaster = dayMaster || '-';
  const safeDayMasterInfo = dayMasterInfo || { element: 'wood', yinYang: 'yang', meaning: '일간 정보 없음' };
  const safeElements = elements || { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const safeTenGods = tenGods || { year: '-', month: '-', hour: null };

  // 5레이어 해석 생성 (useMemo로 캐싱)
  const dayMasterInterpretation = useMemo(() => {
    return SajuInterpreter.interpretDayMaster(safeDayMaster);
  }, [safeDayMaster]);

  const getElementColor = (element: string) => {
    const colors: Record<string, string> = {
      wood: '#4CAF50',
      fire: '#F44336',
      earth: '#FFC107',
      metal: '#9E9E9E',
      water: '#2196F3',
    };
    return colors[element] || '#666';
  };

  const getElementName = (element: string) => {
    const names: Record<string, string> = {
      wood: '목',
      fire: '화',
      earth: '토',
      metal: '금',
      water: '수',
    };
    return names[element] || element;
  };

  // ===== 고급 분석 계산 =====
  
  // 1. 일간 강약 분석
  const calculateStrength = () => {
    const seasonStrength: Record<string, number> = {
      '인': 100, '묘': 100, '진': 80,  // 봄 - 목旺
      '사': 100, '오': 100, '미': 80,  // 여름 - 화旺
      '신': 100, '유': 100, '술': 80,  // 가을 - 금旺
      '해': 100, '자': 100, '축': 80,  // 겨울 - 수旺
    };
    
    const monthBranch = safePillars.month.branch;
    const dayElement = safeDayMasterInfo.element;
    
    let score = 50;
    let reasons: string[] = [];
    
    // 월지 계절 점수
    if (seasonStrength[monthBranch]) {
      score += 15;
      reasons.push(`월지(${monthBranch})의 계절 기운이 일간을 도움`);
    }
    
    // 오행 분포로 점수 조정
    const elementEntries = Object.entries(safeElements);
    const dayElementCount = elementEntries.find(([k]) => k === dayElement)?.[1] || 0;
    const totalElements = elementEntries.reduce((sum, [, v]) => sum + v, 0);
    
    if (totalElements > 0) {
      const ratio = dayElementCount / totalElements;
      if (ratio >= 0.3) {
        score += 15;
        reasons.push('일간 오행이 사주 내에서 강함');
      } else if (ratio <= 0.1) {
        score -= 15;
        reasons.push('일간 오행이 사주 내에서 약함');
      }
    }
    
    // 십신 분석
    if (safeTenGods.month === '비견' || safeTenGods.month === '겁재') {
      score += 10;
      reasons.push('월간이 비견/겁재로 일간을 도움');
    }
    
    score = Math.max(20, Math.min(95, score));
    
    let strength = '중화';
    let analysis = '일간의 세력이 적당하여 균형 잡힌 사주입니다.';
    
    if (score >= 80) {
      strength = '신강 (身强)';
      analysis = '일간의 세력이 강하여 주변 환경에 영향을 덜 받습니다. 자신의 뜻대로 살아가는 성향이며, 리더십과 추진력이 있습니다.';
    } else if (score >= 60) {
      strength = '보통';
      analysis = '일간의 세력이 적당하여 주변과 조화를 이루며 살아갑니다. 유연성이 있고 적응력이 좋습니다.';
    } else if (score >= 40) {
      strength = '신약 (身弱)';
      analysis = '일간의 세력이 약하여 주변 환경의 영향을 많이 받습니다. 협력과 도움이 필요하며, 인내심이 강합니다.';
    } else {
      strength = '극약 (極弱)';
      analysis = '일간의 세력이 매우 약하여 많은 도움이 필요합니다. 주변의 보호와 지지가 중요합니다.';
    }
    
    return { score, strength, analysis, reasons };
  };

  const strengthAnalysis = calculateStrength();

  // 2. 용신/기신 분석
  const calculateYongsinGishin = () => {
    const elementArray = Object.entries(safeElements);
    const sorted = [...elementArray].sort((a, b) => a[1] - b[1]);
    
    // 가장 약한 것이 용신
    const yongsin = sorted[0][0];
    // 가장 강한 것이 기신
    const gishin = sorted[sorted.length - 1][0];
    // 두 번째 약한 것이 희신
    const heeshin = sorted[1][0];
    
    const dayElement = safeDayMasterInfo.element;
    
    return {
      yongsin,
      gishin,
      heeshin,
      analysis: `일간 ${getElementName(dayElement)}의 기운을 보완하기 위해 ${getElementName(yongsin)}의 기운이 필요합니다. ${getElementName(gishin)}의 기운은 과하면 해롭습니다.`
    };
  };

  const yongsinAnalysis = calculateYongsinGishin();

  // 3. 지장간 분석
  const getHiddenStems = (branch: string) => {
    const hiddenMap: Record<string, { main: string; middle?: string; residue?: string }> = {
      '자': { main: '계' },
      '축': { main: '기', middle: '계', residue: '신' },
      '인': { main: '갑', middle: '병', residue: '무' },
      '묘': { main: '을' },
      '진': { main: '무', middle: '을', residue: '계' },
      '사': { main: '병', middle: '무', residue: '경' },
      '오': { main: '정', middle: '기' },
      '미': { main: '기', middle: '정', residue: '을' },
      '신': { main: '경', middle: '임', residue: '무' },
      '유': { main: '신' },
      '술': { main: '무', middle: '신', residue: '정' },
      '해': { main: '임', middle: '갑' },
    };
    return hiddenMap[branch] || null;
  };

  // 4. 삼합 분석
  const checkThreeCombines = () => {
    const combines = [
      { branches: ['신', '자', '진'], element: 'water', name: '신자진 수국' },
      { branches: ['해', '묘', '미'], element: 'wood', name: '해묘미 목국' },
      { branches: ['인', '오', '술'], element: 'fire', name: '인오술 화국' },
      { branches: ['사', '유', '축'], element: 'metal', name: '사유축 금국' },
    ];
    
    const branches = [safePillars.year.branch, safePillars.month.branch, safePillars.day.branch, safePillars.hour?.branch].filter(Boolean);
    
    const found = combines.filter(tc => 
      tc.branches.every(b => branches.includes(b))
    );
    
    return found;
  };

  const threeCombines = checkThreeCombines();

  // 5. 육충(六冲) 분석
  const checkClashes = () => {
    const clashes = [
      { pair: ['자', '오'], name: '자오충' },
      { pair: ['축', '미'], name: '축미충' },
      { pair: ['인', '신'], name: '인신충' },
      { pair: ['묘', '유'], name: '묘유충' },
      { pair: ['진', '술'], name: '진술충' },
      { pair: ['사', '해'], name: '사해충' },
    ];
    
    const branches = [safePillars.year.branch, safePillars.month.branch, safePillars.day.branch, safePillars.hour?.branch].filter(Boolean);
    
    const found: string[] = [];
    clashes.forEach(c => {
      if (branches.includes(c.pair[0]) && branches.includes(c.pair[1])) {
        found.push(c.name);
      }
    });
    
    return found;
  };

  const clashes = checkClashes();

  // 6. 육해(六害) 분석
  const checkHarms = () => {
    const harms = [
      { pair: ['자', '미'], name: '자미해' },
      { pair: ['축', '오'], name: '축오해' },
      { pair: ['인', '사'], name: '인사해' },
      { pair: ['묘', '진'], name: '묘진해' },
      { pair: ['신', '해'], name: '신해해' },
      { pair: ['유', '술'], name: '유술해' },
    ];
    
    const branches = [safePillars.year.branch, safePillars.month.branch, safePillars.day.branch, safePillars.hour?.branch].filter(Boolean);
    
    const found: string[] = [];
    harms.forEach(h => {
      if (branches.includes(h.pair[0]) && branches.includes(h.pair[1])) {
        found.push(h.name);
      }
    });
    
    return found;
  };

  const harms = checkHarms();

  // 7. 형벌(刑罰) 분석
  const checkPunishments = () => {
    const punishments = [
      { branches: ['인', '사', '신'], name: '무례형' },
      { branches: ['축', '술', '미'], name: '방극형' },
      { branches: ['자', '묘'], name: '자묘형' },
    ];
    
    const branches = [safePillars.year.branch, safePillars.month.branch, safePillars.day.branch, safePillars.hour?.branch].filter(Boolean);
    
    const found: string[] = [];
    punishments.forEach(p => {
      const count = p.branches.filter(b => branches.includes(b)).length;
      if (count >= 2) {
        found.push(`${p.name} (${count}/3)`);
      }
    });
    
    return found;
  };

  const punishments = checkPunishments();

  // 8. 반합(2/3 삼합) 분석
  const checkHalfCombines = () => {
    const combines = [
      { branches: ['신', '자', '진'], element: 'water', name: '신자진 수국' },
      { branches: ['해', '묘', '미'], element: 'wood', name: '핵묘미 목국' },
      { branches: ['인', '오', '술'], element: 'fire', name: '인오술 화국' },
      { branches: ['사', '유', '축'], element: 'metal', name: '사유축 금국' },
    ];
    
    const branches = [safePillars.year.branch, safePillars.month.branch, safePillars.day.branch, safePillars.hour?.branch].filter(Boolean);
    
    const found = combines.map(tc => {
      const have = tc.branches.filter(b => branches.includes(b));
      const missing = tc.branches.filter(b => !branches.includes(b));
      return {
        ...tc,
        have,
        missing,
        isHalf: have.length === 2,
      };
    }).filter(tc => tc.isHalf);
    
    return found;
  };

  const halfCombines = checkHalfCombines();

  // 대운 계산 (10간 순환)
  const getDaeun = () => {
    const stems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
    const branches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

    const currentAge = profile?.birthDate
      ? new Date().getFullYear() - new Date(profile.birthDate).getFullYear() + 1
      : 30;
    const currentDaeunIndex = Math.floor((currentAge - 1) / 10);

    // 월주를 기준으로 대운 순행/역행 결정 (간략화)
    const monthStemIndex = stems.indexOf(safePillars.month.stem);
    const monthBranchIndex = branches.indexOf(safePillars.month.branch);

    const daeunList = [];

    // 과거 1개 + 현재 1개 + 미래 3개 = 총 5개 대운
    for (let i = -1; i <= 3; i++) {
      const daeunOffset = currentDaeunIndex + i;
      if (daeunOffset < 0) continue;

      const ageStart = daeunOffset * 10 + 1;
      const ageEnd = ageStart + 9;

      // 순행으로 계산 (양남/음녀 = 순행, 음남/양녀 = 역행, 여기서는 간략화)
      const stemIdx = (monthStemIndex + daeunOffset) % 10;
      const branchIdx = (monthBranchIndex + daeunOffset) % 12;

      daeunList.push({
        age: `${ageStart}-${ageEnd}`,
        stem: stems[stemIdx],
        branch: branches[branchIdx],
        isCurrent: i === 0,
        isPast: i < 0,
        isFuture: i > 0,
      });
    }

    return daeunList;
  };

  const daeunList = getDaeun();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 상단 고정 네비게이션 (운세 탭과 동일한 스타일) */}
      <View style={styles.navContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.navContent}
        >
          {SECTION_MENU.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.navItem,
                activeSection === item.id && styles.navItemActive,
              ]}
              onPress={() => scrollToSection(item.id)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.navEmoji,
                activeSection === item.id && styles.navEmojiActive,
              ]}>
                {item.emoji}
              </Text>
              <Text style={[
                styles.navItemText,
                activeSection === item.id && styles.navItemTextActive,
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          const scrollY = event.nativeEvent.contentOffset.y;
          // 현재 보이는 섹션 추적
          let currentSection = null;
          for (const [id, y] of Object.entries(sectionLayouts)) {
            if (scrollY >= y - 100) {
              currentSection = id;
            }
          }
          if (currentSection && currentSection !== activeSection) {
            setActiveSection(currentSection);
          }
        }}
        scrollEventThrottle={16}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>나의 사주</Text>
          <Text style={styles.subtitle}>{profile?.name}님의 사주팔자</Text>
        </View>

      {/* 사주팔자 개념 설명 */}
      <View
        style={styles.conceptCard}
        onLayout={(e) => handleSectionLayout(SECTION_IDS.CONCEPT, e.nativeEvent.layout.y)}
      >
        <Text style={styles.conceptTitle}>📚 사주팔자(四柱八字)란?</Text>
        <Text style={styles.conceptText}>
          사주팔자는 태어난 <Text style={styles.highlightText}>연(年)·월(月)·일(日)·시(時)</Text>를
          4개의 기둥(柱)으로 표현하고, 각 기둥마다 <Text style={styles.highlightText}>천간(天干)</Text>과
          <Text style={styles.highlightText}>지지(地支)</Text> 2글자씩 총 8글자로 나타낸 것입니다.
        </Text>
        <View style={styles.conceptDivider} />
        <View style={styles.conceptRow}>
          <View style={styles.conceptItem}>
            <Text style={styles.conceptItemTitle}>천간 (위쪽)</Text>
            <Text style={styles.conceptItemDesc}>하늘의 기운{'\n'}갑을병정무기경신임계</Text>
          </View>
          <View style={styles.conceptItem}>
            <Text style={styles.conceptItemTitle}>지지 (아래쪽)</Text>
            <Text style={styles.conceptItemDesc}>땅의 기운{'\n'}자축인묘진사오미신유술해</Text>
          </View>
        </View>
      </View>

      {/* 4주 표 */}
      <View
        style={styles.pillarCard}
        onLayout={(e) => handleSectionLayout(SECTION_IDS.PILLAR, e.nativeEvent.layout.y)}
      >
        <Text style={styles.pillarTitle}>사주팔자 (四柱八字)</Text>
        <View style={styles.pillarTable}>
          <View style={styles.tableRow}>
            <View style={styles.tableCell}><Text style={styles.tableHeader}>년주</Text></View>
            <View style={styles.tableCell}><Text style={styles.tableHeader}>월주</Text></View>
            <View style={styles.tableCell}><Text style={styles.tableHeader}>일주</Text></View>
            <View style={styles.tableCell}><Text style={styles.tableHeader}>시주</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCell}>
              <Text style={[styles.stemText, { color: getElementColor(stemToElement(safePillars.year.stem)) }]}>{safePillars.year.stem}</Text>
            </View>
            <View style={styles.tableCell}>
              <Text style={[styles.stemText, { color: getElementColor(stemToElement(safePillars.month.stem)) }]}>{safePillars.month.stem}</Text>
            </View>
            <View style={styles.tableCell}>
              <Text style={[styles.stemText, { color: getElementColor(stemToElement(safeDayMaster)) }]}>{safeDayMaster}</Text>
            </View>
            <View style={styles.tableCell}>
              <Text style={[styles.stemText, { color: safePillars.hour ? getElementColor(stemToElement(safePillars.hour.stem)) : '#999' }]}>{safePillars.hour?.stem || '-'}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCell}>
              <Text style={styles.branchText}>{safePillars.year.branch}</Text>
            </View>
            <View style={styles.tableCell}>
              <Text style={styles.branchText}>{safePillars.month.branch}</Text>
            </View>
            <View style={styles.tableCell}>
              <Text style={styles.branchText}>{safePillars.day.branch}</Text>
            </View>
            <View style={styles.tableCell}>
              <Text style={styles.branchText}>{safePillars.hour?.branch || '-'}</Text>
            </View>
          </View>
        </View>

        {/* 4주 각각의 의미 설명 */}
        <View style={styles.pillarMeanings}>
          <View style={styles.pillarMeaningItem}>
            <Text style={styles.pillarMeaningLabel}>년주 (年柱)</Text>
            <Text style={styles.pillarMeaningDesc}>조상운, 유년기 (0~16세)</Text>
          </View>
          <View style={styles.pillarMeaningItem}>
            <Text style={styles.pillarMeaningLabel}>월주 (月柱)</Text>
            <Text style={styles.pillarMeaningDesc}>부모운, 청년기 (17~32세)</Text>
          </View>
          <View style={styles.pillarMeaningItem}>
            <Text style={styles.pillarMeaningLabel}>일주 (日柱)</Text>
            <Text style={styles.pillarMeaningDesc}>본인/배우자, 중년 (33~48세)</Text>
          </View>
          <View style={styles.pillarMeaningItem}>
            <Text style={styles.pillarMeaningLabel}>시주 (時柱)</Text>
            <Text style={styles.pillarMeaningDesc}>자녀운, 노년 (49세~)</Text>
          </View>
        </View>
      </View>

      {/* 일간(日干) 해설 - 5레이어 해석 */}
      <View
        style={styles.dayMasterCard}
        onLayout={(e) => handleSectionLayout(SECTION_IDS.DAYMASTER, e.nativeEvent.layout.y)}
      >
        <Text style={styles.dayMasterTitle}>🌟 나의 일간(日干): {safeDayMaster}</Text>
        <Text style={styles.dayMasterSubtitle}>일간은 '나 자신'을 나타내는 가장 중요한 글자입니다</Text>

        <View style={styles.dayMasterInfo}>
          <View style={[styles.dayMasterElement, { backgroundColor: getElementColor(safeDayMasterInfo.element) + '20' }]}>
            <Text style={[styles.dayMasterElementText, { color: getElementColor(safeDayMasterInfo.element) }]}>
              {dayMasterInterpretation?.koreanName || `${getElementName(safeDayMasterInfo.element)} (${safeDayMasterInfo.element.toUpperCase()})`}
            </Text>
            <Text style={styles.dayMasterYinYang}>
              {safeDayMasterInfo.yinYang === 'yang' ? '양(陽) - 적극적, 외향적' : '음(陰) - 수용적, 내향적'}
            </Text>
          </View>
          {dayMasterInterpretation && (
            <Text style={styles.dayMasterSymbol}>
              「{dayMasterInterpretation.symbol}」 - {dayMasterInterpretation.nature}
            </Text>
          )}
          <Text style={styles.dayMasterMeaning}>{safeDayMasterInfo.meaning}</Text>
        </View>

        {/* Layer 5: 스토리텔링 - 메타포 */}
        {dayMasterInterpretation && (
          <View style={styles.metaphorBox}>
            <Text style={styles.metaphorText}>"{dayMasterInterpretation.metaphor}"</Text>
            <Text style={styles.quoteText}>💬 {dayMasterInterpretation.quote}</Text>
          </View>
        )}

        {/* Layer 3: 성격 특성 */}
        {dayMasterInterpretation && (
          <View style={styles.personalitySection}>
            <Text style={styles.sectionSubtitle}>🎭 나의 성격 특성</Text>
            <View style={styles.bulletList}>
              {dayMasterInterpretation.personality.map((trait, idx) => (
                <Text key={idx} style={styles.bulletItem}>• {trait}</Text>
              ))}
            </View>
          </View>
        )}

        {/* 강점 / 약점 */}
        {dayMasterInterpretation && (
          <View style={styles.strengthWeaknessRow}>
            <View style={styles.strengthBox}>
              <Text style={styles.strengthBoxTitle}>✨ 강점</Text>
              {dayMasterInterpretation.strengths.map((s, idx) => (
                <Text key={idx} style={styles.strengthItem}>• {s}</Text>
              ))}
            </View>
            <View style={styles.weaknessBox}>
              <Text style={styles.weaknessBoxTitle}>⚠️ 약점</Text>
              {dayMasterInterpretation.weaknesses.map((w, idx) => (
                <Text key={idx} style={styles.weaknessItem}>• {w}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Layer 4: 실전 조언 (접이식) */}
        {dayMasterInterpretation && (
          <CollapsibleSection title="실전 생활 조언" emoji="💡" defaultExpanded={false}>
            <View style={styles.dayMasterAdviceSection}>
              <View style={styles.dayMasterAdviceBlock}>
                <Text style={styles.dayMasterAdviceLabel}>💼 직업/커리어</Text>
                <Text style={styles.dayMasterAdviceText}>{dayMasterInterpretation.career}</Text>
              </View>
              <View style={styles.dayMasterAdviceBlock}>
                <Text style={styles.dayMasterAdviceLabel}>💑 대인관계</Text>
                <Text style={styles.dayMasterAdviceText}>{dayMasterInterpretation.relationships}</Text>
              </View>
              <View style={styles.dayMasterAdviceBlock}>
                <Text style={styles.dayMasterAdviceLabel}>🏥 건강 관리</Text>
                <Text style={styles.dayMasterAdviceText}>{dayMasterInterpretation.health}</Text>
              </View>
              <View style={styles.growthSection}>
                <Text style={styles.dayMasterAdviceLabel}>🌱 성장 포인트</Text>
                {dayMasterInterpretation.growthPoints.map((point, idx) => (
                  <Text key={idx} style={styles.growthItem}>✓ {point}</Text>
                ))}
              </View>
            </View>
          </CollapsibleSection>
        )}

        {/* 기존 기본 성격 (dayMasterInterpretation이 없을 때 폴백) */}
        {!dayMasterInterpretation && (
          <View style={styles.dayMasterTip}>
            <Text style={styles.dayMasterTipTitle}>💡 일간별 기본 성격</Text>
            <Text style={styles.dayMasterTipText}>
              {safeDayMaster === '갑' && '갑목(甲木): 큰 나무처럼 곧고 정직하며, 리더십이 있습니다.'}
              {safeDayMaster === '을' && '을목(乙木): 덩굴처럼 유연하고 적응력이 뛰어납니다.'}
              {safeDayMaster === '병' && '병화(丙火): 태양처럼 밝고 따뜻하며, 열정적입니다.'}
              {safeDayMaster === '정' && '정화(丁火): 촛불처럼 은은하고 섬세합니다.'}
              {safeDayMaster === '무' && '무토(戊土): 산처럼 듬직하고 안정적입니다.'}
              {safeDayMaster === '기' && '기토(己土): 논밭처럼 포용력이 있습니다.'}
              {safeDayMaster === '경' && '경금(庚金): 바위처럼 강하고 단호합니다.'}
              {safeDayMaster === '신' && '신금(辛金): 보석처럼 섬세하고 예민합니다.'}
              {safeDayMaster === '임' && '임수(壬水): 바다처럼 넓고 깊습니다.'}
              {safeDayMaster === '계' && '계수(癸水): 비/이슬처럼 조용하고 깊습니다.'}
              {!['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'].includes(safeDayMaster) && '일간 정보를 불러올 수 없습니다.'}
            </Text>
          </View>
        )}
      </View>

      {/* ===== 고급 분석 시작 ===== */}

      {/* 1. 일간 강약 분석 */}
      <View
        style={styles.infoCard}
        onLayout={(e) => handleSectionLayout(SECTION_IDS.STRENGTH, e.nativeEvent.layout.y)}
      >
        <Text style={styles.infoTitle}>📊 일간 강약 분석</Text>
        <View style={styles.strengthGauge}>
          <View style={styles.gaugeHeader}>
            <Text style={styles.gaugeLabel}>일간 세력</Text>
            <Text style={[styles.gaugeValue, { 
              color: strengthAnalysis.score >= 70 ? '#4CAF50' : strengthAnalysis.score >= 45 ? '#FFC107' : '#F44336' 
            }]}>
              {strengthAnalysis.strength} ({strengthAnalysis.score}점)
            </Text>
          </View>
          <View style={styles.gaugeBar}>
            <View style={[styles.gaugeFill, { 
              width: `${strengthAnalysis.score}%`,
              backgroundColor: strengthAnalysis.score >= 70 ? '#4CAF50' : strengthAnalysis.score >= 45 ? '#FFC107' : '#F44336'
            }]} />
          </View>
          <View style={styles.gaugeLabels}>
            <Text style={styles.gaugeLabelText}>약</Text>
            <Text style={styles.gaugeLabelText}>중화</Text>
            <Text style={styles.gaugeLabelText}>강</Text>
          </View>
        </View>
        <Text style={styles.analysisText}>{strengthAnalysis.analysis}</Text>
        <View style={styles.reasonsBox}>
          {strengthAnalysis.reasons.map((reason, idx) => (
            <Text key={idx} style={styles.reasonText}>• {reason}</Text>
          ))}
        </View>
      </View>

      {/* 오행 분포 시각화 */}
      <View
        style={styles.infoCard}
        onLayout={(e) => handleSectionLayout(SECTION_IDS.ELEMENTS, e.nativeEvent.layout.y)}
      >
        <Text style={styles.infoTitle}>🔥 오행(五行) 분포</Text>
        <Text style={styles.elementDesc}>내 사주에 담긴 5가지 기운의 균형을 확인해보세요</Text>

        <View style={styles.elementChart}>
          {Object.entries(safeElements).map(([element, count]) => {
            const total = Object.values(safeElements).reduce((a, b) => a + b, 0);
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
            const isYongsin = element === yongsinAnalysis.yongsin;
            const isGishin = element === yongsinAnalysis.gishin;
            return (
              <View key={element} style={[styles.elementBarContainer, isYongsin && styles.elementBarYongsin]}>
                <View style={styles.elementBarHeader}>
                  <View style={styles.elementBarNameRow}>
                    <Text style={[styles.elementBarName, { color: getElementColor(element) }]}>
                      {getElementName(element)}
                    </Text>
                    {isYongsin && <Text style={styles.yongsinStar}>★ 용신</Text>}
                    {isGishin && <Text style={styles.gishinMark}>⚠️</Text>}
                  </View>
                  <Text style={styles.elementBarCount}>{count}개 ({percent}%)</Text>
                </View>
                <View style={styles.elementBarBg}>
                  <View style={[styles.elementBarFill, {
                    width: `${Math.max(percent, 5)}%`,
                    backgroundColor: getElementColor(element)
                  }]} />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.elementExplain}>
          <Text style={styles.elementExplainTitle}>🌿 오행의 의미</Text>
          <View style={styles.elementExplainGrid}>
            <View style={styles.elementExplainItem}>
              <Text style={[styles.elementExplainName, { color: '#4CAF50' }]}>목(木)</Text>
              <Text style={styles.elementExplainText}>성장, 시작{'\n'}인자함, 창의력</Text>
            </View>
            <View style={styles.elementExplainItem}>
              <Text style={[styles.elementExplainName, { color: '#F44336' }]}>화(火)</Text>
              <Text style={styles.elementExplainText}>열정, 표현{'\n'}예절, 명예</Text>
            </View>
            <View style={styles.elementExplainItem}>
              <Text style={[styles.elementExplainName, { color: '#FFC107' }]}>토(土)</Text>
              <Text style={styles.elementExplainText}>중심, 안정{'\n'}신뢰, 포용</Text>
            </View>
            <View style={styles.elementExplainItem}>
              <Text style={[styles.elementExplainName, { color: '#9E9E9E' }]}>금(金)</Text>
              <Text style={styles.elementExplainText}>결단, 정의{'\n'}의리, 강인함</Text>
            </View>
            <View style={styles.elementExplainItem}>
              <Text style={[styles.elementExplainName, { color: '#2196F3' }]}>수(水)</Text>
              <Text style={styles.elementExplainText}>지혜, 유연{'\n'}적응력, 소통</Text>
            </View>
          </View>
        </View>

        <View style={styles.elementBalance}>
          <Text style={styles.elementBalanceTitle}>⚖️ 나의 오행 밸런스</Text>
          <Text style={styles.elementBalanceText}>
            {(() => {
              const sorted = Object.entries(safeElements).sort((a, b) => b[1] - a[1]);
              const strongest = sorted[0];
              const weakest = sorted[sorted.length - 1];
              return `가장 강한 기운: ${getElementName(strongest[0])}(${strongest[1]}개)\n가장 약한 기운: ${getElementName(weakest[0])}(${weakest[1]}개)\n\n${strongest[1] - weakest[1] > 3 ? '⚠️ 오행의 균형이 다소 치우쳐 있습니다. 부족한 기운을 보완하면 좋습니다.' : '✅ 오행이 비교적 균형 잡혀 있습니다.'}`;
            })()}
          </Text>
        </View>
      </View>

      {/* 2. 용신/기신 분석 */}
      <View
        style={styles.infoCard}
        onLayout={(e) => handleSectionLayout(SECTION_IDS.YONGSIN, e.nativeEvent.layout.y)}
      >
        <Text style={styles.infoTitle}>🎯 용신(用神) / 기신(忌神)</Text>
        <Text style={styles.yongsinDesc}>사주의 균형을 위한 오행 분석</Text>
        
        <View style={styles.yongsinRow}>
          <View style={[styles.yongsinBadge, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.yongsinBadgeLabel}>✨ 용신 (도움)</Text>
            <View style={[styles.elementDot, { backgroundColor: getElementColor(yongsinAnalysis.yongsin) }]} />
            <Text style={styles.yongsinBadgeText}>{getElementName(yongsinAnalysis.yongsin)}</Text>
          </View>
          <View style={[styles.yongsinBadge, { backgroundColor: '#FFF3E0' }]}>
            <Text style={styles.yongsinBadgeLabel}>💫 희신 (보조)</Text>
            <View style={[styles.elementDot, { backgroundColor: getElementColor(yongsinAnalysis.heeshin) }]} />
            <Text style={styles.yongsinBadgeText}>{getElementName(yongsinAnalysis.heeshin)}</Text>
          </View>
          <View style={[styles.yongsinBadge, { backgroundColor: '#FFEBEE' }]}>
            <Text style={styles.yongsinBadgeLabel}>⚠️ 기신 (주의)</Text>
            <View style={[styles.elementDot, { backgroundColor: getElementColor(yongsinAnalysis.gishin) }]} />
            <Text style={styles.yongsinBadgeText}>{getElementName(yongsinAnalysis.gishin)}</Text>
          </View>
        </View>
        
        <Text style={styles.yongsinAnalysis}>{yongsinAnalysis.analysis}</Text>
        
        <View style={styles.recommendBox}>
          <Text style={styles.recommendTitle}>💡 행운 가이드</Text>
          <View style={styles.recommendRow}>
            <Text style={styles.recommendLabel}>🎨 유리한 색상:</Text>
            <Text style={styles.recommendValue}>
              {yongsinAnalysis.yongsin === 'wood' ? '녹색, 청록색' :
               yongsinAnalysis.yongsin === 'fire' ? '빨간색, 주황색' :
               yongsinAnalysis.yongsin === 'earth' ? '노란색, 갈색' :
               yongsinAnalysis.yongsin === 'metal' ? '흰색, 금색, 은색' : '검은색, 파란색'}
            </Text>
          </View>
          <View style={styles.recommendRow}>
            <Text style={styles.recommendLabel}>🧭 유리한 방향:</Text>
            <Text style={styles.recommendValue}>
              {yongsinAnalysis.yongsin === 'wood' ? '동쪽 (90°)' :
               yongsinAnalysis.yongsin === 'fire' ? '남쪽 (180°)' :
               yongsinAnalysis.yongsin === 'earth' ? '중앙' :
               yongsinAnalysis.yongsin === 'metal' ? '서쪽 (270°)' : '북쪽 (0°)'}
            </Text>
          </View>
          <View style={styles.recommendRow}>
            <Text style={styles.recommendLabel}>🔢 행운의 숫자:</Text>
            <Text style={styles.recommendValue}>
              {yongsinAnalysis.yongsin === 'wood' ? '3, 8' :
               yongsinAnalysis.yongsin === 'fire' ? '2, 7' :
               yongsinAnalysis.yongsin === 'earth' ? '5, 10' :
               yongsinAnalysis.yongsin === 'metal' ? '4, 9' : '1, 6'}
            </Text>
          </View>
          <View style={styles.recommendRow}>
            <Text style={styles.recommendLabel}>🌿 추천 활동:</Text>
            <Text style={styles.recommendValue}>
              {yongsinAnalysis.yongsin === 'wood' ? '산책, 등산, 원예, 독서' :
               yongsinAnalysis.yongsin === 'fire' ? '운동, 사교 모임, 발표, 창작 활동' :
               yongsinAnalysis.yongsin === 'earth' ? '명상, 요리, 부동산 관련, 안정적 투자' :
               yongsinAnalysis.yongsin === 'metal' ? '정리정돈, 재무관리, 결단 필요한 일' : '수영, 여행, 학습, 유연한 대응'}
            </Text>
          </View>
        </View>

        <View style={styles.cautionBox}>
          <Text style={styles.cautionTitle}>⚠️ 주의사항 (기신 관련)</Text>
          <View style={styles.cautionRow}>
            <Text style={styles.cautionLabel}>피해야 할 색상:</Text>
            <Text style={styles.cautionValue}>
              {yongsinAnalysis.gishin === 'wood' ? '녹색 계열' :
               yongsinAnalysis.gishin === 'fire' ? '빨간색 계열' :
               yongsinAnalysis.gishin === 'earth' ? '노란색, 갈색 계열' :
               yongsinAnalysis.gishin === 'metal' ? '흰색, 금속색' : '검은색, 파란색 계열'}
            </Text>
          </View>
          <View style={styles.cautionRow}>
            <Text style={styles.cautionLabel}>주의할 활동:</Text>
            <Text style={styles.cautionValue}>
              {yongsinAnalysis.gishin === 'wood' ? '무리한 시작, 과도한 확장' :
               yongsinAnalysis.gishin === 'fire' ? '과도한 경쟁, 충동적 결정' :
               yongsinAnalysis.gishin === 'earth' ? '완고한 고집, 변화 거부' :
               yongsinAnalysis.gishin === 'metal' ? '지나친 비판, 완벽주의' : '우유부단, 감정적 결정'}
            </Text>
          </View>
        </View>
      </View>

      {/* 3. 지장간 분석 */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🔮 지장간(地藏干) 분석</Text>
        <Text style={styles.hiddenStemDesc}>지지 속에 숨겨진 천간 (내면의 성향)</Text>
        
        {['year', 'month', 'day', 'hour'].map((pillar) => {
          const p = safePillars[pillar as keyof typeof safePillars];
          if (!p || pillar === 'hour' && !p) return null;
          const hidden = getHiddenStems(p.branch);
          if (!hidden) return null;
          
          const names = { year: '년주', month: '월주', day: '일주', hour: '시주' };
          const meanings: Record<string, string> = {
            'year': '조상, 부모, 유년기의 영향을 나타냅니다.',
            'month': '형제, 부모, 청년기의 환경을 나타냅니다.',
            'day': '배우자, 자신, 중년의 운세를 나타냅니다.',
            'hour': '자녀, 노년, 남은 생의 영향을 나타냅니다.',
          };
          
          return (
            <View key={pillar} style={styles.hiddenStemCard}>
              <View style={styles.hiddenStemHeader}>
                <Text style={styles.hiddenStemPillar}>{names[pillar as keyof typeof names]}</Text>
                <Text style={styles.hiddenStemBranch}>{p.branch}</Text>
              </View>
              <Text style={styles.hiddenStemMeaning}>{meanings[pillar]}</Text>
              <View style={styles.hiddenStemRow}>
                <View style={styles.hiddenStemItem}>
                  <Text style={styles.hiddenStemLabel}>본기(主氣)</Text>
                  <Text style={[styles.hiddenStemValue, { color: getElementColor(stemToElement(hidden.main)) }]}>{hidden.main}</Text>
                  <Text style={styles.hiddenStemDesc}>가장 강한 기운</Text>
                </View>
                {hidden.middle && (
                  <View style={styles.hiddenStemItem}>
                    <Text style={styles.hiddenStemLabel}>중기(中氣)</Text>
                    <Text style={[styles.hiddenStemValue, { color: getElementColor(stemToElement(hidden.middle)) }]}>{hidden.middle}</Text>
                    <Text style={styles.hiddenStemDesc}>중간 기운</Text>
                  </View>
                )}
                {hidden.residue && (
                  <View style={styles.hiddenStemItem}>
                    <Text style={styles.hiddenStemLabel}>여기(餘氣)</Text>
                    <Text style={[styles.hiddenStemValue, { color: getElementColor(stemToElement(hidden.residue)) }]}>{hidden.residue}</Text>
                    <Text style={styles.hiddenStemDesc}>잔여 기운</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
        
        <CollapsibleSection
          title="지장간(地藏干)이란?"
          emoji="🔮"
          defaultExpanded={false}
        >
          <Text style={styles.hiddenStemInfoText}>
            지장간은 지지(地支) 속에 숨겨진 천간(天干)으로, 겉으로 드러나지 않는 내면의 성향이나
            잠재력을 나타냅니다.{'\n\n'}
            • <Text style={{ fontWeight: '700' }}>본기(主氣)</Text>: 가장 강한 영향력{'\n'}
            • <Text style={{ fontWeight: '700' }}>중기(中氣)</Text>: 중간 정도의 영향{'\n'}
            • <Text style={{ fontWeight: '700' }}>여기(餘氣)</Text>: 보조적인 영향
          </Text>
        </CollapsibleSection>
      </View>

      {/* 4. 삼합 분석 */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>⚡ 삼합(三合) 분석</Text>
        <Text style={styles.combineDesc}>세 지지의 강력한 결합 - 해당 오행의 기운이 극대화됩니다</Text>
        
        {threeCombines.length > 0 ? (
          threeCombines.map((tc, idx) => (
            <View key={idx} style={[styles.combineCard, { borderLeftColor: getElementColor(tc.element) }]}>
              <View style={styles.combineHeader}>
                <View style={[styles.elementDot, { backgroundColor: getElementColor(tc.element) }]} />
                <Text style={styles.combineName}>{tc.name}</Text>
              </View>
              <Text style={styles.combineText}>
                {getElementName(tc.element)}(三合局)이 형성되어 {getElementName(tc.element)}의 기운이 매우 강하게 작용합니다.{'\n'}
                {tc.element === 'wood' && '목(木)의 생명력, 성장, 확장의 기운이 강화됩니다.'}
                {tc.element === 'fire' && '화(火)의 열정, 활력, 명예의 기운이 강화됩니다.'}
                {tc.element === 'metal' && '금(金)의 결단력, 집중력, 재물의 기운이 강화됩니다.'}
                {tc.element === 'water' && '수(水)의 지혜, 유동성, 커뮤니케이션 기운이 강화됩니다.'}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noCombineText}>사주에 삼합이 형성되지 않았습니다.</Text>
        )}
        
        <CollapsibleSection
          title="삼합이란?"
          emoji="📚"
          defaultExpanded={false}
        >
          <Text style={styles.combineInfoText}>
            삼합은 세 개의 지지가 결합하여 특정 오행의 기운을 극대화하는 현상입니다.{'\n\n'}
            • <Text style={{ color: '#2196F3', fontWeight: '600' }}>신자진합(申子辰合)</Text>: 수(水)국{'\n'}
            • <Text style={{ color: '#4CAF50', fontWeight: '600' }}>해묘미합(亥卯未合)</Text>: 목(木)국{'\n'}
            • <Text style={{ color: '#F44336', fontWeight: '600' }}>인오술합(寅午戌合)</Text>: 화(火)국{'\n'}
            • <Text style={{ color: '#9E9E9E', fontWeight: '600' }}>사유축합(巳酉丑合)</Text>: 금(金)국
          </Text>
        </CollapsibleSection>
      </View>

      {/* 5. 육충 분석 */}
      {clashes.length > 0 && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>⚠️ 충(冲) 분석</Text>
          <Text style={styles.clashDesc}>지지 간의 대립 관계 - 변화와 갈등의 기운</Text>
          {clashes.map((clash, idx) => (
            <View key={idx} style={styles.clashItem}>
              <Text style={styles.clashText}>{clash}</Text>
            </View>
          ))}
          <Text style={styles.clashNote}>
            충은 대립과 변화를 의미합니다. 주변 환경이나 인간관계에서 갈등이 생길 수 있으며, 
            이를 극복하면 큰 성장의 계기가 됩니다.
          </Text>
        </View>
      )}

      {/* 6. 육해 분석 */}
      {harms.length > 0 && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💔 육해(六害) 분석</Text>
          <Text style={styles.harmDesc}>지지 간의 해로운 관계 - 미묘한 갈등과 손실</Text>
          {harms.map((harm, idx) => (
            <View key={idx} style={styles.harmItem}>
              <Text style={styles.harmText}>{harm}</Text>
            </View>
          ))}
          <Text style={styles.harmNote}>
            육해는 명백하지 않은 미묘한 갈등을 나타냅니다. 보이지 않는 곳에서 손실이나 
            어려움이 발생할 수 있으니 신중한 판단이 필요합니다.
          </Text>
        </View>
      )}

      {/* 7. 형벌 분석 */}
      {punishments.length > 0 && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>⛓️ 형벌(刑罰) 분석</Text>
          <Text style={styles.punishDesc}>지지 간의 형벌 관계</Text>
          {punishments.map((p, idx) => (
            <View key={idx} style={styles.punishItem}>
              <Text style={styles.punishText}>{p}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 8. 반합 분석 */}
      {halfCombines.length > 0 && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🔸 반합(半合) 분석</Text>
          <Text style={styles.halfDesc}>2/3 형성된 삼합</Text>
          {halfCombines.map((hc, idx) => (
            <View key={idx} style={styles.halfItem}>
              <View style={styles.halfHeader}>
                <View style={[styles.elementDot, { backgroundColor: getElementColor(hc.element) }]} />
                <Text style={styles.halfName}>{hc.name}</Text>
              </View>
              <Text style={styles.halfText}>
                보유: {hc.have.join(', ')} / 부족: {hc.missing.join(', ')}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* 9. 십신 정보 */}
      <View
        style={styles.infoCard}
        onLayout={(e) => handleSectionLayout(SECTION_IDS.TENGOD, e.nativeEvent.layout.y)}
      >
        <Text style={styles.infoTitle}>🎭 십신(十神) 정보</Text>
        <Text style={styles.tenGodDesc}>십신은 일간(나)을 기준으로 다른 천간과의 관계를 나타냅니다</Text>

        <View style={styles.tenGodRow}>
          <View style={styles.tenGodItem}>
            <Text style={styles.tenGodLabel}>년간</Text>
            <Text style={styles.tenGodValue}>{safeTenGods.year}</Text>
          </View>
          <View style={styles.tenGodItem}>
            <Text style={styles.tenGodLabel}>월간</Text>
            <Text style={styles.tenGodValue}>{safeTenGods.month}</Text>
          </View>
          {safeTenGods.hour && (
            <View style={styles.tenGodItem}>
              <Text style={styles.tenGodLabel}>시간</Text>
              <Text style={styles.tenGodValue}>{safeTenGods.hour}</Text>
            </View>
          )}
        </View>

        {/* 십신 상세 해설 - 접이식 */}
        <CollapsibleSection
          title="십신(十神) 의미 해설"
          emoji="📖"
          defaultExpanded={false}
        >
          <View style={styles.tenGodCategory}>
            <Text style={styles.tenGodCategoryTitle}>👥 비겁(比劫) - 나와 같은 오행</Text>
            <View style={styles.tenGodDetailItem}>
              <Text style={styles.tenGodDetailName}>비견(比肩)</Text>
              <Text style={styles.tenGodDetailDesc}>형제, 친구, 동료. 자존심, 독립심을 나타냅니다.</Text>
            </View>
            <View style={styles.tenGodDetailItem}>
              <Text style={styles.tenGodDetailName}>겁재(劫財)</Text>
              <Text style={styles.tenGodDetailDesc}>경쟁자. 욕심, 추진력, 도전정신을 나타냅니다.</Text>
            </View>
          </View>

          <View style={styles.tenGodCategory}>
            <Text style={styles.tenGodCategoryTitle}>💡 식상(食傷) - 내가 생하는 오행</Text>
            <View style={styles.tenGodDetailItem}>
              <Text style={styles.tenGodDetailName}>식신(食神)</Text>
              <Text style={styles.tenGodDetailDesc}>자녀, 창작물. 재능, 표현력을 나타냅니다.</Text>
            </View>
            <View style={styles.tenGodDetailItem}>
              <Text style={styles.tenGodDetailName}>상관(傷官)</Text>
              <Text style={styles.tenGodDetailDesc}>예술성, 자유로움. 창의력, 언변을 나타냅니다.</Text>
            </View>
          </View>

          <View style={styles.tenGodCategory}>
            <Text style={styles.tenGodCategoryTitle}>💵 재성(財星) - 내가 극하는 오행</Text>
            <View style={styles.tenGodDetailItem}>
              <Text style={styles.tenGodDetailName}>편재(偏財)</Text>
              <Text style={styles.tenGodDetailDesc}>횡재, 아버지. 사업수완, 투자력을 나타냅니다.</Text>
            </View>
            <View style={styles.tenGodDetailItem}>
              <Text style={styles.tenGodDetailName}>정재(正財)</Text>
              <Text style={styles.tenGodDetailDesc}>월급, 아내. 성실함, 안정추구를 나타냅니다.</Text>
            </View>
          </View>

          <View style={styles.tenGodCategory}>
            <Text style={styles.tenGodCategoryTitle}>👔 관성(官星) - 나를 극하는 오행</Text>
            <View style={styles.tenGodDetailItem}>
              <Text style={styles.tenGodDetailName}>편관(偏官)</Text>
              <Text style={styles.tenGodDetailDesc}>권력, 남편(여). 카리스마, 결단력을 나타냅니다.</Text>
            </View>
            <View style={styles.tenGodDetailItem}>
              <Text style={styles.tenGodDetailName}>정관(正官)</Text>
              <Text style={styles.tenGodDetailDesc}>직장, 명예. 책임감, 질서의식을 나타냅니다.</Text>
            </View>
          </View>

          <View style={[styles.tenGodCategory, { borderBottomWidth: 0 }]}>
            <Text style={styles.tenGodCategoryTitle}>📚 인성(印星) - 나를 생하는 오행</Text>
            <View style={styles.tenGodDetailItem}>
              <Text style={styles.tenGodDetailName}>편인(偏印)</Text>
              <Text style={styles.tenGodDetailDesc}>스승. 창의력, 독창성, 영감을 나타냅니다.</Text>
            </View>
            <View style={styles.tenGodDetailItem}>
              <Text style={styles.tenGodDetailName}>정인(正印)</Text>
              <Text style={styles.tenGodDetailDesc}>어머니, 학문. 지혜, 학습능력을 나타냅니다.</Text>
            </View>
          </View>
        </CollapsibleSection>
      </View>

      {/* 7. 대운 */}
      <View
        style={styles.infoCard}
        onLayout={(e) => handleSectionLayout(SECTION_IDS.DAEUN, e.nativeEvent.layout.y)}
      >
        <Text style={styles.infoTitle}>📈 10년 대운(大運)</Text>
        <Text style={styles.daeunExplainText}>
          대운은 10년마다 바뀌는 인생의 큰 흐름입니다. 마치 계절이 바뀌듯 삶의 환경과 운의 흐름이 변합니다.
        </Text>

        {daeunList.map((daeun, idx) => {
          const daeunElement = stemToElement(daeun.stem);
          const dayElement = safeDayMasterInfo.element;

          // 대운과 일간의 관계 분석
          const getRelation = () => {
            if (daeunElement === dayElement) return { type: '비겁운', desc: '독립심과 자존심이 강해지는 시기입니다. 경쟁이 치열해지지만 성장의 기회도 있습니다.', color: '#9C27B0' };
            // 오행상생상극 관계
            const generates: Record<string, string> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
            const controls: Record<string, string> = { wood: 'earth', fire: 'metal', earth: 'water', metal: 'wood', water: 'fire' };

            if (generates[dayElement] === daeunElement) return { type: '식상운', desc: '표현력과 창의력이 높아지는 시기입니다. 예술, 창작 활동에 유리합니다.', color: '#FF9800' };
            if (generates[daeunElement] === dayElement) return { type: '인성운', desc: '학습, 자격증, 부동산에 유리한 시기입니다. 어머니/어른의 도움이 있습니다.', color: '#2196F3' };
            if (controls[dayElement] === daeunElement) return { type: '재성운', desc: '재물운이 활발한 시기입니다. 사업, 투자에 적극적으로 나설 때입니다.', color: '#4CAF50' };
            if (controls[daeunElement] === dayElement) return { type: '관성운', desc: '직장, 승진, 시험에 유리한 시기입니다. 책임감이 커지고 사회적 인정을 받습니다.', color: '#F44336' };
            return { type: '혼합운', desc: '다양한 기운이 작용하는 시기입니다.', color: '#607D8B' };
          };

          const relation = getRelation();

          return (
            <View key={idx} style={[
              styles.daeunItem,
              daeun.isCurrent && styles.daeunItemCurrent,
              daeun.isPast && styles.daeunItemPast,
            ]}>
              <View style={styles.daeunHeader}>
                <View style={styles.daeunAge}>
                  <Text style={[styles.daeunAgeText, daeun.isPast && styles.daeunAgePast]}>{daeun.age}세</Text>
                  {daeun.isCurrent && <View style={styles.daeunCurrentBadge}><Text style={styles.daeunCurrentText}>현재</Text></View>}
                  {daeun.isPast && <Text style={styles.daeunPastLabel}>지난 대운</Text>}
                </View>
                <View style={styles.daeunGanji}>
                  <Text style={[styles.daeunStem, { color: getElementColor(daeunElement) }]}>{daeun.stem}</Text>
                  <Text style={styles.daeunBranch}>{daeun.branch}</Text>
                </View>
              </View>
              <View style={[styles.daeunRelation, { backgroundColor: relation.color + '15' }]}>
                <Text style={[styles.daeunRelationType, { color: relation.color }]}>{relation.type}</Text>
                <Text style={styles.daeunRelationDesc}>{daeun.isCurrent ? relation.desc : `${relation.type}의 시기입니다.`}</Text>
              </View>
            </View>
          );
        })}

        <View style={styles.daeunTip}>
          <Text style={styles.daeunTipTitle}>💡 대운 활용 팁</Text>
          <Text style={styles.daeunTipText}>
            • <Text style={{ fontWeight: '700' }}>비겁운</Text>: 독립, 창업에 도전하되 경쟁에 주의{'\n'}
            • <Text style={{ fontWeight: '700' }}>식상운</Text>: 창작, 표현, 자녀 관련 일에 집중{'\n'}
            • <Text style={{ fontWeight: '700' }}>재성운</Text>: 적극적인 투자와 사업 확장의 기회{'\n'}
            • <Text style={{ fontWeight: '700' }}>관성운</Text>: 승진, 시험, 사회적 성취에 유리{'\n'}
            • <Text style={{ fontWeight: '700' }}>인성운</Text>: 학습, 자격증 취득, 부동산에 좋음
          </Text>
        </View>
      </View>

      {/* 8. 합충 정보 */}
      {relations && (relations.combines.length > 0 || relations.clashes.length > 0) && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🔗 합충 관계</Text>
          {relations.combines.length > 0 && (
            <View style={styles.relationRow}>
              <Text style={styles.relationLabel}>합:</Text>
              <Text style={styles.relationValue}>{relations.combines.join(', ')}</Text>
            </View>
          )}
          {relations.clashes.length > 0 && (
            <View style={styles.relationRow}>
              <Text style={styles.relationLabel}>충:</Text>
              <Text style={styles.relationValue}>{relations.clashes.join(', ')}</Text>
            </View>
          )}
        </View>
      )}

      {/* 9. 나의 사주 이야기 - 쉬운 종합 해석 */}
      <View
        style={[styles.infoCard, styles.storyCard]}
        onLayout={(e) => handleSectionLayout(SECTION_IDS.ADVICE, e.nativeEvent.layout.y)}
      >
        <Text style={styles.storyTitle}>📖 나의 사주 이야기</Text>
        <Text style={styles.storySubtitle}>어려운 사주 용어 없이, 쉽게 풀어드립니다</Text>

        {/* 1. 나는 어떤 사람인가 */}
        <View style={styles.storySection}>
          <Text style={styles.storySectionTitle}>🌟 나는 어떤 사람인가요?</Text>
          {dayMasterInterpretation ? (
            <View style={styles.storyContent}>
              <Text style={styles.storyParagraph}>
                당신은 <Text style={styles.storyHighlight}>{dayMasterInterpretation.symbol}</Text>과 같은 사람입니다.
              </Text>
              <Text style={styles.storyParagraph}>
                {dayMasterInterpretation.metaphor}
              </Text>
              <Text style={styles.storyParagraph}>
                기본적으로 <Text style={styles.storyHighlight}>{dayMasterInterpretation.nature}</Text> 성격을 가지고 있어서,{' '}
                {dayMasterInterpretation.personality[0]}. {dayMasterInterpretation.personality[1]}.
              </Text>
              <View style={styles.storyQuoteBox}>
                <Text style={styles.storyQuote}>"{dayMasterInterpretation.quote}"</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.storyParagraph}>
              당신은 {safeDayMaster}일간으로, {safeDayMasterInfo.yinYang === 'yang' ? '적극적이고 외향적인' : '수용적이고 내향적인'} 성향을 가지고 있습니다.
            </Text>
          )}
        </View>

        {/* 2. 나의 에너지 상태 */}
        <View style={styles.storySection}>
          <Text style={styles.storySectionTitle}>⚡ 나의 에너지는 어떤가요?</Text>
          <View style={styles.storyContent}>
            <Text style={styles.storyParagraph}>
              사주에서 보면 당신의 기본 에너지(일간의 힘)는{' '}
              <Text style={styles.storyHighlight}>
                {strengthAnalysis.score >= 70 ? '강한 편' : strengthAnalysis.score >= 45 ? '균형 잡힌 편' : '부드러운 편'}
              </Text>입니다.
            </Text>
            <Text style={styles.storyParagraph}>
              {strengthAnalysis.score >= 70 ? (
                '에너지가 강하다는 것은 주변 환경에 쉽게 흔들리지 않고, 자신의 뜻대로 밀어붙이는 힘이 있다는 뜻입니다. 리더십이 있고 독립적이지만, 때로는 너무 고집스러워 보일 수 있어요.'
              ) : strengthAnalysis.score >= 45 ? (
                '에너지가 균형 잡혀 있다는 것은 상황에 따라 유연하게 대처할 수 있다는 뜻입니다. 강하게 밀어붙일 때와 한 발 물러설 때를 알고, 조화롭게 살아갈 수 있어요.'
              ) : (
                '에너지가 부드럽다는 것은 주변의 도움과 협력을 잘 받아들인다는 뜻입니다. 혼자보다는 함께할 때 더 큰 힘을 발휘하며, 섬세하고 배려심이 깊어요.'
              )}
            </Text>
          </View>
        </View>

        {/* 3. 나에게 필요한 것 */}
        <View style={styles.storySection}>
          <Text style={styles.storySectionTitle}>🎯 나에게 필요한 기운은?</Text>
          <View style={styles.storyContent}>
            <Text style={styles.storyParagraph}>
              당신의 사주를 분석해보니,{' '}
              <Text style={styles.storyHighlight}>{getElementName(yongsinAnalysis.yongsin)}(
                {yongsinAnalysis.yongsin === 'wood' ? '나무' : yongsinAnalysis.yongsin === 'fire' ? '불' : yongsinAnalysis.yongsin === 'earth' ? '흙' : yongsinAnalysis.yongsin === 'metal' ? '쇠' : '물'}
              )</Text>의 기운이 부족해요.
            </Text>
            <Text style={styles.storyParagraph}>
              {yongsinAnalysis.yongsin === 'wood' ? (
                '나무 기운은 성장, 시작, 창의성을 뜻합니다. 새로운 도전이나 배움을 시작하면 좋고, 녹색 물건이나 동쪽 방향이 도움이 됩니다. 아침에 산책하거나 식물을 키우는 것도 좋아요.'
              ) : yongsinAnalysis.yongsin === 'fire' ? (
                '불 기운은 열정, 표현, 인기를 뜻합니다. 적극적으로 자기 PR을 하거나 밝은 모임에 참석하면 좋고, 빨간색 물건이나 남쪽 방향이 도움이 됩니다. 햇볕을 쬐는 것도 좋아요.'
              ) : yongsinAnalysis.yongsin === 'earth' ? (
                '흙 기운은 안정, 신뢰, 중재를 뜻합니다. 기초를 다지는 일이나 사람들 사이를 조율하는 역할이 좋고, 노란색/베이지색 물건이 도움이 됩니다. 맨발로 땅을 밟는 것도 좋아요.'
              ) : yongsinAnalysis.yongsin === 'metal' ? (
                '쇠 기운은 결단, 정리, 원칙을 뜻합니다. 불필요한 것을 정리하고 마무리하는 일이 좋고, 흰색/은색 물건이나 서쪽 방향이 도움이 됩니다. 깔끔하게 정돈하는 습관이 좋아요.'
              ) : (
                '물 기운은 지혜, 유연함, 소통을 뜻합니다. 배움이나 소통이 필요한 일이 좋고, 검은색/파란색 물건이나 북쪽 방향이 도움이 됩니다. 물을 자주 마시고 충분히 쉬세요.'
              )}
            </Text>
            <View style={styles.storyTipBox}>
              <Text style={styles.storyTipTitle}>💡 실생활 적용 팁</Text>
              <Text style={styles.storyTipText}>• 행운의 색: {yongsinAnalysis.yongsin === 'wood' ? '녹색, 청록색' : yongsinAnalysis.yongsin === 'fire' ? '빨간색, 주황색' : yongsinAnalysis.yongsin === 'earth' ? '노란색, 베이지색' : yongsinAnalysis.yongsin === 'metal' ? '흰색, 은색' : '검은색, 파란색'}</Text>
              <Text style={styles.storyTipText}>• 좋은 방향: {yongsinAnalysis.yongsin === 'wood' ? '동쪽' : yongsinAnalysis.yongsin === 'fire' ? '남쪽' : yongsinAnalysis.yongsin === 'earth' ? '중앙' : yongsinAnalysis.yongsin === 'metal' ? '서쪽' : '북쪽'}</Text>
              <Text style={styles.storyTipText}>• 행운의 숫자: {yongsinAnalysis.yongsin === 'wood' ? '3, 8' : yongsinAnalysis.yongsin === 'fire' ? '2, 7' : yongsinAnalysis.yongsin === 'earth' ? '5, 10' : yongsinAnalysis.yongsin === 'metal' ? '4, 9' : '1, 6'}</Text>
            </View>
          </View>
        </View>

        {/* 4. 주의할 점 */}
        <View style={styles.storySection}>
          <Text style={styles.storySectionTitle}>⚠️ 주의하면 좋은 점</Text>
          <View style={styles.storyContent}>
            <Text style={styles.storyParagraph}>
              반대로 <Text style={styles.storyHighlight}>{getElementName(yongsinAnalysis.gishin)}(
                {yongsinAnalysis.gishin === 'wood' ? '나무' : yongsinAnalysis.gishin === 'fire' ? '불' : yongsinAnalysis.gishin === 'earth' ? '흙' : yongsinAnalysis.gishin === 'metal' ? '쇠' : '물'}
              )</Text>의 기운은 이미 충분해서, 너무 많으면 오히려 균형이 깨질 수 있어요.
            </Text>
            <Text style={styles.storyParagraph}>
              {yongsinAnalysis.gishin === 'wood' ? (
                '나무 기운이 과하면 너무 급하게 시작만 하고 마무리를 못하거나, 욕심이 앞서서 무리하게 됩니다. 차분히 현재에 집중하세요.'
              ) : yongsinAnalysis.gishin === 'fire' ? (
                '불 기운이 과하면 감정 기복이 심해지거나, 충동적인 결정을 하기 쉽습니다. 흥분될 때 한 템포 쉬어가세요.'
              ) : yongsinAnalysis.gishin === 'earth' ? (
                '흙 기운이 과하면 너무 보수적이 되거나, 변화를 두려워하게 됩니다. 가끔은 새로운 시도도 필요해요.'
              ) : yongsinAnalysis.gishin === 'metal' ? (
                '쇠 기운이 과하면 너무 완벽주의가 되거나, 융통성이 없어질 수 있습니다. 때론 80%로 만족하는 것도 지혜에요.'
              ) : (
                '물 기운이 과하면 생각만 많아지고 실행이 없거나, 감정에 빠지기 쉽습니다. 머리보다 몸을 먼저 움직여보세요.'
              )}
            </Text>
          </View>
        </View>

        {/* 5. 인생 조언 */}
        <View style={styles.storySection}>
          <Text style={styles.storySectionTitle}>🌈 당신을 위한 인생 조언</Text>
          <View style={styles.storyContent}>
            {dayMasterInterpretation ? (
              <>
                <View style={styles.storyAdviceBox}>
                  <Text style={styles.storyAdviceTitle}>💼 직업과 커리어</Text>
                  <Text style={styles.storyAdviceText}>{dayMasterInterpretation.career}</Text>
                </View>
                <View style={styles.storyAdviceBox}>
                  <Text style={styles.storyAdviceTitle}>💑 인간관계</Text>
                  <Text style={styles.storyAdviceText}>{dayMasterInterpretation.relationships}</Text>
                </View>
                <View style={styles.storyAdviceBox}>
                  <Text style={styles.storyAdviceTitle}>🏥 건강</Text>
                  <Text style={styles.storyAdviceText}>{dayMasterInterpretation.health}</Text>
                </View>
              </>
            ) : (
              <Text style={styles.storyParagraph}>
                {safeDayMasterInfo.meaning}
              </Text>
            )}
          </View>
        </View>

        {/* 6. 현재 운의 흐름 */}
        <View style={styles.storySection}>
          <Text style={styles.storySectionTitle}>📅 지금 나의 운은?</Text>
          <View style={styles.storyContent}>
            <Text style={styles.storyParagraph}>
              현재 당신은 <Text style={styles.storyHighlight}>{daeunList[0].stem}{daeunList[0].branch} 대운</Text>의 영향을 받고 있습니다.
            </Text>
            <Text style={styles.storyParagraph}>
              대운이란 10년 단위로 바뀌는 큰 운의 흐름입니다.
              {threeCombines.length > 0
                ? ' 지금 특별한 에너지 조합이 작용하고 있어서, 큰 변화나 기회가 올 수 있는 시기입니다.'
                : ' 지금은 비교적 안정적인 흐름이므로, 꾸준히 기본기를 다지는 것이 좋습니다.'}
            </Text>
            {clashes.length > 0 && (
              <Text style={styles.storyParagraph}>
                다만 사주에 <Text style={styles.storyHighlight}>{clashes.join(', ')}</Text>이 있어서,
                변화와 갈등의 에너지도 함께 가지고 있습니다. 이것은 나쁜 것이 아니라,
                삶에서 성장의 계기가 되는 원동력입니다.
              </Text>
            )}
          </View>
        </View>

        {/* 마무리 메시지 */}
        <View style={styles.storyFinalBox}>
          <Text style={styles.storyFinalEmoji}>🍀</Text>
          <Text style={styles.storyFinalText}>
            사주는 운명을 정해주는 것이 아니라, 나 자신을 이해하는 도구입니다.{'\n'}
            강점은 살리고, 부족한 부분은 채워가며{'\n'}
            더 나은 내일을 만들어가세요!
          </Text>
        </View>
      </View>

      {/* 하단 여백 */}
      <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function stemToElement(stem: string): string {
  const map: Record<string, string> = {
    '갑': 'wood', '을': 'wood',
    '병': 'fire', '정': 'fire',
    '무': 'earth', '기': 'earth',
    '경': 'metal', '신': 'metal',
    '임': 'water', '계': 'water',
  };
  return map[stem] || 'unknown';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // 상단 네비게이션 (운세 탭과 동일한 스타일)
  navContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  navContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  navItemActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  navEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  navEmojiActive: {
    // 활성 상태에서도 같은 크기 유지
  },
  navItemText: {
    fontSize: FONT_SIZES.md,
    color: '#6B7280',
    fontWeight: '600',
  },
  navItemTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  pillarCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  pillarTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  pillarTable: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tableCell: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  tableHeader: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  stemText: {
    fontSize: 24,
    fontWeight: '700',
  },
  branchText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  // 일간 강약
  strengthGauge: {
    marginBottom: 16,
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gaugeLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  gaugeValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  gaugeBar: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    marginBottom: 8,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 6,
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gaugeLabelText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  analysisText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  reasonsBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  reasonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  // 용신/기신
  yongsinDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  yongsinRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  yongsinBadge: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  yongsinBadgeLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  yongsinBadgeText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  yongsinAnalysis: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  recommendBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  recommendTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  recommendRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  recommendLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    width: 110,
    fontWeight: '500',
  },
  recommendValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
    flexWrap: 'wrap',
  },
  // 기신 주의사항 박스
  cautionBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  cautionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 8,
  },
  cautionRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  cautionLabel: {
    fontSize: FONT_SIZES.sm,
    color: '#795548',
    width: 110,
  },
  cautionValue: {
    fontSize: FONT_SIZES.sm,
    color: '#5D4037',
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
  },
  // 지장간
  hiddenStemDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  hiddenStemCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  hiddenStemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hiddenStemPillar: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  hiddenStemBranch: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  hiddenStemRow: {
    flexDirection: 'row',
  },
  hiddenStemItem: {
    alignItems: 'center',
    marginRight: 24,
  },
  hiddenStemLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  hiddenStemValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  // 삼합
  combineDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  combineCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  combineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  combineName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 8,
  },
  combineText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  noCombineText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: 16,
  },
  // 충
  clashDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  clashItem: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  clashText: {
    fontSize: FONT_SIZES.md,
    color: '#C62828',
    fontWeight: '600',
  },
  // 육해
  harmDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  harmItem: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  harmText: {
    fontSize: FONT_SIZES.md,
    color: '#E65100',
    fontWeight: '600',
  },
  // 형벌
  punishDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  punishItem: {
    backgroundColor: '#F3E5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  punishText: {
    fontSize: FONT_SIZES.md,
    color: '#6A1B9A',
    fontWeight: '600',
  },
  // 반합
  halfDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  halfItem: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  halfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  halfName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 8,
  },
  halfText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  // 십신
  tenGodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tenGodItem: {
    alignItems: 'center',
  },
  tenGodLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  tenGodValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
  // 대운
  daeunItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  daeunAge: {
    width: 80,
  },
  daeunAgeText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  daeunCurrent: {
    fontSize: FONT_SIZES.xs,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 2,
  },
  daeunGanji: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  daeunStem: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: 4,
  },
  daeunBranch: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  daeunDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  // 합충
  relationRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  relationLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    width: 40,
  },
  relationValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    flex: 1,
  },
  // 나의 사주 이야기 (쉬운 종합 해석)
  storyCard: {
    backgroundColor: '#FFFDE7',
    borderWidth: 2,
    borderColor: '#FFC107',
  },
  storyTitle: {
    fontSize: FONT_SIZES.xl + 2,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 4,
    textAlign: 'center',
  },
  storySubtitle: {
    fontSize: FONT_SIZES.sm,
    color: '#8D6E63',
    textAlign: 'center',
    marginBottom: 20,
  },
  storySection: {
    marginBottom: 24,
  },
  storySectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: '#5D4037',
    marginBottom: 12,
  },
  storyContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  storyParagraph: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 26,
    marginBottom: 12,
  },
  storyHighlight: {
    fontWeight: '700',
    color: '#E65100',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 2,
  },
  storyQuoteBox: {
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    padding: 12,
    marginTop: 8,
    borderRadius: 8,
  },
  storyQuote: {
    fontSize: FONT_SIZES.md,
    fontStyle: 'italic',
    color: '#795548',
    textAlign: 'center',
    lineHeight: 24,
  },
  storyTipBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
  },
  storyTipTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 8,
  },
  storyTipText: {
    fontSize: FONT_SIZES.sm,
    color: '#1B5E20',
    lineHeight: 22,
  },
  storyAdviceBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  storyAdviceTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },
  storyAdviceText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 22,
  },
  storyFinalBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  storyFinalEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  storyFinalText: {
    fontSize: FONT_SIZES.md,
    color: '#1565C0',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
  },
  // 종합 조언 (기존)
  adviceCard: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#1976D2',
  },
  adviceTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 16,
  },
  overallAdvice: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  adviceHighlight: {
    fontWeight: '700',
    color: '#1565C0',
  },
  adviceDivider: {
    height: 1,
    backgroundColor: '#90CAF9',
    marginVertical: 12,
  },
  quickTips: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  quickTipsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 12,
  },
  quickTipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickTipItem: {
    alignItems: 'center',
  },
  quickTipLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  quickTipValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  // 지장간 상세
  hiddenStemMeaning: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  hiddenStemInfo: {
    backgroundColor: '#F3E5F5',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  hiddenStemInfoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#6A1B9A',
    marginBottom: 8,
  },
  hiddenStemInfoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  // 삼합 상세
  combineInfo: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  combineInfoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 8,
  },
  combineInfoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  // 충/해 상세
  clashNote: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  harmNote: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  // 공통
  elementDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  // 사주 개념 설명
  conceptCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  conceptTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: '#F57C00',
    marginBottom: 12,
  },
  conceptText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  highlightText: {
    fontWeight: '700',
    color: '#E65100',
  },
  conceptDivider: {
    height: 1,
    backgroundColor: '#FFE082',
    marginVertical: 16,
  },
  conceptRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  conceptItem: {
    alignItems: 'center',
    flex: 1,
  },
  conceptItemTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  conceptItemDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  // 4주 각각의 의미
  pillarMeanings: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  pillarMeaningItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  pillarMeaningLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  pillarMeaningDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  // 일간 상세
  dayMasterCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
  },
  dayMasterTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  dayMasterSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  dayMasterInfo: {
    marginBottom: 16,
  },
  dayMasterElement: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  dayMasterElementText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: 4,
  },
  dayMasterYinYang: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  dayMasterMeaning: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
    textAlign: 'center',
  },
  dayMasterTip: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
  },
  dayMasterTipTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 8,
  },
  dayMasterTipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 22,
  },
  // 5레이어 해석 스타일
  dayMasterSymbol: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 8,
  },
  metaphorBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  metaphorText: {
    fontSize: FONT_SIZES.md,
    color: '#795548',
    fontStyle: 'italic',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  quoteText: {
    fontSize: FONT_SIZES.sm,
    color: '#8D6E63',
    textAlign: 'center',
  },
  personalitySection: {
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  bulletList: {
    paddingLeft: 4,
  },
  bulletItem: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 24,
  },
  strengthWeaknessRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  strengthBox: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
  },
  strengthBoxTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 8,
  },
  strengthItem: {
    fontSize: FONT_SIZES.xs,
    color: '#1B5E20',
    lineHeight: 20,
  },
  weaknessBox: {
    flex: 1,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 12,
  },
  weaknessBoxTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 8,
  },
  weaknessItem: {
    fontSize: FONT_SIZES.xs,
    color: '#BF360C',
    lineHeight: 20,
  },
  dayMasterAdviceSection: {
    marginTop: 8,
  },
  dayMasterAdviceBlock: {
    marginBottom: 16,
  },
  dayMasterAdviceLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },
  dayMasterAdviceText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 22,
  },
  growthSection: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  growthItem: {
    fontSize: FONT_SIZES.sm,
    color: '#1565C0',
    lineHeight: 24,
  },
  // 오행 분포
  elementDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  elementChart: {
    marginBottom: 20,
  },
  elementBarContainer: {
    marginBottom: 12,
  },
  elementBarYongsin: {
    backgroundColor: '#E8F5E9',
    padding: 8,
    marginHorizontal: -8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  elementBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  elementBarNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  elementBarName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  yongsinStar: {
    fontSize: FONT_SIZES.xs,
    color: '#4CAF50',
    fontWeight: '700',
    marginLeft: 8,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gishinMark: {
    fontSize: 12,
    marginLeft: 4,
  },
  elementBarCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  elementBarBg: {
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  elementBarFill: {
    height: '100%',
    borderRadius: 8,
    minWidth: 8,
  },
  elementExplain: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  elementExplainTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  elementExplainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  elementExplainItem: {
    width: '18%',
    alignItems: 'center',
    marginBottom: 8,
  },
  elementExplainName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  elementExplainText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  elementBalance: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
  },
  elementBalanceTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 8,
  },
  elementBalanceText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  // 십신 상세
  tenGodDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  tenGodExplain: {
    marginTop: 20,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
  },
  tenGodExplainTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  tenGodCategory: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tenGodCategoryTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  tenGodDetailItem: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  tenGodDetailName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  tenGodDetailDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  // 대운 상세
  daeunExplainText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  daeunItemCurrent: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  daeunItemPast: {
    opacity: 0.7,
    backgroundColor: '#F5F5F5',
  },
  daeunAgePast: {
    color: COLORS.textSecondary,
  },
  daeunPastLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  daeunHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  daeunCurrentBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  daeunCurrentText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    fontWeight: '700',
  },
  daeunRelation: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
  },
  daeunRelationType: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  daeunRelationDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 18,
    flex: 1,
    flexWrap: 'wrap',
  },
  daeunTip: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  daeunTipTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 8,
  },
  daeunTipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 22,
  },
});
