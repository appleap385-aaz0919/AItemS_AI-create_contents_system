import { useState } from 'react';
import { TC } from '../data/colorMap.js';

export function TreeNode({node,depth,onSelect,selKey}) {
  const [open,setOpen]=useState(depth===0&&node.n==="01");
  if(node.k) return (
    <div className={`tl ${selKey===node.k?"sel":""}`} style={{paddingLeft:14+depth*16}} onClick={()=>onSelect(node)}>
      <span className="tdot" style={{background:TC[node.t]||"#888"}}/><span>{node.nm}</span>
    </div>
  );
  return (<div>
    <div className="th" style={{paddingLeft:6+depth*16}} onClick={()=>setOpen(!open)}>
      <span className={`ta ${open?"to":""}`}>▶</span><span className="tn">{node.n}</span><span>{node.nm}</span>
    </div>
    {open&&node.ch?.map((c,i)=><TreeNode key={i} node={c} depth={depth+1} onSelect={onSelect} selKey={selKey}/>)}
  </div>);
}
