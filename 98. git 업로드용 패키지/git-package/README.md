# AItemS — AI 문항 저작 시스템 (AI-create Contents System)

## 개요
학습맵 기반 5팀 파이프라인으로 수학 문항을 자동 생성·검수·패키징하는 시스템

## 5팀 파이프라인 구조
```
기획팀 → 제작팀 → 검수팀 → 데이터팀 → 플랫폼팀
  │        │        │        │         │
  │        │        │        │         └─ xAPI/통신 검증 (12항목)
  │        │        │        └─ xAPI 적용 + OctoPlayer 연동
  │        │        └─ 4영역 38항목 검수 (AI+로컬 규칙)
  │        └─ Claude API 문항 생성 (10유형)
  └─ 학습맵 분석 → 메타정보 JSON 생성
```

## 프로젝트 구조
```
src/
  item_system_full_pipeline.jsx   # React 프로토타입 (전체 파이프라인)
docs/
  session_journal.md              # 개발 이력 저널
  pipeline_design.pptx            # 파이프라인 설계 PPT (10슬라이드)
  pipeline_design_report.docx     # 파이프라인 설계 보고서 (10장)
  pipeline_dashboard.html         # 통합 대시보드 (9페이지)
  planning_team_spec_v2.html      # TEAM 01 기획팀 상세 규격
  production_team_spec.html       # TEAM 02 제작팀 상세 규격
  qa_team_spec_v2.html            # TEAM 03 검수팀 상세 규격
  data_team_spec_v2.html          # TEAM 04 데이터팀 상세 규격
  platform_team_spec.html         # TEAM 05 플랫폼팀 상세 규격
  item_authoring_pipeline.html    # 파이프라인 전체 흐름도
```

## 핵심 기술 결정
- **AI 모델**: Claude Sonnet 4 (문항 생성 + 검수)
- **프론트엔드**: React (Artifact 환경)
- **xAPI**: 동아출판 커스텀 경량 포맷
- **뷰어 연동**: OctoPlayer postMessage 통신
- **수식**: MathType (LaTeX 금지, sanitizeLatex 자동 정화)
- **3-Depth 가중치**: 3depth(0.5) > 2depth(0.3) > 1depth(0.2)
- **검수 기준**: 80점 이상 승인, 정답 오류 시 강제 반려
- **로컬 검수**: API 다운 시 16개 규칙 기반 자동 검수

## ZIP 산출물 구조 (문항 1건)
```
Q-{id}/
├── index.html
├── css/reset.css
├── css/style.css
├── js/item.js          # ITEM 표준 인터페이스
├── js/octo-bridge.js   # OctoPlayer 통신 브릿지 V4.1
└── meta.json
```

## 실행 방법
`src/item_system_full_pipeline.jsx`를 Claude.ai Artifact에서 실행
