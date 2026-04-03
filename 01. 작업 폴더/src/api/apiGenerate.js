import { callClaude } from './callClaude.js';
import { sanitizeQuestion } from '../validators/sanitize.js';
import { addLog } from './apiLog.js';
import { GRADE_LABELS, VALID_VISUAL_TYPES, resolveGradeKey, resolveGradeLabel } from '../constants.js';

// 문항유형 → type 코드 매핑
function resolveTypeCode(tp) {
  if (!tp) return "mc";
  if (/객관식/.test(tp)) return "mc";
  if (/OX|ox/.test(tp)) return "ox";
  if (/빈칸/.test(tp)) return "fill";
  if (/서술/.test(tp)) return "essay";
  return "mc";
}

// 유형별 예시 JSON 생성 — AI가 예시에 끌리는 문제 방지
function buildExampleJson(typeCode) {
  switch (typeCode) {
    case "mc":
      return '{"passage":null,"stem":"발문 텍스트","type":"mc","options":[{"label":"\u2460","text":"보기1","isCorrect":false},{"label":"\u2461","text":"보기2","isCorrect":true},{"label":"\u2462","text":"보기3","isCorrect":false},{"label":"\u2463","text":"보기4","isCorrect":false}],"answer":"2","explanation":"해설 텍스트","visual":null}';
    case "ox":
      return '{"passage":null,"stem":"다음 문장이 맞으면 O, 틀리면 X를 선택하시오. (문장)","type":"ox","options":null,"answer":"O","explanation":"해설 텍스트","visual":null}';
    case "fill":
      return '{"passage":null,"stem":"( ) 안에 알맞은 수를 써넣으시오. 수식 문제","type":"fill","options":null,"answer":"정답숫자","explanation":"해설 텍스트","visual":null}';
    case "essay":
      return '{"passage":null,"stem":"풀이 과정을 자세히 쓰고 답을 구하시오.","type":"essay","options":null,"answer":"essay","explanation":"해설 텍스트","visual":null}';
    default:
      return '{"passage":null,"stem":"발문","type":"mc","options":[{"label":"\u2460","text":"보기1","isCorrect":true}],"answer":"1","explanation":"해설","visual":null}';
  }
}

// GRADE_LABELS, resolveGradeKey, resolveGradeLabel → constants.js에서 import

