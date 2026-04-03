# AItemS 버전 히스토리

## 백업/롤백 사용법

### 롤백하기
```
원하는 버전의 ZIP을 다운로드 → 압축 해제 → 
item_system_full_pipeline.jsx를 claude.ai에 업로드
```

### 새 버전 백업하기 (PM에게 요청)
> "현재 상태를 vXX 으로 백업해줘"

---

## 버전 목록

| 버전 | 날짜 | 설명 | 파일 |
|---|---|---|---|
| **v01_prototype** | 2026-03-26 | 프로토타입 초기 완성 — 5팀 파이프라인 전체 동작 | `backups/v01_prototype.zip` |

---

## v01_prototype — 프로토타입 초기 완성
- 5팀 순차 파이프라인 완전 동작
- Claude API 문항 생성 + 로컬 폴백 (메타 매칭)
- 로컬 규칙 검수 (80점 기준, API 0회)
- xAPI + OctoPlayer octo-bridge.js V4.1
- 수식입력기, ZIP 산출물 6파일
- API 안정화 (지수 백오프, 쿨다운)
- **알려진 제한**: Artifact ZIP 다운로드 2회차부터 차단
