---
name: aitems-pipeline
description: AItemS 문항 저작도구 5팀 파이프라인 프로젝트 전용 스킬. 초등 수학 문항을 자동 생성·검수·배포하는 React JSX 프로토타입을 개발·유지보수합니다. 이 스킬은 문항 저작도구, 5팀 파이프라인, AItemS, 문제은행, 학습맵, OctoPlayer, xAPI, octo-bridge, 수식입력기(MathType), 검수팀, 제작팀 등의 키워드가 등장할 때 반드시 사용하세요. 기존 코드 수정, 새 기능 추가, 버그 수정, 노션 문서화, 세션 이어하기 등 모든 작업에 이 스킬을 참조하세요.
---

# AItemS 문항 저작도구 — 5팀 파이프라인 스킬

## 세션 시작 시 반드시 수행할 것

1. **세션 저널 읽기**: `/mnt/user-data/uploads/session_journal.md` 또는 업로드된 `session_journal.md`를 읽어 이전 작업 내용을 파악
2. **프로토타입 파일 확인**: `item_system_full_pipeline.jsx` (~2,600줄)를 작업 디렉토리(`/home/claude/pipeline.jsx`)로 복사
3. **git 패키지 확인**: `AItemS_git_package.zip` 내 팀별 스펙 문서 참조 가능
4. 사용자는 Claude를 **"PM"**이라고 부릅니다. 자연스럽게 응대하세요.

---

## 프로젝트 개요

**AItemS**(AI Item authoring System)는 초등 수학 문항을 5개 팀 파이프라인으로 자동 생성·검수·배포하는 시스템입니다.

| 항목 | 내용 |
|---|---|
| 대상 학년 | 초등 3~6학년 |
| 교과 | 수학 |
| 핵심 기술 | Claude API (LLM), xAPI, OctoPlayer postMessage |
| 프로토타입 | React JSX 단일 파일 (Artifact 실행) |

---

## 불변 설계 원칙 (절대 변경하지 말 것)

1. **5팀 순차 파이프라인**: 기획 → 제작 → 검수 → 데이터 → 플랫폼
2. **3-Depth 가중치**: 3depth(50%) > 2depth(30%) > 1depth(20%)
3. **비침습 원칙**: item.js 절대 수정 안 함, octo-bridge.js 1파일만 추가
4. **수식 = MathType**: KaTeX/LaTeX 사용 금지, sanitizeLatex() 자동 정화
5. **검수 엄격**: 80점 미만 반려, 정답오류 시 강제 반려, 자동승인 금지
6. **검수팀 = 로컬 규칙 검수**: API 호출 0회 (rate limit 보호)
7. **API 최소화**: 파이프라인 1회 실행 = API 최대 1~2회
8. **xAPI**: 동아출판 커스텀 경량 포맷, completed만 sendLogToContainer
9. **통신**: OctoPlayer postMessage (window.parent.postMessage)

---

## 코드 수정 규칙

### 수정 전
- 반드시 `/home/claude/pipeline.jsx`에서 작업 (outputs 직접 수정 금지)
- 수정할 부분을 `view`로 먼저 확인
- `str_replace`로 정확한 문자열 매칭 후 교체

### 수정 후
- `cp /home/claude/pipeline.jsx /mnt/user-data/outputs/item_system_full_pipeline.jsx`로 배포
- `present_files`로 사용자에게 전달
- session_journal.md에 수정 내용 추가

### HTML 변환 (요청 시에만)
```python
# JSX → 브라우저 실행 HTML 변환
jsx_code.replace('import { useState, useRef, useCallback, useEffect } from "react";', 
                 'const { useState, useRef, useCallback, useEffect } = React;')
jsx_code.replace('export default function App()', 'function App()')
# React 18 + Babel CDN으로 감싸기
```
- HTML에서는 API 호출 불가 (claude.ai 프록시 없음)
- HTML에서는 ZIP 다운로드 반복 가능 (sandbox 제한 없음)

