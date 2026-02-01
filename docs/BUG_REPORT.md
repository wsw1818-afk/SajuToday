# 사주투데이 버그 리포트

> 코드 분석 기반 버그 및 문제점 정리 (2026-01-31)

---

## 🚨 Critical (심각)

### 1. UTC 날짜 버그 - 오늘 날짜 오인식
**위치**: `src/contexts/AppContext.tsx:92`

```typescript
const today = new Date().toISOString().split('T')[0];
```

**문제**: `toISOString()`은 UTC 기준 날짜를 반환합니다. 한국(UTC+9) 기준으로 **오전 9시 이전**에는 어제 날짜가 반환됩니다.

**영향**: 
- 오전 9시 전 앱 실행 시 "어제" 운세를 보여줌
- 히스토리 저장/조회 날짜가 하루씩 밀림
- 운세 알림 시간도 UTC 기준으로 작동

**해결책**:
```typescript
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const dateStr = `${year}-${month}-${day}`;
```

---

### 2. 음력/양력 데이터 불일치
**위치**: `src/screens/OnboardingScreen.tsx:253`

```typescript
const profile: UserProfile = {
  birthDate: birthDateText, // 원래 입력값 (음력일 수 있음)
  // ...
};

// 사주 계산은 양력으로 변환된 값 사용
const result = calculateSaju(solarBirthDate, timeStr);
```

**문제**: 
- 프로필에는 음력 날짜가 저장됨
- 사주 계산은 양력 날짜로 함
- 나중에 프로필을 불러와 재계산 시 음력을 양력으로 잘못 인식

**영향**: 
- 앱 재시작 후 사주 결과가 달라짐
- 저장된 사람(궁합용)의 사주도 잘못 계산될 수 있음

**해결책**: 프로필 저장 시 양력 변환 값을 별도 필드에 저장하거나, 항상 양력으로 통일

---

## ⚠️ High (높음)

### 3. 입춘(立春) 경계 처리 부정확
**위치**: `src/services/SajuCalculator.ts:96-115`

```typescript
private calculateYearPillar(): Pillar {
  // 입춘(약 2월 4일) 이전이면 전년도
  if (month === 1 || (month === 2 && day < 4)) {
    year -= 1;
  }
```

**문제**: 입춘은 매년 **2월 3일, 4일, 또는 5일**로 변동됩니다. 고정된 2월 4일은 부정확합니다.

**예시**: 2024년 입춘은 2월 4일, 2025년은 2월 3일, 2026년은 2월 4일

**영향**: 
- 입춘 전후 생일자의 년주가 잘못 계산됨
- 간지가 1년씩 밀림

**해결책**: KASI API에서 절기 정보를 받아와 동적으로 처리

---

### 4. 월주 절기 계산 부정확
**위치**: `src/services/SajuCalculator.ts:146-173`

```typescript
const solarTermDays: Record<number, number> = {
  1: 6,   // 소한 (실제로는 매년 변동)
  2: 4,   // 입춘
  // ...
};
```

**문제**: 절기는 천문 현상 기준이며 매년 날짜가 미세하게 변동됩니다. 고정값은 부정확합니다.

**영향**: 
- 절기 경계일(입춘, 경칩 등) 생일자의 월주가 잘못 계산될 수 있음
- 최대 ±1일 오차

**해결책**: KASI API 연동 또는 정확한 절기 테이블 사용

---

### 5. 자시(子時) 경계 처리 버그
**위치**: `src/services/SajuCalculator.ts:196-228`

```typescript
if (hours >= 23) {
  totalMinutes = (hours - 23) * 60 + minutes; // 23시를 0분으로 계산
}
```

**문제**: 
- 23:00-23:59는 "다음 날"의 자시(子時)입니다
- 현재 로직은 같은 날 자시로 계산하여 일주 계산과 불일치

**예시**: 1월 15일 23:30생 → 일주는 1월 16일 기준으로 계산되어야 함

**영향**: 
- 23:00-23:59생 사용자의 일주가 하루 밀림
- 시주도 잘못 계산됨

**해결책**:
```typescript
// 23:00-23:59는 다음 날로 처리
if (hours >= 23) {
  // 일주 계산 시 하루 더하기
  this.birthDate.setDate(this.birthDate.getDate() + 1);
}
```

