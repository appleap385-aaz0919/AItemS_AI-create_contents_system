export function PlatRetryLogPanel({platRetryLog}) {
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