---

## 팀별 핵심 규격

### ① 기획팀 — 메타정보 설계
- **입력**: XLSX 학습맵 (TREE 데이터)
- **출력**: meta 객체 (tp, el, bl, df, sc, tm, ar, ac, gd, depth, std, _key)
- **3-Depth**: d1(단원맥락, 0.2) → d2(수학개념, 0.3) → d3(학습활동, 0.5)
- `handleSelect`에서 `m._key = node.k` 주입 필수 (폴백 매칭용)

### ② 제작팀 — LLM 문항 생성
- **API**: claude-sonnet-4-20250514, max_tokens:1000, 60초 타임아웃
- **프롬프트**: 시스템 "순수 JSON만 출력" + 유저에 메타+3Depth 컨텍스트
- **LaTeX 금지**: 프롬프트에 명시, sanitizeLatex()로 후처리
- **출력 JSON**: {passage, stem, type, options, answer, explanation, _aiGenerated}
- **type 코드**: mc(객관식), ox(OX), fill(빈칸), essay(서술형)
- **폴백**: `generateFallback(meta)` — meta._key + gd + depth 키워드 기반 매칭
  - 각 생성기(genAddOneCarry 등)는 do-while로 수학적 제약 보장
  - 사용자가 선택한 유형(tp)을 항상 존중 (forceOX 금지)

### ③ 검수팀 — 로컬 규칙 검수
- **API 호출 없음** (로컬 규칙만)
- **4개 영역**: D1 코드구조(25점) + D2 교육적정성(30점) + D3 접근성(20점) + D4 채점로직(25점)
- **승인**: 총점 ≥ 80 AND answer_verified = true
- **강제 반려**: answer_verified=false, 정답오류, 해설모순
- **반려 루프**: 최대 2회 → ESCALATED
- **JSON 파싱**: indexOf("{") 안전 추출

### ④ 데이터팀 — xAPI 이벤트
- **completed만 sendLogToContainer** (started/left/reset은 로컬만)
- **페이로드**: { restore: {모듈키: {selected, elapsed, submitted}}, xAPI: {verb, object, result, response, context} }
- **extensions 7개**: skip, req-act-cnt, com-act-cnt, crt-cnt, incrt-cnt, crt-rt, success, duration

### ⑤ 플랫폼팀 — OctoPlayer 통신
- **octo-bridge.js V4.1**: 비침습 브릿지
- **전송**: requestUserId, requestRestoreData, iframeCurrentPage, sendLogToContainer, deinit
- **수신**: sendUserId, sendRestoreData, nextPage, prevPage, terminated, confirmMathType
- **초기화**: 즉시 + 1초 후 + 3초 후 재요청
- **MathType**: findMathTypeFn()으로 parent.parent → parent → top 탐색
- **높이감지**: setInterval(500ms) body.scrollHeight 변화 감시
- **환경진단**: window._octoBridgeDiagnose() 글로벌 함수

---

## API 호출 규격

### callClaude(sys, user)
- Promise.race: 실제 호출 + 60초 타임아웃 + 건너뛰기 Promise
- callId 기반 고아 fetch 차단

### _callClaudeInner(sys, user, callId)
- 최대 3회 재시도
- 429 지수 백오프: 8초 → 15초 → 25초
- 네트워크 에러: 3초 → 6초 → 10초
- 서버 에러(5xx): 5초 대기
- 성공 시 rate limit 쿨다운 리셋

### getApiHeaders()
- _apiKey 없으면: {"Content-Type":"application/json"} (Artifact 프록시 의존)
- _apiKey 있으면: + x-api-key + anthropic-version + anthropic-dangerous-direct-browser-access

### 절대 하지 말 것
- 자동 상태 체크 폴링 (setInterval로 API 호출 금지)
- 검수팀에서 API 호출 (로컬 규칙만 사용)
- 반려 루프 3회 이상 (최대 2회)

