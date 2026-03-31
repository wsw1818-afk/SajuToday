# PROGRESS.md - SajuToday 개발 진행 로그

> 프로젝트: SajuToday (사주 투데이)
> 최종 업데이트: 2026-03-02

---

## 📋 2026-03-02: Phase 1-2 버그 수정 (BUG-002, BUG-001, NEW-004, BUG-008)

### BUG-002: 월주 절기 동적 조회 (Critical → 해결)
- **문제**: `getMonthIndexBySolarTerm()`이 고정 날짜 사용 (매년 ±1일 변동)
- **해결**:
  - `src/data/saju.ts`에 `SOLAR_TERM_DATES` 추가 (2020~2040년, 21개 연도 × 12절기)
  - `SajuCalculator.ts`의 `getMonthIndexBySolarTerm()`에 year 파라미터 추가
  - 연도별 정확한 절기 날짜 참조, 범위 밖은 근사값 폴백
- **출처**: uncle.tools (NASA DE441 + 한국천문연구원)

### BUG-001: 입춘 경계 2034년 이후 확장 → 해결
- **문제**: `getIpChunDay()`가 2020~2034년만 지원
- **해결**: `SOLAR_TERM_DATES[year][2]`로 통합, 2040년까지 자동 확장

### NEW-004: formatLunarFromISO 동기 함수 비동기 전환
- **문제**: `useDateNavigation.ts`에서 동기 `formatLunarFromISO()` 사용 → "음력 정보 (변환 필요)" 고정값 반환
- **해결**: `formatLunarFromISOAsync()` + `useEffect` 패턴으로 전환, KASI API 실제 음력 변환

### BUG-008: 사주 계산 캐싱 → 이미 구현 확인
- `calculateSaju()` 함수에 `Map` 기반 캐시 이미 구현됨 (536-573줄)
- 기획안에서 미반영 항목 → 해결 완료로 표기

### 테스트 결과
```
Tests: 60 passed, 60 total (0.697s)
TypeScript: 0 errors
```

---

## 📋 2026-03-02: 종합 개선 기획안 및 Phase 1 버그 수정

### 기획안 작성
- **파일**: [`plans/improvement_plan_2026_03.md`](plans/improvement_plan_2026_03.md)
- **내용**: 버그 수정 10개, 기능 개선 7개, 신규 기능 7개, 기술 개선 3개
- **코드 대조 검증**: Opus 4.6 분석으로 실제 코드와 1:1 검증 완료

### Phase 1 버그 수정 완료

#### NEW-001: LUNAR_API_URL 미정의 수정
- **파일**: [`KasiService.ts:17`](src/services/KasiService.ts:17)
- **내용**: `LUNAR_API_URL` 상수 추가
```typescript
const LUNAR_API_URL = `${KASI_BASE_URL}/LunCalInfoService`;
```

#### BUG-006: SQLite any 타입 수정
- **파일**: [`StorageService.ts:44`](src/services/StorageService.ts:44)
- **내용**: `any` → `import('expo-sqlite').SQLiteDatabase | null` 타입 명시
```typescript
private static db: import('expo-sqlite').SQLiteDatabase | null = null;
```

#### NEW-002: TaekilCalculator JDN 기반 일진 계산 전환
- **파일**: [`TaekilCalculator.ts:50-77`](src/services/TaekilCalculator.ts:50)
- **내용**: 기존 Date 기반 계산 → JDN(Julian Day Number) 기반으로 변경
- SajuCalculator, MonthlyDailyFortune과 동일한 방식 적용

#### getTodayGanji JDN 전환
- **파일**: [`SajuCalculator.ts:465-481`](src/services/SajuCalculator.ts:465)
- **내용**: `BASE_DATE`, `BASE_GANJI_INDEX` 의존 제거 → JDN 기반으로 변경

### 테스트 결과
```
PASS src/__tests__/SajuCalculator.test.ts
  SajuCalculator
    calculate()
      ✓ 생년월일로 4주(사주)를 계산해야 한다
      ✓ 출생시간 없이도 3주(년월일)를 계산해야 한다
      ✓ 일주(일간)가 정확해야 한다
      ✓ 오행 분포를 계산해야 한다
      ✓ 음양 분포를 계산해야 한다
      ✓ 일주 특성 정보를 포함해야 한다
    입춘 경계 처리
      ✓ 입춘(2월 4일경) 이전 출생은 전년도 년주를 사용해야 한다
    시간대 처리
      ✓ UTC 시간대 문제 없이 날짜를 정확히 처리해야 한다
  getTodayGanji
    ✓ 주어진 날짜의 일진(日辰)을 반환해야 한다
    ✓ 60갑자가 60일 주기로 반복되어야 한다

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
```

### Phase 2 추가 완료 (2026-03-02)

#### NEW-004: 음력 변환 함수 구현
- **파일**: [`dateFormatter.ts:42-100`](src/utils/dateFormatter.ts:42)
- **내용**: KasiService 연동 음력 변환 함수 구현
  - `formatLunarFromISOAsync()`: 비동기 음력 변환 (KASI API)
  - `formatLunarFromSolar()`: 양력→음력 변환
  - 윤달(윤월) 표시 지원

#### BUG-008: 사주 계산 캐싱
- **파일**: [`SajuCalculator.ts:535-580`](src/services/SajuCalculator.ts:535)
- **내용**: 메모리 기반 캐싱으로 중복 계산 방지
```typescript
const sajuCache = new Map<string, SajuResult>();
export function calculateSaju(...) { ... } // 캐시 활용
export function clearSajuCache(): void { ... } // 캐시 초기화
```

#### IMP-001/IMP-002: 이미 구현됨 확인
- 일간 강약 분석 상세화: SajuScreen.tsx에 reasons, dos/donts 표시 확인
- 오행 균형 섹션: elementBalance 섹션 및 ElementChart 컴포넌트 확인

### 진행 중인 작업
- **BUG-002**: 월주 절기 동적 조회 (KasiService 연동 필요, 복잡한 작업)

---

## 🎯 프로젝트 목표 (2026-02-01)

**"매일 새로운 운세를 영구적으로 제공하는 시스템 구축"**

현재 문제:
- 60일 주기로 같은 오늘 간지가 반복됨
- EASY_DAY_RELATIONS가 빈 객체로 오행 관계 해석 없음
- 메시지 풀이 제한적이라 비슷한 느낌의 운세 반복

목표:
- 1년 365일 모두 고유한 운세 제공
- 같은 날짜가 돌아와도 다른 운세 (연도 반영)
- 풍부하고 다양한 메시지 조합

---

## 📁 관련 파일 구조

```
src/
├── data/
│   └── fortuneMessages.ts       # 🔴 핵심 수정 대상 (운세 메시지 데이터)
├── services/
│   └── RichFortuneService.ts    # 🔴 핵심 수정 대상 (운세 생성 로직)
├── hooks/
│   └── useTodayFortune.ts       # 운세 데이터 훅
└── screens/
    ├── HomeScreen.tsx           # 오늘 운세 표시
    └── DailyFortuneScreen.tsx   # 상세 운세 화면
```

---

## 🔧 구현 작업 목록

### 작업 1: 연도 기반 시드 추가 (영구 중복 방지)

**파일**: `src/services/RichFortuneService.ts`
**위치**: 64-69번 줄 `getDailySeed` 함수

**현재 코드**:
```typescript
function getDailySeed(ilju: string, todayStem: string, todayBranch: string): number {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return hashCode(`${dateStr}-${ilju}-${todayStem}${todayBranch}`);
}
```

**변경 필요 없음**: 이미 `getFullYear()`가 포함되어 있어 연도별로 다른 시드 생성됨.

---

### 작업 2: EASY_DAY_RELATIONS 데이터 채우기 (핵심 작업)

**파일**: `src/data/fortuneMessages.ts`
**위치**: 31번 줄 (현재 빈 객체)

**현재 코드**:
```typescript
export const EASY_DAY_RELATIONS: Record<string, Record<string, EasyDayRelation>> = {};
```

**변경할 코드**:
5가지 일간 오행 × 5가지 오늘 오행 = 25가지 조합 데이터 추가

