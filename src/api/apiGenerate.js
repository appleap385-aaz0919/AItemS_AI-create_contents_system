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

export async function apiGenerate(meta) {
  const typeCode = resolveTypeCode(meta.tp);
  const exampleJson = buildExampleJson(typeCode);

  const sys = `너는 초등학교 수학 문항 출제 전문가이다. 반드시 순수 JSON만 출력하라. 마크다운 백틱이나 설명 텍스트 없이 JSON 오브젝트 하나만 출력하라.`;

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

  const u = `메타정보 기반 문항 생성:
- 유형:${meta.tp}, 영역:${meta.ar}>${meta.l1}, 성취:${meta.ac} ${meta.ad}
- 내용요소:${meta.el}, Bloom's:${meta.bl}, 난이도:${meta.df}, 배점:${meta.sc}점
- 출제가이드:${meta.gd}
- 학년: 초등3학년 1학기
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
- 세로셈: "367 + 285" 처럼 가로로 표현하거나, 줄바꿈으로 표현
- 분수: "3/4" 또는 "4분의 3"으로 표현
- 곱셈: "×" 유니코드 문자 사용 (\\times 금지)
- 나눗셈: "÷" 유니코드 문자 사용
- 빈칸: "( )" 또는 "□"로 표현
${typeCode === "mc" ? `오답은 학생의 전형적 오개념(${dp?.d3?.context?.includes('오류') ? dp.d3.context : '자릿값 혼동, 받아올림 누락, 연산 순서 착각'})에 기반하여 생성하라.` : ''}

[시각자료 visual 필드] 아래 해당하면 visual을 포함하라. 해당 없으면 "visual":null.
1. 덧셈/뺄셈: {"type":"vertical_calc","params":{"a":첫째수,"b":둘째수,"op":"+또는-","result":계산결과,"blanks":[]}}
   - blanks: 빈칸채우기이면 가릴 자릿수 배열 (0=일의자리). 예: [0]은 일의 자리 숨김
2. 도형: {"type":"shape","params":{"shape":"도형이름","showRightAngles":true/false}}
3. 나눗셈: {"type":"grouping","params":{"total":전체수,"groupSize":묶음크기}}
4. 어림셈: {"type":"number_line","params":{"min":시작,"max":끝,"step":100,"marks":[원래수1,원래수2],"highlights":[어림값1,어림값2]}}`;

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
      const validTypes = ["vertical_calc","shape","grouping","number_line"];
      if (!validTypes.includes(parsed.visual.type) || typeof parsed.visual.params !== "object") {
        addLog("[제작팀] visual 형식 오류 → null 처리");
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
