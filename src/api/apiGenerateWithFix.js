import { callClaude } from './callClaude.js';
import { sanitizeQuestion } from '../validators/sanitize.js';
import { addLog } from './apiLog.js';

export async function apiGenerateWithFix(meta, prevQuestion, issues) {
  const sys=`너는 초등학교 수학 문항 출제 전문가이다. 이전 문항이 검수에서 반려되었다. 반려 사유를 참고하여 수정된 문항을 생성하라. 반드시 순수 JSON 오브젝트 하나만 출력하라. 마크다운 백틱이나 설명 텍스트 금지.`;

  const dp = meta.depth;
  const depthContext = dp ? `
[학습맵 3-Depth 컨텍스트] (가중치: 3depth 50% > 2depth 30% > 1depth 20%)
★ 3depth (핵심): ${dp.d3.name} → ${dp.d3.context}
● 2depth (보완): ${dp.d2.name} → ${dp.d2.context}
○ 1depth (맥락): ${dp.d1.name} → ${dp.d1.context}` : '';

  const u=`이전 문항이 검수에서 반려되었다. 수정하여 재생성하라.

[메타정보]
- 유형:${meta.tp}, 영역:${meta.ar}>${meta.l1}, 성취:${meta.ac} ${meta.ad}
- 내용요소:${meta.el}, Bloom's:${meta.bl}, 난이도:${meta.df}, 배점:${meta.sc}점
- 가이드:${meta.gd}
${depthContext}

[이전 문항]
- 발문: ${prevQuestion?.stem || "없음"}
- 정답: ${prevQuestion?.answer || "없음"}

[반려 사유]
${issues || "검수 실패"}

⚠️ 반려 사유를 해결하되, 3depth 학습 활동 범위를 벗어나지 말 것.
⚠️ LaTeX 문법($$, \\begin, \\frac, \\times 등) 절대 사용 금지. 수식은 순수 텍스트로 표현하라(예: "367 + 285 = ?", "3/4", "×", "÷").
아래 JSON 형식 하나만 출력하라:
{"passage":null,"stem":"발문","type":"mc","options":[{"label":"①","text":"보기1","isCorrect":false},{"label":"②","text":"보기2","isCorrect":true},{"label":"③","text":"보기3","isCorrect":false},{"label":"④","text":"보기4","isCorrect":false}],"answer":"2","explanation":"해설"}`;
  const raw = await callClaude(sys, u);
  if(!raw) {
    addLog("[제작팀] ❌ 재저작 API 실패");
    return null;
  }
  try {
    const cleaned = raw.replace(/```json|```/g,"").trim();
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    if(jsonStart === -1 || jsonEnd === -1) return null;
    const parsed = JSON.parse(cleaned.substring(jsonStart, jsonEnd+1));
    parsed._aiGenerated = true;
    addLog("[제작팀] ✅ AI 재저작 완료");
    return sanitizeQuestion(parsed);
  } catch(e) {
    addLog("[제작팀] ❌ 재저작 JSON 파싱 실패");
    return null;
  }
}
