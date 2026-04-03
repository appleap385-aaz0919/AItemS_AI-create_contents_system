import { callClaude } from './callClaude.js';
import { localValidate } from '../validators/localValidate.js';
import { addLog } from './apiLog.js';
import { resolveGradeLabel } from '../constants.js';

// stem-visual 정합성 사전 검증 (AI 검수 전에 코드로 먼저 체크)
function preValidateStemVisual(question) {
  const issues = [];
  if (!question.visual || !question.visual.params) return issues;
  const p = question.visual.params;
  const stem = question.stem || "";
  const vType = question.visual.type;

  // ── 공통: 발문 레이블 vs 시각자료 레이블 검증 ──
  // 발문에서 "점 A, B, C" 또는 "∠AOB" 형태의 레이블 추출
  const stemLabels = new Set();
  // "점 A, B, C" 패턴
  const ptMatch = stem.match(/점\s*([A-Z])(?:\s*[,、]\s*([A-Z]))*(?:\s*[,、]\s*([A-Z]))*/g);
  if (ptMatch) {
    ptMatch.forEach(m => {
      const letters = m.match(/[A-Z]/g);
      if (letters) letters.forEach(l => stemLabels.add(l));
    });
  }
  // "∠AOB", "∠ACB" 패턴
  const angMatch = stem.match(/∠([A-Z]{2,3})/g);
  if (angMatch) {
    angMatch.forEach(m => {
      const letters = m.replace("∠", "").split("");
      letters.forEach(l => stemLabels.add(l));
    });
  }
  // "꼭짓점 A, B, C" 패턴
  const vtxMatch = stem.match(/꼭짓점\s*([A-Z])(?:\s*[,、]\s*([A-Z]))*/g);
  if (vtxMatch) {
    vtxMatch.forEach(m => {
      const letters = m.match(/[A-Z]/g);
      if (letters) letters.forEach(l => stemLabels.add(l));
    });
  }

  if (stemLabels.size > 0) {
    // 시각자료에서 레이블 수집
    const visualLabels = new Set();
    if (p.points && Array.isArray(p.points)) {
      p.points.forEach(pt => { if (pt.label) visualLabels.add(pt.label); });
    }
    if (p.vertices && Array.isArray(p.vertices)) {
      p.vertices.forEach(v => {
        if (typeof v === "string") visualLabels.add(v);
        else if (v && v.label) visualLabels.add(v.label);
      });
    }
    if (p.centerLabel) visualLabels.add(p.centerLabel);

    // 누락 레이블 확인 (O는 중심점으로 별도 처리)
    const missing = [...stemLabels].filter(l => l !== "O" && !visualLabels.has(l));
    if (missing.length > 0) {
      issues.push(`발문 레이블 ${missing.join(",")}이(가) 시각자료에 없음 — 그림에 표시되지 않는 점/꼭짓점`);
    }
  }

  // ── vertical_calc 전용 검증 ──
  if (vType === "vertical_calc") {
    const expected = p.op === "+" ? p.a + p.b : p.a - p.b;
    if (p.result != null && Number(p.result) !== expected) {
      issues.push(`세로셈 result 불일치: ${p.a} ${p.op} ${p.b} = ${expected} (visual.result: ${p.result})`);
    }
    const opMatch = stem.match(/\d+\s*([+\-＋−×÷])\s*\d+/);
    if (opMatch) {
      const stemOp = (opMatch[1] === '+' || opMatch[1] === '＋') ? '+' : (opMatch[1] === '-' || opMatch[1] === '−') ? '-' : opMatch[1];
      if (stemOp !== p.op) {
        issues.push(`stem 연산자(${stemOp})와 visual 연산자(${p.op}) 불일치 — 반드시 수정 필요`);
      }
    }
    const stemNums = stem.match(/\d{2,}/g) || [];
    if (stemNums.length >= 2) {
      const sA = Number(stemNums[0]), sB = Number(stemNums[1]);
      if (sA !== p.a || sB !== p.b) {
        issues.push(`stem 수치(${sA},${sB})와 visual 수치(${p.a},${p.b}) 불일치`);
      }
    }
  }

  // ── circle_diagram 전용 검증 ──
  if (vType === "circle_diagram") {
    // 중심각 수치가 발문과 일치하는지
    const centralMatch = stem.match(/(\d+)\s*°/);
    if (centralMatch && p.angleLabels && p.angleLabels[0]) {
      const stemDeg = Number(centralMatch[1]);
      const labelDeg = parseInt(p.angleLabels[0].text);
      if (!isNaN(labelDeg) && stemDeg !== labelDeg) {
        issues.push(`중심각 수치 불일치: 발문 ${stemDeg}° vs 시각자료 ${labelDeg}°`);
      }
    }
  }

  // ── labeled_triangle 전용 검증 ──
  if (vType === "labeled_triangle") {
    // 발문의 변 길이가 visual의 sides와 일치하는지
    const sideLenMatch = stem.match(/(\d+)\s*cm/g);
    if (sideLenMatch && p.sides && p.sides.length > 0) {
      const stemLens = sideLenMatch.map(s => parseInt(s));
      const visualLens = p.sides.filter(s => s && s.value && s.value !== "?").map(s => Number(s.value));
      const missing = stemLens.filter(l => !visualLens.includes(l));
      if (missing.length > 0) {
        issues.push(`발문의 변 길이 ${missing.join(",")}cm가 삼각형 시각자료에 없음`);
      }
    }
  }

  return issues;
}

