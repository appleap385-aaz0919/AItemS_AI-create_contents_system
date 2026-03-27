#!/bin/bash
# AItemS 프로젝트 GitHub 푸시 스크립트
# 이 파일을 다운로드한 폴더에서 실행하세요

REPO_URL="https://github.com/appleap385-aaz0919/AItemS_AI-create_contents_system.git"

# 1. 기존 repo가 있으면 pull, 없으면 clone
if [ -d ".git" ]; then
    echo "기존 저장소 발견 — pull..."
    git pull origin main
else
    echo "저장소 초기화..."
    git init
    git remote add origin $REPO_URL 2>/dev/null || git remote set-url origin $REPO_URL
fi

# 2. 파일 추가
git add -A

# 3. 커밋
git commit -m "feat: 5팀 파이프라인 프로토타입 + 문서 + octo-bridge.js V4.1

- src/item_system_full_pipeline.jsx: React 프로토타입 (2460줄)
  - 5팀 파이프라인 (기획→제작→검수→데이터→플랫폼)
  - Claude API 연동 (문항 생성 + 검수)
  - 로컬 fallback 7유형 + 로컬 규칙 검수 16항목
  - OctoPlayer octo-bridge.js V4.1 ZIP 패키징
  - API 상태 표시등 + 디버그 로그 패널
  - 수식입력기 (숫자패드 + MathType)

- docs/: 팀별 상세 규격서 + 통합 문서 3종
"

# 4. 푸시
git branch -M main
git push -u origin main

echo "✅ 푸시 완료!"
