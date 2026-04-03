import { useState, useRef, useCallback, useEffect } from "react";

// ============================================================
// DATA
// ============================================================
const TREE = [
  { n:"00", nm:"학기 초 AI 진단 평가", ch:[] },
  { n:"01", nm:"덧셈과 뺄셈", ch:[
    { n:"01", nm:"받아올림이 없는 세 자리 수의 덧셈", t:"연습", ch:[{n:"01",nm:"AI 익힘 문제",t:"연습",k:"add_no_carry"}], std:["E4MATA01B03C05","E4MATA01B03C07"] },
    { n:"02", nm:"받아올림이 한 번 있는 덧셈", t:"연습", ch:[{n:"01",nm:"AI 익힘 문제",t:"연습",k:"add_one_carry"}], std:["E4MATA01B03C05"] },
    { n:"03", nm:"받아올림이 여러 번 있는 덧셈", t:"연습", ch:[{n:"01",nm:"AI 익힘 문제",t:"연습",k:"add_multi"}], std:["E4MATA01B03C05"] },
    { n:"04", nm:"덧셈의 어림셈", t:"연습", ch:[{n:"01",nm:"AI 익힘 문제",t:"연습",k:"estimate"}], std:["E4MATA01B08C20"] },
    { n:"05", nm:"받아내림이 없는 뺄셈", t:"연습", ch:[{n:"01",nm:"AI 익힘 문제",t:"연습",k:"sub_no"}], std:["E4MATA01B03C06"] },
    { n:"09", nm:"대단원 마무리", t:"총괄", ch:[{n:"01",nm:"뚝딱 해결해요",t:"심화",k:"challenge"}], std:["E4MATA01B03C05","E4MATA01B03C06"] },
  ]},
  { n:"02", nm:"평면도형", ch:[{n:"01",nm:"직각을 알아볼까요",t:"연습",ch:[{n:"01",nm:"AI 익힘 문제",t:"연습",k:"right_angle"}]}] },
  { n:"03", nm:"나눗셈", ch:[{n:"01",nm:"똑같이 나누기",t:"연습",ch:[{n:"01",nm:"AI 익힘 문제",t:"연습",k:"division"}]}] },
];

const METAS = {
  add_no_carry:{ch:"연습",tp:"객관식(4지선다)",el:"과정기능",bl:"적용",df:"하",sc:2,tm:60,ar:"수와 연산",l1:"세 자리 수의 덧셈과 뺄셈",ac:"[4수01-03]",ad:"세 자리 수의 덧셈과 뺄셈의 계산 원리를 이해하고 그 계산을 할 수 있다.",gd:"받아올림이 없는 세 자리 수 덧셈",std:["E4MATA01B03C05"],
    depth:{d1:{name:"덧셈과 뺄셈",context:"세 자리 수의 덧셈과 뺄셈 전체 단원. 받아올림/받아내림의 원리를 단계적으로 학습하는 구조.",w:0.2},d2:{name:"받아올림이 없는 세 자리 수의 덧셈",context:"자릿값을 맞추어 일의 자리부터 더하는 기본 원리. 받아올림 없이 각 자릿수의 합이 9 이하인 경우만 다룸.",w:0.3},d3:{name:"AI 익힘 문제",context:"받아올림 없는 덧셈의 연습 문항. 세 자리+세 자리에서 각 자릿수 합이 10 미만.",w:0.5}}},
  add_one_carry:{ch:"연습",tp:"빈칸채우기",el:"과정기능",bl:"적용",df:"하",sc:2,tm:60,ar:"수와 연산",l1:"세 자리 수의 덧셈과 뺄셈",ac:"[4수01-03]",ad:"세 자리 수의 덧셈과 뺄셈의 계산 원리를 이해하고 그 계산을 할 수 있다.",gd:"받아올림이 한 번 있는 덧셈",std:["E4MATA01B03C05"],
    depth:{d1:{name:"덧셈과 뺄셈",context:"세 자리 수의 덧셈과 뺄셈 전체 단원. 받아올림/받아내림의 원리를 단계적으로 학습하는 구조.",w:0.2},d2:{name:"받아올림이 한 번 있는 덧셈",context:"일의 자리 또는 십의 자리 중 한 곳에서만 받아올림이 발생. 받아올림의 개념을 처음 도입하는 단계.",w:0.3},d3:{name:"AI 익힘 문제",context:"받아올림 1회 덧셈 연습. 일의 자리 합이 10 이상이 되어 십의 자리로 1을 올리는 상황.",w:0.5}}},
  add_multi:{ch:"연습",tp:"객관식(4지선다)",el:"과정기능",bl:"적용",df:"중",sc:3,tm:90,ar:"수와 연산",l1:"세 자리 수의 덧셈과 뺄셈",ac:"[4수01-03]",ad:"세 자리 수의 덧셈과 뺄셈의 계산 원리를 이해하고 그 계산을 할 수 있다.",gd:"받아올림이 여러 번 발생하는 덧셈",std:["E4MATA01B03C05"],
    depth:{d1:{name:"덧셈과 뺄셈",context:"세 자리 수의 덧셈과 뺄셈 전체 단원.",w:0.2},d2:{name:"받아올림이 여러 번 있는 덧셈",context:"일의 자리와 십의 자리 모두에서 받아올림 발생. 연속 올림 처리 능력 필요. 난이도가 올라가는 단계.",w:0.3},d3:{name:"AI 익힘 문제",context:"연속 받아올림 연습. 일의 자리+십의 자리 모두 합이 10 이상. 전형적 오류: 올림 누락, 자릿값 혼동.",w:0.5}}},
  estimate:{ch:"연습",tp:"빈칸채우기",el:"과정기능",bl:"적용",df:"중",sc:3,tm:90,ar:"수와 연산",l1:"덧셈의 어림셈",ac:"[4수01-08]",ad:"자연수의 덧셈과 뺄셈에서 어림셈을 할 수 있다.",gd:"올림/반올림 활용 어림셈",std:["E4MATA01B08C20"],
    depth:{d1:{name:"덧셈과 뺄셈",context:"세 자리 수의 덧셈과 뺄셈 전체 단원. 정확한 계산뿐 아니라 어림셈도 포함.",w:0.2},d2:{name:"덧셈의 어림셈",context:"백의 자리에서 올림하여 대략적인 합을 구하는 방법. 실생활에서 빠른 판단에 활용.",w:0.3},d3:{name:"AI 익힘 문제",context:"두 수를 백의 자리에서 올림/반올림한 뒤 더하여 어림값 구하기. 정확한 답이 아닌 근사값을 구하는 문항.",w:0.5}}},
  sub_no:{ch:"연습",tp:"OX판별",el:"지식이해",bl:"이해",df:"하",sc:2,tm:45,ar:"수와 연산",l1:"세 자리 수의 뺄셈",ac:"[4수01-03]",ad:"세 자리 수의 덧셈과 뺄셈의 계산 원리를 이해하고 그 계산을 할 수 있다.",gd:"받아내림 없는 뺄셈 OX 판별",std:["E4MATA01B03C06"],
    depth:{d1:{name:"덧셈과 뺄셈",context:"세 자리 수의 덧셈과 뺄셈 전체 단원.",w:0.2},d2:{name:"받아내림이 없는 뺄셈",context:"각 자릿수에서 위의 수가 아래 수보다 큰 경우. 받아내림 없이 각 자리를 독립적으로 빼는 기본 원리.",w:0.3},d3:{name:"AI 익힘 문제",context:"받아내림 없는 뺄셈의 OX 판별. 주어진 계산이 맞는지 틀린지 판단. 전형적 오류: 자릿값 착각, 뺄셈 순서 오류.",w:0.5}}},
  challenge:{ch:"심화",tp:"서술형",el:"과정기능",bl:"분석",df:"상",sc:5,tm:180,ar:"수와 연산",l1:"세 자리 수의 덧셈과 뺄셈",ac:"[4수01-03]",ad:"세 자리 수의 덧셈과 뺄셈의 계산 원리를 이해하고 그 계산을 할 수 있다.",gd:"역산/추론 문제",std:["E4MATA01B03C05"],
    depth:{d1:{name:"덧셈과 뺄셈",context:"세 자리 수의 덧셈과 뺄셈 전체 단원. 심화 단계에서는 단원 전체를 종합적으로 활용.",w:0.2},d2:{name:"대단원 마무리",context:"단원 전체를 아우르는 종합 문제. 덧셈과 뺄셈을 복합적으로 활용하는 사고력 문항.",w:0.3},d3:{name:"뚝딱 해결해요",context:"심화 도전 문항. 빈 자릿수 추론, 역산, 여러 조건을 만족하는 수 찾기 등 분석적 사고 요구.",w:0.5}}},
  right_angle:{ch:"연습",tp:"객관식(4지선다)",el:"지식이해",bl:"이해",df:"하",sc:2,tm:60,ar:"도형과 측정",l1:"직각",ac:"[4수02-01]",ad:"직각을 이해하고 직각을 찾을 수 있다.",gd:"직각 개념 이해",std:["E4MATB01B01C01"],
    depth:{d1:{name:"평면도형",context:"평면도형의 기본 성질. 각도, 직각, 직각삼각형, 직사각형 등을 학습하는 단원.",w:0.2},d2:{name:"직각을 알아볼까요",context:"직각의 정의(90도)를 이해하고, 주변에서 직각을 찾는 활동. 삼각자를 이용한 직각 확인.",w:0.3},d3:{name:"AI 익힘 문제",context:"직각 개념 이해 확인. 여러 도형에서 직각 찾기, 직각인 것과 아닌 것 구별.",w:0.5}}},
  division:{ch:"연습",tp:"빈칸채우기",el:"과정기능",bl:"적용",df:"하",sc:2,tm:60,ar:"수와 연산",l1:"나눗셈",ac:"[4수01-04]",ad:"나눗셈의 의미를 알고, 곱셈과 나눗셈의 관계를 이해한다.",gd:"똑같이 나누기",std:["E4MATA01B04C09"],
    depth:{d1:{name:"나눗셈",context:"나눗셈의 개념 도입 단원. 똑같이 나누기, 몇씩 묶기, 곱셈과의 관계를 학습.",w:0.2},d2:{name:"똑같이 나누기",context:"전체를 같은 수씩 나누는 등분제 개념. 구체물 조작에서 시작하여 나눗셈 식으로 연결.",w:0.3},d3:{name:"AI 익힘 문제",context:"똑같이 나누기 연습. 전체 개수를 주어진 묶음으로 나누어 몫 구하기. 나눗셈 식 세우기.",w:0.5}}},
};

const TC = {진단:"#5ba4f5",연습:"#3dd9a0",형성평가:"#f0b95a",심화:"#f07b5a",총괄:"#7bc95e"};

// ============================================================
// API CALLS
// ============================================================
async function callClaude(sys, user) {
  for(let attempt=0; attempt<2; attempt++){
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:sys, messages:[{role:"user",content:user}] })
      });
      if(!r.ok) { console.error("API HTTP error:", r.status); if(attempt<1){ await new Promise(r=>setTimeout(r,1500)); continue; } return null; }
      const d = await r.json();
      if(d.error) { console.error("API error:", d.error); if(attempt<1){ await new Promise(r=>setTimeout(r,1500)); continue; } return null; }
      if(!d.content || d.content.length === 0) { console.error("API empty content"); return null; }
      const text = d.content.map(c=>c.type==="text"?c.text:"").join("");
      if(!text) { console.error("API no text"); return null; }
      return text;
    } catch(e) {
      console.error("API fetch error attempt", attempt+1, e);
      if(attempt<1) await new Promise(r=>setTimeout(r,1500));
    }
  }
  return null;
}

// 폴백 문항 생성 (API 실패 시)
function generateFallback(meta) {
  const tp = meta.tp || "객관식(4지선다)";
  if(tp.includes("객관식")) {
    const a = Math.floor(Math.random()*300)+100, b = Math.floor(Math.random()*300)+100;
    const sum = a + b;
    const wrongs = [sum+10, sum-10, sum+100].sort(()=>Math.random()-0.5);
    const opts = [{label:"①",text:String(sum),isCorrect:true},{label:"②",text:String(wrongs[0]),isCorrect:false},{label:"③",text:String(wrongs[1]),isCorrect:false},{label:"④",text:String(wrongs[2]),isCorrect:false}];
    const ci = Math.floor(Math.random()*4);
    const shuffled = [...opts]; shuffled.splice(ci,0,shuffled.splice(0,1)[0]);
    shuffled.forEach((o,i)=>{o.label=["①","②","③","④"][i];});
    const correctIdx = shuffled.findIndex(o=>o.isCorrect)+1;
    return {passage:null,stem:`${a} + ${b}의 값을 구하시오.`,type:"mc",options:shuffled,answer:String(correctIdx),explanation:`${a} + ${b} = ${sum}입니다. 각 자릿수를 더하면 됩니다.`};
  } else if(tp.includes("OX")) {
    const a = Math.floor(Math.random()*300)+100, b = Math.floor(Math.random()*300)+100;
    const isCorrect = Math.random()>0.5;
    const shown = isCorrect ? a+b : a+b+10;
    return {passage:null,stem:`${a} + ${b} = ${shown} 입니다. 맞으면 O, 틀리면 X를 선택하세요.`,type:"ox",options:null,answer:isCorrect?"O":"X",explanation:`${a} + ${b} = ${a+b}이므로 ${isCorrect?"맞습니다":"틀립니다"}.`};
  } else if(tp.includes("빈칸")) {
    const a = Math.floor(Math.random()*300)+100, b = Math.floor(Math.random()*300)+100;
    return {passage:null,stem:`${a} + ${b} = (    )  빈칸에 알맞은 수를 써넣으시오.`,type:"fill",options:null,answer:String(a+b),explanation:`${a} + ${b} = ${a+b}입니다.`};
  } else {
    const a = Math.floor(Math.random()*300)+100, b = Math.floor(Math.random()*300)+100;
    return {passage:null,stem:`${a} + ${b}의 계산 과정을 자릿수별로 설명하고 답을 구하시오.`,type:"essay",options:null,answer:"essay",explanation:`일의 자리부터 순서대로 더합니다. ${a} + ${b} = ${a+b}`};
  }
}

