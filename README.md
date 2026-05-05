# 우리 반 마음 날씨 예보관

아침 조회 시간이나 상담 전에 학생들이 자신의 감정 상태를 날씨 이모지로 표현하고, 선생님이 학급 전체 분위기를 확인할 수 있는 브라우저 앱입니다.

## 최근 변경

- 교사용 `교사용 잠그기` 기능을 추가해, 선생님 모드의 상세 정보와 설정을 즉시 숨길 수 있습니다.
- `PIN 재진입`, `새로고침 후 복원`, `오늘 기록 초기화 확인/취소` 흐름의 테스트를 보강했습니다.
- 파일럿 운영용 최종 점검 체크리스트를 [docs/superpowers/checklists/2026-05-05-classroom-emotion-tracker-pilot-checklist.md](docs/superpowers/checklists/2026-05-05-classroom-emotion-tracker-pilot-checklist.md)에 추가했습니다.
- 자세한 변경 요약은 [docs/release-notes/2026-05-05-pilot-update.md](docs/release-notes/2026-05-05-pilot-update.md)에서 볼 수 있습니다.

## 사용

```bash
npm install
npm run dev
```

## 검증

```bash
npm test
npm run e2e
npm run build
```

## 배포

`main` 브랜치에 푸시하면 GitHub Actions가 `dist/`를 빌드해 GitHub Pages로 배포합니다.
