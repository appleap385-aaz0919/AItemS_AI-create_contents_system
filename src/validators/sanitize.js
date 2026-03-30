export function sanitizeLatex(text) {
  if (!text) return text;
  return text
    .replace(/\$\$[\s\S]*?\$\$/g, (match) => {
      const rows = match.split(/\\\\/).map(r => r.replace(/[&\\{}a-zA-Z\s$]/g, '').replace(/^[+\-×÷]/, '').trim()).filter(r => /\d/.test(r));
      if (rows.length >= 2) {
        const op = match.includes('+') ? ' + ' : match.includes('-') ? ' - ' : ' + ';
        return rows.join(op) + ' = ?';
      }
      const cleaned = match.replace(/\$\$/g, '').replace(/\\[a-zA-Z]+/g, '').replace(/[{}]/g, '').trim();
      return cleaned || '';
    })
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\begin\{[^}]*\}[\s\S]*?\\end\{[^}]*\}/g, '')
    .replace(/\\frac\{(\d+)\}\{(\d+)\}/g, '$1/$2')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\cdot/g, '·')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\\\/g, '')
    .replace(/\\hline/g, '')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#?\w+;/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// 세로셈/줄바꿈 패턴을 가로 수식으로 변환
function flattenVerticalMath(text) {
  if (!text) return text;
  // 패턴1: "267\n+ 185\n-----\n결과" (구분선 있음)
  text = text.replace(/(\d+)\s*\n\s*([+\-×÷])\s*(\d[\d()\s]*)\s*\n\s*[-=─]{2,}\s*\n?\s*([^\n]*)/g, (_, a, op, b, ans) => {
    const bClean = b.replace(/[^0-9()□ ]/g, '').trim();
    const ansClean = (ans || '').trim();
    if (ansClean) return `${a} ${op} ${bClean} = ${ansClean}`;
    return `${a} ${op} ${bClean}`;
  });
  // 패턴2: "267\n+ 185()" (구분선 없음, 줄바꿈만)
  text = text.replace(/(\d+)\s*\n\s*([+\-×÷])\s*(\d[\d()\s□]*)/g, (_, a, op, b) => {
    return `${a} ${op} ${b.trim()}`;
  });
  // 구분선만 남은 줄 제거
  text = text.replace(/\n\s*[-=─]{3,}\s*\n?/g, ' ');
  // 연속 줄바꿈 정리
  text = text.replace(/\n{2,}/g, '\n').trim();
  return text;
}

// stem에서 연산자 추출
function extractStemOp(stem) {
  if (!stem) return null;
  // "267 + 185" 또는 "267+185" 형태에서 연산자 추출
  const match = stem.match(/\d+\s*([+\-＋−×÷])\s*\d+/);
  if (!match) return null;
  const op = match[1];
  if (op === '+' || op === '＋') return '+';
  if (op === '-' || op === '−') return '-';
  if (op === '×') return '×';
  if (op === '÷') return '÷';
  return op;
}

