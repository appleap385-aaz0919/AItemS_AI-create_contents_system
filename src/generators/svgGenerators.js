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
  els.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#ffffff"/>`);
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
  els.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#ffffff"/>`);

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

// 라벨이 있는 삼각형 SVG (꼭짓점·변의 길이·각도 표시)
// params: { vertices:[{label,x?,y?}], sides:[{label,value}], angles:[{vertex,mark}],
//           type:"general"|"right"|"isosceles"|"equilateral", highlight:[] }
export function svgLabeledTriangle({ vertices = ["A","B","C"], sides = [], angles = [], type = "general", highlight = [] } = {}) {
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

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;display:block">${els.join("")}</svg>`;
}

// 좌표평면 SVG (점·선·함수 선택적 표시)
// params: { xMin, xMax, yMin, yMax, points:[{x,y,label,color}],
//           lines:[{x1,y1,x2,y2,color}], showGrid:true }
export function svgCoordinatePlane({ xMin = -5, xMax = 5, yMin = -5, yMax = 5, points = [], lines = [], showGrid = true } = {}) {
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

// 분수 막대 SVG
// params: { numerator, denominator, color, showMixed, wholeNumber }
export function svgFractionBar({ numerator = 1, denominator = 4, color = "#3498DB", showMixed = false, wholeNumber = 0 } = {}) {
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

  // 분수 막대 칸
  for (let i = 0; i < totalCells; i++) {
    const x = pad + offsetX + i * cellW;
    const filled = i < numerator;
    els.push(`<rect x="${x}" y="${pad}" width="${cellW}" height="${cellH}" fill="${filled ? color : "#ECF0F1"}" stroke="#BDC3C7" stroke-width="1.2" rx="${i===0?4:0}" style="border-radius:${i===0?'4px':0}"/>`);
  }

  // 분수 라벨
  const barRight = pad + offsetX + totalCells * cellW;
  els.push(`<text x="${pad + offsetX + totalCells*cellW/2}" y="${H-4}" text-anchor="middle" ${font} font-size="12" fill="#7F8C8D">${numerator}/${denominator}</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:${Math.max(W,160)}px;display:block">${els.join("")}</svg>`;
}

// 데이터 표(Table) SVG
// params: { headers:["x","y"], rows:[[1,2],[3,4]], title, highlight:[] }
export function svgDataTable({ headers = [], rows = [], title = "", highlight = [] } = {}) {
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
      els.push(`<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="${isHL ? "#FEF9E7" : ri%2===0?"#FDFEFE":"#F2F3F4"}" stroke="#D5D8DC" stroke-width="0.7"/>`);
      els.push(`<text x="${x + cellW/2}" y="${y + cellH/2 + 5}" text-anchor="middle" ${font} font-size="13" fill="${isHL?"#884EA0":"#2C3E50"}">${cell}</text>`);
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;display:block">${els.join("")}</svg>`;
}

// 막대그래프 SVG
// params: { labels:[], values:[], title, yLabel, color, maxVal }
export function svgBarChart({ labels = [], values = [], title = "", yLabel = "", color = "#3498DB", maxVal } = {}) {
  const n = labels.length, barW = Math.min(44, 260/n), gap = 8;
  const padL = 40, padR = 16, padT = title ? 36 : 16, padB = 40;
  const W = padL + n * (barW + gap) - gap + padR;
  const chartH = 140;
  const H = padT + chartH + padB;
  const mx = maxVal || Math.max(...values, 1) * 1.2;
  const font = 'font-family="Spoqa Han Sans Neo,sans-serif"';

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

  // 막대
  values.forEach((v, i) => {
    const x = padL + i * (barW + gap);
    const bt = barTop(v);
    const bh = padT + chartH - bt;
    els.push(`<rect x="${x}" y="${bt}" width="${barW}" height="${bh}" fill="${color}" rx="3" opacity="0.85"/>`);
    // 값 라벨
    els.push(`<text x="${x + barW/2}" y="${bt - 4}" text-anchor="middle" ${font} font-size="10" fill="${color}" font-weight="600">${v}</text>`);
    // x 라벨
    els.push(`<text x="${x + barW/2}" y="${padT + chartH + 14}" text-anchor="middle" ${font} font-size="10" fill="#555">${labels[i]}</text>`);
  });

  if (yLabel) els.push(`<text x="10" y="${padT + chartH/2}" text-anchor="middle" ${font} font-size="10" fill="#777" transform="rotate(-90,10,${padT + chartH/2})">${yLabel}</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;display:block">${els.join("")}</svg>`;
}

// 원그래프(파이차트) SVG
// params: { data:[{label,value,color}], title }
export function svgPieChart({ data = [], title = "" } = {}) {
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

    els.push(`<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 ${largeArc},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${color}" stroke="#fff" stroke-width="1.5"/>`);

    // 라벨 (중심 방향)
    const midA = startAngle + angle / 2;
    const lx = cx + (R * 0.65) * Math.cos(midA), ly = cy + (R * 0.65) * Math.sin(midA);
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
// params: { hour, minute, showLabels }
export function svgClockFace({ hour = 3, minute = 0, showLabels = true } = {}) {
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

  // 시침
  const hAngle = ((hour % 12) + minute / 60) / 12 * 2 * Math.PI - Math.PI / 2;
  const hLen = R * 0.52;
  els.push(`<line x1="${cx}" y1="${cy}" x2="${(cx+hLen*Math.cos(hAngle)).toFixed(1)}" y2="${(cy+hLen*Math.sin(hAngle)).toFixed(1)}" stroke="#2C3E50" stroke-width="5" stroke-linecap="round"/>`);

  // 분침
  const mAngle = (minute / 60) * 2 * Math.PI - Math.PI / 2;
  const mLen = R * 0.72;
  els.push(`<line x1="${cx}" y1="${cy}" x2="${(cx+mLen*Math.cos(mAngle)).toFixed(1)}" y2="${(cy+mLen*Math.sin(mAngle)).toFixed(1)}" stroke="#E74C3C" stroke-width="3" stroke-linecap="round"/>`);

  // 중심점
  els.push(`<circle cx="${cx}" cy="${cy}" r="4" fill="#2C3E50"/>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;display:block">${els.join("")}</svg>`;
}

// 벤 다이어그램 SVG (집합 — 고등)
// params: { setA:{label,elements:[]}, setB:{label,elements:[]}, intersection:[], title }
export function svgVennDiagram({ setA = { label: "A", elements: [] }, setB = { label: "B", elements: [] }, intersection = [], title = "" } = {}) {
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

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;display:block">${els.join("")}</svg>`;
}

// 원(circle) SVG — 원의 구성 요소 (반지름, 지름, 호, 현 등)
// params: { radius, showRadius, showDiameter, showChord, labelR, labelD, centerLabel, inscribed }
export function svgCircleDiagram({ radius = 60, showRadius = true, showDiameter = false, showChord = false,
  labelR = "r", labelD = "2r", centerLabel = "O", title = "" } = {}) {
  const W = 200, H = 200, cx = 100, cy = 105;
  const font = 'font-family="Spoqa Han Sans Neo,sans-serif"';
  let els = [];
  els.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#fff"/>`);
  if (title) els.push(`<text x="${W/2}" y="16" text-anchor="middle" ${font} font-size="12" fill="#555">${title}</text>`);

  // 원
  els.push(`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="#EBF5FB" stroke="#2980B9" stroke-width="2.2"/>`);
  // 중심
  els.push(`<circle cx="${cx}" cy="${cy}" r="3" fill="#2C3E50"/>`);
  els.push(`<text x="${cx+6}" y="${cy-5}" ${font} font-size="12" fill="#2C3E50">${centerLabel}</text>`);

  // 반지름
  if (showRadius) {
    els.push(`<line x1="${cx}" y1="${cy}" x2="${cx+radius}" y2="${cy}" stroke="#E74C3C" stroke-width="1.8" stroke-dasharray="4,2"/>`);
    els.push(`<text x="${cx+radius/2}" y="${cy-6}" text-anchor="middle" ${font} font-size="12" fill="#E74C3C">${labelR}</text>`);
  }

  // 지름
  if (showDiameter) {
    els.push(`<line x1="${cx-radius}" y1="${cy}" x2="${cx+radius}" y2="${cy}" stroke="#8E44AD" stroke-width="1.8"/>`);
    els.push(`<text x="${cx}" y="${cy+16}" text-anchor="middle" ${font} font-size="12" fill="#8E44AD">${labelD}</text>`);
  }

  // 현
  if (showChord) {
    const ang = Math.PI / 4;
    const x1 = cx + radius*Math.cos(ang), y1 = cy - radius*Math.sin(ang);
    const x2 = cx - radius*Math.cos(ang*0.6), y2 = cy + radius*Math.sin(ang*0.6);
    els.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#27AE60" stroke-width="1.8"/>`);
    els.push(`<text x="${(x1+x2)/2+8}" y="${(y1+y2)/2}" ${font} font-size="11" fill="#27AE60">현</text>`);
  }

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
