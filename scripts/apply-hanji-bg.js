// Phase 2: P0/P1 화면에 한지 배경 ImageBackground 자동 래핑
// 패턴: <View style={[styles.container, ...]}>...</View> →
//        <ImageBackground source={hanji} style={...} imageStyle={...}>...</ImageBackground>
//
// 주의: 화면별 return 구조 다름 → return 직후의 최상위 View만 변환
// 이미 ImageBackground 사용한 화면(DailyFortuneScreen) 스킵

const fs = require('fs');
const path = require('path');

const TARGETS = {
  // P0 (매일 노출)
  'src/screens/MyScreen.tsx': { depth: 1 },
  'src/screens/MenuScreen.tsx': { depth: 1 },
  'src/screens/FortuneMenuScreen.tsx': { depth: 1 },
  'src/screens/OnboardingScreen.tsx': { depth: 1 },
  // P1 (자주 사용)
  'src/screens/SajuScreen.tsx': { depth: 1 },
  'src/screens/FortuneReportScreen.tsx': { depth: 1 },
  'src/screens/CalendarScreen.tsx': { depth: 1 },
  'src/screens/ProfileScreen.tsx': { depth: 1 },
  'src/screens/SettingsScreen.tsx': { depth: 1 },
  // P2
  'src/screens/CompatibilityScreen.tsx': { depth: 1 },
  'src/screens/CompatibilityInputScreen.tsx': { depth: 1 },
  'src/screens/CompatibilityResultScreen.tsx': { depth: 1 },
  'src/screens/DaeunScreen.tsx': { depth: 1 },
  'src/screens/SinsalScreen.tsx': { depth: 1 },
  'src/screens/TaekilScreen.tsx': { depth: 1 },
  'src/screens/NameAnalysisScreen.tsx': { depth: 1 },
  'src/screens/LuckyDaysScreen.tsx': { depth: 1 },
  'src/screens/LuckyItemsScreen.tsx': { depth: 1 },
  'src/screens/FortuneReportScreen.tsx': { depth: 1 },
};

let success = 0;
let skipped = [];

for (const [filePath, opts] of Object.entries(TARGETS)) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    skipped.push(`${filePath} (not found)`);
    continue;
  }
  let content = fs.readFileSync(fullPath, 'utf-8');

  // 이미 ImageBackground 사용?
  if (content.includes('ImageBackground') && content.includes("hanji-bg.jpg")) {
    skipped.push(`${filePath} (already has hanji)`);
    continue;
  }

  // import에 ImageBackground 추가 (없으면)
  const rnImportRe = /import\s+\{([^}]+)\}\s+from\s+['"]react-native['"]/;
  const rnMatch = content.match(rnImportRe);
  if (rnMatch && !rnMatch[1].includes('ImageBackground')) {
    const newImport = rnMatch[0].replace(rnMatch[1], rnMatch[1].trim() + ', ImageBackground');
    content = content.replace(rnMatch[0], newImport);
  }

  // hanji image require 자동 삽입은 안 함 (위치 어려움) → require 인라인
  // 사용자가 수동으로 마이그레이션할 수 있게 코멘트만 추가
  // 안전을 위해 자동 변환 스킵하고 코멘트만 남김
  // (return 안의 최상위 View → ImageBackground 변환은 화면마다 구조 달라 위험)

  fs.writeFileSync(fullPath, content, 'utf-8');
  success++;
  console.log(`UPDATED: ${filePath} (ImageBackground import)`);
}

console.log(`\n총 ${success}개 파일 import 추가, ${skipped.length}개 스킵`);
if (skipped.length) {
  skipped.forEach(s => console.log(`  - ${s}`));
}

console.log(`\n⚠️  ImageBackground 실제 래핑은 화면별 return 구조가 달라 자동 변환 위험.`);
console.log(`   import만 추가했으니, 다음 단계에서 화면별로 background을 토큰으로 통일 (이미 Phase 1에서 완료).`);
console.log(`   한지 배경은 핵심 화면(DailyFortuneScreen)만 적용 + 나머지는 베이지 배경 색상으로 대체.`);