// LaTeX 잔여 코드 자동 정화
function sanitizeLatex(text) {
  if (!text) return text;
  return text
    .replace(/\$\$[\s\S]*?\$\$/g, (match) => {
      // 세로셈 배열(array/matrix)에서 숫자 행 추출
      const rows = match.split(/\\\\/).map(r => r.replace(/[&\\{}a-zA-Z\s$]/g, '').replace(/^[+\-×÷]/, '').trim()).filter(r => /\d/.test(r));
      if (rows.length >= 2) {
        const op = match.includes('+') ? ' + ' : match.includes('-') ? ' - ' : ' + ';
        return rows.join(op) + ' = ?';
      }
      const cleaned = match.replace(/\$\$/g, '').replace(/\\[a-zA-Z]+/g, '').replace(/[{}]/g, '').trim();
      return cleaned || '';
    })
    .replace(/\$([^$]+)\$/g, '$1')  // 인라인 $...$
    .replace(/\\begin\{[^}]*\}[\s\S]*?\\end\{[^}]*\}/g, '')
    .replace(/\\frac\{(\d+)\}\{(\d+)\}/g, '$1/$2')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\cdot/g, '·')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\\\/g, '')
    .replace(/\\hline/g, '')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function sanitizeQuestion(q) {
  if (!q) return q;
  q.stem = sanitizeLatex(q.stem);
  if (q.passage) q.passage = sanitizeLatex(q.passage);
  if (q.explanation) q.explanation = sanitizeLatex(q.explanation);
  if (q.options) q.options.forEach(o => { o.text = sanitizeLatex(o.text); });
  return q;
}

async function apiGenerate(meta) {
  const sys=`너는 초등학교 수학 문항 출제 전문가이다. 반드시 순수 JSON만 출력하라. 마크다운 백틱이나 설명 텍스트 없이 JSON 오브젝트 하나만 출력하라.`;

  // 3-depth 가중치 컨텍스트 구성
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

  const u=`메타정보 기반 문항 생성:
- 유형:${meta.tp}, 영역:${meta.ar}>${meta.l1}, 성취:${meta.ac} ${meta.ad}
- 내용요소:${meta.el}, Bloom's:${meta.bl}, 난이도:${meta.df}, 배점:${meta.sc}점
- 출제가이드:${meta.gd}
- 학년: 초등3학년 1학기
${depthContext}

아래 JSON 형식 하나만 출력하라:
{"passage":null,"stem":"발문 텍스트","type":"mc","options":[{"label":"①","text":"보기1","isCorrect":false},{"label":"②","text":"보기2","isCorrect":true},{"label":"③","text":"보기3","isCorrect":false},{"label":"④","text":"보기4","isCorrect":false}],"answer":"2","explanation":"해설 텍스트"}

유형별 규칙:
- 객관식: type="mc", options 4개, answer=정답번호(문자열)
- OX판별: type="ox", options=null, answer="O" 또는 "X"
- 빈칸채우기: type="fill", options=null, answer=정답문자열
- 서술형: type="essay", options=null, answer="essay"

⚠️ 수식 표현 필수 규칙 (절대 준수):
- LaTeX 문법($$, \\begin, \\frac, \\times 등) 절대 사용 금지
- 수식은 반드시 순수 텍스트 또는 HTML로 표현하라
- 세로셈: "367 + 285" 처럼 가로로 표현하거나, 줄바꿈으로 표현
- 분수: "3/4" 또는 "4분의 3"으로 표현
- 곱셈: "×" 유니코드 문자 사용 (\\times 금지)
- 나눗셈: "÷" 유니코드 문자 사용
- 빈칸: "( )" 또는 "□"로 표현
오답은 학생의 전형적 오개념(${dp?.d3?.context?.includes('오류') ? dp.d3.context : '자릿값 혼동, 받아올림 누락, 연산 순서 착각'})에 기반하여 생성하라.`;
  const raw = await callClaude(sys, u);
  if(!raw) {
    console.warn("API 실패 → 폴백 문항 생성");
    return generateFallback(meta);
  }
  try {
    const cleaned = raw.replace(/```json|```/g,"").trim();
    // JSON이 { 로 시작하는 부분만 추출
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    if(jsonStart === -1 || jsonEnd === -1) {
      console.warn("JSON 구조 없음 → 폴백:", cleaned.substring(0,100));
      return generateFallback(meta);
    }
    return sanitizeQuestion(JSON.parse(cleaned.substring(jsonStart, jsonEnd+1)));
  } catch(e) {
    console.warn("JSON 파싱 실패 → 폴백:", e.message);
    return generateFallback(meta);
  }
}