```typescript
export const EASY_DAY_RELATIONS: Record<string, Record<string, EasyDayRelation>> = {
  // ===== 목(木) 일간 =====
  'wood': {
    'wood': {
      title: '비견의 날 - 동료의 기운',
      summary: '나와 같은 에너지가 함께하는 날입니다.',
      detailed: '오늘은 비슷한 생각을 가진 사람들과 만나기 좋은 날입니다. 경쟁보다는 협력이 유리하며, 혼자보다 함께할 때 더 큰 힘을 발휘합니다. 다만 고집을 부리면 충돌할 수 있으니 유연하게 대처하세요.',
      situations: ['동료나 친구와의 협업', '경쟁 상황에서 자극받기', '비슷한 생각을 가진 사람 만남'],
      doThis: ['팀 프로젝트 진행하기', '친구와 운동하기', '스터디 그룹 참여'],
      avoidThis: ['혼자 고집 부리기', '경쟁에서 무리하기', '비교로 스트레스 받기'],
      luckyPoint: '같은 목표를 가진 동료와 함께할 때 행운이 따릅니다',
      keywords: ['협력', '동료', '경쟁', '자극']
    },
    'fire': {
      title: '식상의 날 - 표현의 기운',
      summary: '창의력과 표현력이 빛나는 날입니다.',
      detailed: '나무가 불을 생하듯, 당신의 아이디어가 빛을 발하는 날입니다. 숨겨둔 재능을 표현하고, 창작 활동에 집중하면 좋은 결과가 있습니다. 말솜씨도 좋아지니 발표나 소통에 적극적으로 나서세요.',
      situations: ['창작 활동 성과', '발표나 프레젠테이션', '새로운 아이디어 떠오름'],
      doThis: ['글쓰기/그림 그리기', '자기 PR하기', '새 프로젝트 기획'],
      avoidThis: ['입이 가벼워지기', '과한 자기 과시', '생각 없이 말하기'],
      luckyPoint: '자신을 표현할 때 예상치 못한 인정을 받습니다',
      keywords: ['창의력', '표현', '아이디어', '소통']
    },
    'earth': {
      title: '재성의 날 - 재물의 기운',
      summary: '돈과 관련된 일이 잘 풀리는 날입니다.',
      detailed: '나무가 흙을 다스리듯, 재물을 다루는 능력이 높아집니다. 투자 판단이 좋아지고, 수입 관련 좋은 소식이 있을 수 있습니다. 다만 욕심을 부리면 오히려 손해를 볼 수 있으니 적당히 만족하세요.',
      situations: ['재테크 기회', '수입 증가', '가치 있는 물건 발견'],
      doThis: ['재정 점검하기', '합리적 소비', '투자 공부'],
      avoidThis: ['충동 구매', '과도한 욕심', '빚으로 투자'],
      luckyPoint: '작은 절약이 큰 재물운으로 돌아옵니다',
      keywords: ['재물', '투자', '수입', '관리']
    },
    'metal': {
      title: '관성의 날 - 절제의 기운',
      summary: '규율과 자기 관리가 중요한 날입니다.',
      detailed: '쇠가 나무를 자르듯, 오늘은 스스로를 다잡아야 하는 날입니다. 자유롭게 하고 싶은 대로 하기보다 규칙을 지키고 절제하면 오히려 좋은 결과가 있습니다. 윗사람이나 규칙과의 관계에서 순응이 유리합니다.',
      situations: ['상사/선배 만남', '규칙 따르기', '자기 절제 필요'],
      doThis: ['계획대로 실행하기', '예의 갖추기', '약속 지키기'],
      avoidThis: ['반항심 부리기', '규칙 어기기', '충동적 행동'],
      luckyPoint: '절제하는 모습이 신뢰를 얻게 합니다',
      keywords: ['절제', '규율', '책임', '신뢰']
    },
    'water': {
      title: '인성의 날 - 배움의 기운',
      summary: '공부와 자기계발에 최적인 날입니다.',
      detailed: '물이 나무를 키우듯, 오늘은 배움과 성장의 기운이 가득합니다. 새로운 지식을 습득하거나, 자격증 공부, 독서 등에 집중하면 효과가 좋습니다. 멘토나 스승의 조언에 귀 기울이세요.',
      situations: ['공부/자격증', '멘토 만남', '지혜로운 조언'],
      doThis: ['독서하기', '온라인 강의 듣기', '선배 조언 구하기'],
      avoidThis: ['공부 미루기', '아는 척하기', '가르침 무시'],
      luckyPoint: '배움에 투자한 시간이 곧 행운으로 돌아옵니다',
      keywords: ['배움', '성장', '지식', '멘토']
    }
  },

  // ===== 화(火) 일간 =====
  'fire': {
    'wood': {
      title: '인성의 날 - 에너지 충전',
      summary: '활력이 넘치고 의욕이 생기는 날입니다.',
      detailed: '나무가 불을 키우듯, 오늘은 에너지가 충전되는 날입니다. 평소 의욕이 없었다면 오늘 시작해보세요. 지지해주는 사람이 나타나거나, 힘이 되는 말을 들을 수 있습니다.',
      situations: ['의욕 상승', '지지자 등장', '새 출발'],
      doThis: ['미루던 일 시작', '운동으로 활력 얻기', '긍정적 사람 만나기'],
      avoidThis: ['혼자 끙끙대기', '부정적 생각', '시작 미루기'],
      luckyPoint: '주변의 응원이 큰 힘이 됩니다',
      keywords: ['활력', '지지', '시작', '충전']
    },
    'fire': {
      title: '비견의 날 - 열정의 경쟁',
      summary: '열정이 불타오르지만 조절이 필요합니다.',
      detailed: '불과 불이 만나 더욱 뜨거워지는 날입니다. 열정과 의욕은 최고조이지만, 너무 과하면 번아웃이 올 수 있습니다. 경쟁에서 이기려는 욕심보다 자신의 페이스를 유지하세요.',
      situations: ['경쟁 상황', '열정 폭발', '과열 주의'],
      doThis: ['적당한 휴식 취하기', '열정을 일에 쏟기', '운동으로 해소'],
      avoidThis: ['무리한 경쟁', '화내기', '번아웃'],
      luckyPoint: '열정을 조절할 때 진정한 승리가 옵니다',
      keywords: ['열정', '경쟁', '조절', '페이스']
    },
    'earth': {
      title: '식상의 날 - 안정적 표현',
      summary: '자신의 생각을 차분하게 전달하기 좋습니다.',
      detailed: '불이 흙을 생하듯, 당신의 열정이 안정적인 결과물로 나타납니다. 즉흥적인 표현보다 차분하게 정리된 생각을 전달할 때 더 좋은 반응을 얻습니다.',
      situations: ['기획안 발표', '차분한 소통', '실속 있는 결과'],
      doThis: ['문서 정리하기', '천천히 설명하기', '실질적 결과물 만들기'],
      avoidThis: ['성급하게 말하기', '즉흥적 결정', '감정적 표현'],
      luckyPoint: '차분함이 신뢰를 얻는 열쇠입니다',
      keywords: ['안정', '표현', '결과', '신뢰']
    },
    'metal': {
      title: '재성의 날 - 현실적 이익',
      summary: '실질적인 이익을 챙길 수 있는 날입니다.',
      detailed: '불이 쇠를 녹여 원하는 형태로 만들듯, 오늘은 재물을 다루는 능력이 좋습니다. 협상에서 유리한 고지를 점하거나, 돈 관련 좋은 기회가 올 수 있습니다.',
      situations: ['협상/계약', '수익 기회', '물질적 성과'],
      doThis: ['협상에 임하기', '계약서 검토', '재정 정리'],
      avoidThis: ['무리한 요구', '과시적 소비', '욕심 과잉'],
      luckyPoint: '냉정한 판단이 큰 이익으로 이어집니다',
      keywords: ['이익', '협상', '재물', '판단']
    },
    'water': {
      title: '관성의 날 - 감정 조절',
      summary: '감정 기복에 주의가 필요한 날입니다.',
      detailed: '물이 불을 끄듯, 오늘은 열정이 꺾이거나 기분이 가라앉을 수 있습니다. 하지만 이것은 잠시 쉬어가라는 신호입니다. 무리하지 말고 감정을 추스르는 시간을 가지세요.',
      situations: ['감정 기복', '의욕 저하', '휴식 필요'],
      doThis: ['충분히 쉬기', '물 많이 마시기', '감정 정리'],
      avoidThis: ['무리하게 밀어붙이기', '화내기', '감정적 결정'],
      luckyPoint: '쉬어가는 것도 전략입니다',
      keywords: ['휴식', '조절', '감정', '재충전']
    }
  },

  // ===== 토(土) 일간 =====
  'earth': {
    'wood': {
      title: '관성의 날 - 변화의 바람',
      summary: '새로운 변화가 찾아오는 날입니다.',
      detailed: '나무가 흙을 뚫고 나오듯, 오늘은 기존의 안정을 흔드는 변화가 있을 수 있습니다. 변화를 두려워하지 말고 성장의 기회로 받아들이세요. 유연하게 대처하면 오히려 좋은 결과가 있습니다.',
      situations: ['예상치 못한 변화', '새로운 도전', '기존 질서 변동'],
      doThis: ['변화 수용하기', '유연하게 대처', '새 기회 찾기'],
      avoidThis: ['고집 부리기', '변화 거부', '과거에 집착'],
      luckyPoint: '변화를 받아들일 때 새로운 길이 열립니다',
      keywords: ['변화', '성장', '도전', '유연']
    },
    'fire': {
      title: '인성의 날 - 따뜻한 지지',
      summary: '주변의 관심과 지지를 받는 날입니다.',
      detailed: '불이 흙을 따뜻하게 데우듯, 오늘은 주변의 따뜻한 관심을 받습니다. 가족이나 가까운 사람들과 좋은 시간을 보내기 좋고, 마음의 안정을 얻을 수 있습니다.',
      situations: ['가족과의 시간', '따뜻한 관심', '마음의 안정'],
      doThis: ['가족과 시간 보내기', '감사 표현하기', '집 꾸미기'],
      avoidThis: ['혼자 지내기', '차가운 태도', '감정 억누르기'],
      luckyPoint: '따뜻한 마음을 나눌 때 행운이 찾아옵니다',
      keywords: ['가족', '따뜻함', '지지', '안정']
    },
    'earth': {
      title: '비견의 날 - 안정의 연대',
      summary: '믿을 수 있는 동반자를 만나는 날입니다.',
      detailed: '흙과 흙이 만나 더욱 단단해지듯, 오늘은 비슷한 가치관을 가진 사람과 유대감을 느낍니다. 오래된 친구를 만나거나, 신뢰할 수 있는 파트너를 찾기 좋은 날입니다.',
      situations: ['오래된 친구 만남', '신뢰 관계 형성', '안정적 협력'],
      doThis: ['신뢰할 사람과 대화', '오래된 관계 다지기', '팀워크 강화'],
      avoidThis: ['새 사람에게 너무 빨리 마음 열기', '의심', '불신'],
      luckyPoint: '믿을 수 있는 사람이 곧 행운입니다',
      keywords: ['신뢰', '연대', '동반자', '안정']
    },
    'metal': {
      title: '식상의 날 - 실속있는 결과',
      summary: '노력한 만큼 결과가 나오는 날입니다.',
      detailed: '흙에서 쇠가 나오듯, 오늘은 그동안의 노력이 결실로 나타납니다. 실속 있는 성과를 얻을 수 있으며, 정리정돈이나 마무리 작업에 좋은 날입니다.',
      situations: ['프로젝트 마무리', '정리정돈', '성과 달성'],
      doThis: ['밀린 일 마무리', '정리정돈', '성과 정리'],
      avoidThis: ['새 일 시작', '산만함', '마무리 미루기'],
      luckyPoint: '끝까지 마무리하는 것이 행운의 열쇠입니다',
      keywords: ['결과', '마무리', '정리', '실속']
    },
    'water': {
      title: '재성의 날 - 흐르는 재물',
      summary: '재물 운이 유동적인 날입니다.',
      detailed: '흙이 물을 막듯, 오늘은 재물을 지키려면 노력이 필요합니다. 들어오는 돈도 있지만 나가는 돈도 있을 수 있습니다. 수입과 지출의 균형을 잘 맞추세요.',
      situations: ['수입과 지출', '재물 관리', '예상치 못한 비용'],
      doThis: ['가계부 정리', '불필요한 지출 줄이기', '저축'],
      avoidThis: ['충동 구매', '빌려주기', '투자 위험 감수'],
      luckyPoint: '아끼는 것이 버는 것입니다',
      keywords: ['절약', '관리', '균형', '저축']
    }
  },

  // ===== 금(金) 일간 =====
  'metal': {
    'wood': {
      title: '재성의 날 - 기회 포착',
      summary: '좋은 기회를 잡을 수 있는 날입니다.',
      detailed: '쇠가 나무를 다듬듯, 오늘은 기회를 내 것으로 만드는 능력이 좋습니다. 재물 관련 좋은 소식이 있거나, 투자 기회가 올 수 있습니다. 단, 너무 욕심내면 놓칠 수 있습니다.',
      situations: ['투자 기회', '재물 기회', '새 수입원'],
      doThis: ['기회 잡기', '적절한 투자', '새 사업 검토'],
      avoidThis: ['과욕', '무리한 확장', '검증 없는 투자'],
      luckyPoint: '적당한 욕심이 적당한 행운을 부릅니다',
      keywords: ['기회', '투자', '재물', '포착']
    },
    'fire': {
      title: '관성의 날 - 단련의 시간',
      summary: '자신을 단련하는 시간입니다.',
      detailed: '불이 쇠를 단련하듯, 오늘은 시련처럼 느껴지는 일이 있을 수 있습니다. 하지만 이것은 당신을 더 강하게 만드는 과정입니다. 인내하고 버티면 더 단단해집니다.',
      situations: ['시련', '도전', '인내 필요'],
      doThis: ['참고 견디기', '감정 절제', '묵묵히 해내기'],
      avoidThis: ['포기', '불평', '분노 표출'],
      luckyPoint: '시련을 견딘 만큼 강해집니다',
      keywords: ['단련', '인내', '성장', '극복']
    },
    'earth': {
      title: '인성의 날 - 안정적 성장',
      summary: '든든한 기반 위에서 성장하는 날입니다.',
      detailed: '흙이 쇠를 품듯, 오늘은 안정적인 환경에서 실력을 쌓을 수 있습니다. 공부나 자기계발에 좋고, 어른이나 전문가의 조언이 도움이 됩니다.',
      situations: ['공부/학습', '전문가 조언', '자격 취득'],
      doThis: ['꾸준히 공부', '전문가 상담', '자격증 준비'],
      avoidThis: ['게으름', '기초 무시', '속성 과정'],
      luckyPoint: '기초를 탄탄히 할 때 큰 성장이 옵니다',
      keywords: ['기초', '성장', '공부', '안정']
    },
    'metal': {
      title: '비견의 날 - 결단의 동맹',
      summary: '같은 뜻을 가진 사람과 함께하는 날입니다.',
      detailed: '쇠와 쇠가 만나 더욱 날카로워지듯, 오늘은 결단력 있는 사람들과 시너지를 낼 수 있습니다. 다만 서로 고집이 세면 부딪힐 수 있으니 양보도 필요합니다.',
      situations: ['팀 결성', '결단 필요', '동맹 관계'],
      doThis: ['팀워크 발휘', '빠른 결정', '협력'],
      avoidThis: ['고집 부리기', '독단', '날카로운 말'],
      luckyPoint: '함께 결단할 때 더 큰 힘이 됩니다',
      keywords: ['결단', '협력', '팀워크', '시너지']
    },
    'water': {
      title: '식상의 날 - 유연한 표현',
      summary: '부드럽게 자신을 표현하기 좋은 날입니다.',
      detailed: '쇠가 물을 생하듯, 오늘은 날카로움보다 부드러움이 좋습니다. 직설적으로 말하기보다 우회적으로 표현할 때 더 좋은 반응을 얻습니다.',
      situations: ['설득', '협상', '부드러운 소통'],
      doThis: ['우회적 표현', '상대 배려', '유연한 대화'],
      avoidThis: ['직설적 비판', '날카로운 지적', '무뚝뚝함'],
      luckyPoint: '부드러움이 강함을 이깁니다',
      keywords: ['유연', '표현', '소통', '배려']
    }
  },

  // ===== 수(水) 일간 =====
  'water': {
    'wood': {
      title: '식상의 날 - 아이디어 분출',
      summary: '창의적 아이디어가 샘솟는 날입니다.',
      detailed: '물이 나무를 키우듯, 오늘은 당신의 생각이 풍성하게 자랍니다. 아이디어를 글이나 기획으로 정리하면 좋고, 창작 활동에 최적인 날입니다.',
      situations: ['아이디어 폭발', '창작', '기획'],
      doThis: ['아이디어 메모', '글쓰기', '기획안 작성'],
      avoidThis: ['생각만 하기', '아이디어 묵히기', '실행 미루기'],
      luckyPoint: '떠오른 아이디어를 바로 기록하세요',
      keywords: ['창의', '아이디어', '표현', '기획']
    },
    'fire': {
      title: '재성의 날 - 열정적 수익',
      summary: '적극적으로 움직일 때 수익이 따르는 날입니다.',
      detailed: '물이 불을 만나 증기가 되듯, 오늘은 에너지를 쏟은 만큼 결과가 옵니다. 소극적으로 있지 말고 적극적으로 기회를 잡으세요. 재물 관련 액션이 필요합니다.',
      situations: ['적극적 영업', '기회 포착', '수익 활동'],
      doThis: ['적극적으로 나서기', '영업/홍보', '가격 협상'],
      avoidThis: ['소극적 태도', '기다리기만', '기회 놓치기'],
      luckyPoint: '움직이는 자에게 행운이 옵니다',
      keywords: ['적극', '수익', '행동', '기회']
    },
    'earth': {
      title: '관성의 날 - 안정의 제약',
      summary: '안정을 추구하되 제약을 느낄 수 있는 날입니다.',
      detailed: '흙이 물을 막듯, 오늘은 하고 싶은 대로 하기 어려울 수 있습니다. 규칙이나 절차를 따라야 하는 상황이 생깁니다. 순응하면서 때를 기다리세요.',
      situations: ['규칙 준수', '절차 진행', '제약 상황'],
      doThis: ['규칙 따르기', '서류 처리', '인내하기'],
      avoidThis: ['무리하게 밀어붙이기', '규칙 어기기', '급하게 굴기'],
      luckyPoint: '때를 기다리는 것도 지혜입니다',
      keywords: ['절차', '인내', '규칙', '기다림']
    },
    'metal': {
      title: '인성의 날 - 지혜로운 성장',
      summary: '깊이 있는 배움이 있는 날입니다.',
      detailed: '쇠가 물을 생하듯, 오늘은 지식과 지혜가 당신에게 흘러들어옵니다. 책을 읽거나 강의를 듣기 좋고, 현명한 조언을 얻을 수 있습니다.',
      situations: ['학습', '조언 얻기', '깊은 대화'],
      doThis: ['독서', '강의 듣기', '현명한 사람과 대화'],
      avoidThis: ['얕은 지식 과시', '공부 회피', '조언 무시'],
      luckyPoint: '배움에 열린 마음이 행운을 부릅니다',
      keywords: ['지혜', '배움', '성장', '통찰']
    },
    'water': {
      title: '비견의 날 - 깊은 교류',
      summary: '마음이 통하는 사람과 깊은 대화가 있는 날입니다.',
      detailed: '물과 물이 만나 더 커지듯, 오늘은 비슷한 감성을 가진 사람과 깊은 교류가 있습니다. 감정을 나누고 공감대를 형성하기 좋은 날입니다.',
      situations: ['깊은 대화', '감정 교류', '공감'],
      doThis: ['마음 터놓고 대화', '공감하기', '함께 취미 활동'],
      avoidThis: ['혼자만의 생각', '감정 숨기기', '표면적 대화'],
      luckyPoint: '마음을 나눌 때 진정한 행운이 옵니다',
      keywords: ['공감', '교류', '감성', '연결']
    }
  }
};
```

