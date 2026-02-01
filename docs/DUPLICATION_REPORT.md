# 사주투데이 중복 기능 분석 리포트

> 코드 분석 기반 중복 및 통합 가능 영역 정리 (2026-01-31)

---

## 🔄 주요 중복 영역

### 1. 운세 생성 로직 중복 (심각)

#### 위치
- `src/hooks/useSajuFortune.ts` - 커스텀 훅으로 분리되어 있음
- `src/screens/HomeScreen.tsx` - 동일한 로직이 직접 구현됨
- `src/screens/FortuneDetailScreen.tsx` - 일부 중복
- `src/screens/CalendarScreen.tsx` - 일부 중복

#### 중복 내용
```typescript
// useSajuFortune.ts (hook)
const sajuResult = useMemo(() => {
  if (!profile) return null;
  const calculator = new SajuCalculator(profile.birthDate, profile.birthTime);
  return calculator.calculate();
}, [profile?.birthDate, profile?.birthTime]);

const fortune = useMemo(() =>
  generateFortune(sajuResult, selectedDate),
  [sajuResult, selectedDateTimestamp]
);

const richDailyFortune = useMemo(() => {
  if (!sajuResult || !todayInfo?.ganji) return null;
  return generateRichDailyFortune(sajuResult, todayStem, todayBranch);
}, [sajuResult, todayInfo?.ganji]);

// HomeScreen.tsx (동일한 로직 직접 구현)
const sajuResult = useMemo(() => {
  if (!profile) return null;
  const calculator = new SajuCalculator(profile.birthDate, profile.birthTime);
  return calculator.calculate();
}, [profile?.birthDate, profile?.birthTime]);

const fortune = useMemo(() =>
  generateFortune(sajuResult, selectedDate),
  [sajuResult, selectedDateTimestamp]
);

const richDailyFortune = useMemo(() => {
  if (!sajuResult || !todayInfo?.ganji) return null;
  return generateRichDailyFortune(sajuResult, todayStem, todayBranch);
}, [sajuResult, todayInfo?.ganji]);
```

**문제**: Hook으로 분리되어 있음에도 HomeScreen에서 동일한 로직을 직접 구현

---

### 2. 천간→오행 변환 중복

#### 위치
| 파일 | 변수명 |
|------|--------|
| `src/services/RichFortuneService.ts:30` | `STEM_TO_ELEMENT` |
| `src/services/FortuneTypes.ts:99` | `STEM_ELEMENTS` (동일 내용) |
| `src/services/FortuneGenerator.ts` | 천간 오행 찾기 로직 중복 |
| `src/data/saju.ts` | `HEAVENLY_STEMS`에 이미 포함 |

#### 중복 코드
```typescript
// RichFortuneService.ts
const STEM_TO_ELEMENT: Record<string, Element> = {
  '갑': 'wood', '을': 'wood',
  '병': 'fire', '정': 'fire',
  '무': 'earth', '기': 'earth',
  '경': 'metal', '신': 'metal',
  '임': 'water', '계': 'water',
};

// FortuneTypes.ts
const STEM_ELEMENTS: Record<string, string> = {
  '갑': '목', '을': '목', '병': '화', '정': '화', '무': '토',
  '기': '토', '경': '금', '신': '금', '임': '수', '계': '수',
};

// saju.ts (원본 데이터)
export const HEAVENLY_STEMS: HeavenlyStem[] = [
  { order: 1, korean: '갑', hanja: '甲', element: 'wood', ... },
  { order: 2, korean: '을', hanja: '乙', element: 'wood', ... },
  // ...
];
```

**문제**: 동일한 매핑이 3곳에 중복 정의됨

---

### 3. 지지→오행 변환 중복

#### 위치
- `src/services/RichFortuneService.ts:48` - `BRANCH_TO_ELEMENT`
- `src/services/FortuneGenerator.ts` - 날짜별 오행 계산
- `src/data/saju.ts` - `EARTHLY_BRANCHES`에 이미 포함

---

### 4. 십신 계산 로직 중복

#### 위치
- `src/services/SajuCalculator.ts:301-353` - 원본 `calculateTenGods`
- `src/services/FortuneTypes.ts:104-122` - `getTenGodRelation` (동일 로직)
- `src/services/FortuneGenerator.ts` - 오행 관계 분석

#### 중복 코드
```typescript
// SajuCalculator.ts
private getTenGod(dayMaster: { element: Element; yinYang: YinYangType }, targetStem: string): string {
  // ... 십신 계산 로직
  if (dayElement === targetElement) {
    return sameYinYang ? '비견' : '겁재';
  }
  // ...
}

// FortuneTypes.ts
function getTenGodRelation(myStem: string, yearStem: string): string {
  // ... 동일한 십신 계산 로직
  if (myElement === yearElement) return samePolarity ? '비견' : '겁재';
  // ...
}
```

