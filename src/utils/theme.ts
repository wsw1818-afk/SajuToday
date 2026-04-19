// SajuToday 테마 색상 v2 (2026-04-18)
// DESIGN.md 'BUJEOK 부적' 컨셉 — 한국 무속 점집 부적 분위기
// 베이지 한지 + 빨간 부적 인장 + 검은 먹글씨

export const COLORS = {
  // === 메인 컬러 (부적 3색) ===
  primary: '#C0392B',          // 부적 적색 (인장/강조)
  primaryLight: '#E8B4A8',     // 부적 적색 흐림 (선택 배경, 보더)
  primaryDark: '#8B2818',      // 부적 적색 진함 (호버/액티브)
  secondary: '#B8860B',        // 황금 (특별 액센트, 길일 표시)

  // === 배경 (한지 베이지) ===
  background: '#F5E6C8',       // 한지 베이지 (메인 배경)
  card: '#FFFEF5',             // 밝은 한지 (카드 배경)
  cardAlt: '#F5E6C8',          // 한지 베이지 (대체 카드)
  surface: '#E8D4A0',          // 한지 어두운 영역 (구분선/표면)

  // === 텍스트 (먹색) ===
  text: '#1A1A1A',             // 먹색 (기본 본문)
  textPrimary: '#1A1A1A',      // 먹색 (제목)
  textSecondary: '#4A3B30',    // 먹색 부드러운 (서브)
  textLight: '#6B5D52',        // 먹색 흐림 (캡션) — WCAG AA 통과 (한지 #F5E6C8 기준 5.3:1)

  // === 오행 컬러 (음양오행 정통) ===
  // DESIGN.md 오행 색상 매핑 — 사주 분석 차트/오행 표시용
  wood: '#2980B9',             // 청 (목 木)
  fire: '#C0392B',             // 적 (화 火) = 부적 적색과 동일
  earth: '#F39C12',            // 황 (토 土)
  metal: '#FFFFFF',            // 백 (금 金) — 흰색은 보더 필수
  water: '#1A1A1A',            // 흑 (수 水)

  // === 점수 색상 (4단계, DESIGN.md 명시) ===
  scoreExcellent: '#C0392B',   // 대길 80+ (부적 적색)
  scoreGood: '#D4732C',        // 길 60+ (주황빛 적색)
  scoreNeutral: '#8B7355',     // 평 40+ (먹색 흐림)
  scoreBad: '#4A3B30',         // 흉 40- (어두운 먹색)

  // === 상태 컬러 (의미상 유지, 부적 톤으로 조정) ===
  success: '#5C7C3A',          // 한국 전통 녹색 (대나무)
  warning: '#D4732C',          // 부적 주황빛
  error: '#C0392B',            // 부적 적색
  info: '#4A3B30',             // 먹색

  // === 기타 ===
  border: '#D4C4A0',           // 한지 베이지 보더 (부드러움)
  divider: '#E8D4A0',          // 한지 어두운 영역 (구분선)
  overlay: 'rgba(26, 26, 26, 0.5)',  // 먹색 오버레이
  white: '#FFFFFF',
  black: '#1A1A1A',            // 먹색 (순검정 대신)
};

// 오행별 색상 (음양오행 정통, DESIGN.md 명시)
export const ELEMENT_COLORS = {
  wood: COLORS.wood,
  fire: COLORS.fire,
  earth: COLORS.earth,
  metal: COLORS.metal,
  water: COLORS.water,
};

// 폰트 패밀리 (DESIGN.md BUJEOK 부적 컨셉, expo-font 등록)
// App.tsx의 useFonts에서 로드됨
export const FONTS = {
  body: undefined as string | undefined,        // 시스템 기본 (Pretendard fallback)
  serif: 'NotoSerifKR',                         // 한자 본문/제목 (먹글씨 느낌)
  serifBold: 'NotoSerifKR-Bold',                // 한자 굵게
  brush: 'NanumBrushScript',                    // 부적 손글씨 (점수, 인장)
};

// 폰트 사이즈 (DESIGN.md 스케일)
export const FONT_SIZES = {
  xs: 11,    // 캡션, 메타
  sm: 13,    // 보조 텍스트
  md: 15,    // 본문 기본
  lg: 17,    // 본문 강조
  xl: 20,    // 카테고리 제목
  xxl: 24,   // 운세 본문 제목
  xxxl: 32,  // 점수 숫자
  display: 48, // 한자 길/吉 (큰 부적 글씨)
};

// 스페이싱 (8px 기반, DESIGN.md 스케일)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// 보더 라디우스 (DESIGN.md: 부적은 각진 느낌, 카드는 둥근)
export const BORDER_RADIUS = {
  sm: 6,     // 작은 뱃지/인장 (각진 느낌)
  md: 12,    // 카드, 버튼
  lg: 20,    // 큰 카드 (운세 본문)
  xl: 16,    // (구버전 호환)
  full: 9999,
};

// 그림자 (DESIGN.md: 종이 떠있는 미세 효과)
export const SHADOWS = {
  sm: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
  },
  // 부적 인장 보더 효과 (DESIGN.md)
  stamp: {
    shadowColor: '#C0392B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 0,
  },
};

// 공통 스타일 (DESIGN.md 부적 컴포넌트 가이드 반영)
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  bujeokCard: {
    // 부적 카드 (운세 본문 스타일)
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xxl,
    ...SHADOWS.md,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    lineHeight: FONT_SIZES.xxl * 1.3,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    lineHeight: FONT_SIZES.lg * 1.4,
  },
  body: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    lineHeight: FONT_SIZES.md * 1.7,  // 한국어 가독성 (DESIGN.md)
  },
  caption: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600' as const,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
};

// 점수에 따른 부적 색상 반환 (DailyFortuneScreen 등에서 사용)
export const getScoreColor = (score: number): string => {
  if (score >= 80) return COLORS.scoreExcellent;
  if (score >= 60) return COLORS.scoreGood;
  if (score >= 40) return COLORS.scoreNeutral;
  return COLORS.scoreBad;
};

// 점수에 따른 한자 라벨 (DESIGN.md 부적 컨셉)
export const getScoreLabel = (score: number): string => {
  if (score >= 80) return '大吉';  // 대길
  if (score >= 60) return '吉';    // 길
  if (score >= 40) return '平';    // 평
  return '凶';                     // 흉
};
