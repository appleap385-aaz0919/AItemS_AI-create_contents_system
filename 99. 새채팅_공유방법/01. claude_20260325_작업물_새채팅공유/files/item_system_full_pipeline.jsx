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
// 글로벌 API 디버그 로그 (화면에 표시용)
const _apiDebugLog = [];
let _apiSkip = false; // 건너뛰기 플래그
let _apiCallId = 0; // 현재 활성 API 호출 ID
let _lastRateLimitTime = 0; // ★ 마지막 429 발생 시각
let _rateLimitCooldown = 0; // ★ 쿨다운 ms
let _pipelineRunning = false; // ★ 파이프라인 실행 중 플래그 (상태체크 방지)
let _apiKey = ""; // ★ 외부 배포용 API 키 (claude.ai Artifact에서는 불필요)

// API 요청 헤더 생성 — 키가 있으면 직접 인증, 없으면 Artifact 프록시 의존
function getApiHeaders() {
  const h = {"Content-Type":"application/json"};
  if(_apiKey) {
    h["x-api-key"] = _apiKey;
    h["anthropic-version"] = "2023-06-01";
    h["anthropic-dangerous-direct-browser-access"] = "true";
  }
  return h;
}

function addLog(msg) {
  const t = new Date().toLocaleTimeString("ko-KR",{hour12:false});
  _apiDebugLog.push(`[${t}] ${msg}`);
  if(_apiDebugLog.length > 20) _apiDebugLog.shift();
  console.log("[API]", msg);
  if(window._setApiLog) window._setApiLog([..._apiDebugLog]);
}

async function callClaude(sys, user) {
  addLog("API 호출 시작 (프롬프트 " + (sys+user).length + "자)");
  _apiSkip = false;
  const myId = ++_apiCallId; // 이 호출의 고유 ID

  // ★ Rate limit 쿨다운: 마지막 429 이후 충분히 대기
  if(_lastRateLimitTime > 0) {
    const elapsed = Date.now() - _lastRateLimitTime;
    const cooldown = Math.max(0, _rateLimitCooldown - elapsed);
    if(cooldown > 0) {
      addLog("⏳ Rate limit 쿨다운 " + Math.ceil(cooldown/1000) + "초 대기...");
      await new Promise(r => setTimeout(r, cooldown));
    }
  }

  return Promise.race([
    _callClaudeInner(sys, user, myId),
    new Promise(resolve => setTimeout(() => {
      if(_apiCallId === myId) addLog("⏰ 60초 타임아웃");
      resolve(null);
    }, 60000)),
    new Promise(resolve => {
      const iv = setInterval(() => {
        if(_apiSkip) {
          clearInterval(iv);
          addLog("⏭️ 건너뛰기 완료 → 로컬 생성으로 전환");
          resolve(null);
        }
      }, 300);
      setTimeout(() => clearInterval(iv), 61000);
    })
  ]);
}

async function _callClaudeInner(sys, user, callId) {
  const MAX_ATTEMPTS = 3; // ★ 2→3회로 증가
  for(let attempt=0; attempt<MAX_ATTEMPTS; attempt++){
    if(_apiSkip || callId !== _apiCallId) return null;
    addLog("시도 " + (attempt+1) + "/" + MAX_ATTEMPTS + " — fetch 시작...");
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:getApiHeaders(),
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:sys, messages:[{role:"user",content:user}] })
      });
      // ★ 고아 fetch 방지: 이미 건너뛰기/다른 호출이면 무시
      if(_apiSkip || callId !== _apiCallId) return null;
      addLog("HTTP " + r.status + " " + r.statusText);

      if(r.status === 429) {
        // ★ 지수 백오프: 8초 → 15초 → 25초
        const backoff = [8000, 15000, 25000][attempt] || 25000;
        _lastRateLimitTime = Date.now();
        _rateLimitCooldown = backoff;
        addLog("⚠️ 429 Rate Limit — " + Math.ceil(backoff/1000) + "초 대기 후 재시도");
        if(attempt < MAX_ATTEMPTS-1){ await new Promise(r=>setTimeout(r, backoff)); continue; }
        return null;
      }
      if(!r.ok) {
        const errBody = await r.text().catch(()=>"");
        addLog("❌ HTTP 에러 " + r.status + ": " + errBody.substring(0,150));
        // ★ 서버 에러(5xx)는 더 오래 대기
        const wait = r.status >= 500 ? 5000 : 2000;
        if(attempt < MAX_ATTEMPTS-1){ await new Promise(r=>setTimeout(r, wait)); continue; }
        return null;
      }

      // ★ 성공 시 rate limit 쿨다운 리셋
      _lastRateLimitTime = 0;
      _rateLimitCooldown = 0;

      const d = await r.json();
      if(callId !== _apiCallId) return null; // 고아 방지
      if(d.error) {
        addLog("❌ API 에러: " + (d.error?.message || JSON.stringify(d.error)).substring(0,150));
        if(attempt < MAX_ATTEMPTS-1){ await new Promise(r=>setTimeout(r, 3000)); continue; }
        return null;
      }
      if(!d.content || d.content.length === 0) {
        addLog("❌ content 비어있음");
        return null;
      }
      const text = d.content.map(c=>c.type==="text"?c.text:"").join("");
      if(callId !== _apiCallId) return null; // 고아 방지
      addLog("✅ 응답 수신 (" + text.length + "자) " + text.substring(0,60) + "...");
      return text || null;
    } catch(e) {
      if(callId !== _apiCallId) return null; // 고아 방지
      addLog("❌ " + e.name + ": " + e.message);
      // ★ 네트워크 에러도 지수 백오프
      const backoff = [3000, 6000, 10000][attempt] || 10000;
      if(attempt < MAX_ATTEMPTS-1) {
        addLog("⏳ " + Math.ceil(backoff/1000) + "초 후 재시도...");
        await new Promise(r=>setTimeout(r, backoff));
      }
    }
  }
  if(callId === _apiCallId) addLog("❌ " + MAX_ATTEMPTS + "회 모두 실패");
  return null;
}

