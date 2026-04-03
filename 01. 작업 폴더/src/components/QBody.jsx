import { useState, useEffect } from 'react';
import { FillWithMathPad } from './FillWithMathPad.jsx';
import { renderVisualSvg } from '../generators/svgGenerators.js';

export function QBody({question, submitted, result, onSubmit, onViewed}) {
  const [sel2,setSel2]=useState(null);
  const [fillV,setFillV]=useState("");
  const [essayV,setEssayV]=useState("");

  useEffect(()=>{setSel2(null);setFillV("");setEssayV("");},[question]);

  if(!question) return null;

  const doSubmit=()=>{
    let a="";
    if(question.type==="mc") a=sel2||"";
    else if(question.type==="ox") a=sel2||"";
    else if(question.type==="fill") a=fillV.trim();
    else if(question.type==="essay") a=essayV.trim();
    onSubmit(a);
  };

  return (
    <div className="qb">
      {question.passage&&<div className="qp">{question.passage.split('\n').map((line,i)=><span key={i}>{line}{i<question.passage.split('\n').length-1&&<br/>}</span>)}</div>}
      <div className="qs">{question.stem.split('\n').map((line,i)=><span key={i}>{line}{i<question.stem.split('\n').length-1&&<br/>}</span>)}</div>
      {question.visual&&renderVisualSvg(question.visual)&&(
        <div className="qv" dangerouslySetInnerHTML={{__html:renderVisualSvg(question.visual)}}/>
      )}
      {question.visual2&&renderVisualSvg(question.visual2)&&(
        <div className="qv qv-sub" dangerouslySetInnerHTML={{__html:renderVisualSvg(question.visual2)}}/>
      )}
      {question.type==="mc"&&question.options&&(
        <div className="mco">{question.options.map((o,i)=>(
          <div key={i} className={`mci ${sel2===String(i+1)?"s":""} ${submitted&&o.isCorrect?"c":""} ${submitted&&sel2===String(i+1)&&!o.isCorrect?"w":""}`}
            onClick={()=>!submitted&&setSel2(String(i+1))}>
            <span className="mn2">{o.label}</span><span className="mt">{o.text}</span>
          </div>
        ))}</div>
      )}
      {question.type==="ox"&&(
        <div className="oxo">{["O","X"].map(v=>(
          <button key={v} className={`oxb ${v==="O"?"oo":"ox"} ${sel2===v?"s":""}`}
            onClick={()=>!submitted&&setSel2(v)}>{v}</button>
        ))}</div>
      )}
      {question.type==="fill"&&(
        <FillWithMathPad value={fillV} onChange={v=>!submitted&&setFillV(v)} disabled={submitted}
          borderColor={submitted?(result?.correct?"#3dd9a0":"#e85a5a"):undefined} schoolLevel="초등"/>
      )}
      {question.type==="essay"&&(
        <textarea className="essa" value={essayV} onChange={e=>!submitted&&setEssayV(e.target.value)} placeholder="풀이 과정을 적어주세요..."/>
      )}
      {!submitted&&<button className="bsub" onClick={doSubmit}>제출</button>}
      {submitted&&result&&(
        <div className="fb-wrap">
          <div className={`fb-result ${result.correct?"fc":"fw"}`}>
            <span className="fb-icon">{result.correct?"🎉":"❌"}</span>
            <span className="fb-text">{result.correct?"정답입니다!":`오답입니다. 정답: ${question.answer}`}</span>
          </div>
          <div className="fb-explain">
            <div className="fb-explain-head">
              <span className="fb-explain-icon">📖</span>
              <span>풀이 과정</span>
            </div>
            <div className="fb-explain-body">
              {question.explanation?.split(/(?<=[.?!。])\s*/).filter(Boolean).map((line,i)=>(
                <p key={i} style={{margin:"0 0 6px 0"}}>{line.trim()}</p>
              ))}
            </div>
            <button className="bview" onClick={onViewed}>✅ 해설 확인 완료</button>
          </div>
        </div>
      )}
    </div>
  );
}
