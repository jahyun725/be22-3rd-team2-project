
  # Kanban-Flow (Vue.js Refactor Project)

  Kanban-Flow는 팀의 업무 흐름을 시각적으로 관리하고 협업 효율성을 극대화하기 위해 개발된 웹 애플리케이션입니다.
  기존 React 기반 프로젝트를 Vue 3 (Composition API) + Tailwind CSS 환경으로 리팩토링했으며, JSON Server를 도입해 REST API 통신 환경을 구성했습니다.

## 1. 프로젝트 개요 (Project Overview)
- 프로젝트 기간: 2024.02.01 (리팩토링 기준)
- 개발 인원: 4명
- 기술 스택
  - Frontend: Vue.js 3, JavaScript (ESM + Vanilla JS), Vite
  - Styles: Tailwind CSS v3
  - State Management: Pinia
  - Backend (Mock): JSON Server, Axios

## 2. 주요 기능 (Key Features)
- 업무 관리 (Task Management)
  - CRUD 기능: 모달을 통해 업무 생성/조회/수정/삭제
  - 상태 관리: Todo / In Progress / Done 3단계
- Drag & Drop 워크플로우
  - 칸반 보드: 드래그로 컬럼 이동
  - 실시간 상태 반영 + 활동 로그 기록
- 필터링 및 검색
  - 담당자/중요도 기반 필터
- 활동 로그 (Activity Logs)
  - 생성/수정/이동/삭제 이력 자동 기록
  - 액션별 색상 코드로 가독성 강화

## 3. 주요 성과 및 성공 사례 (Key Achievements)
- 성공적인 마이그레이션 (React → Vue 3)
  - 상태 관리 구조를 Pinia 중심으로 재설계해 복잡도 감소
  - TypeScript 제거 및 Vanilla JS 전환으로 진입 장벽 완화
- 성능 최적화 및 최신 기술 도입
  - localStorage 기반 데이터를 JSON Server로 분리해 FE/BE 협업 구조 모사

## 4. 트러블 슈팅 (Troubleshooting)
### 이슈 1) 컬럼 간 드래그 오류 (Cannot read properties of null) / 드롭 후 원위치 복귀
- 증상: 컬럼 이동 실패, 카드 원위치 복귀, 콘솔에 index/element null 에러
- 원인: 드래그 컨텍스트 DOM 매핑 불안정 + 드래그 중 재분배 로직이 결과 덮어씀
- 해결
  - Column 컴포넌트: tasks 기본값 추가, group 명시, item 슬롯 DOM 래핑
  - Board 로직: 드래그 중 재분배 방지, drag start/end 이벤트 연결
- 결과: 컬럼 이동 정상화, 컨텍스트 오류 제거

### 이슈 2) 드래그 후 활동 로그가 사라짐
- 증상: 드래그 직후 로그가 표시되나 1~2초 후 사라짐
- 원인: json-server가 db.json 갱신 → Vite가 감지 → 자동 리로드로 상태 초기화
- 해결: `vite.config.js`에서 `server.watch.ignored: ['**/db.json']` 설정
- 결과: 로그 유지

### 이슈 3) 로그가 서버엔 저장되는데 UI에 안 뜸
- 증상: POST 성공 후 UI 미표시/간헐적 사라짐
- 원인: POST 이후 UI 반영 타이밍 문제 + fetch 결과가 빈 배열로 덮어씀
- 해결: POST 성공 시 즉시 prepend + 빈 배열일 때 덮어쓰기 방지
- 결과: 서버 저장과 UI 동기 반영

## 5. 팀 회고 (Retrospective)
| 이름 | 역할 (Role) | KPT 회고 (Keep / Problem / Try) | 한 줄 소감 |
| --- | --- | --- | --- |
| 김선일 | UX 흐름(일정/대시보드) | Vue.js로 칸반 보드를 완성하며, 막막했던 프레임워크의 개념을 실전 프로젝트를 통해 내 것으로 만드는 값진 경험을 했습니다. 미리 작성한 요구사항 정의서와 설계 덕분에 짧은 기간임에도 효율적으로 협업할 수 있었고, 팀원들과 소통하며 에러를 해결하는 과정에서 동료와 함께 성장하는 즐거움을 배웠습니다. 비록 상태 관리나 UX 디테일 면에서 아쉬움은 남지만, 우리 힘으로 서비스를 완주해내며 개발자로서 한 단계 더 성장할 수 있었던 소중한 시간이었습니다. |
| 강성훈 | 코드변환 / 리팩토링 | 지금까지 배웠던 Vue Router와 Pinia를 이번 단위 프로젝트에서 적극 활용해보면서, Vue.js를 제대로 경험할 수 있는 좋은 기회가 되었습니다. 백엔드 프로젝트에서는 보통 DB에 데이터를 요청하고 응답을 받아 처리하는 흐름이 중심이었다면, 프론트에서는 state(앱이 기억하고 있는 값) 를 기준으로 관리하고, 필요한 값을 getter로 꺼내 화면에 반영하는 방식이 오히려 Java에서 객체/값을 다루는 감각과 비슷하다고 느꼈습니다.
또한 화면을 구성할 때도 단일 요소만 만드는 게 아니라, 한 화면을 여러 컴포넌트(Component) 로 나누고 조합하면서 UI/UX를 설계하는 과정이 정말 새롭고 흥미로웠습니다. 현재 진행 중인 사이드 프로젝트에도 이번 프로젝트에서 배운 Vue.js 활용 경험을 적극 반영할 예정이며, 기회가 된다면 React나 TypeScript에도 도전해보려 합니다.  |
| 정진호 | 버그 개선 / 안정회  | 기존 코드를 리팩토링하며 마주한 수많은 에러들을 해결하는 과정이 치열했던 만큼, 한층 더 안정적이고 완성도 높은 결과물을 내놓게 되어 개발자로서 큰 자부심을 느낍니다. |
| 황자현 | Figma / UI 설계 |  이번 프로젝트는 단순히 주어진 기능을 만드는 것을 넘어, 어떤 구조가 가장 효율적일까를 설계 단계에서부터 고민하고 이를 직접 코드로 옮겨본 과정이었습니다. 특히 Pinia와 Router를 실전에서 다뤄보며 프론트엔드 전반에 대한 이해도를 높였습니다. 백엔드 개발자를 준비하는 입장에서, 화면단에서 데이터가 어떻게 관리되고 흘러가는지 직접 코딩하며 체득한 귀중한 경험이었습니다. |

## 6. 실행 방법 (How to Run)
서버와 클라이언트를 동시에 실행해야 합니다.

### Mock Server 실행 (터미널 1)
```
npm run server
```

### Client 실행 (터미널 2)
```
npm run dev
```

### 동시에 실행
```
npm run dev:full
```

## Reference
Original design: https://www.figma.com/design/eOhfJi47MlLhdUl8joHW8J/kaban_v2
