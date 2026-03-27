export function XAPIPanel({events}) {
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
