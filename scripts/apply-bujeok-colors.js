#!/usr/bin/env node
// BUJEOK 부적 디자인 자동 색상 치환 (Generator Phase 1)
// 입력: src/screens, src/components, src/hooks
// 처리: 하드코딩 색상 → COLORS 토큰 매핑
// 검증: 각 파일 처리 후 변경 카운트 보고 (TS 체크는 별도)
// 안전: 의미 보존 (success=초록 유지, error=빨강 유지), 오행 색상 유지
const fs = require('fs');
const path = require('path');

// 부적 컬러 시스템에 맞는 매핑 테이블
// 형식: [정규식, 토큰명, 설명]
const COLOR_MAP = [
  // === 자주색 / 인디고 (구 primary 계열) → 부적 적색 ===
  [/'#8B4B8B'/g, "COLORS.primary", "자주→부적적"],
  [/'#6366F1'/g, "COLORS.primary", "인디고→부적적"],
  [/'#8B5CF6'/g, "COLORS.primary", "보라→부적적"],
  [/'#5B3D8E'/g, "COLORS.primary", "포스텔러보라→부적적"],

  // === 흰 배경 / 카드 ===
  [/'#FFFFFF'/g, "COLORS.card", "흰배경→카드"],
  [/'#FFFEF5'/g, "COLORS.card", "아이보리→카드"],
  [/'#FDFBF7'/g, "COLORS.card", "한지밝은→카드"],
  [/'#F8FAFC'/g, "COLORS.background", "회백→배경"],

  // === 텍스트 (먹색 계열) ===
  [/'#1A1A1A'/g, "COLORS.text", "먹색→text"],
  [/'#1E293B'/g, "COLORS.text", "다크그레이→text"],
  [/'#3D3D3D'/g, "COLORS.text", "다크→text"],
  [/'#1C1917'/g, "COLORS.text", "스톤다크→text"],
  [/'#7D7D7D'/g, "COLORS.textSecondary", "회색→textSecondary"],
  [/'#64748B'/g, "COLORS.textSecondary", "슬레이트→textSecondary"],
  [/'#57534E'/g, "COLORS.textSecondary", "스톤→textSecondary"],
  [/'#94A3B8'/g, "COLORS.textLight", "라이트슬레이트→textLight"],
  [/'#AAAAAA'/g, "COLORS.textLight", "회색→textLight"],
  [/'#6B6B6B'/g, "COLORS.textLight", "다크회색→textLight"],

  // === 보더 / 디바이더 ===
  [/'#E0E0E0'/g, "COLORS.border", "회보더→border"],
  [/'#E2E8F0'/g, "COLORS.border", "슬레이트보더→border"],
  [/'#E5E5E5'/g, "COLORS.border", "회보더→border"],
  [/'#E5E7EB'/g, "COLORS.border", "회보더→border"],
  [/'#E7E5E4'/g, "COLORS.border", "스톤보더→border"],
  [/'#F0F0F0'/g, "COLORS.divider", "디바이더"],
  [/'#F1F5F9'/g, "COLORS.divider", "슬레이트디바이더"],
  [/'#F3F4F6'/g, "COLORS.divider", "디바이더"],
  [/'#F5F5F5'/g, "COLORS.divider", "회디바이더"],

  // === MZ 핑크 (안티패턴) → 부적 적색 ===
  [/'#FF4D8B'/g, "COLORS.primary", "MZ핑크→부적적"],
  [/'#E91E63'/g, "COLORS.fire", "핑크→화"],  // 연애운은 음양오행 火
  [/'#EC4899'/g, "COLORS.fire", "핫핑크→화"],
  [/'#FCE4EC'/g, "COLORS.cardAlt", "연핑크→cardAlt"],

  // === 점수 색상 4단계 (기존 하드코딩) — 사용 위치 봐서 getScoreColor로 변환 권장 ===
  [/'#4CAF50'/g, "COLORS.scoreExcellent", "녹색→대길"],
  [/'#FFC107'/g, "COLORS.scoreGood", "노랑→길"],
  [/'#FF9800'/g, "COLORS.scoreNeutral", "주황→평"],
  [/'#F44336'/g, "COLORS.scoreBad", "빨강→흉"],

  // === SaaS 표준 (status bar 등) ===
  [/'#10B981'/g, "COLORS.success", "에메랄드→success"],
  [/'#22C55E'/g, "COLORS.success", "녹색→success"],
  [/'#EF4444'/g, "COLORS.error", "빨강→error"],
  [/'#F59E0B'/g, "COLORS.warning", "주황→warning"],
  [/'#F97316'/g, "COLORS.warning", "주황→warning"],
  [/'#3B82F6'/g, "COLORS.info", "파랑→info"],
];

// theme import 자동 추가 패턴
const THEME_IMPORT_RE = /from\s+['"]\.\.\/[\.\/]*utils\/theme['"]/;

const TARGET_DIRS = [
  'src/screens',
  'src/components',
  'src/hooks',
];

let totalFiles = 0;
let totalReplacements = 0;
const failedFiles = [];
const reportRows = [];

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let modified = content;
  let count = 0;
  const replacements = {};

  for (const [pattern, token, label] of COLOR_MAP) {
    const matches = modified.match(pattern);
    if (matches) {
      const n = matches.length;
      modified = modified.replace(pattern, token);
      count += n;
      replacements[label] = (replacements[label] || 0) + n;
    }
  }

  if (count === 0) return null;

  // theme import 누락 시 안전망 (이미 있으면 건드리지 않음)
  if (!THEME_IMPORT_RE.test(modified) && !modified.includes("from '../utils/theme'") && !modified.includes("from '../../utils/theme'")) {
    // import 자동 추가는 깊이별로 다르므로 보고만 (수동 추가 권장)
    replacements['⚠️ theme import 없음'] = 1;
  }

  fs.writeFileSync(filePath, modified, 'utf-8');
  return { count, replacements };
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name) && !entry.name.endsWith('.bak')) {
      try {
        const result = processFile(fullPath);
        if (result) {
          totalFiles++;
          totalReplacements += result.count;
          const relPath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
          reportRows.push({ file: relPath, count: result.count, details: result.replacements });
        }
      } catch (e) {
        failedFiles.push({ file: fullPath, error: e.message });
      }
    }
  }
}

console.log('='.repeat(60));
console.log('BUJEOK 부적 디자인 자동 색상 치환 (Phase 1)');
console.log('='.repeat(60));

const cwd = process.cwd();
for (const dir of TARGET_DIRS) {
  const fullDir = path.join(cwd, dir);
  if (fs.existsSync(fullDir)) {
    walkDir(fullDir);
  }
}

// 보고서
console.log(`\n처리 파일: ${totalFiles}개`);
console.log(`치환 건수: ${totalReplacements}건`);

console.log('\n=== Top 20 변경 파일 ===');
reportRows
  .sort((a, b) => b.count - a.count)
  .slice(0, 20)
  .forEach((row, i) => {
    const detailStr = Object.entries(row.details)
      .map(([k, v]) => `${k}:${v}`)
      .join(', ');
    console.log(`  ${i + 1}. [${row.count}건] ${row.file}`);
    console.log(`      ${detailStr}`);
  });

if (failedFiles.length > 0) {
  console.log(`\n❌ 실패 파일 ${failedFiles.length}개:`);
  failedFiles.forEach(f => console.log(`  - ${f.file}: ${f.error}`));
}

console.log('\n다음 단계: npx tsc --noEmit -p . 로 검증');
