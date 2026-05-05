# V1 Sprint 1 Subagent Plan

## 목표

현재 배포된 MVP를 파일럿 직전 수준으로 끌어올리기 위해 다음 3가지를 마감한다.

1. 선생님 설정에서 현재 PIN 확인 후 새 4자리 PIN으로 변경할 수 있다.
2. 선생님 상세는 모든 학생의 7일 기록을 한꺼번에 펼치지 않고, 선택한 학생 중심으로 오늘 상태와 7일 흐름을 보여준다.
3. 오늘 현황 영역에 원형 통계 시각화를 추가해 전자칠판에서 한눈에 분포를 읽을 수 있게 한다.

## 작업 원칙

- 메인 브랜치 대신 격리된 worktree 브랜치 `feature/v1-sprint-impl`에서 진행한다.
- 각 작업은 fresh implementer subagent 1개로 구현한다.
- 구현 직후 spec reviewer가 사양 일치 여부를 먼저 본다.
- spec reviewer 승인 후 code quality reviewer가 구조와 테스트 품질을 본다.
- reviewer가 이슈를 남기면 같은 implementer가 수정하고 다시 리뷰받는다.

## Task A: 선생님 설정 PIN 변경

### 요구사항

- 설정 패널에 `PIN 변경` 섹션을 추가한다.
- 입력 필드는 `현재 PIN`, `새 PIN`, `새 PIN 확인` 3개다.
- 현재 PIN 검증 실패, 새 PIN 형식 오류, 확인 불일치에 대한 오류 메시지를 보여준다.
- 성공 시 새 PIN으로 저장되고 입력값은 초기화된다.
- 기존 잠금 해제 로직과 저장 구조를 깨지 않는다.

### 파일 범위

- `src/App.tsx`
- 필요 시 `src/styles.css`
- 테스트: `src/App.test.tsx`, 필요 시 `tests/classroom-emotion-tracker.spec.ts`

### 서브에이전트 흐름

1. Implementer: PIN 변경 UI/상태/검증/테스트 구현
2. Spec reviewer: 요구사항 누락/초과 확인
3. Code quality reviewer: 상태 분리, 메시지 처리, 테스트 품질 확인

## Task B: 선택 학생 중심 선생님 상세

### 요구사항

- 선생님 모드에서 학생 번호 버튼을 누르면 해당 학생이 선택된다.
- 교사 패널은 `선택한 학생의 오늘 상태`와 `최근 7일 흐름`을 중심으로 보여준다.
- 학생이 선택되지 않았을 때는 안내 문구를 보여준다.
- 기존처럼 일반 화면에서는 개별 감정이 숨겨진다.
- 번호 격자와 교사 패널의 연결 상태가 시각적으로 드러나야 한다.

### 파일 범위

- `src/App.tsx`
- 필요 시 `src/styles.css`
- 테스트: `src/App.test.tsx`, 필요 시 `tests/classroom-emotion-tracker.spec.ts`

### 서브에이전트 흐름

1. Implementer: 선택 상태와 상세 패널 재구성
2. Spec reviewer: “모든 학생 목록 나열”이 아니라 “선택 학생 중심”인지 확인
3. Code quality reviewer: 상태 흐름, 접근성, UI 복잡도 점검

## Task C: 오늘 현황 원형 통계 시각화

### 요구사항

- 오늘 현황 영역에 원형 통계 시각화를 추가한다.
- 현재 분포와 참여율을 직관적으로 읽을 수 있어야 한다.
- 기존 숫자 카드 요약은 유지하되 시각화와 충돌하지 않게 정리한다.
- 학생 수 0이 아닌 일반 사용 조건에서 안정적으로 렌더링되어야 한다.
- 접근 가능한 텍스트 정보는 계속 유지한다.

### 파일 범위

- `src/App.tsx`
- `src/styles.css`
- 필요 시 테스트 보강

### 서브에이전트 흐름

1. Implementer: 차트 UI와 계산 연결
2. Spec reviewer: 원형 시각화가 실제 추가되었는지, 요구 범위 밖 기능이 없는지 확인
3. Code quality reviewer: 레이아웃 안정성, 가독성, 반응형 품질 점검

## 검증 기준

- `vitest` 전체 통과
- `tsc -b` 통과
- `vite build` 통과
- 필요 시 Playwright 스모크 테스트 보강 후 통과

## 완료 정의

- 설계 문서 대비 비어 있던 세 항목이 반영된다.
- 교사 설정과 상세 흐름이 전자칠판 사용 맥락에서 더 단순하고 안전해진다.
- 배포 전 회귀 검증이 가능한 테스트가 남는다.
