import { useState, useEffect } from 'react';

export function EditPanel({meta, regenCount, onApply, onCancel}) {
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