---

### 5. 연도→간지 계산 중복

#### 위치
- `src/services/SajuCalculator.ts:96-115` - `calculateYearPillar`
- `src/services/RichFortuneService.ts:235-249` - `getYearGanji`
- `src/services/FortuneTypes.ts:79-96` - `getYearGanji`

#### 중복 코드
```typescript
// RichFortuneService.ts
export function getYearGanji(year: number): { stem: string; branch: string } {
  const baseYear = 1984;
  const stems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  const branches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
  const diff = year - baseYear;
  const stemIndex = ((diff % 10) + 10) % 10;
  const branchIndex = ((diff % 12) + 12) % 12;
  return { stem: stems[stemIndex], branch: branches[branchIndex] };
}

// FortuneTypes.ts
function getYearGanji(year: number): { stem: string; branch: string } {
  const stemIndex = (year - 4) % 10;  // 계산 방식만 다름
  const branchIndex = (year - 4) % 12;
  return {
    stem: HEAVENLY_STEMS_CYCLE[stemIndex],
    branch: EARTHLY_BRANCHES_CYCLE[branchIndex],
  };
}
```

---

### 6. 운세 메시지/해석 데이터 중복

#### 위치
- `src/services/FortuneGenerator.ts` - 메시지 템플릿 (LOVE_MESSAGES, MONEY_MESSAGES 등)
- `src/services/RichFortuneService.ts` - 풍부한 해석 데이터
- `src/services/FortuneTypes.ts` - 십신별 운세 해석
- `src/data/richInterpretations.ts` - 일주별 해석
- `src/data/easyDailyInterpretations.ts` - 쉬운 일일 해석
- `src/data/comprehensiveFortuneData.ts` - 종합 운세 데이터

#### 문제
동일한 카테고리(애정운, 재물운 등)에 대한 해석이 4-5개 파일에 분산되어 있음

---

### 7. 행운 정보 계산 중복

#### 위치
- `src/services/FortuneTypes.ts:52-72` - `getYongsinBasedLuckyInfo`
- `src/services/FortuneGenerator.ts` - `luckyInfo` 생성
- `src/services/RichFortuneService.ts` - 운세 데이터에 포함

#### 중복 코드
```typescript
// FortuneTypes.ts
const ELEMENT_LUCKY_NUMBERS: Record<string, string> = {
  '목': '3, 8', '화': '2, 7', '토': '5, 10', '금': '4, 9', '수': '1, 6',
};

// constants.ts (이미 존재)
export const ELEMENT_NUMBERS: Record<Element, number[]> = {
  wood: [3, 8], fire: [2, 7], earth: [5, 10], metal: [4, 9], water: [1, 6],
};
```

---

### 8. 지지 관계(합/충/형) 중복

#### 위치
- `src/data/constants.ts` - `SIX_HARMONIES`, `SIX_CLASHES`
- `src/services/RichFortuneService.ts:87-117` - `BRANCH_HARMONY`, `BRANCH_CLASH`
- `src/services/FortuneGenerator.ts` - `THREE_HARMONIES`

---

### 9. useMemo 과다 사용 (성능 이슈)

#### 위치
`src/screens/HomeScreen.tsx` - 20개 이상의 useMemo

#### 문제
```typescript
// 개별적으로 메모이제이션 (과도한 세분화)
const sajuResult = useMemo(() => {...}, [...]);
const fortune = useMemo(() => {...}, [...]);
const comprehensiveFortune = useMemo(() => {...}, [...]);
const easyScoreMessages = useMemo(() => {...}, [...]);
const richIljuData = useMemo(() => {...}, [...]);
const richDailyFortune = useMemo(() => {...}, [...]);
const categoryFortune = useMemo(() => {...}, [...]);
const timeBasedFortune = useMemo(() => {...}, [...]);
// ... 10개 이상 추가
```

**문제**: 
- 메모이제이션 오버헤드 > 재계산 비용
- 코드 가독성 저하
- React 18+에서는 자동 메모이제이션 고려 가능

---

## ✅ 통합/개선 제안

### 1. 운세 계산 통합

