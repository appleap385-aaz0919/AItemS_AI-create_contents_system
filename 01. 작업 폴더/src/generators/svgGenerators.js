// SVG 시각요소 생성기 — 초등 수학 문항용 순수 함수
// 각 함수: (params) => svgString

// 세로셈 SVG
export function svgVerticalCalc({ a, b, op = "+", result, blanks = [], blanksA = [], blanksB = [], hideResult = false }) {
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
  els.push(`<rect x="0" y="0" width="${w}" height="${h}" rx="8" fill="#ffffff"/>`);

  // 윗수 (a) — blanksA 지원
  for (let i = 0; i < aStr.length; i++) {
    const pos = aStr.length - 1 - i;
    const isBlank = blanksA.includes(pos);
    if (isBlank) {
      const bx = digitX(pos) - 10, by = rowH - 18;
      els.push(`<rect x="${bx}" y="${by}" width="20" height="24" rx="3" fill="none" stroke="#6c5ce7" stroke-width="1.5" stroke-dasharray="3"/>`);
    } else {
      els.push(`<text x="${digitX(pos)}" y="${rowH}" text-anchor="middle" ${font}>${aStr[i]}</text>`);
    }
  }

  // 연산 기호 + 아랫수 (b) — blanksB 지원
  els.push(`<text x="${padL - 24}" y="${rowH * 2}" text-anchor="middle" font-family="Spoqa Han Sans Neo,sans-serif" font-size="22" fill="#6c5ce7">${op === "+" ? "+" : "−"}</text>`);
  for (let i = 0; i < bStr.length; i++) {
    const pos = bStr.length - 1 - i;
    const isBlank = blanksB.includes(pos);
    if (isBlank) {
      const bx = digitX(pos) - 10, by = rowH * 2 - 18;
      els.push(`<rect x="${bx}" y="${by}" width="20" height="24" rx="3" fill="none" stroke="#6c5ce7" stroke-width="1.5" stroke-dasharray="3"/>`);
    } else {
      els.push(`<text x="${digitX(pos)}" y="${rowH * 2}" text-anchor="middle" ${font}>${bStr[i]}</text>`);
    }
  }

  // 가로줄
  els.push(`<line x1="${padL - 32}" y1="${rowH * 2 + 10}" x2="${w - padR + 4}" y2="${rowH * 2 + 10}" stroke="#333" stroke-width="2"/>`);

  // 결과 (hideResult=true면 물음표로 표시 — mc 객관식 정답 노출 방지)
  for (let i = 0; i < rStr.length; i++) {
    const pos = rStr.length - 1 - i;
    const isBlank = blanks.includes(pos);
    if (hideResult) {
      // mc 객관식: 결과 자리에 ? 표시
      els.push(`<text x="${digitX(pos)}" y="${rowH * 3}" text-anchor="middle" font-family="Spoqa Han Sans Neo,monospace" font-size="22" fill="#bbb">?</text>`);
    } else if (isBlank) {
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

// 도형 SVG — 6종 좌표 룩업 + 변 길이/각도/대각선/꼭짓점 라벨
// params: { shape, showRightAngles, sideLengths:["6cm","4cm",...], angleLabels:["60°",...],
//           vertexLabels:["A","B","C","D"], showDiagonals, showHeight, areaText }
export function svgShape({ shape, showRightAngles = true, sideLengths = [], angleLabels = [],
  vertexLabels = [], showDiagonals = false, showHeight = false, areaText = "" } = {}) {
  const W = 240, H = 200;
  const font = 'font-family="Spoqa Han Sans Neo,sans-serif"';
  const shapes = {
    "직사각형": { pts: [[40,40],[200,40],[200,150],[40,150]], rightAngles: [[40,40],[200,40],[200,150],[40,150]] },
    "정사각형": { pts: [[50,30],[180,30],[180,160],[50,160]], rightAngles: [[50,30],[180,30],[180,160],[50,160]] },
    "직각삼각형": { pts: [[40,160],[200,160],[40,40]], rightAngles: [[40,160]] },
    "마름모": { pts: [[120,25],[210,90],[120,155],[30,90]], rightAngles: [] },
    "평행사변형": { pts: [[60,40],[210,40],[180,150],[30,150]], rightAngles: [] },
    "정삼각형": { pts: [[120,30],[210,160],[30,160]], rightAngles: [] },
    "사다리꼴": { pts: [[70,40],[170,40],[210,150],[30,150]], rightAngles: [] },
    "오각형": { pts: [[120,25],[205,70],[175,160],[65,160],[35,70]], rightAngles: [] },
    "육각형": { pts: [[120,25],[195,60],[195,130],[120,165],[45,130],[45,60]], rightAngles: [] },
  };

  const s = shapes[shape];
  if (!s) return "";
  const pts = s.pts;

  const ptStr = pts.map(p => p.join(",")).join(" ");
  let els = [];
  els.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#ffffff"/>`);
  els.push(`<polygon points="${ptStr}" fill="#E8F4FD" stroke="#2196F3" stroke-width="2.5" stroke-linejoin="round"/>`);

  // 직각 마커
  if (showRightAngles && s.rightAngles.length > 0) {
    s.rightAngles.forEach(([cx, cy]) => {
      const idx = pts.findIndex(p => p[0] === cx && p[1] === cy);
      if (idx === -1) return;
      const prev = pts[(idx - 1 + pts.length) % pts.length];
      const next = pts[(idx + 1) % pts.length];
      const sz = 12;
      const dx1 = Math.sign(prev[0] - cx), dy1 = Math.sign(prev[1] - cy);
      const dx2 = Math.sign(next[0] - cx), dy2 = Math.sign(next[1] - cy);
      const p1 = [cx + dx1 * sz, cy + dy1 * sz];
      const p2 = [cx + dx1 * sz + dx2 * sz, cy + dy1 * sz + dy2 * sz];
      const p3 = [cx + dx2 * sz, cy + dy2 * sz];
      els.push(`<polyline points="${p1.join(",")},${p2.join(",")},${p3.join(",")}" fill="none" stroke="#F44336" stroke-width="1.5"/>`);
    });
  }

  // 변 길이 라벨
  if (sideLengths.length > 0) {
    for (let i = 0; i < Math.min(sideLengths.length, pts.length); i++) {
      if (!sideLengths[i]) continue;
      const [ax, ay] = pts[i];
      const [bx, by] = pts[(i + 1) % pts.length];
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      const dx = bx - ax, dy = by - ay;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len * 14, ny = dx / len * 14;
      els.push(`<text x="${(mx + nx).toFixed(1)}" y="${(my + ny + 4).toFixed(1)}" text-anchor="middle" ${font} font-size="12" font-weight="600" fill="#8E44AD">${sideLengths[i]}</text>`);
    }
  }

  // 꼭짓점 라벨
  if (vertexLabels.length > 0) {
    const cxShape = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cyShape = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    for (let i = 0; i < Math.min(vertexLabels.length, pts.length); i++) {
      if (!vertexLabels[i]) continue;
      const [px, py] = pts[i];
      const dx = px - cxShape, dy = py - cyShape;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const ox = dx / dist * 16, oy = dy / dist * 16;
      els.push(`<text x="${(px + ox).toFixed(1)}" y="${(py + oy + 4).toFixed(1)}" text-anchor="middle" ${font} font-size="13" font-weight="700" fill="#1A5276">${vertexLabels[i]}</text>`);
    }
  }

  // 각도 라벨
  if (angleLabels.length > 0) {
    for (let i = 0; i < Math.min(angleLabels.length, pts.length); i++) {
      if (!angleLabels[i]) continue;
      const [px, py] = pts[i];
      const prev = pts[(i - 1 + pts.length) % pts.length];
      const next = pts[(i + 1) % pts.length];
      const midx = (prev[0] + next[0]) / 2, midy = (prev[1] + next[1]) / 2;
      const dx = midx - px, dy = midy - py;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const lx = px + dx / dist * 22, ly = py + dy / dist * 22;
      els.push(`<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle" ${font} font-size="10" fill="#E67E22">${angleLabels[i]}</text>`);
    }
  }

  // 대각선
  if (showDiagonals && pts.length >= 4) {
    els.push(`<line x1="${pts[0][0]}" y1="${pts[0][1]}" x2="${pts[2][0]}" y2="${pts[2][1]}" stroke="#E74C3C" stroke-width="1.5" stroke-dasharray="5,3"/>`);
    if (pts.length >= 5) {
      els.push(`<line x1="${pts[1][0]}" y1="${pts[1][1]}" x2="${pts[3][0]}" y2="${pts[3][1]}" stroke="#E74C3C" stroke-width="1.5" stroke-dasharray="5,3"/>`);
    }
  }

  // 높이선
  if (showHeight) {
    // 밑변: pts 중 가장 아래 두 점 → 그 위 꼭짓점에서 수선
    const bottomY = Math.max(...pts.map(p => p[1]));
    const topPt = pts.reduce((a, b) => a[1] < b[1] ? a : b);
    const footX = topPt[0], footY = bottomY;
    els.push(`<line x1="${topPt[0]}" y1="${topPt[1]}" x2="${footX}" y2="${footY}" stroke="#27AE60" stroke-width="1.5" stroke-dasharray="4,2"/>`);
    // 직각 마커
    els.push(`<path d="M${footX+8},${footY} L${footX+8},${footY-8} L${footX},${footY-8}" fill="none" stroke="#27AE60" stroke-width="1"/>`);
    els.push(`<text x="${footX+12}" y="${(topPt[1]+footY)/2+4}" ${font} font-size="11" fill="#27AE60">h</text>`);
  }

  // 넓이 텍스트
  if (areaText) {
    const cxS = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cyS = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    els.push(`<text x="${cxS}" y="${cyS + 4}" text-anchor="middle" ${font} font-size="11" fill="#555">${areaText}</text>`);
  }

  // 도형명 라벨
  els.push(`<text x="${W / 2}" y="${H - 3}" text-anchor="middle" ${font} font-size="12" fill="#636e72">${shape}</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;display:block">${els.join("")}</svg>`;
}

// 나눗셈 묶음 SVG
// params: { total, groupSize, itemShape:"circle"|"star"|"square", itemColor, groupLabel }
export function svgGrouping({ total, groupSize, itemShape = "circle", itemColor = "#FFE0B2", groupLabel = "" }) {
  const groups = Math.ceil(total / groupSize);
  const cols = groupSize <= 5 ? groupSize : Math.ceil(Math.sqrt(groupSize));
  const rows = Math.ceil(groupSize / cols);
  const circR = 10, gap = 28, gGap = 20, pad = 16;
  const gW = cols * gap + 12, gH = rows * gap + 12;
  const W = groups * (gW + gGap) - gGap + pad * 2;
  const H = gH + pad * 2 + 28;

  let els = [];
  els.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#ffffff"/>`);

  let count = 0;
  for (let g = 0; g < groups; g++) {
    const gx = pad + g * (gW + gGap);
    const gy = pad;
    const itemsInGroup = Math.min(groupSize, total - count);

    // 그룹 박스
    els.push(`<rect x="${gx}" y="${gy}" width="${gW}" height="${gH}" rx="8" fill="none" stroke="#FF9800" stroke-width="1.5" stroke-dasharray="5,3"/>`);

    // 아이템
    for (let i = 0; i < itemsInGroup; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      const ix = gx + 18 + c * gap, iy = gy + 18 + r * gap;
      if (itemShape === "square") {
        els.push(`<rect x="${ix-circR}" y="${iy-circR}" width="${circR*2}" height="${circR*2}" rx="2" fill="${itemColor}" stroke="#F57C00" stroke-width="1.5"/>`);
      } else if (itemShape === "star") {
        const sr = circR, pts5 = [];
        for (let k = 0; k < 10; k++) {
          const a = Math.PI / 2 + k * Math.PI / 5;
          const rd = k % 2 === 0 ? sr : sr * 0.45;
          pts5.push(`${(ix + rd * Math.cos(a)).toFixed(1)},${(iy - rd * Math.sin(a)).toFixed(1)}`);
        }
        els.push(`<polygon points="${pts5.join(" ")}" fill="${itemColor}" stroke="#F57C00" stroke-width="1"/>`);
      } else {
        els.push(`<circle cx="${ix}" cy="${iy}" r="${circR}" fill="${itemColor}" stroke="#F57C00" stroke-width="1.5"/>`);
      }
      count++;
    }

    // 그룹 라벨
    els.push(`<text x="${gx + gW / 2}" y="${gy + gH + 16}" text-anchor="middle" font-family="Spoqa Han Sans Neo,sans-serif" font-size="11" fill="#636e72">${groupLabel || (itemsInGroup + "개")}</text>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:${Math.min(W, 500)}px;display:block">${els.join("")}</svg>`;
}

// 수직선 SVG (구간 색칠, 점프 화살표, 커스텀 라벨 지원)
// params: { min, max, step, marks, highlights,
//           ranges:[{from,to,color}], ← 구간 색칠
//           jumps:[{from,to,label,color}], ← 점프 화살표
//           labels:[{at,text}] } ← 커스텀 위치 라벨
export function svgNumberLine({ min = 0, max = 1000, step = 100, marks = [], highlights = [],
  ranges = [], jumps = [], labels = [] }) {
  const W = 420, H = 80, padX = 30, lineY = 35;
  const lineW = W - padX * 2;

  function xPos(v) { return padX + ((v - min) / (max - min)) * lineW; }

  let els = [];
  els.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#ffffff"/>`);

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

  // 구간 색칠 (ranges)
  ranges.forEach(({ from, to, color = "rgba(52,152,219,0.25)" }) => {
    const x1r = xPos(Math.max(from, min)), x2r = xPos(Math.min(to, max));
    els.push(`<rect x="${x1r}" y="${lineY - 8}" width="${x2r - x1r}" height="16" fill="${color}" rx="2"/>`);
  });

  // 점프 화살표 (jumps)
  jumps.forEach(({ from: jf, to: jt, label: jl = "", color: jc = "#8E44AD" }) => {
    const x1j = xPos(jf), x2j = xPos(jt);
    const arcY = lineY - 20;
    const midX = (x1j + x2j) / 2;
    els.push(`<path d="M${x1j},${lineY - 4} Q${midX},${arcY - 10} ${x2j},${lineY - 4}" fill="none" stroke="${jc}" stroke-width="1.5" marker-end="url(#arrowJ)"/>`);
    if (jl) els.push(`<text x="${midX}" y="${arcY - 8}" text-anchor="middle" font-family="Spoqa Han Sans Neo,sans-serif" font-size="9" fill="${jc}">${jl}</text>`);
  });
  // 화살표 마커 (jumps가 있을 때만)
  if (jumps.length > 0) {
    els.unshift(`<defs><marker id="arrowJ" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0,0 8,3 0,6" fill="#8E44AD"/></marker></defs>`);
  }

  // 커스텀 라벨 (labels)
  labels.forEach(({ at, text: lt }) => {
    const xl = xPos(at);
    els.push(`<text x="${xl}" y="${lineY + 32}" text-anchor="middle" font-family="Spoqa Han Sans Neo,sans-serif" font-size="10" fill="#E67E22" font-weight="600">${lt}</text>`);
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;display:block">${els.join("")}</svg>`;
}

// 십진 블록 (Base-10) SVG — 받아올림/받아내림 시각화
// 백의 자리=판(flat), 십의 자리=막대(rod), 일의 자리=큐브(cube)
export function svgBase10Blocks({ a, b, op = "+", result }) {
  const res = result != null ? result : (op === "+" ? a + b : a - b);

  function decompose(n) {
    return { h: Math.floor(n / 100), t: Math.floor((n % 100) / 10), o: n % 10 };
  }

  const dA = decompose(a), dB = decompose(b), dR = decompose(res);
  const blockSize = 8, gap = 2;
  const flatW = blockSize * 10 + gap * 9, flatH = blockSize * 10 + gap * 9;
  const rodW = blockSize, rodH = blockSize * 10 + gap * 9;
  const cubeW = blockSize, cubeH = blockSize;

  // 레이아웃 계산
  const sectionPad = 16, rowH = 70, labelW = 50;
  const colFlat = labelW, colRod = labelW + 120, colCube = labelW + 200;
  const W = 300, H = rowH * 3 + sectionPad * 2 + 30;

  let els = [];
  els.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#ffffff"/>`);

  // 헤더
  els.push(`<text x="${colFlat + 30}" y="16" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#999">백</text>`);
  els.push(`<text x="${colRod + 20}" y="16" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#999">십</text>`);
  els.push(`<text x="${colCube + 20}" y="16" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#999">일</text>`);

  function drawRow(d, yBase, label, color) {
    // 라벨
    els.push(`<text x="8" y="${yBase + 35}" font-family="Spoqa Han Sans Neo,sans-serif" font-size="14" fill="#333" font-weight="600">${label}</text>`);

    // 백의 자리 — 판 (10x10 그리드, 축소)
    for (let i = 0; i < Math.min(d.h, 5); i++) {
      const sx = colFlat + i * 22;
      els.push(`<rect x="${sx}" y="${yBase + 8}" width="18" height="18" rx="2" fill="${color}" stroke="#fff" stroke-width="0.5"/>`);
      // 10x10 패턴 (미니)
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        els.push(`<rect x="${sx + 2 + c * 5}" y="${yBase + 10 + r * 5}" width="4" height="4" rx="0.5" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.3"/>`);
      }
    }

    // 십의 자리 — 막대
    for (let i = 0; i < Math.min(d.t, 9); i++) {
      const sx = colRod + i * 7;
      els.push(`<rect x="${sx}" y="${yBase + 4}" width="5" height="28" rx="1" fill="${color}" stroke="#fff" stroke-width="0.3"/>`);
    }

    // 일의 자리 — 큐브
    for (let i = 0; i < Math.min(d.o, 9); i++) {
      const sx = colCube + (i % 5) * 9;
      const sy = yBase + 8 + Math.floor(i / 5) * 9;
      els.push(`<rect x="${sx}" y="${sy}" width="7" height="7" rx="1" fill="${color}" stroke="#fff" stroke-width="0.3"/>`);
    }

    // 숫자 표시
    els.push(`<text x="${colFlat + 30}" y="${yBase + 50}" text-anchor="middle" font-family="monospace" font-size="11" fill="#666">${d.h}</text>`);
    els.push(`<text x="${colRod + 20}" y="${yBase + 50}" text-anchor="middle" font-family="monospace" font-size="11" fill="#666">${d.t}</text>`);
    els.push(`<text x="${colCube + 20}" y="${yBase + 50}" text-anchor="middle" font-family="monospace" font-size="11" fill="#666">${d.o}</text>`);
  }

  drawRow(dA, 22, String(a), "#4A90D9");
  // 연산자
  els.push(`<text x="20" y="${22 + rowH + 35}" font-family="sans-serif" font-size="18" fill="#6c5ce7" font-weight="700">${op === "+" ? "+" : "−"}</text>`);
  drawRow(dB, 22 + rowH, String(b), "#F5A623");
  // 구분선
  const lineY = 22 + rowH * 2 + 2;
  els.push(`<line x1="${labelW - 10}" y1="${lineY}" x2="${W - 10}" y2="${lineY}" stroke="#333" stroke-width="1.5"/>`);
  drawRow(dR, 22 + rowH * 2 + 8, String(res), "#27AE60");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;display:block">${els.join("")}</svg>`;
}

// 상황 일러스트 SVG — art-assets 에셋 참조 + 상황 문구
export function svgContextIllust({ illustPath, contextText, count }) {
  const W = 320, H = 100;
  let els = [];
  els.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="10" fill="#f0f7ff" stroke="#d0e3f7" stroke-width="1"/>`);

  // 일러스트 이미지 (있으면)
  if (illustPath) {
    els.push(`<image href="${illustPath}" x="12" y="12" width="60" height="60" preserveAspectRatio="xMidYMid meet"/>`);
  }

  // 상황 텍스트
  const tx = illustPath ? 84 : 16;
  if (contextText) {
    // 텍스트 줄바꿈 처리 (40자 기준)
    const lines = [];
    let remaining = contextText;
    while (remaining.length > 0) {
      if (remaining.length <= 28) { lines.push(remaining); break; }
      let cut = remaining.lastIndexOf(' ', 28);
      if (cut <= 0) cut = 28;
      lines.push(remaining.substring(0, cut));
      remaining = remaining.substring(cut).trim();
    }
    lines.forEach((line, i) => {
      els.push(`<text x="${tx}" y="${30 + i * 20}" font-family="Spoqa Han Sans Neo,sans-serif" font-size="13" fill="#333">${line}</text>`);
    });
  }

  // 개수 뱃지 (있으면)
  if (count != null) {
    els.push(`<rect x="${W - 60}" y="10" width="48" height="24" rx="12" fill="#6c5ce7"/>`);
    els.push(`<text x="${W - 36}" y="27" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#fff" font-weight="600">${count}개</text>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;display:block">${els.join("")}</svg>`;
}

// ─────────────────────────────────────────────
// 중·고등 수학 문항용 SVG 생성기
// ─────────────────────────────────────────────

// 라벨이 있는 삼각형 SVG (꼭짓점·변의 길이·각도·높이선·중점 표시)
// params: { vertices, sides, angles, type, highlight,
//           showAltitude:boolean, ← 높이선 표시
//           showMedian:boolean,   ← 중선 표시
//           midpoints:[0,1,2] }   ← 변의 중점 마커 (변 인덱스)
export function svgLabeledTriangle({ vertices = ["A","B","C"], sides = [], angles = [], type = "general", highlight = [],
  showAltitude = false, showMedian = false, midpoints = [] } = {}) {
  const W = 260, H = 220, pad = 36;
  // 기본 좌표 (type별 배치)
  const presets = {
    general:     [[pad+20, H-pad], [W-pad, H-pad], [pad+70, pad+10]],
    right:       [[pad, H-pad], [W-pad-10, H-pad], [pad, pad+20]],
    isosceles:   [[W/2, pad+10], [pad+10, H-pad], [W-pad-10, H-pad]],
    equilateral: [[W/2, pad+10], [pad+20, H-pad], [W-pad-20, H-pad]],
  };
  const pts = presets[type] || presets.general;
  const vLabels = (typeof vertices[0] === "string") ? vertices : vertices.map(v => v.label || "");

  const font = 'font-family="Spoqa Han Sans Neo,sans-serif"';
  let els = [];
  els.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#fff"/>`);

  // 삼각형 면 (연한 파랑)
  const ptStr = pts.map(p => p.join(",")).join(" ");
  els.push(`<polygon points="${ptStr}" fill="#EBF5FB" stroke="#2980B9" stroke-width="2.2" stroke-linejoin="round"/>`);

  // 직각 마커
  if (type === "right") {
    const [cx, cy] = pts[0]; // A가 직각
    const sz = 12;
    els.push(`<path d="M${cx+sz},${cy} L${cx+sz},${cy-sz} L${cx},${cy-sz}" fill="none" stroke="#E74C3C" stroke-width="1.5"/>`);
  }

  // 등변 마커 (이등변)
  if (type === "isosceles" || type === "equilateral") {
    [[0,2],[1,2]].forEach(([i,j]) => {
      const mx = (pts[i][0]+pts[j][0])/2, my = (pts[i][1]+pts[j][1])/2;
      const dx = pts[j][0]-pts[i][0], dy = pts[j][1]-pts[i][1];
      const len = Math.sqrt(dx*dx+dy*dy);
      const nx = -dy/len*6, ny = dx/len*6;
      els.push(`<line x1="${mx-nx}" y1="${my-ny}" x2="${mx+nx}" y2="${my+ny}" stroke="#27AE60" stroke-width="2"/>`);
    });
  }

  // 변 길이 라벨
  const sideMids = [[0,1],[1,2],[2,0]];
  sides.slice(0,3).forEach((s, i) => {
    if (!s || !s.value) return;
    const [ai, bi] = sideMids[i];
    const mx = (pts[ai][0]+pts[bi][0])/2, my = (pts[ai][1]+pts[bi][1])/2;
    const dx = pts[bi][0]-pts[ai][0], dy = pts[bi][1]-pts[ai][1];
    const len = Math.sqrt(dx*dx+dy*dy);
    const nx = -dy/len*14, ny = dx/len*14;
    els.push(`<text x="${mx+nx}" y="${my+ny+4}" text-anchor="middle" ${font} font-size="12" fill="#8E44AD">${s.value}</text>`);
  });

  // 각도 라벨
  angles.slice(0,3).forEach((ang, i) => {
    if (!ang || !ang.mark) return;
    const [px, py] = pts[i];
    const offsets = [[-8,14],[14,10],[8,10]];
    const [ox, oy] = offsets[i] || [0, 0];
    if (ang.mark === "right") {
      // 직각 표시는 이미 위에서
    } else {
      els.push(`<text x="${px+ox}" y="${py+oy}" text-anchor="middle" ${font} font-size="11" fill="#E67E22">${ang.mark}°</text>`);
    }
  });

  // 꼭짓점 라벨
  const labelOffsets = [[-14, 14], [14, 14], [0, -8]];
  vLabels.slice(0, 3).forEach((lbl, i) => {
    const [px, py] = pts[i];
    const [ox, oy] = labelOffsets[i] || [0, 0];
    els.push(`<text x="${px+ox}" y="${py+oy}" text-anchor="middle" ${font} font-size="14" font-weight="700" fill="#1A5276">${lbl}</text>`);
  });

  // 높이선 (꼭짓점 C에서 밑변 AB로)
  if (showAltitude) {
    const [ax, ay] = pts[0], [bx, by] = pts[1], [cx, cy2] = pts[2];
    const dx = bx - ax, dy = by - ay;
    const t = ((cx - ax) * dx + (cy2 - ay) * dy) / (dx * dx + dy * dy);
    const fx = ax + t * dx, fy = ay + t * dy;
    els.push(`<line x1="${cx}" y1="${cy2}" x2="${fx.toFixed(1)}" y2="${fy.toFixed(1)}" stroke="#27AE60" stroke-width="1.5" stroke-dasharray="5,3"/>`);
    els.push(`<path d="M${fx+8},${fy} L${fx+8},${fy-8} L${fx},${fy-8}" fill="none" stroke="#27AE60" stroke-width="1"/>`);
    els.push(`<text x="${(cx+fx)/2+8}" y="${(cy2+fy)/2}" ${font} font-size="10" fill="#27AE60">h</text>`);
  }

  // 중선 (꼭짓점 C에서 밑변 AB의 중점으로)
  if (showMedian) {
    const [ax, ay] = pts[0], [bx, by] = pts[1], [cx, cy2] = pts[2];
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    els.push(`<line x1="${cx}" y1="${cy2}" x2="${mx}" y2="${my}" stroke="#F39C12" stroke-width="1.5" stroke-dasharray="4,2"/>`);
    els.push(`<circle cx="${mx}" cy="${my}" r="3" fill="#F39C12"/>`);
    els.push(`<text x="${mx+6}" y="${my-4}" ${font} font-size="9" fill="#F39C12">M</text>`);
  }

  // 변의 중점 마커
  const sidePairs = [[0,1],[1,2],[2,0]];
  midpoints.forEach(si => {
    if (si >= 0 && si < sidePairs.length) {
      const [ai, bi] = sidePairs[si];
      const mx = (pts[ai][0] + pts[bi][0]) / 2, my = (pts[ai][1] + pts[bi][1]) / 2;
      els.push(`<circle cx="${mx}" cy="${my}" r="3" fill="#E67E22"/>`);
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;display:block">${els.join("")}</svg>`;
}

// 좌표평면 SVG (점·선·함수곡선·영역 선택적 표시)
// params: { xMin, xMax, yMin, yMax, points:[{x,y,label,color}],
//           lines:[{x1,y1,x2,y2,color}], showGrid:true,
//           curves:[{fn:"x*x", color, dash}], ← JS 수식 문자열 (x 변수)
//           regions:[{fn:"x*x", above:true, color}], ← 영역 색칠
//           helpers:[{type:"vline"|"hline", at, color, dash}] } ← 보조선
export function svgCoordinatePlane({ xMin = -5, xMax = 5, yMin = -5, yMax = 5, points = [], lines = [], showGrid = true,
  curves = [], regions = [], helpers = [] } = {}) {
  const W = 280, H = 260, pad = 30;
  const gW = W - pad*2, gH = H - pad*2;

  function sx(v) { return pad + (v - xMin) / (xMax - xMin) * gW; }
  function sy(v) { return H - pad - (v - yMin) / (yMax - yMin) * gH; }

  const font = 'font-family="Spoqa Han Sans Neo,sans-serif"';
  let els = [];
  els.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#fff"/>`);

  // 그리드
  if (showGrid) {
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      const xi = sx(x);
      els.push(`<line x1="${xi}" y1="${pad}" x2="${xi}" y2="${H-pad}" stroke="#E8E8E8" stroke-width="${x===0?0:0.8}"/>`);
    }
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
      const yi = sy(y);
      els.push(`<line x1="${pad}" y1="${yi}" x2="${W-pad}" y2="${yi}" stroke="#E8E8E8" stroke-width="${y===0?0:0.8}"/>`);
    }
  }

  // 축
  const ox = sx(0), oy = sy(0);
  if (ox >= pad && ox <= W-pad) {
    els.push(`<line x1="${ox}" y1="${pad-6}" x2="${ox}" y2="${H-pad+6}" stroke="#333" stroke-width="1.8"/>`);
    els.push(`<polygon points="${ox},${pad-10} ${ox-4},${pad-2} ${ox+4},${pad-2}" fill="#333"/>`);
    els.push(`<text x="${ox+6}" y="${pad-6}" ${font} font-size="11" fill="#333">y</text>`);
  }
  if (oy >= pad && oy <= H-pad) {
    els.push(`<line x1="${pad-6}" y1="${oy}" x2="${W-pad+6}" y2="${oy}" stroke="#333" stroke-width="1.8"/>`);
    els.push(`<polygon points="${W-pad+10},${oy} ${W-pad+2},${oy-4} ${W-pad+2},${oy+4}" fill="#333"/>`);
    els.push(`<text x="${W-pad+8}" y="${oy+4}" ${font} font-size="11" fill="#333">x</text>`);
  }

  // 눈금 라벨
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
    if (x === 0) continue;
    els.push(`<text x="${sx(x)}" y="${oy+14}" text-anchor="middle" ${font} font-size="9" fill="#888">${x}</text>`);
    els.push(`<line x1="${sx(x)}" y1="${oy-3}" x2="${sx(x)}" y2="${oy+3}" stroke="#555" stroke-width="1"/>`);
  }
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
    if (y === 0) continue;
    els.push(`<text x="${ox-8}" y="${sy(y)+4}" text-anchor="end" ${font} font-size="9" fill="#888">${y}</text>`);
    els.push(`<line x1="${ox-3}" y1="${sy(y)}" x2="${ox+3}" y2="${sy(y)}" stroke="#555" stroke-width="1"/>`);
  }
  els.push(`<text x="${ox-8}" y="${oy+14}" text-anchor="end" ${font} font-size="9" fill="#888">O</text>`);

  // 선분
  lines.forEach(({ x1, y1, x2, y2, color = "#2980B9" }) => {
    const sx1 = sx(x1), sy1 = sy(y1), sx2 = sx(x2), sy2 = sy(y2);
    els.push(`<line x1="${sx1}" y1="${sy1}" x2="${sx2}" y2="${sy2}" stroke="${color}" stroke-width="1.8" stroke-dasharray="none"/>`);
  });

  // ── 함수 곡선 (curves) ──
  curves.forEach(({ fn: fnStr, color: cColor = "#E74C3C", dash = false, label = "" }) => {
    try {
      const evalFn = new Function("x", `return (${fnStr});`);
      const step = (xMax - xMin) / 100;
      let path = "";
      for (let xv = xMin; xv <= xMax; xv += step) {
        const yv = evalFn(xv);
        if (isNaN(yv) || !isFinite(yv) || yv < yMin - 5 || yv > yMax + 5) continue;
        const px = sx(xv), py = sy(yv);
        if (py < pad - 10 || py > H - pad + 10) continue;
        path += (path ? "L" : "M") + `${px.toFixed(1)},${py.toFixed(1)}`;
      }
      if (path) {
        els.push(`<path d="${path}" fill="none" stroke="${cColor}" stroke-width="2" ${dash ? 'stroke-dasharray="6,3"' : ""}/>`);
        if (label) {
          const lx = sx((xMin + xMax) * 0.7);
          const ly = sy(evalFn((xMin + xMax) * 0.7));
          if (!isNaN(ly)) els.push(`<text x="${lx+6}" y="${ly-6}" ${font} font-size="10" fill="${cColor}">${label}</text>`);
        }
      }
    } catch(_) { /* 수식 파싱 실패 무시 */ }
  });

  // ── 영역 색칠 (regions) ──
  regions.forEach(({ fn: rFn, above = true, color: rColor = "rgba(52,152,219,0.15)" }) => {
    try {
      const evalFn = new Function("x", `return (${rFn});`);
      const step = (xMax - xMin) / 80;
      let pathD = `M${pad},${above ? pad : H-pad}`;
      for (let xv = xMin; xv <= xMax; xv += step) {
        const yv = evalFn(xv);
        if (isNaN(yv) || !isFinite(yv)) continue;
        const px = sx(xv), py = Math.max(pad, Math.min(H - pad, sy(yv)));
        pathD += ` L${px.toFixed(1)},${py.toFixed(1)}`;
      }
      pathD += ` L${W-pad},${above ? pad : H-pad} Z`;
      els.push(`<path d="${pathD}" fill="${rColor}" stroke="none"/>`);
    } catch(_) {}
  });

  // ── 보조선 (helpers) ──
  helpers.forEach(({ type: hType, at, color: hColor = "#999", dash: hDash = true }) => {
    const dashArr = hDash ? 'stroke-dasharray="4,3"' : "";
    if (hType === "vline") {
      const hx = sx(at);
      els.push(`<line x1="${hx}" y1="${pad}" x2="${hx}" y2="${H-pad}" stroke="${hColor}" stroke-width="1" ${dashArr}/>`);
    } else if (hType === "hline") {
      const hy = sy(at);
      els.push(`<line x1="${pad}" y1="${hy}" x2="${W-pad}" y2="${hy}" stroke="${hColor}" stroke-width="1" ${dashArr}/>`);
    }
  });

  // 점
  points.forEach(({ x, y, label = "", color = "#E74C3C" }) => {
    const px = sx(x), py = sy(y);
    els.push(`<circle cx="${px}" cy="${py}" r="4" fill="${color}" stroke="#fff" stroke-width="1.2"/>`);
    if (label) {
      els.push(`<text x="${px+7}" y="${py-5}" ${font} font-size="11" fill="${color}" font-weight="600">${label}</text>`);
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;display:block">${els.join("")}</svg>`;
}

// 분수 막대 SVG (이중 비교, 빈칸 지원)
// params: { numerator, denominator, color, showMixed, wholeNumber,
//           compare:{numerator,denominator,color}, ← 비교용 두 번째 막대
//           blankCells:[인덱스,...] } ← "?" 표시할 칸
export function svgFractionBar({ numerator = 1, denominator = 4, color = "#3498DB", showMixed = false, wholeNumber = 0,
  compare = null, blankCells = [] } = {}) {
  const cellW = Math.min(40, 300 / denominator), cellH = 36, pad = 16;
  const totalCells = denominator;
  const W = cellW * totalCells + pad*2 + (showMixed && wholeNumber > 0 ? 40 : 0);
  const H = cellH + pad*2 + 20;
  const offsetX = showMixed && wholeNumber > 0 ? 40 : 0;

  const font = 'font-family="Spoqa Han Sans Neo,sans-serif"';
  let els = [];
  els.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#fff"/>`);

  // 정수 부분
  if (showMixed && wholeNumber > 0) {
    els.push(`<text x="20" y="${pad + cellH/2 + 6}" text-anchor="middle" ${font} font-size="22" font-weight="700" fill="#2C3E50">${wholeNumber}</text>`);
  }

  // 분수 막대 칸 (+ 빈칸 지원)
  for (let i = 0; i < totalCells; i++) {
    const x = pad + offsetX + i * cellW;
    const filled = i < numerator;
    const isBlank = blankCells.includes(i);
    els.push(`<rect x="${x}" y="${pad}" width="${cellW}" height="${cellH}" fill="${isBlank ? "#FEF9E7" : filled ? color : "#ECF0F1"}" stroke="${isBlank ? "#E67E22" : "#BDC3C7"}" stroke-width="${isBlank ? 2 : 1.2}" ${isBlank ? 'stroke-dasharray="4,2"' : ""} rx="${i===0?4:0}"/>`);
    if (isBlank) {
      els.push(`<text x="${x + cellW/2}" y="${pad + cellH/2 + 5}" text-anchor="middle" ${font} font-size="14" fill="#E67E22" font-weight="700">?</text>`);
    }
  }

  // 분수 라벨
  els.push(`<text x="${pad + offsetX + totalCells*cellW/2}" y="${H - (compare ? 24 : 4)}" text-anchor="middle" ${font} font-size="12" fill="#7F8C8D">${numerator}/${denominator}</text>`);

  // 비교용 두 번째 막대
  if (compare) {
    const c = compare;
    const cDenom = c.denominator || 4, cNum = c.numerator || 1;
    const cColor = c.color || "#E74C3C";
    const cCellW = Math.min(40, 300 / cDenom);
    const y2 = pad + cellH + 12;
    for (let i = 0; i < cDenom; i++) {
      const x = pad + offsetX + i * cCellW;
      els.push(`<rect x="${x}" y="${y2}" width="${cCellW}" height="${cellH}" fill="${i < cNum ? cColor : "#ECF0F1"}" stroke="#BDC3C7" stroke-width="1.2" rx="${i===0?4:0}"/>`);
    }
    els.push(`<text x="${pad + offsetX + cDenom*cCellW/2}" y="${H-4}" text-anchor="middle" ${font} font-size="12" fill="#7F8C8D">${cNum}/${cDenom}</text>`);
  }

  const totalH = compare ? pad * 2 + cellH * 2 + 36 : H;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${totalH}" style="max-width:${Math.max(W,160)}px;display:block">${els.join("")}</svg>`;
}

// 데이터 표(Table) SVG
// params: { headers, rows, title, highlight,
//           blankCells:[[row,col],...] } ← "?" 표시할 셀 좌표
export function svgDataTable({ headers = [], rows = [], title = "", highlight = [], blankCells = [] } = {}) {
  const cols = Math.max(headers.length, rows[0]?.length || 0);
  const cellW = Math.max(52, 300 / cols), cellH = 32, headH = 34;
  const W = cellW * cols + 2, H = headH + cellH * rows.length + (title ? 24 : 4) + 4;
  const font = 'font-family="Spoqa Han Sans Neo,sans-serif"';
  let els = [];
  els.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#fff" stroke="#D5D8DC" stroke-width="1"/>`);

  let yOff = title ? 24 : 4;
  if (title) {
    els.push(`<text x="${W/2}" y="17" text-anchor="middle" ${font} font-size="12" font-weight="600" fill="#555">${title}</text>`);
  }

  // 헤더
  headers.forEach((h, i) => {
    const x = 1 + i * cellW;
    els.push(`<rect x="${x}" y="${yOff}" width="${cellW}" height="${headH}" fill="#2C3E50"/>`);
    els.push(`<text x="${x + cellW/2}" y="${yOff + headH/2 + 5}" text-anchor="middle" ${font} font-size="13" font-weight="700" fill="#fff">${h}</text>`);
  });

  // 행
  rows.forEach((row, ri) => {
    const y = yOff + headH + ri * cellH;
    const isHL = highlight.includes(ri);
    row.forEach((cell, ci) => {
      const x = 1 + ci * cellW;
      const isBlank = blankCells.some(([br, bc]) => br === ri && bc === ci);
      els.push(`<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="${isBlank ? "#FEF9E7" : isHL ? "#FEF9E7" : ri%2===0?"#FDFEFE":"#F2F3F4"}" stroke="${isBlank ? "#E67E22" : "#D5D8DC"}" stroke-width="${isBlank ? 1.5 : 0.7}"/>`);
      if (isBlank) {
        els.push(`<text x="${x + cellW/2}" y="${y + cellH/2 + 5}" text-anchor="middle" ${font} font-size="14" fill="#E67E22" font-weight="700">?</text>`);
      } else {
        els.push(`<text x="${x + cellW/2}" y="${y + cellH/2 + 5}" text-anchor="middle" ${font} font-size="13" fill="${isHL?"#884EA0":"#2C3E50"}">${cell}</text>`);
      }
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;display:block">${els.join("")}</svg>`;
}

// 막대그래프 SVG (다중 계열, 가로형 지원)
// params: { labels, values, title, yLabel, color, maxVal,
//           series:[{label,values:[],color}], ← 다중 계열 (values 대신)
//           horizontal:boolean }
export function svgBarChart({ labels = [], values = [], title = "", yLabel = "", color = "#3498DB", maxVal,
  series = [], horizontal = false } = {}) {
  // 다중 계열이면 series 사용, 아니면 단일 계열로 변환
  const allSeries = series.length > 0 ? series : [{ label: "", values: values, color: color }];
  const seriesCount = allSeries.length;
  const n = labels.length, barW = Math.min(44 / seriesCount, 260/n/seriesCount), gap = 8 + (seriesCount > 1 ? 4 : 0);
  const padL = 40, padR = 16, padT = title ? 36 : 16, padB = 40 + (seriesCount > 1 ? 16 : 0);
  const groupW = barW * seriesCount + (seriesCount > 1 ? 2 * (seriesCount - 1) : 0);
  const W = padL + n * (groupW + gap) - gap + padR;
  const chartH = 140;
  const H = padT + chartH + padB;
  const allVals = allSeries.flatMap(s => s.values || []);
  const mx = maxVal || Math.max(...allVals, 1) * 1.2;
  const font = 'font-family="Spoqa Han Sans Neo,sans-serif"';

  // ── 가로형 막대 (horizontal) ──
  if (horizontal) {
    const hBarH = Math.min(28, 200 / n);
    const hGap = 6;
    const hPadL = 60, hPadR = 30, hPadT = title ? 36 : 16, hPadB = 24;
    const hChartW = 200;
    const hW = hPadL + hChartW + hPadR;
    const hH = hPadT + n * (hBarH + hGap) - hGap + hPadB;
    const hEls = [];
    hEls.push(`<rect x="0" y="0" width="${hW}" height="${hH}" rx="8" fill="#fff"/>`);
    if (title) hEls.push(`<text x="${hW/2}" y="20" text-anchor="middle" ${font} font-size="13" font-weight="600" fill="#2C3E50">${title}</text>`);
    // y축
    hEls.push(`<line x1="${hPadL}" y1="${hPadT}" x2="${hPadL}" y2="${hH-hPadB}" stroke="#BDC3C7" stroke-width="1.5"/>`);
    for (let i = 0; i < n; i++) {
      const by = hPadT + i * (hBarH + hGap);
      allSeries.forEach((s, si) => {
        const v = (s.values || [])[i] || 0;
        const bw = (v / mx) * hChartW;
        const bColor = s.color || color;
        const bby = by + si * (hBarH / seriesCount);
        hEls.push(`<rect x="${hPadL}" y="${bby}" width="${bw}" height="${hBarH / seriesCount - 1}" fill="${bColor}" rx="3" opacity="0.85"/>`);
        hEls.push(`<text x="${hPadL + bw + 4}" y="${bby + hBarH / seriesCount / 2 + 4}" ${font} font-size="10" fill="${bColor}" font-weight="600">${v}</text>`);
      });
      hEls.push(`<text x="${hPadL - 4}" y="${by + hBarH/2 + 4}" text-anchor="end" ${font} font-size="10" fill="#555">${labels[i]}</text>`);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${hW} ${hH}" style="max-width:${hW}px;display:block">${hEls.join("")}</svg>`;
  }

  // ── 세로형 (기본) ──
  function barTop(v) { return padT + chartH - (v / mx) * chartH; }

  let els = [];
  els.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#fff"/>`);
  if (title) els.push(`<text x="${W/2}" y="20" text-anchor="middle" ${font} font-size="13" font-weight="600" fill="#2C3E50">${title}</text>`);

  // y축
  els.push(`<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT+chartH}" stroke="#BDC3C7" stroke-width="1.5"/>`);
  // x축
  els.push(`<line x1="${padL}" y1="${padT+chartH}" x2="${W-padR}" y2="${padT+chartH}" stroke="#BDC3C7" stroke-width="1.5"/>`);

  // y눈금 (4개)
  [0,1,2,3,4].forEach(i => {
    const v = mx * i / 4;
    const y = padT + chartH - (v / mx) * chartH;
    els.push(`<line x1="${padL-4}" y1="${y}" x2="${padL}" y2="${y}" stroke="#999" stroke-width="1"/>`);
    els.push(`<text x="${padL-7}" y="${y+4}" text-anchor="end" ${font} font-size="9" fill="#888">${Math.round(v)}</text>`);
  });

  // 막대 (다중 계열 지원)
  for (let i = 0; i < n; i++) {
    const groupX = padL + i * (groupW + gap);
    allSeries.forEach((s, si) => {
      const v = (s.values || [])[i] || 0;
      const bColor = s.color || color;
      const bx = groupX + si * (barW + 2);
      const bt = barTop(v);
      const bh = padT + chartH - bt;
      els.push(`<rect x="${bx}" y="${bt}" width="${barW}" height="${bh}" fill="${bColor}" rx="3" opacity="0.85"/>`);
      els.push(`<text x="${bx + barW/2}" y="${bt - 4}" text-anchor="middle" ${font} font-size="10" fill="${bColor}" font-weight="600">${v}</text>`);
    });
    // x 라벨
    els.push(`<text x="${groupX + groupW/2}" y="${padT + chartH + 14}" text-anchor="middle" ${font} font-size="10" fill="#555">${labels[i]}</text>`);
  }
  // 범례 (다중 계열)
  if (seriesCount > 1) {
    allSeries.forEach((s, si) => {
      const lx = padL + si * 80;
      const ly = padT + chartH + 28;
      els.push(`<rect x="${lx}" y="${ly}" width="10" height="10" rx="2" fill="${s.color || color}"/>`);
      els.push(`<text x="${lx+14}" y="${ly+9}" ${font} font-size="9" fill="#555">${s.label || ""}</text>`);
    });
  }

  if (yLabel) els.push(`<text x="10" y="${padT + chartH/2}" text-anchor="middle" ${font} font-size="10" fill="#777" transform="rotate(-90,10,${padT + chartH/2})">${yLabel}</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;display:block">${els.join("")}</svg>`;
}

// 원그래프(파이차트) SVG
// params: { data:[{label,value,color}], title }
// highlightIndex: 강조(pull-out)할 조각 인덱스, donut: 도넛형 (안쪽 반지름 비율 0~0.8)
export function svgPieChart({ data = [], title = "", highlightIndex = -1, donut = 0 } = {}) {
  const R = 80, cx = 110, cy = title ? 110 : 95;
  const W = 220, H = cy + R + 20;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const defaultColors = ["#3498DB","#E74C3C","#2ECC71","#F39C12","#9B59B6","#1ABC9C","#E67E22"];
  const font = 'font-family="Spoqa Han Sans Neo,sans-serif"';

  let els = [];
  els.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#fff"/>`);
  if (title) els.push(`<text x="${W/2}" y="18" text-anchor="middle" ${font} font-size="13" font-weight="600" fill="#2C3E50">${title}</text>`);

  let startAngle = -Math.PI / 2;
  data.forEach((d, i) => {
    const angle = (d.value / total) * Math.PI * 2;
    const endAngle = startAngle + angle;
    const color = d.color || defaultColors[i % defaultColors.length];

    const x1 = cx + R * Math.cos(startAngle), y1 = cy + R * Math.sin(startAngle);
    const x2 = cx + R * Math.cos(endAngle), y2 = cy + R * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    // 강조 조각 pull-out
    const pullOut = (i === highlightIndex) ? 8 : 0;
    const midAPull = startAngle + angle / 2;
    const offX = pullOut * Math.cos(midAPull), offY = pullOut * Math.sin(midAPull);
    const pcx = cx + offX, pcy = cy + offY;
    const px1 = pcx + R * Math.cos(startAngle), py1 = pcy + R * Math.sin(startAngle);
    const px2 = pcx + R * Math.cos(endAngle), py2 = pcy + R * Math.sin(endAngle);

    if (donut > 0) {
      const Ri = R * donut;
      const ix1 = pcx + Ri * Math.cos(endAngle), iy1 = pcy + Ri * Math.sin(endAngle);
      const ix2 = pcx + Ri * Math.cos(startAngle), iy2 = pcy + Ri * Math.sin(startAngle);
      els.push(`<path d="M${px1.toFixed(1)},${py1.toFixed(1)} A${R},${R} 0 ${largeArc},1 ${px2.toFixed(1)},${py2.toFixed(1)} L${ix1.toFixed(1)},${iy1.toFixed(1)} A${Ri},${Ri} 0 ${largeArc},0 ${ix2.toFixed(1)},${iy2.toFixed(1)} Z" fill="${color}" stroke="#fff" stroke-width="1.5"/>`);
    } else {
      els.push(`<path d="M${pcx},${pcy} L${px1.toFixed(1)},${py1.toFixed(1)} A${R},${R} 0 ${largeArc},1 ${px2.toFixed(1)},${py2.toFixed(1)} Z" fill="${color}" stroke="#fff" stroke-width="1.5"/>`);
    }

    // 라벨 (중심 방향)
    const midA = startAngle + angle / 2;
    const lx = cx + offX + (R * 0.65) * Math.cos(midA), ly = cy + offY + (R * 0.65) * Math.sin(midA);
    const pct = Math.round(d.value / total * 100);
    if (pct >= 5) {
      els.push(`<text x="${lx.toFixed(1)}" y="${(ly+4).toFixed(1)}" text-anchor="middle" ${font} font-size="10" fill="#fff" font-weight="700">${pct}%</text>`);
    }

    // 범례
    const ly2 = cy + R + 4 - data.length * 9 + i * 18;
    // (범례는 W가 좁아서 생략, 라벨 외부 표시)
    startAngle = endAngle;
  });

  // 범례 (우측 하단)
  data.forEach((d, i) => {
    const color = d.color || defaultColors[i % defaultColors.length];
    // 외부에 텍스트 라벨
    const midA = data.slice(0,i).reduce((s,x)=>s+x.value,0)/total*2*Math.PI - Math.PI/2 + (d.value/total)*Math.PI;
    const lx = cx + (R + 14) * Math.cos(midA), ly = cy + (R + 14) * Math.sin(midA);
    els.push(`<text x="${lx.toFixed(1)}" y="${(ly+4).toFixed(1)}" text-anchor="${lx < cx ? 'end' : 'start'}" ${font} font-size="9" fill="${color}" font-weight="600">${d.label}</text>`);
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;display:block">${els.join("")}</svg>`;
}

// 시계 SVG (초등 시각 문항)
// params: { hour, minute, showLabels,
//           durationArc:{fromHour,fromMin,toHour,toMin,color}, ← 시간 구간 호 표시
//           hideHands:boolean } ← 시침/분침 숨기기 (빈칸채우기용)
export function svgClockFace({ hour = 3, minute = 0, showLabels = true,
  durationArc = null, hideHands = false } = {}) {
  const W = 180, H = 180, cx = 90, cy = 90, R = 75;
  const font = 'font-family="Spoqa Han Sans Neo,sans-serif"';
  let els = [];
  els.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#fff"/>`);
  // 시계 원
  els.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="#FDFEFE" stroke="#2C3E50" stroke-width="3"/>`);
  els.push(`<circle cx="${cx}" cy="${cy}" r="${R-8}" fill="none" stroke="#BDC3C7" stroke-width="0.5"/>`);

  // 숫자
  if (showLabels) {
    [12,1,2,3,4,5,6,7,8,9,10,11].forEach((n, i) => {
      const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
      const nx = cx + (R - 14) * Math.cos(a), ny = cy + (R - 14) * Math.sin(a);
      els.push(`<text x="${nx.toFixed(1)}" y="${(ny+4).toFixed(1)}" text-anchor="middle" ${font} font-size="13" font-weight="700" fill="#2C3E50">${n}</text>`);
    });
  }

  // 눈금
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const isHour = i % 5 === 0;
    const r1 = R - (isHour ? 10 : 6), r2 = R - 2;
    els.push(`<line x1="${(cx+r1*Math.cos(a)).toFixed(1)}" y1="${(cy+r1*Math.sin(a)).toFixed(1)}" x2="${(cx+r2*Math.cos(a)).toFixed(1)}" y2="${(cy+r2*Math.sin(a)).toFixed(1)}" stroke="${isHour?"#2C3E50":"#BDC3C7"}" stroke-width="${isHour?2:1}"/>`);
  }

  // 시간 구간 호 (durationArc)
  if (durationArc) {
    const { fromHour: fh = 0, fromMin: fm = 0, toHour: th = 0, toMin: tm = 0, color: ac = "rgba(231,76,60,0.2)" } = durationArc;
    const angFrom = ((fh % 12) + fm / 60) / 12 * 2 * Math.PI - Math.PI / 2;
    const angTo = ((th % 12) + tm / 60) / 12 * 2 * Math.PI - Math.PI / 2;
    const arcR = R - 16;
    const ax1 = cx + arcR * Math.cos(angFrom), ay1 = cy + arcR * Math.sin(angFrom);
    const ax2 = cx + arcR * Math.cos(angTo), ay2 = cy + arcR * Math.sin(angTo);
    let diff = angTo - angFrom; if (diff < 0) diff += 2 * Math.PI;
    const large = diff > Math.PI ? 1 : 0;
    els.push(`<path d="M${cx},${cy} L${ax1.toFixed(1)},${ay1.toFixed(1)} A${arcR},${arcR} 0 ${large},1 ${ax2.toFixed(1)},${ay2.toFixed(1)} Z" fill="${ac}" stroke="none"/>`);
  }

  // 시침
  if (!hideHands) {
    const hAngle = ((hour % 12) + minute / 60) / 12 * 2 * Math.PI - Math.PI / 2;
    const hLen = R * 0.52;
    els.push(`<line x1="${cx}" y1="${cy}" x2="${(cx+hLen*Math.cos(hAngle)).toFixed(1)}" y2="${(cy+hLen*Math.sin(hAngle)).toFixed(1)}" stroke="#2C3E50" stroke-width="5" stroke-linecap="round"/>`);

    // 분침
    const mAngle = (minute / 60) * 2 * Math.PI - Math.PI / 2;
    const mLen = R * 0.72;
    els.push(`<line x1="${cx}" y1="${cy}" x2="${(cx+mLen*Math.cos(mAngle)).toFixed(1)}" y2="${(cy+mLen*Math.sin(mAngle)).toFixed(1)}" stroke="#E74C3C" stroke-width="3" stroke-linecap="round"/>`);
  }

  // 중심점
  els.push(`<circle cx="${cx}" cy="${cy}" r="4" fill="#2C3E50"/>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;display:block">${els.join("")}</svg>`;
}

// 벤 다이어그램 SVG (집합 — 고등)
// params: { setA, setB, intersection, title,
//           universalSet:{label,elements}, ← 전체집합 U
//           setC:{label,elements}, ← 3집합 (선택)
//           showComplement:boolean } ← 여집합 영역 표시
export function svgVennDiagram({ setA = { label: "A", elements: [] }, setB = { label: "B", elements: [] }, intersection = [], title = "",
  universalSet = null, setC = null, showComplement = false } = {}) {
  const W = 280, H = title ? 180 : 160, cy = H / 2 + (title ? 10 : 0), R = 65, overlapX = 50;
  const cxA = W/2 - overlapX/2 - 10, cxB = W/2 + overlapX/2 + 10;
  const font = 'font-family="Spoqa Han Sans Neo,sans-serif"';
  let els = [];
  els.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#EBF5FB"/>`);
  if (title) els.push(`<text x="${W/2}" y="18" text-anchor="middle" ${font} font-size="13" font-weight="600" fill="#1A5276">${title}</text>`);

  // 두 원
  els.push(`<circle cx="${cxA}" cy="${cy}" r="${R}" fill="rgba(52,152,219,0.25)" stroke="#2980B9" stroke-width="2"/>`);
  els.push(`<circle cx="${cxB}" cy="${cy}" r="${R}" fill="rgba(231,76,60,0.2)" stroke="#C0392B" stroke-width="2"/>`);

  // 교집합 영역 (시각적 강조 없음 — 겹침으로 자동 표현)
  // 라벨
  els.push(`<text x="${cxA - R*0.4}" y="${cy - R*0.8}" text-anchor="middle" ${font} font-size="14" font-weight="700" fill="#2980B9">${setA.label}</text>`);
  els.push(`<text x="${cxB + R*0.4}" y="${cy - R*0.8}" text-anchor="middle" ${font} font-size="14" font-weight="700" fill="#C0392B">${setB.label}</text>`);

  // 원소 배치: A전용
  const aOnly = (setA.elements || []).filter(e => !(intersection || []).includes(e));
  aOnly.slice(0, 4).forEach((e, i) => {
    els.push(`<text x="${cxA - R*0.5}" y="${cy - 12 + i*18}" text-anchor="middle" ${font} font-size="11" fill="#1A5276">${e}</text>`);
  });

  // B전용
  const bOnly = (setB.elements || []).filter(e => !(intersection || []).includes(e));
  bOnly.slice(0, 4).forEach((e, i) => {
    els.push(`<text x="${cxB + R*0.5}" y="${cy - 12 + i*18}" text-anchor="middle" ${font} font-size="11" fill="#922B21">${e}</text>`);
  });

  // 교집합
  (intersection || []).slice(0, 4).forEach((e, i) => {
    els.push(`<text x="${(cxA+cxB)/2}" y="${cy - 12 + i*18}" text-anchor="middle" ${font} font-size="11" fill="#6C3483">${e}</text>`);
  });

  // 전체집합 U (사각형 테두리 + 라벨)
  if (universalSet) {
    els.splice(1, 0, `<rect x="4" y="${title ? 24 : 4}" width="${W-8}" height="${H-(title?28:8)}" rx="6" fill="none" stroke="#1A5276" stroke-width="2" stroke-dasharray="6,3"/>`);
    els.push(`<text x="${W-12}" y="${(title ? 38 : 18)}" text-anchor="end" ${font} font-size="13" font-weight="700" fill="#1A5276">${universalSet.label || "U"}</text>`);
    // 전체집합에만 속하는 원소 (A,B 모두에 없는)
    const uOnly = (universalSet.elements || []).filter(e =>
      !(setA.elements || []).includes(e) && !(setB.elements || []).includes(e));
    uOnly.slice(0, 3).forEach((e, i) => {
      els.push(`<text x="20" y="${H - 24 + i*14}" ${font} font-size="10" fill="#566573">${e}</text>`);
    });
  }

  // 3집합 (setC)
  if (setC) {
    const cxC = W / 2, cyC = cy + R * 0.6;
    els.push(`<circle cx="${cxC}" cy="${cyC}" r="${R * 0.85}" fill="rgba(46,204,113,0.2)" stroke="#27AE60" stroke-width="2"/>`);
    els.push(`<text x="${cxC}" y="${cyC + R * 0.85 + 14}" text-anchor="middle" ${font} font-size="14" font-weight="700" fill="#27AE60">${setC.label || "C"}</text>`);
    const cOnly = (setC.elements || []).filter(e =>
      !(setA.elements || []).includes(e) && !(setB.elements || []).includes(e));
    cOnly.slice(0, 3).forEach((e, i) => {
      els.push(`<text x="${cxC + R*0.5}" y="${cyC + 6 + i*14}" ${font} font-size="10" fill="#1E8449">${e}</text>`);
    });
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;display:block">${els.join("")}</svg>`;
}

// 원(circle) SVG — 원의 구성 요소 + 원주각/중심각 표시
// params: { radius, showRadius, showDiameter, showChord, labelR, labelD, centerLabel, title,
//           points:[{label,angleDeg}],  ← 원 위의 점 (각도는 12시방향=0, 시계방향 +)
//           centralAngle:{from,to},     ← 중심각 표시 (from/to는 points 인덱스)
//           inscribedAngle:{vertex,from,to}, ← 원주각 표시 (vertex/from/to는 points 인덱스)
//           angleLabels:[{text,type}] } ← 각도 수치 라벨 ("110°" 등)
export function svgCircleDiagram({ radius = 60, showRadius = false, showDiameter = false, showChord = false,
  labelR = "r", labelD = "2r", centerLabel = "O", title = "",
  points = [], centralAngle = null, inscribedAngle = null, angleLabels = [] } = {}) {
  const W = 240, H = 240, cx = 120, cy = 125;
  const font = 'font-family="Spoqa Han Sans Neo,sans-serif"';
  let els = [];
  els.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#fff"/>`);
  if (title) els.push(`<text x="${W/2}" y="18" text-anchor="middle" ${font} font-size="12" fill="#555">${title}</text>`);

  // 원
  els.push(`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="#EBF5FB" stroke="#2980B9" stroke-width="2.2"/>`);
  // 중심점 O
  els.push(`<circle cx="${cx}" cy="${cy}" r="3" fill="#2C3E50"/>`);
  els.push(`<text x="${cx-10}" y="${cy+4}" ${font} font-size="13" font-weight="700" fill="#2C3E50">${centerLabel}</text>`);

  // 원 위의 점 좌표 계산 (angleDeg: 12시=0, 시계방향)
  function ptOnCircle(angleDeg) {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
  }
  const ptCoords = points.map(p => ptOnCircle(p.angleDeg));

  // 반지름 (기본 비표시, 점이 없을 때만)
  if (showRadius && points.length === 0) {
    els.push(`<line x1="${cx}" y1="${cy}" x2="${cx+radius}" y2="${cy}" stroke="#E74C3C" stroke-width="1.8" stroke-dasharray="4,2"/>`);
    els.push(`<text x="${cx+radius/2}" y="${cy-6}" text-anchor="middle" ${font} font-size="12" fill="#E74C3C">${labelR}</text>`);
  }

  // 지름
  if (showDiameter) {
    els.push(`<line x1="${cx-radius}" y1="${cy}" x2="${cx+radius}" y2="${cy}" stroke="#8E44AD" stroke-width="1.8"/>`);
    els.push(`<text x="${cx}" y="${cy+16}" text-anchor="middle" ${font} font-size="12" fill="#8E44AD">${labelD}</text>`);
  }

  // 현 (레거시 호환)
  if (showChord && points.length === 0) {
    const ang = Math.PI / 4;
    const x1 = cx + radius*Math.cos(ang), y1 = cy - radius*Math.sin(ang);
    const x2 = cx - radius*Math.cos(ang*0.6), y2 = cy + radius*Math.sin(ang*0.6);
    els.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#27AE60" stroke-width="1.8"/>`);
    els.push(`<text x="${(x1+x2)/2+8}" y="${(y1+y2)/2}" ${font} font-size="11" fill="#27AE60">현</text>`);
  }

  // ── 중심각 (O에서 두 점으로 선분 + 호) ──
  if (centralAngle && ptCoords.length >= 2) {
    const fi = centralAngle.from ?? 0, ti = centralAngle.to ?? 1;
    const [ax, ay] = ptCoords[fi] || ptCoords[0];
    const [bx, by] = ptCoords[ti] || ptCoords[1];
    // O→A, O→B 선분
    els.push(`<line x1="${cx}" y1="${cy}" x2="${ax.toFixed(1)}" y2="${ay.toFixed(1)}" stroke="#E74C3C" stroke-width="2"/>`);
    els.push(`<line x1="${cx}" y1="${cy}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="#E74C3C" stroke-width="2"/>`);
    // 중심각 호 (작은 호)
    const arcR = 18;
    const angA = Math.atan2(ay - cy, ax - cx);
    const angB = Math.atan2(by - cy, bx - cx);
    const a1x = cx + arcR * Math.cos(angA), a1y = cy + arcR * Math.sin(angA);
    const a2x = cx + arcR * Math.cos(angB), a2y = cy + arcR * Math.sin(angB);
    // sweep 방향 결정
    let diff = angB - angA;
    if (diff < 0) diff += 2 * Math.PI;
    const sweep = diff <= Math.PI ? 1 : 0;
    const large = diff > Math.PI ? 1 : 0;
    els.push(`<path d="M${a1x.toFixed(1)},${a1y.toFixed(1)} A${arcR},${arcR} 0 ${large},${sweep} ${a2x.toFixed(1)},${a2y.toFixed(1)}" fill="none" stroke="#E74C3C" stroke-width="1.5"/>`);
    // 중심각 라벨
    if (angleLabels[0]) {
      const midAng = angA + diff / 2;
      const lx = cx + (arcR + 14) * Math.cos(midAng), ly = cy + (arcR + 14) * Math.sin(midAng);
      els.push(`<text x="${lx.toFixed(1)}" y="${(ly+4).toFixed(1)}" text-anchor="middle" ${font} font-size="11" font-weight="700" fill="#E74C3C">${angleLabels[0].text}</text>`);
    }
  }

  // ── 원주각 (원 위의 점에서 두 점으로 선분) ──
  if (inscribedAngle && ptCoords.length >= 3) {
    const vi = inscribedAngle.vertex ?? 2, fi = inscribedAngle.from ?? 0, ti = inscribedAngle.to ?? 1;
    const [vx, vy] = ptCoords[vi] || ptCoords[2];
    const [fx, fy] = ptCoords[fi] || ptCoords[0];
    const [tx, ty] = ptCoords[ti] || ptCoords[1];
    // C→A, C→B 선분
    els.push(`<line x1="${vx.toFixed(1)}" y1="${vy.toFixed(1)}" x2="${fx.toFixed(1)}" y2="${fy.toFixed(1)}" stroke="#2980B9" stroke-width="1.8" stroke-dasharray="5,3"/>`);
    els.push(`<line x1="${vx.toFixed(1)}" y1="${vy.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}" stroke="#2980B9" stroke-width="1.8" stroke-dasharray="5,3"/>`);
    // 원주각 호
    const arcR2 = 16;
    const angF = Math.atan2(fy - vy, fx - vx);
    const angT = Math.atan2(ty - vy, tx - vx);
    const b1x = vx + arcR2 * Math.cos(angF), b1y = vy + arcR2 * Math.sin(angF);
    const b2x = vx + arcR2 * Math.cos(angT), b2y = vy + arcR2 * Math.sin(angT);
    let diff2 = angT - angF; if (diff2 < 0) diff2 += 2 * Math.PI;
    const sweep2 = diff2 <= Math.PI ? 1 : 0;
    const large2 = diff2 > Math.PI ? 1 : 0;
    els.push(`<path d="M${b1x.toFixed(1)},${b1y.toFixed(1)} A${arcR2},${arcR2} 0 ${large2},${sweep2} ${b2x.toFixed(1)},${b2y.toFixed(1)}" fill="none" stroke="#2980B9" stroke-width="1.5"/>`);
    // 원주각 라벨
    if (angleLabels[1]) {
      const midAng2 = angF + diff2 / 2;
      const lx2 = vx + (arcR2 + 14) * Math.cos(midAng2), ly2 = vy + (arcR2 + 14) * Math.sin(midAng2);
      els.push(`<text x="${lx2.toFixed(1)}" y="${(ly2+4).toFixed(1)}" text-anchor="middle" ${font} font-size="11" font-weight="700" fill="#2980B9">${angleLabels[1].text}</text>`);
    }
  }

  // ── 원 위의 점 + 라벨 ──
  ptCoords.forEach(([px, py], i) => {
    const p = points[i];
    els.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4" fill="#2C3E50"/>`);
    // 라벨 위치: 점에서 중심의 반대 방향으로 오프셋
    const dx = px - cx, dy = py - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const ox = dx / dist * 16, oy = dy / dist * 16;
    els.push(`<text x="${(px + ox).toFixed(1)}" y="${(py + oy + 4).toFixed(1)}" text-anchor="middle" ${font} font-size="14" font-weight="700" fill="#1A5276">${p.label}</text>`);
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;display:block">${els.join("")}</svg>`;
}

// dispatcher
export function renderVisualSvg(visual) {
  if (!visual || !visual.type || !visual.params) return "";
  try {
    switch (visual.type) {
      // 기존 (초등)
      case "vertical_calc":   return svgVerticalCalc(visual.params);
      case "base10_blocks":   return svgBase10Blocks(visual.params);
      case "context_illust":  return svgContextIllust(visual.params);
      case "shape":           return svgShape(visual.params);
      case "grouping":        return svgGrouping(visual.params);
      case "number_line":     return svgNumberLine(visual.params);
      // 신규 (초·중·고)
      case "labeled_triangle":   return svgLabeledTriangle(visual.params);
      case "coordinate_plane":   return svgCoordinatePlane(visual.params);
      case "fraction_bar":       return svgFractionBar(visual.params);
      case "data_table":         return svgDataTable(visual.params);
      case "bar_chart":          return svgBarChart(visual.params);
      case "pie_chart":          return svgPieChart(visual.params);
      case "clock_face":         return svgClockFace(visual.params);
      case "venn_diagram":       return svgVennDiagram(visual.params);
      case "circle_diagram":     return svgCircleDiagram(visual.params);
      default: return "";
    }
  } catch (e) {
    console.warn("[svgGenerators] 렌더링 실패:", visual.type, e);
    return "";
  }
}