---

### 6. API 키 클라이언트 노출 (보안)
**위치**: 
- `src/services/KasiService.ts:14`
- 운세 생성 API (Claude)

```typescript
const API_KEY = process.env.EXPO_PUBLIC_KASI_API_KEY || '';
```

**문제**: React Native의 `EXPO_PUBLIC_*` 환경변수는 클라이언트에 노출됩니다.

**영향**: 
- 앱 바이너리 추출로 API 키 탈취 가능
- KASI API 악용 (과다 호출)
- Claude API 키 탈취 시 비용 폭탄

**해결책**: 
- 프록시 서버 구축 (Cloudflare Workers, AWS Lambda)
- API 키는 서버에만 저장

---

## ⚠️ Medium (중간)

### 7. useMemo 의존성 누락
**위치**: `src/screens/HomeScreen.tsx:104-107`

```typescript
const fortune = useMemo(() =>
  generateFortune(sajuResult, selectedDate),
  [sajuResult, selectedDateTimestamp]  // selectedDateTimestamp만 의존성으로 있음
);
```

**문제**: `selectedDateTimestamp`는 `selectedDate.getTime()`의 결과로, 실제로는 `selectedDate`가 변경될 때마다 새로 계산됩니다. 하지만 ESLint 경고가 무시되고 있을 수 있습니다.

**확인 필요**: 다른 useMemo 훅들도 의존성 배열 검증 필요

---

### 8. 잘못된 음력 날짜 표시
**위치**: `src/utils/dateFormatter.ts:45-52`

```typescript
export function formatLunarFromISO(isoDate: string): string {
  const parts = isoDate.split('-');
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  return `음력 ${month}월 ${day}일`; // 실제 음력 변환이 아님!
}
```

**문제**: 단순히 양력 월/일을 "음력"이라고 표시하고 있습니다. 실제 음력 변환이 아닙니다.

**영향**: 사용자에게 잘못된 정보 제공

**해결책**: KASI API로 실제 음력 변환 수행

---

### 9. 네비게이션 파라미터 타입 불일치
**위치**: `src/screens/HomeScreen.tsx:641-646`

```typescript
navigation.navigate('DatePicker', {
  selectedDate: selectedDate.toISOString(),
  onSelectDate: (dateStr: string) => { // 함수를 파라미터로 전달
    setSelectedDate(new Date(dateStr));
  },
});
```

**문제**: React Navigation에서 함수를 파라미터로 전달하면:
- 화면이 언마운트되면 함수 참조가 무효화됨
- 메모리 누수 가능성
- iOS/Android 간 동작 불일치

**해결책**: 콜백 패턴 대신 이벤트/상태 관리 사용

---

### 10. SQLite any 타입 사용
**위치**: `src/services/StorageService.ts:44`

```typescript
private static db: any = null; // SQLite.SQLiteDatabase | null
```

**문제**: 타입 안전성 상실, 런타임 에러 위험

**해결책**: 정확한 타입 정의 필요

---

## 📝 Low (낮음)

### 11. 메모리 누수 가능성 - NetInfo 리스너
**위치**: `src/services/KasiService.ts:71-84`

**문제**: `initNetworkListener`는 싱글톤 패턴이지만, 앱 재시작 시 구독 해제가 제대로 되지 않을 수 있음

**해결책**: 앱 라이프사이클에 맞춰 명확히 구독 해제

---

### 12. 안티패턴 - 타입 강제 변환
**위치**: `src/services/SajuCalculator.ts:423-424`

```typescript
const calculator = new SajuCalculator('2000-01-01', null);
return (calculator as any).getTenGod(dayMasterStem, todayStem);
```

**문제**: `private` 메서드를 `as any`로 강제 호출

**해결책**: `getTenGod`을 `public`으로 변경하거나 별도 유틸리티 함수 생성

---

### 13. 중복 계산
**위치**: `src/screens/HomeScreen.tsx:94-98`

```typescript
const sajuResult = useMemo(() => {
  if (!profile) return null;
  const calculator = new SajuCalculator(profile.birthDate, profile.birthTime);
  return calculator.calculate();
}, [profile?.birthDate, profile?.birthTime]);
```