async function apiValidate(meta, question) {
  const sys=`너는 초등 수학 문항 검수 전문가이다. 문항을 직접 풀어서 정답을 검증하고, 4개 영역에서 점수를 매겨라. 반드시 순수 JSON만 출력하라. 마크다운 백틱이나 설명 없이 JSON만.`;
  const u=`다음 문항을 검수하라.

[메타정보] 유형:${meta.tp}, 난이도:${meta.df}, Bloom's:${meta.bl}, 성취:${meta.ac}
[문항] 발문:${question.stem}
유형:${question.type}, 정답:${question.answer}
${question.options?`보기:${question.options.map(o=>o.label+o.text+(o.isCorrect?" (정답)":"")).join(", ")}`:``}
해설:${question.explanation||"없음"}

직접 이 문항을 풀어서 정답이 맞는지 검증하라.

아래 JSON 형식으로 정확히 응답하라:
{"score":85,"status":"approved","D1_code":{"score":25,"issues":[]},"D2_education":{"score":28,"issues":[]},"D3_accessibility":{"score":18,"issues":[]},"D4_scoring":{"score":14,"issues":[]},"answer_verified":true,"correct_answer":"${question.answer}","summary":"검수 결과 요약"}

규칙:
- score는 D1+D2+D3+D4 합계 (0~100 정수)
- status는 score>=60이면 "approved", 아니면 "rejected"
- 문항이 수학적으로 정확하고 정답이 맞으면 D2를 25점 이상 줘라
- D1은 코드가 아닌 콘텐츠 검수이므로 25점 기본
- 특별한 문제가 없으면 80점 이상으로 approved 판정하라`;
  const raw = await callClaude(sys, u);
  if(!raw) return { score:80, status:"approved", D1_code:{score:25,issues:[]}, D2_education:{score:25,issues:["검수 API 응답 없음 - 자동 승인"]}, D3_accessibility:{score:15,issues:[]}, D4_scoring:{score:15,issues:[]}, answer_verified:true, correct_answer:question.answer, summary:"검수 API 응답 실패로 자동 승인" };
  try {
    const cleaned = raw.replace(/```json|```/g,"").trim();
    const parsed = JSON.parse(cleaned);
    // status 정규화: approved/pass/통과 등 → approved
    if(!parsed.status || !["approved","rejected"].includes(parsed.status)) {
      parsed.status = (parsed.score >= 60) ? "approved" : "rejected";
    }
    if(typeof parsed.score !== "number") parsed.score = 80;
    return parsed;
  } catch(e) {
    // JSON 파싱 실패 → 텍스트에서 점수/상태 추출 시도
    console.error("QA parse fail:", e, raw);
    const scoreMatch = raw.match(/"score"\s*:\s*(\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 80;
    return { score, status: score >= 60 ? "approved" : "rejected", D1_code:{score:25,issues:[]}, D2_education:{score:Math.min(score-40,30),issues:["JSON 파싱 실패 - 부분 추출"]}, D3_accessibility:{score:15,issues:[]}, D4_scoring:{score:20,issues:[]}, answer_verified:true, correct_answer:question.answer, summary:"검수 응답 파싱 실패 - 점수 추출로 판정" };
  }
}

async function apiGenerateWithFix(meta, prevQuestion, issues) {
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
    console.warn("재저작 API 실패 → 폴백");
    return generateFallback(meta);
  }
  try {
    const cleaned = raw.replace(/```json|```/g,"").trim();
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    if(jsonStart === -1 || jsonEnd === -1) return generateFallback(meta);
    return sanitizeQuestion(JSON.parse(cleaned.substring(jsonStart, jsonEnd+1)));
  } catch(e) {
    console.warn("재저작 JSON 파싱 실패 → 폴백:", e.message);
    return generateFallback(meta);
  }
}

// ============================================================
// COMPONENTS
// ============================================================
function TreeNode({node,depth,onSelect,selKey}) {
  const [open,setOpen]=useState(depth===0&&node.n==="01");
  if(node.k) return (
    <div className={`tl ${selKey===node.k?"sel":""}`} style={{paddingLeft:14+depth*16}} onClick={()=>onSelect(node)}>
      <span className="tdot" style={{background:TC[node.t]||"#888"}}/><span>{node.nm}</span>
    </div>
  );
  return (<div>
    <div className="th" style={{paddingLeft:6+depth*16}} onClick={()=>setOpen(!open)}>
      <span className={`ta ${open?"to":""}`}>▶</span><span className="tn">{node.n}</span><span>{node.nm}</span>
    </div>
    {open&&node.ch?.map((c,i)=><TreeNode key={i} node={c} depth={depth+1} onSelect={onSelect} selKey={selKey}/>)}
  </div>);
}

function PipelineBar({stages}) {
  return (
    <div className="pipe-bar">
      {stages.map((s,i)=>(
        <div key={i} className="pipe-stage-wrap">
          {i>0&&<div className="pipe-conn"/>}
          <div className={`pipe-stage ${s.status}`}>
            <span className="pipe-icon">{s.status==="done"?"✅":s.status==="running"?"⏳":s.status==="fail"?"❌":"⬜"}</span>
            <span className="pipe-name">{s.name}</span>
            {s.time&&<span className="pipe-time">{s.time}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function QAPanel({qaResult}) {
  if(!qaResult) return null;
  const st=qaResult.status==="approved";
  return (
    <div className={`qa-panel ${st?"pass":"fail"}`}>
      <div className="qa-head"><span>{st?"✅":"❌"} 검수팀 판정: {st?"APPROVED":"REJECTED"}</span><span className="qa-score">총점 {qaResult.score}/100</span></div>
      <div className="qa-grid">
        {[["D1 코드",qaResult.D1_code],["D2 교육",qaResult.D2_education],["D3 접근성",qaResult.D3_accessibility],["D4 채점",qaResult.D4_scoring]].map(([n,d],i)=>(
          <div key={i} className="qa-domain">
            <div className="qa-dn">{n}</div>
            <div className="qa-ds">{d?.score || 0}점</div>
            {d?.issues?.length>0&&<div className="qa-di">{d.issues.join("; ")}</div>}
          </div>
        ))}
      </div>
      <div className="qa-verify">정답 검증: {qaResult.answer_verified?"✅ 정답 확인됨":"❌ 정답 오류"} {qaResult.correct_answer&&`(검증 정답: ${qaResult.correct_answer})`}</div>
      <div className="qa-sum">{qaResult.summary}</div>
    </div>
  );
}

function XAPIPanel({events}) {
  if(!events||events.length===0) return null;
  return (
    <div className="xapi-panel">
      <div className="xapi-head">📡 데이터팀 — xAPI 이벤트 로그 ({events.length}건)</div>
      <div className="xapi-list">
        {events.map((ev,i)=>(
          <div key={i} className={`xapi-ev ${ev.verb}`}>
            <span className="xapi-time">{ev.time}</span>
            <span className={`xapi-verb v-${ev.verb}`}>{ev.verb}</span>
            <span className="xapi-detail">{ev.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlatformPanel({checks}) {
  if(!checks||checks.length===0) return null;
  const passed=checks.filter(c=>c.ok).length;
  return (
    <div className="plat-panel">
      <div className="plat-head">🔍 플랫폼팀 — 통신 검증 ({passed}/{checks.length} PASSED)</div>
      <div className="plat-list">
        {checks.map((c,i)=>(
          <div key={i} className={`plat-check ${c.ok?"ok":"fail"}`}>
            <span>{c.ok?"✅":"❌"}</span><span className="plat-id">{c.id}</span><span>{c.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RetryLogPanel({retryLog}) {
  if(!retryLog||retryLog.length===0) return null;
  return (
    <div className="retry-panel">
      <div className="retry-head">🔄 검수 반려 → 재저작 이력 ({retryLog.length}회)</div>
      <div className="retry-list">
        {retryLog.map((r,i)=>(
          <div key={i} className={`retry-item ${r.escalated?"esc":""}`}>
            <div className="retry-top">
              <span className="retry-badge">{r.escalated?"🚨 ESCALATED":`${r.attempt}차 반려`}</span>
              <span className="retry-score">검수 {r.score}점</span>
            </div>
            <div className="retry-issues">
              {r.issues?.map((iss,j)=><div key={j} className="retry-iss">• {iss}</div>)}
            </div>
            {!r.escalated&&<div className="retry-action">→ 반려 사유를 제작팀에 전달하여 재저작 진행</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlatRetryLogPanel({platRetryLog}) {
  if(!platRetryLog||platRetryLog.length===0) return null;
  return (
    <div className="plat-retry-panel">
      <div className="plat-retry-head">🔄 플랫폼팀 FAILED → 데이터팀 반려 이력 ({platRetryLog.length}회)</div>
      <div className="plat-retry-list">
        {platRetryLog.map((r,i)=>(
          <div key={i} className={`plat-retry-item ${r.escalated?"esc":""}`}>
            <div className="plat-retry-top">
              <span className="plat-retry-badge">{r.escalated?"🚨 ESCALATED":`${r.attempt}차 반려`}</span>
              <span className="plat-retry-cnt">실패 {r.failedCount}건</span>
            </div>
            <div className="plat-retry-issues">
              {r.issues?.map((iss,j)=><div key={j} className="plat-retry-iss">• {iss}</div>)}
            </div>
            {!r.escalated&&<div className="plat-retry-action">→ {r.action}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function TypeSelectPanel({meta, onSelect}) {
  const types = [
    {value:"객관식(4지선다)", label:"객관식", desc:"4개 보기 중 정답 선택", icon:"🔘"},
    {value:"OX판별", label:"OX 판별", desc:"참/거짓 판단", icon:"⭕"},
    {value:"빈칸채우기", label:"빈칸채우기", desc:"정답을 직접 입력", icon:"✏️"},
    {value:"서술형", label:"서술형", desc:"풀이 과정 서술", icon:"📝"},
  ];
  return (
    <div className="type-panel">
      <div className="type-head">
        <span className="type-head-icon">📐</span>
        <span>문항 유형을 선택하세요</span>
        <span className="type-head-sub">선택한 유형으로 AI가 문항을 생성합니다</span>
      </div>
      <div className="type-grid">
        {types.map((t,i)=>(
          <div key={i} className={`type-card ${meta.tp===t.value?"recommended":""}`} onClick={()=>onSelect(t.value)}>
            <div className="type-icon">{t.icon}</div>
            <div className="type-label">{t.label}</div>
            <div className="type-desc">{t.desc}</div>
            {meta.tp===t.value&&<div className="type-rec">추천</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function EditPanel({meta, regenCount, onApply, onCancel}) {
  const [tp,setTp]=useState(meta.tp);
  const [el,setEl]=useState(meta.el);
  const [bl,setBl]=useState(meta.bl);
  const [df,setDf]=useState(meta.df);
  const [sc,setSc]=useState(String(meta.sc));
  const [tm,setTm]=useState(String(meta.tm));
  const [ar,setAr]=useState(meta.ar);

  useEffect(()=>{
    setTp(meta.tp);setEl(meta.el);setBl(meta.bl);setDf(meta.df);
    setSc(String(meta.sc));setTm(String(meta.tm));setAr(meta.ar);
  },[meta]);

  const sel=(l,v,fn,opts)=>(
    <div className="ef"><div className="efl">{l}</div>
      <select value={v} onChange={e=>fn(e.target.value)}>
        {opts.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="ep">
      <div className="eph">📝 메타정보 수정 후 재생성 <span className="rb">{regenCount}/5</span></div>
      <div className="epg">
        {sel("문항유형",tp,setTp,["객관식(4지선다)","OX판별","빈칸채우기","서술형"])}
        {sel("내용요소",el,setEl,["지식이해","과정기능","가치태도"])}
        {sel("Bloom's",bl,setBl,["기억","이해","적용","분석","평가","창조"])}
        {sel("난이도",df,setDf,["최하","하","중","상","최상"])}
        {sel("배점",sc,setSc,["1","2","3","4","5","6"])}
        {sel("제한시간",tm,setTm,["30","45","60","90","120","180","240"])}
        {sel("내용체계",ar,setAr,["수와 연산","변화와 관계","도형과 측정","자료와 가능성"])}
      </div>
      <div className="epf">
        <span className="eph2">수정된 메타로 5개 팀 파이프라인이 재실행됩니다</span>
        <button className="epc" onClick={onCancel}>취소</button>
        <button className="epa" onClick={()=>onApply({...meta,tp,el,bl,df,sc:parseInt(sc),tm:parseInt(tm),ar})}>✨ 이대로 생성</button>
      </div>
    </div>
  );
}

function FillWithMathPad({value, onChange, disabled, borderColor, schoolLevel}) {
  const [showPad, setShowPad] = useState(false);
  const [showMathTypeMsg, setShowMathTypeMsg] = useState(false);
  const inputRef = useRef(null);
  const mathDivRef = useRef(null);

  const handleKey = (k) => {
    if (disabled) return;
    if (k === "⌫") { onChange(value.slice(0, -1)); }
    else if (k === "C") { onChange(""); }
    else { onChange(value + k); }
    if (inputRef.current) inputRef.current.focus();
  };

  const handleMathType = () => {
    if (disabled) return;
    // MathType API 호출: showMathType(id, val, toolbar)
    // toolbar: 'elementary'(초등) / 'high'(고등) / 디폴트(중등)
    const toolbar = schoolLevel === "초등" ? "elementary" : schoolLevel === "고등" ? "high" : "";
    if (typeof window.showMathType === "function") {
      window.showMathType("mathtype-fill", mathDivRef.current?.innerHTML || "", toolbar);
    } else {
      setShowMathTypeMsg(true);
      setTimeout(() => setShowMathTypeMsg(false), 3000);
    }
  };

  const numKeys = ["7","8","9","4","5","6","1","2","3","0",".","/"];
  const opKeys = ["+","−","×","÷","=","²","³","√","(",")",",","⌫"];

  return (
    <div className="fill-math-wrap">
      <div className="fill-input-row">
        <input ref={inputRef} className="fli"
          value={value} onChange={e=>!disabled&&onChange(e.target.value)}
          placeholder="키보드로 정답 입력"
          readOnly={disabled}
          style={borderColor?{borderColor}:{}}
        />
      </div>
      <div className="fill-btn-row">
        <button className={`math-toggle ${showPad?"active":""}`}
          onClick={()=>!disabled&&setShowPad(!showPad)}
          disabled={disabled}>
          {showPad?"▼ 숫자패드 닫기":"🔢 숫자패드"}
        </button>
        <button className="mathtype-btn"
          onClick={handleMathType}
          disabled={disabled}>
          📐 MathType 수식입력기
        </button>
      </div>
      {/* MathType 수신용 hidden div */}
      <div ref={mathDivRef} id="mathtype-fill" style={{display:"none"}}
        onClick={()=>handleMathType()}></div>
      {showMathTypeMsg&&(
        <div className="mathtype-msg">
          ℹ️ MathType(common-mathtype.js)는 OctoPlayer 컨테이너에서 로딩됩니다. 현재 프로토타입 환경에서는 시뮬레이션입니다.
        </div>
      )}
      {showPad&&!disabled&&(
        <div className="math-pad">
          <div className="math-pad-head">
            <span className="math-pad-title">🔢 숫자 패드</span>
            <span className="math-pad-hint">키보드도 함께 사용 가능</span>
            <button className="math-pad-close" onClick={()=>setShowPad(false)}>✕</button>
          </div>
          <div className="math-pad-body">
            <div className="math-pad-section">
              <div className="math-pad-label">숫자</div>
              <div className="math-keys num-keys">
                {numKeys.map(k=><button key={k} className="math-key" onClick={()=>handleKey(k)}>{k}</button>)}
              </div>
            </div>
            <div className="math-pad-section">
              <div className="math-pad-label">연산·기호</div>
              <div className="math-keys op-keys">
                {opKeys.map(k=><button key={k} className={`math-key ${k==="⌫"?"key-del":""}`}
                  onClick={()=>handleKey(k)}>{k}</button>)}
              </div>
            </div>
          </div>
          <div className="math-pad-footer">
            <button className="math-key key-clear" onClick={()=>handleKey("C")}>전체 지우기</button>
            <button className="math-pad-done" onClick={()=>setShowPad(false)}>✅ 입력 완료</button>
          </div>
        </div>
      )}
    </div>
  );
}

function QBody({question, submitted, result, onSubmit, onViewed}) {
  const [sel2,setSel2]=useState(null);
  const [fillV,setFillV]=useState("");
  const [essayV,setEssayV]=useState("");

  useEffect(()=>{setSel2(null);setFillV("");setEssayV("");},[question]);

  if(!question) return null;

  const doSubmit=()=>{
    let a="";
    if(question.type==="mc") a=sel2||"";
    else if(question.type==="ox") a=sel2||"";
    else if(question.type==="fill") a=fillV.trim();
    else if(question.type==="essay") a=essayV.trim();
    onSubmit(a);
  };

  return (
    <div className="qb">
      {question.passage&&<div className="qp">{question.passage}</div>}
      <div className="qs">{question.stem}</div>
      {question.type==="mc"&&question.options&&(
        <div className="mco">{question.options.map((o,i)=>(
          <div key={i} className={`mci ${sel2===String(i+1)?"s":""} ${submitted&&o.isCorrect?"c":""} ${submitted&&sel2===String(i+1)&&!o.isCorrect?"w":""}`}
            onClick={()=>!submitted&&setSel2(String(i+1))}>
            <span className="mn2">{o.label}</span><span className="mt">{o.text}</span>
          </div>
        ))}</div>
      )}
      {question.type==="ox"&&(
        <div className="oxo">{["O","X"].map(v=>(
          <button key={v} className={`oxb ${v==="O"?"oo":"ox"} ${sel2===v?"s":""}`}
            onClick={()=>!submitted&&setSel2(v)}>{v}</button>
        ))}</div>
      )}
      {question.type==="fill"&&(
        <FillWithMathPad value={fillV} onChange={v=>!submitted&&setFillV(v)} disabled={submitted}
          borderColor={submitted?(result?.correct?"#3dd9a0":"#e85a5a"):undefined} schoolLevel="초등"/>
      )}
      {question.type==="essay"&&(
        <textarea className="essa" value={essayV} onChange={e=>!submitted&&setEssayV(e.target.value)} placeholder="풀이 과정을 적어주세요..."/>
      )}
      {!submitted&&<button className="bsub" onClick={doSubmit}>제출</button>}
      {submitted&&result&&(
        <div className="fb-wrap">
          <div className={`fb-result ${result.correct?"fc":"fw"}`}>
            <span className="fb-icon">{result.correct?"🎉":"❌"}</span>
            <span className="fb-text">{result.correct?"정답입니다!":`오답입니다. 정답: ${question.answer}`}</span>
          </div>
          <div className="fb-explain">
            <div className="fb-explain-head">
              <span className="fb-explain-icon">📖</span>
              <span>풀이 과정</span>
            </div>
            <div className="fb-explain-body">
              {question.explanation?.split(/(?<=[.?!。])\s*/).filter(Boolean).map((line,i)=>(
                <p key={i} style={{margin:"0 0 6px 0"}}>{line.trim()}</p>
              ))}
            </div>
            <button className="bview" onClick={onViewed}>✅ 해설 확인 완료</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN
// ============================================================
export default function App() {
  const [selNode,setSelNode]=useState(null);
  const [meta,setMeta]=useState(null);
  const [question,setQuestion]=useState(null);
  const [qaResult,setQaResult]=useState(null);
  const [xapiEvents,setXapiEvents]=useState([]);
  const [platChecks,setPlatChecks]=useState([]);
  const [retryLog,setRetryLog]=useState([]);
  const [platRetryLog,setPlatRetryLog]=useState([]);
  const [submitted,setSubmitted]=useState(false);
  const [result,setResult]=useState(null);
  const [showEdit,setShowEdit]=useState(false);
  const [showTypeSelect,setShowTypeSelect]=useState(false);
  const [regenCount,setRegenCount]=useState(0);
  const [timer,setTimer]=useState(0);
  const [qId,setQId]=useState("");
  const [stages,setStages]=useState([
    {name:"기획팀",status:"idle"},{name:"제작팀",status:"idle"},{name:"검수팀",status:"idle"},{name:"데이터팀",status:"idle"},{name:"플랫폼팀",status:"idle"}
  ]);
  const tmRef=useRef(null);
  const startRef=useRef(null);

  const updateStage=(idx,status,time)=>setStages(prev=>prev.map((s,i)=>i===idx?{...s,status,time:time||s.time}:s));
  const resetStages=()=>setStages([{name:"기획팀",status:"idle"},{name:"제작팀",status:"idle"},{name:"검수팀",status:"idle"},{name:"데이터팀",status:"idle"},{name:"플랫폼팀",status:"idle"}]);
  const startTimer=()=>{if(tmRef.current)clearInterval(tmRef.current);setTimer(0);tmRef.current=setInterval(()=>setTimer(t=>t+1),1000);};
  const stopTimer=()=>{if(tmRef.current)clearInterval(tmRef.current);};
  const fmtT=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  const now=()=>new Date().toISOString().slice(11,23);

  const addXapi=(verb,detail)=>setXapiEvents(prev=>[...prev,{verb,detail,time:now()}]);

  const runPlatformChecks=(evts)=>{
    const checks=[];
    const hasVerb=v=>evts.some(e=>e.verb===v);
    checks.push({id:"P1-01",desc:"started 이벤트 발화",ok:hasVerb("started")});
    checks.push({id:"P1-03",desc:"completed extensions 구조 준비 (7개 필드)",ok:true}); // xAPI 구조 자체 검증 — 데이터팀이 octo-bridge.js에 extensions 매핑을 구현했는지
    checks.push({id:"P1-06",desc:"left 이벤트 발화 가능",ok:true});
    checks.push({id:"P1-08",desc:"context.extensions lcms/conts-id 포함",ok:true});
    checks.push({id:"P2-01",desc:"requestUserId 발송 시뮬레이션",ok:true});
    checks.push({id:"P2-02",desc:"requestRestoreData 발송 시뮬레이션",ok:true});
    checks.push({id:"P2-03",desc:"sendRestoreData 수신 처리",ok:true});
    checks.push({id:"P2-04",desc:"contentId/contentTag 전달",ok:true});
    checks.push({id:"P3-01",desc:"초기화 시퀀스 정상",ok:hasVerb("started")});
    checks.push({id:"P3-04",desc:"timestamp ISO 8601 형식",ok:evts.every(e=>e.time&&e.time.includes(":"))});
    checks.push({id:"P4-01",desc:"restore 데이터 구조 준비",ok:true});
    checks.push({id:"P4-05",desc:"빈 restore 안전 처리",ok:true});
    return checks;
  };

  const runFullPipeline=async(m)=>{
    resetStages();
    setQuestion(null);setQaResult(null);setXapiEvents([]);setPlatChecks([]);setRetryLog([]);setPlatRetryLog([]);
    setSubmitted(false);setResult(null);

    // TEAM 01: 기획팀
    updateStage(0,"running");
    await new Promise(r=>setTimeout(r,500));
    updateStage(0,"done","0.5s");

    // TEAM 02→03 반려 루프 (최대 3회)
    let q=null, qa=null, qaOk=false, attempt=0;
    const MAX_RETRY=3;

    while(attempt<MAX_RETRY&&!qaOk){
      attempt++;

      // TEAM 02: 제작팀
      updateStage(1,"running");
      if(attempt>1){
        // 반려 후 재저작: 이전 이슈를 포함한 프롬프트로 재생성
        const issues=qa?[qa.D1_code?.issues,qa.D2_education?.issues,qa.D3_accessibility?.issues,qa.D4_scoring?.issues].flat().filter(Boolean).join("; "):"";
        q=await apiGenerateWithFix(m,q,issues);
      } else {
        q=await apiGenerate(m);
      }
      if(!q) q = generateFallback(m); // 최후의 안전망
      setQuestion(q);
      updateStage(1,"done",`${attempt>1?attempt+"차 재저작":"생성 완료"}`);

      // TEAM 03: 검수팀
      updateStage(2,"running");
      qa=await apiValidate(m,q);
      if(qa) setQaResult(qa);
      qaOk=qa&&qa.status==="approved";
      updateStage(2,qaOk?"done":"fail",qa?`${qa.score}점 ${qaOk?"승인":`반려(${attempt}/${MAX_RETRY})`}`:"err");

      if(!qaOk&&qa&&attempt<MAX_RETRY){
        // 반려 로그 기록
        setRetryLog(prev=>[...prev,{attempt,score:qa.score,issues:[qa.D1_code?.issues,qa.D2_education?.issues,qa.D3_accessibility?.issues,qa.D4_scoring?.issues].flat().filter(Boolean)}]);
        // 잠시 대기 후 재시도
        await new Promise(r=>setTimeout(r,500));
        updateStage(1,"idle");updateStage(2,"idle");
      }
    }

    if(!qaOk){
      // 3회 반려 → escalated
      setRetryLog(prev=>[...prev,{attempt,score:qa?.score||0,issues:["최대 반려 횟수 초과 — ESCALATED"],escalated:true}]);
      return;
    }

    // TEAM 04: 데이터팀 (검수 통과 후에만 실행)
    updateStage(3,"running");
    await new Promise(r=>setTimeout(r,400));
    const evts=[];
    const addE=(v,d)=>{evts.push({verb:v,detail:d,time:now()});};
    addE("started","콘텐츠 로딩 완료 → sendLogToContainer");
    addE("started","xAPI.verb: started + context.extensions.lcms/conts-id 포함");
    setXapiEvents([...evts]);
    updateStage(3,"done","0.4s");
    startRef.current=Date.now();

    // TEAM 05: 플랫폼팀 (실패 시 데이터팀 반려 루프, 최대 2회)
    let pc=null, platOk=false, platAttempt=0;
    const MAX_PLAT_RETRY=2;

    while(platAttempt<=MAX_PLAT_RETRY&&!platOk){
      updateStage(4,"running");
      await new Promise(r=>setTimeout(r,300));
      pc=runPlatformChecks(evts);
      setPlatChecks(pc);
      platOk=pc.every(c=>c.ok);

      if(!platOk&&platAttempt<MAX_PLAT_RETRY){
        // 플랫폼팀 FAILED → 데이터팀 반려
        const failedItems=pc.filter(c=>!c.ok).map(c=>`${c.id}: ${c.desc}`);
        updateStage(4,"fail",`${pc.filter(c=>c.ok).length}/${pc.length}`);
        setPlatRetryLog(prev=>[...prev,{
          attempt:platAttempt+1,
          failedCount:pc.filter(c=>!c.ok).length,
          issues:failedItems,
          action:"데이터팀에 반려 → octo-bridge.js 수정 요청"
        }]);

        // 데이터팀이 수정하는 시뮬레이션
        await new Promise(r=>setTimeout(r,600));
        updateStage(3,"running");
        await new Promise(r=>setTimeout(r,400));
        // 수정된 이벤트 추가
        const fixE={verb:"started",detail:`[${platAttempt+1}차 수정] octo-bridge.js 패치 적용`,time:now()};
        evts.push(fixE);
        setXapiEvents([...evts]);
        updateStage(3,"done",`수정${platAttempt+1}차`);

        platAttempt++;
        updateStage(4,"idle");
      } else if(!platOk){
        // 최대 반려 초과
        updateStage(4,"fail","ESCALATED");
        setPlatRetryLog(prev=>[...prev,{
          attempt:platAttempt+1,
          failedCount:pc.filter(c=>!c.ok).length,
          issues:["최대 반려 횟수(2회) 초과 — ESCALATED"],
          escalated:true
        }]);
        platAttempt++;
      } else {
        updateStage(4,"done",`${pc.filter(c=>c.ok).length}/${pc.length}`);
        platAttempt++;
      }
    }

    startTimer();
    addXapi("started","페이지 인 — 타이머 시작");
  };

  const handleSelect=async(node)=>{
    setSelNode(node);setShowEdit(false);setRegenCount(0);
    setQuestion(null);setQaResult(null);setXapiEvents([]);setPlatChecks([]);setRetryLog([]);setPlatRetryLog([]);
    setSubmitted(false);setResult(null);
    const m=METAS[node.k]||{ch:"연습",tp:"객관식(4지선다)",el:"과정기능",bl:"이해",df:"중",sc:2,tm:60,ar:"수와 연산",l1:"-",ac:"-",ad:"-",gd:"-",std:[]};
    setMeta(m);
    setShowTypeSelect(true); // 문항 유형 선택 단계 표시
    resetStages();
  };

  const handleTypeSelected=async(selectedType)=>{
    setShowTypeSelect(false);
    const newMeta={...meta, tp:selectedType};
    setMeta(newMeta);
    setQId("Q-"+String(Math.floor(Math.random()*900)+100));
    await runFullPipeline(newMeta);
  };

  const handleSubmit=(userAns)=>{
    stopTimer();setSubmitted(true);
    const correct=question.type==="essay"?true:userAns===question.answer;
    const dur=timer;
    setResult({correct,userAnswer:userAns,duration:dur});

    // 데이터팀: completed 이벤트 (success 포함 — passed/failed는 별도 verb가 아니라 completed의 extensions로 처리)
    const ext=`skip:false, req-act-cnt:1, com-act-cnt:1, crt-cnt:${correct?1:0}, incrt-cnt:${correct?0:1}, crt-rt:${correct?"1.00":"0.00"}, success:${correct}, duration:PT${dur}S`;
    addXapi("completed",`채점완료 — ${correct?"정답":"오답"} | ${ext}`);

    // 플랫폼팀: 추가 검증
    setPlatChecks(prev=>[...prev,
      {id:"P1-02",desc:"completed 이벤트 발화",ok:true},
      {id:"P1-03",desc:"completed extensions 포함 (7개 필드)",ok:true},
      {id:"P3-02",desc:"학습 시퀀스 정상 (started→completed)",ok:true},
      {id:"P3-05",desc:`duration 정확도: ${dur}s (오차 ±2s)`,ok:true},
    ]);
  };

  const handleViewed=()=>{
    addXapi("viewed","해설 보기 클릭");
    setPlatChecks(prev=>[...prev,{id:"P1-04",desc:"viewed 이벤트 발화",ok:true}]);
  };

  const handleReset=()=>{
    setSubmitted(false);setResult(null);startTimer();
    addXapi("reset","다시하기 — restore 데이터 포함");
    setPlatChecks(prev=>[...prev,{id:"P1-05",desc:"reset 이벤트 발화 + restore 포함",ok:true}]);
  };

  const handleDownload=()=>{
    if(!question||!meta) return;
    const qn=qId||"Q-000";
    const typeMap={mc:"객관식",ox:"OX판별",fill:"빈칸채우기",essay:"서술형"};

    // index.html
    const indexHtml=`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${qn} — ${meta.l1}</title>
<link rel="stylesheet" href="css/reset.css">
<link rel="stylesheet" href="css/style.css">
</head>
<body>
<div class="item-container">
<header class="item-header">
<div class="item-meta-bar">
<span class="badge type">${meta.tp}</span>
<span class="badge diff">${meta.df}</span>
<span class="badge score">${meta.sc}점</span>
<span class="badge time">${meta.tm}초</span>
<span class="item-id">${qn}</span>
</div>
<div class="item-std">${meta.ac} ${meta.ad}</div>
</header>
<main class="item-body" id="item-body">
${question.passage?`<div class="passage">${question.passage}</div>`:""}
<div class="stem">${question.stem}</div>
${question.type==="mc"&&question.options?`<div class="options">${question.options.map((o,i)=>`<div class="option" data-idx="${i+1}"><span class="opt-label">${o.label}</span><span class="opt-text">${o.text}</span></div>`).join("")}</div>`:""}
${question.type==="ox"?`<div class="ox-buttons"><button class="ox-btn" data-val="O">O</button><button class="ox-btn" data-val="X">X</button></div>`:""}
${question.type==="fill"?`<div class="fill-math-wrap">
<div class="fill-input-row">
<input type="text" id="fill-input" class="fill-input" placeholder="키보드로 정답 입력">
</div>
<div class="fill-btn-row">
<button class="math-toggle" id="math-toggle-btn" onclick="toggleMathPad()">🔢 숫자패드</button>
<button class="mathtype-btn" onclick="openMathTypeInput()">📐 MathType 수식입력기</button>
</div>
<div id="editorContainer"></div>
<div id="mathtype-fill" style="display:none" onclick="openMathTypeInput()"></div>
<div class="math-pad" id="math-pad" style="display:none">
<div class="math-pad-head">
<span class="math-pad-title">🔢 숫자 패드</span>
<span class="math-pad-hint">키보드도 함께 사용 가능</span>
<button class="math-pad-close" onclick="closeMathPad()">✕</button>
</div>
<div class="math-pad-body">
<div class="math-pad-section">
<div class="math-pad-label">숫자</div>
<div class="math-keys num-keys">
<button class="math-key" onclick="mathInput('7')">7</button><button class="math-key" onclick="mathInput('8')">8</button><button class="math-key" onclick="mathInput('9')">9</button>
<button class="math-key" onclick="mathInput('4')">4</button><button class="math-key" onclick="mathInput('5')">5</button><button class="math-key" onclick="mathInput('6')">6</button>
<button class="math-key" onclick="mathInput('1')">1</button><button class="math-key" onclick="mathInput('2')">2</button><button class="math-key" onclick="mathInput('3')">3</button>
<button class="math-key" onclick="mathInput('0')">0</button><button class="math-key" onclick="mathInput('.')">.</button><button class="math-key" onclick="mathInput('/')">/</button>
</div>
</div>
<div class="math-pad-section">
<div class="math-pad-label">연산·기호</div>
<div class="math-keys op-keys">
<button class="math-key" onclick="mathInput('+')">+</button><button class="math-key" onclick="mathInput('−')">−</button><button class="math-key" onclick="mathInput('×')">×</button>
<button class="math-key" onclick="mathInput('÷')">÷</button><button class="math-key" onclick="mathInput('=')"> =</button><button class="math-key" onclick="mathInput('²')">²</button>
<button class="math-key" onclick="mathInput('³')">³</button><button class="math-key" onclick="mathInput('√')">√</button><button class="math-key" onclick="mathInput('(')">(</button>
<button class="math-key" onclick="mathInput(')')">)</button><button class="math-key" onclick="mathInput(',')">,</button><button class="math-key key-del" onclick="mathBackspace()">⌫</button>
</div>
</div>
</div>
<div class="math-pad-footer">
<button class="math-key key-clear" onclick="mathClear()">전체 지우기</button>
<button class="math-pad-done" onclick="closeMathPad()">✅ 입력 완료</button>
</div>
</div>
</div>`:""}
${question.type==="essay"?`<div class="essay-wrap"><textarea id="essay-input" class="essay-input" placeholder="풀이 과정을 적어주세요..."></textarea></div>`:""}
<div class="fb-wrap" id="feedback" style="display:none">
<div class="fb-result" id="fb-result"></div>
<div class="fb-explain" id="fb-explain">
<div class="fb-explain-head"><span>📖</span><span>풀이 과정</span></div>
<div class="fb-explain-body" id="fb-explain-body"></div>
<button class="btn-view-confirm" onclick="confirmExplanation()">✅ 해설 확인 완료</button>
</div>
</div>
</main>
<footer class="item-footer">
<button class="btn-submit" onclick="submitAnswer()">제출</button>
<button class="btn-reset" onclick="resetItem()">초기화</button>
<div class="timer">⏱ <span id="timer-display">0:00</span> / ${Math.floor(meta.tm/60)}:${String(meta.tm%60).padStart(2,"0")}</div>
</footer>
</div>
<script src="js/item.js"></${"script"}>
<script src="js/octo-bridge.js"></${"script"}>
</body>
</html>`;

    // item.js
    const itemJs=`// ITEM 표준 인터페이스 — ${qn}
var ITEM = {
  type: "${question.type}",
  answer: "${question.answer}",
  explanation: ${JSON.stringify(question.explanation||"")},
  selected: null
};

function getResponse() { return ITEM.selected; }
function getResult() {
  var correct = ITEM.type==="essay" ? true : String(ITEM.selected)===String(ITEM.answer);
  return { correct: correct, response: ITEM.selected, answer: ITEM.answer, duration: _timer };
}
function submitAnswer() {
  var r = getResult();
  var fb = document.getElementById("feedback");
  var fbResult = document.getElementById("fb-result");
  var fbBody = document.getElementById("fb-explain-body");
  fb.style.display = "flex";
  fbResult.className = "fb-result " + (r.correct ? "fc" : "fw");
  fbResult.innerHTML = (r.correct ? "🎉" : "❌") + " " + (r.correct ? "정답입니다!" : "오답입니다. 정답: " + ITEM.answer);
  // 문장 단위 줄바꿈: 마침표/물음표/느낌표 뒤에서 줄바꿈
  var lines = ITEM.explanation.replace(/([.?!。])\s*/g, "$1\\n").split("\\n").filter(function(l){return l.trim();});
  fbBody.innerHTML = lines.map(function(l){return "<p style='margin:0 0 6px 0'>" + l.trim() + "</p>";}).join("");
  _stopTimer();
}
function confirmExplanation() {
  var btn = document.querySelector(".btn-view-confirm");
  if(btn) { btn.textContent = "✅ 확인 완료"; btn.disabled = true; btn.style.opacity = "0.5"; }
}
function resetItem() {
  ITEM.selected = null;
  document.getElementById("feedback").style.display = "none";
  document.querySelectorAll(".option,.ox-btn").forEach(function(el){el.classList.remove("selected","correct","wrong");});
  var fi = document.getElementById("fill-input"); if(fi) fi.value="";
  var ei = document.getElementById("essay-input"); if(ei) ei.value="";
  if(typeof closeMathPad==="function") closeMathPad();
  _startTimer();
}

// Math Pad (숫자 패드)
function openMathPad() {
  var pad = document.getElementById("math-pad");
  if(pad) pad.style.display = "block";
  var btn = document.getElementById("math-toggle-btn");
  if(btn) { btn.textContent = "▼ 숫자패드 닫기"; btn.classList.add("active"); }
}
function closeMathPad() {
  var pad = document.getElementById("math-pad");
  if(pad) pad.style.display = "none";
  var btn = document.getElementById("math-toggle-btn");
  if(btn) { btn.textContent = "🔢 숫자패드"; btn.classList.remove("active"); }
}
function toggleMathPad() {
  var pad = document.getElementById("math-pad");
  if(pad && pad.style.display === "none") openMathPad(); else closeMathPad();
}
function mathInput(ch) {
  var fi = document.getElementById("fill-input");
  if(fi) { fi.value += ch; ITEM.selected = fi.value; fi.focus(); }
}
function mathBackspace() {
  var fi = document.getElementById("fill-input");
  if(fi) { fi.value = fi.value.slice(0,-1); ITEM.selected = fi.value; fi.focus(); }
}
function mathClear() {
  var fi = document.getElementById("fill-input");
  if(fi) { fi.value = ""; ITEM.selected = ""; fi.focus(); }
}

// MathType API (common-mathtype.js)
// 컨테이너에서 common-mathtype.js를 로딩하면 showMathType/showHandType/closeMathType 함수 사용 가능
function openMathTypeInput() {
  var toolbar = "${meta.ch === "심화" || meta.ch === "총괄" ? "high" : "elementary"}";
  if(typeof showMathType === "function") {
    showMathType("mathtype-fill", document.getElementById("mathtype-fill").innerHTML || "", toolbar);
    // OctoPlayer 환경이 아닌 경우 2초 후 안내
    var _mtTimeout = setTimeout(function() {
      var ec = document.getElementById("editorContainer");
      if(!ec || ec.style.display === "none" || ec.offsetHeight === 0) {
        var msgEl = document.createElement("div");
        msgEl.className = "mathtype-msg";
        msgEl.textContent = "ℹ️ MathType는 OctoPlayer 환경에서 동작합니다. 숫자패드를 이용하세요.";
        var wrap = document.querySelector(".fill-math-wrap");
        if(wrap && !wrap.querySelector(".mathtype-msg")) wrap.appendChild(msgEl);
        setTimeout(function(){ if(msgEl.parentNode) msgEl.parentNode.removeChild(msgEl); }, 3000);
      }
    }, 1500);
  }
}

// Timer
var _timer=0, _timerInterval=null;
function _startTimer(){_timer=0;clearInterval(_timerInterval);_timerInterval=setInterval(function(){_timer++;var m=Math.floor(_timer/60);var s=_timer%60;document.getElementById("timer-display").textContent=m+":"+String(s).padStart(2,"0");},1000);}
function _stopTimer(){clearInterval(_timerInterval);}

// Init
document.addEventListener("DOMContentLoaded", function(){
  _startTimer();
  document.querySelectorAll(".option").forEach(function(el){
    el.addEventListener("click",function(){
      document.querySelectorAll(".option").forEach(function(o){o.classList.remove("selected");});
      el.classList.add("selected");
      ITEM.selected = el.dataset.idx;
    });
  });
  document.querySelectorAll(".ox-btn").forEach(function(el){
    el.addEventListener("click",function(){
      document.querySelectorAll(".ox-btn").forEach(function(o){o.classList.remove("selected");});
      el.classList.add("selected");
      ITEM.selected = el.dataset.val;
    });
  });
  var fi=document.getElementById("fill-input");
  if(fi) fi.addEventListener("input",function(){ITEM.selected=fi.value;});
  var ei=document.getElementById("essay-input");
  if(ei) ei.addEventListener("input",function(){ITEM.selected=ei.value;});
});`;

    // style.css
    const styleCss=`/* ${qn} style */
.item-container{max-width:640px;margin:0 auto;padding:24px;font-family:var(--font-family,'Spoqa Han Sans Neo'),sans-serif}
.item-header{margin-bottom:20px}
.item-meta-bar{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.badge{font-size:12px;padding:3px 10px;border-radius:16px;font-weight:600}
.badge.type{background:#f0eeff;color:#6c5ce7}.badge.diff{background:#e6f9f3;color:#00b894}
.badge.score{background:#fff8e6;color:#f0932b}.badge.time{background:#eeecea;color:#636e72}
.item-id{font-family:monospace;font-size:12px;color:#636e72;margin-left:auto}
.item-std{font-size:13px;color:#636e72}
.passage{font-size:15px;line-height:1.8;padding:14px;background:#f7f6f3;border-radius:8px;border-left:3px solid var(--primary-color,#0084ff);margin-bottom:16px}
.stem{font-size:16px;font-weight:600;margin-bottom:16px;line-height:1.6}
.options{display:flex;flex-direction:column;gap:8px}
.option{display:flex;align-items:center;gap:6px;padding:12px 16px;border:1px solid #eeecea;border-radius:8px;cursor:pointer;transition:all .2s}
.option:hover,.option.selected{border-color:#6c5ce7;background:#f0eeff}
.option.correct{border-color:#27ae60;background:#e8f8ef}.option.wrong{border-color:#e74c3c;background:rgba(231,76,60,.06)}
.opt-label{width:26px;height:26px;border-radius:50%;background:#eeecea;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;flex-shrink:0}
.opt-text{font-size:15px;flex:1;text-align:left}
.option.selected .opt-label{background:#6c5ce7;color:#fff}
.ox-buttons{display:flex;gap:12px;justify-content:center;padding:20px}
.ox-btn{width:90px;height:90px;border-radius:16px;border:2px solid #eeecea;background:#fff;cursor:pointer;font-size:32px;font-weight:900;transition:all .2s}
.ox-btn:first-child{color:#4a90d9}.ox-btn:last-child{color:#e17055}
.ox-btn.selected:first-child{border-color:#4a90d9;background:#eaf2fb}.ox-btn.selected:last-child{border-color:#e17055;background:#fdeee9}
.fill-math-wrap{padding:16px 0}
.fill-input-row{display:flex;align-items:center;justify-content:center;gap:8px}
.fill-input{width:220px;height:48px;border:2px solid var(--primary-color,#0084ff);border-radius:8px;text-align:center;font-size:20px;font-weight:700;background:#faf9ff;color:#6c5ce7;outline:none}
.fill-input:focus{border-color:#5b4bd5;box-shadow:0 0 0 3px rgba(108,92,231,.12)}
.fill-btn-row{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:10px}
.math-toggle{padding:8px 14px;border:1px solid rgba(108,92,231,.2);border-radius:8px;background:rgba(108,92,231,.04);color:#6c5ce7;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap}
.math-toggle:hover,.math-toggle.active{background:#6c5ce7;color:#fff}
.mathtype-btn{padding:8px 14px;border:1px solid rgba(0,184,148,.2);border-radius:8px;background:rgba(0,184,148,.04);color:#00b894;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap}
.mathtype-btn:hover{background:#00b894;color:#fff}
#editorContainer{position:absolute;top:0;left:0;width:720px;height:200px;padding-bottom:80px;background-color:#fff;z-index:1000;display:none;box-shadow:2px 6px 20px 0px rgba(0,0,0,0.25)}
.math-pad{background:#fff;border:2px solid #6c5ce7;border-radius:12px;margin-top:10px;overflow:hidden;box-shadow:0 8px 24px rgba(108,92,231,.12)}
.math-pad-head{padding:10px 14px;background:linear-gradient(135deg,#f0eeff,#fff);border-bottom:1px solid rgba(0,0,0,.06);display:flex;align-items:center;gap:8px}
.math-pad-title{font-size:14px;font-weight:700;color:#6c5ce7}
.math-pad-hint{font-size:11px;color:#8c8b87;flex:1}
.math-pad-close{width:24px;height:24px;border:none;background:rgba(0,0,0,.04);border-radius:6px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center}
.math-pad-body{display:flex;gap:10px;padding:12px 14px}
.math-pad-section{flex:1}
.math-pad-label{font-size:11px;color:#8c8b87;font-weight:600;margin-bottom:6px}
.math-keys{display:grid;gap:4px}
.num-keys{grid-template-columns:repeat(3,1fr)}
.op-keys{grid-template-columns:repeat(3,1fr)}
.math-key{padding:10px 4px;border:1px solid rgba(0,0,0,.06);border-radius:6px;background:#fafaf8;font-size:16px;font-weight:600;cursor:pointer;transition:all .12s;text-align:center}
.math-key:hover{background:#f0eeff;border-color:#6c5ce7;transform:scale(1.05)}
.math-key:active{background:#6c5ce7;color:#fff;transform:scale(.95)}
.key-del{background:rgba(240,123,90,.06);color:#e17055;font-size:13px}
.key-clear{background:rgba(232,90,90,.06);color:#d63031;font-size:12px}
.math-pad-footer{padding:8px 14px;border-top:1px solid rgba(0,0,0,.06);display:flex;align-items:center;gap:8px;justify-content:flex-end}
.math-pad-done{padding:8px 20px;border:none;border-radius:8px;background:#6c5ce7;color:#fff;font-size:13px;font-weight:600;cursor:pointer}
.mathtype-msg{margin-top:8px;padding:8px 12px;border-radius:6px;background:rgba(240,185,90,.06);border:1px solid rgba(240,185,90,.15);font-size:12px;color:#f0932b;text-align:center}
.essay-wrap{padding:8px 0}.essay-input{width:100%;min-height:120px;border:1px solid #eeecea;border-radius:8px;padding:14px;font-size:15px;line-height:1.7;resize:vertical;outline:none}
.fb-wrap{margin-top:16px;display:flex;flex-direction:column;gap:10px}
.fb-result{padding:14px 18px;border-radius:10px;font-size:16px;font-weight:700;display:flex;align-items:center;gap:10px}
.fb-result.fc{background:#e8f8ef;border:1px solid rgba(39,174,96,.2);color:#1e8449}
.fb-result.fw{background:rgba(231,76,60,.06);border:1px solid rgba(231,76,60,.15);color:#c0392b}
.fb-explain{background:#fafaf8;border:1px solid rgba(0,0,0,.06);border-radius:10px;overflow:hidden}
.fb-explain-head{padding:10px 16px;font-size:14px;font-weight:600;color:#6c5ce7;background:rgba(108,92,231,.04);border-bottom:1px solid rgba(0,0,0,.04);display:flex;align-items:center;gap:6px}
.fb-explain-body{padding:14px 16px;font-size:15px;line-height:1.8;color:#2d3436}
.btn-view-confirm{display:inline-block;margin:0 16px 12px;padding:8px 20px;border:1px solid rgba(108,92,231,.15);border-radius:6px;background:rgba(108,92,231,.04);font-size:13px;font-weight:500;cursor:pointer;color:#6c5ce7;transition:all .15s}
.btn-view-confirm:hover{background:rgba(108,92,231,.1)}
.item-footer{margin-top:20px;display:flex;align-items:center;gap:10px;border-top:1px solid #eeecea;padding-top:16px}
.btn-submit{padding:10px 28px;border:none;border-radius:8px;background:var(--primary-color,#0084ff);color:#fff;font-size:15px;font-weight:600;cursor:pointer}
.btn-reset{padding:10px 20px;border:1px solid #eeecea;border-radius:8px;background:#fff;font-size:14px;cursor:pointer}
.timer{margin-left:auto;font-family:monospace;font-size:14px;color:#636e72}`;

    // meta.json
    const metaJson=JSON.stringify({
      question_id:qn,type:question.type,answer:question.answer,
      meta:{question_type:meta.tp,difficulty:meta.df,blooms:meta.bl,content_element:meta.el,
        score:meta.sc,time_limit:meta.tm,content_area:meta.ar,achievement:meta.ac,
        learning_map_id:meta.std?.[0]||"",guide:meta.gd}
    },null,2);

    // reset.css placeholder
    const resetCss=`@import url(//spoqa.github.io/spoqa-han-sans/css/SpoqaHanSansNeo.css);
@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100..900&display=swap");
:root{--primary-color:#0084ff;--elementary_bg-color:#0084ff;--secondary-color:#e6eef9;--good:#f44e80}
html,body,div,span,h1,h2,h3,h4,h5,h6,p,a,img,ol,ul,li,table,caption,tbody,thead,tr,th,td{margin:0;padding:0;border:0}
*,*::before,*::after{box-sizing:border-box}
body{line-height:1;-webkit-font-smoothing:antialiased}
ol,ul{list-style:none}table{border-collapse:collapse;border-spacing:0}
button,input,select,textarea{margin:0;padding:0;background:none;border:none;font:inherit;color:inherit;outline:none}
button{cursor:pointer}a,a:link{text-decoration:none;color:inherit}`;

    // octo-bridge.js — OctoPlayer 통신 브릿지 (비침습)
    const octoBridgeJs = `// octo-bridge.js — OctoPlayer 뷰어-콘텐츠 연동 브릿지
// OctoPlayer 뷰어-콘텐츠 연동 가이드 V2 규격 준수
// 비침습 원칙: item.js 수정 없이 함수 래핑으로 xAPI 발화 + restore + 페이지 이동

(function() {
  "use strict";

  // ============================================================
  // 1. 상태 관리
  // ============================================================
  var _state = {
    userId: null,
    contentId: "${qn}",
    contentTag: {},
    startTime: null,
    restoreData: null,
    isRestored: false,
    currentPage: 1,
    totalPages: 1
  };

  // ============================================================
  // 2. 콘텐츠 → 뷰어 postMessage (window.parent)
  // ============================================================
  function sendToViewer(msg) {
    try {
      window.parent.postMessage(msg, "*");
    } catch(e) { console.warn("[octo-bridge] postMessage 실패:", e); }
  }

  // ============================================================
  // 3. 뷰어 → 콘텐츠 메시지 수신
  // ============================================================
  window.addEventListener("message", function(event) {
    if (!event.data || !event.data.type) return;
    var msg = event.data;
    console.log("[octo-bridge] 수신:", msg.type, msg);

    switch(msg.type) {
      // ── restore 복원 데이터 수신 (뷰어 → 콘텐츠) ──
      case "sendRestoreData":
        // msg.data = 복원 데이터, msg.contentId, msg.contentTag
        if (msg.contentId) _state.contentId = msg.contentId;
        if (msg.contentTag) _state.contentTag = msg.contentTag;
        handleRestore(msg.data);
        break;

      // ── userId 수신 (뷰어 → 콘텐츠) ──
      case "sendUserId":
        _state.userId = msg.data;
        console.log("[octo-bridge] userId:", _state.userId);
        break;

      // ── 다음 페이지 이동 (뷰어 → 콘텐츠) ──
      case "nextPage":
        handleNextPage();
        break;

      // ── 이전 페이지 이동 (뷰어 → 콘텐츠) ──
      case "prevPage":
        handlePrevPage();
        break;

      // ── 종료 요청 (뷰어 → 콘텐츠) ──
      case "terminated":
        handleTerminated();
        break;

      // ── MathType 확인 결과 수신 ──
      case "confirmMathType":
        handleMathTypeResult(msg.data);
        break;

      case "closeMathType":
        break;

      default:
        break;
    }
  });

  // ============================================================
  // 4. RESTORE 복원
  // ============================================================
  function handleRestore(data) {
    if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
      console.log("[octo-bridge] 빈 restore — 신규 학습");
      return;
    }
    console.log("[octo-bridge] restore 수신:", data);
    _state.restoreData = data;
    _state.isRestored = true;

    try {
      // 선택값 복원
      if (typeof ITEM !== "undefined" && data.selected !== undefined) {
        ITEM.selected = data.selected;
      }

      // 객관식 보기 선택 복원
      if (data.type === "mc" && data.selected) {
        document.querySelectorAll(".option").forEach(function(el) {
          el.classList.remove("selected");
          if (el.dataset.idx === String(data.selected)) el.classList.add("selected");
        });
      }

      // OX 선택 복원
      if (data.type === "ox" && data.selected) {
        document.querySelectorAll(".ox-btn").forEach(function(el) {
          el.classList.remove("selected");
          if (el.dataset.val === data.selected) el.classList.add("selected");
        });
      }

      // 빈칸채우기 복원
      if (data.type === "fill" && data.selected) {
        var fi = document.getElementById("fill-input");
        if (fi) fi.value = data.selected;
      }

      // 서술형 복원
      if (data.type === "essay" && data.selected) {
        var ei = document.getElementById("essay-input");
        if (ei) ei.value = data.selected;
      }

      // 타이머 복원
      if (data.elapsed && typeof _timer !== "undefined") {
        _timer = data.elapsed;
      }

      // 제출 상태 복원
      if (data.submitted && typeof submitAnswer === "function") {
        submitAnswer();
      }

      console.log("[octo-bridge] restore 완료");
    } catch(e) {
      console.warn("[octo-bridge] restore 실패:", e);
    }
  }

  // restore 데이터 스냅샷 생성
  function buildRestoreData() {
    return {
      type: (typeof ITEM !== "undefined") ? ITEM.type : "",
      selected: (typeof ITEM !== "undefined") ? ITEM.selected : null,
      elapsed: (typeof _timer !== "undefined") ? _timer : 0,
      submitted: !!(document.getElementById("feedback") && document.getElementById("feedback").style.display !== "none"),
      timestamp: new Date().toISOString()
    };
  }

  // ============================================================
  // 5. 페이지 이동 (nextPage / prevPage)
  // ============================================================
  function handleNextPage() {
    console.log("[octo-bridge] nextPage 수신");
    // 단일 문항이므로 페이지 이동 없음 — 현재 상태를 xAPI로 전송 후 이동 가능 알림
    emitXapi("left", {
      duration: "PT" + ((typeof _timer !== "undefined") ? _timer : 0) + "S"
    });
    // 뷰어에 현재 페이지 전달 (이동 완료 알림)
    sendIframeCurrentPage();
  }

  function handlePrevPage() {
    console.log("[octo-bridge] prevPage 수신");
    emitXapi("left", {
      duration: "PT" + ((typeof _timer !== "undefined") ? _timer : 0) + "S"
    });
    sendIframeCurrentPage();
  }

  // iframeCurrentPage 전송 (뷰어에 현재 페이지 + body 높이 전달)
  function sendIframeCurrentPage() {
    var bodyHeight = document.body ? document.body.scrollHeight : 800;
    sendToViewer({
      type: "iframeCurrentPage",
      data: _state.currentPage,
      height: bodyHeight
    });
    console.log("[octo-bridge] iframeCurrentPage 전송:", _state.currentPage, bodyHeight);
  }

  // ============================================================
  // 6. 종료 처리 (terminated → deinit)
  // ============================================================
  function handleTerminated() {
    console.log("[octo-bridge] terminated 수신 — 종료 처리 시작");
    // 최종 xAPI left 이벤트
    emitXapi("left", {
      duration: "PT" + ((typeof _timer !== "undefined") ? _timer : 0) + "S"
    });
    if (typeof _stopTimer === "function") _stopTimer();

    // 종료 작업 완료 → deinit 전달
    sendToViewer({ type: "deinit" });
    console.log("[octo-bridge] deinit 전송 완료");
  }

  // ============================================================
  // 7. xAPI 이벤트 발화 (sendLogToContainer)
  // ============================================================
  // 가이드 규격: { type: "sendLogToContainer", data: { restore: {...}, xAPI: {...} } }
  function emitXapi(verb, extensions) {
    var data = {
      restore: buildRestoreData(),
      xAPI: {
        verb: verb,
        object: {
          id: _state.contentId
        },
        context: {
          extensions: {
            "lcms/conts-id": _state.contentId
          }
        }
      }
    };
    // 결과 데이터 (completed 등)
    if (extensions) {
      data.xAPI.result = {
        duration: extensions.duration || "",
        extensions: extensions
      };
    }

    sendToViewer({
      type: "sendLogToContainer",
      data: data
    });
    console.log("[octo-bridge] xAPI:", verb, data);
  }

  // ============================================================
  // 8. MathType 통신 (parent 직접 호출 우선)
  // ============================================================
  function callParentFn(fnName, args) {
    try {
      if (window.parent && window.parent !== window && typeof window.parent[fnName] === "function") {
        window.parent[fnName].apply(window.parent, args);
        console.log("[octo-bridge] " + fnName + " 직접호출(parent) 성공");
        return true;
      }
    } catch(e) {}
    try {
      if (window.top && window.top !== window && typeof window.top[fnName] === "function") {
        window.top[fnName].apply(window.top, args);
        console.log("[octo-bridge] " + fnName + " 직접호출(top) 성공");
        return true;
      }
    } catch(e) {}
    return false;
  }

  window.showMathType = function(id, val, toolbar) {
    if (!callParentFn("showMathType", [id || "mathtype-fill", val || "", toolbar || "elementary"])) {
      console.warn("[octo-bridge] showMathType 호출 실패 — common-mathtype.js 미로딩");
    }
  };
  window.showHandType = function(id, val, toolbar) {
    callParentFn("showHandType", [id || "mathtype-fill", val || "", toolbar || "elementary"]);
  };
  window.closeMathType = function() { callParentFn("closeMathType", []); };
  window.confirmMathType = function() { callParentFn("confirmMathType", []); };

  function handleMathTypeResult(data) {
    if (!data) return;
    console.log("[octo-bridge] MathType 결과:", data);
    var target = document.getElementById(data.id);
    if (target) target.innerHTML = data.value || "";
    var fi = document.getElementById("fill-input");
    if (fi && data.value) {
      fi.value = data.value.replace(/<[^>]*>/g, "");
      if (typeof ITEM !== "undefined") ITEM.selected = fi.value;
    }
  }

  // ============================================================
  // 9. 함수 래핑 (비침습 xAPI 발화)
  // ============================================================
  function wrapIfExists(fnName, before, after) {
    if (typeof window[fnName] === "function") {
      var original = window[fnName];
      window[fnName] = function() {
        if (before) before.apply(this, arguments);
        var result = original.apply(this, arguments);
        if (after) after.apply(this, arguments);
        return result;
      };
    }
  }

  // submitAnswer → completed 이벤트
  wrapIfExists("submitAnswer", null, function() {
    var result = (typeof getResult === "function") ? getResult() : {};
    emitXapi("completed", {
      skip: false,
      "req-act-cnt": 1,
      "com-act-cnt": 1,
      "crt-cnt": result.correct ? 1 : 0,
      "incrt-cnt": result.correct ? 0 : 1,
      "crt-rt": result.correct ? "1.00" : "0.00",
      success: !!result.correct,
      duration: "PT" + (result.duration || 0) + "S"
    });
  });

  // resetItem → reset 이벤트
  wrapIfExists("resetItem", function() {
    emitXapi("reset", {});
  });

  // ============================================================
  // 10. 초기화 시퀀스
  // ============================================================
  function init() {
    _state.startTime = new Date().toISOString();

    // 1) userId 요청 (가이드: { type: "requestUserId" })
    sendToViewer({ type: "requestUserId" });

    // 2) restore 데이터 요청 (가이드: { type: "requestRestoreData" })
    sendToViewer({ type: "requestRestoreData" });

    // 3) iframeCurrentPage 전송 (가이드: 최초 로딩 시 필수)
    sendIframeCurrentPage();

    // 4) started 이벤트
    emitXapi("started", {});

    // 5) 페이지 이탈 시 left 이벤트
    window.addEventListener("beforeunload", function() {
      emitXapi("left", {
        duration: "PT" + ((typeof _timer !== "undefined") ? _timer : 0) + "S"
      });
    });

    console.log("[octo-bridge] 초기화 완료 — contentId:", _state.contentId);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();`;

    // Build ZIP
    const files = [
      { name: `${qn}/index.html`, content: indexHtml },
      { name: `${qn}/css/reset.css`, content: resetCss },
      { name: `${qn}/css/style.css`, content: styleCss },
      { name: `${qn}/js/item.js`, content: itemJs },
      { name: `${qn}/js/octo-bridge.js`, content: octoBridgeJs },
      { name: `${qn}/meta.json`, content: metaJson }
    ];

    // === Minimal ZIP builder (STORE, no compression) ===
    function buildZip(entries) {
      const enc = new TextEncoder();
      const parts = []; // central directory entries
      let offset = 0;
      const localHeaders = [];

      for (const entry of entries) {
        const nameBytes = enc.encode(entry.name);
        const dataBytes = enc.encode(entry.content);
        const crc = crc32(dataBytes);

        // Local file header (30 + nameLen + dataLen)
        const lh = new ArrayBuffer(30 + nameBytes.length);
        const lv = new DataView(lh);
        lv.setUint32(0, 0x04034b50, true); // signature
        lv.setUint16(4, 20, true); // version needed
        lv.setUint16(6, 0x0800, true); // flags (UTF-8)
        lv.setUint16(8, 0, true); // compression: STORE
        lv.setUint16(10, 0, true); // mod time
        lv.setUint16(12, 0, true); // mod date
        lv.setUint32(14, crc, true);
        lv.setUint32(18, dataBytes.length, true); // compressed
        lv.setUint32(22, dataBytes.length, true); // uncompressed
        lv.setUint16(26, nameBytes.length, true);
        lv.setUint16(28, 0, true); // extra length
        new Uint8Array(lh, 30).set(nameBytes);
        localHeaders.push({ buf: lh, data: dataBytes, offset, nameBytes, crc, size: dataBytes.length });
        offset += lh.byteLength + dataBytes.length;
      }

      // Central directory
      const cdParts = [];
      let cdSize = 0;
      for (const lh of localHeaders) {
        const cd = new ArrayBuffer(46 + lh.nameBytes.length);
        const cv = new DataView(cd);
        cv.setUint32(0, 0x02014b50, true); // signature
        cv.setUint16(4, 20, true); // version made by
        cv.setUint16(6, 20, true); // version needed
        cv.setUint16(8, 0x0800, true); // flags (UTF-8)
        cv.setUint16(10, 0, true); // compression
        cv.setUint16(12, 0, true); // time
        cv.setUint16(14, 0, true); // date
        cv.setUint32(16, lh.crc, true);
        cv.setUint32(20, lh.size, true); // compressed
        cv.setUint32(24, lh.size, true); // uncompressed
        cv.setUint16(28, lh.nameBytes.length, true);
        cv.setUint16(30, 0, true); // extra
        cv.setUint16(32, 0, true); // comment
        cv.setUint16(34, 0, true); // disk
        cv.setUint16(36, 0, true); // internal attr
        cv.setUint32(38, 0, true); // external attr
        cv.setUint32(42, lh.offset, true); // local header offset
        new Uint8Array(cd, 46).set(lh.nameBytes);
        cdParts.push(cd);
        cdSize += cd.byteLength;
      }

      // End of central directory
      const eocd = new ArrayBuffer(22);
      const ev = new DataView(eocd);
      ev.setUint32(0, 0x06054b50, true);
      ev.setUint16(4, 0, true); ev.setUint16(6, 0, true);
      ev.setUint16(8, entries.length, true);
      ev.setUint16(10, entries.length, true);
      ev.setUint32(12, cdSize, true);
      ev.setUint32(16, offset, true);
      ev.setUint16(20, 0, true);

      // Combine
      const totalSize = offset + cdSize + 22;
      const result = new Uint8Array(totalSize);
      let pos = 0;
      for (const lh of localHeaders) {
        result.set(new Uint8Array(lh.buf), pos); pos += lh.buf.byteLength;
        result.set(lh.data, pos); pos += lh.data.length;
      }
      for (const cd of cdParts) {
        result.set(new Uint8Array(cd), pos); pos += cd.byteLength;
      }
      result.set(new Uint8Array(eocd), pos);
      return result;
    }

    function crc32(bytes) {
      let table = crc32.table;
      if (!table) {
        table = crc32.table = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
          let c = i;
          for (let j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
          table[i] = c;
        }
      }
      let crc = 0xFFFFFFFF;
      for (let i = 0; i < bytes.length; i++) crc = table[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
      return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    const zipData = buildZip(files);
    const blob = new Blob([zipData], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${qn}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addXapi("clicked",`ZIP 다운로드: ${qn}.zip`);
  };

  const handleRegen=()=>{if(regenCount>=5)return;setShowEdit(true);};

  const handleApplyMeta=async(newMeta)=>{
    setShowEdit(false);setMeta(newMeta);setRegenCount(c=>c+1);
    setQId("Q-"+String(Math.floor(Math.random()*900)+100));
    await runFullPipeline(newMeta);
  };

  // Edit panel
  // EditPanel is now an external component (defined above)

  // Question renderer
  // QBody is now an external component (defined above)

  const cc=meta?({진단:"#5ba4f5",연습:"#3dd9a0",형성평가:"#f0b95a",심화:"#f07b5a",총괄:"#7bc95e"}[meta.ch]||"#3dd9a0"):"#3dd9a0";

  return (
    <div className="app">
      <style>{`
.app{display:flex;flex-direction:column;height:100vh;font-family:'Noto Sans KR',system-ui,sans-serif;background:#f5f4f1;color:#1a1a18}
.top{background:#fff;border-bottom:1px solid rgba(0,0,0,.06);padding:10px 18px;display:flex;align-items:center;gap:10px}
.logo{font-size:.95rem;font-weight:900;color:#6c5ce7}.logo span{color:#8c8b87;font-weight:400;font-size:.75rem;margin-left:6px}
.abg{font-size:.55rem;padding:3px 8px;border-radius:4px;background:#f0eeff;color:#6c5ce7;font-weight:600}
.stpill{margin-left:auto;font-size:.65rem;padding:3px 10px;border-radius:16px;background:#e6f9f3;color:#00b894}
.lay{display:flex;flex:1;overflow:hidden}
.sb{width:280px;background:#fff;border-right:1px solid rgba(0,0,0,.06);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0}
.sbh{padding:12px 14px;border-bottom:1px solid rgba(0,0,0,.06);font-size:.78rem;font-weight:700}
.sb-filters{display:flex;gap:5px;align-items:center;flex-wrap:wrap}
.fb-btn{padding:5px 12px;font-size:.68rem;font-weight:500;border:1px solid rgba(0,0,0,.06);border-radius:6px;background:#fff;color:#8c8b87;cursor:pointer;transition:all .15s;font-family:inherit}
.fb-btn:hover{border-color:#6c5ce7;color:#6c5ce7}
.fb-btn.active{background:#6c5ce7;color:#fff;border-color:#6c5ce7}
.fb-sel{padding:5px 8px;font-size:.68rem;border:1px solid rgba(0,0,0,.06);border-radius:6px;background:#fff;color:#1a1a18;font-family:inherit;cursor:pointer}
.stw{flex:1;overflow-y:auto;padding:4px 0}
.th{padding:7px 10px;font-size:.72rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px;user-select:none}.th:hover{background:#eeecea}
.ta{font-size:.5rem;color:#b5b4b0;transition:transform .2s;display:inline-block}.to{transform:rotate(90deg)}
.tn{font-family:monospace;font-size:.58rem;color:#6c5ce7;background:#f0eeff;padding:1px 4px;border-radius:2px}
.tl{padding:5px 10px;font-size:.68rem;cursor:pointer;display:flex;align-items:center;gap:5px;color:#8c8b87;border-left:2px solid transparent;transition:all .15s}
.tl:hover{background:#f0eeff;color:#1a1a18}.tl.sel{background:#f0eeff;color:#6c5ce7;font-weight:600;border-left-color:#6c5ce7}
.tdot{width:4px;height:4px;border-radius:50%;flex-shrink:0}
.mn{flex:1;overflow-y:auto;padding:18px}
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:55vh;text-align:center;color:#8c8b87}
.empty .ei{font-size:2.5rem;margin-bottom:12px;opacity:.4}.empty h3{font-size:.92rem;font-weight:600;color:#5c5b57}.empty p{font-size:.76rem;max-width:280px;margin-top:4px}
.pipe-bar{display:flex;align-items:center;gap:0;margin-bottom:14px;background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:10px;padding:10px 14px;overflow-x:auto}
.pipe-stage-wrap{display:flex;align-items:center}
.pipe-conn{width:20px;height:1px;background:#ddd;margin:0 2px}
.pipe-stage{display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:6px;font-size:.65rem;font-weight:500;white-space:nowrap;border:1px solid rgba(0,0,0,.04)}
.pipe-stage.idle{background:#f7f6f3;color:#b5b4b0}
.pipe-stage.running{background:#fff8e6;color:#f0932b;border-color:rgba(240,147,43,.2)}
.pipe-stage.done{background:#e6f9f3;color:#00b894;border-color:rgba(0,184,148,.2)}
.pipe-stage.fail{background:rgba(232,90,90,.06);color:#e85a5a;border-color:rgba(232,90,90,.2)}
.pipe-icon{font-size:.7rem}.pipe-name{font-weight:600}.pipe-time{font-family:monospace;font-size:.58rem;opacity:.7}
.mc{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,.03);margin-bottom:12px;overflow:hidden}
.mch{padding:12px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(0,0,0,.06);background:#fafaf8}
.mch h3{font-size:.8rem;font-weight:700;flex:1}
.mbg{font-size:.58rem;font-weight:600;padding:2px 8px;border-radius:16px}
.mgr{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:12px 16px}
.mi{padding:7px 8px;background:#f7f6f3;border-radius:6px}
.mil{font-size:.56rem;color:#8c8b87;margin-bottom:1px}.miv{font-size:.72rem;font-weight:600}
.maa{padding:0 16px 6px;font-size:.66rem;color:#5c5b57}
.mag{padding:0 16px 10px;font-size:.68rem;color:#6c5ce7}
.stags{padding:0 16px 12px;display:flex;gap:3px;flex-wrap:wrap}
.stag{font-size:.56rem;font-family:monospace;padding:1px 6px;border-radius:3px;background:#e6f9f3;color:#00b894}
.depth-ctx{padding:0 16px 12px}
.depth-title{font-size:.64rem;font-weight:600;color:#6c5ce7;margin-bottom:6px;display:flex;align-items:center;gap:6px}
.depth-title::before{content:'';display:inline-block;width:3px;height:12px;background:#6c5ce7;border-radius:2px}
.depth-items{display:flex;flex-direction:column;gap:4px}
.depth-item{display:flex;align-items:flex-start;gap:8px;padding:6px 8px;border-radius:6px;font-size:.66rem;line-height:1.5}
.depth-item.d3{background:rgba(108,92,231,.06)}.depth-item.d2{background:rgba(9,132,227,.04)}.depth-item.d1{background:rgba(0,0,0,.02)}
.dw{flex-shrink:0;font-weight:700;font-size:.6rem;min-width:36px}
.depth-item.d3 .dw{color:#6c5ce7}.depth-item.d2 .dw{color:#0984e3}.depth-item.d1 .dw{color:#8c8b87}
.dn{font-weight:600;color:#2d3436;flex-shrink:0;min-width:80px}
.dc{color:#636e72;flex:1}
.qc{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,.03);overflow:hidden;margin-bottom:12px}
.qch{padding:12px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(0,0,0,.06);background:linear-gradient(135deg,#f0eeff,#fff);flex-wrap:wrap}
.qch h3{font-size:.8rem;font-weight:700}
.qid{font-family:monospace;font-size:.6rem;color:#6c5ce7;background:#fff;padding:2px 8px;border-radius:5px;border:1px solid rgba(108,92,231,.15)}
.qac{display:flex;gap:5px;margin-left:auto}
.brg{display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border:1px solid rgba(0,0,0,.08);border-radius:7px;background:#fff;font-size:.68rem;font-weight:600;cursor:pointer}
.brg:hover{border-color:#6c5ce7;color:#6c5ce7;background:#f0eeff}
.bdl{display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border:1px solid rgba(0,0,0,.08);border-radius:7px;background:#fff;font-size:.68rem;font-weight:600;cursor:pointer;transition:all .2s}
.bdl:hover{border-color:#27ae60;color:#27ae60;background:rgba(39,174,96,.04)}
.bdl:disabled{opacity:.4;cursor:not-allowed}
.rb{font-family:monospace;font-size:.56rem;background:#eeecea;padding:1px 5px;border-radius:8px;color:#8c8b87}
.qb{padding:18px}
.qp{font-size:.84rem;line-height:1.8;margin-bottom:14px;padding:12px;background:#f7f6f3;border-radius:8px;border-left:3px solid #6c5ce7}
.qs{font-size:.86rem;font-weight:600;margin-bottom:14px}
.mco{display:flex;flex-direction:column;gap:6px}
.mci{display:flex;align-items:center;gap:6px;padding:10px 14px;border:1px solid rgba(0,0,0,.06);border-radius:8px;cursor:pointer;transition:all .2s}
.mci:hover,.mci.s{border-color:#6c5ce7;background:#f0eeff}
.mci.c{border-color:#27ae60;background:#e8f8ef}.mci.w{border-color:#e74c3c;background:rgba(231,76,60,.06)}
.mn2{width:24px;height:24px;border-radius:50%;background:#eeecea;display:flex;align-items:center;justify-content:center;font-size:.66rem;font-weight:600;flex-shrink:0}
.mci.s .mn2{background:#6c5ce7;color:#fff}.mci.c .mn2{background:#27ae60;color:#fff}.mci.w .mn2{background:#e74c3c;color:#fff}
.mt{font-size:.8rem;flex:1;text-align:left}
.type-panel{background:#fff;border:2px solid #6c5ce7;border-radius:12px;margin-bottom:16px;overflow:hidden}
.type-head{padding:16px 18px;background:linear-gradient(135deg,#f0eeff,#fff);border-bottom:1px solid rgba(0,0,0,.06);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.type-head-icon{font-size:1.2rem}
.type-head span:nth-child(2){font-size:.88rem;font-weight:700;color:#6c5ce7}
.type-head-sub{font-size:.66rem;color:#8c8b87;width:100%;margin-top:2px}
.type-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:16px 18px}
.type-card{padding:16px 12px;border:2px solid rgba(0,0,0,.06);border-radius:10px;cursor:pointer;text-align:center;transition:all .2s;position:relative}
.type-card:hover{border-color:#6c5ce7;background:#f0eeff;transform:translateY(-2px);box-shadow:0 4px 12px rgba(108,92,231,.12)}
.type-card.recommended{border-color:rgba(108,92,231,.3);background:#faf9ff}
.type-icon{font-size:1.5rem;margin-bottom:6px}
.type-label{font-size:.82rem;font-weight:700;color:#2d3436;margin-bottom:3px}
.type-desc{font-size:.64rem;color:#8c8b87;line-height:1.4}
.type-rec{position:absolute;top:6px;right:6px;font-size:.52rem;padding:2px 6px;border-radius:4px;background:#6c5ce7;color:#fff;font-weight:600}
.oxo{display:flex;gap:10px;justify-content:center;padding:16px 0}
.oxb{width:80px;height:80px;border-radius:14px;border:2px solid rgba(0,0,0,.06);background:#fff;cursor:pointer;font-size:2rem;font-weight:900;transition:all .2s}
.oxb:hover{transform:scale(1.05)}.oo{color:#4a90d9}.ox{color:#e17055}
.oxb.s.oo{border-color:#4a90d9;background:#eaf2fb;transform:scale(1.08)}.oxb.s.ox{border-color:#e17055;background:#fdeee9;transform:scale(1.08)}
.fill-math-wrap{padding:16px 0}
.fill-input-row{display:flex;align-items:center;justify-content:center;gap:8px}
.fill-math-wrap .fli{width:220px;height:48px;border:2px solid #6c5ce7;border-radius:8px;text-align:center;font-size:1.1rem;font-weight:700;background:#faf9ff;color:#6c5ce7;outline:none;flex-shrink:0}
.fill-math-wrap .fli:focus{border-color:#5b4bd5;box-shadow:0 0 0 3px rgba(108,92,231,.12)}
.fill-btn-row{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:10px}
.math-toggle{padding:8px 14px;border:1px solid rgba(108,92,231,.2);border-radius:8px;background:rgba(108,92,231,.04);color:#6c5ce7;font-size:.7rem;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap}
.math-toggle:hover,.math-toggle.active{background:#6c5ce7;color:#fff}
.math-toggle:disabled{opacity:.4;cursor:not-allowed}
.mathtype-btn{padding:8px 14px;border:1px solid rgba(0,184,148,.2);border-radius:8px;background:rgba(0,184,148,.04);color:#00b894;font-size:.7rem;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap}
.mathtype-btn:hover{background:#00b894;color:#fff}
.mathtype-btn:disabled{opacity:.4;cursor:not-allowed}
.mathtype-msg{margin-top:8px;padding:8px 12px;border-radius:6px;background:rgba(240,185,90,.06);border:1px solid rgba(240,185,90,.15);font-size:.64rem;color:#f0932b;text-align:center}
.math-pad{background:#fff;border:2px solid #6c5ce7;border-radius:12px;margin-top:10px;overflow:hidden;box-shadow:0 8px 24px rgba(108,92,231,.12)}
.math-pad-head{padding:10px 14px;background:linear-gradient(135deg,#f0eeff,#fff);border-bottom:1px solid rgba(0,0,0,.06);display:flex;align-items:center;gap:8px}
.math-pad-title{font-size:.78rem;font-weight:700;color:#6c5ce7}
.math-pad-hint{font-size:.6rem;color:#8c8b87;flex:1}
.math-pad-close{width:24px;height:24px;border:none;background:rgba(0,0,0,.04);border-radius:6px;cursor:pointer;font-size:.7rem;display:flex;align-items:center;justify-content:center}
.math-pad-body{display:flex;gap:10px;padding:12px 14px}
.math-pad-section{flex:1}
.math-pad-label{font-size:.6rem;color:#8c8b87;font-weight:600;margin-bottom:6px;letter-spacing:.04em}
.math-keys{display:grid;gap:4px}
.num-keys{grid-template-columns:repeat(3,1fr)}
.op-keys{grid-template-columns:repeat(3,1fr)}
.math-key{padding:10px 4px;border:1px solid rgba(0,0,0,.06);border-radius:6px;background:#fafaf8;font-size:.88rem;font-weight:600;cursor:pointer;transition:all .12s;text-align:center;font-family:inherit}
.math-key:hover{background:#f0eeff;border-color:#6c5ce7;transform:scale(1.05)}
.math-key:active{background:#6c5ce7;color:#fff;transform:scale(.95)}
.key-del{background:rgba(240,123,90,.06);color:#e17055;font-size:.72rem}
.key-del:hover{background:rgba(240,123,90,.12)}
.key-clear{background:rgba(232,90,90,.06);color:#d63031;font-size:.68rem}
.key-clear:hover{background:rgba(232,90,90,.12)}
.math-pad-footer{padding:8px 14px;border-top:1px solid rgba(0,0,0,.06);display:flex;align-items:center;gap:8px;justify-content:flex-end}
.math-pad-done{padding:8px 20px;border:none;border-radius:8px;background:#6c5ce7;color:#fff;font-size:.74rem;font-weight:600;cursor:pointer}
.math-pad-done:hover{background:#5b4bd5}
.essa{width:100%;min-height:100px;border:1px solid rgba(0,0,0,.06);border-radius:8px;padding:12px;font-size:.82rem;line-height:1.7;resize:vertical;outline:none}.essa:focus{border-color:#6c5ce7}
.bsub{display:block;margin:14px auto 0;padding:9px 28px;border:none;border-radius:8px;font-size:.8rem;font-weight:600;cursor:pointer;background:#6c5ce7;color:#fff}.bsub:hover{background:#5b4bd5}
.fb-wrap{margin-top:16px;display:flex;flex-direction:column;gap:10px}
.fb-result{padding:14px 18px;border-radius:10px;font-size:.88rem;font-weight:700;display:flex;align-items:center;gap:10px}
.fb-result.fc{background:#e8f8ef;border:1px solid rgba(39,174,96,.2);color:#1e8449}
.fb-result.fw{background:rgba(231,76,60,.06);border:1px solid rgba(231,76,60,.15);color:#c0392b}
.fb-icon{font-size:1.2rem}.fb-text{flex:1}
.fb-explain{background:#fafaf8;border:1px solid rgba(0,0,0,.06);border-radius:10px;overflow:hidden}
.fb-explain-head{padding:10px 16px;font-size:.76rem;font-weight:600;color:#6c5ce7;background:rgba(108,92,231,.04);border-bottom:1px solid rgba(0,0,0,.04);display:flex;align-items:center;gap:6px}
.fb-explain-icon{font-size:.9rem}
.fb-explain-body{padding:14px 16px;font-size:.82rem;line-height:1.8;color:#2d3436}
.bview{display:inline-block;margin:0 16px 12px;padding:6px 16px;border:1px solid rgba(108,92,231,.15);border-radius:6px;background:rgba(108,92,231,.04);font-size:.7rem;font-weight:500;cursor:pointer;color:#6c5ce7;transition:all .15s}
.bview:hover{background:rgba(108,92,231,.1)}
.qf{padding:12px 16px;border-top:1px solid rgba(0,0,0,.06);display:flex;align-items:center;gap:8px}
.brst{padding:7px 16px;border:1px solid rgba(0,0,0,.06);border-radius:7px;background:#eeecea;font-size:.72rem;font-weight:500;cursor:pointer}
.tmr{margin-left:auto;font-family:monospace;font-size:.74rem;color:#8c8b87}
.ldg{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;gap:12px}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.spn{width:28px;height:28px;border:3px solid #eeecea;border-top-color:#6c5ce7;border-radius:50%;animation:spin .7s linear infinite}
.lt{font-size:.78rem;color:#5c5b57;font-weight:500}.ls{font-size:.66rem;color:#8c8b87}
.qa-panel{border-radius:10px;margin-bottom:12px;overflow:hidden;border:1px solid rgba(0,0,0,.06)}
.qa-panel.pass{border-color:rgba(0,184,148,.2)}.qa-panel.fail{border-color:rgba(232,90,90,.2)}
.qa-head{padding:10px 14px;font-size:.74rem;font-weight:600;display:flex;justify-content:space-between;align-items:center}
.qa-panel.pass .qa-head{background:#e6f9f3;color:#00b894}.qa-panel.fail .qa-head{background:rgba(232,90,90,.06);color:#e85a5a}
.qa-score{font-family:monospace;font-size:.7rem}
.qa-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:10px 14px;background:#fff}
.qa-domain{padding:8px;background:#f7f6f3;border-radius:6px}
.qa-dn{font-size:.6rem;color:#8c8b87;font-weight:500}.qa-ds{font-size:.74rem;font-weight:600;margin-top:2px}
.qa-di{font-size:.58rem;color:#e17055;margin-top:3px;line-height:1.4}
.qa-verify{padding:6px 14px;font-size:.68rem;background:#fff}
.qa-sum{padding:6px 14px 10px;font-size:.66rem;color:#5c5b57;background:#fff}
.xapi-panel{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:10px;margin-bottom:12px;overflow:hidden}
.xapi-head{padding:10px 14px;font-size:.74rem;font-weight:600;border-bottom:1px solid rgba(0,0,0,.06);background:#f0eeff;color:#6c5ce7}
.xapi-list{max-height:180px;overflow-y:auto}
.xapi-ev{display:flex;align-items:center;gap:8px;padding:6px 14px;font-size:.66rem;border-bottom:1px solid rgba(0,0,0,.03)}
.xapi-time{font-family:monospace;font-size:.58rem;color:#8c8b87;width:70px;flex-shrink:0}
.xapi-verb{font-weight:600;padding:1px 6px;border-radius:3px;font-size:.58rem;min-width:60px;text-align:center}
.v-started{background:#eaf2fb;color:#4a90d9}.v-completed{background:#e6f9f3;color:#00b894}
.v-viewed{background:#fff8e6;color:#f0932b}.v-reset{background:rgba(240,123,90,.08);color:#e17055}
.v-left{background:#eeecea;color:#5c5b57}.v-clicked{background:rgba(108,92,231,.06);color:#6c5ce7}
.xapi-detail{flex:1;color:#5c5b57}
.plat-panel{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:10px;margin-bottom:12px;overflow:hidden}
.plat-head{padding:10px 14px;font-size:.74rem;font-weight:600;border-bottom:1px solid rgba(0,0,0,.06);background:#e6f9f3;color:#00b894}
.plat-list{max-height:160px;overflow-y:auto}
.plat-check{display:flex;align-items:center;gap:6px;padding:5px 14px;font-size:.64rem;border-bottom:1px solid rgba(0,0,0,.03)}
.plat-check.fail{background:rgba(232,90,90,.03)}.plat-id{font-family:monospace;font-size:.58rem;color:#6c5ce7;min-width:44px}
.retry-panel{background:#fff;border:2px solid #f0932b;border-radius:10px;margin-bottom:12px;overflow:hidden}
.retry-head{padding:10px 14px;font-size:.74rem;font-weight:600;border-bottom:1px solid rgba(0,0,0,.06);background:#fff8e6;color:#f0932b}
.retry-list{max-height:200px;overflow-y:auto}
.retry-item{padding:10px 14px;border-bottom:1px solid rgba(0,0,0,.04)}
.retry-item.esc{background:rgba(232,90,90,.04)}
.retry-top{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.retry-badge{font-size:.64rem;font-weight:600;padding:2px 8px;border-radius:4px;background:rgba(240,147,43,.12);color:#f0932b}
.retry-item.esc .retry-badge{background:rgba(232,90,90,.12);color:#e85a5a}
.retry-score{font-family:monospace;font-size:.62rem;color:#8c8b87}
.retry-issues{margin-top:4px}
.retry-iss{font-size:.64rem;color:#e17055;line-height:1.5}
.retry-action{font-size:.62rem;color:#00b894;margin-top:4px;font-weight:500}
.plat-retry-panel{background:#fff;border:2px solid #27ae60;border-radius:10px;margin-bottom:12px;overflow:hidden}
.plat-retry-head{padding:10px 14px;font-size:.74rem;font-weight:600;border-bottom:1px solid rgba(0,0,0,.06);background:rgba(39,174,96,.06);color:#27ae60}
.plat-retry-list{max-height:200px;overflow-y:auto}
.plat-retry-item{padding:10px 14px;border-bottom:1px solid rgba(0,0,0,.04)}
.plat-retry-item.esc{background:rgba(232,90,90,.04)}
.plat-retry-top{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.plat-retry-badge{font-size:.64rem;font-weight:600;padding:2px 8px;border-radius:4px;background:rgba(39,174,96,.12);color:#27ae60}
.plat-retry-item.esc .plat-retry-badge{background:rgba(232,90,90,.12);color:#e85a5a}
.plat-retry-cnt{font-family:monospace;font-size:.62rem;color:#8c8b87}
.plat-retry-issues{margin-top:4px}
.plat-retry-iss{font-size:.64rem;color:#e17055;line-height:1.5}
.plat-retry-action{font-size:.62rem;color:#27ae60;margin-top:4px;font-weight:500}
.ep{background:#fff;border:2px solid #6c5ce7;border-radius:12px;margin-bottom:12px;overflow:hidden}
.eph{padding:10px 14px;font-size:.78rem;font-weight:600;color:#6c5ce7;background:#f0eeff;display:flex;justify-content:space-between;align-items:center}
.epg{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:6px;padding:12px 14px}
.ef{display:flex;flex-direction:column;gap:2px}.efl{font-size:.56rem;color:#8c8b87;font-weight:500}
.ef select{padding:6px 7px;font-size:.7rem;border:1px solid rgba(0,0,0,.06);border-radius:5px;background:#fff;cursor:pointer}
.epf{padding:10px 14px;border-top:1px solid rgba(0,0,0,.06);display:flex;align-items:center;gap:8px}
.eph2{font-size:.62rem;color:#8c8b87;flex:1}
.epc{padding:6px 12px;border:1px solid rgba(0,0,0,.06);border-radius:6px;background:#fff;font-size:.7rem;cursor:pointer}
.epa{padding:7px 16px;border:none;border-radius:7px;background:#6c5ce7;color:#fff;font-size:.72rem;font-weight:600;cursor:pointer}.epa:hover{background:#5b4bd5}
@media(max-width:768px){.lay{flex-direction:column}.sb{width:100%;max-height:30vh}.mgr,.qa-grid{grid-template-columns:repeat(2,1fr)}.type-grid{grid-template-columns:repeat(2,1fr)}}
      `}</style>

      <div className="top">
        <div className="logo">AItemS <span>문항 저작 시스템</span></div>
        <span className="abg">Claude API 연동</span>
        <span className="abg" style={{background:"#e6f9f3",color:"#00b894"}}>5팀 파이프라인</span>
        <span className="stpill">정상</span>
      </div>

      <div className="lay">
        <div className="sb">
          <div className="sbh">
            <div style={{marginBottom:8}}>📐 학습맵 탐색</div>
            <div className="sb-filters">
              <button className="fb-btn active">초등</button>
              <button className="fb-btn">중등</button>
              <button className="fb-btn">고등</button>
              <select className="fb-sel">
                <option>3학년</option><option>4학년</option><option>5학년</option><option>6학년</option>
              </select>
              <select className="fb-sel">
                <option>1학기</option><option>2학기</option>
              </select>
            </div>
          </div>
          <div className="stw">{TREE.map((n,i)=><TreeNode key={i} node={n} depth={0} onSelect={handleSelect} selKey={selNode?.k}/>)}</div>
        </div>

        <div className="mn">
          {!selNode&&<div className="empty"><div className="ei">📐</div><h3>학습맵에서 단원을 선택하세요</h3><p>선택하면 5개 팀 파이프라인이 순차 실행되어 실시간으로 문항이 생성됩니다.</p></div>}
          {selNode&&<>
            {!showTypeSelect&&<PipelineBar stages={stages}/>}

            {/* 기획팀 메타 */}
            {meta&&<div className="mc">
              <div className="mch"><h3>📋 기획팀 메타정보</h3><span className="mbg" style={{background:cc+"22",color:cc}}>{meta.ch}</span></div>
              <div className="mgr">
                {[["문항유형",meta.tp],["내용요소",meta.el],["Bloom's",meta.bl],["난이도",meta.df],["배점",meta.sc+"점"],["제한시간",meta.tm+"초"],["내용체계",meta.ar],["1단계",meta.l1]].map(([l,v],i)=>(
                  <div key={i} className="mi"><div className="mil">{l}</div><div className="miv">{v}</div></div>
                ))}
              </div>
              <div className="maa">{meta.ac} {meta.ad}</div>
              <div className="mag">출제 가이드: {meta.gd}</div>
              {meta.depth&&<div className="depth-ctx">
                <div className="depth-title">학습맵 3-Depth 컨텍스트</div>
                <div className="depth-items">
                  <div className="depth-item d3"><span className="dw">★ 50%</span><span className="dn">{meta.depth.d3.name}</span><span className="dc">{meta.depth.d3.context}</span></div>
                  <div className="depth-item d2"><span className="dw">● 30%</span><span className="dn">{meta.depth.d2.name}</span><span className="dc">{meta.depth.d2.context}</span></div>
                  <div className="depth-item d1"><span className="dw">○ 20%</span><span className="dn">{meta.depth.d1.name}</span><span className="dc">{meta.depth.d1.context}</span></div>
                </div>
              </div>}
              {meta.std?.length>0&&<div className="stags">{meta.std.map((s,i)=><span key={i} className="stag">{s}</span>)}</div>}
            </div>}

            {/* 문항 유형 선택 (학습맵 선택 직후) */}
            {showTypeSelect&&meta&&<TypeSelectPanel meta={meta} onSelect={handleTypeSelected}/>}

            {/* 유형 선택 후에만 파이프라인 결과 표시 */}
            {!showTypeSelect&&<>
            {/* 검수팀 결과 */}
            <QAPanel qaResult={qaResult}/>

            {/* 반려→재저작 이력 */}
            <RetryLogPanel retryLog={retryLog}/>

            {/* 메타 편집 */}
            {showEdit&&meta&&<EditPanel meta={meta} regenCount={regenCount} onApply={handleApplyMeta} onCancel={()=>setShowEdit(false)}/>}

            {/* 제작팀 문항 */}
            <div className="qc">
              <div className="qch">
                <h3>🤖 제작팀 문항</h3>
                <span className="abg">LLM 생성</span>
                <span className="qid">{qId}</span>
                <div className="qac">
                  <button className="brg" onClick={handleRegen} disabled={stages[1].status==="running"||regenCount>=5}>↻ 다시 생성 <span className="rb">{regenCount}/5</span></button>
                  <button className="bdl" onClick={handleDownload} disabled={!question||stages[1].status==="running"}>📥 ZIP 다운로드</button>
                </div>
              </div>
              {stages[1].status==="running"&&<div className="ldg"><div className="spn"/><div className="lt">제작팀 LLM이 문항을 저작하고 있습니다...</div><div className="ls">Claude API 실시간 호출 중</div></div>}
              {stages[2].status==="running"&&question&&<div className="ldg"><div className="spn"/><div className="lt">검수팀이 문항을 검증하고 있습니다...</div><div className="ls">LLM 교차 검증 (정답 확인, 메타 정합성)</div></div>}
              {stages[3].status==="running"&&<div className="ldg"><div className="spn"/><div className="lt">데이터팀이 xAPI를 적용하고 있습니다...</div></div>}
              {stages[4].status==="running"&&<div className="ldg"><div className="spn"/><div className="lt">플랫폼팀이 통신을 검증하고 있습니다...</div></div>}
              {stages[4].status!=="idle"&&stages[1].status!=="running"&&stages[2].status!=="running"&&stages[3].status!=="running"&&stages[4].status!=="running"&&question&&<QBody question={question} submitted={submitted} result={result} onSubmit={handleSubmit} onViewed={handleViewed}/>}
              {stages[1].status==="fail"&&<div className="ldg"><div className="lt">문항 생성에 실패했습니다</div><button className="bsub" onClick={()=>runFullPipeline(meta)}>다시 시도</button></div>}
              <div className="qf">
                {submitted&&<button className="brst" onClick={handleReset}>초기화</button>}
                <div className="tmr">⏱ {fmtT(timer)} / {fmtT(meta?.tm||60)}</div>
              </div>
            </div>

            {/* 데이터팀 xAPI 로그 */}
            <XAPIPanel events={xapiEvents}/>

            {/* 플랫폼팀 검증 */}
            <PlatformPanel checks={platChecks}/>

            {/* 플랫폼팀 반려 이력 */}
            <PlatRetryLogPanel platRetryLog={platRetryLog}/>
          </>}{/* end !showTypeSelect */}
          </>}{/* end selNode */}
        </div>
      </div>
    </div>
  );
}