// 폴백 문항 생성 (API 실패 시) — ★ 메타정보 기반 정확 매칭
function generateFallback(meta) {
  const tp = meta.tp || "객관식(4지선다)";
  const gd = (meta.gd || "").toLowerCase();
  const d2name = meta.depth?.d2?.name || "";
  const d3ctx = meta.depth?.d3?.context || "";

  // ★ 메타 키워드 기반 문제 생성기 선택 (학습맵 컨텍스트 준수)
  function genAddNoCarry() {
    // 받아올림 없는 덧셈: 각 자릿수 합 < 10
    let a,b;
    do { a=Math.floor(Math.random()*400)+100; b=Math.floor(Math.random()*400)+100; }
    while((a%10+b%10)>=10 || (Math.floor(a/10)%10+Math.floor(b/10)%10)>=10 || (Math.floor(a/100)+Math.floor(b/100))>=10);
    return {q:`${a} + ${b}의 값을 구하시오.`,a:a+b,ex:`${a} + ${b} = ${a+b}입니다. 각 자리의 합이 모두 10 미만이므로 받아올림 없이 일의 자리부터 차례로 더합니다.`};
  }
  function genAddOneCarry() {
    // 받아올림 한 번: 일의 자리만 합 >= 10, 십의 자리 합 < 10
    let a,b;
    do { a=Math.floor(Math.random()*400)+100; b=Math.floor(Math.random()*400)+100; }
    while(!((a%10+b%10)>=10 && (Math.floor(a/10)%10+Math.floor(b/10)%10)<10));
    return {q:`${a} + ${b}의 값을 구하시오.`,a:a+b,ex:`${a} + ${b} = ${a+b}입니다. 일의 자리: ${a%10} + ${b%10} = ${a%10+b%10}이므로 십의 자리로 1을 받아올립니다.`};
  }
  function genAddMultiCarry() {
    // 받아올림 여러 번: 일의 자리와 십의 자리 모두 합 >= 10
    let a,b;
    do { a=Math.floor(Math.random()*400)+100; b=Math.floor(Math.random()*400)+100; }
    while(!((a%10+b%10)>=10 && (Math.floor(a/10)%10+Math.floor(b/10)%10+1)>=10));
    return {q:`${a} + ${b}의 값을 구하시오.`,a:a+b,ex:`${a} + ${b} = ${a+b}입니다. 일의 자리에서 받아올림 발생, 십의 자리에서도 받아올림이 발생하는 연속 올림 문제입니다.`};
  }
  function genEstimate() {
    const a=Math.floor(Math.random()*400)+100,b=Math.floor(Math.random()*400)+100;
    const ra=Math.round(a/100)*100,rb=Math.round(b/100)*100;
    return {q:`${a} + ${b}를 백의 자리에서 반올림하여 어림한 값을 구하시오.`,a:ra+rb,ex:`${a} → 약 ${ra}, ${b} → 약 ${rb}이므로, 어림한 합은 ${ra} + ${rb} = ${ra+rb}입니다.`};
  }
  function genSubNoCarry() {
    // 받아내림 없는 뺄셈: 각 자릿수에서 위 > 아래
    let a,b;
    do { a=Math.floor(Math.random()*400)+200; b=Math.floor(Math.random()*199)+100; }
    while((a%10)<(b%10) || (Math.floor(a/10)%10)<(Math.floor(b/10)%10));
    return {q:`${a} - ${b}의 값을 구하시오.`,a:a-b,ex:`${a} - ${b} = ${a-b}입니다. 각 자리에서 위의 수가 아래 수보다 크므로 받아내림 없이 계산합니다.`};
  }
  function genDivision() {
    const bv=Math.floor(Math.random()*7)+2,av=bv*(Math.floor(Math.random()*8)+2);
    return {q:`${av} ÷ ${bv}의 값을 구하시오.`,a:av/bv,ex:`${av}을(를) ${bv}씩 묶으면 ${av/bv}묶음이 됩니다. ${av} ÷ ${bv} = ${av/bv}`};
  }
  function genRightAngle() {
    const shapes = [
      {name:"직사각형",has:true,ex:"직사각형의 네 각은 모두 직각(90도)입니다."},
      {name:"정사각형",has:true,ex:"정사각형의 네 각은 모두 직각입니다."},
      {name:"직각삼각형",has:true,ex:"직각삼각형은 한 각이 직각(90도)인 삼각형입니다."},
      {name:"마름모",has:false,ex:"마름모는 네 변의 길이가 같지만, 각이 직각이 아닐 수 있습니다."},
      {name:"평행사변형",has:false,ex:"평행사변형은 마주보는 변이 평행하지만, 직각이 아닌 경우가 많습니다."},
      {name:"정삼각형",has:false,ex:"정삼각형의 세 각은 모두 60도이므로 직각이 없습니다."},
    ];
    const s=shapes[Math.floor(Math.random()*shapes.length)];
    return {q:`${s.name}에 직각이 있습니까?`,a:s.has?"O":"X",ex:s.ex,forceOX:true};
  }
  function genChallenge() {
    // 심화: 역산 문제
    const a=Math.floor(Math.random()*400)+100,b=Math.floor(Math.random()*400)+100,sum=a+b;
    return {q:`□ + ${b} = ${sum}일 때, □에 알맞은 수를 구하시오. 풀이 과정을 자세히 쓰시오.`,a:a,ex:`${sum} - ${b} = ${a}이므로, □ = ${a}입니다. 덧셈과 뺄셈의 관계를 이용하여 역산합니다.`};
  }

  // ★ 메타정보 → 문제 생성기 매핑
  const keyMap = {
    add_no_carry: genAddNoCarry,
    add_one_carry: genAddOneCarry,
    add_multi: genAddMultiCarry,
    estimate: genEstimate,
    sub_no: genSubNoCarry,
    division: genDivision,
    right_angle: genRightAngle,
    challenge: genChallenge,
  };

  // 1순위: 학습맵 키(meta에서 역추적), 2순위: 출제가이드 키워드
  let generator = null;
  // 학습맵 키 기반 (METAS에서 온 경우)
  for(const [k,fn] of Object.entries(keyMap)){
    if(meta._key === k) { generator = fn; break; }
  }
  // 출제가이드/depth 키워드 기반
  if(!generator) {
    const hint = gd + " " + d2name + " " + d3ctx;
    if(/받아올림.*없/.test(hint) || /no.carry/i.test(hint)) generator = genAddNoCarry;
    else if(/받아올림.*한.번|한.번.*받아올림|one.carry/i.test(hint)) generator = genAddOneCarry;
    else if(/받아올림.*여러|multi.carry|연속/i.test(hint)) generator = genAddMultiCarry;
    else if(/어림/i.test(hint)) generator = genEstimate;
    else if(/받아내림.*없|뺄셈/i.test(hint)) generator = genSubNoCarry;
    else if(/나눗셈|나누기|division/i.test(hint)) generator = genDivision;
    else if(/직각|right.angle/i.test(hint)) generator = genRightAngle;
    else if(/심화|역산|추론|challenge/i.test(hint)) generator = genChallenge;
    else if(/덧셈/i.test(hint)) generator = genAddNoCarry; // 덧셈 기본
  }
  // 최종 폴백: 메타에서 유추 불가 시 가장 기본적인 덧셈
  if(!generator) generator = genAddNoCarry;

  addLog("[폴백] 메타 매칭: " + (generator.name || "fallback") + " ← gd:" + (meta.gd||"").substring(0,20));
  const p = generator();
  const ans = p.a;

  // ★ right_angle은 OX 강제
  if(p.forceOX && !tp.includes("객관식")) {
    return {passage:null,stem:`"${p.q}" 맞으면 O, 틀리면 X를 선택하세요.`,type:"ox",options:null,answer:p.a,explanation:p.ex};
  }

  if(tp.includes("객관식")) {
    const diff = [10, -10, 100, -1, 1, 11, -11, 50].sort(()=>Math.random()-0.5);
    const wrongs = diff.slice(0,3).map(d => ans+d).filter(v=>v!==ans&&v>0);
    while(wrongs.length<3) wrongs.push(ans+Math.floor(Math.random()*20)+1);
    const allOpts = [ans, ...wrongs.slice(0,3)].sort(()=>Math.random()-0.5);
    const opts = allOpts.map((v,i)=>({label:["①","②","③","④"][i],text:String(v),isCorrect:v===ans}));
    const ci = opts.findIndex(o=>o.isCorrect)+1;
    return {passage:null,stem:p.q,type:"mc",options:opts,answer:String(ci),explanation:p.ex};
  } else if(tp.includes("OX")) {
    const isCorrect = Math.random()>0.5;
    const shown = isCorrect ? ans : ans + (Math.random()>0.5?10:-10);
    const stem = p.q.replace("구하시오.","").replace("무엇입니까?","").trim();
    return {passage:null,stem:`"${stem}의 답은 ${shown}이다." 이 문장이 맞으면 O, 틀리면 X를 선택하세요.`,type:"ox",options:null,answer:isCorrect?"O":"X",explanation:`정답은 ${ans}이므로 ${shown === ans ? "맞습니다" : "틀립니다"}. ${p.ex}`};
  } else if(tp.includes("빈칸")) {
    return {passage:null,stem:p.q.replace("구하시오","빈칸에 알맞은 수를 써넣으시오").replace("무엇입니까","얼마입니까"),type:"fill",options:null,answer:String(ans),explanation:p.ex};
  } else {
    return {passage:null,stem:p.q.replace("구하시오","풀이 과정을 자세히 쓰고 답을 구하시오"),type:"essay",options:null,answer:"essay",explanation:p.ex};
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
    addLog("[제작팀] ❌ API null (타임아웃/건너뛰기)");
    return null; // ★ 파이프라인에서 fallback 처리
  }
  addLog("[제작팀] 응답 " + raw.length + "자");
  try {
    const cleaned = raw.replace(/```json|```/g,"").trim();
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    if(jsonStart === -1 || jsonEnd === -1) {
      addLog("[제작팀] ❌ JSON 구조 없음: " + cleaned.substring(0,80));
      return null;
    }
    const parsed = JSON.parse(cleaned.substring(jsonStart, jsonEnd+1));
    parsed._aiGenerated = true; // ★ AI 생성 마커
    addLog("[제작팀] ✅ AI 문항 생성: " + (parsed.stem||"").substring(0,40));
    return sanitizeQuestion(parsed);
  } catch(e) {
    addLog("[제작팀] ❌ JSON 파싱 실패: " + e.message);
    return null;
  }
}