export function sanitizeQuestion(q) {
  if (!q) return q;
  q.stem = flattenVerticalMath(sanitizeLatex(q.stem));
  if (q.passage) q.passage = sanitizeLatex(q.passage);
  if (q.explanation) q.explanation = sanitizeLatex(q.explanation);
  if (q.options) q.options.forEach(o => { o.text = sanitizeLatex(o.text); });
  // visual 필드는 구조화 데이터이므로 그대로 통과
  if (q.visual && (!q.visual.type || !q.visual.params)) q.visual = null;
  // visual2 (보조 시각자료) 유효성
  if (q.visual2 && (!q.visual2.type || !q.visual2.params)) q.visual2 = null;
  const validVisualTypes = [
    // 기존 초등
    "vertical_calc", "base10_blocks", "context_illust", "shape", "grouping", "number_line",
    // 신규 초·중·고
    "labeled_triangle", "coordinate_plane", "fraction_bar", "data_table",
    "bar_chart", "pie_chart", "clock_face", "venn_diagram", "circle_diagram",
  ];
  if (q.visual && !validVisualTypes.includes(q.visual.type)) q.visual = null;
  if (q.visual2 && !validVisualTypes.includes(q.visual2.type)) q.visual2 = null;

  // 빈칸채우기에서 십진 블록은 답을 노출하므로 제거
  if (q.type === "fill" && q.visual2 && q.visual2.type === "base10_blocks") {
    q.visual2 = null;
  }

  // 객관식(mc): 십진 블록은 결과행 포함 → 정답 노출이므로 제거
  if (q.type === "mc" && q.visual2 && q.visual2.type === "base10_blocks") {
    q.visual2 = null;
  }

  // 객관식(mc): vertical_calc SVG에서 결과행 숨김 (hideResult=true)
  if (q.type === "mc" && q.visual && q.visual.type === "vertical_calc" && q.visual.params) {
    q.visual.params.hideResult = true;
  }

  // stem-visual 정합성 강제 교정 (세로셈)
  if (q.visual && q.visual.type === "vertical_calc" && q.visual.params) {
    const p = q.visual.params;

    // 1) visual의 result 재계산
    const expected = p.op === "+" ? p.a + p.b : p.a - p.b;
    if (p.result !== expected) {
      p.result = expected;
    }

    // 1-b) 빈칸채우기: stem에서 빈칸 위치 감지 → blanks/blanksA/blanksB 설정
    if (q.type === "fill") {
      const origStem = q.stem || "";
      const aStr = String(p.a), bStr = String(p.b), rStr = String(p.result);
      const answerStr = String(q.answer);

      // stem에서 빈칸이 어디에 있는지 감지
      // 패턴: "2□5", "2( )5", "2()5" → 피연산자에 빈칸
      // "= □", "= ( )" → 결과에 빈칸
      const blankInOperand = origStem.match(/(\d)[□()\s]+(\d)/);
      let blankTarget = "result"; // 기본: 결과에 빈칸

      if (blankInOperand) {
        // 빈칸 주변 숫자로 어떤 피연산자인지 판별
        const before = blankInOperand[1], after = blankInOperand[2];
        // a에서 빈칸 찾기
        for (let i = 0; i < aStr.length - 1; i++) {
          if (aStr[i] === before && aStr[i + 2] === after) {
            blankTarget = "a";
            const pos = aStr.length - 1 - (i + 1); // 자릿수 (우→좌)
            p.blanksA = [pos];
            p.blanksB = p.blanksB || [];
            p.blanks = p.blanks || [];
            break;
          }
        }
        // b에서 빈칸 찾기
        if (blankTarget === "result") {
          for (let i = 0; i < bStr.length - 1; i++) {
            if (bStr[i] === before && bStr[i + 2] === after) {
              blankTarget = "b";
              const pos = bStr.length - 1 - (i + 1);
              p.blanksB = [pos];
              p.blanksA = p.blanksA || [];
              p.blanks = p.blanks || [];
              break;
            }
          }
        }
      }

      // 결과에 빈칸인 경우 (기본)
      if (blankTarget === "result" && (!p.blanks || p.blanks.length === 0)) {
        const blanks = [];
        if (answerStr.length === 1 && rStr.length >= 2) {
          for (let i = rStr.length - 1; i >= 0; i--) {
            if (rStr[i] === answerStr) {
              blanks.push(rStr.length - 1 - i);
              break;
            }
          }
        }
        if (blanks.length === 0) blanks.push(rStr.length - 1);
        p.blanks = blanks;
        p.blanksA = p.blanksA || [];
        p.blanksB = p.blanksB || [];
      }

      // 배열 기본값 보장
      if (!p.blanks) p.blanks = [];
      if (!p.blanksA) p.blanksA = [];
      if (!p.blanksB) p.blanksB = [];
    }

    // 2) stem 연산자 vs visual 연산자 비교
    const stemOp = extractStemOp(q.stem);
    if (stemOp && stemOp !== p.op) {
      // 연산자 불일치 — visual을 stem에 맞추기 (stem이 사용자 의도)
      p.op = stemOp;
      p.result = stemOp === "+" ? p.a + p.b : p.a - p.b;
    }

    // 3) stem 수치 vs visual 수치 비교
    const stemNums = q.stem.match(/\d{2,}/g) || [];
    if (stemNums.length >= 2) {
      const sA = Number(stemNums[0]), sB = Number(stemNums[1]);
      if (sA !== p.a || sB !== p.b) {
        // 수치 불일치 — visual을 stem에 맞추기
        p.a = sA;
        p.b = sB;
        p.result = p.op === "+" ? sA + sB : sA - sB;
      }
    }

    // 4) visual이 있으면 stem에서 수식 부분 제거 (SVG가 시각적으로 표시)
    // 발문 텍스트만 남기기 ("다음 계산에서 ( ) 안에 알맞은 수를 써넣으시오.")
    q.stem = q.stem
      .replace(/\d{2,}\s*[+\-×÷＋−]\s*\d[\d()\s□]*\s*[=\-─]*\s*[\d()\s□]*/g, '')
      .replace(/[=]\s*\d+/g, '')
      .replace(/[=]\s*[()□]+/g, '')
      .replace(/^\s*[)]\s*/, '')          // 앞에 남은 닫는 괄호 제거
      .replace(/\s+[)]\s*$/, '')          // 뒤에 남은 닫는 괄호 제거
      .replace(/([^(])\)\s*$/, '$1')      // 문장 끝 고립된 ) 제거
      .replace(/\s{2,}/g, ' ')
      .trim();
    // 빈칸채우기면 빈칸 표시 보완
    if (q.type === "fill" && !/[()□]/.test(q.stem)) {
      q.stem += ' ( )';
    }
  }

  // 유형별 stem 보완 — type="fill"인데 빈칸 표시 없으면 추가
  if (q.type === "fill" && q.stem && !/[()□\[\]]/.test(q.stem)) {
    if (q.answer && q.stem.includes('= ' + q.answer)) {
      q.stem = q.stem.replace('= ' + q.answer, '= ( )');
    } else if (q.answer && q.stem.includes(q.answer)) {
      q.stem = q.stem.replace(q.answer, '( )');
    } else {
      q.stem = q.stem.replace(/[.?]?\s*$/, '') + ' ( )에 알맞은 수를 써넣으시오.';
    }
  }
  return q;
}
