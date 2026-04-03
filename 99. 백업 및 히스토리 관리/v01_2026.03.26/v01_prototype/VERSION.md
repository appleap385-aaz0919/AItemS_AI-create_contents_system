# v01 — 프로토타입 초기 완성본

## 버전 정보
- **버전**: v01_prototype
- **날짜**: 2026-03-26
- **JSX 줄 수**: ~2,591줄
- **상태**: 프로토타입 완성 (5팀 파이프라인 동작)

## 포함된 기능
- 5팀 순차 파이프라인 (기획→제작→검수→데이터→플랫폼)
- Claude API 문항 생성 + 로컬 폴백 생성기 (메타 매칭)
- 로컬 규칙 검수 (4영역 100점, 80점 기준)
- xAPI 이벤트 (completed sendLogToContainer)
- OctoPlayer octo-bridge.js V4.1
- 수식입력기 (숫자패드 + MathType)
- ZIP 산출물 6파일 (첫 1회 다운로드)
- API 안정화 (지수 백오프, 쿨다운, 고아 fetch 차단)
- getApiHeaders() 외부 배포 지원

## 주요 버그 수정 완료
- 30초 자동 폴링 제거 (rate limit 보호)
- 폴백 생성기 메타 매칭 (덧셈 메타→뺄셈 출제 버그)
- forceOX 제거 (서술형 선택→OX 출제 버그)
- ZIP 다운로드 롤백 (sandbox 제한, 1회 보장)

## 미해결 이슈
- Artifact 샌드박스 ZIP 다운로드 2회차부터 차단
- OctoPlayer 미확인 사항 4건 (플랫폼팀 확인 필요)

## 파일 목록
- item_system_full_pipeline.jsx — 프로토타입 본체
- session_journal.md — 세션 저널
- SKILL.md — 프로젝트 스킬 메인
- architecture.md — 아키텍처 참조
- code-patterns.md — 코드 패턴 참조
- VERSION.md — 이 파일