---

### 작업 3: 랜덤 조합용 추가 메시지 풀 생성

**파일**: `src/data/fortuneMessages.ts`
**위치**: 파일 끝에 추가

**추가할 데이터**:

```typescript
// ===== 랜덤 조합용 메시지 풀 =====

// 상황별 메시지 (각 20개 이상)
export const SITUATION_POOL = {
  positive: [
    '예상치 못한 좋은 소식이 올 수 있어요',
    '오래된 친구에게 연락이 올 수 있어요',
    '작은 행운이 찾아올 수 있는 날이에요',
    '노력한 일이 인정받을 수 있어요',
    '새로운 인연을 만날 수 있어요',
    '창의적인 아이디어가 떠오를 수 있어요',
    '금전적으로 좋은 기회가 있을 수 있어요',
    '건강이 회복되는 기운이 있어요',
    '갈등이 해결되는 실마리가 보여요',
    '숨겨진 재능을 발견할 수 있어요',
    '주변 사람들의 도움을 받을 수 있어요',
    '오랫동안 원하던 일이 진행될 수 있어요',
    '학업이나 시험에서 좋은 결과가 있을 수 있어요',
    '여행이나 외출에 좋은 기운이 있어요',
    '계약이나 협상이 잘 풀릴 수 있어요',
    '직장에서 인정받을 수 있는 일이 생겨요',
    '가족과 화목한 시간을 보낼 수 있어요',
    '건강 관리 효과가 좋은 날이에요',
    '미루던 일을 시작하기 좋은 타이밍이에요',
    '새로운 배움의 기회가 찾아올 수 있어요'
  ],
  neutral: [
    '평온하게 하루를 보내기 좋은 날이에요',
    '특별한 일 없이 안정적인 하루에요',
    '일상적인 업무에 집중하기 좋아요',
    '조용히 자기 시간을 갖기 좋은 날이에요',
    '급한 일보다 천천히 진행하는 게 좋아요',
    '큰 결정보다는 작은 일에 집중하세요',
    '휴식을 취하며 재충전하기 좋아요',
    '정리정돈을 하기 좋은 날이에요',
    '계획을 세우기 좋은 시간이에요',
    '내면을 돌아보기 좋은 하루에요',
    '독서나 영화 감상이 어울리는 날이에요',
    '산책이나 가벼운 운동이 좋아요',
    '집에서 편하게 쉬기 좋은 날이에요',
    '음식을 만들거나 요리하기 좋아요',
    '오래된 물건을 정리하기 좋아요'
  ],
  caution: [
    '충동적인 결정은 피하는 게 좋아요',
    '금전적인 큰 결정은 미루세요',
    '새로운 시작보다는 마무리에 집중하세요',
    '건강 관리에 신경 쓰세요',
    '말실수에 주의하세요',
    '과로하지 않도록 주의하세요',
    '분쟁이나 다툼을 피하세요',
    '약속 시간을 꼭 지키세요',
    '중요한 계약은 한 번 더 검토하세요',
    '감정적인 결정을 피하세요',
    '무리한 운동은 삼가세요',
    '늦은 밤 외출은 피하는 게 좋아요',
    '과식이나 과음을 조심하세요',
    '남의 일에 너무 개입하지 마세요',
    '험담이나 뒷담화를 피하세요'
  ]
};

// 행운 포인트 풀 (각 20개 이상)
export const LUCKY_POINT_POOL = [
  '아침에 일어나면 창문을 열고 환기하세요',
  '따뜻한 물을 자주 마시면 좋아요',
  '밝은 색 옷을 입으면 기운이 올라요',
  '좋아하는 음악을 들으며 시작하세요',
  '감사한 일 3가지를 떠올려보세요',
  '가벼운 스트레칭으로 하루를 시작하세요',
  '정리된 책상에서 일하면 효율이 올라요',
  '점심 식사 후 짧은 산책이 좋아요',
  '오늘 할 일을 메모해두면 도움이 돼요',
  '친한 사람에게 먼저 연락해보세요',
  '평소 가지 않던 길로 출퇴근해보세요',
  '작은 선물을 준비하면 좋은 일이 생겨요',
  '오늘의 목표를 하나만 정해보세요',
  '눈을 감고 심호흡 10번이 도움이 돼요',
  '좋은 향기를 맡으면 기분이 좋아져요',
  '오늘 처음 보는 사람에게 먼저 인사하세요',
  '자기 전 오늘 잘한 일을 떠올려보세요',
  '일찍 잠자리에 들면 내일이 좋아져요',
  '좋아하는 음식을 먹으면 운이 올라요',
  '가족에게 고마움을 표현해보세요'
];

// 키워드 풀 (각 카테고리 20개 이상)
export const KEYWORD_POOL = {
  emotion: ['평화', '기쁨', '설렘', '안정', '활력', '희망', '감사', '여유', '충만', '따뜻함', '행복', '편안', '만족', '즐거움', '사랑'],
  action: ['시작', '도전', '협력', '창조', '성장', '소통', '배움', '정리', '마무리', '결단', '실행', '준비', '계획', '휴식', '집중'],
  value: ['신뢰', '성실', '인내', '지혜', '용기', '겸손', '배려', '정직', '책임', '헌신', '균형', '조화', '절제', '끈기', '열정']
};
```

