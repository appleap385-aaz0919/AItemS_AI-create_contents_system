// ZIP 산출물 빌더 — handleDownload 로직을 순수 함수로 추출
// 6파일 구조: index.html, css/reset.css, css/style.css, js/item.js, js/octo-bridge.js, meta.json

import { addLog } from '../api/apiLog.js';
import { renderVisualSvg } from '../generators/svgGenerators.js';

export function downloadItemZip(question, meta, qId, addXapi) {
  if(!question||!meta) return;
  const qn=qId||"Q-000";

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
${question.visual?`<div class="visual-svg">${renderVisualSvg(question.visual)}</div>`:""}
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

  // item.js — Issue #5: checkQuestion / showSolution 추가
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
  var lines = ITEM.explanation.replace(/([.?!。])\\s*/g, "$1\\n").split("\\n").filter(function(l){return l.trim();});
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

// Math Pad
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

// MathType API
function openMathTypeInput() {
  var toolbar = "${meta.ch === "심화" || meta.ch === "총괄" ? "high" : "elementary"}";
  if(typeof showMathType === "function") {
    showMathType("mathtype-fill", document.getElementById("mathtype-fill").innerHTML || "", toolbar);
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

// checkQuestion — 뷰어의 채점 요청에 응답
function checkQuestion() {
  submitAnswer();
  var r = getResult();
  var status = {
    isCorrect: r.correct,
    score: r.correct ? 1 : 0,
    answer: ITEM.selected,
    isCompleted: true,
    contentId: window.contentInterface ? window.contentInterface.contentId : ""
  };
  // receiveCheckStatus로 결과 전달
  if (window.parentContainer && typeof window.parentContainer.receiveCheckStatus === "function") {
    window.parentContainer.receiveCheckStatus(status);
  }
  if (window.contentInterface && typeof window.contentInterface.sendCheckStatus === "function") {
    window.contentInterface.sendCheckStatus(status);
  }
  return status;
}

// showSolution — 정답/해설 표시
function showSolution(show) {
  if (show === false) {
    document.getElementById("feedback").style.display = "none";
    return;
  }
  var fb = document.getElementById("feedback");
  var fbResult = document.getElementById("fb-result");
  var fbBody = document.getElementById("fb-explain-body");
  fb.style.display = "flex";
  fbResult.className = "fb-result fc";
  fbResult.innerHTML = "정답: " + ITEM.answer;
  var lines = ITEM.explanation.replace(/([.?!。])\\s*/g, "$1\\n").split("\\n").filter(function(l){return l.trim();});
  fbBody.innerHTML = lines.map(function(l){return "<p style='margin:0 0 6px 0'>" + l.trim() + "</p>";}).join("");
  // Mark correct option
  if (ITEM.type === "mc") {
    document.querySelectorAll(".option").forEach(function(el) {
      if (el.dataset.idx === String(ITEM.answer)) el.classList.add("correct");
    });
  }
}

// showAnswer — alias for showSolution
function showAnswer() { showSolution(true); }

// resetQuestion — 뷰어의 초기화 요청
function resetQuestion() { resetItem(); }

// getAttemptQuestion — 현재 답안 상태 반환
function getAttemptQuestion() {
  return { selected: ITEM.selected, type: ITEM.type, answer: ITEM.answer };
}

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

  // style.css — Issue #6: #editorContainer CSS + MathType 스타일 추가
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
.visual-svg{text-align:left;margin:12px 0;padding:12px}
.visual-svg svg{max-width:100%;height:auto}
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
#editorContainer{position:absolute;top:0;left:0;width:720px;height:200px;padding-bottom:80px;background-color:#fff;z-index:1000;display:none;box-shadow:2px 6px 20px 0px rgba(0,0,0,0.25);box-sizing:content-box}
#editorContainer .mathtype-top-area{height:30px;padding:0 10px;background-color:#7C8E99}
#editorContainer .btn-mathtype-wrapper{height:50px;padding:0 20px;border:1px solid #CED7DA;border-top:0;background-color:#ECF1F3;text-align:right}
#editorContainer .btn-mathtype-wrapper button{position:relative;width:145px;height:32px;margin:8px 0;border-radius:6px;background-color:#fff;border:1px solid #D6D6D6}
#editorContainer .btn-mathtype-wrapper button.btn-mathtype-apply{margin-left:10px;background-color:#778E9A;border-color:#778E9A;color:#fff}
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

  // reset.css — Issue #7: CSS 변수 완성
  const resetCss=`@import url(//spoqa.github.io/spoqa-han-sans/css/SpoqaHanSansNeo.css);
@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100..900&display=swap");
:root{--border:#fff;--background:#ccced6;--primary-color:#0084ff;--elementary_bg-color:#0084ff;--secondary_bg-color:#f9fafc;--secondary-color:#e6eef9;--lightgray:#e8eaf0;--gray:#ddd;--good:#f44e80}
html,body,div,span,h1,h2,h3,h4,h5,h6,p,a,img,ol,ul,li,table,caption,tbody,thead,tr,th,td{margin:0;padding:0;border:0}
*,*::before,*::after{box-sizing:border-box}
body{line-height:1;-webkit-font-smoothing:antialiased}
ol,ul{list-style:none}table{border-collapse:collapse;border-spacing:0}
button,input,select,textarea{margin:0;padding:0;background:none;border:none;font:inherit;color:inherit;outline:none}
button{cursor:pointer}a,a:link{text-decoration:none;color:inherit}`;

  // octo-bridge.js V4.2 — Issue #1~#4 수정
  const octoBridgeJs = `// octo-bridge.js V4.2 — OctoPlayer 뷰어-콘텐츠 연동 브릿지
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

  function send(msg) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(msg, "*");
      }
    } catch(e) { console.warn(LOG, "send 실패:", e); }
  }

  // IFrame 콘텐츠는 iframeCurrentPage만 전송 (htmlCurrentPage는 html/uniplayer 전용)
  function notifyCurrentPage() {
    var h = document.body ? document.body.scrollHeight : 800;
    send({ type: "iframeCurrentPage", data: _state.currentPage, height: h });
    console.log(LOG, "iframeCurrentPage:", _state.currentPage, "h=" + h);
  }

  var _lastH = 0;
  setInterval(function() {
    var h = document.body ? document.body.scrollHeight : 0;
    if (h !== _lastH && h > 0) { _lastH = h; notifyCurrentPage(); }
  }, 500);

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
        notifyCurrentPage();
        break;
      case "prevPage":
        console.log(LOG, "prevPage 수신");
        notifyCurrentPage();
        break;
      case "terminated":
        console.log(LOG, "terminated 수신");
        // terminated 시 restore 포함한 left 이벤트 전송
        emitXapi("left", { duration: getDuration() });
        if (typeof _stopTimer === "function") _stopTimer();
        // deinit 응답
        send({ type: "deinit" });
        console.log(LOG, "deinit/terminated — left+restore 전송 완료");
        break;
      case "checkQuestion":
        // 뷰어에서 채점 요청 시
        console.log(LOG, "checkQuestion 수신 (postMessage)");
        if (typeof checkQuestion === "function") checkQuestion();
        break;
      case "showSolution":
        console.log(LOG, "showSolution 수신 (postMessage)");
        if (typeof showSolution === "function") showSolution(msg.data !== false);
        break;
      case "resetQuestion":
        console.log(LOG, "resetQuestion 수신 (postMessage)");
        if (typeof resetItem === "function") resetItem();
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

  function doRestore(rawData) {
    if (!rawData) { console.log(LOG, "restore 데이터 없음 (null)"); return; }
    if (typeof rawData === "object" && Object.keys(rawData).length === 0) {
      console.log(LOG, "빈 restore — 신규 학습");
      return;
    }
    console.log(LOG, "restore 원본:", JSON.stringify(rawData).substring(0, 300));

    // restore 데이터 형식 정규화:
    // 형식1: { selected, elapsed, submitted } (직접 필드)
    // 형식2: { "Q-001": { selected, elapsed, submitted } } (contentId 키 래핑)
    // 형식3: { qitemSlvRcdJson: "..." } (UniPlayer 형식)
    var data = rawData;
    // 형식2 감지 — 첫 번째 키가 contentId이고 값이 객체이면 언래핑
    if (data.selected == null && data.qitemSlvRcdJson == null) {
      var keys = Object.keys(data);
      if (keys.length >= 1 && typeof data[keys[0]] === "object" && data[keys[0]] !== null) {
        // contentId 키로 래핑된 경우 — 자신의 contentId 또는 첫 번째 키 사용
        var inner = data[_state.contentId] || data[keys[0]];
        if (inner && (inner.selected != null || inner.qitemSlvRcdJson != null)) {
          console.log(LOG, "restore 키 언래핑:", keys[0]);
          data = inner;
        }
      }
    }
    // 형식3 감지 — qitemSlvRcdJson이 있으면 파싱
    if (data.qitemSlvRcdJson && data.selected == null) {
      try {
        var parsed = JSON.parse(data.qitemSlvRcdJson);
        if (parsed.selected != null) data = parsed;
        console.log(LOG, "qitemSlvRcdJson 파싱 완료");
      } catch(e) { console.warn(LOG, "qitemSlvRcdJson 파싱 실패"); }
    }

    console.log(LOG, "restore 정규화 결과:", JSON.stringify(data).substring(0, 200));
    try {
      if (typeof ITEM !== "undefined" && data.selected != null) {
        ITEM.selected = data.selected;
        console.log(LOG, "ITEM.selected 복원:", data.selected);
      }
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
      var fi = document.getElementById("fill-input");
      if (fi && data.selected) {
        fi.value = data.selected;
        console.log(LOG, "빈칸 복원:", data.selected);
      }
      var ei = document.getElementById("essay-input");
      if (ei && data.selected) {
        ei.value = data.selected;
        console.log(LOG, "서술형 복원:", String(data.selected).substring(0, 50));
      }
      if (typeof data.elapsed === "number" && typeof _timer !== "undefined") {
        _timer = data.elapsed;
      }
      if (data.submitted && typeof submitAnswer === "function") {
        setTimeout(function() {
          submitAnswer();
          console.log(LOG, "제출 상태 복원됨");
        }, 200);
      }
      console.log(LOG, "restore 완료");
      setTimeout(notifyCurrentPage, 300);
    } catch(e) {
      console.warn(LOG, "restore 실패:", e);
    }
  }

  // Issue #3: UniPlayer 호환 restore 데이터
  function buildRestoreData() {
    var isSubmitted = !!(document.getElementById("feedback") &&
      document.getElementById("feedback").style.display !== "none");
    var result = (typeof getResult === "function") ? getResult() : {};
    return {
      // AItemS original fields
      selected: (typeof ITEM !== "undefined") ? ITEM.selected : null,
      elapsed: (typeof _timer !== "undefined") ? _timer : 0,
      submitted: isSubmitted,
      timestamp: new Date().toISOString(),
      // UniPlayer compatible fields
      completionStatus: isSubmitted ? "completed" : "incomplete",
      isCorrect: isSubmitted ? !!result.correct : null,
      isSkip: false,
      progressTime: (typeof _timer !== "undefined") ? _timer : 0,
      qitemSlvRcdJson: JSON.stringify({
        selected: (typeof ITEM !== "undefined") ? ITEM.selected : null,
        elapsed: (typeof _timer !== "undefined") ? _timer : 0,
        submitted: isSubmitted
      }),
      contentId: _state.contentId
    };
  }

  function getDuration() {
    return "PT" + ((typeof _timer !== "undefined") ? _timer : 0) + "S";
  }

  // Fix #B: 모든 verb에 대해 sendLogToContainer 전송 (started, completed, left, reset)
  function emitXapi(verb, ext) {
    try {
      var restoreObj = {};
      restoreObj[_state.contentId] = buildRestoreData();
      var responseObj = {};
      if (verb === "completed") {
        responseObj[_state.contentId] = {
          selected: (typeof ITEM !== "undefined") ? ITEM.selected : null,
          correct: ext ? !!ext.success : false
        };
      }
      var payload = {
        restore: restoreObj,
        xAPI: {
          verb: verb,
          object: { id: _state.contentId },
          result: ext ? { duration: ext.duration || getDuration(), extensions: ext } : { duration: getDuration() },
          response: responseObj,
          context: { extensions: { "lcms/conts-id": _state.contentId } }
        },
        contentTag: _state.contentTag,
        timestamp: new Date().toISOString()
      };
      send({ type: "sendLogToContainer", data: payload });
      console.log(LOG, "xAPI 전송:", verb);
    } catch(e) {
      console.warn(LOG, "xAPI 전송 실패:", verb, e.message);
    }
  }

  var _origShowMathType = window.showMathType;
  var _origShowHandType = window.showHandType;
  var _origCloseMathType = window.closeMathType;
  var _origConfirmMathType = window.confirmMathType;

  function findMathTypeFn(fnName) {
    if (fnName === "showMathType" && typeof _origShowMathType === "function") return _origShowMathType;
    if (fnName === "showHandType" && typeof _origShowHandType === "function") return _origShowHandType;
    if (fnName === "closeMathType" && typeof _origCloseMathType === "function") return _origCloseMathType;
    if (fnName === "confirmMathType" && typeof _origConfirmMathType === "function") return _origConfirmMathType;
    try {
      if (window.parent && window.parent.parent &&
          window.parent.parent !== window &&
          typeof window.parent.parent[fnName] === "function") {
        return function() { window.parent.parent[fnName].apply(window.parent.parent, arguments); };
      }
    } catch(e) {}
    try {
      if (window.parent && window.parent !== window &&
          typeof window.parent[fnName] === "function") {
        return function() { window.parent[fnName].apply(window.parent, arguments); };
      }
    } catch(e) {}
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
      console.log(LOG, "showMathType 호출 성공 (parent chain)");
    } else {
      // parent chain에 없으면 안내 메시지 — CDN 로드하지 않음 (Wiris 에디터 의존성 필요)
      console.log(LOG, "showMathType 미발견 — 뷰어에 common-mathtype.js 미로드");
      var msgEl = document.createElement("div");
      msgEl.className = "mathtype-msg";
      msgEl.textContent = "MathType는 OctoPlayer 뷰어 환경에서 사용 가능합니다. 숫자패드를 이용하세요.";
      var wrap = document.querySelector(".fill-math-wrap");
      if (wrap && !wrap.querySelector(".mathtype-msg")) wrap.appendChild(msgEl);
      setTimeout(function(){ if(msgEl.parentNode) msgEl.parentNode.removeChild(msgEl); }, 4000);
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
    setTimeout(notifyCurrentPage, 300);
  });

  wrap("resetItem", function() {
    emitXapi("reset", {});
  }, function() {
    setTimeout(notifyCurrentPage, 300);
  });

  // Issue #4: contentInterface — 뷰어가 직접 호출하는 인터페이스
  window.contentInterface = {
    contentId: _state.contentId,
    userId: null,
    restoreData: null,
    contentTag: {},

    initialize: function(options) {
      console.log(LOG, "contentInterface.initialize:", JSON.stringify(options || {}).substring(0, 200));
      if (options && options.contentId) _state.contentId = options.contentId;
      if (options && options.userId) { _state.userId = options.userId; this.userId = options.userId; }
      if (options && options.restore) { this.restoreData = options.restore; doRestore(options.restore); }
      if (options && options.contentTag) { _state.contentTag = options.contentTag; this.contentTag = options.contentTag; }
    },

    sendLogToContainer: function(data) {
      if (window.parentContainer && typeof window.parentContainer.receiveLogFromViewer === "function") {
        window.parentContainer.receiveLogFromViewer(data);
      }
    },

    sendCheckStatus: function(data) {
      if (window.parentContainer && typeof window.parentContainer.receiveCheckStatus === "function") {
        window.parentContainer.receiveCheckStatus(data);
      }
    },

    transmissionCheckStatus: function(data) {
      if (window.parentContainer && typeof window.parentContainer.receiveCheckStatus === "function") {
        window.parentContainer.receiveCheckStatus(data);
      }
    },

    requestRestoreData: function() {
      send({ type: "requestRestoreData" });
    },

    requestUserId: function() {
      send({ type: "requestUserId" });
    },

    modContentId: function(data) {
      if (data) _state.contentId = data;
    },

    confirmBeforeTermination: function() {
      return true;
    },

    forbiddenWord: function() {
      return [];
    },

    messageEventListener: function(event) {
      // handled by window message listener
    }
  };

  function init() {
    console.log(LOG, "==== 초기화 시작 ====");
    console.log(LOG, "contentId:", _state.contentId);
    console.log(LOG, "parent === self:", window.parent === window);
    console.log(LOG, "ITEM 존재:", typeof ITEM !== "undefined");
    diagnose();
    _state.startTime = new Date().toISOString();

    // 콘텐츠 로딩 완료 신호
    notifyCurrentPage();

    // iframeContentLoadComplete 호출 — 뷰어가 iframeLoaded=true로 설정하는 유일한 경로
    // container-interface.js: iframeContentLoadComplete: () => { iframeLoaded = true; }
    try {
      if (window.parent && window.parent.containerInterface &&
          typeof window.parent.containerInterface.iframeContentLoadComplete === "function") {
        window.parent.containerInterface.iframeContentLoadComplete();
        console.log(LOG, "iframeContentLoadComplete() 호출 성공");
      }
    } catch(e) {
      console.log(LOG, "iframeContentLoadComplete() 직접 호출 불가 (cross-origin) — iframe.js가 처리");
    }

    send({ type: "requestUserId" });
    console.log(LOG, "requestUserId 전송");
    send({ type: "requestRestoreData" });
    console.log(LOG, "requestRestoreData 전송");

    // xAPI started 이벤트 — 뷰어에 콘텐츠 시작 알림
    emitXapi("started", { duration: "PT0S" });

    setTimeout(function() {
      console.log(LOG, "지연 재요청 (1초)");
      send({ type: "requestUserId" });
      send({ type: "requestRestoreData" });
      notifyCurrentPage();
    }, 1000);
    setTimeout(function() {
      console.log(LOG, "지연 재요청 (3초)");
      send({ type: "requestRestoreData" });
      notifyCurrentPage();
      diagnose();
    }, 3000);

    // Fix #B: 페이지 이탈 시 restore 데이터 전송
    window.addEventListener("beforeunload", function() {
      var restoreObj = {};
      restoreObj[_state.contentId] = buildRestoreData();
      var payload = {
        restore: restoreObj,
        xAPI: {
          verb: "left",
          object: { id: _state.contentId },
          result: { duration: getDuration() },
          response: {},
          context: { extensions: { "lcms/conts-id": _state.contentId } }
        },
        contentTag: _state.contentTag,
        timestamp: new Date().toISOString()
      };
      send({ type: "sendLogToContainer", data: payload });
      console.log(LOG, "beforeunload — left + restore 전송 완료");
    });

    console.log(LOG, "==== 초기화 완료 ====");
  }

  function diagnose() {
    console.log(LOG, "=== 환경 진단 시작 ===");
    console.log(LOG, "[진단] window.parent === window:", window.parent === window);
    console.log(LOG, "[진단] window.top === window:", window.top === window);
    try {
      console.log(LOG, "[진단] parent.parent 접근:", window.parent && window.parent.parent ? "가능" : "불가");
    } catch(e) { console.log(LOG, "[진단] parent.parent 접근: cross-origin 차단"); }
    var mathLocations = [];
    try { if (typeof window.showMathType === "function") mathLocations.push("window"); } catch(e) {}
    try { if (window.parent && typeof window.parent.showMathType === "function") mathLocations.push("parent"); } catch(e) {}
    try { if (window.parent && window.parent.parent && typeof window.parent.parent.showMathType === "function") mathLocations.push("parent.parent"); } catch(e) {}
    try { if (window.top && typeof window.top.showMathType === "function") mathLocations.push("top"); } catch(e) {}
    console.log(LOG, "[진단] showMathType 위치:", mathLocations.length > 0 ? mathLocations.join(", ") : "❌ 어디에도 없음");
    try { console.log(LOG, "[진단] containerInterface:", typeof window.containerInterface !== "undefined" ? "있음" : "없음"); } catch(e) {}
    try { console.log(LOG, "[진단] parent.containerInterface:", typeof window.parent.containerInterface !== "undefined" ? "있음" : "없음"); } catch(e) { console.log(LOG, "[진단] parent.containerInterface: 접근불가"); }
    try { console.log(LOG, "[진단] parent.parentContainer:", typeof window.parent.parentContainer !== "undefined" ? "있음" : "없음"); } catch(e) { console.log(LOG, "[진단] parent.parentContainer: 접근불가"); }
    try { console.log(LOG, "[진단] parent.octoplayer-content-interface:", window.parent.document ? "same-origin" : "cross-origin"); } catch(e) { console.log(LOG, "[진단] parent: cross-origin"); }
    console.log(LOG, "=== 환경 진단 완료 ===");
    console.log(LOG, "⚠️ [진단 결과] showMathType이 '❌ 어디에도 없음'이면:");
    console.log(LOG, "   → OctoPlayer 팀에 common-mathtype.js 로딩 위치 확인 필요");
    console.log(LOG, "⚠️ [진단 결과] 'sendRestoreData' 수신 로그가 없으면:");
    console.log(LOG, "   → OctoPlayer가 이 콘텐츠 타입을 인식하지 못하고 있음");
    console.log(LOG, "   → loadContents 시 type/contentId 설정 확인 필요");
  }

  window._octoBridgeDiagnose = diagnose;

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

  function buildZip(entries) {
    const enc = new TextEncoder();
    const localHeaders = [];
    let offset = 0;

    for (const entry of entries) {
      const nameBytes = enc.encode(entry.name);
      const dataBytes = enc.encode(entry.content);
      const crc = crc32(dataBytes);

      const lh = new ArrayBuffer(30 + nameBytes.length);
      const lv = new DataView(lh);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true);
      lv.setUint16(8, 0, true);
      lv.setUint16(10, 0, true);
      lv.setUint16(12, 0, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, dataBytes.length, true);
      lv.setUint32(22, dataBytes.length, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      new Uint8Array(lh, 30).set(nameBytes);
      localHeaders.push({ buf: lh, data: dataBytes, offset, nameBytes, crc, size: dataBytes.length });
      offset += lh.byteLength + dataBytes.length;
    }

    const cdParts = [];
    let cdSize = 0;
    for (const lh of localHeaders) {
      const cd = new ArrayBuffer(46 + lh.nameBytes.length);
      const cv = new DataView(cd);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, 0, true);
      cv.setUint16(14, 0, true);
      cv.setUint32(16, lh.crc, true);
      cv.setUint32(20, lh.size, true);
      cv.setUint32(24, lh.size, true);
      cv.setUint16(28, lh.nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, lh.offset, true);
      new Uint8Array(cd, 46).set(lh.nameBytes);
      cdParts.push(cd);
      cdSize += cd.byteLength;
    }

    const eocd = new ArrayBuffer(22);
    const ev = new DataView(eocd);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true); ev.setUint16(6, 0, true);
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, cdSize, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);

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
  addLog("[ZIP] 📥 " + qn + ".zip (" + Math.round(zipData.length/1024) + "KB)");
  addXapi("clicked",`ZIP: ${qn}.zip`);
}