// 학년별 시각자료 가이드 생성 (9개 학년 개별 분기)
function buildVisualGuide(gradeKey, dp) {
  switch (gradeKey) {

    // ── 초등 3학년 ──────────────────────────────────────────
    case "e3": return `[시각자료 visual 필드] 해당하면 반드시 포함하라. 해당 없으면 "visual":null.

1. 덧셈/뺄셈 세로셈: {"type":"vertical_calc","params":{"a":첫째수,"b":둘째수,"op":"+또는-","result":계산결과,"blanks":[]}}
2. 십진 블록: {"type":"base10_blocks","params":{"a":첫째수,"b":둘째수,"op":"+또는-","result":계산결과}}
3. 나눗셈 묶음: {"type":"grouping","params":{"total":전체수,"groupSize":묶음크기}}
4. 기본 도형: {"type":"shape","params":{"shape":"직사각형|정사각형|직각삼각형","showRightAngles":true}}
5. 수직선: {"type":"number_line","params":{"min":0,"max":20,"step":1,"marks":[값],"highlights":[]}}
6. 시계: {"type":"clock_face","params":{"hour":시,"minute":분}}
7. 상황 일러스트: {"type":"context_illust","params":{"illustPath":null,"contextText":"상황 텍스트","count":개수}}

⚠️ 3학년 필수 규칙:
- 덧셈/뺄셈 문항 → vertical_calc 반드시 포함, base10_blocks도 함께 권장
- 나눗셈/묶음 문항 → grouping 포함
- 직각/도형 문항 → shape 포함
- 시각/시간 문항 → clock_face 포함
- 수 범위/어림 문항 → number_line 포함`;

    // ── 초등 4학년 ──────────────────────────────────────────
    case "e4": return `[시각자료 visual 필드] 해당하면 반드시 포함하라. 해당 없으면 "visual":null.

1. 덧셈/뺄셈 세로셈: {"type":"vertical_calc","params":{"a":첫째수,"b":둘째수,"op":"+또는-","result":계산결과,"blanks":[]}}
2. 기본 도형 (각도·삼각형): {"type":"shape","params":{"shape":"직각삼각형|정삼각형|이등변삼각형|평행사변형|마름모","showRightAngles":true}}
3. 분수 막대: {"type":"fraction_bar","params":{"numerator":분자,"denominator":분모,"color":"#3498DB"}}
4. 수직선: {"type":"number_line","params":{"min":0,"max":10,"step":1,"marks":[값],"highlights":[]}}
5. 데이터 표: {"type":"data_table","params":{"headers":["항목","값1","값2"],"rows":[["결과","",""]]},"title":"표 제목"}
6. 막대그래프: {"type":"bar_chart","params":{"labels":["항목1","항목2"],"values":[값1,값2],"title":"제목","yLabel":"단위","color":"#3498DB"}}

⚠️ 4학년 필수 규칙:
- 곱셈 계산 문항 → vertical_calc 포함
- 각도·도형 문항 → shape 포함
- 분수 덧셈/뺄셈 문항 → fraction_bar 포함
- 꺾은선/막대그래프 문항 → bar_chart 또는 data_table 포함`;

    // ── 초등 5학년 ──────────────────────────────────────────
    case "e5": return `[시각자료 visual 필드] 해당하면 반드시 포함하라. 해당 없으면 "visual":null.

1. 분수 막대: {"type":"fraction_bar","params":{"numerator":분자,"denominator":분모,"color":"#3498DB","showMixed":false}}
2. 기본 도형 (넓이): {"type":"shape","params":{"shape":"직사각형|삼각형|평행사변형|사다리꼴|마름모","showRightAngles":true}}
3. 막대그래프: {"type":"bar_chart","params":{"labels":["항목1","항목2","항목3"],"values":[값1,값2,값3],"title":"제목","yLabel":"단위","color":"#2ECC71"}}
4. 원그래프: {"type":"pie_chart","params":{"data":[{"label":"항목1","value":40},{"label":"항목2","value":60}],"title":"제목"}}
5. 수직선: {"type":"number_line","params":{"min":0,"max":5,"step":1,"marks":[값],"highlights":[]}}
6. 데이터 표: {"type":"data_table","params":{"headers":["항목","수량"],"rows":[["A","3"],["B","5"]],"title":"표 제목"}}

⚠️ 5학년 필수 규칙:
- 분수 곱셈/약분 문항 → fraction_bar 포함
- 넓이(삼각형·사다리꼴) 문항 → shape 포함
- 자료·평균·그래프 문항 → bar_chart 또는 data_table 포함
- 비율 비교 → pie_chart 포함`;

    // ── 초등 6학년 ──────────────────────────────────────────
    case "e6": return `[시각자료 visual 필드] 해당하면 반드시 포함하라. 해당 없으면 "visual":null.

1. 원 다이어그램: {"type":"circle_diagram","params":{"radius":70,"showRadius":true,"showDiameter":true,"labelR":"r","labelD":"d","centerLabel":"O","title":"원","points":[]}}
  ※ 발문에서 점(A, B 등)을 언급하면 반드시 points 배열에 {"label":"A","angleDeg":0} 형태로 포함.
2. 원그래프 (비율): {"type":"pie_chart","params":{"data":[{"label":"항목1","value":40},{"label":"항목2","value":60}],"title":"비율 분포"}}
3. 막대그래프: {"type":"bar_chart","params":{"labels":["항목1","항목2"],"values":[값1,값2],"title":"제목","yLabel":"단위","color":"#E67E22"}}
4. 데이터 표: {"type":"data_table","params":{"headers":["항목","비율(%)"],"rows":[["A","40"],["B","60"]],"title":"표 제목"}}
5. 기본 도형 (입체 전개도): {"type":"shape","params":{"shape":"직사각형|정삼각형","showRightAngles":false}}
6. 수직선 (비율/소수): {"type":"number_line","params":{"min":0,"max":1,"step":0.1,"marks":[0.4,0.6],"highlights":[]}}

⚠️ 6학년 필수 규칙:
- 원의 넓이·원주 문항 → circle_diagram 포함
- 비와 비율·백분율 문항 → pie_chart 또는 bar_chart 포함
- 경우의 수·표 문항 → data_table 포함
- 소수/분수 범위 문항 → number_line 포함`;

    // ── 중학교 1학년 ────────────────────────────────────────
    case "m1": return `[시각자료 visual 필드] 단원/내용에 맞는 시각자료를 반드시 포함하라. 해당 없으면 "visual":null.

1. 수직선 (정수·유리수): {"type":"number_line","params":{"min":-6,"max":6,"step":1,"marks":[-3,2],"highlights":[]}}
2. 데이터 표 (소인수분해·배수): {"type":"data_table","params":{"headers":["수","소인수분해"],"rows":[["12","2²×3"],["18","2×3²"]],"title":"소인수분해 표"}}
3. 기본 도형 (점·선·면·각): {"type":"shape","params":{"shape":"직사각형|직각삼각형|평행사변형","showRightAngles":true}}
4. 좌표평면: {"type":"coordinate_plane","params":{"xMin":-5,"xMax":5,"yMin":-5,"yMax":5,"points":[{"x":2,"y":3,"label":"A","color":"#E74C3C"}],"lines":[],"showGrid":true}}
5. 막대그래프 (도수분포): {"type":"bar_chart","params":{"labels":["항목1","항목2","항목3"],"values":[값1,값2,값3],"title":"도수","yLabel":"빈도","color":"#3498DB"}}

⚠️ 1학년 필수 규칙:
- 정수·유리수 범위 문항 → number_line 포함
- 소인수분해·배수 문항 → data_table 포함
- 기본 도형·작도 문항 → shape 포함
- 좌표 개념 문항 → coordinate_plane 포함`;

    // ── 중학교 2학년 ────────────────────────────────────────
    case "m2": return `[시각자료 visual 필드] 단원/내용에 맞는 시각자료를 반드시 포함하라. 해당 없으면 "visual":null.

1. 좌표평면 (일차함수): {"type":"coordinate_plane","params":{"xMin":-6,"xMax":6,"yMin":-6,"yMax":6,"points":[{"x":1,"y":3,"label":"","color":"#E74C3C"}],"lines":[{"x1":-3,"y1":-1,"x2":3,"y2":5,"color":"#2980B9"}],"showGrid":true}}
2. 라벨 삼각형 (합동·닮음): {"type":"labeled_triangle","params":{"vertices":["A","B","C"],"sides":[{"label":"a","value":"5"},{"label":"b","value":"7"},{"label":"c","value":""}],"angles":[{"vertex":"B","mark":60}],"type":"isosceles"}}
3. 데이터 표 (연립방정식·함수): {"type":"data_table","params":{"headers":["x","-2","-1","0","1","2"],"rows":[["y","","","","",""]],"title":"x, y 대응표"}}
4. 막대그래프 (통계): {"type":"bar_chart","params":{"labels":["항목1","항목2","항목3"],"values":[값1,값2,값3],"title":"통계 자료","yLabel":"빈도","color":"#3498DB"}}
5. 수직선 (유리수·순환소수): {"type":"number_line","params":{"min":-3,"max":3,"step":1,"marks":[-1,2],"highlights":[]}}

⚠️ 2학년 필수 규칙:
- 일차함수 그래프 문항 → coordinate_plane 포함 (직선 표시)
- 삼각형 합동·닮음 문항 → labeled_triangle 포함
- 연립방정식 해 문항 → coordinate_plane 또는 data_table 포함
- 통계(도수분포·상자그림) 문항 → bar_chart 포함`;

    // ── 중학교 3학년 ────────────────────────────────────────
    case "m3": return `[시각자료 visual 필드] 단원/내용에 맞는 시각자료를 반드시 포함하라. 해당 없으면 "visual":null.

1. 좌표평면 (이차함수): {"type":"coordinate_plane","params":{"xMin":-5,"xMax":5,"yMin":-4,"yMax":8,"points":[{"x":0,"y":0,"label":"꼭짓점","color":"#E74C3C"}],"lines":[],"showGrid":true}}
2. 라벨 삼각형 (삼각비·피타고라스): {"type":"labeled_triangle","params":{"vertices":["A","B","C"],"sides":[{"label":"a","value":"3"},{"label":"b","value":"4"},{"label":"c","value":"5"}],"angles":[{"vertex":"C","mark":90}],"type":"right"}}
3. 데이터 표 (이차방정식·이차함수): {"type":"data_table","params":{"headers":["x","-2","-1","0","1","2"],"rows":[["y","4","1","0","1","4"]],"title":"이차함수 y=x² 값 표"}}
4. 원 다이어그램 (원주각·중심각·접선): {"type":"circle_diagram","params":{"radius":70,"centerLabel":"O","title":"원주각과 중심각","points":[{"label":"A","angleDeg":300},{"label":"B","angleDeg":410},{"label":"C","angleDeg":500}],"centralAngle":{"from":0,"to":1},"inscribedAngle":{"vertex":2,"from":0,"to":1},"angleLabels":[{"text":"110°","type":"central"},{"text":"?","type":"inscribed"}]}}
  ※ points: 원 위의 점 (angleDeg=12시방향 기준 시계방향 각도). centralAngle: 중심에서 두 점으로 선분. inscribedAngle: 원 위 점에서 두 점으로 선분.
  ※ 발문에서 "점 A, B, C"를 언급하면 반드시 points 배열에 해당 레이블을 포함하라.
5. 막대그래프 (통계): {"type":"bar_chart","params":{"labels":["계급1","계급2","계급3"],"values":[5,8,3],"title":"도수분포","yLabel":"빈도","color":"#9B59B6"}}

⚠️ 3학년 필수 규칙:
- 이차함수 문항 → coordinate_plane 포함 (포물선 개형)
- 삼각비(sin·cos·tan) 문항 → labeled_triangle 포함 (직각삼각형)
- 피타고라스 정리 문항 → labeled_triangle (직각 표시) 포함
- 원과 직선·원주각·중심각 문항 → circle_diagram 포함 (points에 점 레이블 필수!)
- 제곱근 범위 문항 → number_line 포함`;

    // ── 고등 공통수학1 ──────────────────────────────────────
    case "h_cs1": return `[시각자료 visual 필드] 단원/내용에 맞는 시각자료를 반드시 포함하라. 해당 없으면 "visual":null.

1. 좌표평면 (직선·원 방정식): {"type":"coordinate_plane","params":{"xMin":-7,"xMax":7,"yMin":-7,"yMax":7,"points":[{"x":2,"y":3,"label":"P","color":"#E74C3C"}],"lines":[{"x1":-3,"y1":2,"x2":4,"y2":-1,"color":"#2980B9"}],"showGrid":true}}
2. 원 다이어그램 (원의 방정식): {"type":"circle_diagram","params":{"radius":70,"centerLabel":"O","title":"원 x²+y²=r²","points":[{"label":"P","angleDeg":45}],"showRadius":true,"labelR":"r"}}
  ※ 발문에서 점을 언급하면 반드시 points 배열에 포함. 원주각/중심각 문항은 centralAngle, inscribedAngle도 추가.
3. 데이터 표 (다항식·나머지): {"type":"data_table","params":{"headers":["x","-2","-1","0","1","2"],"rows":[["P(x)","","","","",""]],"title":"다항식 P(x) 값 표"}}
4. 라벨 삼각형 (삼각비 응용): {"type":"labeled_triangle","params":{"vertices":["A","B","C"],"sides":[{"label":"c","value":""},{"label":"b","value":"8"},{"label":"a","value":"6"}],"angles":[{"vertex":"C","mark":60}],"type":"general"}}
5. 막대그래프: {"type":"bar_chart","params":{"labels":["항목1","항목2","항목3"],"values":[값1,값2,값3],"title":"분포","yLabel":"빈도","color":"#8E44AD"}}

⚠️ 공통수학1 필수 규칙:
- 직선의 방정식 문항 → coordinate_plane 포함 (직선·점 표시)
- 원의 방정식 문항 → coordinate_plane + circle_diagram 포함
- 다항식·인수분해 문항 → data_table (값 표) 포함
- 복소수 계산 문항 → visual:null 허용 (추상 계산)`;

    // ── 고등 공통수학2 ──────────────────────────────────────
    case "h_cs2": return `[시각자료 visual 필드] 단원/내용에 맞는 시각자료를 반드시 포함하라. 해당 없으면 "visual":null.

1. 벤 다이어그램 (집합·명제): {"type":"venn_diagram","params":{"setA":{"label":"A","elements":["1","2","3"]},"setB":{"label":"B","elements":["3","4","5"]},"intersection":["3"],"title":"A∩B"}}
2. 좌표평면 (함수 그래프): {"type":"coordinate_plane","params":{"xMin":-5,"xMax":5,"yMin":-5,"yMax":5,"points":[{"x":1,"y":2,"label":"(1,2)","color":"#E74C3C"}],"lines":[],"showGrid":true}}
3. 데이터 표 (함수·합성함수): {"type":"data_table","params":{"headers":["x","1","2","3","4"],"rows":[["f(x)","2","4","6","8"],["g(x)","1","2","3","4"]],"title":"f, g 대응표"}}
4. 막대그래프 (경우의 수·확률): {"type":"bar_chart","params":{"labels":["경우1","경우2","경우3"],"values":[값1,값2,값3],"title":"사건별 경우의 수","yLabel":"경우","color":"#E74C3C"}}
5. 원그래프 (확률 분포): {"type":"pie_chart","params":{"data":[{"label":"사건A","value":30},{"label":"여사건","value":70}],"title":"확률 분포"}}

⚠️ 공통수학2 필수 규칙:
- 집합·명제 문항 → venn_diagram 반드시 포함
- 함수·합성함수·역함수 문항 → coordinate_plane 또는 data_table 포함
- 순열·조합 계산 문항 → data_table 포함 (경우 열거)
- 확률 문항 → pie_chart 또는 bar_chart 포함`;

    // 하위 호환: 구 그룹 키 처리
    default:
      if (gradeKey === "elementary") return buildVisualGuide("e3", dp);
      if (gradeKey === "middle")     return buildVisualGuide("m1", dp);
      if (gradeKey === "high")       return buildVisualGuide("h_cs1", dp);
      return `[시각자료 visual 필드] 내용에 맞는 시각자료를 포함하라. 해당 없으면 "visual":null.`;
  }
}