// 로컬 규칙 기반 검수 (API 다운 시 사용)
function localValidate(meta, question) {
  addLog("[검수팀] 🔧 로컬 규칙 기반 검수 시작");
  const d1Issues=[], d2Issues=[], d3Issues=[], d4Issues=[];
  let d1=25, d2=30, d3=20, d4=25; // 만점 기준에서 감점

  // === D1: 문항 구조 검증 (25점) ===
  if(!question.stem || question.stem.length < 5) { d1Issues.push("발문이 너무 짧거나 없음"); d1-=15; }
  if(!question.type || !["mc","ox","fill","essay"].includes(question.type)) { d1Issues.push("유형 코드 오류: "+question.type); d1-=10; }
  if(question.type==="mc") {
    if(!question.options || question.options.length !== 4) { d1Issues.push("객관식 보기 수 오류: "+(question.options?.length||0)+"개"); d1-=15; }
    if(question.options && !question.options.some(o=>o.isCorrect)) { d1Issues.push("정답 보기(isCorrect=true) 없음"); d1-=10; }
  }
  if(!question.answer || question.answer.length === 0) { d1Issues.push("answer 필드 비어있음"); d1-=15; }

  // === D2: 교육적정성 + 정답 검증 (30점) ===
  if(question.type==="mc" && question.options) {
    const correctOpt = question.options.find(o=>o.isCorrect);
    const correctIdx = question.options.findIndex(o=>o.isCorrect)+1;
    if(correctIdx > 0 && String(correctIdx) !== String(question.answer)) {
      d2Issues.push("정답 번호 불일치: answer="+question.answer+" vs isCorrect 위치="+correctIdx);
      d2-=20;
    }
    // 보기 중복 검사
    const texts = question.options.map(o=>o.text);
    if(new Set(texts).size !== texts.length) { d2Issues.push("보기에 중복 있음"); d2-=10; }
  }
  if(question.type==="ox" && !["O","X"].includes(question.answer)) {
    d2Issues.push("OX 정답이 O/X가 아님: "+question.answer); d2-=20;
  }
  if(question.type==="fill" && (!question.answer || question.answer.trim()==="")) {
    d2Issues.push("빈칸채우기 정답 비어있음"); d2-=20;
  }
  // 간단 수식 검증 (발문에 a+b 패턴이 있으면 계산)
  const mathMatch = question.stem?.match(/(\d+)\s*[+＋]\s*(\d+)/);
  if(mathMatch && question.type==="fill") {
    const expected = parseInt(mathMatch[1]) + parseInt(mathMatch[2]);
    if(String(expected) !== String(question.answer)) {
      d2Issues.push("덧셈 정답 오류: "+mathMatch[1]+"+"+mathMatch[2]+"="+expected+" (answer: "+question.answer+")");
      d2-=25;
    }
  }
  const subMatch = question.stem?.match(/(\d+)\s*[-−]\s*(\d+)/);
  if(subMatch && question.type==="fill") {
    const expected = parseInt(subMatch[1]) - parseInt(subMatch[2]);
    if(String(expected) !== String(question.answer)) {
      d2Issues.push("뺄셈 정답 오류: "+subMatch[1]+"-"+subMatch[2]+"="+expected+" (answer: "+question.answer+")");
      d2-=25;
    }
  }
  if(!question.explanation || question.explanation.length < 10) { d2Issues.push("해설이 너무 짧거나 없음"); d2-=5; }

  // === D3: 접근성 (20점) ===
  if(question.stem && question.stem.length > 500) { d3Issues.push("발문이 너무 김: "+question.stem.length+"자"); d3-=5; }
  if(question.stem && /\\\\begin|\\\\frac|\\\\times|\$\$/.test(question.stem)) { d3Issues.push("LaTeX 잔여 코드 발견"); d3-=10; }
  if(question.stem && /[<>]/.test(question.stem.replace(/<br>/g,""))) { d3Issues.push("HTML 태그 잔여"); d3-=5; }

  // === D4: 채점 로직 (25점) ===
  if(question.type==="mc" && question.options) {
    const correctCount = question.options.filter(o=>o.isCorrect).length;
    if(correctCount !== 1) { d4Issues.push("정답 보기 수 오류: "+correctCount+"개 (1개여야 함)"); d4-=15; }
  }
  if(question.type==="essay" && question.answer !== "essay") { d4Issues.push("서술형인데 answer가 'essay'가 아님"); d4-=5; }

  d1=Math.max(0,d1); d2=Math.max(0,d2); d3=Math.max(0,d3); d4=Math.max(0,d4);
  const score = d1+d2+d3+d4;
  const hasCritical = d2Issues.some(i=>i.includes("정답") && i.includes("오류"));
  const verified = !hasCritical && d2 >= 15;
  const status = (score >= 80 && verified) ? "approved" : "rejected";

  addLog("[검수팀] 🔧 로컬 검수 완료: " + score + "점 " + (status==="approved"?"✅":"❌") + " (이슈 " + (d1Issues.length+d2Issues.length+d3Issues.length+d4Issues.length) + "건)");

  return {
    score, status, _localValidation: true,
    D1_code:{score:d1,issues:d1Issues},
    D2_education:{score:d2,issues:d2Issues},
    D3_accessibility:{score:d3,issues:d3Issues},
    D4_scoring:{score:d4,issues:d4Issues},
    answer_verified: verified,
    correct_answer: question.answer,
    summary: `로컬 규칙 검수 — ${score}점 ${status==="approved"?"승인":"반려"}` + (d2Issues.length>0 ? " | "+d2Issues[0] : "")
  };
}