---

## ZIP 산출물 구조 (6파일)

```
Q-{id}/
├── index.html          ← item.js + octo-bridge.js 순서로 로딩
├── css/reset.css       ← Spoqa Han Sans + Noto Sans KR
├── css/style.css       ← 문항 UI (수식패드, 피드백 등)
├── js/item.js          ← ITEM 표준 인터페이스 (절대 수정 금지)
├── js/octo-bridge.js   ← V4.1 OctoPlayer 통신 브릿지
└── meta.json           ← 문항 ID, 유형, 정답, 메타정보
```

### ZIP 다운로드 (Artifact 제한사항)
- Artifact 샌드박스에서 blob 다운로드는 **첫 1회만 동작**
- 두 번째부터는 브라우저 보안에 의해 조용히 차단됨
- iframe, data URI, React state 렌더링 등 어떤 트릭으로도 우회 불가
- **현재 방식**: 가장 단순한 blob + a.click() (최소 1회 보장)
- **반복 다운로드 필요 시**: HTML 파일로 변환하여 브라우저에서 직접 실행

---

## 수식입력기

### 프로토타입 (FillWithMathPad 컴포넌트)
- 정답 입력: 키보드 우선 (터치 시 수식입력기 안 열림)
- 🔢 숫자패드: numKeys + opKeys 그리드
- 📐 MathType: showMathType(id, val, toolbar) API 호출
- toolbar: "elementary"(초등) / "high"(고등) / ""(중등)

### ZIP 템플릿 (js/item.js)
- toggleMathPad() / mathInput(ch) / mathBackspace() / mathClear()
- openMathTypeInput() → findMathTypeFn → postMessage 폴백

---

## 미해결 이슈 (플랫폼팀 확인 필요)

1. `Unsupported page viewer type code` 에러 → 콘텐츠 등록 시 뷰어 타입 설정 필요
2. restore: 뷰어가 sendRestoreData를 보내는지 확인 필요
3. nextPage/prevPage: 뷰어가 콘텐츠에 전달하는지 확인 필요
4. MathType: common-mathtype.js가 어느 window에 로딩되는지 확인 필요

---

## 주요 버그 이력 (재발 방지)

| 버그 | 원인 | 수정 | 재발 방지 |
|---|---|---|---|
| API 응답 거의 안 옴 | 30초 자동 폴링이 rate limit 소모 | 자동 폴링 완전 제거 | setInterval로 API 호출 금지 |
| 덧셈 메타인데 뺄셈 출제 | generateFallback()이 메타 무시 랜덤 | meta._key 기반 정확 매칭 | 폴백 생성기에 메타 매칭 필수 |
| 서술형 선택→OX 출제 | forceOX가 유형 덮어씌움 | forceOX 완전 제거 | 사용자 선택 유형 항상 존중 |
| ZIP 두 번째부터 안됨 | Artifact sandbox 다운로드 제한 | 롤백→단순 blob (1회 보장) | sandbox 한계, 코드로 우회 불가 |

---

## 세션 간 이어하기

### 사용자가 업로드할 파일 3개
1. `item_system_full_pipeline.jsx` — 프로토타입 본체
2. `session_journal.md` — 전체 작업 이력
3. `AItemS_git_package.zip` — 팀별 스펙 문서

### 새 세션 첫 메시지
> "session_journal.md 읽고 이전 작업 파악해서 이어서 진행해줘"

### 세션 종료 시
- session_journal.md에 수정 내용 추가
- JSX 파일 최신 상태로 present_files

---

## 참고: 상세 규격 문서

`references/` 디렉토리에 팀별 상세 규격이 있습니다:
- `references/architecture.md` — 파이프라인 흐름, 반려 루프, API 전략
- `references/code-patterns.md` — 코드 패턴, 함수 목록, CSS 클래스
