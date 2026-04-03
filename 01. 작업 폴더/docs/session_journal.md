# 세션 저널 — 문항 저작도구 5팀 파이프라인

## 핵심 산출물 위치
- **프로토타입**: `/mnt/user-data/outputs/item_system_full_pipeline.jsx` (2377줄)
- **이전 트랜스크립트**: `/mnt/transcripts/2026-03-25-06-05-25-item-authoring-pipeline-5team-design.txt`

## 이번 세션 수정 이력 (시간순)

### 1. 수식입력기 UI 변경
- 정답 입력 박스: 터치/클릭 시 수식입력기 안 열림, 키보드만
- 🔢 숫자패드 버튼 (기존 제작팀 수식입력기 유지)
- 📐 MathType 버튼 추가 (showMathType API 호출)
- 프로토타입 FillWithMathPad + ZIP 템플릿 양쪽 적용

### 2. OctoPlayer octo-bridge.js 전면 재작성 (V1→V4.1)
#### 수정 이력:
- V1: responseUserId → V2: sendUserId 수정
- V3: sendLogToContainer 구조 {restore:{}, xAPI:{}} 분리
- V4: parent.parent MathType, iframeCurrentPage 높이감지
- V4.1: htmlCurrentPage 제거(IFrame 에러), window.postMessage(self) 제거(재귀), sendLogToContainer는 completed만(mdulId 에러 방지)

#### V4.1 최종 규격:
- **콘텐츠→뷰어**: window.parent.postMessage()만 사용
- **메시지 수신**: sendRestoreData, sendUserId, nextPage, prevPage, terminated, confirmMathType
- **초기화**: requestUserId → requestRestoreData → iframeCurrentPage → 1초/3초 지연 재요청
- **MathType**: findMathTypeFn()으로 기존함수백업 → parent.parent → parent → top 탐색
- **xAPI**: completed만 sendLogToContainer (started/left/reset은 로컬만)
- **restore**: 모듈키 기반 구조 `{ "Q-364": { selected, elapsed, submitted } }`
- **높이감지**: setInterval(500ms) body.scrollHeight 변경 시 iframeCurrentPage 재전송
- **종료**: terminated → left이벤트 + deinit 응답
- **환경진단**: window._octoBridgeDiagnose() 글로벌 함수

#### OctoPlayer 미해결 이슈 (플랫폼팀 확인 필요):
- `Unsupported page viewer type code` 에러 → 콘텐츠 등록 시 뷰어 타입 설정 필요
- restore: 뷰어가 sendRestoreData를 보내는지 확인 필요
- nextPage/prevPage: 뷰어가 콘텐츠에 전달하는지 확인 필요
- MathType: common-mathtype.js가 어느 window에 로딩되는지 확인 필요

### 3. API 호출 안정화
- AbortController 완전 제거 (Artifact 환경에서 fetch 방해)
- Promise.race 60초 타임아웃 + 건너뛰기 Promise
- callId 기반 고아 fetch 로그 차단
- 429 Rate Limit 감지 + 3초 대기 재시도
- API 상태 표시등 (30초 자동체크, 🟢/🟡/🟠/🔴)
- 화면 API 디버그 로그 패널 (addLog → _apiDebugLog → window._setApiLog)

### 4. 검수팀 전면 수정
- 승인 기준: 60점 → 80점 상향
- answer_verified=false → 점수 무관 강제 반려
- Critical 이슈(정답오류/해설모순) → 강제 반려 명시
- API null → 반려 처리 (자동승인 완전 제거)
- JSON 파싱: indexOf("{") 안전 추출 (직접 parse 취약점 수정)
- 프롬프트 개선: "특별한 문제 없으면 80점 approved" 삭제

### 5. 건너뛰기 버튼 수정
- 제작팀만 표시 (검수팀에서 제거)
- 검수 중 "건너뛸 수 없습니다" 메시지
- 제작→검수 전환 시 _apiSkip/skipRef 강제 초기화
- 건너뛰기 체크 300ms 간격
- 고아 fetch: callId 불일치 시 무시

### 6. apiGenerate/apiGenerateWithFix 수정
- API 실패 시 null 반환 (내부에서 fallback 안 함)
- AI 생성 문항에 _aiGenerated:true 마커
- 파이프라인: usedFallback 기반 "로컬 생성"/"AI 생성 완료" 정확 표시
- 문항 카드 배지 동적: _aiGenerated ? "LLM 생성" : "로컬 생성"

### 7. 기타 수정
- fallback meta에 depth 추가
- generateFallback: 7유형 다양 문항 (덧셈/뺄셈/어림셈/곱셈/나눗셈/자릿값/비교)
- PipelineBar: 실시간 경과 타이머 (elapsed초 + pulse 애니메이션)
- 데이터팀: completed extensions JSON 구조화
- 플랫폼팀: runPlatformChecks 실제 검증 (ok:true 하드코딩 제거)
- handleSubmit/Viewed/Reset: 실제 시퀀스 검증
- API 연결 테스트 버튼 + 로그 지우기 버튼

### 8. ZIP 산출물 구조 (6파일)
```
Q-{id}/
├── index.html (item.js + octo-bridge.js 순서로 로딩)
├── css/reset.css
├── css/style.css  
├── js/item.js (ITEM 표준 인터페이스)
├── js/octo-bridge.js (V4.1 OctoPlayer 통신 브릿지)
└── meta.json
```

## 설계 결정 요약 (불변)
- 학습맵 입력=XLSX, 기획팀=하이브리드(규칙+LLM), 제작팀=LLM 직접 생성, 검수팀=LLM 전자동
- 3-Depth 가중치: 3depth(0.5) > 2depth(0.3) > 1depth(0.2)
- xAPI=동아출판 커스텀 경량 포맷, 통신=OctoPlayer postMessage
- 비침습 원칙: item.js 절대 수정 안 함, octo-bridge.js 1파일 추가
- 수식=MathType(KaTeX 아님), LaTeX 금지 + sanitizeLatex() 자동 정화
- 검수 반려→제작팀 재저작 (최대 3회), 플랫폼 반려→데이터팀 (최대 2회)
- 검수 승인기준 80점, 정답오류 시 강제 반려, 자동승인 금지