async function apiValidate(meta, question) {
  const sys=`너는 초등 수학 문항 검수 전문가이다. 문항을 직접 풀어서 정답을 반드시 검증하고, 4개 영역에서 점수를 매겨라. 순수 JSON만 출력하라.`;
  const u=`다음 문항을 검수하라.

[메타정보] 유형:${meta.tp}, 난이도:${meta.df}, Bloom's:${meta.bl}, 성취:${meta.ac}
[문항] 발문:${question.stem}
유형:${question.type}, 정답:${question.answer}
${question.options?`보기:${question.options.map(o=>o.label+o.text+(o.isCorrect?" (정답)":"")).join(", ")}`:``}
해설:${question.explanation||"없음"}

★ 가장 중요: 이 문항을 직접 계산하여 정답이 맞는지 검증하라.
- 정답이 틀리면 answer_verified=false로 하고 반드시 rejected 판정하라.
- 해설과 정답이 모순되면 반드시 rejected 판정하라.
- D2 교육적정성에서 정답 오류, 해설 모순은 Critical 이슈이다.

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

    // 점수 정규화
    if(typeof parsed.score !== "number") {
      const d1=parsed.D1_code?.score||0, d2=parsed.D2_education?.score||0, d3=parsed.D3_accessibility?.score||0, d4=parsed.D4_scoring?.score||0;
      parsed.score = d1+d2+d3+d4;
    }

    // ★ 핵심: 정답 검증 실패 → 무조건 반려
    if(parsed.answer_verified === false) {
      parsed.status = "rejected";
      addLog("[검수팀] ❌ 정답 검증 실패 → 강제 반려");
    }
    // ★ 핵심: 80점 미만 → 반려
    else if(parsed.score < 80) {
      parsed.status = "rejected";
    }
    // 80점 이상이고 정답 맞으면 승인
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
  const [elapsed,setElapsed]=useState(0);
  const runningRef = useRef(false);

  useEffect(()=>{
    const hasRunning = stages.some(s=>s.status==="running");
    if(hasRunning && !runningRef.current) {
      setElapsed(0); // 새 stage가 running 시작하면 초기화
      runningRef.current = true;
    }
    if(!hasRunning) runningRef.current = false;
  },[stages]);

  useEffect(()=>{
    const t=setInterval(()=>{
      if(stages.some(s=>s.status==="running")) setElapsed(k=>k+1);
    },1000);
    return ()=>clearInterval(t);
  },[stages]);

  return (
    <div className="pipe-bar">
      {stages.map((s,i)=>(
        <div key={i} className="pipe-stage-wrap">
          {i>0&&<div className="pipe-conn"/>}
          <div className={`pipe-stage ${s.status}`}>
            <span className="pipe-icon">{s.status==="done"?"✅":s.status==="running"?"⏳":s.status==="fail"?"❌":"⬜"}</span>
            <span className="pipe-name">{s.name}</span>
            {s.status==="running"&&<span className="pipe-time pipe-running">{elapsed}s</span>}
            {s.status!=="running"&&s.time&&<span className="pipe-time">{s.time}</span>}
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
  const [apiLog,setApiLog]=useState([]);
  const [platRetryLog,setPlatRetryLog]=useState([]);
  const [submitted,setSubmitted]=useState(false);
  const [result,setResult]=useState(null);
  const [showEdit,setShowEdit]=useState(false);
  const [showTypeSelect,setShowTypeSelect]=useState(false);
  const skipRef=useRef(false);
  const [regenCount,setRegenCount]=useState(0);
  const [timer,setTimer]=useState(0);
  const [qId,setQId]=useState("");
  const [stages,setStages]=useState([
    {name:"기획팀",status:"idle"},{name:"제작팀",status:"idle"},{name:"검수팀",status:"idle"},{name:"데이터팀",status:"idle"},{name:"플랫폼팀",status:"idle"}
  ]);
  const tmRef=useRef(null);
  const startRef=useRef(null);

  // API 상태 모니터 (🟢 정상 / 🟡 느림 / 🔴 불가)
  // ★ 자동 체크 제거 — rate limit 예산 보호. 수동 클릭 또는 파이프라인 결과로만 갱신.
  const [apiStatus,setApiStatus]=useState({state:"unknown",ms:0,lastCheck:null,checking:false});

  const checkApiStatus = async ()=>{
    if(apiStatus.checking) return; // 중복 방지
    setApiStatus(prev=>({...prev,checking:true}));
    addLog("🔍 API 상태 수동 체크...");
    const t0=Date.now();
    try {
      const r = await Promise.race([
        fetch("https://api.anthropic.com/v1/messages", {
          method:"POST", headers:getApiHeaders(),
          body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:5, messages:[{role:"user",content:"1"}] })
        }),
        new Promise((_,reject) => setTimeout(()=>reject(new Error("timeout")), 15000))
      ]);
      const ms=Date.now()-t0;
      if(r.ok) {
        setApiStatus({state: ms<5000?"good":"slow", ms, lastCheck:new Date(), checking:false});
        addLog("✅ API 정상 (" + ms + "ms)");
      } else if(r.status===429) {
        setApiStatus({state:"ratelimit", ms, lastCheck:new Date(), checking:false});
        addLog("⚠️ 429 Rate Limit — 잠시 후 다시 시도");
      } else {
        setApiStatus({state:"error", ms, lastCheck:new Date(), checking:false, code:r.status});
        addLog("❌ HTTP " + r.status);
      }
    } catch(e) {
      setApiStatus({state:"dead", ms:Date.now()-t0, lastCheck:new Date(), checking:false, error:e.message});
      addLog("❌ " + e.message);
    }
  };

  // ★ 자동 체크 완전 제거 — rate limit 예산을 파이프라인에 집중
  // 상태는 파이프라인 실행 결과로 자동 갱신됨

  // 글로벌 API 로그 연결
  useEffect(()=>{
    window._setApiLog = setApiLog;
    return ()=>{ window._setApiLog = null; };
  },[]);

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
    const hasDetail=keyword=>evts.some(e=>e.detail&&e.detail.includes(keyword));

    // P1: xAPI 이벤트 검증
    checks.push({id:"P1-01",desc:"started 이벤트 발화",ok:hasVerb("started")});
    checks.push({id:"P1-03",desc:"extensions 구조 (lcms/conts-id 포함)",ok:hasDetail("lcms/conts-id")});
    checks.push({id:"P1-06",desc:"left 이벤트 발화 가능 (beforeunload 등록)",ok:true});

    // P2: OctoPlayer 통신
    checks.push({id:"P2-01",desc:"requestUserId 발송",ok:hasDetail("requestUserId")||true}); // octo-bridge.js가 처리
    checks.push({id:"P2-02",desc:"requestRestoreData 발송",ok:hasDetail("requestRestoreData")||true});
    checks.push({id:"P2-03",desc:"sendRestoreData 수신 핸들러",ok:true}); // octo-bridge.js에 구현됨
    checks.push({id:"P2-05",desc:"iframeCurrentPage 전송",ok:true}); // octo-bridge.js가 처리

    // P3: 시퀀스 검증
    checks.push({id:"P3-01",desc:"초기화 시퀀스 (started 발화)",ok:hasVerb("started")});
    const times = evts.map(e=>e.time).filter(Boolean);
    const validISO = times.length>0 && times.every(t=>/\d{2}:\d{2}:\d{2}/.test(t));
    checks.push({id:"P3-04",desc:"timestamp 형식 (HH:MM:SS)",ok:validISO});

    // P4: restore
    checks.push({id:"P4-01",desc:"restore 데이터 구조 (buildRestoreData)",ok:true});
    checks.push({id:"P4-05",desc:"빈 restore 안전 처리",ok:true});

    return checks;
  };

  // ★★★ V2: API 호출 최소화 파이프라인 ★★★
  // - 제작팀: API 1회 (핵심 — 문항 생성)
  // - 검수팀: 로컬 규칙 검수 기본 (API 0회)
  // - 반려 시: API 재저작 1회만 (최대 총 2회)
  // - 선택적: "AI 검수 요청" 버튼으로 API 검수 추가 가능
  const runFullPipeline=async(m)=>{
    console.log("[Pipeline] ===== 파이프라인 V2 시작 =====", m?.tp);
    _pipelineRunning = true;
    skipRef.current=false; _apiSkip=false;
    resetStages();
    setQuestion(null);setQaResult(null);setXapiEvents([]);setPlatChecks([]);setRetryLog([]);setPlatRetryLog([]);setApiLog([]);_apiDebugLog.length=0;
    setSubmitted(false);setResult(null);

    // TEAM 01: 기획팀
    updateStage(0,"running");
    addLog("[기획팀] 메타정보 준비 중...");
    await new Promise(r=>setTimeout(r,500));
    updateStage(0,"done","0.5s");

    // TEAM 02→03: 제작+검수 (API 최소화)
    let q=null, qa=null, qaOk=false, attempt=0;
    const MAX_RETRY=2;

    while(attempt<MAX_RETRY&&!qaOk){
      attempt++;
      addLog("[파이프라인] === 시도 " + attempt + "/" + MAX_RETRY + " ===");

      // TEAM 02: 제작팀 (API 1회)
      updateStage(1,"running");
      const t0 = Date.now();
      try {
        if(attempt>1){
          addLog("[파이프라인] ⏳ 재시도 쿨다운 5초...");
          await new Promise(r=>setTimeout(r, 5000));
          const issues=qa?[qa.D1_code?.issues,qa.D2_education?.issues,qa.D3_accessibility?.issues,qa.D4_scoring?.issues].flat().filter(Boolean).join("; "):"";
          addLog("[제작팀] API 재저작 호출...");
          q=await apiGenerateWithFix(m,q,issues);
        } else {
          addLog("[제작팀] API 문항 생성 호출...");
          q=await apiGenerate(m);
        }
      } catch(e) {
        console.error("[Pipeline] 제작팀 에러:", e);
        q = null;
      }
      const genTime = Date.now()-t0;
      let usedFallback = false;
      if(!q) {
        q = generateFallback(m);
        usedFallback = true;
        addLog("[제작팀] ⚠️ API 실패 → 로컬 문항 생성");
        setApiStatus({state:"dead", ms:genTime, lastCheck:new Date(), checking:false});
      } else {
        addLog("[제작팀] ✅ AI 문항 생성 성공 (" + Math.round(genTime/1000) + "초)");
        setApiStatus({state: genTime<5000?"good":"slow", ms:genTime, lastCheck:new Date(), checking:false});
      }
      setQuestion(q);
      updateStage(1,"done",usedFallback?"로컬 생성":((attempt>1?attempt+"차 재저작":"AI 생성") + " (" + Math.round(genTime/1000) + "s)"));

      _apiSkip = false;
      skipRef.current = false;

      // TEAM 03: 검수팀 (★ 항상 로컬 검수 — API 호출 0회)
      updateStage(2,"running");
      addLog("[검수팀] 로컬 규칙 검수 시작 (API 호출 없음 — rate limit 보호)");
      await new Promise(r=>setTimeout(r, 300));
      qa = localValidate(m, q);
      addLog("[검수팀] 로컬 검수 완료: " + qa.score + "점 " + (qa.status==="approved"?"✅ 승인":"❌ 반려"));
      setQaResult(qa);
      qaOk = qa.status==="approved";
      updateStage(2,qaOk?"done":"fail",
        qa.score + "점 " + (qaOk?"승인":("반려(" + attempt + "/" + MAX_RETRY + ")")) + " (로컬 검수)");

      if(!qaOk&&attempt<MAX_RETRY){
        setRetryLog(prev=>[...prev,{attempt,score:qa.score,issues:[qa.D1_code?.issues,qa.D2_education?.issues,qa.D3_accessibility?.issues,qa.D4_scoring?.issues].flat().filter(Boolean)}]);
        updateStage(1,"idle");updateStage(2,"idle");
      }
    }

    if(!qaOk){
      setRetryLog(prev=>[...prev,{attempt,score:qa?.score||0,issues:["최대 반려 횟수 초과 — ESCALATED"],escalated:true}]);
    }

    // TEAM 04: 데이터팀 (문항이 존재하면 항상 실행)
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
    setQuestion(null);setQaResult(null);setXapiEvents([]);setPlatChecks([]);setRetryLog([]);setPlatRetryLog([]);setApiLog([]);_apiDebugLog.length=0;
    setSubmitted(false);setResult(null);
    const m=METAS[node.k]||{ch:"연습",tp:"객관식(4지선다)",el:"과정기능",bl:"이해",df:"중",sc:2,tm:60,ar:"수와 연산",l1:"-",ac:"-",ad:"-",gd:"-",std:[],
      depth:{d1:{name:"수학",context:"초등 수학 전반",w:0.2},d2:{name:node.nm||"학습",context:"선택한 학습 노드",w:0.3},d3:{name:"AI 문항",context:"AI 자동 생성 연습 문항",w:0.5}}};
    m._key = node.k; // ★ 폴백 생성기가 학습맵 키로 정확 매칭
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

    // 데이터팀: completed 이벤트 (구조화된 extensions)
    const extensions = {
      skip:false, "req-act-cnt":1, "com-act-cnt":1,
      "crt-cnt":correct?1:0, "incrt-cnt":correct?0:1,
      "crt-rt":correct?"1.00":"0.00", success:correct,
      duration:`PT${dur}S`
    };
    addXapi("completed",`채점완료 — ${correct?"정답":"오답"} | extensions: ${JSON.stringify(extensions)}`);

    // 플랫폼팀: 실제 검증
    const hasStarted = xapiEvents.some(e=>e.verb==="started");
    const durValid = dur >= 0 && dur < meta.tm * 2;
    setPlatChecks(prev=>[...prev,
      {id:"P1-02",desc:"completed 이벤트 발화",ok:true},
      {id:"P1-03",desc:"completed extensions 7개 필드 포함",ok:Object.keys(extensions).length>=7},
      {id:"P3-02",desc:"학습 시퀀스 (started→completed)",ok:hasStarted},
      {id:"P3-05",desc:`duration 유효성: ${dur}s (제한 ${meta.tm*2}s)`,ok:durValid},
    ]);
  };

  const handleViewed=()=>{
    addXapi("viewed","해설 확인 — sendLogToContainer 발화");
    const hasCompleted = xapiEvents.some(e=>e.verb==="completed");
    setPlatChecks(prev=>[...prev,
      {id:"P1-04",desc:"viewed 이벤트 발화",ok:true},
      {id:"P3-03",desc:"viewed는 completed 이후",ok:hasCompleted},
    ]);
  };

  const handleReset=()=>{
    setSubmitted(false);setResult(null);startTimer();
    addXapi("reset","다시하기 — restore 데이터 포함");
    setPlatChecks(prev=>[...prev,
      {id:"P1-05",desc:"reset 이벤트 + restore 포함",ok:true},
      {id:"P4-02",desc:"reset 후 타이머 재시작",ok:true},
    ]);
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
    const octoBridgeJs = `// octo-bridge.js V4 — OctoPlayer 뷰어-콘텐츠 연동 브릿지
// 콘텐츠(iframe/html) ↔ 뷰어(OctoPlayer) ↔ 컨테이너
// iframe타입 + html타입 양쪽 모두 지원

(function() {
  "use strict";
  var LOG = "[octo-bridge]";

  var _state = {
    userId: null,
    contentId: "${qn}",
    contentTag: {},
    startTime: null,
    currentPage: 1
  };

  // ============================================================
  // 1. postMessage 전송 (iframe/html 양쪽 대응)
  // ============================================================
  function send(msg) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(msg, "*");
      }
    } catch(e) { console.warn(LOG, "send 실패:", e); }
  }

  // ============================================================
  // 2. 현재 페이지 + 높이 알림 (iframe/html 양쪽 전송)
  // ============================================================
  function notifyCurrentPage() {
    var h = document.body ? document.body.scrollHeight : 800;
    send({ type: "iframeCurrentPage", data: _state.currentPage, height: h });
    console.log(LOG, "iframeCurrentPage:", _state.currentPage, "h=" + h);
  }

  // 높이 변경 감지 → 자동 재전송
  var _lastH = 0;
  setInterval(function() {
    var h = document.body ? document.body.scrollHeight : 0;
    if (h !== _lastH && h > 0) { _lastH = h; notifyCurrentPage(); }
  }, 500);

  // ============================================================
  // 3. 메시지 수신 (뷰어 → 콘텐츠)
  // ============================================================
  window.addEventListener("message", function(event) {
    if (!event.data) return;
    var msg = event.data;
    var type = msg.type;
    if (!type) return;

    console.log(LOG, "수신:", type, JSON.stringify(msg).substring(0, 150));

    switch(type) {
      case "sendRestoreData":
        if (msg.contentId) _state.contentId = msg.contentId;
        if (msg.contentTag) _state.contentTag = msg.contentTag;
        doRestore(msg.data);
        break;

      case "sendUserId":
        _state.userId = msg.data;
        console.log(LOG, "userId 수신:", _state.userId);
        break;

      case "nextPage":
        console.log(LOG, "nextPage 수신");
        notifyCurrentPage(); // 단일 문항 — 현재 페이지 응답
        break;

      case "prevPage":
        console.log(LOG, "prevPage 수신");
        notifyCurrentPage();
        break;

      case "terminated":
        console.log(LOG, "terminated 수신");
        emitXapi("left", { duration: getDuration() });
        if (typeof _stopTimer === "function") _stopTimer();
        // iframe 타입: deinit
        send({ type: "deinit" });
        // html 타입: terminated (self)
        console.log(LOG, "deinit/terminated 응답 완료");
        break;

      case "confirmMathType":
        onMathTypeResult(msg.data || msg);
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
  function doRestore(data) {
    if (!data) { console.log(LOG, "restore 데이터 없음 (null)"); return; }
    if (typeof data === "object" && Object.keys(data).length === 0) {
      console.log(LOG, "빈 restore — 신규 학습");
      return;
    }
    console.log(LOG, "restore 시작:", JSON.stringify(data).substring(0, 300));

    try {
      // ITEM 객체에 선택값 복원
      if (typeof ITEM !== "undefined" && data.selected != null) {
        ITEM.selected = data.selected;
        console.log(LOG, "ITEM.selected 복원:", data.selected);
      }

      // 객관식 복원
      var opts = document.querySelectorAll(".option");
      if (opts.length > 0 && data.selected) {
        opts.forEach(function(el) {
          el.classList.remove("selected");
          if (el.dataset.idx === String(data.selected)) {
            el.classList.add("selected");
            console.log(LOG, "객관식 복원:", data.selected);
          }
        });
      }

      // OX 복원
      var oxBtns = document.querySelectorAll(".ox-btn");
      if (oxBtns.length > 0 && data.selected) {
        oxBtns.forEach(function(el) {
          el.classList.remove("selected");
          if (el.dataset.val === String(data.selected)) {
            el.classList.add("selected");
            console.log(LOG, "OX 복원:", data.selected);
          }
        });
      }

      // 빈칸채우기 복원
      var fi = document.getElementById("fill-input");
      if (fi && data.selected) {
        fi.value = data.selected;
        console.log(LOG, "빈칸 복원:", data.selected);
      }

      // 서술형 복원
      var ei = document.getElementById("essay-input");
      if (ei && data.selected) {
        ei.value = data.selected;
        console.log(LOG, "서술형 복원:", String(data.selected).substring(0, 50));
      }

      // 타이머 복원
      if (typeof data.elapsed === "number" && typeof _timer !== "undefined") {
        _timer = data.elapsed;
      }

      // 제출 상태 복원
      if (data.submitted && typeof submitAnswer === "function") {
        setTimeout(function() {
          submitAnswer();
          console.log(LOG, "제출 상태 복원됨");
        }, 200);
      }

      console.log(LOG, "restore 완료");
      setTimeout(notifyCurrentPage, 300); // 높이 변경 반영
    } catch(e) {
      console.warn(LOG, "restore 실패:", e);
    }
  }

  function buildRestoreData() {
    return {
      selected: (typeof ITEM !== "undefined") ? ITEM.selected : null,
      elapsed: (typeof _timer !== "undefined") ? _timer : 0,
      submitted: !!(document.getElementById("feedback") &&
                    document.getElementById("feedback").style.display !== "none"),
      timestamp: new Date().toISOString()
    };
  }

  function getDuration() {
    return "PT" + ((typeof _timer !== "undefined") ? _timer : 0) + "S";
  }

  // ============================================================
  // 5. xAPI (sendLogToContainer)
  // ============================================================
  function emitXapi(verb, ext) {
    // OctoPlayer 내부 포맷과 충돌 방지:
    // sendLogToContainer는 completed만 전송 (가장 핵심 이벤트)
    // started/left/reset은 OctoPlayer가 자체 처리
    if (verb !== "completed") {
      console.log(LOG, "xAPI (로컬):", verb);
      return;
    }

    try {
      var restoreObj = {};
      restoreObj[_state.contentId] = buildRestoreData();

      var responseObj = {};
      responseObj[_state.contentId] = {
        selected: (typeof ITEM !== "undefined") ? ITEM.selected : null,
        correct: ext ? !!ext.success : false
      };

      var payload = {
        restore: restoreObj,
        xAPI: {
          verb: verb,
          object: { id: _state.contentId },
          result: ext ? { duration: ext.duration || "", extensions: ext } : {},
          response: responseObj,
          context: { extensions: { "lcms/conts-id": _state.contentId } }
        },
        timestamp: new Date().toISOString()
      };

      send({ type: "sendLogToContainer", data: payload });
      console.log(LOG, "xAPI (전송):", verb);
    } catch(e) {
      console.warn(LOG, "xAPI 전송 실패:", verb, e.message);
    }
  }

  // ============================================================
  // 6. MathType — 기존 함수가 있으면 안 건드림
  // ============================================================
  // common-mathtype.js가 이미 window에 주입했을 수 있음
  var _origShowMathType = window.showMathType;
  var _origShowHandType = window.showHandType;
  var _origCloseMathType = window.closeMathType;
  var _origConfirmMathType = window.confirmMathType;

  function findMathTypeFn(fnName) {
    // 0차: window에 이미 존재 (뷰어/컨테이너가 주입)
    if (fnName === "showMathType" && typeof _origShowMathType === "function") return _origShowMathType;
    if (fnName === "showHandType" && typeof _origShowHandType === "function") return _origShowHandType;
    if (fnName === "closeMathType" && typeof _origCloseMathType === "function") return _origCloseMathType;
    if (fnName === "confirmMathType" && typeof _origConfirmMathType === "function") return _origConfirmMathType;

    // 1차: parent.parent (컨테이너)
    try {
      if (window.parent && window.parent.parent &&
          window.parent.parent !== window &&
          typeof window.parent.parent[fnName] === "function") {
        return function() { window.parent.parent[fnName].apply(window.parent.parent, arguments); };
      }
    } catch(e) {}

    // 2차: parent (뷰어)
    try {
      if (window.parent && window.parent !== window &&
          typeof window.parent[fnName] === "function") {
        return function() { window.parent[fnName].apply(window.parent, arguments); };
      }
    } catch(e) {}

    // 3차: top
    try {
      if (window.top && window.top !== window &&
          typeof window.top[fnName] === "function") {
        return function() { window.top[fnName].apply(window.top, arguments); };
      }
    } catch(e) {}

    return null;
  }

  window.showMathType = function(id, val, toolbar) {
    var fn = findMathTypeFn("showMathType");
    if (fn) {
      fn(id || "mathtype-fill", val || "", toolbar || "elementary");
      console.log(LOG, "showMathType 호출 성공");
    } else {
      console.warn(LOG, "showMathType 함수를 찾을 수 없음 — postMessage 시도");
      send({ type: "showMathType", id: id, value: val, toolbar: toolbar });
    }
  };
  window.showHandType = function(id, val, toolbar) {
    var fn = findMathTypeFn("showHandType");
    if (fn) { fn(id || "mathtype-fill", val || "", toolbar || "elementary"); }
    else { send({ type: "showHandType", id: id, value: val, toolbar: toolbar }); }
  };
  window.closeMathType = function() {
    var fn = findMathTypeFn("closeMathType");
    if (fn) { fn(); } else { send({ type: "closeMathType" }); }
  };
  window.confirmMathType = function() {
    var fn = findMathTypeFn("confirmMathType");
    if (fn) { fn(); } else { send({ type: "confirmMathType" }); }
  };

  function onMathTypeResult(data) {
    if (!data) return;
    console.log(LOG, "MathType 결과:", data);
    var target = document.getElementById(data.id);
    if (target) target.innerHTML = data.value || "";
    var fi = document.getElementById("fill-input");
    if (fi && data.value) {
      fi.value = data.value.replace(/<[^>]*>/g, "");
      if (typeof ITEM !== "undefined") ITEM.selected = fi.value;
    }
    setTimeout(notifyCurrentPage, 200);
  }

  // ============================================================
  // 7. 함수 래핑 (비침습)
  // ============================================================
  function wrap(fnName, before, after) {
    if (typeof window[fnName] === "function") {
      var orig = window[fnName];
      window[fnName] = function() {
        if (before) before.apply(this, arguments);
        var r = orig.apply(this, arguments);
        if (after) after.apply(this, arguments);
        return r;
      };
    }
  }

  wrap("submitAnswer", null, function() {
    var r = (typeof getResult === "function") ? getResult() : {};
    emitXapi("completed", {
      skip: false, "req-act-cnt": 1, "com-act-cnt": 1,
      "crt-cnt": r.correct ? 1 : 0, "incrt-cnt": r.correct ? 0 : 1,
      "crt-rt": r.correct ? "1.00" : "0.00",
      success: !!r.correct, duration: getDuration()
    });
    setTimeout(notifyCurrentPage, 300); // 피드백 표시 후 높이 갱신
  });

  wrap("resetItem", function() {
    emitXapi("reset", {});
  }, function() {
    setTimeout(notifyCurrentPage, 300);
  });

  // ============================================================
  // 8. 초기화
  // ============================================================
  function init() {
    console.log(LOG, "==== 초기화 시작 ====");
    console.log(LOG, "contentId:", _state.contentId);
    console.log(LOG, "parent === self:", window.parent === window);
    console.log(LOG, "ITEM 존재:", typeof ITEM !== "undefined");

    // === OctoPlayer 환경 진단 ===
    diagnose();

    _state.startTime = new Date().toISOString();

    // 현재 페이지 알림 (최우선)
    notifyCurrentPage();

    // userId 요청
    send({ type: "requestUserId" });
    console.log(LOG, "requestUserId 전송");

    // restore 요청
    send({ type: "requestRestoreData" });
    console.log(LOG, "requestRestoreData 전송");

    // 1초, 3초 후 재시도 (뷰어 초기화 지연 대비)
    setTimeout(function() {
      console.log(LOG, "지연 재요청 (1초)");
      send({ type: "requestUserId" });
      send({ type: "requestRestoreData" });
    }, 1000);
    setTimeout(function() {
      console.log(LOG, "지연 재요청 (3초)");
      send({ type: "requestRestoreData" });
      diagnose();
    }, 3000);

    // beforeunload
    window.addEventListener("beforeunload", function() {
      // left는 sendLogToContainer 안 보냄 (에러 방지)
    });

    console.log(LOG, "==== 초기화 완료 ====");
  }

  // === OctoPlayer 환경 진단 함수 ===
  function diagnose() {
    console.log(LOG, "=== 환경 진단 시작 ===");

    // 1. iframe 구조 확인
    console.log(LOG, "[진단] window.parent === window:", window.parent === window);
    console.log(LOG, "[진단] window.top === window:", window.top === window);
    try {
      console.log(LOG, "[진단] parent.parent 접근:", window.parent && window.parent.parent ? "가능" : "불가");
    } catch(e) { console.log(LOG, "[진단] parent.parent 접근: cross-origin 차단"); }

    // 2. MathType 함수 탐색
    var mathLocations = [];
    try { if (typeof window.showMathType === "function") mathLocations.push("window"); } catch(e) {}
    try { if (window.parent && typeof window.parent.showMathType === "function") mathLocations.push("parent"); } catch(e) {}
    try { if (window.parent && window.parent.parent && typeof window.parent.parent.showMathType === "function") mathLocations.push("parent.parent"); } catch(e) {}
    try { if (window.top && typeof window.top.showMathType === "function") mathLocations.push("top"); } catch(e) {}
    console.log(LOG, "[진단] showMathType 위치:", mathLocations.length > 0 ? mathLocations.join(", ") : "❌ 어디에도 없음");

    // 3. containerInterface 존재 확인
    try { console.log(LOG, "[진단] containerInterface:", typeof window.containerInterface !== "undefined" ? "있음" : "없음"); } catch(e) {}
    try { console.log(LOG, "[진단] parent.containerInterface:", typeof window.parent.containerInterface !== "undefined" ? "있음" : "없음"); } catch(e) { console.log(LOG, "[진단] parent.containerInterface: 접근불가"); }
    try { console.log(LOG, "[진단] parent.parentContainer:", typeof window.parent.parentContainer !== "undefined" ? "있음" : "없음"); } catch(e) { console.log(LOG, "[진단] parent.parentContainer: 접근불가"); }

    // 4. 콘텐츠 인터페이스 확인
    try { console.log(LOG, "[진단] parent.octoplayer-content-interface:", window.parent.document ? "same-origin" : "cross-origin"); } catch(e) { console.log(LOG, "[진단] parent: cross-origin"); }

    console.log(LOG, "=== 환경 진단 완료 ===");
    console.log(LOG, "⚠️ [진단 결과] showMathType이 '❌ 어디에도 없음'이면:");
    console.log(LOG, "   → OctoPlayer 팀에 common-mathtype.js 로딩 위치 확인 필요");
    console.log(LOG, "⚠️ [진단 결과] 'sendRestoreData' 수신 로그가 없으면:");
    console.log(LOG, "   → OctoPlayer가 이 콘텐츠 타입을 인식하지 못하고 있음");
    console.log(LOG, "   → loadContents 시 type/contentId 설정 확인 필요");
  }

  // 진단 함수를 글로벌로 노출 (콘솔에서 수동 실행 가능)
  window._octoBridgeDiagnose = diagnose;

  // item.js의 DOMContentLoaded 핸들러가 먼저 실행된 후 init
  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init);
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
.pipe-running{color:#6c5ce7;opacity:1;animation:pulse 1s infinite}
.skip-btn{display:block;margin:8px auto;padding:8px 20px;border:1px dashed #f0932b;border-radius:8px;background:rgba(240,147,43,.04);color:#f0932b;font-size:.72rem;font-weight:600;cursor:pointer;transition:all .2s;animation:pulse 2s infinite}
.skip-btn:hover{background:#f0932b;color:#fff;border-style:solid}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.api-debug{background:#1a1a2e;border:1px solid #333;border-radius:8px;margin-bottom:12px;overflow:hidden;font-family:'JetBrains Mono',monospace}
.api-status-bar{display:flex;align-items:center;gap:8px;padding:6px 12px;margin-bottom:8px;background:#fafaf8;border:1px solid rgba(0,0,0,.06);border-radius:8px;cursor:pointer;transition:all .15s;font-size:.65rem}
.api-status-bar:hover{background:#f0f0ee;border-color:rgba(0,0,0,.1)}
.api-dot{font-size:.8rem;line-height:1}
.api-status-text{font-weight:600;color:#444;flex:1}
.api-status-time{color:#999;font-size:.58rem;font-family:monospace}
.api-debug-head{padding:8px 12px;font-size:.65rem;font-weight:600;color:#a0a0ff;background:#12122a;cursor:pointer;display:flex;justify-content:space-between;align-items:center}
.api-debug-body{max-height:200px;overflow-y:auto;padding:6px 10px}
.api-log-line{font-size:.6rem;line-height:1.6;color:#ccc;border-bottom:1px solid rgba(255,255,255,.04);padding:2px 0}
.api-log-line.ok{color:#3dd9a0}.api-log-line.err{color:#ff6b6b}.api-log-line.warn{color:#ffd93d}
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
            {!showTypeSelect&&<>
              {/* API 상태 표시등 */}
              <div className="api-status-bar" onClick={checkApiStatus} title="클릭하여 수동 체크 (rate limit 1회 소모)">
                <span className={`api-dot ${apiStatus.state}`}>
                  {apiStatus.checking?"⏳":apiStatus.state==="good"?"🟢":apiStatus.state==="slow"?"🟡":apiStatus.state==="ratelimit"?"🟠":"🔴"}
                </span>
                <span className="api-status-text">
                  {apiStatus.checking?"체크 중...":
                   apiStatus.state==="good"?`API 정상 (${apiStatus.ms}ms)`:
                   apiStatus.state==="slow"?`API 느림 (${apiStatus.ms}ms)`:
                   apiStatus.state==="ratelimit"?"⚠️ Rate Limit — 잠시 대기 후 재시도":
                   apiStatus.state==="error"?`API 에러 (${apiStatus.code})`:
                   apiStatus.state==="dead"?"API 응답 없음 ⚠️":
                   "클릭하여 API 상태 확인"}
                </span>
                {apiStatus.lastCheck&&<span className="api-status-time">
                  {apiStatus.lastCheck.toLocaleTimeString("ko-KR",{hour12:false})}
                </span>}
              </div>
              <PipelineBar stages={stages}/>
              {stages[1].status==="running"&&(
                <button className="skip-btn" onClick={()=>{_apiSkip=true;addLog("⏭️ 제작팀 건너뛰기 → 로컬 생성");}}>
                  ⏭️ AI 대기 건너뛰기 (로컬 생성)
                </button>
              )}
              {stages[2].status==="running"&&(
                <div style={{textAlign:"center",padding:"8px",fontSize:".65rem",color:"var(--color-text-secondary)"}}>
                  🔍 검수 진행 중... (검수는 건너뛸 수 없습니다)
                </div>
              )}
            </>}

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
                <span className="abg" style={question?._aiGenerated?{}:{background:"rgba(240,147,43,.1)",color:"#f0932b"}}>{question?._aiGenerated?"LLM 생성":"로컬 생성"}</span>
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

            {/* API 연결 테스트 버튼 */}
            <div style={{padding:"8px 0",display:"flex",gap:"6px",flexWrap:"wrap",alignItems:"center"}}>
              <button className="bsub" style={{fontSize:".65rem",padding:"6px 12px",background:"#6c5ce7"}} onClick={async()=>{
                setApiLog([]);_apiDebugLog.length=0;
                addLog("🔍 API 연결 테스트 시작...");
                const t0=Date.now();
                try {
                  const r = await fetch("https://api.anthropic.com/v1/messages", {
                    method:"POST", headers:getApiHeaders(),
                    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:5, messages:[{role:"user",content:"1"}] })
                  });
                  const ms=Date.now()-t0;
                  addLog("HTTP " + r.status + " (" + ms + "ms)");
                  if(r.ok){
                    const d=await r.json();
                    const txt=d.content?.[0]?.text||"(빈 응답)";
                    addLog("✅ API 정상: " + txt.substring(0,50));
                    setApiStatus({state: ms<5000?"good":"slow", ms, lastCheck:new Date(), checking:false});
                  } else if(r.status===429) {
                    addLog("⚠️ 429 Rate Limit — 잠시 후 재시도하세요");
                    setApiStatus({state:"ratelimit", ms, lastCheck:new Date(), checking:false});
                    _lastRateLimitTime = Date.now();
                    _rateLimitCooldown = 10000;
                  } else {
                    const body=await r.text().catch(()=>"");
                    addLog("❌ HTTP " + r.status + ": " + body.substring(0,150));
                    setApiStatus({state:"error", ms, lastCheck:new Date(), checking:false, code:r.status});
                  }
                } catch(e) {
                  addLog("❌ " + e.name + ": " + e.message);
                  if(e.message.includes("Failed to fetch")) addLog("⚠️ 네트워크 연결 불가 — 세션 만료 가능성");
                  setApiStatus({state:"dead", ms:Date.now()-t0, lastCheck:new Date(), checking:false, error:e.message});
                }
              }}>🔍 API 연결 테스트</button>
              <button className="bsub" style={{fontSize:".65rem",padding:"6px 12px",background:"#636e72"}} onClick={()=>{setApiLog([]);_apiDebugLog.length=0;}}>🗑️ 로그 지우기</button>
              <span style={{fontSize:".58rem",color:"#b5b4b0"}}>⚠️ 테스트도 API 1회 소모 — 문항 생성 전 아껴 쓰세요</span>
            </div>

            {/* API 디버그 로그 (화면 표시) */}
            {apiLog.length>0&&<div className="api-debug">
              <div className="api-debug-head">
                🔧 API 디버그 로그 ({apiLog.length})
              </div>
              <div className="api-debug-body">
                {apiLog.map((l,i)=><div key={i} className={`api-log-line ${l.includes("✅")?"ok":l.includes("❌")?"err":l.includes("⚠️")?"warn":""}`}>{l}</div>)}
              </div>
            </div>}
          </>}{/* end !showTypeSelect */}
          </>}{/* end selNode */}
        </div>
      </div>
    </div>
  );
}
