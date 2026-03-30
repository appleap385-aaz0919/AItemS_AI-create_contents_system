import { callClaude } from './callClaude.js';
import { sanitizeQuestion } from '../validators/sanitize.js';
import { addLog } from './apiLog.js';

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

// 학년 코드에서 초/중/고 판별
function resolveGradeLevel(meta) {
  const gd = (meta.gd || "").toLowerCase();
  const ar = (meta.ar || "").toLowerCase();
  if (/고등|고1|고2|고3|high/.test(gd + ar)) return "high";
  if (/중등|중1|중2|중3|middle/.test(gd + ar)) return "middle";
  return "elementary"; // 기본 초등
}

// 학년별 시각자료 가이드 생성
function buildVisualGuide(level, dp) {
  const hint = ((dp?.d1?.name || "") + " " + (dp?.d2?.name || "") + " " + (dp?.d3?.name || "")).toLowerCase();

  if (level === "elementary") {
    return `[시각자료 visual 필드] 아래 해당하면 반드시 visual을 포함하라. 해당 없으면 "visual":null.

1. 덧셈/뺄셈 세로셈: {"type":"vertical_calc","params":{"a":첫째수,"b":둘째수,"op":"+또는-","result":계산결과,"blanks":[]}}
2. 기본 도형: {"type":"shape","params":{"shape":"직사각형|정사각형|직각삼각형|마름모|평행사변형|정삼각형","showRightAngles":true}}
3. 나눗셈 묶음: {"type":"grouping","params":{"total":전체수,"groupSize":묶음크기}}
4. 수직선: {"type":"number_line","params":{"min":시작,"max":끝,"step":눈금간격,"marks":[값1,값2],"highlights":[]}}
5. 분수 막대: {"type":"fraction_bar","params":{"numerator":분자,"denominator":분모,"color":"#3498DB"}}
   - 분수 단원, 분수 비교, 분수 덧셈/뺄셈 문항에 사용
6. 시계: {"type":"clock_face","params":{"hour":시,"minute":분}}
   - 시각 읽기, 시간 계산 문항에 사용
7. 상황 일러스트: {"type":"context_illust","params":{"illustPath":null,"contextText":"상황 텍스트","count":개수}}

[보조 시각자료 visual2]
- 십진 블록: {"type":"base10_blocks","params":{"a":첫째수,"b":둘째수,"op":"+또는-","result":계산결과}}
  (받아올림/내림 덧뺄셈에서 vertical_calc와 함께 사용)

⚠️ 초등 문항 시각자료 필수 규칙:
- 덧셈/뺄셈 → 반드시 vertical_calc 포함 + 가능하면 base10_blocks도 포함
- 분수 문항 → fraction_bar 포함
- 시각 문항 → clock_face 포함
- 도형 문항 → shape 포함
- 어림/수직선 → number_line 포함`;
  }

  if (level === "middle") {
    return `[시각자료 visual 필드] 단원/내용에 맞는 시각자료를 반드시 포함하라. 해당 없으면 "visual":null.

1. 라벨 삼각형: {"type":"labeled_triangle","params":{"vertices":["A","B","C"],"sides":[{"label":"a","value":"5 cm"},{"label":"b","value":"7 cm"},{"label":"c","value":""}],"angles":[{"vertex":"B","mark":60}],"type":"general|right|isosceles|equilateral"}}
   - 삼각형의 합동·닮음·피타고라스·삼각비 문항에 사용
2. 좌표평면: {"type":"coordinate_plane","params":{"xMin":-6,"xMax":6,"yMin":-6,"yMax":6,"points":[{"x":2,"y":3,"label":"A","color":"#E74C3C"}],"lines":[{"x1":0,"y1":0,"x2":3,"y2":3,"color":"#2980B9"}],"showGrid":true}}
   - 좌표, 일차함수, 연립방정식 문항에 사용
3. 데이터 표: {"type":"data_table","params":{"headers":["x","1","2","3","4"],"rows":[["y","3","5","7","9"]],"title":"x와 y의 관계"}}
   - 비례·규칙성·함수값 표 문항에 사용
4. 막대그래프: {"type":"bar_chart","params":{"labels":["1반","2반","3반"],"values":[25,30,20],"title":"반별 학생 수","yLabel":"명","color":"#3498DB"}}
   - 통계·자료정리 문항에 사용
5. 원그래프: {"type":"pie_chart","params":{"data":[{"label":"독서","value":40},{"label":"운동","value":30},{"label":"게임","value":30}],"title":"취미 분포"}}
   - 비율·백분율·원그래프 문항에 사용
6. 수직선 (정수/유리수): {"type":"number_line","params":{"min":-5,"max":5,"step":1,"marks":[-2,3],"highlights":[]}}
7. 원 다이어그램: {"type":"circle_diagram","params":{"showRadius":true,"showDiameter":true,"labelR":"r","labelD":"2r","centerLabel":"O"}}

⚠️ 중등 문항 시각자료 필수 규칙:
- 도형(삼각형) 문항 → labeled_triangle 반드시 포함
- 좌표/함수 문항 → coordinate_plane 반드시 포함
- 통계 문항 → bar_chart 또는 pie_chart 포함
- 비례식/규칙 문항 → data_table 포함
- 원 관련 문항 → circle_diagram 포함`;
  }

  // high school
  return `[시각자료 visual 필드] 단원/내용에 맞는 시각자료를 반드시 포함하라. 해당 없으면 "visual":null.

1. 좌표평면 (함수 그래프): {"type":"coordinate_plane","params":{"xMin":-6,"xMax":6,"yMin":-8,"yMax":8,"points":[{"x":2,"y":4,"label":"P(2,4)","color":"#E74C3C"}],"lines":[{"x1":-3,"y1":-3,"x2":3,"y2":3,"color":"#2980B9"}],"showGrid":true}}
   - 이차함수, 지수/로그, 삼각함수, 직선의 방정식 문항에 사용
2. 벤 다이어그램 (집합): {"type":"venn_diagram","params":{"setA":{"label":"A","elements":["1","2","3"]},"setB":{"label":"B","elements":["3","4","5"]},"intersection":["3"],"title":"A∩B"}}
   - 집합·명제 단원에 사용
3. 데이터 표: {"type":"data_table","params":{"headers":["x","-2","-1","0","1","2"],"rows":[["f(x)","4","1","0","1","4"]],"title":"함수값 표"}}
4. 막대/히스토그램: {"type":"bar_chart","params":{"labels":["60","70","80","90"],"values":[5,8,12,3],"title":"성적 분포","yLabel":"명수","color":"#8E44AD"}}
5. 라벨 삼각형 (삼각비·코사인법칙): {"type":"labeled_triangle","params":{"vertices":["A","B","C"],"sides":[{"label":"a","value":""},{"label":"b","value":"8"},{"label":"c","value":"6"}],"angles":[{"vertex":"A","mark":60}],"type":"general"}}
6. 원 다이어그램: {"type":"circle_diagram","params":{"showRadius":true,"showDiameter":false,"labelR":"r","centerLabel":"O","title":"원의 방정식"}}

⚠️ 고등 문항 시각자료 필수 규칙:
- 함수·방정식 문항 → coordinate_plane 반드시 포함 (점·직선 표시)
- 집합·명제 문항 → venn_diagram 포함
- 통계 문항 → bar_chart 또는 data_table 포함
- 삼각함수·코사인법칙 → labeled_triangle 포함`;
}

export async function apiGenerate(meta) {
  const typeCode = resolveTypeCode(meta.tp);
  const exampleJson = buildExampleJson(typeCode);
  const gradeLevel = resolveGradeLevel(meta);

  const gradeLabel = gradeLevel === "high" ? "고등학교" : gradeLevel === "middle" ? "중학교" : "초등학교";
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

  const visualGuide = buildVisualGuide(gradeLevel, dp);

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

  const raw = await callClaude(sys, u);
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
      const validTypes = [
        // 기존 초등
        "vertical_calc", "shape", "grouping", "number_line", "base10_blocks", "context_illust",
        // 신규 초·중·고
        "labeled_triangle", "coordinate_plane", "fraction_bar", "data_table",
        "bar_chart", "pie_chart", "clock_face", "venn_diagram", "circle_diagram",
      ];
      if (!validTypes.includes(parsed.visual.type) || typeof parsed.visual.params !== "object") {
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
