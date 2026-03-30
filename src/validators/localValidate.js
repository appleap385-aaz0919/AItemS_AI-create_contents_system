import { addLog } from '../api/apiLog.js';

export function localValidate(meta, question) {
  addLog("[검수팀] 🔧 로컬 규칙 기반 검수 시작");
  const d1Issues=[], d2Issues=[], d3Issues=[], d4Issues=[];
  let d1=25, d2=30, d3=20, d4=25;

  // === D1: 문항 구조 검증 (25점) ===
  if(!question.stem || question.stem.length < 5) { d1Issues.push("발문이 너무 짧거나 없음"); d1-=15; }
  if(!question.type || !["mc","ox","fill","essay"].includes(question.type)) { d1Issues.push("유형 코드 오류: "+question.type); d1-=10; }
  if(question.type==="mc") {
    if(!question.options || question.options.length !== 4) { d1Issues.push("객관식 보기 수 오류: "+(question.options?.length||0)+"개"); d1-=15; }
    if(question.options && !question.options.some(o=>o.isCorrect)) { d1Issues.push("정답 보기(isCorrect=true) 없음"); d1-=10; }
  }
  if(!question.answer || question.answer.length === 0) { d1Issues.push("answer 필드 비어있음"); d1-=15; }

  // === D2: 교육적정성 + 정답 검증 (30점) ===
  if(question.type==="mc" && question.options) {
    const correctIdx = question.options.findIndex(o=>o.isCorrect)+1;
    if(correctIdx > 0 && String(correctIdx) !== String(question.answer)) {
      d2Issues.push("정답 번호 불일치: answer="+question.answer+" vs isCorrect 위치="+correctIdx);
      d2-=20;
    }
    const texts = question.options.map(o=>o.text);
    if(new Set(texts).size !== texts.length) { d2Issues.push("보기에 중복 있음"); d2-=10; }
  }
  if(question.type==="ox" && !["O","X"].includes(question.answer)) {
    d2Issues.push("OX 정답이 O/X가 아님: "+question.answer); d2-=20;
  }
  if(question.type==="fill" && (!question.answer || question.answer.trim()==="")) {
    d2Issues.push("빈칸채우기 정답 비어있음"); d2-=20;
  }
  const mathMatch = question.stem?.match(/(\d+)\s*[+＋]\s*(\d+)/);
  if(mathMatch && question.type==="fill") {
    const expected = parseInt(mathMatch[1]) + parseInt(mathMatch[2]);
    if(String(expected) !== String(question.answer)) {
      d2Issues.push("덧셈 정답 오류: "+mathMatch[1]+"+"+mathMatch[2]+"="+expected+" (answer: "+question.answer+")");
      d2-=25;
    }
  }
  const subMatch = question.stem?.match(/(\d+)\s*[-−]\s*(\d+)/);
  if(subMatch && question.type==="fill") {
    const expected = parseInt(subMatch[1]) - parseInt(subMatch[2]);
    if(String(expected) !== String(question.answer)) {
      d2Issues.push("뺄셈 정답 오류: "+subMatch[1]+"-"+subMatch[2]+"="+expected+" (answer: "+question.answer+")");
      d2-=25;
    }
  }
  if(!question.explanation || question.explanation.length < 10) { d2Issues.push("해설이 너무 짧거나 없음"); d2-=5; }

  // === D3: 접근성 + 시각자료 검증 (20점) ===
  // mc 객관식: visual이 정답을 노출하는지 확인
  if(question.type==="mc" && question.visual && question.visual.type==="vertical_calc" && !question.visual.params?.hideResult) {
    d3Issues.push("객관식 세로셈 시각자료 정답 노출 위험 (hideResult 미적용)"); d3-=10;
  }
  if(question.type==="mc" && question.visual2 && question.visual2.type==="base10_blocks") {
    d3Issues.push("객관식 십진블록 visual2가 정답 노출"); d3-=10;
  }
  if(question.stem && question.stem.length > 500) { d3Issues.push("발문이 너무 김: "+question.stem.length+"자"); d3-=5; }
  if(question.stem && /\\\\begin|\\\\frac|\\\\times|\$\$/.test(question.stem)) { d3Issues.push("LaTeX 잔여 코드 발견"); d3-=10; }
  if(question.stem && /[<>]/.test(question.stem.replace(/<br>/g,""))) { d3Issues.push("HTML 태그 잔여"); d3-=5; }

  // 시각자료(visual) 정합성 검증
  if(question.visual && question.visual.type && question.visual.params) {
    const v = question.visual, p = v.params;
    if(v.type === "vertical_calc") {
      // 세로셈: a, b, op, result 일치 확인
      if(typeof p.a === "number" && typeof p.b === "number" && p.op) {
        const expected = p.op === "+" ? p.a + p.b : p.a - p.b;
        if(p.result != null && Number(p.result) !== expected) {
          d3Issues.push("시각자료 세로셈 결과 불일치: "+p.a+" "+p.op+" "+p.b+" = "+expected+" (visual.result: "+p.result+")");
          d3-=5;
        }
        // stem의 수식과 visual 파라미터 일치 확인
        const stemNums = (question.stem||"").match(/\d{2,}/g);
        if(stemNums && stemNums.length >= 2) {
          const sa = Number(stemNums[0]), sb = Number(stemNums[1]);
          if(sa !== p.a && sb !== p.a && sa !== p.b && sb !== p.b) {
            d3Issues.push("시각자료와 발문 수치 불일치: stem("+sa+","+sb+") vs visual("+p.a+","+p.b+")");
            d3-=5;
          }
        }
      } else {
        d3Issues.push("시각자료 세로셈 파라미터 누락 (a/b/op)"); d3-=3;
      }
      // 빈칸 위치 일관성: blanks/blanksA/blanksB 중 하나는 비어있지 않아야 함
      if(question.type === "fill") {
        const hasBlanks = (p.blanks && p.blanks.length > 0) || (p.blanksA && p.blanksA.length > 0) || (p.blanksB && p.blanksB.length > 0);
        if(!hasBlanks) {
          d3Issues.push("빈칸채우기인데 세로셈 빈칸 위치(blanks/blanksA/blanksB) 미설정");
          d3-=5;
        }
      }
    } else if(v.type === "shape") {
      // 도형: shape명이 stem에 언급되는지 확인
      if(p.shape && question.stem && !question.stem.includes(p.shape)) {
        d3Issues.push("시각자료 도형("+p.shape+")이 발문에 미언급");
        d3-=3;
      }
      const validShapes = ["직사각형","정사각형","직각삼각형","마름모","평행사변형","정삼각형"];
      if(p.shape && !validShapes.includes(p.shape)) {
        d3Issues.push("시각자료 미지원 도형: "+p.shape); d3-=5;
      }
    } else if(v.type === "grouping") {
      // 묶음: total, groupSize 유효성 + stem 일치
      if(!p.total || !p.groupSize || p.total <= 0 || p.groupSize <= 0) {
        d3Issues.push("시각자료 묶음 파라미터 오류"); d3-=5;
      } else if(p.total % p.groupSize !== 0) {
        d3Issues.push("시각자료 묶음이 나누어 떨어지지 않음: "+p.total+"÷"+p.groupSize); d3-=3;
      }
    } else if(v.type === "number_line") {
      // 수직선: marks, highlights 범위 확인
      if(p.marks && p.marks.some(m => m < p.min || m > p.max)) {
        d3Issues.push("시각자료 수직선 마커가 범위 밖"); d3-=3;
      }
    } else if(v.type === "base10_blocks") {
      // 십진 블록: a, b, result 유효성
      if(!p.a || !p.b) { d3Issues.push("십진블록 파라미터(a/b) 누락"); d3-=3; }
      else {
        const expected = (p.op === "+") ? p.a + p.b : p.a - p.b;
        if(p.result != null && Number(p.result) !== expected) {
          d3Issues.push("십진블록 결과 불일치: "+p.a+" "+p.op+" "+p.b+" = "+expected+" (result: "+p.result+")");
          d3-=5;
        }
      }
    } else if(v.type === "context_illust") {
      // 상황 일러스트: contextText 유효성
      if(!p.contextText || p.contextText.length < 3) {
        d3Issues.push("상황 일러스트 텍스트 누락 또는 너무 짧음"); d3-=3;
      }
    }
  } else {
    // 시각자료가 없을 때 — 덧셈/뺄셈/도형은 권장
    const needsVisual = meta._key && /add_|sub_|right_angle|division|estimate/.test(meta._key);
    if(needsVisual) {
      d3Issues.push("시각자료 없음 (권장: "+meta._key+")");
      // 감점하지 않음 — 정보성 알림
    }
  }

  // === D4: 채점 로직 (25점) ===
  if(question.type==="mc" && question.options) {
    const correctCount = question.options.filter(o=>o.isCorrect).length;
    if(correctCount !== 1) { d4Issues.push("정답 보기 수 오류: "+correctCount+"개 (1개여야 함)"); d4-=15; }
  }
  if(question.type==="essay" && question.answer !== "essay") { d4Issues.push("서술형인데 answer가 'essay'가 아님"); d4-=5; }

  d1=Math.max(0,d1); d2=Math.max(0,d2); d3=Math.max(0,d3); d4=Math.max(0,d4);
  const score = d1+d2+d3+d4;
  const hasCritical = d2Issues.some(i=>i.includes("정답") && i.includes("오류"));
  const verified = !hasCritical && d2 >= 15;
  const status = (score >= 80 && verified) ? "approved" : "rejected";

  addLog("[검수팀] 🔧 로컬 검수 완료: " + score + "점 " + (status==="approved"?"✅":"❌") + " (이슈 " + (d1Issues.length+d2Issues.length+d3Issues.length+d4Issues.length) + "건)");

  return {
    score, status, _localValidation: true,
    D1_code:{score:d1,issues:d1Issues},
    D2_education:{score:d2,issues:d2Issues},
    D3_accessibility:{score:d3,issues:d3Issues},
    D4_scoring:{score:d4,issues:d4Issues},
    answer_verified: verified,
    correct_answer: question.answer,
    summary: `로컬 규칙 검수 — ${score}점 ${status==="approved"?"승인":"반려"}` + (d2Issues.length>0 ? " | "+d2Issues[0] : "")
  };
}