**문제**: 
- 온보딩 시 이미 계산된 사주를 다시 계산
- profile에 사주 결과가 저장되어 있음에도 불필요한 재계산

**최적화**: 저장된 `sajuResult`를 먼저 확인 후 없을 때만 계산

---

## 🔒 보안 이슈

### 14. 안전하지 않은 랜덤 ID 생성
**위치**: `src/screens/OnboardingScreen.tsx:24-30`

```typescript
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    // ...
  });
}
```

**문제**: `Math.random()`은 암호학적으로 안전하지 않음

**해결책**: `crypto.getRandomValues()` 사용 또는 uuid 라이브러리

---

### 15. XSS 가능성
**위치**: 여러 컴포넌트의 dangerouslySetInnerHTML 사용 여부 확인 필요

**확인 필요**: 운세 내용에 HTML이 포함될 경우 sanitize 필요

---

## 🧪 테스트 필요

### 16. 음력 윤달 처리 미검증
**위치**: `src/screens/OnboardingScreen.tsx:230-246`

```typescript
if (calendar === 'lunar' && birthYear && birthMonth && birthDay) {
  const solarDate = await KasiService.lunarToSolar(
    birthYear,
    birthMonth,
    birthDay,
    isLeapMonth
  );
```

**확인 필요**: 
- 윤달 4월 vs 평달 4월 구분이 정확히 되는지
- KASI API 응답 실패 시 폴백 동작

---

### 17. 오프라인 모드 불완전
**위치**: `src/services/KasiService.ts`

**문제**: 
- KASI API 실패 시 로컬 계산으로 폴백
- 하지만 로컬 계산도 입력값(음력/양력)에 의존
- 음력→양력 변환 실패 시 계산 불가

**개선**: 음력→양력 변환표 로컬 캐싱

---

## 📊 성능 이슈

### 18. 과도한 useMemo 사용
**위치**: `src/screens/HomeScreen.tsx`

**문제**: 20개 이상의 useMemo 훅 사용

**영향**: 메모리 사용량 증가, 코드 복잡성 증가

**권장**: 필요한 경우에만 사용, React Compiler 마이그레이션 검토

---

## ✅ 버그 수정 우선순위

| 우선순위 | 버그 | 영향 | 예상 소요 |
|---------|------|------|----------|
| **P0** | UTC 날짜 버그 | 모든 사용자, 매일 발생 | 30분 |
| **P0** | 음력/양력 불일치 | 음력 생일 사용자 | 2시간 |
| **P1** | 입춘 경계 처리 | 2월 생일 사용자 | 4시간 |
| **P1** | 자시(23시) 처리 | 23시생 사용자 | 2시간 |
| **P1** | API 키 노출 | 보안 리스크 | 1일 |
| **P2** | 절기 계산 | 절기 경계 생일자 | 4시간 |
| **P2** | 잘못된 음력 표시 | 모든 사용자 | 2시간 |
| **P3** | 기타 최적화 | 성능 | 지속 |

---

## 🛠️ 즉시 수정 권장 코드

### 1. UTC 날짜 버그 수정 (AppContext.tsx)
```typescript
// 변경 전
const today = new Date().toISOString().split('T')[0];

// 변경 후
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
```

### 2. 자시 처리 수정 (SajuCalculator.ts)
```typescript
// calculateDayPillar에서 23시 이후는 다음 날로 처리
private calculateDayPillar(): Pillar {
  let targetDate = this.birthDate;
  
  // 23:00-23:59는 다음 날로 처리
  if (this.birthTime) {
    const [hours] = this.birthTime.split(':').map(Number);
    if (hours >= 23) {
      targetDate = new Date(this.birthDate);
      targetDate.setDate(targetDate.getDate() + 1);
    }
  }
  
  const diffTime = targetDate.getTime() - BASE_DATE.getTime();
  // ... 나머지 계산
}
```

### 3. 프로필 저장 수정 (OnboardingScreen.tsx)
```typescript
const profile: UserProfile = {
  // ...
  birthDate: solarBirthDate, // 항상 양력으로 저장
  calendar, // 원래 달력 정보는 별도 필드로 유지
  // ...
};
```

---

**작성일**: 2026-01-31  
**검토 필요**: 개발팀, QA팀
