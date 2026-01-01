# SajuToday API 명세서

## 1. 외부 API

### 1.1 KASI 음양력 정보 API

**기본 정보**
- Base URL: `http://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService`
- 인증: ServiceKey (Query Parameter)
- 응답 형식: XML (앱에서 JSON 변환)

**엔드포인트**

#### 1.1.1 양력→음력 변환
```
GET /getLunCalInfo
```

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| ServiceKey | String | O | API 키 (URL 인코딩) |
| solYear | String | O | 양력 연도 (YYYY) |
| solMonth | String | O | 양력 월 (MM) |
| solDay | String | O | 양력 일 (DD) |

**응답 예시**
```xml
<response>
  <body>
    <items>
      <item>
        <lunYear>2024</lunYear>
        <lunMonth>11</lunMonth>
        <lunDay>29</lunDay>
        <lunLeapmonth>평</lunLeapmonth>
        <lunSecha>갑진</lunSecha>
        <lunWolgeon>병자</lunWolgeon>
        <lunIljin>기묘</lunIljin>
      </item>
    </items>
  </body>
</response>
```

#### 1.1.2 음력→양력 변환
```
GET /getSolCalInfo
```

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| ServiceKey | String | O | API 키 |
| lunYear | String | O | 음력 연도 (YYYY) |
| lunMonth | String | O | 음력 월 (MM) |
| lunDay | String | O | 음력 일 (DD) |
| leapMonth | String | X | 윤달 여부 (leap/normal) |

---

### 1.2 KASI 특일 정보 API

**기본 정보**
- Base URL: `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService`

**엔드포인트**

#### 1.2.1 24절기 조회
```
GET /get24DivisionsInfo
```

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| ServiceKey | String | O | API 키 |
| solYear | String | O | 연도 (YYYY) |
| solMonth | String | X | 월 (MM) |

#### 1.2.2 공휴일 조회
```
GET /getRestDeInfo
```

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| ServiceKey | String | O | API 키 |
| solYear | String | O | 연도 (YYYY) |
| solMonth | String | X | 월 (MM) |

---

### 1.3 Claude API (운세 생성)

**기본 정보**
- Base URL: `https://api.anthropic.com/v1`
- 인증: x-api-key Header
- 모델: claude-3-haiku (비용 효율)

#### 1.3.1 운세 생성 요청
```
POST /messages
```

**Headers**
```
x-api-key: {API_KEY}
anthropic-version: 2023-06-01
content-type: application/json
```

**Request Body**
```json
{
  "model": "claude-3-haiku-20240307",
  "max_tokens": 1024,
  "system": "시스템 프롬프트 (별도 문서 참조)",
  "messages": [
    {
      "role": "user",
      "content": "사주/오늘 정보 JSON"
    }
  ]
}
```

---

## 2. 앱 내부 데이터 구조

### 2.1 AsyncStorage 스키마

#### 2.1.1 사용자 프로필
```typescript
// Key: @saju_profile
interface UserProfile {
  id: string;                    // UUID
  birthDate: string;             // YYYY-MM-DD
  birthTime: string | null;      // HH:mm 또는 null
  calendar: 'solar' | 'lunar';
  isLeapMonth: boolean;
  gender: 'male' | 'female' | null;
  timezone: string;              // 기본 Asia/Seoul
  createdAt: string;             // ISO 8601
  updatedAt: string;
}
```

#### 2.1.2 사주 계산 결과
```typescript
// Key: @saju_result
interface SajuResult {
  userId: string;
  pillars: {
    year: { stem: string; branch: string };
    month: { stem: string; branch: string };
    day: { stem: string; branch: string };
    hour: { stem: string; branch: string } | null;
  };
  elements: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  yinYang: {
    yin: number;
    yang: number;
  };
  dayMaster: string;             // 일간
  tenGods: {
    year: string;
    month: string;
    hour: string | null;
  };
  relations: {
    clashes: string[];           // 충
    combines: string[];          // 합
  };
  computedAt: string;
}
```

#### 2.1.3 설정
```typescript
// Key: @saju_settings
interface Settings {
  tone: 'friendly' | 'calm' | 'funny' | 'serious';
  length: 'short' | 'medium' | 'long';
  notificationEnabled: boolean;
  notificationTime: string;      // HH:mm
}
```

### 2.2 SQLite 스키마 (운세 히스토리)

