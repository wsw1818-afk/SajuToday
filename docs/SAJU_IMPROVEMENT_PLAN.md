# 🎯 사주탭 개선 기획안 (Detailed Improvement Plan)

> 작성일: 2026-02-01
> 대상: SajuScreen.tsx (고급 사주 분석 화면)
> 상태: 기획 완료

---

## 📊 현재 상태 분석

### 문제점 정리

| 영역 | 현재 상태 | 문제점 |
|------|----------|--------|
| **일간 강약** | 점수 + 신강/신약 표시 | 판단 근거(reasons) 미표시, 상세 분석 부족 |
| **용신/기신** | 이름 + 간단 설명 | 생활 적용 방법 없음, 실용성 부족 |
| **오행 균형** | 4주 표시만 | 5행 분포 비율 미표시, 시각화 없음 |
| **십신 분포** | 4개 기둈만 | 비율 파악 어려움, 해석 텍스트 부족 |
| **대운 흐름** | 텍스트 리스트 | 시각적 흐름 파악 어려움, 현재 위치 강조 없음 |
| **종합 분석** | 없음 | 사주 총평 및 조언 부재 |

---

## 🚀 개선 단계별 계획

### Phase 1: 핵심 정보 강화 (1주)

#### 1.1 일간 강약 분석 상세화

**현재 코드 위치**: `src/screens/SajuScreen.tsx` (675-720줄)

**개선 내용**:
```typescript
// 현재: reasons가 계산만 되고 표시되지 않음
const strengthAnalysis = calculateStrength();
// { score, strength, analysis, reasons } → reasons 미사용

// 개선: 판단 근거 리스트 + 상세 분석 추가
interface StrengthAnalysis {
  score: number;
  strength: string;
  analysis: string;
  reasons: string[];           // ✅ 표시 추가
  characteristics: string[];   // ✅ 성향 특징 추가
  advice: string;              // ✅ 조언 추가
}
```

**UI 변경**:
```
📊 일간 강약 분석 (65점 - 보통)

[강약 게이지]
약 ◀━━━━━━━●━━━━━━━━━▶ 강
        65%

[판단 근거]
✓ 월지(인)의 계절 기운이 일간을 도움 (+15점)
✓ 일간 오행(목)이 사주 내에서 강함 (+15점)
✓ 월간이 비견/겁재로 일간을 도움 (+10점)

[상세 분석]
일간의 세력이 적당하여 균형 잡힌 사주입니다. 
주변과 조화를 이루며 살아가며, 유연성이 있고 
적응력이 좋습니다.

[성향 특징]
• 타인의 의견을 잘 수용하며 협력적
• 변화에 유연하게 대응
• 적당한 자신감과 배려심의 균형

[조언]
상황에 따라 리더와 팔로워를 오가는 역할을 할 수 있습니다.
```

---

#### 1.2 오행 균형 섹션 신규

**새 섹션 위치**: 일간 정보 다음

**기능**:
- 5개 오행(목화토금수) 막대 그래프
- 각 오행 비율 % 계산 및 표시
- 용신 오행 ★ 마크 강조
- 과다/적정/부족 상태 표시

**새 컴포넌트**: `src/components/ElementBalanceChart.tsx`

```typescript
interface ElementBalanceChartProps {
  elements: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  yongsinElement: string;  // 용신 오행 강조용
}

// 계산 로직
const calculateElementRatio = (pillars: SajuPillars) => {
  // 천간 + 지지의 오행을 모두 합산
  // 비율 계산 (총합 = 100%)
}
```

**UI 디자인**:
```
🔥 오행 균형 분석

목(木) ████████████░░░░░░ 30% 적정
화(火) ██████░░░░░░░░░░░░ 15% 부족
토(土) ████████░░░░░░░░░░ 20% 적정
금(金) ████░░░░░░░░░░░░░░ 10% 부족  
수(水) █████████░░░░░░░░░ 25% 적정 ★용신

[해석]
목(木)이 가장 강하여 일간의 기운이 튼튼합니다.
수(水)가 적정하여 용신으로 활용 가능합니다.
화(火)가 부족하여 에너지 부족할 수 있으니 주의.
```