```typescript
// src/hooks/useSajuFortune.ts (기존 유지, 화면에서 사용)
// HomeScreen.tsx는 이 훅만 사용하도록 수정

// 수정 전 (HomeScreen.tsx)
const sajuResult = useMemo(() => {...});
const fortune = useMemo(() => {...});
// ... 10개 더

// 수정 후 (HomeScreen.tsx)
const {
  sajuResult,
  fortune,
  richDailyFortune,
  // ... 필요한 것만
} = useSajuFortune({ profile, todayInfo, selectedDate });
```

**예상 효과**: 코드 200줄 감소, 유지보수성 향상

---

### 2. 데이터 변환 유틸리티 통합

```typescript
// src/utils/sajuUtils.ts (신규 생성)
export function getElementFromStem(stem: string): Element {
  const stemData = HEAVENLY_STEMS.find(s => s.korean === stem);
  return stemData?.element || 'wood';
}

export function getElementFromBranch(branch: string): Element {
  const branchData = EARTHLY_BRANCHES.find(b => b.korean === branch);
  return branchData?.element || 'earth';
}

export function getTenGod(dayMaster: string, targetStem: string): string {
  // 통합된 십신 계산 로직
}

export function getYearGanji(year: number): { stem: string; branch: string } {
  // 통합된 년간지 계산
}
```

**예상 효과**: 중복 코드 150줄 제거, 데이터 일관성 확보

---

### 3. 운세 데이터 통합

```typescript
// src/data/fortuneData.ts (신규 - 모든 해석 데이터 통합)
export const FORTUNE_DATA = {
  // 일주별 기본 해석
  ilju: { ... },
  
  // 십신별 운세
  tenGod: { ... },
  
  // 카테고리별 메시지
  categories: {
    love: { ... },
    money: { ... },
    work: { ... },
    health: { ... },
  },
  
  // 오행 관계별 해석
  elementRelations: { ... },
  
  // 행운 정보
  luckyInfo: { ... },
};
```

**예상 효과**: 5개 파일 → 1개 파일, 데이터 중복 제거

---

### 4. useMemo 최적화

```typescript
// 통합된 계산 훅
function useFortuneCalculation(profile, todayInfo, selectedDate) {
  return useMemo(() => {
    if (!profile) return null;
    
    const sajuResult = calculateSaju(profile.birthDate, profile.birthTime);
    const fortune = generateFortune(sajuResult, selectedDate);
    const richFortune = generateRichDailyFortune(sajuResult, ...);
    
    return {
      sajuResult,
      fortune,
      richFortune,
      // ... 한 번에 계산
    };
  }, [profile?.birthDate, profile?.birthTime, selectedDate.getTime()]);
}
```

**예상 효과**: useMemo 20개 → 1-2개, 성능 향상

---

## 📊 중복 코드 통계

| 중복 영역 | 중복 파일 수 | 중복 코드 라인 | 통합 시 절감 |
|-----------|-------------|---------------|-------------|
| 운세 생성 로직 | 4개 | ~300줄 | ~200줄 |
| 천간→오행 변환 | 3개 | ~30줄 | ~20줄 |
| 십신 계산 | 3개 | ~80줄 | ~50줄 |
| 연도→간지 계산 | 3개 | ~50줄 | ~30줄 |
| 운세 메시지 데이터 | 5개 | ~1000줄 | ~400줄 |
| 행운 정보 | 3개 | ~60줄 | ~40줄 |
| 지지 관계 | 3개 | ~80줄 | ~50줄 |
| **합계** | - | **~1600줄** | **~790줄** |

---

## 🎯 우선순위

| 우선순위 | 작업 | 예상 시간 | 영향 |
|---------|------|----------|------|
| **P0** | useSajuFortune 훅 적용 | 2시간 | HomeScreen 200줄 감소 |
| **P1** | sajuUtils.ts 생성 | 3시간 | 중복 변환 로직 제거 |
| **P1** | fortuneData.ts 통합 | 4시간 | 데이터 일관성 향상 |
| **P2** | useMemo 최적화 | 2시간 | 성능 개선 |
| **P3** | 테스트 커버리지 확보 | 4시간 | 안정성 확보 |

---

## 🛠️ 즉시 적용 가능한 수정

### 1. HomeScreen에서 useSajuFortune 사용
```typescript
// HomeScreen.tsx 상단
import { useSajuFortune } from '../hooks/useSajuFortune';

// 컴포넌트 내부
const {
  sajuResult,
  fortune,
  comprehensiveFortune,
  easyScoreMessages,
  richIljuData,
  richDailyFortune,
  categoryFortune,
  todayFortuneInterpretation,
} = useSajuFortune({ profile, todayInfo, selectedDate });

// 불필요한 useMemo 15개 제거 가능
```

---

**작성일**: 2026-01-31
**상태**: 분석 완료, 통합 작업 대기 중
