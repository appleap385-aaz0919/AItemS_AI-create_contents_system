export function QAPanel({qaResult}) {
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
