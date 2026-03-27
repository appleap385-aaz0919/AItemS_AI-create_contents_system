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
    .replace(/<[^>]*>/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// 세로셈 패턴을 가로 수식으로 변환
// 예: "367\n+ 285\n-----\n6( )" → "367 + 285 = 6( )"
// 예: "367\n+ 285\n-----\n652" → "367 + 285 = 652"
function flattenVerticalMath(text) {
  if (!text || !text.includes('\n')) return text;
  // 세로셈 패턴: 숫자\n연산자 숫자\n구분선\n결과
  const vertPattern = /(\d+)\s*\n\s*([+\-×÷])\s*(\d+)\s*\n\s*[-=─]+\s*\n?\s*([^\n]*)/g;
  let result = text.replace(vertPattern, (_, a, op, b, ans) => {
    const ansClean = ans.trim();
    if (ansClean) return `${a} ${op} ${b} = ${ansClean}`;
    return `${a} ${op} ${b}`;
  });
  // 구분선만 남은 줄 제거
  result = result.replace(/\n\s*[-=─]{3,}\s*\n?/g, ' ');
  // 연속 줄바꿈 정리 (발문 + 수식이 분리되지 않도록)
  result = result.replace(/\n{2,}/g, '\n').trim();
  return result;
}

export function sanitizeQuestion(q) {
  if (!q) return q;
  q.stem = flattenVerticalMath(sanitizeLatex(q.stem));
  if (q.passage) q.passage = sanitizeLatex(q.passage);
  if (q.explanation) q.explanation = sanitizeLatex(q.explanation);
  if (q.options) q.options.forEach(o => { o.text = sanitizeLatex(o.text); });
  // visual 필드는 구조화 데이터이므로 그대로 통과
  if (q.visual && (!q.visual.type || !q.visual.params)) q.visual = null;

  // 유형별 stem 보완 — type="fill"인데 빈칸 표시 없으면 추가
  if (q.type === "fill" && q.stem && !/[()□\[\]]/.test(q.stem)) {
    // stem에 "= 정답숫자"가 있으면 정답 부분을 ( )로 교체
    if (q.answer && q.stem.includes('= ' + q.answer)) {
      q.stem = q.stem.replace('= ' + q.answer, '= ( )');
    } else if (q.answer && q.stem.includes(q.answer)) {
      q.stem = q.stem.replace(q.answer, '( )');
    } else {
      // 빈칸 표시가 전혀 없으면 stem 끝에 추가
      q.stem = q.stem.replace(/[.?]?\s*$/, '') + ' ( )에 알맞은 수를 써넣으시오.';
    }
  }
  return q;
}