---

### 작업 4: RichFortuneService 메시지 조합 로직 개선

**파일**: `src/services/RichFortuneService.ts`
**위치**: `generateRichDailyFortune` 함수 내부

**추가/수정 사항**:

```typescript
// 파일 상단에 import 추가
import {
  // ... 기존 import들 ...
  SITUATION_POOL,
  LUCKY_POINT_POOL,
  KEYWORD_POOL,
} from '../data/fortuneMessages';

// generateRichDailyFortune 함수 내에 랜덤 조합 로직 추가

// 날짜 기반 시드로 상황 메시지 선택 (매일 다른 조합)
function selectDailyMessages(random: () => number, seed: number) {
  // 긍정적 상황 1-2개
  const positiveCount = Math.floor(random() * 2) + 1;
  const positives = shuffleWithSeed(SITUATION_POOL.positive, seed)
    .slice(0, positiveCount);

  // 중립 상황 1개
  const neutral = shuffleWithSeed(SITUATION_POOL.neutral, seed)[0];

  // 주의 상황 0-1개 (50% 확률)
  const caution = random() > 0.5
    ? shuffleWithSeed(SITUATION_POOL.caution, seed)[0]
    : null;

  // 행운 포인트 1개
  const luckyPoint = shuffleWithSeed(LUCKY_POINT_POOL, seed)[0];

  // 키워드 3개 (각 카테고리에서 1개씩)
  const keywords = [
    shuffleWithSeed(KEYWORD_POOL.emotion, seed)[0],
    shuffleWithSeed(KEYWORD_POOL.action, seed)[0],
    shuffleWithSeed(KEYWORD_POOL.value, seed)[0],
  ];

  return { positives, neutral, caution, luckyPoint, keywords };
}

// 시드 기반 셔플 함수
function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  const random = seededRandom(seed);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

---

## 📊 예상 결과

### 중복 방지 효과

| 항목 | 현재 | 개선 후 |
|------|------|---------|
| 오행 관계 해석 | 0개 (빈 객체) | 25개 |
| 상황 메시지 풀 | 제한적 | 50개+ |
| 행운 포인트 풀 | 제한적 | 20개+ |
| 키워드 풀 | 제한적 | 45개+ |
| **중복 주기** | **60일** | **사실상 무한** |

### 조합 가짓수 계산

```
60갑자 일주 × 60 오늘간지 × 25 오행관계 × 메시지풀 랜덤 조합
= 3,600 × 25 × (수백 가지 조합)
= 수백만 가지 이상의 고유한 운세
```

---

## ✅ 구현 체크리스트

- [x] 작업 1: getDailySeed 함수 확인 (이미 연도 포함)
- [x] 작업 2: EASY_DAY_RELATIONS 25가지 데이터 채우기
- [x] 작업 3: 랜덤 메시지 풀 추가 (SITUATION_POOL, LUCKY_POINT_POOL, KEYWORD_POOL)
- [x] 작업 4: RichFortuneService 메시지 조합 로직 개선
- [x] 테스트: TypeScript 컴파일 검사 완료
- [x] 빌드 및 배포: Release APK 생성 완료 (117MB)

---

## 🔍 코드 리뷰 결과 (2026-02-01)

### Critical Bug 수정 완료

| 버그 | 상태 | 수정 내용 |
|------|------|-----------|
| KASI API XML 파싱 에러 | ✅ 해결 | `validateXmlResponse()` 추가로 HTML 에러 페이지 감지 및 명시적 에러 처리 |
| StorageService Race Condition | ✅ 해결 | `queueSavePerson()` 구현으로 동시 저장 시 데이터 손실 방지 |

### 구현 검증 결과

| 항목 | 기획안 위치 | 실제 구현 위치 | 상태 |
|------|-------------|----------------|------|
| EASY_DAY_RELATIONS (25가지) | PROGRESS.md:76-346 | fortuneMessages.ts:31-2460 | ✅ 일치 |
| SITUATION_POOL | PROGRESS.md:362-419 | fortuneMessages.ts:2474-2532 | ✅ 일치 |
| LUCKY_POINT_POOL | PROGRESS.md:422-443 | fortuneMessages.ts:2534-2556 | ✅ 일치 |
| KEYWORD_POOL | PROGRESS.md:446-450 | fortuneMessages.ts:2558-2564 | ✅ 일치 |
| selectDailyMessages | PROGRESS.md:474-499 | RichFortuneService.ts:97-120 | ✅ 일치 |
| shuffleWithSeed | PROGRESS.md:502-510 | RichFortuneService.ts:86-95 | ✅ 일치 |

### 테스트 결과
```
✅ 30 tests passed
✅ TypeScript 컴파일 에러 없음
✅ Release APK 빌드 성공 (117MB)
```

### 종합 평가
**구현 완료도: 100%** - 기획안의 모든 기능이 코드에 정확히 구현됨

---

## 🔧 테스트 방법

```typescript
// 60일간 운세 중복 테스트 스크립트
const testUniqueFortunes = () => {
  const fortunes = new Set();
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const testDate = new Date(today);
    testDate.setDate(testDate.getDate() + i);

    // 해당 날짜의 운세 생성
    const fortune = generateRichDailyFortune(mockSajuResult, todayStem, todayBranch);
    const fortuneKey = JSON.stringify(fortune?.summary + fortune?.detailedInterpretation);

    if (fortunes.has(fortuneKey)) {
      console.log(`중복 발견: ${i}일차`);
    }
    fortunes.add(fortuneKey);
  }

  console.log(`총 ${fortunes.size}개의 고유한 운세 생성됨`);
};
```

---

## 📝 참고사항

1. **EASY_DAY_RELATIONS 데이터가 핵심** - 이 25가지 조합이 채워지면 오행 관계에 따른 풍부한 해석 제공
2. **메시지 풀은 확장 가능** - 나중에 더 많은 메시지를 추가하면 더욱 다양해짐
3. **시드 기반 랜덤** - 같은 날 같은 사람은 같은 운세를 보지만, 다른 날은 다른 운세

---

**작성자**: Claude AI
**다음 작업자**: 다른 AI 또는 개발자
**예상 소요 시간**: 2-3시간

---

## 📋 작업 로그

> 2026-02-01, 02-02 작업 로그는 `ARCHIVE_2026_02.md`로 이동됨

---

## 🐛 버그 리포트 및 개선사항 (2026-02-01)

> **분석 대상**: 전체 코드베이스 (src/ 디렉토리)
> **분석 도구**: 정적 코드 분석
> **심각도**: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low | 🔵 Info

---

### 🔴 Critical (즉시 수정 필요)

#### 1. KASI API 키 클라이언트 노출 위험

**파일**: `src/services/KasiService.ts` (Line 15)

**문제 코드**:
```typescript
// Line 15
const API_KEY = process.env.EXPO_PUBLIC_KASI_API_KEY || '';
```

**문제 설명**:
- `EXPO_PUBLIC_` 접두사는 클라이언트 측에 반드시 노출됨
- KASI API 키가 프론트엔드 코드에 포함되어 악용 가능
- API 사용량 제한 초과 및 과금 위험
- 앱 리버스 엔지니어링으로 API 키 탈취 가능

**영향도**:
- 보안 취약점
- API 키 도난 시 악의적 사용 가능
- 과금 폭탄 위험

**해결 방법** (우선순위: 🔴 Critical):
```typescript
// 방법 1: Expo Secret 환경변수 사용 (권장)
const API_KEY = process.env.KASI_API_KEY || ''; // EXPO_PUBLIC_ 제거

