# 시스템 아키텍처 상세

## 파이프라인 실행 흐름

```
[학습맵 노드 선택] → [문항 유형 선택 패널]
       ↓
  ① 기획팀 (0.5초)
     - meta = METAS[node.k] 또는 기본값
     - m._key = node.k 주입
     - showTypeSelect = true → 유형 선택 UI 표시
       ↓
  ② 제작팀 (API 1회, 최대 60초)
     - apiGenerate(meta) → Claude API 호출
     - 실패 시 generateFallback(meta) → 로컬 생성
     - sanitizeQuestion(q) → LaTeX 정화
     - _aiGenerated: true/false 마커
       ↓
     _apiSkip = false; skipRef.current = false; (검수 영향 차단)
       ↓
  ③ 검수팀 (API 0회, 로컬 규칙)
     - localValidate(meta, question) → 4영역 100점
     - 80점 미만 OR answer_verified=false → 반려
     - 반려 시 → ②로 돌아감 (apiGenerateWithFix, 5초 쿨다운)
     - 최대 2회 반려 → ESCALATED
       ↓
  ④ 데이터팀 (0.4초)
     - started 이벤트 등록
     - xAPI extensions 구조 준비
       ↓
  ⑤ 플랫폼팀 (0.3초 × 최대 3회)
     - runPlatformChecks(evts) → P1~P4 검증
     - 실패 시 → ④ 데이터팀 반려 (octo-bridge.js 패치)
     - 최대 2회 반려 → ESCALATED
       ↓
  [타이머 시작] → [문항 렌더링]
```

## React 컴포넌트 트리

```
App
├── TreeNode (학습맵 트리 — 재귀)
├── PipelineBar (5단계 진행 표시 + 경과 타이머)
├── TypeSelectPanel (문항 유형 선택 4종)
├── EditPanel (메타정보 수정 후 재생성)
├── QAPanel (검수 결과 4영역 점수)
├── RetryLogPanel (검수 반려→재저작 이력)
├── QBody (문항 렌더링 + 제출 + 피드백)
│   ├── FillWithMathPad (빈칸채우기 수식입력기)
│   └── 피드백 (정답/오답 + 해설)
├── XAPIPanel (xAPI 이벤트 로그)
├── PlatformPanel (플랫폼 검증 결과)
├── PlatRetryLogPanel (플랫폼 반려 이력)
└── API 디버그 패널 (로그 + 테스트 버튼)
```

## 글로벌 변수 (컴포넌트 밖)

| 변수 | 용도 |
|---|---|
| `_apiDebugLog[]` | 화면 표시용 디버그 로그 (최대 20개) |
| `_apiSkip` | 건너뛰기 플래그 (제작팀만) |
| `_apiCallId` | 현재 활성 API 호출 ID (고아 방지) |
| `_lastRateLimitTime` | 마지막 429 발생 시각 |
| `_rateLimitCooldown` | 현재 쿨다운 ms |
| `_pipelineRunning` | 파이프라인 실행 중 플래그 |
| `_apiKey` | 외부 배포용 API 키 (빈 문자열이면 Artifact 프록시) |

## State 목록 (App 컴포넌트)

| state | 타입 | 용도 |
|---|---|---|
| selNode | object | 선택된 학습맵 노드 |
| meta | object | 기획팀 메타정보 |
| question | object | 생성된 문항 JSON |
| qaResult | object | 검수 결과 |
| xapiEvents | array | xAPI 이벤트 로그 |
| platChecks | array | 플랫폼 검증 결과 |
| retryLog | array | 검수 반려 이력 |
| apiLog | array | API 디버그 로그 (화면용) |
| platRetryLog | array | 플랫폼 반려 이력 |
| submitted | bool | 제출 여부 |
| result | object | 채점 결과 |
| showEdit | bool | 메타 편집 패널 표시 |
| showTypeSelect | bool | 유형 선택 패널 표시 |
| regenCount | int | 재생성 횟수 (최대 5) |
| timer | int | 경과 시간 (초) |
| qId | string | 문항 ID (Q-XXX) |
| stages | array | 5팀 상태 [{name, status, time}] |
| apiStatus | object | API 상태 {state, ms, lastCheck, checking} |

## 데이터 흐름

```
TREE (학습맵) → handleSelect(node)
  → METAS[node.k] → meta
  → handleTypeSelected(type)
    → meta.tp = selectedType
    → runFullPipeline(meta)
      → apiGenerate(meta) OR generateFallback(meta) → question
      → localValidate(meta, question) → qaResult
      → xAPI events → xapiEvents
      → runPlatformChecks(evts) → platChecks
```