---

### Phase 2: 실용적 가이드 추가 (1주)

#### 2.1 용신/기신 생활 적용 가이드

**현재 코드 위치**: `src/screens/SajuScreen.tsx` (용신 섹션)

**개선 내용**:
```typescript
interface YongsinGuide {
  yongsin: string;      // 필요한 기운
  gishin: string;       // 과다한 기운
  heeshin: string;      // 보조 기운
  
  // ✅ 신규 추가
  recommendations: {
    colors: { name: string; hex: string; usage: string }[];
    directions: { name: string; degree: string; usage: string }[];
    numbers: number[];
    activities: string[];
    avoidances: string[];
  };
}
```

**UI 디자인**:
```
🎯 용신/기신 분석

┌─────────────────────────────────────┐
│  용신(用神): 수(水) - 필요한 기운     │
│  기신(忌神): 화(火) - 과다한 기운     │
│  희신(喜神): 금(金) - 보조 기운       │
└─────────────────────────────────────┘

[생활 적용 가이드]

🎨 추천 색상
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
검정  ████████  지갑, 액세서리
파랑  ████████  의상, 차량
회색  ██████    인테리어

🧭 추천 방위
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
북쪽 (0°)     책상 배치
북서 (315°)   중요 결정

🔢 행운의 숫자: 1, 6

[오늘의 조언]
✓ 추천 활동: 독서, 명상, 수영
✗ 자제할 활동: 과도한 경쟁, 격렬한 운
```

---

#### 2.2 십신 분포 개선

**현재**: 4개 기둥만 표시
**개선**: 원형 차트 + 주요 십신 분석

**새 컴포넌트**: `src/components/TenGodPieChart.tsx`

```typescript
interface TenGodDistribution {
  tenGod: string;
  count: number;
  percentage: number;
  meaning: string;
}

// 8글자에서 십신 분포 계산
const calculateTenGodDistribution = (
  dayMaster: string,
  pillars: SajuPillars
): TenGodDistribution[] => {
  // 각 글자별 십신 계산 → 집계 → 비율 계산
}
```

**UI 디자인**:
```
🎭 십신 분포 분석

[원형 차트]
비견 25% | 식신 20% | 편재 15% | ...

[주요 십신 해석]

1️⃣ 비견(比肩) 25% - 나와 같은 사람
   → 혼자보다 팀플레이가 유리
   → 협력과 공동 목표 추구

2️⃣ 식신(食神) 20% - 표현력, 여유  
   → 창의적 활동에 재능
   → 예술, 요리, 가르치기에 적합

3️⃣ 편재(偏財) 15% - 큰 재물
   → 투자/부업 운이 있음
   → 변동 수입에 강함
```

---

### Phase 3: 시각화 및 종합 분석 (1주)

#### 3.1 대운 흐름 타임라인

**현재**: 텍스트 리스트
**개선**: 시각적 타임라인 + 현재 강조

**새 컴포넌트**: `src/components/DaeunTimeline.tsx`

```typescript
interface DaeunItem {
  age: string;        // "30-39"
  stem: string;       // "갑"
  branch: string;     // "진"
  element: string;    // "wood"
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;
}
```

**UI 디자인**:
```
📈 대운 흐름 (10년 단위)

과거 ←――――――――――――――→ 미래
     20  30  40  50  60
     
[=====●=====|-----|-----|-----]
       ★현재(35세)
       
현재 대운: 갑진 (목토)
• 기운: 변화와 안정의 조화
• 특징: 새로운 시작에 적합
• 조언: 도전을 두려워하지 마세요

[대운 상세]
┌─────────┬─────────┬─────────┐
│ 20-29세 │ 30-39세 │ 40-49세 │
│  계축   │  ★갑진  │  을사   │
│  수토   │  목토   │  목화   │
│  수면   │  성장   │  번영   │
└─────────┴─────────┴─────────┘
```