// 방법 2: 서버 프록시 구현 (더 안전)
// 클라이언트 → 자체 API 서버 → KASI API
// 실제 키는 서버에서만 관리
```

**작업 단계**:
1. `.env` 파일에서 `EXPO_PUBLIC_KASI_API_KEY` → `KASI_API_KEY`로 변경
2. EAS Secret에 환경변수 등록: `eas secret:create --name KASI_API_KEY --value "actual-key"`
3. `app.json` 또는 `eas.json`에 환경변수 매핑 추가
4. KASI API 키 재발급 및 기존 키 폐기

---

### 🟠 High (빠른 시일 내 수정 필요)

#### ~~2. Navigation.tsx 테마 색상 불일치~~ ✅ 오류 아님 (2026-02-01 검증)

> **검증 결과**: `theme.ts` 34-37줄에 `white`와 `border`가 **정상적으로 정의되어 있음**
> ```typescript
> border: '#E0E0E0',  // Line 34
> white: '#FFFFFF',   // Line 37
> ```
> 버그 리포트 분석 오류. 수정 불필요.

---

#### 3. ThemeContext.tsx 렌더링 깜빡임 → 🟢 Low로 하향

**파일**: `src/contexts/ThemeContext.tsx` (Line 162-164)

**문제 코드**:
```typescript
// Line 162-164
if (!isLoaded) {
  return null;  // ❌ 첫 렌더링에서 깜빡임/화면 없음
}
```

**문제 설명**:
- 초기 로딩 중 `null` 반환으로 인해 화면이 완전히 비어 보일 수 있음
- React Native에서 `null` 반환은 허용되지만, SplashScreen이나 로딩 UI가 없으면 사용자 경험 저하
- 특히 느린 기기에서 테마 로딩 시 빈 화면 노출

**해결 방법** (우선순위: 🟠 High):
```typescript
// 방법 1: 로딩 컴포넌트 반환
if (!isLoaded) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
      <ActivityIndicator size="large" color="#6366F1" />
      <Text style={{ marginTop: 16, color: '#64748B' }}>테마 로딩 중...</Text>
    </View>
  );
}

// 방법 2: 기본 테마로 먼저 렌더링 (권장 - CLS 방지)
if (!isLoaded) {
  // 로딩 완료 전 기본 light 테마로 자식 렌더링
  const defaultValue = { /* 기본값 */ };
  return <ThemeContext.Provider value={defaultValue}>{children}</ThemeContext.Provider>;
}
```

---

### 🟡 Medium (권장 개선사항)

#### ~~4. SajuCalculator 자시(23시) 처리 버그~~ ✅ 오류 아님 (2026-02-01 검증)

> **검증 결과**: 현재 코드는 **조자시(早子時) 방식**으로 정상 구현됨
>
> **사주학 자시 처리 학파:**
> - **야자시(夜子時)**: 23:00~01:00 모두 다음 날 자시로 봄
> - **조자시(早子時)**: 23:00~23:59만 다음 날, 00:00~00:59는 당일 자시로 봄 ← **현재 구현**
>
> 한국에서는 조자시가 더 일반적으로 사용됨. 버그 리포트 분석 오류. 수정 불필요.

---

#### 5. StorageService Race Condition 한계 → 🟢 Low로 하향

**파일**: `src/services/StorageService.ts` (Line 54-69)

**문제 설명**:
- 큐 패턴은 사용되지만, 다중 인스턴스 간 동기화는 보장되지 않음
- 앱이 백그라운드에서 죽고 재시작 시 큐 초기화됨
- 낮은 확률이지만 동시 저장 시 데이터 손실 가능성

**해결 방법** (우선순위: 🟡 Medium - 현재로서는 충분):
```typescript
// 현재 구현으로도 단일 사용자 앱에서는 충분
// 고도화가 필요한 경우:

// 방법: SQLite 트랜잭션 사용
static async savePerson(person: SavedPerson): Promise<void> {
  if (this.isWeb) {
    // 기존 큐 기반 방식 유지
  } else {
    // SQLite 트랜잭션으로 atomic 보장
    await this.db.runAsync(
      'INSERT OR REPLACE INTO saved_people (id, data) VALUES (?, ?)',
      person.id,
      JSON.stringify(person)
    );
  }
}
```

---

#### 6. SecureStorageService 암호화 취약점

**파일**: `src/services/SecureStorageService.ts` (Line 13, 21-38)

**문제 코드**:
```typescript
// Line 13
const ENCRYPTION_KEY = 'SajuToday2026SecureKey!@#$';  // ❌ 하드코딩된 키

// Line 24 - unescape/escape 사용 (deprecated)
const base64 = btoa(unescape(encodeURIComponent(text)));
```

**문제 설명**:
- 하드코딩된 XOR 키는 보안에 취약 (리버스 엔지니어링으로 탈취 가능)
- `unescape`/`escape`는 deprecated된 함수
- XOR 암호화는 보안 수준이 낮음 (Base64 인코딩만으로도 충분하지 않음)

**해결 방법** (우선순위: 🟡 Medium):
```typescript
// 방법 1: Expo SecureStore 사용 (권장 - Native 모듈 필요)
import * as SecureStore from 'expo-secure-store';

// 방법 2: Crypto API 사용
import * as Crypto from 'expo-crypto';