export async function apiGenerate(meta) {
  const typeCode = resolveTypeCode(meta.tp);
  const exampleJson = buildExampleJson(typeCode);
  const gradeKey = resolveGradeKey(meta);
  const gradeLabel = resolveGradeLabel(meta);
  const sys = `너는 ${gradeLabel} 수학 문항 출제 전문가이다. 반드시 순수 JSON만 출력하라. 마크다운 백틱이나 설명 텍스트 없이 JSON 오브젝트 하나만 출력하라.`;

  const dp = meta.depth;
  const depthContext = dp ? `
[학습맵 3-Depth 컨텍스트] (가중치: 3depth 50% > 2depth 30% > 1depth 20%)
★ 3depth (w=0.5, 핵심): ${dp.d3.name}
  → ${dp.d3.context}
● 2depth (w=0.3, 보완): ${dp.d2.name}
  → ${dp.d2.context}
○ 1depth (w=0.2, 맥락): ${dp.d1.name}
  → ${dp.d1.context}

⚠️ 문항 생성 시 반드시 3depth의 구체적 학습 활동을 중심으로 하되, 2depth의 수학적 개념 범위 안에서 출제하고, 1depth의 단원 맥락을 벗어나지 않도록 하라.` : '';

  const visualGuide = buildVisualGuide(gradeKey, dp);

  const u = `메타정보 기반 문항 생성:
- 유형:${meta.tp}, 영역:${meta.ar}>${meta.l1}, 성취:${meta.ac} ${meta.ad}
- 내용요소:${meta.el}, Bloom's:${meta.bl}, 난이도:${meta.df}, 배점:${meta.sc}점
- 출제가이드:${meta.gd}
- 학교급/학년: ${gradeLabel} ${meta.gd || ""}
${depthContext}

⚠️⚠️⚠️ [문항유형 절대 준수] ⚠️⚠️⚠️
이 문항의 유형은 "${meta.tp}" (type="${typeCode}")이다.
반드시 type="${typeCode}"으로 출력하라. 다른 유형으로 변경하지 마라.
${typeCode === "fill" ? '- 빈칸채우기: stem에 "( )" 또는 "□"로 빈칸을 표시하고, answer에 정답 문자열을 넣어라. options=null이다.' : ''}
${typeCode === "ox" ? '- OX판별: stem에 참/거짓 판별 문장을 포함하고, answer에 "O" 또는 "X"를 넣어라. options=null이다.' : ''}
${typeCode === "mc" ? '- 객관식: options 배열에 4개 보기를 넣고, answer에 정답 번호(문자열)를 넣어라.' : ''}
${typeCode === "essay" ? '- 서술형: stem에 풀이 과정 작성을 요구하고, answer="essay"로 넣어라. options=null이다.' : ''}

정확히 아래 형식으로 JSON을 출력하라:
${exampleJson}

⚠️ 수식 표현 필수 규칙 (절대 준수):
- LaTeX 문법($$, \\begin, \\frac, \\times 등) 절대 사용 금지
- 수식은 반드시 순수 텍스트 또는 HTML로 표현하라
- 분수: "3/4" 또는 "4분의 3"으로 표현
- 곱셈: "×" 유니코드 문자 사용
- 나눗셈: "÷" 유니코드 문자 사용
- 빈칸: "( )" 또는 "□"로 표현
${typeCode === "mc" ? `오답은 학생의 전형적 오개념에 기반하여 생성하라.` : ''}

${visualGuide}`;

  const raw = await callClaude(sys, u, { caller: "generate" });
  if (!raw) {
    addLog("[제작팀] API null (타임아웃/건너뛰기)");
    return null;
  }
  addLog("[제작팀] 응답 " + raw.length + "자");
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      addLog("[제작팀] JSON 구조 없음: " + cleaned.substring(0, 80));
      return null;
    }
    const parsed = JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1));
    parsed._aiGenerated = true;

    // visual 유효성 검증
    if (parsed.visual) {
      if (!VALID_VISUAL_TYPES.includes(parsed.visual.type) || typeof parsed.visual.params !== "object") {
        addLog("[제작팀] visual 형식 오류 → null 처리: " + parsed.visual.type);
        parsed.visual = null;
      }
    }

    // 유형 강제 검증 — AI가 다른 type을 반환하면 type + stem + options 모두 교정
    if (parsed.type !== typeCode) {
      addLog("[제작팀] 유형 불일치 교정: AI=" + parsed.type + " → 기대=" + typeCode);
      const origType = parsed.type;
      parsed.type = typeCode;

      if (typeCode === "fill") {
        // mc/ox → fill 교정: options 제거, stem을 빈칸 형태로 변환
        parsed.options = null;
        // stem에서 "알맞은 것은?", "고르시오" 등 객관식 표현을 빈칸 표현으로 교체
        parsed.stem = parsed.stem
          .replace(/결과로\s*알맞은\s*것[은을]?.*$/,"결과는? ( )")
          .replace(/알맞은\s*것[은을]?\s*(무엇입니까|고르시오|선택하시오)[.?]?/g,"알맞은 수는? ( )")
          .replace(/어느\s*것입니까[.?]?/g,"얼마입니까? ( )")
          .replace(/고르시오[.?]?/g,"써넣으시오.")
          .replace(/선택하시오[.?]?/g,"써넣으시오.");
        // stem에 빈칸 표시가 없으면 추가
        if (!/[()□]/.test(parsed.stem)) {
          parsed.stem = parsed.stem.replace(/[.?]?\s*$/, "") + " = ( )";
        }
        addLog("[제작팀] stem 교정 (fill): " + parsed.stem.substring(0, 50));
      } else if (typeCode === "ox") {
        // mc/fill → ox 교정
        parsed.options = null;
        const ans = parsed.answer;
        parsed.stem = `다음 계산이 맞으면 O, 틀리면 X를 쓰시오. ${parsed.stem.replace(/[?]?\s*$/, "")}의 답은 ${ans}이다.`;
        parsed.answer = "O"; // 기본 정답
        addLog("[제작팀] stem 교정 (ox): " + parsed.stem.substring(0, 50));
      } else if (typeCode === "mc" && !parsed.options) {
        // fill/ox/essay → mc 교정: 보기 생성
        const numAns = Number(parsed.answer);
        if (!isNaN(numAns)) {
          const diffs = [10, -10, 100, -1].sort(() => Math.random() - 0.5);
          const wrongs = diffs.slice(0, 3).map(d => numAns + d).filter(v => v !== numAns && v > 0);
          while (wrongs.length < 3) wrongs.push(numAns + Math.floor(Math.random() * 20) + 1);
          const all = [numAns, ...wrongs.slice(0, 3)].sort(() => Math.random() - 0.5);
          parsed.options = all.map((v, i) => ({ label: ["\u2460","\u2461","\u2462","\u2463"][i], text: String(v), isCorrect: v === numAns }));
          parsed.answer = String(parsed.options.findIndex(o => o.isCorrect) + 1);
        }
        parsed.stem = parsed.stem.replace(/써넣으시오|빈칸에 알맞은 수/g, "알맞은 것을 고르시오");
        addLog("[제작팀] stem 교정 (mc): options 자동 생성");
      } else if (typeCode === "essay") {
        parsed.options = null;
        parsed.answer = "essay";
        parsed.stem = parsed.stem.replace(/[.?]?\s*$/, "") + " 풀이 과정을 자세히 쓰고 답을 구하시오.";
        addLog("[제작팀] stem 교정 (essay)");
      }
    }

    addLog("[제작팀] AI 문항 생성: type=" + parsed.type + " stem=" + (parsed.stem || "").substring(0, 40));
    return sanitizeQuestion(parsed);
  } catch (e) {
    addLog("[제작팀] JSON 파싱 실패: " + e.message);
    return null;
  }
}
