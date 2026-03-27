import { callClaude } from './callClaude.js';
import { localValidate } from '../validators/localValidate.js';
import { addLog } from './apiLog.js';

export async function apiValidate(meta, question) {
  const sys=`너는 초등 수학 문항 검수 전문가이다. 문항을 직접 풀어서 정답을 반드시 검증하고, 4개 영역에서 점수를 매겨라. 순수 JSON만 출력하라.`;
  const visualDesc = question.visual ? `시각자료: type=${question.visual.type}, params=${JSON.stringify(question.visual.params)}` : "시각자료: 없음";
  const u=`다음 문항을 검수하라.

[메타정보] 학년: 초등 3학년 1학기 (성취기준의 '4'는 3-4학년군 코드임, 4학년이 아님)
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
- 시각자료가 있으면: 발문의 수치/도형과 visual 파라미터가 일치하는지 검증하라.
- 세로셈(vertical_calc): a, b, op의 계산 결과가 result와 맞는지, stem의 수식과 일치하는지 확인.
- 도형(shape): 발문에서 언급하는 도형명과 visual의 shape가 일치하는지 확인.
- 묶음(grouping): total ÷ groupSize가 나누어 떨어지는지, stem의 수와 일치하는지 확인.
- 시각자료와 발문이 불일치하면 D3에서 감점하라.

JSON 형식:
{"score":85,"status":"approved","D1_code":{"score":25,"issues":[]},"D2_education":{"score":28,"issues":[]},"D3_accessibility":{"score":18,"issues":[]},"D4_scoring":{"score":14,"issues":[]},"answer_verified":true,"correct_answer":"${question.answer}","summary":"검수 결과 요약"}

판정 규칙:
- score = D1+D2+D3+D4 합계 (0~100)
- status: score >= 80이면 "approved", 80 미만이면 "rejected"
- answer_verified가 false이면 score와 무관하게 반드시 "rejected"
- Critical 이슈(정답 오류, 해설 모순, 수학적 오류)가 있으면 반드시 "rejected"`;
  const raw = await callClaude(sys, u);
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

    if(typeof parsed.score !== "number") {
      const d1=parsed.D1_code?.score||0, d2=parsed.D2_education?.score||0, d3=parsed.D3_accessibility?.score||0, d4=parsed.D4_scoring?.score||0;
      parsed.score = d1+d2+d3+d4;
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
    const scoreMatch = raw.match(/"score"\s*:\s*(\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    const verifiedMatch = raw.match(/"answer_verified"\s*:\s*(true|false)/);
    const verified = verifiedMatch ? verifiedMatch[1] === "true" : false;
    return { score, status: (score >= 80 && verified) ? "approved" : "rejected", D1_code:{score:25,issues:[]}, D2_education:{score:Math.min(score-40,30),issues:["JSON 파싱 실패"]}, D3_accessibility:{score:15,issues:[]}, D4_scoring:{score:20,issues:[]}, answer_verified:verified, correct_answer:question.answer, summary:"파싱 실패 — " + (score>=80&&verified?"승인":"반려") };
  }
}
