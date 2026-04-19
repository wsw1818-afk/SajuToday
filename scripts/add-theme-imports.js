// COLORS import 누락 파일에 자동 추가
const fs = require('fs');
const path = require('path');

const files = [
  'src/components/FortuneCard.tsx',
  'src/components/ShareCard.tsx',
  'src/components/ShareModal.tsx',
  'src/components/common/TermTooltip.tsx',
  'src/components/saju/AdviceCard.tsx',
  'src/components/saju/CompatCard.tsx',
  'src/components/saju/DetailGrid.tsx',
  'src/components/saju/LuckCard.tsx',
  'src/components/saju/SajuWheel.tsx',
  'src/components/widgets/DailyFortuneWidget.tsx',
  'src/hooks/useHomeStyles.ts',
  'src/screens/CalendarScreen.tsx',
  'src/screens/CompatibilityScreen.tsx',
  'src/screens/DatePickerScreen.tsx',
  'src/screens/DatePickerTest.tsx',
  'src/screens/FortuneDetailScreen.tsx',
  'src/screens/MenuScreen.tsx',
  'src/screens/MyScreen.tsx',
  'src/screens/UnknownTimeScreen.tsx',
  'src/screens/VerificationScreen.tsx',
  'src/screens/WidgetPreviewScreen.tsx',
  'src/screens/YearFortuneScreen.tsx',
];

// 깊이별 import 경로 계산
function getRelativeThemePath(filePath) {
  const parts = filePath.split('/');
  const depthFromSrc = parts.length - parts.indexOf('src') - 2;
  const ups = '../'.repeat(depthFromSrc);
  return `${ups}utils/theme`;
}

let success = 0;
for (const f of files) {
  const fullPath = path.join(process.cwd(), f);
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP (not found): ${f}`);
    continue;
  }
  let content = fs.readFileSync(fullPath, 'utf-8');

  // 이미 COLORS import 있나?
  if (/import\s+\{[^}]*COLORS[^}]*\}\s+from/.test(content)) {
    console.log(`OK (already has): ${f}`);
    continue;
  }

  // theme import 라인 있나? (이미 다른 토큰만 import)
  const themeImportMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['"][\.\/]+utils\/theme['"]/);
  if (themeImportMatch) {
    // 기존 import에 COLORS 추가
    const tokens = themeImportMatch[1].trim();
    if (!tokens.includes('COLORS')) {
      const newImport = themeImportMatch[0].replace(tokens, `COLORS, ${tokens}`);
      content = content.replace(themeImportMatch[0], newImport);
      fs.writeFileSync(fullPath, content, 'utf-8');
      console.log(`UPDATED (added to existing): ${f}`);
      success++;
    }
  } else {
    // 새 import 라인 추가 (첫 import 다음에)
    const themePath = getRelativeThemePath(f);
    const firstImportEnd = content.indexOf("\n", content.indexOf("import "));
    if (firstImportEnd === -1) {
      console.log(`SKIP (no import found): ${f}`);
      continue;
    }
    const newImportLine = `\nimport { COLORS } from '${themePath}';`;
    content = content.slice(0, firstImportEnd) + newImportLine + content.slice(firstImportEnd);
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`ADDED: ${f} → ${themePath}`);
    success++;
  }
}

console.log(`\n총 ${success}개 파일 처리`);
