# RFS

React From Scratch
# React From Scratch (RFS) – Advanced Version

**프로젝트 규모:**  
React 16 전반을 깊이 파고들어, 방대한 소스코드를 분석하고 내부 구조를 최대한 재현한 **대규모 학습/구현 프로젝트**입니다.  
Fiber 스케줄러, 합성이벤트(SyntheticEvent), Hooks 등 핵심 기능을 **실사용 가능한 수준**으로 구현하며, 원본 React와의 유사성을 높이기 위해 최선을 다했습니다.

---

## 프로젝트 개요

**RFS (React From Scratch)**는 “React 16이 내부적으로 어떻게 동작하는가?”라는 궁금증에서 출발했습니다.
- **Fiber 아키텍처**와 **비동기 렌더링**: 작업 분할, 우선순위, 유휴 시간 활용
- **Hooks**(`useState`, `useEffect` 등)의 라이프사이클, 의존성 배열 처리
- **합성이벤트 시스템**과 브라우저 호환성
- **Render/Commit 페이즈** 분리 등

React의 **핵심 원리와 구조**를 최대한 동일하게 재현해보는 것이 주된 목표였습니다. 결과적으로 상당히 방대한 코드베이스가 됐으며, 실제로 작동 가능한 데모 앱도 함께 제공하고 있습니다.

> **Note**: 프로젝트가 거의 완성에 가까운 수준이지만, 일부 고난도 기능은 시간 제약으로 인해 후순위로 미뤄두었습니다. 그럼에도 전체적인 학습 목적과 구조 구현은 성공적으로 이뤄냈다고 자부합니다.

---

## 주요 특징 (Key Features)

1. **Fiber Reconciliation**  
   - **Work Loop & Scheduler**: 렌더링 작업을 여러 프레임에 걸쳐 나눠 수행.  
   - **우선순위 기반**: 유저 인터랙션과 애니메이션이 끊기지 않도록 작업 중단/재개를 지원.  
   - **Partial Render**: 긴 렌더 도중에도 이벤트 응답성을 유지.

2. **Hooks 시스템**  
   - `useState`, `useEffect` 같은 **함수형 컴포넌트 중심**의 상태·사이드이펙트 관리 구현.  
   - 의존성 배열 비교 및 cleanup 로직까지 반영해, 실제 React와 유사한 사용 패턴 제공.

3. **합성이벤트 (SyntheticEvent)**  
   - 브라우저별 이벤트 차이를 추상화해 일관된 이벤트 핸들링 가능.  
   - **이벤트 풀링** 등을 통해 성능 최적화 시도.

4. **Render & Commit 단계 분리**  
   - **Render** 단계: Fiber 트리를 탐색하며 바뀔 부분 계산.  
   - **Commit** 단계: DOM 수정 및 레이아웃 관련 사이드이펙트 처리.  
   - React 16 구조와 비슷한 2단계 접근 방식을 구현.

5. **대규모 코드 구조**  
   - Core Scheduler, Reconciler, Renderer-DOM, Hooks 모듈 등으로 분할.  
   - 모듈 간 상호 의존성이 커서 코드 크기가 상당하지만, 구성을 최대한 명료하게 유지.

---

## 구현 과정

1. **React 16 코드 정독**  
   - GitHub 저장소에서 `react-reconciler` 및 `scheduler` 디렉토리 위주로 집중 분석.  
   - Fiber 및 Hooks 관련 커뮤니티 토론, 공식 RFC도 참조.

2. **Fiber 스케줄러 최소 구현**  
   - 재귀 대신 반복(Iterative) 방식으로 렌더링 반복문(Work Loop) 작성.  
   - **시간초과** 또는 **우선순위 높은 작업**이 있을 시 스레드를 양도(yield)하고, 이후 재개.

3. **Reconciliation & Diff**  
   - DOM 상태 변경 최소화를 위해 노드 타입/props 비교 후 필요한 부분만 갱신.  
   - `UpdateQueue`로 관리되는 상태 변경을 Fiber 트리에 propagate.