export async function apiValidate(meta, question) {
  // 사전 검증: stem-visual 정합성
  const preIssues = preValidateStemVisual(question);
  if (preIssues.length > 0) {
    addLog("[검수팀] stem-visual 사전 검증 실패: " + preIssues.join("; "));
  }
  const gradeLabel = resolveGradeLabel(meta);
  const sys=`너는 ${gradeLabel} 수학 문항 검수 전문가이다. 문항을 직접 풀어서 정답을 반드시 검증하고, 4개 영역에서 점수를 매겨라. 순수 JSON만 출력하라.`;
  const visualDesc = question.visual ? `시각자료: type=${question.visual.type}, params=${JSON.stringify(question.visual.params)}` : "시각자료: 없음";
  const u=`다음 문항을 검수하라.

[메타정보] 학년: ${gradeLabel}, 출제가이드: ${meta.gd || "-"}
유형:${meta.tp}, 난이도:${meta.df}, Bloom's:${meta.bl}, 성취:${meta.ac}
[문항] 발문:${question.stem}
유형:${question.type}, 정답:${question.answer}
${question.options?`보기:${question.options.map(o=>o.label+o.text+(o.isCorrect?" (정답)":"")).join(", ")}`:``}
해설:${question.explanation||"없음"}
${visualDesc}

★ 가장 중요: 이 문항을 직접 계산하여 정답이 맞는지 검증하라.
- 정답이 틀리면 answer_verified=false로 하고 반드시 rejected 판정하라.
- 해설과 정답이 모순되면 반드시 rejected 판정하라.
- D2 교육적정성에서 정답 오류, 해설 모순은 Critical 이슈이다.

★ 시각자료 검증 (D3 접근성에 포함):
- 시각자료가 있으면: 발문의 수치/도형과 그림이 일치하는지 검증하라.
- 세로셈: 계산 결과가 맞는지, 발문의 수식과 일치하는지 확인.
- 도형: 발문에서 언급하는 도형과 그림의 도형이 같은지 확인.
- 원: 발문에서 언급하는 점(A,B,C 등)이 그림에 표시되는지, 중심각/원주각 수치가 일치하는지 확인.
- 삼각형: 꼭짓점명, 변의 길이, 각도가 발문과 그림에서 일치하는지 확인.
- 좌표평면: 좌표 점의 위치가 발문 수치와 일치하는지 확인.
★ 레이블 일치 검증 (Critical):
- 발문에서 "점 A, B, C" 또는 "∠AOB" 등을 언급하면, 그림에도 해당 점/각도가 반드시 표시되어야 한다.
- 발문에서 언급한 점이 그림에 없으면 D3에서 Critical 감점하라.

⚠️ issues 작성 규칙 (매우 중요):
- issues 배열의 각 항목은 **교사/학생이 읽을 수 있는 자연어 문장**으로 작성하라.
- 절대 코드 용어(params, points[0], angleDeg, centerLabel, showRadius, type= 등)를 사용하지 마라.
- 좋은 예: "발문에서 점 A, B, C를 언급하지만 그림에 표시되지 않음", "중심각 110°와 그림의 각도가 일치함"
- 나쁜 예: "points[0].label:'A' ✓", "angleDeg:150°", "circle_diagram 렌더링 시..."
- summary도 마찬가지로 자연어 문장으로 작성하라.

JSON 형식:
{"score":85,"status":"approved","D1_code":{"score":25,"issues":[]},"D2_education":{"score":28,"issues":[]},"D3_accessibility":{"score":18,"issues":[]},"D4_scoring":{"score":14,"issues":[]},"answer_verified":true,"correct_answer":"${question.answer}","summary":"검수 결과 요약"}

판정 규칙:
- score = D1+D2+D3+D4 합계 (0~100)
- status: score >= 80이면 "approved", 80 미만이면 "rejected"
- answer_verified가 false이면 score와 무관하게 반드시 "rejected"
- Critical 이슈(정답 오류, 해설 모순, 수학적 오류)가 있으면 반드시 "rejected"`;
  const raw = await callClaude(sys, u, { caller: "validate", timeout: 90000 });
  if(!raw) {
    addLog("[검수팀] ⚠️ API 응답 없음 — 로컬 규칙 검수로 전환");
    return localValidate(meta, question);
  }
  try {
    const cleaned = raw.replace(/```json|```/g,"").trim();
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    if(jsonStart === -1 || jsonEnd === -1) {
      addLog("[검수팀] ❌ JSON 구조 없음");
      return { score:0, status:"rejected", D1_code:{score:0,issues:["JSON 파싱 실패"]}, D2_education:{score:0,issues:[]}, D3_accessibility:{score:0,issues:[]}, D4_scoring:{score:0,issues:[]}, answer_verified:false, correct_answer:"", summary:"검수 응답 파싱 실패 — 반려" };
    }
    const parsed = JSON.parse(cleaned.substring(jsonStart, jsonEnd+1));

    // issues 필드를 문자열 배열로 정규화
    const issueToStr = (v) => {
      if (typeof v === "string") return v;
      if (v && typeof v === "object") return v.description || v.detail || v.message || v.text || "";
      return String(v);
    };
    // 기술 용어 클렌징 — 사용자에게 보이지 않아야 할 코드 용어 제거
    const cleanTechTerms = (text) => {
      if (!text || typeof text !== "string") return text;
      return text
        // params, points[0], angleDeg, centerLabel 등 코드 변수명 제거
        .replace(/\bparams\b\.?/gi, "")
        .replace(/\bpoints\[\d+\]\.label:['"]\w+['"]/g, "")
        .replace(/\bcenterLabel:['"]\w+['"]/g, "")
        .replace(/\bangleDeg:\d+°?/g, "")
        .replace(/\bshowRadius\b/g, "")
        .replace(/\bshowDiameter\b/g, "")
        .replace(/\bshowChord\b/g, "")
        .replace(/\bangleLabels\b/g, "각도 표기")
        .replace(/\binscribed\b/g, "원주각")
        .replace(/\bcentral\b/g, "중심각")
        .replace(/\bpoints\[\d+\]/g, "")
        .replace(/\bvertices\b/g, "꼭짓점")
        .replace(/\btype=['"]\w+['"]/g, "")
        .replace(/circle_diagram\s*렌더링\s*시?/g, "원 그림에서")
        .replace(/coordinate_plane/g, "좌표평면")
        .replace(/labeled_triangle/g, "삼각형")
        .replace(/vertical_calc/g, "세로셈")
        .replace(/circle_diagram/g, "원 그림")
        .replace(/\bvisual\b/g, "시각자료")
        // ✓ ✗ 체크마크 + 코드 패턴 제거
        .replace(/\w+:['"]\w+['"](?:\s*[✓✗])?/g, "")
        // 연속 공백/세미콜론 정리
        .replace(/;\s*;/g, ";")
        .replace(/\s{2,}/g, " ")
        .replace(/^\s*[;,.\s]+/, "")
        .replace(/[;,.\s]+\s*$/, "")
        .trim();
    };
    for (const dk of ["D1_code","D2_education","D3_accessibility","D4_scoring"]) {
      if (parsed[dk]) {
        const raw_issues = parsed[dk].issues;
        if (!raw_issues) {
          parsed[dk].issues = [];
        } else if (!Array.isArray(raw_issues)) {
          try {
            parsed[dk].issues = Object.values(raw_issues).map(issueToStr).map(cleanTechTerms).filter(Boolean);
          } catch {
            parsed[dk].issues = [];
          }
        } else {
          parsed[dk].issues = raw_issues.map(issueToStr).map(cleanTechTerms).filter(Boolean);
        }
      }
    }
    // summary도 클렌징
    if (parsed.summary) parsed.summary = cleanTechTerms(parsed.summary);

    if(typeof parsed.score !== "number") {
      const d1=parsed.D1_code?.score||0, d2=parsed.D2_education?.score||0, d3=parsed.D3_accessibility?.score||0, d4=parsed.D4_scoring?.score||0;
      parsed.score = d1+d2+d3+d4;
    }

    // 사전 검증 이슈를 D3에 반영
    if (preIssues.length > 0) {
      if (!parsed.D3_accessibility) parsed.D3_accessibility = { score: 20, issues: [] };
      parsed.D3_accessibility.issues = [...(parsed.D3_accessibility.issues || []), ...preIssues];
      parsed.D3_accessibility.score = Math.max(0, (parsed.D3_accessibility.score || 20) - preIssues.length * 8);
      const d1 = parsed.D1_code?.score || 0, d2 = parsed.D2_education?.score || 0;
      const d3 = parsed.D3_accessibility.score, d4 = parsed.D4_scoring?.score || 0;
      parsed.score = d1 + d2 + d3 + d4;
      addLog("[검수팀] stem-visual 불일치 감점 → D3=" + d3 + ", 총점=" + parsed.score);
    }

    if(parsed.answer_verified === false) {
      parsed.status = "rejected";
      addLog("[검수팀] ❌ 정답 검증 실패 → 강제 반려");
    }
    else if(parsed.score < 80) {
      parsed.status = "rejected";
    }
    else {
      parsed.status = "approved";
    }

    return parsed;
  } catch(e) {
    addLog("[검수팀] ❌ JSON 파싱 실패: " + e.message);
    // H5: raw null 안전 체크
    const scoreMatch = raw ? raw.match(/"score"\s*:\s*(\d+)/) : null;
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    const verifiedMatch = raw ? raw.match(/"answer_verified"\s*:\s*(true|false)/) : null;
    const verified = verifiedMatch ? verifiedMatch[1] === "true" : false;
    return { score, status: (score >= 80 && verified) ? "approved" : "rejected", D1_code:{score:25,issues:[]}, D2_education:{score:Math.max(0,Math.min(score-40,30)),issues:["JSON 파싱 실패"]}, D3_accessibility:{score:15,issues:[]}, D4_scoring:{score:20,issues:[]}, answer_verified:verified, correct_answer:question.answer, summary:"파싱 실패 — " + (score>=80&&verified?"승인":"반려") };
  }
}
