# 사주투데이 배포 가이드

## 📋 목차
1. [사전 준비](#사전-준비)
2. [로컬 빌드](#로컬-빌드)
3. [EAS Build](#eas-build)
4. [Google Play Store 배포](#google-play-store-배포)
5. [Apple App Store 배포](#apple-app-store-배포)
6. [환경 변수 설정](#환경-변수-설정)
7. [CI/CD 설정](#cicd-설정)
8. [문제 해결](#문제-해결)

---

## 사전 준비

### 필수 도구
```bash
# Node.js 20+
node -v

# EAS CLI
npm install -g eas-cli

# Expo CLI
npm install -g expo-cli
```

### Expo 로그인
```bash
eas login
```

### 프로젝트 설정 확인
```bash
# app.json 확인
cat app.json

# eas.json 확인
cat eas.json
```

---

## 로컬 빌드

### Android APK (개발용)
```bash
# Expo Dev Client 빌드
npx expo prebuild --clean
cd android
./gradlew assembleDebug
```

### Android AAB (배포용)
```bash
cd android
./gradlew bundleRelease
```

### 결과물 위치
- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release AAB: `android/app/build/outputs/bundle/release/app-release.aab`

---

## EAS Build

### 개발 빌드 (Development Client)
```bash
eas build --platform android --profile development
```

### 프리뷰 빌드 (내부 테스트용)
```bash
eas build --platform android --profile preview
```

### 프로덕션 빌드 (스토어 배포용)
```bash
eas build --platform android --profile production
```

### 빌드 상태 확인
```bash
eas build:list
```

---

## Google Play Store 배포

### 1. Google Play Console 설정
1. [Google Play Console](https://play.google.com/console) 접속
2. 새 앱 만들기 → Android 앱 선택
3. 앱 정보 입력:
   - 앱 이름: 사주투데이
   - 기본 언어: 한국어
   - 앱/게임: 앱
   - 무료/유료: 무료

### 2. 스토어 등록 정보
- **앱 아이콘**: 512x512 PNG
- **그래픽 이미지**: 1024x500 PNG
- **스크린샷**: 최소 2장 (폰 크기)
- **짧은 설명** (80자):
  ```
  나만의 사주로 보는 오늘의 운세! 정확한 만세력 기반 운세 앱
  ```
- **전체 설명** (4000자):
  ```
  🔮 사주투데이 - 당신만의 운명을 읽다

  사주투데이는 정확한 만세력 데이터를 기반으로 한 프리미엄 운세 앱입니다.

  ✨ 주요 기능
  • 오늘의 운세: 일간과 일진의 조합으로 매일 새로운 운세 제공
  • 고급 사주 분석: 지장간, 삼합, 용신/기신 분석
  • 궁합 보기: 연인, 친구, 가족과의 궁합 확인
  • 대운/세운: 10년, 1년 단위의 운세 흐름
  • 길일/흉일: 중요한 일정을 위한 날짜 추천

  📱 특징
  • 100% 무료, 광고 없음
  • 오프라인 지원
  • 깔끔하고 직관적인 UI
  • 다크 모드 지원
  ```

### 3. 앱 콘텐츠 설정
- **개인정보처리방침 URL**: 필수
- **앱 액세스 권한**: 특별한 액세스 없음
- **광고**: 광고 미포함 (또는 포함 시 AdMob 설정)
- **콘텐츠 등급**: 설문 완료 후 등급 받기

### 4. 앱 릴리스
```bash
# EAS Submit으로 자동 제출
eas submit --platform android --latest

# 또는 수동 업로드
# Play Console → 프로덕션 → 새 릴리스 만들기 → AAB 업로드
```

### 5. 심사 요청
- 릴리스 검토 → 프로덕션에 출시 시작

---

## Apple App Store 배포

### 1. Apple Developer 계정 설정
1. [Apple Developer Program](https://developer.apple.com/programs/) 가입 ($99/년)
2. App Store Connect에서 앱 등록

### 2. iOS 빌드
```bash
eas build --platform ios --profile production
```

### 3. App Store Connect 제출
```bash
eas submit --platform ios --latest
```

---

## 환경 변수 설정

### 로컬 개발 (.env)
```env
EXPO_PUBLIC_KASI_API_KEY=your_kasi_api_key
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
EXPO_PUBLIC_ANALYTICS_ENABLED=false
EXPO_PUBLIC_API_ENV=development
```

### EAS 빌드 (eas.json)
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_ENV": "production",
        "EXPO_PUBLIC_ANALYTICS_ENABLED": "true"
      }
    }
  }
}
```

### GitHub Secrets (CI/CD)
- `EXPO_TOKEN`: EAS 인증 토큰
- `KASI_API_KEY`: KASI API 키 (API 프록시 서버용)

---

## CI/CD 설정

### GitHub Actions 워크플로우
`.github/workflows/eas-build.yml` 참고

### 자동 빌드 트리거
- `main` 브랜치 푸시 → preview 빌드
- `v*` 태그 푸시 → production 빌드 + 스토어 제출

### 수동 빌드
GitHub Actions → Run workflow → 플랫폼/프로필 선택

---

## 문제 해결

### 빌드 실패
```bash
# 캐시 정리
npm cache clean --force
rm -rf node_modules
npm install

# Expo 캐시 정리
expo r -c
```

### 서명 키 문제
```bash
# 키스토어 확인
eas credentials --platform android
```

### 버전 충돌
```bash
# 버전 동기화
eas build:version:sync --platform android
```

---

## 체크리스트

### 배포 전 확인사항
- [ ] 앱 버전 업데이트 (app.json)
- [ ] CHANGELOG 작성
- [ ] 환경 변수 확인
- [ ] 테스트 완료
- [ ] 스크린샷 최신화
- [ ] 개인정보처리방침 확인

### 배포 후 확인사항
- [ ] 스토어에서 설치 테스트
- [ ] 크래시 리포트 모니터링
- [ ] 사용자 피드백 확인

---

## 연락처

문제 발생 시:
- GitHub Issues: https://github.com/your-repo/sajutoday/issues
- 이메일: support@sajutoday.com