---

#### 3.2 AI 종합 분석 섹션 (신규)

**위치**: 맨 하단
**기능**: 사주 결과 종합 분석

```typescript
interface AIAnalysis {
  personality: {
    title: string;
    traits: string[];
    summary: string;
  };
  career: {
    suitable: string[];
    unsuitable: string[];
    advice: string;
  };
  love: {
    partnerType: string;
    goodMatch: string[];
    badMatch: string[];
    timing: string;
  };
  health: {
    strongOrgans: string[];
    weakOrgans: string[];
    advice: string;
  };
  wealth: {
    type: string;  // "정재형", "편재형" 등
    advice: string;
  };
}
```

**UI 디자인**:
```
🤖 AI 종합 분석

당신의 사주는 '목(木)의 기운이 강한 신강' 타입입니다.

┌─────────────────────────────────────┐
│ 💡 성격 특성                        │
├─────────────────────────────────────┤
│ • 자신감 넘치고 추진력이 강함        │
│ • 리더십 있지만 독선은 주의          │
│ • 목표 지향적이고 끈기 있음          │
│                                     │
│ 요약: 큰 나무처럼 듬직하고 성실하며, │
│       주변을 보호하는 성향입니다.    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 💼 직업/진로                        │
├─────────────────────────────────────┤
│ ✓ 적합: 관리자, CEO, 교육자, 의사   │
│ ✗ 비추: 경쟁이 심한 영업, 단순 반복 │
│                                     │
│ 조언: 사람을 이끄는 역할에서        │
│       빛을 발할 수 있습니다.        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 💕 연애/결혼                        │
├─────────────────────────────────────┤
│ • 이상형: 온화하고 배려심 있는 사람  │
│ • 잘 맞는 일간: 기(己), 경(庚)      │
│ • 주의할 일간: 병(丙), 정(丁)      │
│ • 혼인운: 30대 중반 이후 상승      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🏥 건강 주의                        │
├─────────────────────────────────────┤
│ • 강한 장기: 간, 신경계             │
│ • 약한 장기: 폐, 호흡기             │
│                                     │
│ 주의: 스트레스 관리와 규칙적인       │
│       운동이 특히 중요합니다.       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 💰 금전운                           │
├─────────────────────────────────────┤
│ 유형: 안정적 자산형 (정재)          │
│                                     │
│ 조언: 무모한 투자보다 꾸준한         │
│       저축과 부동산에 집중하세요.   │
└─────────────────────────────────────┘
```

---

## 🎨 UI/UX 개선 사항

### 섹션 순서 재정렬

**현재 순서**:
1. 사주팔자 개념
2. 4주 표
3. 일간 해설
4. 일간 강약
5. 용신/기신
6. 지장간
7. 삼합/충/해/형
8. 십신
9. 대운

**개선 순서**:
1. 사주팔자 개념
2. 4주 표
3. 일간 해설
4. **오행 균형** (NEW)
5. **십신 분포** (개선)
6. **일간 강약** (상세화)
7. **용신/기신** (가이드 추가)
8. 지장간
9. 삼합/충/해/형
10. **대운 흐름** (시각화)
11. **AI 종합 분석** (NEW)

### 전체 섹션 Collapsible 적용

**현재**: 일부 섹션만 접기/펼치기 가능
**개선**: 모든 분석 섹션을 접을 수 있게 변경

```typescript
// 모든 섹션을 CollapsibleSection으로 감싸기
<CollapsibleSection title="일간 강약 분석" emoji="📊" defaultExpanded={true}>
  {/* 내용 */}
</CollapsibleSection>
```

---

## 🛠️ 새 컴포넌트 목록

