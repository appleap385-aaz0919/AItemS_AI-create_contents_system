import { addLog } from '../api/apiLog.js';
import { gradeGroup } from '../constants.js';

// ============================================================
// 폴백 문항 생성 (API 실패 시) — 학년별 생성기
// ============================================================
export function generateFallback(meta) {
  const tp = meta.tp || "객관식(4지선다)";
  const gd = (meta.gd || "").toLowerCase();
  const d2name = meta.depth?.d2?.name || "";
  const d3ctx = meta.depth?.d3?.context || "";
  const gradeKey = meta._gradeKey || "e3";
  const group = gradeGroup(gradeKey);

  // ========== 초등 생성기 (e3~e6) ==========
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

  // ========== 초등 3학년 추가 생성기 ==========
  function genClock() {
    const hour=Math.floor(Math.random()*12)+1;
    const mins=[0,15,30,45];
    const minute=mins[Math.floor(Math.random()*mins.length)];
    return {q:`시계가 ${hour}시 ${minute}분을 가리키고 있습니다. 긴바늘과 짧은바늘이 만드는 각도는 몇 도입니까?`,
      a:Math.abs(30*hour-5.5*minute),
      ex:`짧은바늘: ${hour}시 방향 = ${30*hour}°, 긴바늘: ${minute}분 방향 = ${6*minute}°, 차이 = ${Math.abs(30*hour-5.5*minute)}°`,
      v:{type:"clock_face",params:{hour,minute}}};
  }

  // ========== 초등 4학년 생성기 ==========
  function genFraction() {
    const denom = [3,4,5,6,8][Math.floor(Math.random()*5)];
    const numer = Math.floor(Math.random()*(denom-1))+1;
    return {q:`${numer}/${denom}을 분수 막대로 나타낼 때, 색칠해야 하는 부분은 전체의 몇 분의 몇입니까?`,a:`${numer}/${denom}`,
      ex:`전체를 ${denom}등분했을 때 ${numer}칸을 색칠하면 ${numer}/${denom}입니다.`,
      v:{type:"fraction_bar",params:{numerator:numer,denominator:denom}}};
  }
  function genLargeNumber() {
    const a=Math.floor(Math.random()*9000)+1000, b=Math.floor(Math.random()*9000)+1000;
    return {q:`${a} + ${b}의 값을 구하시오.`,a:a+b,
      ex:`${a} + ${b} = ${a+b}입니다. 네 자리 수의 덧셈은 일의 자리부터 차례로 더합니다.`,
      v:{type:"vertical_calc",params:{a,b,op:"+",result:a+b,blanks:[]}}};
  }
  function genAngle() {
    const angles = [30,45,60,90,120,135,150];
    const ang = angles[Math.floor(Math.random()*angles.length)];
    return {q:`각도가 ${ang}°인 각은 예각, 직각, 둔각 중 어느 것입니까?`,
      a: ang<90?"예각":(ang===90?"직각":"둔각"),
      ex:`${ang}°는 ${ang<90?"90°보다 작으므로 예각":(ang===90?"90°이므로 직각":"90°보다 크고 180°보다 작으므로 둔각")}입니다.`,
      v:{type:"labeled_triangle",params:{vertices:["A","B","C"],sides:[],angles:[{vertex:"B",mark:`${ang}°`}],type:ang===90?"right":"general"}}};
  }

  // ========== 초등 5~6학년 생성기 ==========
  function genDecimalCalc() {
    const a=+(Math.random()*9+1).toFixed(1), b=+(Math.random()*9+1).toFixed(1);
    const res=+(a+b).toFixed(1);
    return {q:`${a} + ${b}의 값을 구하시오.`,a:res,
      ex:`소수의 덧셈: ${a} + ${b} = ${res}입니다. 소수점을 맞추어 계산합니다.`,
      v:null};
  }
  function genPercentage() {
    const total=[200,250,300,400,500][Math.floor(Math.random()*5)];
    const pcts=[10,20,25,30,40,50];
    const pct=pcts[Math.floor(Math.random()*pcts.length)];
    const ans=total*pct/100;
    return {q:`${total}의 ${pct}%는 얼마입니까?`,a:ans,
      ex:`${total} × ${pct}/100 = ${ans}입니다.`,
      v:{type:"bar_chart",params:{labels:["전체","부분"],values:[total,ans],unit:""}}};
  }
  function genDataTable() {
    const vals=[12,18,24,30,15];
    const sum=vals.reduce((a,b)=>a+b,0);
    const avg=sum/vals.length;
    return {q:`다음 자료의 평균을 구하시오: ${vals.join(", ")}`,a:avg,
      ex:`합계: ${sum}, 개수: ${vals.length}, 평균: ${sum} ÷ ${vals.length} = ${avg}`,
      v:{type:"data_table",params:{headers:["자료"],rows:vals.map(v=>[v])}}};
  }

  // ========== 중학교 생성기 (m1~m3) ==========
  function genInteger() {
    const a=Math.floor(Math.random()*21)-10, b=Math.floor(Math.random()*21)-10;
    return {q:`(${a}) + (${b})의 값을 구하시오.`,a:a+b,
      ex:`(${a}) + (${b}) = ${a+b}입니다. ${a>=0&&b>=0?"양수끼리 더합니다.":a<0&&b<0?"음수끼리 더하면 절댓값을 더하고 음수 부호를 붙입니다.":"부호가 다르면 절댓값이 큰 쪽의 부호를 따릅니다."}`,
      v:{type:"number_line",params:{min:-20,max:20,step:5,marks:[a,b,a+b],highlights:[a+b]}}};
  }
  function genLinearEquation() {
    const x=Math.floor(Math.random()*9)+1;
    const a=Math.floor(Math.random()*5)+2;
    const b=a*x+Math.floor(Math.random()*10)+1;
    return {q:`${a}x + ${b - a*x} = ${b}일 때, x의 값을 구하시오.`,a:x,
      ex:`${a}x = ${b} - ${b-a*x} = ${a*x}, x = ${a*x} ÷ ${a} = ${x}`,
      v:{type:"coordinate_plane",params:{xMin:-1,xMax:x+2,yMin:-1,yMax:b+2,points:[{x:x,y:b,label:`해 (${x}, ${b})`}]}}};
  }
  function genProportion() {
    const a=Math.floor(Math.random()*5)+2, b=Math.floor(Math.random()*5)+2;
    const c=a*(Math.floor(Math.random()*3)+2), d=b*(c/a);
    return {q:`${a} : ${b} = ${c} : x일 때, x의 값을 구하시오.`,a:d,
      ex:`비례식의 성질: ${a} × x = ${b} × ${c}, x = ${b*c} ÷ ${a} = ${d}`,
      v:null};
  }
  function genPythagorean() {
    const triples=[[3,4,5],[5,12,13],[6,8,10],[8,15,17]];
    const t=triples[Math.floor(Math.random()*triples.length)];
    return {q:`직각삼각형의 두 변의 길이가 ${t[0]}cm, ${t[1]}cm일 때, 빗변의 길이를 구하시오.`,a:t[2],
      ex:`피타고라스 정리: ${t[0]}² + ${t[1]}² = ${t[0]**2} + ${t[1]**2} = ${t[2]**2} = ${t[2]}²이므로 빗변은 ${t[2]}cm입니다.`,
      v:{type:"labeled_triangle",params:{vertices:["A","B","C"],sides:[{label:`${t[0]}`,value:t[0]},{label:`${t[1]}`,value:t[1]},{label:"?",value:t[2]}],angles:[{vertex:"A",mark:"90°"}],type:"right"}}};
  }
  function genProbability() {
    const total=Math.floor(Math.random()*5)+5;
    const event=Math.floor(Math.random()*(total-1))+1;
    return {q:`주머니에 ${total}개의 공이 있고 그 중 ${event}개가 빨간색입니다. 빨간 공을 꺼낼 확률을 구하시오.`,a:`${event}/${total}`,
      ex:`확률 = (빨간 공의 수) / (전체 공의 수) = ${event}/${total}`,
      v:{type:"pie_chart",params:{data:[{label:"빨간",value:event,color:"#E74C3C"},{label:"기타",value:total-event,color:"#BDC3C7"}],title:"공의 구성"}}};
  }
  function genFactorization() {
    const p1=[2,3,5,7][Math.floor(Math.random()*4)];
    const p2=[2,3,5,7][Math.floor(Math.random()*4)];
    const n=p1*p2;
    return {q:`${n}을 소인수분해하시오.`,a:`${Math.min(p1,p2)} × ${Math.max(p1,p2)}`,
      ex:`${n} = ${Math.min(p1,p2)} × ${Math.max(p1,p2)}입니다.`,
      v:null};
  }

  // ========== 고등학교 생성기 (h_cs1~h_cs2) ==========
  function genPolynomial() {
    const a=Math.floor(Math.random()*5)+1, b=Math.floor(Math.random()*5)+1;
    const expanded = `x² + ${a+b}x + ${a*b}`;
    return {q:`${expanded}을 인수분해하시오.`,a:`(x + ${a})(x + ${b})`,
      ex:`x² + ${a+b}x + ${a*b} = (x + ${a})(x + ${b}). 합이 ${a+b}, 곱이 ${a*b}인 두 수는 ${a}과 ${b}입니다.`,
      v:null};
  }
  function genQuadratic() {
    const r1=Math.floor(Math.random()*5)+1, r2=Math.floor(Math.random()*5)+1;
    const b_coeff=-(r1+r2), c_coeff=r1*r2;
    return {q:`x² ${b_coeff>=0?"+":""}${b_coeff}x + ${c_coeff} = 0의 해를 구하시오.`,a:`x = ${r1} 또는 x = ${r2}`,
      ex:`x² ${b_coeff>=0?"+":""}${b_coeff}x + ${c_coeff} = (x - ${r1})(x - ${r2}) = 0이므로 x = ${r1} 또는 x = ${r2}`,
      v:{type:"coordinate_plane",params:{xMin:-2,xMax:Math.max(r1,r2)+2,yMin:-5,yMax:10,points:[{x:r1,y:0,label:`x=${r1}`},{x:r2,y:0,label:`x=${r2}`}]}}};
  }
  function genSetOps() {
    const u=[1,2,3,4,5,6,7,8,9,10];
    const lenA=Math.floor(Math.random()*3)+3, lenB=Math.floor(Math.random()*3)+3;
    const A=u.sort(()=>Math.random()-0.5).slice(0,lenA).sort((a,b)=>a-b);
    const B=u.sort(()=>Math.random()-0.5).slice(0,lenB).sort((a,b)=>a-b);
    const inter=A.filter(x=>B.includes(x)).sort((a,b)=>a-b);
    return {q:`A = {${A.join(", ")}}, B = {${B.join(", ")}}일 때, A ∩ B를 구하시오.`,
      a:`{${inter.join(", ")}}`,
      ex:`A ∩ B는 A와 B의 공통원소의 집합이므로 {${inter.join(", ")}}입니다.`,
      v:{type:"venn_diagram",params:{setA:{label:"A",elements:A.map(String)},setB:{label:"B",elements:B.map(String)},intersection:inter.map(String),title:"A ∩ B"}}};
  }
  function genSequence() {
    const a1=Math.floor(Math.random()*5)+1, d=Math.floor(Math.random()*5)+2;
    const n=Math.floor(Math.random()*5)+5;
    const an=a1+(n-1)*d;
    return {q:`첫째항이 ${a1}이고 공차가 ${d}인 등차수열의 제${n}항을 구하시오.`,a:an,
      ex:`aₙ = a₁ + (n-1)d = ${a1} + (${n}-1)×${d} = ${a1} + ${(n-1)*d} = ${an}`,
      v:null};
  }
  function genTrigBasic() {
    const angles=[{deg:30,sin:"1/2",cos:"(루트3)/2",tan:"(루트3)/3"},{deg:45,sin:"(루트2)/2",cos:"(루트2)/2",tan:"1"},{deg:60,sin:"(루트3)/2",cos:"1/2",tan:"루트3"}];
    const a=angles[Math.floor(Math.random()*angles.length)];
    const fns=["sin","cos","tan"];
    const fn=fns[Math.floor(Math.random()*fns.length)];
    const ans=fn==="sin"?a.sin:fn==="cos"?a.cos:a.tan;
    return {q:`${fn} ${a.deg}°의 값을 구하시오.`,a:ans,
      ex:`${fn} ${a.deg}° = ${ans}입니다.`,
      v:{type:"labeled_triangle",params:{vertices:["A","B","C"],sides:[],angles:[{vertex:"B",mark:`${a.deg}°`},{vertex:"A",mark:"90°"}],type:"right"}}};
  }
  function genCircleAngle() {
    const central=Math.floor(Math.random()*8+2)*20;
    const inscribed=central/2;
    return {q:`그림과 같이 원 위에 세 점 A, B, C가 있고 O는 원의 중심이다. ∠AOB = ${central}°일 때, ∠ACB의 크기를 구하시오.`,a:`${inscribed}°`,
      ex:`원주각은 같은 호에 대한 중심각의 1/2이므로 ∠ACB = ${central}° ÷ 2 = ${inscribed}°입니다.`,
      v:{type:"circle_diagram",params:{radius:70,
        points:[{label:"A",angleDeg:300},{label:"B",angleDeg:300+central},{label:"C",angleDeg:300+central+90}],
        centralAngle:{from:0,to:1},
        inscribedAngle:{vertex:2,from:0,to:1},
        angleLabels:[{text:`${central}°`,type:"central"},{text:"?",type:"inscribed"}],
        title:"원주각과 중심각"}}};
  }

  // ========== 학년→그룹별 키-생성기 매핑 ==========
  const keyMap = {
    // 초등 3학년
    add_no_carry: genAddNoCarry, add_one_carry: genAddOneCarry, add_multi: genAddMultiCarry,
    estimate: genEstimate, sub_no: genSubNoCarry, division: genDivision,
    right_angle: genRightAngle, challenge: genChallenge,
  };
  // 학년별 힌트 매칭 (keyMap에 없을 때 텍스트 기반으로 생성기 선택)
  const hintMatchers = [
    // 초등 공통
    { re: /받아올림.*없|no.carry/i, fn: genAddNoCarry },
    { re: /받아올림.*한.번|one.carry/i, fn: genAddOneCarry },
    { re: /받아올림.*여러|multi.carry|연속/i, fn: genAddMultiCarry },
    { re: /어림/i, fn: genEstimate },
    { re: /받아내림.*없|뺄셈/i, fn: genSubNoCarry },
    { re: /나눗셈|나누기|division/i, fn: genDivision },
    { re: /직각|right.angle/i, fn: genRightAngle },
    { re: /심화|역산|추론|challenge/i, fn: genChallenge },
    { re: /분수|fraction/i, fn: genFraction },
    { re: /큰\s*수|네\s*자리|만\s*단위/i, fn: genLargeNumber },
    { re: /시계|시각|clock/i, fn: genClock },
    { re: /각도|예각|둔각|angle/i, fn: genAngle },
    { re: /소수|decimal/i, fn: genDecimalCalc },
    { re: /백분율|퍼센트|percent/i, fn: genPercentage },
    { re: /평균|자료.*정리|통계/i, fn: genDataTable },
    { re: /덧셈/i, fn: genAddNoCarry },
    // 중학
    { re: /정수|음수|양수|integer/i, fn: genInteger },
    { re: /일차\s*방정식|linear.*equation/i, fn: genLinearEquation },
    { re: /비례|proportion/i, fn: genProportion },
    { re: /피타고라스|pythagor|직각삼각형/i, fn: genPythagorean },
    { re: /삼각형|합동|닮음|triangle/i, fn: genPythagorean },
    { re: /확률|probability/i, fn: genProbability },
    { re: /소인수|인수분해|factor/i, fn: genFactorization },
    // 고등
    { re: /다항식|polynomial|인수분해/i, fn: genPolynomial },
    { re: /이차\s*방정식|quadratic/i, fn: genQuadratic },
    { re: /집합|set/i, fn: genSetOps },
    { re: /수열|등차|등비|sequence/i, fn: genSequence },
    { re: /삼각함수|sin|cos|tan|trig/i, fn: genTrigBasic },
    { re: /원주각|중심각|circle.*angle/i, fn: genCircleAngle },
  ];

  // 학교급별 기본 생성기 (힌트 매칭도 실패 시)
  const groupDefaults = {
    elementary: genAddNoCarry,
    middle: genInteger,
    high: genPolynomial,
  };

  // 생성기 선택 로직
  let generator = keyMap[meta._key] || null;

  if (!generator) {
    const hint = gd + " " + d2name + " " + d3ctx;
    for (const { re, fn } of hintMatchers) {
      if (re.test(hint)) { generator = fn; break; }
    }
  }

  // 학교급 기본 생성기로 폴백 (초등 덧셈이 아닌 학교급에 맞는 문제)
  if (!generator) generator = groupDefaults[group] || genAddNoCarry;

  addLog("[폴백] " + group + "/" + gradeKey + " → " + (generator.name || "fallback") + " ← gd:" + (meta.gd||"").substring(0,20));
  const p = generator();
  const ans = p.a;

  if(tp.includes("객관식")) {
    const isNumeric = typeof ans === "number";
    if (isNumeric) {
      const diff = [10, -10, 100, -1, 1, 11, -11, 50].sort(()=>Math.random()-0.5);
      const wrongs = diff.slice(0,3).map(d => ans+d).filter(v=>v!==ans&&v>0);
      while(wrongs.length<3) wrongs.push(ans+Math.floor(Math.random()*20)+1);
      const allOpts = [ans, ...wrongs.slice(0,3)].sort(()=>Math.random()-0.5);
      const opts = allOpts.map((v,i)=>({label:["①","②","③","④"][i],text:String(v),isCorrect:v===ans}));
      const ci = opts.findIndex(o=>o.isCorrect)+1;
      return {passage:null,stem:p.q,type:"mc",options:opts,answer:String(ci),explanation:p.ex,visual:p.v||null,visual2:p.v2||null};
    } else {
      // 문자열 정답 (분수, 집합 등)
      const ansStr = String(ans);
      const dummyOpts = ["해당 없음","알 수 없음","정의되지 않음"];
      const allOpts = [ansStr, ...dummyOpts.slice(0,3)].sort(()=>Math.random()-0.5);
      const opts = allOpts.map((v,i)=>({label:["①","②","③","④"][i],text:v,isCorrect:v===ansStr}));
      const ci = opts.findIndex(o=>o.isCorrect)+1;
      return {passage:null,stem:p.q,type:"mc",options:opts,answer:String(ci),explanation:p.ex,visual:p.v||null,visual2:p.v2||null};
    }
  } else if(tp.includes("OX")) {
    const isCorrect = Math.random()>0.5;
    const stem = p.q.replace(/구하시오[.]?/,"").replace(/무엇입니까[?]?/,"").trim();
    return {passage:null,stem:`"${stem}의 답은 ${ans}이다." 이 문장이 맞으면 O, 틀리면 X를 선택하세요.`,type:"ox",options:null,answer:isCorrect?"O":"X",explanation:`정답은 ${ans}이므로 ${isCorrect?"맞습니다":"틀립니다"}. ${p.ex}`,visual:p.v||null,visual2:p.v2||null};
  } else if(tp.includes("빈칸")) {
    return {passage:null,stem:p.q.replace("구하시오","빈칸에 알맞은 수를 써넣으시오").replace("무엇입니까","얼마입니까"),type:"fill",options:null,answer:String(ans),explanation:p.ex,visual:p.v||null,visual2:p.v2||null};
  } else {
    return {passage:null,stem:p.q.replace("구하시오","풀이 과정을 자세히 쓰고 답을 구하시오"),type:"essay",options:null,answer:"essay",explanation:p.ex,visual:p.v||null,visual2:p.v2||null};
  }
}
