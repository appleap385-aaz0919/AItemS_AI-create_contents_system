export function RetryLogPanel({retryLog}) {
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
