# 세션 저널 — 문항 저작도구 5팀 파이프라인

## 핵심 산출물
| 파일 | 설명 |
|---|---|
| `item_system_full_pipeline.jsx` | 프로토타입 본체 (React JSX, ~2600줄) |
| `session_journal.md` | 전체 작업 이력 + 설계 결정 (이 파일) |
| `AItemS_git_package.zip` | 팀별 스펙 문서 HTML 8건 + 설계 보고서 DOCX/PPTX |

## 새 채팅 이어서 하는 법
> 위 3개 파일 업로드 → "session_journal.md 읽고 이전 작업 파악해서 이어서 진행해줘"

---

## 설계 결정 (불변)
- 학습맵 입력=XLSX, 기획팀=하이브리드(규칙+LLM), 제작팀=LLM 직접 생성, 검수팀=로컬 규칙 기본
- 5팀 순차 파이프라인: 기획 → 제작 → 검수 → 데이터 → 플랫폼
- 3-Depth 가중치: 3depth(0.5) > 2depth(0.3) > 1depth(0.2)
- xAPI=동아출판 커스텀 경량 포맷, 통신=OctoPlayer postMessage
- 비침습 원칙: item.js 절대 수정 안 함, octo-bridge.js 1파일 추가
- 수식=MathType(KaTeX 아님), LaTeX 금지 + sanitizeLatex() 자동 정화
- 검수 반려→제작팀 재저작 (최대 2회), 플랫폼 반려→데이터팀 (최대 2회)
- 검수 승인기준 80점, 정답오류 시 강제 반려, 자동승인 금지

---

## 수정 이력 (전 세션 통합, 시간순)

### 1. 수식입력기 UI
- 정답 입력 박스: 키보드 우선, 터치 시 수식입력기 안 열림
- 🔢 숫자패드 + 📐 MathType 이원화
- 프로토타입 FillWithMathPad + ZIP 템플릿 양쪽 적용

### 2. OctoPlayer octo-bridge.js V4.1
- 콘텐츠→뷰어: window.parent.postMessage()만 사용
- 메시지 수신: sendRestoreData, sendUserId, nextPage, prevPage, terminated, confirmMathType
- 초기화: requestUserId → requestRestoreData → iframeCurrentPage → 1초/3초 지연 재요청
- MathType: findMathTypeFn()으로 parent.parent → parent → top 탐색
- xAPI: completed만 sendLogToContainer (started/left/reset은 로컬만)
- restore: 모듈키 기반 `{ "Q-364": { selected, elapsed, submitted } }`
- 높이감지: setInterval(500ms), 환경진단: window._octoBridgeDiagnose()

### 3. API 호출 안정화
- AbortController 제거, Promise.race 60초 타임아웃 + 건너뛰기
- callId 기반 고아 fetch 차단
- 지수 백오프: 429시 8초→15초→25초, 네트워크 에러 3초→6초→10초
- Rate limit 쿨다운 시스템: _lastRateLimitTime + _rateLimitCooldown 글로벌 추적
- 성공 시 쿨다운 리셋, 재시도 3회
- API 상태 표시등 (수동 클릭만, 자동 폴링 제거)
- getApiHeaders() 함수: 키 있으면 x-api-key 헤더 추가 (외부 배포 대비)

### 4. 검수팀
- 승인기준 80점, answer_verified=false → 강제 반려
- Critical 이슈(정답오류/해설모순) → 강제 반려
- API null → 반려 (자동승인 완전 제거)
- JSON 파싱: indexOf("{") 안전 추출

### 5. 건너뛰기 버튼
- 제작팀만 표시, 검수팀 진입 시 _apiSkip/skipRef 강제 초기화

### 6. API 생성 함수
- apiGenerate/apiGenerateWithFix: 실패 시 null 반환
- _aiGenerated:true 마커, 카드 배지 동적 표시

### 7. 기타
- PipelineBar 경과 타이머, 데이터팀 extensions 구조화
- 플랫폼팀 runPlatformChecks 실제 검증
- handleSubmit/Viewed/Reset 시퀀스 검증
- API 연결 테스트 버튼 + 로그 지우기

### 8. ZIP 산출물 (6파일)
```
Q-{id}/
├── index.html
├── css/reset.css
├── css/style.css
├── js/item.js (ITEM 표준 인터페이스)
├── js/octo-bridge.js (V4.1 OctoPlayer 통신 브릿지)
└── meta.json
```

### 9. 파이프라인 V2: API 호출 최소화
- 제작팀: API 1회만 (문항 생성)
- 검수팀: 로컬 규칙 검수 기본 (API 0회)
- 반려 루프: 3회→2회 축소, 재시도 전 5초 쿨다운
- 파이프라인 1회 실행 = API 최대 2회 (기존 2~6회)
- 파이프라인 실행 결과로 API 상태 자동 갱신

### 10. 폴백 문항 생성기 메타 매칭 (Critical Bug Fix)
- **버그**: generateFallback()이 메타정보 무시하고 완전 랜덤 → 덧셈 메타인데 뺄셈 출제
- **수정**: meta._key, gd, depth 키워드 기반 정확 매칭
  - add_no_carry/add_one_carry/add_multi: 각각 받아올림 조건을 do-while로 보장
  - estimate/sub_no/division/right_angle/challenge: 전용 생성기
- handleSelect에 `m._key = node.k` 주입

### 11. getApiHeaders() 외부 배포 지원
- fetch 3곳 모두 getApiHeaders() 사용
- _apiKey 설정 시 x-api-key + anthropic-version + anthropic-dangerous-direct-browser-access 헤더 추가
- claude.ai Artifact에서는 키 없이 자동 인증 (기존과 동일)
- UI 패널은 삭제됨 — 필요 시 코드에서 `_apiKey = "sk-..."` 직접 설정

---

## OctoPlayer 미해결 이슈 (플랫폼팀 확인 필요)
- `Unsupported page viewer type code` 에러 → 콘텐츠 등록 시 뷰어 타입 설정 필요
- restore: 뷰어가 sendRestoreData를 보내는지 확인 필요
- nextPage/prevPage: 뷰어가 콘텐츠에 전달하는지 확인 필요
- MathType: common-mathtype.js가 어느 window에 로딩되는지 확인 필요
