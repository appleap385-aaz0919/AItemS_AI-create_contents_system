# 코드 패턴 & 함수 레퍼런스

## 핵심 함수 목록

### API 호출
| 함수 | 위치 | 설명 |
|---|---|---|
| `addLog(msg)` | 글로벌 | API 디버그 로그 추가 (콘솔 + 화면) |
| `callClaude(sys, user)` | 글로벌 | API 호출 래퍼 (타임아웃+건너뛰기 Promise.race) |
| `_callClaudeInner(sys, user, callId)` | 글로벌 | 실제 fetch (3회 재시도, 지수 백오프) |
| `getApiHeaders()` | 글로벌 | 헤더 생성 (_apiKey 유무에 따라 분기) |

### 문항 생성
| 함수 | 설명 |
|---|---|
| `apiGenerate(meta)` | Claude API로 문항 생성 → JSON 파싱 → sanitizeQuestion |
| `apiGenerateWithFix(meta, prevQ, issues)` | 반려 사유 기반 재저작 |
| `generateFallback(meta)` | 로컬 규칙 기반 문항 생성 (meta._key 매칭) |
| `sanitizeLatex(text)` | LaTeX → 순수 텍스트 변환 |
| `sanitizeQuestion(q)` | 문항 전체 LaTeX 정화 |

### 폴백 생성기 (generateFallback 내부)
| 함수 | 매칭 키 | 수학적 제약 |
|---|---|---|
| `genAddNoCarry()` | add_no_carry | 각 자릿수 합 < 10 |
| `genAddOneCarry()` | add_one_carry | 일의 자리만 합 ≥ 10 |
| `genAddMultiCarry()` | add_multi | 일+십 자리 모두 합 ≥ 10 |
| `genEstimate()` | estimate | 백의 자리 반올림 |
| `genSubNoCarry()` | sub_no | 각 자리 위 > 아래 |
| `genDivision()` | division | 나머지 없는 나눗셈 |
| `genRightAngle()` | right_angle | 도형별 직각 유무 |
| `genChallenge()` | challenge | □ 역산 문제 |

### 검수
| 함수 | 설명 |
|---|---|
| `localValidate(meta, question)` | 4영역 100점 규칙 검수 (API 없음) |
| `apiValidate(meta, question)` | (사용 안 함) Claude API 교차 검수 |

### 파이프라인
| 함수 | 설명 |
|---|---|
| `runFullPipeline(meta)` | 5팀 순차 실행 메인 함수 |
| `runPlatformChecks(evts)` | xAPI 이벤트 기반 플랫폼 검증 |

### 이벤트 핸들러
| 함수 | 설명 |
|---|---|
| `handleSelect(node)` | 학습맵 노드 선택 → meta 설정 + _key 주입 |
| `handleTypeSelected(type)` | 유형 선택 → 파이프라인 실행 |
| `handleSubmit(userAns)` | 제출 → 채점 + completed xAPI |
| `handleViewed()` | 해설 확인 → viewed xAPI |
| `handleReset()` | 초기화 → reset xAPI + 타이머 재시작 |
| `handleDownload()` | ZIP 생성 + Blob 다운로드 |
| `handleRegen()` | 메타 편집 패널 열기 |
| `handleApplyMeta(newMeta)` | 수정된 메타로 파이프라인 재실행 |

## METAS 구조 (학습맵 메타 데이터)

```javascript
const METAS = {
  add_no_carry: {
    ch: "연습",           // 차시유형
    tp: "객관식(4지선다)", // 문항유형
    el: "과정기능",        // 내용요소
    bl: "적용",           // Bloom's
    df: "하",             // 난이도
    sc: 2,               // 배점
    tm: 60,              // 제한시간(초)
    ar: "수와 연산",      // 내용체계
    l1: "세 자리 수의 덧셈과 뺄셈", // 1단계명
    ac: "[4수01-03]",     // 성취기준
    ad: "세 자리 수의 덧셈과 뺄셈의 계산 원리를...",
    gd: "받아올림이 없는 세 자리 수 덧셈", // 출제가이드
    std: ["E4MATA01B03C05"],  // 성취기준 코드
    depth: {
      d1: { name: "...", context: "...", w: 0.2 },
      d2: { name: "...", context: "...", w: 0.3 },
      d3: { name: "...", context: "...", w: 0.5 }
    }
  },
  // ...
};
```

## CSS 클래스 주요 패턴

### 레이아웃
- `.app` — 전체 (flex column, 100vh)
- `.top` — 상단바 (로고, 배지)
- `.lay` — 본문 (flex, sidebar + main)
- `.sb` — 사이드바 (280px, 학습맵 트리)
- `.mn` — 메인 영역 (스크롤)

### 트리
- `.th` — 트리 헤더 (폴딩)
- `.tl` — 트리 리프 (선택 가능)
- `.tl.sel` — 선택된 리프

### 파이프라인
- `.pipe-bar` — 파이프라인 바
- `.pipe-stage.idle/.running/.done/.fail` — 단계 상태

### 문항
- `.qc` — 문항 카드
- `.qb` — 문항 본문
- `.mci` — 객관식 보기
- `.oxb` — OX 버튼
- `.fli` — 빈칸 입력
- `.essa` — 서술형 텍스트에어리어

### 피드백
- `.fb-result.fc` — 정답 (녹색)
- `.fb-result.fw` — 오답 (빨간색)
- `.fb-explain` — 해설 패널

### 수식패드
- `.math-pad` — 수식 패드 컨테이너
- `.math-key` — 패드 버튼
- `.mathtype-btn` — MathType 버튼

### 검수
- `.qa-panel.pass/.fail` — 검수 결과
- `.qa-grid` — 4영역 그리드
- `.retry-panel` — 반려 이력

### xAPI / 플랫폼
- `.xapi-panel` — xAPI 이벤트 로그
- `.plat-panel` — 플랫폼 검증 결과

## 색상 체계
```javascript
const TC = {
  진단: "#5ba4f5",
  연습: "#3dd9a0",
  형성평가: "#f0b95a",
  심화: "#f07b5a",
  총괄: "#7bc95e"
};
```
- 주 컬러: `#6c5ce7` (보라)
- 성공: `#3dd9a0` / `#00b894`
- 경고: `#f0932b`
- 에러: `#e85a5a` / `#ff6b6b`
- 텍스트: `#1a1a18` (기본), `#8c8b87` (보조)
- 배경: `#f5f4f1` (전체), `#fff` (카드)