4. **Hooks 추가**  
   - `useState`, `useEffect`를 먼저 도입해 함수형 컴포넌트 구조 실험.  
   - Commit 단계에서 Effect 실행과 cleanup 반영.

5. **합성이벤트 & 기타 최적화**  
   - SyntheticEvent로 브라우저 이벤트를 커스텀 래핑하고, 풀링 기법으로 재활용.  
   - 이벤트 우선순위나 다른 내부 최적화에도 부분적으로 반영.

6. **마무리 및 향후 계획**  
   - Suspense나 Concurrent Mode(React 18에서 확장된 내용)는 아직 미구현.  
   - 일부 **복잡한 Edge Case**에서 발생하는 UI 갱신 버그가 남아 있으나, 시간 제약으로 완벽히 해결하지 못함.  
   - 그래도 전체 구조와 핵심 로직은 작동 가능 상태로 구현해, 학습 목표는 **충분히 달성**했다고 판단.

---

## 코드 구조 예시

```
rfs/
├── packages/
│   ├── scheduler/        # Fiber 반복문, 우선순위 논리
│   ├── reconciler/       # Diff & Fiber 업데이트
│   ├── renderer-dom/     # 실제 DOM 조작 코드
│   ├── hooks/            # useState, useEffect 등
│   └── synthetic-event/  # 합성이벤트 구현
├── examples/
│   ├── basic-counter/
│   ├── multi-hook-test/
│   └── ...
├── scripts/
│   └── rollup.config.js
├── package.json
└── README.md
```

---

## 빌드 & 실행

1. **클론 및 설치**
   ```bash
   git clone https://github.com/42ForYou/RFS.git
   cd RFS
   npm install
   ```

2. **빌드**
   ```bash
   npm run build
   # rollup 기반 번들, dist 폴더에 결과물 생성
   ```

3. **샘플 예제 실행**
   ```bash
   npm run start
   # 또는 'examples' 폴더의 HTML 파일 직접 열기
   ```

4. **결과 확인**
   - 브라우저 콘솔에서 Fiber 스케줄링 로그나 Hook 업데이트 흐름 확인 가능
   - 별도 dev server 없이도 /examples/*.html 열면 즉시 시연 가능

---

## 현재 상태 & 계획

- **성공적으로 구현된 부분**: Fiber 기반 스케줄러, Hooks(`useState`, `useEffect`), Event 합성, DOM Diff 등 대부분의 핵심 로직.
- 학습 목적으로는 **이미 충분한 완성도**를 달성했지만, 높은 수준의 프로덕션 환경을 목표로 하려면 더 많은 테스트와 디버깅이 필요합니다.
- 짧은 시간 안에 React 16 코어 로직을 재현한다는 점 자체가 도전이었고, 그중에서도 정말 중요한 부분(렌더링 스케줄러, 상태 관리, 이벤트 처리)만큼은 **실질적으로 학습 목표를 달성**했기에 이 프로젝트는 성공적이라 자부합니다.

---

## 결론 (What We Learned)

1. **React 16 핵심 구조 & 최적화 로직 체득**  
   Fiber를 통한 비동기 처리, Hook의 상태 저장 메커니즘, DOM Diff 전략 등 큰 그림을 실제 코드로 구현하면서 기술적 통찰을 얻었습니다.

2. **대규모 오픈소스 분석 & 부분 재현 역량**  
   원본 React의 복잡한 코드 중 어디가 필수인지 골라내고, 필요 시 단순화/수정하는 과정에서 대규모 소프트웨어를 해석·압축하는 능력을 기를 수 있었습니다.

3. **추후 확장 가능성**  
   남아 있는 버그나 미구현 기능(Concurrent Mode, Suspense 등)을 해결하며 더 발전시킬 계획이 있으며, 이미 코드 구조상 확장과 유지보수에 유리하게 설계해뒀습니다.
