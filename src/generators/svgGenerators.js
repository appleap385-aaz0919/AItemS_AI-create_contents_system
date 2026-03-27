// SVG 시각요소 생성기 — 초등 수학 문항용 순수 함수
// 각 함수: (params) => svgString

// 세로셈 SVG
export function svgVerticalCalc({ a, b, op = "+", result, blanks = [] }) {
  const aStr = String(a);
  const bStr = String(b);
  const rStr = String(result != null ? result : (op === "+" ? a + b : a - b));
  const len = Math.max(aStr.length, bStr.length, rStr.length);
  const colW = 28, padL = 40, padR = 16, rowH = 36;
  const w = padL + len * colW + padR;
  const h = rowH * 4 + 16;
  const font = 'font-family="Spoqa Han Sans Neo,monospace" font-size="22" fill="#333"';

  // 올림 계산
  const carries = [];
  if (op === "+") {
    let carry = 0;
    for (let i = 0; i < len; i++) {
      const da = Number(aStr[aStr.length - 1 - i]) || 0;
      const db = Number(bStr[bStr.length - 1 - i]) || 0;
      const sum = da + db + carry;
      carry = sum >= 10 ? 1 : 0;
      if (carry && i < len - 1) carries.push(i + 1);
    }
  }

  function digitX(pos) { return padL + (len - 1 - pos) * colW + colW / 2; }

  let els = [];
  // 배경
  els.push(`<rect x="0" y="0" width="${w}" height="${h}" rx="8" fill="#fafaf8"/>`);

  // 윗수 (a)
  for (let i = 0; i < aStr.length; i++) {
    const pos = aStr.length - 1 - i;
    els.push(`<text x="${digitX(pos)}" y="${rowH}" text-anchor="middle" ${font}>${aStr[i]}</text>`);
  }

  // 연산 기호 + 아랫수 (b)
  els.push(`<text x="${padL - 24}" y="${rowH * 2}" text-anchor="middle" font-family="Spoqa Han Sans Neo,sans-serif" font-size="22" fill="#6c5ce7">${op === "+" ? "+" : "−"}</text>`);
  for (let i = 0; i < bStr.length; i++) {
    const pos = bStr.length - 1 - i;
    els.push(`<text x="${digitX(pos)}" y="${rowH * 2}" text-anchor="middle" ${font}>${bStr[i]}</text>`);
  }

  // 가로줄
  els.push(`<line x1="${padL - 32}" y1="${rowH * 2 + 10}" x2="${w - padR + 4}" y2="${rowH * 2 + 10}" stroke="#333" stroke-width="2"/>`);

  // 결과
  for (let i = 0; i < rStr.length; i++) {
    const pos = rStr.length - 1 - i;
    const isBlank = blanks.includes(pos);
    if (isBlank) {
      const bx = digitX(pos) - 10, by = rowH * 3 - 18;
      els.push(`<rect x="${bx}" y="${by}" width="20" height="24" rx="3" fill="none" stroke="#6c5ce7" stroke-width="1.5" stroke-dasharray="3"/>`);
    } else {
      els.push(`<text x="${digitX(pos)}" y="${rowH * 3}" text-anchor="middle" font-family="Spoqa Han Sans Neo,monospace" font-size="22" fill="#0084ff" font-weight="600">${rStr[i]}</text>`);
    }
  }

  // 올림 표시
  carries.forEach(pos => {
    if (pos < len) {
      els.push(`<text x="${digitX(pos) + 8}" y="${rowH * 0.35}" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#e74c3c">1</text>`);
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" style="max-width:${w}px;display:block">${els.join("")}</svg>`;
}

// 도형 SVG — 6종 좌표 룩업
export function svgShape({ shape, showRightAngles = true }) {
  const W = 220, H = 180;
  const shapes = {
    "직사각형": { pts: [[40,30],[180,30],[180,130],[40,130]], rightAngles: [[40,30],[180,30],[180,130],[40,130]] },
    "정사각형": { pts: [[50,20],[170,20],[170,140],[50,140]], rightAngles: [[50,20],[170,20],[170,140],[50,140]] },
    "직각삼각형": { pts: [[40,140],[180,140],[40,40]], rightAngles: [[40,140]] },
    "마름모": { pts: [[110,20],[190,80],[110,140],[30,80]], rightAngles: [] },
    "평행사변형": { pts: [[60,30],[190,30],[160,130],[30,130]], rightAngles: [] },
    "정삼각형": { pts: [[110,25],[195,140],[25,140]], rightAngles: [] },
  };

  const s = shapes[shape];
  if (!s) return "";

  const ptStr = s.pts.map(p => p.join(",")).join(" ");
  let els = [];
  els.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#fafaf8"/>`);
  els.push(`<polygon points="${ptStr}" fill="#E8F4FD" stroke="#2196F3" stroke-width="2.5" stroke-linejoin="round"/>`);

  // 직각 마커 (각 꼭짓점에 작은 사각형)
  if (showRightAngles && s.rightAngles.length > 0) {
    s.rightAngles.forEach(([cx, cy]) => {
      const idx = s.pts.findIndex(p => p[0] === cx && p[1] === cy);
      if (idx === -1) return;
      const prev = s.pts[(idx - 1 + s.pts.length) % s.pts.length];
      const next = s.pts[(idx + 1) % s.pts.length];
      const sz = 12;
      const dx1 = Math.sign(prev[0] - cx), dy1 = Math.sign(prev[1] - cy);
      const dx2 = Math.sign(next[0] - cx), dy2 = Math.sign(next[1] - cy);
      const p1 = [cx + dx1 * sz, cy + dy1 * sz];
      const p2 = [cx + dx1 * sz + dx2 * sz, cy + dy1 * sz + dy2 * sz];
      const p3 = [cx + dx2 * sz, cy + dy2 * sz];
      els.push(`<polyline points="${p1.join(",")},${p2.join(",")},${p3.join(",")}" fill="none" stroke="#F44336" stroke-width="1.5"/>`);
    });
  }

  // 라벨
  els.push(`<text x="${W / 2}" y="${H - 5}" text-anchor="middle" font-family="Spoqa Han Sans Neo,sans-serif" font-size="13" fill="#636e72">${shape}</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;display:block">${els.join("")}</svg>`;
}

// 나눗셈 묶음 SVG
export function svgGrouping({ total, groupSize }) {
  const groups = Math.ceil(total / groupSize);
  const cols = groupSize <= 5 ? groupSize : Math.ceil(Math.sqrt(groupSize));
  const rows = Math.ceil(groupSize / cols);
  const circR = 10, gap = 28, gGap = 20, pad = 16;
  const gW = cols * gap + 12, gH = rows * gap + 12;
  const W = groups * (gW + gGap) - gGap + pad * 2;
  const H = gH + pad * 2 + 28;

  let els = [];
  els.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#fafaf8"/>`);

  let count = 0;
  for (let g = 0; g < groups; g++) {
    const gx = pad + g * (gW + gGap);
    const gy = pad;
    const itemsInGroup = Math.min(groupSize, total - count);

    // 그룹 박스
    els.push(`<rect x="${gx}" y="${gy}" width="${gW}" height="${gH}" rx="8" fill="none" stroke="#FF9800" stroke-width="1.5" stroke-dasharray="5,3"/>`);

    // 원
    for (let i = 0; i < itemsInGroup; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      const cx = gx + 18 + c * gap, cy = gy + 18 + r * gap;
      els.push(`<circle cx="${cx}" cy="${cy}" r="${circR}" fill="#FFE0B2" stroke="#F57C00" stroke-width="1.5"/>`);
      count++;
    }

    // 그룹 번호
    els.push(`<text x="${gx + gW / 2}" y="${gy + gH + 16}" text-anchor="middle" font-family="Spoqa Han Sans Neo,sans-serif" font-size="11" fill="#636e72">${itemsInGroup}개</text>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:${Math.min(W, 500)}px;display:block">${els.join("")}</svg>`;
}

// 수직선 SVG
export function svgNumberLine({ min = 0, max = 1000, step = 100, marks = [], highlights = [] }) {
  const W = 420, H = 80, padX = 30, lineY = 35;
  const lineW = W - padX * 2;

  function xPos(v) { return padX + ((v - min) / (max - min)) * lineW; }

  let els = [];
  els.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#fafaf8"/>`);

  // 주 선
  els.push(`<line x1="${padX}" y1="${lineY}" x2="${W - padX}" y2="${lineY}" stroke="#333" stroke-width="2"/>`);
  // 화살표
  els.push(`<polygon points="${padX - 6},${lineY} ${padX + 2},${lineY - 4} ${padX + 2},${lineY + 4}" fill="#333"/>`);
  els.push(`<polygon points="${W - padX + 6},${lineY} ${W - padX - 2},${lineY - 4} ${W - padX - 2},${lineY + 4}" fill="#333"/>`);

  // 눈금
  for (let v = min; v <= max; v += step) {
    const x = xPos(v);
    els.push(`<line x1="${x}" y1="${lineY - 6}" x2="${x}" y2="${lineY + 6}" stroke="#333" stroke-width="1.5"/>`);
    els.push(`<text x="${x}" y="${lineY + 20}" text-anchor="middle" font-family="Spoqa Han Sans Neo,sans-serif" font-size="11" fill="#636e72">${v}</text>`);
  }

  // 마커 (원래 수)
  marks.forEach(v => {
    const x = xPos(v);
    els.push(`<circle cx="${x}" cy="${lineY}" r="4" fill="#6c5ce7"/>`);
    els.push(`<text x="${x}" y="${lineY - 10}" text-anchor="middle" font-family="Spoqa Han Sans Neo,sans-serif" font-size="10" fill="#6c5ce7">${v}</text>`);
  });

  // 하이라이트 (어림값)
  highlights.forEach(v => {
    const x = xPos(v);
    els.push(`<circle cx="${x}" cy="${lineY}" r="6" fill="none" stroke="#e74c3c" stroke-width="2"/>`);
    els.push(`<text x="${x}" y="${lineY - 12}" text-anchor="middle" font-family="Spoqa Han Sans Neo,sans-serif" font-size="11" fill="#e74c3c" font-weight="600">${v}</text>`);
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;display:block">${els.join("")}</svg>`;
}

// dispatcher
export function renderVisualSvg(visual) {
  if (!visual || !visual.type || !visual.params) return "";
  try {
    switch (visual.type) {
      case "vertical_calc": return svgVerticalCalc(visual.params);
      case "shape": return svgShape(visual.params);
      case "grouping": return svgGrouping(visual.params);
      case "number_line": return svgNumberLine(visual.params);
      default: return "";
    }
  } catch (e) {
    console.warn("[svgGenerators] 렌더링 실패:", visual.type, e);
    return "";
  }
}
