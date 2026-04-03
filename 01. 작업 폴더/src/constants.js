// ========================================================
// 공유 상수 — 학년 키, 라벨, 시각자료 유형 중앙 관리
// ========================================================

/** 9개 학년 키 → 표시 이름 */
export const GRADE_LABELS = {
  e3: "초등 3학년", e4: "초등 4학년", e5: "초등 5학년", e6: "초등 6학년",
  m1: "중학교 1학년", m2: "중학교 2학년", m3: "중학교 3학년",
  h_cs1: "고등 공통수학1", h_cs2: "고등 공통수학2",
};

/** 유효한 시각자료 유형 (SVG 생성기와 1:1 매핑) */
export const VALID_VISUAL_TYPES = [
  // 기존 초등
  "vertical_calc", "base10_blocks", "context_illust", "shape", "grouping", "number_line",
  // 신규 초·중·고
  "labeled_triangle", "coordinate_plane", "fraction_bar", "data_table",
  "bar_chart", "pie_chart", "clock_face", "venn_diagram", "circle_diagram",
];

/**
 * 메타 정보에서 정확한 학년 키 반환
 * 1순위: meta._gradeKey (metas.js에서 설정)
 * 2순위: meta.gd/ar 텍스트 패턴으로 학년 추정 (세분화)
 * 3순위: 학교급 그룹 기본값
 */
export function resolveGradeKey(meta) {
  // 1순위: 명시적 _gradeKey
  if (meta._gradeKey && GRADE_LABELS[meta._gradeKey]) return meta._gradeKey;

  // 2순위: 텍스트 패턴으로 정확한 학년 추정
  const text = ((meta.gd || "") + " " + (meta.ar || "") + " " + (meta.ac || "")).toLowerCase();

  // 고등
  if (/공통수학2|공통수학 2|h_cs2/.test(text)) return "h_cs2";
  if (/공통수학1|공통수학 1|h_cs1|고등|high/.test(text)) return "h_cs1";
  // 중학
  if (/중3|중학교?\s*3|m3/.test(text)) return "m3";
  if (/중2|중학교?\s*2|m2/.test(text)) return "m2";
  if (/중1|중학교?\s*1|중등|middle|m1/.test(text)) return "m1";
  // 초등
  if (/초6|초등\s*6|6학년|e6/.test(text)) return "e6";
  if (/초5|초등\s*5|5학년|e5/.test(text)) return "e5";
  if (/초4|초등\s*4|4학년|e4/.test(text)) return "e4";

  // 3순위: 기본값
  return "e3";
}

/**
 * 학년 키 → 한글 라벨 반환
 * resolveGradeKey()의 결과를 라벨로 변환
 */
export function resolveGradeLabel(meta) {
  const key = resolveGradeKey(meta);
  return GRADE_LABELS[key] || "초등 3학년";
}

/**
 * 학년 키 → 학교급 ("elementary" | "middle" | "high")
 */
export function gradeGroup(key) {
  if (!key) return "elementary";
  if (key.startsWith("h_")) return "high";
  if (key.startsWith("m")) return "middle";
  return "elementary";
}

/**
 * 학년 키 → 학교급 한글 라벨
 */
export function gradeGroupLabel(key) {
  const g = gradeGroup(key);
  if (g === "high") return "고등학교";
  if (g === "middle") return "중학교";
  return "초등학교";
}

/**
 * 학년에 맞는 폴백 메타의 depth context 생성
 */
export function buildFallbackDepth(gradeKey, nodeName) {
  const g = gradeGroup(gradeKey);
  const label = GRADE_LABELS[gradeKey] || "수학";
  const contextMap = {
    elementary: `${label} 수학 전반`,
    middle: `${label} 수학 전반`,
    high: `${label} 수학 전반`,
  };
  return {
    d1: { name: "수학", context: contextMap[g], w: 0.2 },
    d2: { name: nodeName || "학습", context: "선택한 학습 노드", w: 0.3 },
    d3: { name: "AI 문항", context: "AI 자동 생성 연습 문항", w: 0.5 },
  };
}