| 컴포넌트 | 파일 경로 | 설명 | 크기 |
|----------|-----------|------|------|
| `ElementBalanceChart` | `src/components/` | 오행 균형 막대 그래프 | 150줄 |
| `TenGodPieChart` | `src/components/` | 십신 분포 원형 차트 | 200줄 |
| `DaeunTimeline` | `src/components/` | 대운 타임라인 | 180줄 |
| `StrengthGauge` | `src/components/` | 강약도 게이지 | 100줄 |
| `YongsinGuide` | `src/components/` | 용신 생활 가이드 | 200줄 |
| `AIAnalysisCard` | `src/components/` | AI 종합 분석 카드 | 250줄 |
| `SectionHeader` | `src/components/` | 섹션 헤더 (접기/펼치기) | 80줄 |

---

## 📅 개발 일정

### Week 1: 핵심 분석 강화
- [ ] Day 1-2: 일간 강약 상세화 (reasons 표시, 특징 추가)
- [ ] Day 3-4: ElementBalanceChart 개발 및 적용
- [ ] Day 5: 섹션 순서 변경 및 스크롤 위치 조정

### Week 2: 실용적 가이드
- [ ] Day 1-2: YongsinGuide 개발 (색상/방위/숫자)
- [ ] Day 3-4: TenGodPieChart 개발 및 적용
- [ ] Day 5: 대운 섹션 개선 준비

### Week 3: 시각화 및 종합
- [ ] Day 1-2: DaeunTimeline 개발
- [ ] Day 3-4: AIAnalysisCard 개발
- [ ] Day 5: 전체 섹션 Collapsible 적용 및 테스트

---

## 📋 체크리스트

### Phase 1
- [ ] `calculateStrength()`에 characteristics, advice 추가
- [ ] Strength 섹션 UI에 reasons 리스트 표시
- [ ] `ElementBalanceChart.tsx` 신규 생성
- [ ] 오행 비율 계산 로직 구현
- [ ] 섹션 순서 변경 (오행 → 십신 → 강약 → 용신)

### Phase 2
- [ ] `YongsinGuide.tsx` 신규 생성
- [ ] 색상/방위/숫자 데이터 추가
- [ ] `TenGodPieChart.tsx` 신규 생성
- [ ] 십신 분포 계산 로직 구현
- [ ] 주요 십신 해석 텍스트 추가

### Phase 3
- [ ] `DaeunTimeline.tsx` 신규 생성
- [ ] 타임라인 UI 구현
- [ ] 현재 대운 하이라이트 기능
- [ ] `AIAnalysisCard.tsx` 신규 생성
- [ ] AI 분석 데이터 구조 설계
- [ ] 성격/직업/연애/건강/금전 분석 추가

---

## 💡 기술 참고사항

### 차트 라이브러리 선택
```bash
# Option 1: react-native-svg (권장)
npm install react-native-svg

# Option 2: react-native-chart-kit
npm install react-native-chart-kit
```

### 성능 최적화
```typescript
// 무거운 계산은 useMemo로 캐싱
const elementRatio = useMemo(() => 
  calculateElementRatio(safePillars), 
  [safePillars]
);

// 애니메이션은 LayoutAnimation 사용
LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
```

### 타입 정의 위치
```typescript
// src/types/index.ts에 추가
export interface StrengthAnalysis {
  score: number;
  strength: string;
  analysis: string;
  reasons: string[];
  characteristics: string[];
  advice: string;
}

export interface ElementRatio {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}
```

---

## 🎁 추가 고려사항

### 공유 기능
```typescript
// 운세 결과 복사/공유
import * as Clipboard from 'expo-clipboard';

const shareFortune = async () => {
  const text = generateFortuneText(sajuResult);
  await Clipboard.setStringAsync(text);
  Alert.alert('복사 완료', '운세 결과가 클립보드에 복사되었습니다.');
};
```

### 즐겨찾기/저장
```typescript
// 특정 분석 섹션 즐겨찾기
const [favorites, setFavorites] = useState<string[]>([]);

const toggleFavorite = (sectionId: string) => {
  // AsyncStorage에 저장
};
```

---

**다음 작업**: Phase 1 시작 - 일간 강약 상세화