```sql
CREATE TABLE IF NOT EXISTS fortune_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,     -- YYYY-MM-DD
  fortune_json TEXT NOT NULL,    -- 운세 결과 JSON
  created_at TEXT NOT NULL,      -- ISO 8601

  -- 인덱스
  INDEX idx_date (date)
);

-- 30일 초과 데이터 자동 삭제 (앱 시작 시 실행)
DELETE FROM fortune_history
WHERE date < date('now', '-30 days');
```

---

## 3. 내부 서비스 인터페이스

### 3.1 SajuCalculator

```typescript
interface SajuCalculatorInput {
  birthDate: string;             // YYYY-MM-DD (양력 변환 후)
  birthTime: string | null;      // HH:mm
}

interface SajuCalculatorOutput {
  pillars: Pillars;
  elements: Elements;
  yinYang: YinYang;
  dayMaster: string;
  tenGods: TenGods;
  relations: Relations;
}

// 메서드
function calculateSaju(input: SajuCalculatorInput): SajuCalculatorOutput;
function getPillar(date: Date, type: 'year' | 'month' | 'day' | 'hour'): Pillar;
function getElements(pillars: Pillars): Elements;
function getTenGods(dayMaster: string, pillars: Pillars): TenGods;
```

### 3.2 KasiService

```typescript
interface LunarInfo {
  lunYear: number;
  lunMonth: number;
  lunDay: number;
  isLeapMonth: boolean;
  yearGanji: string;             // 세차 (년간지)
  monthGanji: string;            // 월건
  dayGanji: string;              // 일진
}

interface TodayInfo {
  date: string;
  ganji: { stem: string; branch: string };
  solarTerm: string | null;      // 오늘의 절기
  specialDays: string[];         // 공휴일/기념일
}

// 메서드
async function solarToLunar(date: string): Promise<LunarInfo>;
async function lunarToSolar(date: string, isLeap: boolean): Promise<string>;
async function getTodayInfo(date: string): Promise<TodayInfo>;
```

### 3.3 FortuneGenerator

```typescript
interface FortuneInput {
  user: UserProfile;
  saju: SajuResult;
  today: TodayInfo;
  settings: Settings;
}

interface FortuneOutput {
  summary: string;
  keywords: [string, string, string];
  scores: {
    overall: number;
    money: number;
    work: number;
    love: number;
    health: number;
  };
  cards: {
    overall: string[];
    money: string[];
    work: string[];
    love: string[];
    health: string[];
  };
  do: string;
  dont: string;
  disclaimer: string;
}

// 메서드
async function generateFortune(input: FortuneInput): Promise<FortuneOutput>;
```

---

## 4. 에러 처리

### 4.1 에러 코드

| 코드 | 설명 | 처리 |
|------|------|------|
| KASI_NETWORK_ERROR | KASI API 네트워크 에러 | 캐시 사용 / 재시도 |
| KASI_INVALID_DATE | 잘못된 날짜 형식 | 입력 검증 에러 표시 |
| CLAUDE_NETWORK_ERROR | Claude API 네트워크 에러 | 기본 운세 표시 |
| CLAUDE_RATE_LIMIT | API 호출 제한 초과 | 잠시 후 재시도 안내 |
| STORAGE_ERROR | 로컬 저장 실패 | 재시도 / 앱 재시작 안내 |

### 4.2 폴백 전략

1. **KASI API 실패 시**
   - 로컬 캐시에서 최근 데이터 사용
   - 캐시도 없으면 기본 간지 계산 로직 사용

2. **Claude API 실패 시**
   - 미리 준비된 기본 운세 문구 표시
   - "운세 생성 중 문제가 발생했습니다" 안내

3. **오프라인 상태**
   - 저장된 프로필/히스토리만 표시
   - 새 운세 생성 불가 안내

---

## 5. 캐싱 전략

### 5.1 KASI API 캐시
- **음양력 변환**: 영구 캐시 (날짜는 변하지 않음)
- **절기 정보**: 연간 캐시 (1년에 1회 갱신)
- **공휴일**: 연간 캐시

### 5.2 운세 캐시
- **오늘 운세**: 하루 캐시 (자정 갱신)
- **히스토리**: SQLite 영구 저장 (30일 제한)

### 5.3 캐시 키 형식
```
kasi_lunar_{YYYY}_{MM}_{DD}
kasi_solar_term_{YYYY}
kasi_holiday_{YYYY}_{MM}
fortune_{YYYY}_{MM}_{DD}
```
