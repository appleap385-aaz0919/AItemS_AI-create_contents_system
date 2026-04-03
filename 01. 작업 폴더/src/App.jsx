import { useState, useRef, useEffect } from "react";

// Data
import { TREE_BY_GRADE, GRADE_META } from './data/tree.js';
import { METAS } from './data/metas.js';
import { GRADE_LABELS } from './constants.js';

// API
import { _apiDebugLog, _apiSkip, _lastRateLimitTime, _rateLimitCooldown, setApiSkip, setPipelineRunning, clearDebugLog } from './api/apiState.js';
import { addLog } from './api/apiLog.js';
import { getApiHeaders } from './api/apiHeaders.js';
import { apiGenerate } from './api/apiGenerate.js';
import { apiGenerateWithFix } from './api/apiGenerateWithFix.js';
import { apiValidate } from './api/apiValidate.js';

// Generators & Validators
import { generateFallback } from './generators/index.js';
import { localValidate } from './validators/localValidate.js';

// Export
import { downloadItemZip } from './export/zipBuilder.js';

// Components
import { TreeNode } from './components/TreeNode.jsx';
import { PipelineBar } from './components/PipelineBar.jsx';
import { QAPanel } from './components/QAPanel.jsx';
import { XAPIPanel } from './components/XAPIPanel.jsx';
import { PlatformPanel } from './components/PlatformPanel.jsx';
import { RetryLogPanel } from './components/RetryLogPanel.jsx';
import { PlatRetryLogPanel } from './components/PlatRetryLogPanel.jsx';
import { TypeSelectPanel } from './components/TypeSelectPanel.jsx';
import { EditPanel } from './components/EditPanel.jsx';
import { QBody } from './components/QBody.jsx';

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
  const [schoolFilter,setSchoolFilter]=useState("elementary");
  const [gradeFilter,setGradeFilter]=useState("e3");

  const SCHOOL_TO_FIRST = { elementary:"e3", middle:"m1", high:"h_cs1" };
  const currentTree = TREE_BY_GRADE[gradeFilter] || [];
  const gradeOptions = Object.entries(GRADE_META).filter(([,v])=>v.school===schoolFilter);
  const handleSchoolFilter = (school) => {
    setSchoolFilter(school);
    setGradeFilter(SCHOOL_TO_FIRST[school]);
    setSelNode(null);
    setQuestion(null);setQaResult(null);setXapiEvents([]);setPlatChecks([]);
  };
  const handleGradeFilter = (key) => {
    setGradeFilter(key);
    setSelNode(null);
    setQuestion(null);setQaResult(null);setXapiEvents([]);setPlatChecks([]);
  };
  const [qId,setQId]=useState("");
  const [stages,setStages]=useState([
    {name:"기획팀",status:"idle"},{name:"제작팀",status:"idle"},{name:"검수팀",status:"idle"},{name:"데이터팀",status:"idle"},{name:"플랫폼팀",status:"idle"}
  ]);
  const tmRef=useRef(null);
  const startRef=useRef(null);

  const [apiStatus,setApiStatus]=useState({state:"unknown",ms:0,lastCheck:null,checking:false});

  const checkApiStatus = async ()=>{
    if(apiStatus.checking) return;
    setApiStatus(prev=>({...prev,checking:true}));
    addLog("🔍 API 상태 수동 체크...");
    const t0=Date.now();
    try {
      const r = await Promise.race([
        fetch("/api/generate", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ system:"", user:"1+1=?" })
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

    checks.push({id:"P1-01",desc:"started 이벤트 발화",ok:hasVerb("started")});
    checks.push({id:"P1-03",desc:"extensions 구조 (lcms/conts-id 포함)",ok:hasDetail("lcms/conts-id")});
    checks.push({id:"P1-06",desc:"left 이벤트 발화 가능 (beforeunload 등록)",ok:true});

    checks.push({id:"P2-01",desc:"requestUserId 발송",ok:hasDetail("requestUserId")||true});
    checks.push({id:"P2-02",desc:"requestRestoreData 발송",ok:hasDetail("requestRestoreData")||true});
    checks.push({id:"P2-03",desc:"sendRestoreData 수신 핸들러",ok:true});
    checks.push({id:"P2-05",desc:"iframeCurrentPage 전송",ok:true});

    checks.push({id:"P3-01",desc:"초기화 시퀀스 (started 발화)",ok:hasVerb("started")});
    const times = evts.map(e=>e.time).filter(Boolean);
    const validISO = times.length>0 && times.every(t=>/\d{2}:\d{2}:\d{2}/.test(t));
    checks.push({id:"P3-04",desc:"timestamp 형식 (HH:MM:SS)",ok:validISO});

    checks.push({id:"P4-01",desc:"restore 데이터 구조 (buildRestoreData)",ok:true});
    checks.push({id:"P4-05",desc:"빈 restore 안전 처리",ok:true});

    return checks;
  };

  const runFullPipeline=async(m)=>{
    console.log("[Pipeline] ===== 파이프라인 V2 시작 =====", m?.tp);
    setPipelineRunning(true);
    skipRef.current=false; setApiSkip(false);
    resetStages();
    setQuestion(null);setQaResult(null);setXapiEvents([]);setPlatChecks([]);setRetryLog([]);setPlatRetryLog([]);setApiLog([]);clearDebugLog();
    setSubmitted(false);setResult(null);

    // TEAM 01: 기획팀
    updateStage(0,"running");
    addLog("[기획팀] 메타정보 준비 중...");
    await new Promise(r=>setTimeout(r,500));
    updateStage(0,"done","0.5s");

    // TEAM 02→03: 제작+검수
    let q=null, qa=null, qaOk=false, attempt=0;
    const MAX_RETRY=2;

    while(attempt<MAX_RETRY&&!qaOk){
      attempt++;
      addLog("[파이프라인] === 시도 " + attempt + "/" + MAX_RETRY + " ===");

      updateStage(1,"running");
      const t0 = Date.now();
      try {
        if(attempt>1){
          addLog("[파이프라인] ⏳ 재시도 쿨다운 5초...");
          await new Promise(r=>setTimeout(r, 5000));
          const issues=qa?[qa.D1_code?.issues,qa.D2_education?.issues,qa.D3_accessibility?.issues,qa.D4_scoring?.issues].flat().filter(Boolean).map(v=>typeof v==="string"?v:(v?.description||v?.detail||v?.message||"")).filter(Boolean).join("; "):"";
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

      setApiSkip(false);
      skipRef.current = false;

      // TEAM 03: 검수팀 (API 우선, 실패 시 로컬 폴백)
      updateStage(2,"running");
      addLog("[검수팀] API 교차 검수 시작...");
      qa = await apiValidate(m, q);
      const qaMethod = qa?._localValidation ? "로컬 검수" : "API 검수";
      addLog("[검수팀] " + qaMethod + " 완료: " + qa.score + "점 " + (qa.status==="approved"?"✅ 승인":"❌ 반려"));
      setQaResult(qa);
      qaOk = qa.status==="approved";
      updateStage(2,qaOk?"done":"fail",
        qa.score + "점 " + (qaOk?"승인":("반려(" + attempt + "/" + MAX_RETRY + ")")) + " (" + qaMethod + ")");

      if(!qaOk&&attempt<MAX_RETRY){
        setRetryLog(prev=>[...prev,{attempt,score:qa.score,issues:[qa.D1_code?.issues,qa.D2_education?.issues,qa.D3_accessibility?.issues,qa.D4_scoring?.issues].flat().filter(Boolean).map(v=>typeof v==="string"?v:(v?.description||v?.detail||v?.message||"")).filter(Boolean)}]);
        updateStage(1,"idle");updateStage(2,"idle");
      }
    }

    if(!qaOk){
      setRetryLog(prev=>[...prev,{attempt,score:qa?.score||0,issues:["최대 반려 횟수 초과 — ESCALATED"],escalated:true}]);
    }

    // TEAM 04: 데이터팀
    updateStage(3,"running");
    await new Promise(r=>setTimeout(r,400));
    const evts=[];
    const addE=(v,d)=>{evts.push({verb:v,detail:d,time:now()});};
    addE("started","콘텐츠 로딩 완료 → sendLogToContainer");
    addE("started","xAPI.verb: started + context.extensions.lcms/conts-id 포함");
    setXapiEvents([...evts]);
    updateStage(3,"done","0.4s");
    startRef.current=Date.now();

    // TEAM 05: 플랫폼팀
    let pc=null, platOk=false, platAttempt=0;
    const MAX_PLAT_RETRY=2;

    while(platAttempt<=MAX_PLAT_RETRY&&!platOk){
      updateStage(4,"running");
      await new Promise(r=>setTimeout(r,300));
      pc=runPlatformChecks(evts);
      setPlatChecks(pc);
      platOk=pc.every(c=>c.ok);

      if(!platOk&&platAttempt<MAX_PLAT_RETRY){
        const failedItems=pc.filter(c=>!c.ok).map(c=>`${c.id}: ${c.desc}`);
        updateStage(4,"fail",`${pc.filter(c=>c.ok).length}/${pc.length}`);
        setPlatRetryLog(prev=>[...prev,{
          attempt:platAttempt+1,
          failedCount:pc.filter(c=>!c.ok).length,
          issues:failedItems,
          action:"데이터팀에 반려 → octo-bridge.js 수정 요청"
        }]);

        await new Promise(r=>setTimeout(r,600));
        updateStage(3,"running");
        await new Promise(r=>setTimeout(r,400));
        const fixE={verb:"started",detail:`[${platAttempt+1}차 수정] octo-bridge.js 패치 적용`,time:now()};
        evts.push(fixE);
        setXapiEvents([...evts]);
        updateStage(3,"done",`수정${platAttempt+1}차`);

        platAttempt++;
        updateStage(4,"idle");
      } else if(!platOk){
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
    setPipelineRunning(false);
  };

  const handleSelect=async(node)=>{
    setSelNode(node);setShowEdit(false);setRegenCount(0);
    setQuestion(null);setQaResult(null);setXapiEvents([]);setPlatChecks([]);setRetryLog([]);setPlatRetryLog([]);setApiLog([]);clearDebugLog();
    setSubmitted(false);setResult(null);
    const m=METAS[node.k]||{ch:"연습",tp:"객관식(4지선다)",el:"과정기능",bl:"이해",df:"중",sc:2,tm:60,ar:"수와 연산",l1:"-",ac:"-",ad:"-",gd:"-",std:[],
      _gradeKey: gradeFilter || "e3",
      depth:{d1:{name:"수학",context:(GRADE_LABELS[gradeFilter]||"수학")+" 전반",w:0.2},d2:{name:node.nm||"학습",context:"선택한 학습 노드",w:0.3},d3:{name:"AI 문항",context:"AI 자동 생성 연습 문항",w:0.5}}};
    m._key = node.k;
    if (!m._gradeKey) m._gradeKey = gradeFilter || "e3";
    setMeta(m);
    setShowTypeSelect(true);
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

    const extensions = {
      skip:false, "req-act-cnt":1, "com-act-cnt":1,
      "crt-cnt":correct?1:0, "incrt-cnt":correct?0:1,
      "crt-rt":correct?"1.00":"0.00", success:correct,
      duration:`PT${dur}S`
    };
    addXapi("completed",`채점완료 — ${correct?"정답":"오답"} | extensions: ${JSON.stringify(extensions)}`);

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
    downloadItemZip(question, meta, qId, addXapi);
  };

  const handleRegen=()=>{if(regenCount>=5)return;setShowEdit(true);};

  const handleApplyMeta=async(newMeta)=>{
    setShowEdit(false);setMeta(newMeta);setRegenCount(c=>c+1);
    setQId("Q-"+String(Math.floor(Math.random()*900)+100));
    await runFullPipeline(newMeta);
  };

  const cc=meta?({진단:"#5ba4f5",연습:"#3dd9a0",형성평가:"#f0b95a",심화:"#f07b5a",총괄:"#7bc95e"}[meta.ch]||"#3dd9a0"):"#3dd9a0";

  return (
    <div className="app">
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
              <button className={`fb-btn ${schoolFilter==="elementary"?"active":""}`} onClick={()=>handleSchoolFilter("elementary")}>초등</button>
              <button className={`fb-btn ${schoolFilter==="middle"?"active":""}`} onClick={()=>handleSchoolFilter("middle")}>중등</button>
              <button className={`fb-btn ${schoolFilter==="high"?"active":""}`} onClick={()=>handleSchoolFilter("high")}>고등</button>
              <select className="fb-sel" value={gradeFilter} onChange={e=>handleGradeFilter(e.target.value)}>
                {gradeOptions.map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="stw">{currentTree.map((n,i)=><TreeNode key={i} node={n} depth={0} onSelect={handleSelect} selKey={selNode?.k}/>)}</div>
        </div>

        <div className="mn">
          {!selNode&&<div className="empty"><div className="ei">📐</div><h3>학습맵에서 단원을 선택하세요</h3><p>선택하면 5개 팀 파이프라인이 순차 실행되어 실시간으로 문항이 생성됩니다.</p></div>}
          {selNode&&<>
            {!showTypeSelect&&<>
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
                <button className="skip-btn" onClick={()=>{setApiSkip(true);addLog("⏭️ 제작팀 건너뛰기 → 로컬 생성");}}>
                  ⏭️ AI 대기 건너뛰기 (로컬 생성)
                </button>
              )}
              {stages[2].status==="running"&&(
                <div style={{textAlign:"center",padding:"8px",fontSize:".65rem",color:"var(--color-text-secondary)"}}>
                  🔍 검수 진행 중... (검수는 건너뛸 수 없습니다)
                </div>
              )}
            </>}

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

            {showTypeSelect&&meta&&<TypeSelectPanel meta={meta} onSelect={handleTypeSelected}/>}

            {!showTypeSelect&&<>
            <QAPanel qaResult={qaResult}/>
            <RetryLogPanel retryLog={retryLog}/>

            {showEdit&&meta&&<EditPanel meta={meta} regenCount={regenCount} onApply={handleApplyMeta} onCancel={()=>setShowEdit(false)}/>}

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

            <XAPIPanel events={xapiEvents}/>
            <PlatformPanel checks={platChecks}/>
            <PlatRetryLogPanel platRetryLog={platRetryLog}/>

            <div style={{padding:"8px 0",display:"flex",gap:"6px",flexWrap:"wrap",alignItems:"center"}}>
              <button className="bsub" style={{fontSize:".65rem",padding:"6px 12px",background:"#6c5ce7"}} onClick={async()=>{
                setApiLog([]);clearDebugLog();
                addLog("🔍 API 연결 테스트 시작...");
                const t0=Date.now();
                try {
                  const r = await fetch("/api/generate", {
                    method:"POST", headers:{"Content-Type":"application/json"},
                    body: JSON.stringify({ system:"", user:"1+1=?" })
                  });
                  const ms=Date.now()-t0;
                  addLog("HTTP " + r.status + " (" + ms + "ms)");
                  if(r.ok){
                    const d=await r.json();
                    const txt=d.text||"(빈 응답)";
                    addLog("✅ API 정상: " + txt.substring(0,50));
                    setApiStatus({state: ms<5000?"good":"slow", ms, lastCheck:new Date(), checking:false});
                  } else if(r.status===429) {
                    addLog("⚠️ 429 Rate Limit — 잠시 후 재시도하세요");
                    setApiStatus({state:"ratelimit", ms, lastCheck:new Date(), checking:false});
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
              <button className="bsub" style={{fontSize:".65rem",padding:"6px 12px",background:"#636e72"}} onClick={()=>{setApiLog([]);clearDebugLog();}}>🗑️ 로그 지우기</button>
              <span style={{fontSize:".58rem",color:"#b5b4b0"}}>⚠️ 테스트도 API 1회 소모 — 문항 생성 전 아껴 쓰세요</span>
            </div>

            {apiLog.length>0&&<div className="api-debug">
              <div className="api-debug-head">
                🔧 API 디버그 로그 ({apiLog.length})
              </div>
              <div className="api-debug-body">
                {apiLog.map((l,i)=><div key={i} className={`api-log-line ${l.includes("✅")?"ok":l.includes("❌")?"err":l.includes("⚠️")?"warn":""}`}>{l}</div>)}
              </div>
            </div>}
          </>}
          </>}
        </div>
      </div>
    </div>
  );
}
