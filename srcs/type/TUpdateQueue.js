/**
 * @typedef {Object} TUpdateQueue
 * @description
 * UpdateQueue는 우선 순위가 지정된 업데이트들의 연결 리스트입니다. React 내부에서, UpdateQueue는 화면에 보이는 상태를 나타내는 현재 큐(current queue)와, 커밋되기 전에 비동기적으로 변형되고 처리될 수 있는 작업 중 큐(work-in-progress queue)의 쌍으로 존재합니다. 이는 이중 버퍼링 형태의 일종으로, 작업 중인 렌더링이 완료되기 전에 폐기될 경우, 현재 큐를 복제하여 새로운 작업 중 큐를 생성합니다.

두 큐는 지속적인 단일 연결 리스트 구조를 공유합니다. 업데이트를 스케줄링하기 위해, 우리는 이를 두 큐의 끝에 추가합니다. 각 큐는 아직 처리되지 않은 지속적 리스트의 첫 번째 업데이트를 가리키는 포인터를 유지합니다. 작업 중 큐의 포인터는 항상 현재 큐보다 같거나 더 큰 위치에 있으며, 우리는 항상 그 큐에서 작업합니다. 현재 큐의 포인터는 커밋 단계에서만 업데이트되며, 이때 작업 중인 큐로 교체됩니다.

예를 들어, 현재 포인터가 A-B-C-D-E-F를 가리키고, 작업 중 포인터가 D-E-F를 가리키는 경우, 작업 중 큐는 현재 큐보다 더 많은 업데이트를 처리한 것입니다.

업데이트를 두 큐에 추가하는 이유는 그렇지 않으면 일부 업데이트를 영구적으로 놓칠 수 있기 때문입니다. 예를 들어, 작업 중 큐에만 업데이트를 추가하는 경우, 현재에서 복제하여 작업 중 렌더링이 재시작될 때 일부 업데이트가 손실될 수 있습니다. 마찬가지로, 현재 큐에만 업데이트를 추가하는 경우, 이미 진행 중인 큐가 커밋되어 현재 큐와 교체될 때 업데이트가 손실됩니다. 그러나 두 큐에 추가함으로써, 우리는 업데이트가 다음 작업 중 큐의 일부가 될 것임을 보장합니다.

우선 순위:
업데이트는 우선 순위에 따라 정렬되지 않고 삽입 순으로 배열됩니다. 렌더링 단계에서 업데이트 큐를 처리할 때, 충분한 우선 순위를 가진 업데이트만 결과에 포함됩니다. 우선 순위가 충분하지 않아 건너뛰는 경우, 해당 업데이트는 나중에 더 낮은 우선 순위의 렌더링 동안 처리될 수 있도록 큐에 남아 있습니다. 중요하게, 건너뛴 업데이트 이후의 모든 업데이트도 우선 순위에 관계없이 큐에 남아 있습니다. 이는 높은 우선 순위의 업데이트가 때로는 두 개의 별도 우선 순위에서 두 번 처리될 수 있음을 의미합니다. 또한, 큐에 적용되는 첫 번째 업데이트 이전의 상태를 나타내는 기본 상태도 유지됩니다.

예를 들어, 기본 상태가 ''이고 다음과 같은 업데이트 큐가 주어진 경우

A1 - B2 - C1 - D2

여기서 숫자는 우선 순위를 나타내며, 업데이트는 이전 상태에 문자를 추가하여 적용됩니다. React는 이 업데이트를 두 개의 별도 렌더링으로 처리합니다, 각각 고유한 우선 순위 레벨당 하나씩:

첫 번째 렌더링, 우선 순위 1에서:

기본 상태: ''
업데이트: [A1, C1]
결과 상태: 'AC'
두 번째 렌더링, 우선 순위 2에서:

기본 상태: 'A' (B2가 건너뛰어진 탓에 C1은 포함되지 않음)
업데이트: [B2, C1, D2] (C1이 B2 위에 재배치됨)
결과 상태: 'ABCD'
업데이트가 삽입 순으로 처리되고, 우선 순위가 높은 업데이트가 선행 업데이트가 건너뛰어질 때 재기반됨으로써, 최종 결과는 우선 순위에 관계없이 결정적입니다. 중간 상태는 시스템 자원에 따라 다를 수 있지만, 최종 상태는 항상 동일합니다.
 */

/**
 * @description 해당 로직은 파이버와 updateQueue를 디 커플링하기 위해서 시작 되었고,
 */
import { TExpirationTime } from "./TExpirationTime";
import { TUpdateTag } from "./TUpdateTag";
export const TUpdateState = {
    expirationTime: TExpirationTime,
    // supspenseConfig: null, 해당 부분은 구현을 안할 확률 이 높음
    tag: TUpdateTag,
    payload: any,
    callback: (() => mixed) | null,

    next: TUpdateState | null,
    nextEffect: TUpdateState | null,
};

export const TUpdateQueueState = {
    baseState: any,
    firstUpdate: TUpdateState | null,
    lastUpdate: TUpdateState | null,

    firstCapturedUpdate: TUpdateState | null,
    lastCapturedUpdate: TUpdateState | null,

    firstEffect: TUpdateState | null,
    lastEffect: TUpdateState | null,

    firstCapturedEffect: TUpdateState | null,
    lastCapturedEffect: TUpdateState | null,
};