// 방법 3: 키 분산 저장 (현재 구현의 개선)
const getEncryptionKey = () => {
  // 여러 소스에서 키 조합 (완전한 보안은 아니지만 개선)
  const part1 = process.env.SECURE_KEY_PART1 || '';
  const part2 = Constants.manifest?.extra?.secureKeyPart2 || '';
  return part1 + part2;
};
```

**참고**: 현재는 Base64 + XOR 난독화 정도로 충분할 수 있으나, 민감 데이터(개인정보) 저장 시 `expo-secure-store` 마이그레이션 권장

---

### 🟢 Low (개선 권장)

#### 7. useTodayFortune 날짜 객체 생성 최적화

**파일**: `src/hooks/useTodayFortune.ts` (Line 37)

**문제 설명**:
- Date 객체가 매 렌더링마다 새로 생성됨
- useMemo 의존성 배열이 문자열로 변환되어 있어 사실상 매번 새 값

**영향**: 낮음 (성능에 큰 영향 없음)

**해결 방법** (우선순위: 🟢 Low):
```typescript
// 현재 구현도 충분하나, 완벽한 최적화를 위해:
const targetDateStr = useMemo(() => 
  targetDate ? targetDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  [targetDate?.getTime()] // timestamp로 비교
);
```

---

#### 8. FortuneGenerator.ts 파일 분할

**파일**: `src/services/FortuneGenerator.ts`

**문제 설명**:
- 파일 크기가 1000줄 이상으로 너무 큼
- 유지보수성 저하, 테스트 어려움

**해결 방법** (우선순위: 🟢 Low):
```
src/services/fortune/
├── FortuneGenerator.ts      # 메인 엔트리
├── elementAnalysis.ts       # 오행 분석
├── branchAnalysis.ts        # 지지 분석
├── messagePools.ts          # 메시지 풀
└── types.ts                 # 타입 정의
```

---

#### 9. 미사용 함수 제거

**파일**: `src/services/CompatibilityService.ts` (Line 359-361)

**문제 코드**:
```typescript
// 사용되지 않는 함수
function checkStemCombination(stem1: string, stem2: string): boolean {
  return getStemCombinationInfo(stem1, stem2) !== null;
}
```

**해결 방법**: 해당 함수 제거 (Line 320에서 직접 `getStemCombinationInfo` 호출 중)

---

### 🔵 Info (개발 개선사항)

#### 10. KasiService 에러 처리 개선

**파일**: `src/services/KasiService.ts` (Line 256-265)

**문제 설명**:
- API 에러가 조용히 무시되고 캐시된(만료된) 데이터 반환
- 사용자에게 오류 상황을 알리지 않음
- 네트워크 장애 시 사용자가 인지하지 못함

**개선 권장**:
```typescript
} catch (error) {
  console.error('KASI solarToLunar error:', error);
  const fallbackCache = await this.getCache<LunarInfo>(cacheKey, true);
  if (fallbackCache) {
    // 오프라인 모드로 전환 알림
    EventEmitter.emit('api:fallback', { service: 'solarToLunar', cache: true });
    return fallbackCache;
  }
  // UI에서 처리할 수 있도록 에러 전달
  throw new Error('KASI_API_UNAVAILABLE');
}
```

---

#### 11. SajuCalculator 윤달 처리

**파일**: `src/services/SajuCalculator.ts`

**문제 설명**:
- 윤달(윤월) 처리 로직이 없음
- 음력 변환 시 윤달 고려가 필요할 수 있음

**참고**: 현재는 양력 기준으로만 계산되므로, 음력 입력이 필요한 경우 별도 처리 필요

---

#### 12. Navigation 타입 정의 개선

**파일**: `src/types/index.ts` (Line 313-356)

**문제 설명**:
- `RootStackParamList`, `MainTabParamList` 등 정의되어 있음
- 실제 네비게이션에서 `any` 타입으로 사용됨

**개선 권장**:
```typescript
// Navigation.tsx에서 타입 적용
import { RootStackParamList } from './types';
const Stack = createNativeStackNavigator<RootStackParamList>();
```

---

## 📊 버그 심각도 요약 (2026-02-01 검증 후 수정)

| 심각도 | 개수 | 항목 |
|--------|------|------|
| 🔴 Critical | 1 | API 키 누출 (KASI) - 단, 무료 API이므로 실제 위험도 낮음 |
| 🟠 High | 0 | ~~테마 색상 불일치~~ (오류 아님), ~~Theme 로딩 깜빡임~~ (Low로 하향) |
| 🟡 Medium | 1 | 암호화 (SecureStorageService) |
| 🟢 Low | 6 | Theme 로딩, Race Condition, 메모리 최적화, 파일 분할, 미사용 코드 |
| 🔵 Info | 4 | 에러 처리, 윤달, 타입 개선 |
| ❌ 오류 | 2 | ~~테마 색상 불일치~~, ~~자시 처리 버그~~ (분석 오류로 제외)

---

## 🛠️ 우선 수정 권장 순위 및 방법

### 1순위: KASI API 키 보안 (🔴 Critical)

```bash
# 1. .env 파일 수정
EXPO_PUBLIC_KASI_API_KEY → KASI_API_KEY

# 2. EAS Secret 등록
eas secret:create --name KASI_API_KEY --value "your-api-key"

# 3. KasiService.ts 수정
const API_KEY = process.env.KASI_API_KEY || '';

# 4. eas.json 수정
{
  "build": {
    "production": {
      "env": {
        "KASI_API_KEY": "${KASI_API_KEY}"
      }
    }
  }
}

