export function PlatformPanel({checks}) {
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
