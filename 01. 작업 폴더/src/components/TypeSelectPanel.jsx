export function TypeSelectPanel({meta, onSelect}) {
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