# 5. 기존 API 키 폐기 및 재발급
```

### ~~2순위: 테마 색상 오류 수정~~ ❌ 삭제 (2026-02-01 검증: 오류 아님)
> `theme.ts`에 `white`, `border` 정상 정의됨. 분석 오류.

### ~~3순위: 자시 처리 로직 보완~~ ❌ 삭제 (2026-02-01 검증: 오류 아님)
> 현재 조자시(早子時) 방식 정상 구현. 한국 표준 방식.

---

**버그 리포트 작성자**: Claude AI  
**작성일**: 2026-02-01  
**다음 검토일**: 2026-02-08


---

## 🐛 버그 리포트 및 개선사항 (2026-02-07)

> 분석 대상: src/ 전반 + 주요 서비스/화면
> 분석 도구: 정적 코드 리뷰
> 심각도: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low | 🔵 Info

---

### 🟠 High (빠른 시일 내 수정 필요)

#### 1. 음력 입력이 저장/궁합 계산에서 무시됨
**위치**:
- `src/screens/CompatibilityInputScreen.tsx` (Line 168, 286-291)
- `src/screens/SavedPeopleScreen.tsx` (Line 126)
- `src/services/SajuCalculator.ts` (Line 520-528)

**문제**:
- 달력 유형이 `lunar`/윤달이어도 `calculateSaju`는 양력으로 계산
- 음력 입력 사용자 결과가 일관되게 틀림

**해결 방법**:
- 음력 선택 시 `KasiService.lunarToSolar` 변환 후 계산
- 또는 음력 옵션을 비활성화하고 "양력만 지원" 안내

#### 2. 로컬 날짜를 UTC 문자열로 저장/비교 (toISOString)
**위치**:
- `src/hooks/useTodayFortune.ts` (Line 37)
- `src/screens/DreamDiaryScreen.tsx` (Line 120)
- `src/services/FortuneTypes.ts` (Line 5109)
- `src/services/StorageService.ts` (Line 108, 122)
- `src/screens/CompatibilityInputScreen.tsx` (Line 168, 286, 291)
- `src/screens/SavedPeopleScreen.tsx` (Line 126)

**문제**:
- `toISOString()`은 UTC 기준 → KST 등 양수 오프셋에서 날짜가 하루 밀림
- 생년월일/운세/일기 날짜 저장 및 비교가 1일 오차

**해결 방법**:
- `formatDateISO`(로컬 `getFullYear/getMonth/getDate`)로 통일
- 날짜 문자열 생성/파싱 유틸을 한 곳에서 관리

---

### 🟡 Medium (권장 개선사항)

#### 3. KASI 간지 API 호출 경로 미정의
**위치**: `src/services/KasiService.ts` (Line 528, `LUNAR_API_URL` 미정의)

**문제**:
- ReferenceError로 API 호출이 실패 → 로컬 계산만 사용
- KASI 간지 정확도 활용 불가

**해결 방법**:
```typescript
// 예시
const LUNAR_API_URL = `${KASI_BASE_URL}/LunCalInfoService`;
```

#### 4. 일진 계산 기준 불일치
**위치**:
- `src/services/SajuCalculator.ts` (Line 27)
- `src/services/MonthlyDailyFortune.ts` (Line 57)

**문제**:
- BASE_DATE 및 오프셋 방식이 달라 동일 날짜의 일진이 다름
- 오늘 운세/캘린더/간지 관련 결과 불일치 가능

**해결 방법**:
- 하나의 기준일/공식으로 통일
- 공용 유틸로 분리하여 단일 소스 유지

#### 5. useTodayFortune 해시 음수 인덱스
**위치**: `src/hooks/useTodayFortune.ts` (Line 313)

**문제**:
- 음수 해시가 배열 인덱스로 사용 → undefined 메시지 가능

**해결 방법**:
```typescript
const hash = (getHash(str) >>> 0); // 음수 방지
```

---

### 🟢 Low (개선 권장)

#### 6. 날짜 파싱이 UTC 기준
**위치**: `src/utils/dateFormatter.ts` (Line 92 등 `new Date('YYYY-MM-DD')` 패턴)

**문제**:
- UTC 파싱으로 표기/계산 하루 오차 가능

**해결 방법**:
- `parseLocalDate` 유틸 추가 (문자열 split → new Date(y, m-1, d))

---

## 🛠️ 우선 수정 권장 순위 (2026-02-07)

1. 음력 입력 처리 보완 (CompatibilityInputScreen, SavedPeopleScreen) 또는 음력 옵션 비활성화
2. 날짜 문자열 생성/파싱을 로컬 기준으로 통일 (toISOString 제거)
3. KASI 간지 API 경로 정의 및 통합
4. 일진 계산 로직 단일화
5. useTodayFortune 해시 안정화

---

**버그 리포트 작성자**: Claude AI
**작성일**: 2026-02-07
**다음 검토일**: 2026-02-14

---

## ✅ 2026-02-07 버그 검증 및 수정 결과 (Opus 4.6)

> 위 버그 리포트를 코드 대조 검증 후 수정 완료

### 검증 결과 요약

| # | 버그 | 판정 | 수정 상태 |
|---|------|------|-----------|
| 1 | 음력 입력 무시 (CompatibilityInputScreen, SavedPeopleScreen) | ✅ 확인 | ✅ 수정 완료 |
| 2 | toISOString UTC 날짜 밀림 | ✅ 확인 | ✅ 수정 완료 |
| 3 | KASI 간지 API 경로(LUNAR_API_URL) 미정의 | ✅ 확인 | ⏳ 미수정 (getGanjiInfo 전용, 음력변환과 무관) |
| 4 | 일진 계산 기준 불일치 (SajuCalculator vs MonthlyDailyFortune) | ✅ 확인 (치명적) | ✅ 수정 완료 |
| 5 | useTodayFortune 해시 음수 인덱스 | ✅ 확인 | ✅ 수정 완료 |
| 6 | 날짜 파싱 UTC 기준 | ✅ 확인 | ✅ #2와 함께 수정 |

### 수정 상세

#### 버그 #4 (치명적): 일진 계산 JDN 기반으로 전면 재작성
- **원인**: SajuCalculator는 1900/1/31 기준, MonthlyDailyFortune는 1900/1/1+10 오프셋 → 서로 다른 일진 산출
- **추가 발견**: JavaScript Date 시간대 문제 (1900년 KST=UTC+08:27:52 vs 현대 KST=UTC+09:00)로 Date 산술 자체가 불안정
- **해결**: Julian Day Number(JDN) 기반 계산으로 변경 (시간대 독립적)
  - `getJulianDayNumber()` 함수 추가
  - `JDN_GANJI_OFFSET = 4` (검증: 2026-02-07 = 임자(壬子) = index 48)
- **수정 파일**: `SajuCalculator.ts`, `MonthlyDailyFortune.ts`

#### 버그 #5: useTodayFortune 해시 부호 없는 변환
- **해결**: `getHash()` 반환값에 `>>> 0` (unsigned right shift) 적용
- **수정 파일**: `useTodayFortune.ts`

#### 버그 #2: toISOString UTC 날짜 밀림
- **원인**: `toISOString()`은 UTC 기준 → KST 자정~09시에 날짜 하루 전으로 밀림
- **해결**: `formatLocalDate()` 함수로 대체 (getFullYear/getMonth/getDate 사용)
- **수정 파일**: `CompatibilityInputScreen.tsx`, `SavedPeopleScreen.tsx`, `useTodayFortune.ts`

#### 버그 #1: 음력 입력 무시
- **원인**: calendar='lunar' 선택해도 날짜 그대로 양력으로 사주 계산
- **해결**: `KasiService.lunarToSolar()` 호출하여 양력 변환 후 사주 계산
- **수정 파일**: `CompatibilityInputScreen.tsx`, `SavedPeopleScreen.tsx`

#### 버그 #3: LUNAR_API_URL 미정의 (미수정)
- `getGanjiInfo` 함수에서만 사용, 음력→양력 변환(`lunarToSolar`)은 `KASI_PROXY_URL` 사용하여 정상 동작
- 우선순위 낮음, 추후 수정 예정

---

**수정자**: Claude Opus 4.6
**수정일**: 2026-02-07

---

## 📋 2026-02-18: 한자 제거 + 대화체 전환 + 웹 테스트베드 재구축

### 완료 작업

| 작업 | 대상 파일 | 내용 |
|------|----------|------|
| 한자 제거 | `sajuInterpretations.ts`, `SajuInterpreter.ts`, `FortuneTypeScreen.tsx`, `AdvancedAnalysisScreen.tsx`, `SajuScreen.tsx`, `FortuneTypes.ts` | 모든 한자(甲乙丙丁 등)를 한글로 대체 |
| ~해요 대화체 전환 | 동일 파일 | 전문 용어를 일상 한국어로, 종결어미를 ~해요 대화체로 변경 |
| 웹 테스트베드 재구축 | `web-test/index.html` | 앱과 동일 구조로 전면 재작성 (하단 탭, 운세 3탭, 사주 8섹션, 접이식 패널) |

### 변경 상세

**한자→한글 변환 예시:**
- 甲木 → 갑목, 乙木 → 을목
- 比肩 → 비견, 食神 → 식신
- 木 → 나무, 火 → 불, 土 → 흙, 金 → 금속, 水 → 물

**~해요 대화체 예시:**
- "갑목은 큰 나무의 기운입니다" → "갑목은 큰 나무의 기운이에요"
- "용신은 목(木)입니다" → "도움이 되는 기운은 나무(목)예요"
- "신강한 사주입니다" → "에너지가 강한 편이에요"

**웹 테스트베드 (`web-test/index.html`):**
- 하단 탭바: "오늘의 운세" / "내 사주"
- 운세 화면: 날짜 네비게이터 + 3탭 (요약/상세/행운)
- 사주 화면: 8섹션 수평 스크롤 내비 + 접이식 패널
- 앱과 동일한 색상 테마 (primary=#8B4B8B, background=#FFFEF5)

---

# 📋 사주투데이 앱 분석 및 개선 기획안

> 작성일: 2026-02-18
> 작성자: Roo (Kimi)
> 목적: 앱 전체 분석 및 보완/개선/추가 기획

---

## 🔴 Critical - 즉시 수정 필요

### 1. API 키 클라이언트 노출 (보안 취약점)
| 항목 | 내용 |
|------|------|
| **위치** | `src/services/KasiService.ts:14` |
| **문제** | `EXPO_PUBLIC_KASI_API_KEY`가 클라이언트에 노출됨 |
| **영향** | 앱 역분석 시 API 키 탈취 가능, 과다 호출/비용 폭탄 위험 |
| **해결 방안** | 1. 백엔드 프록시 서버 구축<br>2. API 키 서버사이드 관리<br>3. 호출량 제한 및 캐싱 로직 추가 |
| **우선순위** | P0 |
| **예상 소요** | 1-2주 |

### ~~2. 자시(子時) 경계 처리 버그~~ ❌ 오류 아님 (2026-02-01 Opus 4.6 검증 완료)
| 항목 | 내용 |
|------|------|
| **위치** | `src/services/SajuCalculator.ts:196-228` |
| **검증 결과** | 현재 **조자시(早子時) 방식** 정상 구현됨 |
| **설명** | 한국에서는 조자시가 표준. 23:00~23:59 → 다음날 자시, 00:00~00:59 → 당일 자시로 처리하는 것이 정상 |
| **판정** | **버그 아님** — Roo 분석 오류 |
| **참고** | PROGRESS.md 796-804줄 검증 기록 참조 |

### 3. 입춘/절기 계산 부정확
| 항목 | 내용 |
|------|------|
| **위치** | `src/services/SajuCalculator.ts:96-115` |
| **문제** | 고정된 날짜(2월 4일) 사용, 매년 변동하는 입춘 미반영 |
| **영향** | 입춘 전후 생일자의 년주/월주 오계산 (예: 2025년 입춘=2월 3일) |
| **해결 방안** | KASI API 절기 정보 연동 또는 정확한 절기 테이블 구축 |
| **우선순위** | P1 |
| **예상 소요** | 3-5일 |

---

## 🟠 고도화 - 기능 개선 (사주탭)

### Phase 1: 핵심 정보 시각화 (2주)

| 기능 | Roo 분석 당시 | 실제 현황 (Opus 검증) | 상태 |
|------|-------------|----------------------|------|
| **일간 강약 분석** | 점수만 표시 | ✅ 게이지 + 5단계 해석 + 조언 구현됨 (`SajuScreen.tsx`) | **구현 완료** |
| **오행 균형** | 4주 표시만 | ✅ 막대그래프 + 비율% + 용신/기신 마커 구현됨 | **구현 완료** |
| **십신 분포** | 4개 기둥 | ✅ 그리드 형태 십신 분포 + 분석 구현됨 | **구현 완료** |
| **대운 흐름** | 텍스트 리스트 | ✅ 타임라인 시각화 + 현재 대운 강조 구현됨 | **구현 완료** |

**상세 UI 스펙**:
```
📊 일간 강약 분석 (65점 - 보통)

[강약 게이지]
약 ◀━━━━━━━●━━━━━━━━━▶ 강
e        65%

[판단 근거]
✓ 월지(인)의 계절 기운이 일간을 도움 (+15점)
✓ 일간 오행(목)이 사주 내에서 강함 (+15점)

[성향 특징]
• 타인의 의견을 잘 수용하며 협력적
• 변화에 유연하게 대응

