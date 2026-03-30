import { addLog } from '../api/apiLog.js';

// 폴백 문항 생성 (API 실패 시) — 메타정보 기반 정확 매칭
export function generateFallback(meta) {
  const tp = meta.tp || "객관식(4지선다)";
  const gd = (meta.gd || "").toLowerCase();
  const d2name = meta.depth?.d2?.name || "";
  const d3ctx = meta.depth?.d3?.context || "";

  function genAddNoCarry() {
    let a,b;
    do { a=Math.floor(Math.random()*400)+100; b=Math.floor(Math.random()*400)+100; }
    while((a%10+b%10)>=10 || (Math.floor(a/10)%10+Math.floor(b/10)%10)>=10 || (Math.floor(a/100)+Math.floor(b/100))>=10);
    return {q:`${a} + ${b}의 값을 구하시오.`,a:a+b,ex:`${a} + ${b} = ${a+b}입니다. 각 자리의 합이 모두 10 미만이므로 받아올림 없이 일의 자리부터 차례로 더합니다.`,
      v:{type:"vertical_calc",params:{a,b,op:"+",result:a+b,blanks:[]}},
      v2:{type:"base10_blocks",params:{a,b,op:"+",result:a+b}}};
  }
  function genAddOneCarry() {
    let a,b;
    do { a=Math.floor(Math.random()*400)+100; b=Math.floor(Math.random()*400)+100; }
    while(!((a%10+b%10)>=10 && (Math.floor(a/10)%10+Math.floor(b/10)%10)<10));
    return {q:`${a} + ${b}의 값을 구하시오.`,a:a+b,ex:`${a} + ${b} = ${a+b}입니다. 일의 자리: ${a%10} + ${b%10} = ${a%10+b%10}이므로 십의 자리로 1을 받아올립니다.`,
      v:{type:"vertical_calc",params:{a,b,op:"+",result:a+b,blanks:[]}},
      v2:{type:"base10_blocks",params:{a,b,op:"+",result:a+b}}};
  }
  function genAddMultiCarry() {
    let a,b;
    do { a=Math.floor(Math.random()*400)+100; b=Math.floor(Math.random()*400)+100; }
    while(!((a%10+b%10)>=10 && (Math.floor(a/10)%10+Math.floor(b/10)%10+1)>=10));
    return {q:`${a} + ${b}의 값을 구하시오.`,a:a+b,ex:`${a} + ${b} = ${a+b}입니다. 일의 자리에서 받아올림 발생, 십의 자리에서도 받아올림이 발생하는 연속 올림 문제입니다.`,
      v:{type:"vertical_calc",params:{a,b,op:"+",result:a+b,blanks:[]}},
      v2:{type:"base10_blocks",params:{a,b,op:"+",result:a+b}}};
  }
  function genEstimate() {
    const a=Math.floor(Math.random()*400)+100,b=Math.floor(Math.random()*400)+100;
    const ra=Math.round(a/100)*100,rb=Math.round(b/100)*100;
    const lo=Math.floor(Math.min(a,b)/100)*100, hi=Math.ceil(Math.max(a,b)/100)*100+100;
    return {q:`${a} + ${b}를 백의 자리에서 반올림하여 어림한 값을 구하시오.`,a:ra+rb,ex:`${a} → 약 ${ra}, ${b} → 약 ${rb}이므로, 어림한 합은 ${ra} + ${rb} = ${ra+rb}입니다.`,
      v:{type:"number_line",params:{min:lo,max:hi,step:100,marks:[a,b],highlights:[ra,rb]}}};
  }
  function genSubNoCarry() {
    let a,b;
    do { a=Math.floor(Math.random()*400)+200; b=Math.floor(Math.random()*199)+100; }
    while((a%10)<(b%10) || (Math.floor(a/10)%10)<(Math.floor(b/10)%10));
    return {q:`${a} - ${b}의 값을 구하시오.`,a:a-b,ex:`${a} - ${b} = ${a-b}입니다. 각 자리에서 위의 수가 아래 수보다 크므로 받아내림 없이 계산합니다.`,
      v:{type:"vertical_calc",params:{a,b,op:"-",result:a-b,blanks:[]}}};
  }
  function genDivision() {
    const bv=Math.floor(Math.random()*7)+2,av=bv*(Math.floor(Math.random()*8)+2);
    return {q:`${av} ÷ ${bv}의 값을 구하시오.`,a:av/bv,ex:`${av}을(를) ${bv}씩 묶으면 ${av/bv}묶음이 됩니다. ${av} ÷ ${bv} = ${av/bv}`,
      v:{type:"grouping",params:{total:av,groupSize:bv}}};
  }
  function genRightAngle() {
    const shapes = [
      {name:"직사각형",has:true,ex:"직사각형의 네 각은 모두 직각(90도)입니다."},
      {name:"정사각형",has:true,ex:"정사각형의 네 각은 모두 직각입니다."},
      {name:"직각삼각형",has:true,ex:"직각삼각형은 한 각이 직각(90도)인 삼각형입니다."},
      {name:"마름모",has:false,ex:"마름모는 네 변의 길이가 같지만, 각이 직각이 아닐 수 있습니다."},
      {name:"평행사변형",has:false,ex:"평행사변형은 마주보는 변이 평행하지만, 직각이 아닌 경우가 많습니다."},
      {name:"정삼각형",has:false,ex:"정삼각형의 세 각은 모두 60도이므로 직각이 없습니다."},
    ];
    const s=shapes[Math.floor(Math.random()*shapes.length)];
    return {q:`${s.name}에 직각이 있습니까?`,a:s.has?"O":"X",ex:s.ex,
      v:{type:"shape",params:{shape:s.name,showRightAngles:s.has}}};
  }
  function genChallenge() {
    const a=Math.floor(Math.random()*400)+100,b=Math.floor(Math.random()*400)+100,sum=a+b;
    return {q:`□ + ${b} = ${sum}일 때, □에 알맞은 수를 구하시오. 풀이 과정을 자세히 쓰시오.`,a:a,ex:`${sum} - ${b} = ${a}이므로, □ = ${a}입니다. 덧셈과 뺄셈의 관계를 이용하여 역산합니다.`,
      v:{type:"vertical_calc",params:{a,b,op:"+",result:sum,blanks:[]}}};
  }

  const keyMap = {
    add_no_carry: genAddNoCarry,
    add_one_carry: genAddOneCarry,
    add_multi: genAddMultiCarry,
    estimate: genEstimate,
    sub_no: genSubNoCarry,
    division: genDivision,
    right_angle: genRightAngle,
    challenge: genChallenge,
  };

  let generator = null;
  for(const [k,fn] of Object.entries(keyMap)){
    if(meta._key === k) { generator = fn; break; }
  }
  if(!generator) {
    const hint = gd + " " + d2name + " " + d3ctx;
    if(/받아올림.*없/.test(hint) || /no.carry/i.test(hint)) generator = genAddNoCarry;
    else if(/받아올림.*한.번|한.번.*받아올림|one.carry/i.test(hint)) generator = genAddOneCarry;
    else if(/받아올림.*여러|multi.carry|연속/i.test(hint)) generator = genAddMultiCarry;
    else if(/어림/i.test(hint)) generator = genEstimate;
    else if(/받아내림.*없|뺄셈/i.test(hint)) generator = genSubNoCarry;
    else if(/나눗셈|나누기|division/i.test(hint)) generator = genDivision;
    else if(/직각|right.angle/i.test(hint)) generator = genRightAngle;
    else if(/심화|역산|추론|challenge/i.test(hint)) generator = genChallenge;
    else if(/덧셈/i.test(hint)) generator = genAddNoCarry;
  }
  if(!generator) generator = genAddNoCarry;

  addLog("[폴백] 메타 매칭: " + (generator.name || "fallback") + " ← gd:" + (meta.gd||"").substring(0,20));
  const p = generator();
  const ans = p.a;

  if(tp.includes("객관식")) {
    const diff = [10, -10, 100, -1, 1, 11, -11, 50].sort(()=>Math.random()-0.5);
    const wrongs = diff.slice(0,3).map(d => ans+d).filter(v=>v!==ans&&v>0);
    while(wrongs.length<3) wrongs.push(ans+Math.floor(Math.random()*20)+1);
    const allOpts = [ans, ...wrongs.slice(0,3)].sort(()=>Math.random()-0.5);
    const opts = allOpts.map((v,i)=>({label:["①","②","③","④"][i],text:String(v),isCorrect:v===ans}));
    const ci = opts.findIndex(o=>o.isCorrect)+1;
    return {passage:null,stem:p.q,type:"mc",options:opts,answer:String(ci),explanation:p.ex,visual:p.v||null,visual2:p.v2||null};
  } else if(tp.includes("OX")) {
    const isCorrect = Math.random()>0.5;
    const shown = isCorrect ? ans : ans + (Math.random()>0.5?10:-10);
    const stem = p.q.replace("구하시오.","").replace("무엇입니까?","").trim();
    return {passage:null,stem:`"${stem}의 답은 ${shown}이다." 이 문장이 맞으면 O, 틀리면 X를 선택하세요.`,type:"ox",options:null,answer:isCorrect?"O":"X",explanation:`정답은 ${ans}이므로 ${shown === ans ? "맞습니다" : "틀립니다"}. ${p.ex}`,visual:p.v||null,visual2:p.v2||null};
  } else if(tp.includes("빈칸")) {
    return {passage:null,stem:p.q.replace("구하시오","빈칸에 알맞은 수를 써넣으시오").replace("무엇입니까","얼마입니까"),type:"fill",options:null,answer:String(ans),explanation:p.ex,visual:p.v||null,visual2:p.v2||null};
  } else {
    return {passage:null,stem:p.q.replace("구하시오","풀이 과정을 자세히 쓰고 답을 구하시오"),type:"essay",options:null,answer:"essay",explanation:p.ex,visual:p.v||null,visual2:p.v2||null};
  }
}
