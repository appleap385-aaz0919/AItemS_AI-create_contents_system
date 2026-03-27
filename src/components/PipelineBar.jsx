import { useState, useRef, useEffect } from 'react';

export function PipelineBar({stages}) {
  const [elapsed,setElapsed]=useState(0);
  const runningRef = useRef(false);

  useEffect(()=>{
    const hasRunning = stages.some(s=>s.status==="running");
    if(hasRunning && !runningRef.current) {
      setElapsed(0);
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
