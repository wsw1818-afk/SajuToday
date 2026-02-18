# ARCHIVE_2026_02.md - 2026년 2월 작업 아카이브

> PROGRESS.md에서 이동된 과거 작업 로그

---

## 📋 2026-02-01: FortuneMenu 중복 기능 제거 및 릴리즈 빌드

### 변경 내용

**FortuneMenuScreen.tsx** - 날짜 선택 기능 완전 제거
- Daily 탭과 중복되는 날짜 선택 기능 제거
- "날짜 지정 운세" 메뉴 항목 삭제
- 관련 상태 변수 및 함수 삭제 (`selectedDate`, `goToPrevDay`, `goToNextDay`, `goToToday`)
- 사용하지 않는 import 정리 (`useMemo`, `useCallback`, `useRoute`, `useFocusEffect`)
- 관련 스타일 삭제 (`dateNavigator`, `dateArrowBtn`, `dateArrowText`, `dateSelector`, `dateLabelText`, `dateValueText`, `todayBtn`, `todayBtnText`)

### 빌드 과정

1. **첫 번째 빌드 시도**: JavaScript 번들이 캐시되어 변경사항 미반영
2. **캐시 정리 및 클린 빌드**:
   ```bash
   # 캐시 삭제
   powershell -Command "Remove-Item -Recurse -Force '.expo','node_modules\.cache','android\app\build','android\.gradle' -ErrorAction SilentlyContinue"

   # 클린 릴리즈 빌드
   cd android && .\gradlew.bat clean assembleRelease && cd ..
   ```
3. **결과**: 변경사항 정상 반영 확인

### 배포

- **파일명**: SajuToday-release.apk
- **크기**: 117MB
- **경로**: `D:\OneDrive\코드작업\결과물\SajuToday-release.apk`

### 배운 점

- Release APK 빌드 시 JavaScript 번들 캐시 문제 주의
- 4가지 캐시 폴더 모두 삭제 필요: `.expo`, `node_modules/.cache`, `android/app/build`, `android/.gradle`
- `gradlew clean assembleRelease` 사용으로 완전한 클린 빌드 수행

---

## 📋 2026-02-02: 버그 리포트 검증 및 SajuScreen 탭 스타일 개선

### 버그 리포트 검증 결과

| 버그 항목 | 리포트 내용 | 검증 결과 | 조치 |
|----------|------------|----------|------|
| Navigation.tsx 테마 색상 | COLORS.white/border 없음 | ✅ theme.ts에 정상 정의됨 | 오류 아님으로 수정 |
| SajuCalculator 자시 처리 | 00:00-00:59 누락 | ✅ 조자시 방식 정상 구현 | 오류 아님으로 수정 |
| ThemeContext 깜빡임 | 🟠 High | SplashScreen이 커버 | 🟢 Low로 하향 |

### SajuScreen 상단 탭 스타일 개선

**파일**: `src/screens/SajuScreen.tsx`

| 항목 | 이전 | 개선 후 |
|------|------|---------|
| 탭 패딩 | 8px | 10px |
| 테두리 | 없음 | 1px 테두리 추가 |
| 활성 탭 그림자 | 없음 | 그림자 효과 추가 |
| 하단 구분선 | 1px | 2px |
| 활성 탭 폰트 | 600 | 700 (더 굵게) |
| 배경색 | #F5F5F5 | #F3F4F6 |

### 배포

- **파일명**: SajuToday-release.apk
- **경로**: `D:\OneDrive\코드작업\결과물\SajuToday-release.apk`
- **설치**: ADB 무선 연결로 핸드폰 설치 완료