[조언]
상황에 따라 리더와 팔로워를 오가는 역할을 할 수 있습니다.
```

### Phase 2: 실용적 가이드 추가 (1주)

| 기능 | 설명 | 상태 (Opus 검증) |
|------|------|------------------|
| **용신/기신 생활 가이드** | 색상, 방위, 숫자, 활동 추천 | ✅ **구현 완료** — `SajuScreen.tsx` 용신 섹션에 추천/주의 박스 구현됨 |
| **일간별 맞춤 조언 카드** | 10일간별 특성 기반 조언 | ✅ **구현 완료** — `SajuInterpreter.ts`에 5단계 해석 구현됨 |
| **계절별 운세 변화** | 봄/여름/가을/겨울 운세 팁 | ⏳ 미구현 |

### Phase 3: 고급 분석 기능 (2주)

| 기능 | 설명 | 상태 |
|------|------|------|
| **순행/역행 대운 표시** | 양/음생년별 대운 방향 구분 | 신규 |
| **신살 상세 해석** | 천을귀인, 태귀인 등 상세 설명 | `SinsalCalculator.ts` 확장 |
| **합충형해 분석** | 지지 간 복잡한 관계 분석 | `AdvancedSajuAnalysis.ts` 활용 |

---

## 🔵 리팩토링 - 중복 코드 정리

### 중복 영역 및 통합 계획

| # | 중복 영역 | 위치 | 통합 방안 | 우선순위 |
|---|----------|------|----------|---------|
| 1 | **운세 생성 로직** | `useSajuFortune.ts`, `HomeScreen.tsx` | Hook만 사용하도록 통일 | P1 |
| 2 | **천간→오행 변환** | 3개 파일 | `saju.ts` HEAVENLY_STEMS 활용 | P2 |
| 3 | **지지→오행 변환** | 2개 파일 | `saju.ts` EARTHLY_BRANCHES 활용 | P2 |
| 4 | **십신 계산 로직** | 3개 파일 | `SajuCalculator.ts` 메서드 재사용 | P2 |
| 5 | **연도→간지 계산** | 3개 파일 | 유틸리티 함수 `getYearGanji()` 통일 | P2 |
| 6 | **운세 메시지 데이터** | 5개 파일 | 통합 데이터 파일 `fortuneData.ts` 구축 | P1 |
| 7 | **행운 정보 계산** | 3개 파일 | `constants.ts` 기준 통일 | P2 |

### 통합 데이터 구조 제안
```typescript
// src/data/fortuneData.ts
export const FortuneData = {
  // 오행 매핑 (단일 출처)
  elements: { stems: STEM_TO_ELEMENT, branches: BRANCH_TO_ELEMENT },
  
  // 십신 계산 (단일 로직)
  tenGods: { calculate: calculateTenGodRelation },
  
  // 운세 메시지 (통합)
  messages: {
    daily: DAILY_FORTUNE_MESSAGES,
    category: CATEGORY_FORTUNE_MESSAGES,
    rich: RICH_INTERPRETATIONS,
  },
  
  // 행운 정보 (통합)
  lucky: {
    colors: ELEMENT_COLORS,
    numbers: ELEMENT_NUMBERS,
    directions: ELEMENT_DIRECTIONS,
  }
};
```

---

## 🟡 UX/성능 개선

### 1. 성능 최적화

| 항목 | 현재 | 개선 | 파일 |
|------|------|------|------|
| **사주 계산 캐싱** | 매 렌더링마다 재계산 | `useMemo` + `useCallback` 최적화 | `useSajuFortune.ts` |
| **이미지 최적화** | PNG 사용 | WebP 변환 + 지연 로딩 | `assets/` |
| **번들 사이즈** | 전체 임포트 | 트리쉐이킹 적용 | 전체 |
| **SQLite 쿼리** | 동기 처리 | 비동기 + 인덱싱 | `StorageService.ts` |

### 2. 로딩/에러 상태 개선

| 기능 | 구현 방안 | 예상 효과 |
|------|----------|----------|
| **스켈레톤 UI** | `Skeleton.tsx` 컴포넌트 전면 적용 | 로딩 체감 개선 |
| **재시도 메커니즘** | 네트워크 오류 시 3회 자동 재시도 | 사용자 이탈 감소 |
| **오프라인 모드** | 운세 7일 캐싱 + 오프라인 표시 | 사용성 향상 |
| **에러 바욍더리** | `ErrorBoundary.tsx` 개선 | 크래시 방지 |

### 3. 접근성 개선

| 항목 | 작업 내용 | 우선순위 |
|------|----------|---------|
| **스크린 리더** | `accessibilityLabel` 전면 적용 | P2 |
| **고대비 모드** | 색상 대비 4.5:1 준수 | P3 |
| **폰트 크기** | 시스템 폰트 크기 대응 | P2 |
| **다크모드** | 테마 전환 지원 | P3 |

---

## 🟢 신규 기능 로드맵

### 단기 (1-2개월)

| 기능 | 설명 | 기술 요구사항 | 우선순위 |
|------|------|-------------|---------|
| **홈 화면 위젯** | Android 위젯으로 오늘 운세 표시 | Native Module + WidgetKit | P1 |
| **푸시 알림** | 설정 시간에 운세 알림 | `expo-notifications` 활성화 | P1 |
| **출석 체크(스트릭)** | 연속 접속 보상 시스템 | `NotificationService.ts` 연동 | P2 |
| **운세 공유 카드** | 이미지로 운세 공유 | `react-native-view-shot` 활용 | P2 |

### 중기 (3-6개월)

| 기능 | 설명 | 기술 요구사항 | 우선순위 |
|------|------|-------------|---------|
| **프리미엄 기능** | 상세 해석, 월간 예측 | In-App Purchase 연동 | P2 |
| **AI 챗봇** | Claude 기반 운세 Q&A | API 연동 + 대화 컨텍스트 관리 | P3 |
| **사주 커뮤니티** | 익명 운세 톡방 | Firebase + 실시간 채팅 | P3 |
| **다국어 지원** | 영문, 중문 버전 | i18n 구조 적용 | P3 |
| **가족 그룹 기능 강화** | 가족 사주 비교, 대운 분석 | `FamilyGroup.ts` 확장 | P2 |

### 장기 (6개월+)

| 기능 | 설명 | 비고 |
|------|------|------|
| **백엔드 서버 구축** | API 키 보안, 클라우드 동기화 | 현재 클라이언트 직접 호출 구조 개선 |
| **ML 기반 운세 추천** | 사용자 피드백 기반 개인화 | 데이터 축적 후 도입 |
| **Web 버전 출시** | React Native Web 활용 | 현재 구조에서 확장 가능 |

---

## 🛠️ 기술 부채 정리

### 1. 타입 시스템 강화

| 항목 | 현재 상태 | 목표 | 작업량 |
|------|----------|------|--------|
| **any 타입 제거** | Navigation, SajuScreen 등 | Strict 타입 적용 | 2-3일 |
| **strict 모드** | 비활성화 | 활성화 | 1일 |
| **공통 인터페이스** | 분산되어 있음 | `types/` 패키지화 | 1일 |

### 2. 테스트 커버리지 확대

```
현재: src/__tests__/
├── api.test.ts
├── ErrorLogService.test.ts
├── SajuCalculator.test.ts
└── SecureStorageService.test.ts

추가 필요:
├── components/
│   ├── FortuneCard.test.tsx
│   ├── SajuWheel.test.tsx
│   └── ElementChart.test.tsx
├── screens/
│   ├── SajuScreen.test.tsx
│   └── DailyFortuneScreen.test.tsx
├── services/
│   ├── FortuneGenerator.test.ts
│   ├── CompatibilityService.test.ts
│   └── KasiService.test.ts
└── e2e/
    └── fortune-flow.test.ts (Detox)
```

### 3. 모니터링/분석 연동

| 도구 | 목적 | 연동 위치 |
|------|------|----------|
| **Sentry** | 크래시 리포팅, 에러 추적 | `App.tsx` + `ErrorLogService.ts` |
| **Firebase Analytics** | 사용자 행동 분석 | `AnalyticsService.ts` |
| **Performance Monitoring** | API 응답 시간 측정 | `KasiService.ts` |

---

## 📊 개선 우선순위 종합

```
긴급도 ↑
    │
 P0 │ API노출
    │   ●
    │
 P1 │ 입춘계산   위젯기능   푸시알림   중복정리
    │   ●          ●          ●          ●
    │
 P2 │ 신살강화   출석체크   공유카드   타입정리   성능최적화
    │   ●          ●          ●          ●          ●
    │
 P3 │ AI챗봇    커뮤니티   다국어    다크모드   백엔드
    │   ●         ●          ●          ●          ●
    └────────────────────────────────────────────────→ 영향도
       낮음                                       높음

※ 자시버그(P0) → 오류 아님 (조자시 방식 정상), 오행차트(P1) → 이미 구현 완료
```

---

## 📅 제안 일정

| 단계 | 기간 | 작업 내용 |
|------|------|----------|
| **Phase 0** | 1주 | Critical 버그 수정 (API 보안) ※ 자시 버그는 오류 아님으로 판정 |
| **Phase 1** | - | ~~사주탭 시각화 개선~~ ✅ 이미 구현 완료 (오행차트, 십신차트, 대운 타임라인, 강약 게이지) |
| **Phase 2** | 2주 | 중복 코드 리팩토링 + 타입 정리 |
| **Phase 3** | 2주 | 신규 기능 (위젯, 알림, 출석체크) |
| **Phase 4** | 3주 | 고급 기능 (프리미엄, AI 챗봇) |

**총 예상 기간**: 10주 (2.5개월)

---

## ✅ 체크리스트

### Critical
- [ ] API 키 서버 프록시 구축
- [x] ~~자시(23시) 경계 처리 수정~~ → **오류 아님** (조자시 방식 정상, 2026-02-01 검증)
- [ ] 입춘/절기 동적 계산

### 기능 개선
- [x] 오행 균형 차트 추가 → **구현 완료** (SajuScreen.tsx 막대그래프 + 용신/기신 마커)
- [x] 십신 분포 차트 추가 → **구현 완료** (SajuScreen.tsx 그리드 분포)
- [x] 대운 흐름 시각화 → **구현 완료** (SajuScreen.tsx 타임라인 + 현재 대운 강조)
- [x] 용신 생활 가이드 → **구현 완료** (SajuScreen.tsx 추천/주의 박스)
- [x] 일간별 맞춤 조언 → **구현 완료** (SajuInterpreter.ts 5단계 해석)
- [x] 한자 제거 + ~해요 대화체 전환 → **완료** (2026-02-18)

### 리팩토링
- [ ] 천간/지지 오행 변환 통일
- [ ] 십신 계산 로직 통일
- [ ] 운세 메시지 데이터 통합
- [ ] any 타입 제거

### 신규 기능
- [ ] 홈 화면 위젯
- [ ] 푸시 알림
- [ ] 출석 체크
- [ ] 운세 공유 카드

---

**작성자**: Roo (Kimi)
**작성일**: 2026-02-18
**버전**: 1.0
**검증**: Claude Opus 4.6 (2026-02-18) — 자시 버그(오류 아님), 이미 구현된 기능(오행차트/십신/대운/용신가이드/일간해석) 정정 완료
