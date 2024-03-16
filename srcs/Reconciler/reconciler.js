/**
 * @module Reconciler
 * @description 해당 파일은 Reconciler에 대한 모듈입니다.
 * @description 모듈 과 관련해서 모듈 변수 객체가 정의되어 있고, 해당 객체는 모듈 스코프에서 관리됩니다
 */

import { enqueueUpdate, createUpdate } from "../core/UpdateQueue.js";
import { scheduleWork, requestCurrentTimeForUpdate, computeExpirationForFiber } from "../work/workloop.js";
/**
 *
 * @param {TRfsNodeList} element @see 파일경로: [TRfsType.js](srcs/type/TRfsType.js)
 * @param {TFiberRoot} container @see 파일경로: [TFiberRoot.js](srcs/tye/TFiberRoot.js)
 * @param {TRFSComponent} _parentComponent
 * @param {TLambda} callback
 * @returns {TExpirationTime} @see 파일경로: [TExpirationTime.js](srcs/type/TExpirationTime.js)
 * @description 해당 함수는 우리가 일반적으로 쓰는 const root= ReactDOM.createRoot(container)이후
 * @description root.render(<App/>)을 호출하면 해당 함수가 호출됩니다.
 * @description 앞선 설명과 같이 우리는 짐입점이 되는 container에 App을 렌더링하길 원합니다. 여기서 App=element입니다.
 * @description 이전 root안에 FiberRoot가 container가 됩니다.
 */

//Order:
//root.render(<App/>)
//*-*ReactDOMRoot.render(<App/>)
//*-**-*updateContainer(<App/>, root, null, null)

//NOTE: parentComponent의 경우 Portal과 서버사이드 렌더링을 위한 것으로 보임.
//TODO: 만약 해당 인자가 정말 그것 두가지만을 위한 것이라면 삭제 예정.
export const updateContainer = (
    element,
    container,
    // parentComponent,
    callback
) => {
    //fiberRoot.current를 통해 현재 FiberRoot의 파이버를 가져옵니다.
    const current = container.current;
    //현재 리액트에서의 시간을 가져옵니다. 이는 뒤에서 우선순위를 정할때 사용되는 ExpirationTime을 계산할때 사용됩니다.
    const currentTime = requestCurrentTimeForUpdate();
    //앞선 currentTime을 기반으로 해당 파이버의 우선순위와 관련된 정보인 ExpirationTime을 계산합니다.
    const expirationTime = computeExpirationForFiber(currentTime, current);
    //TODO: 정확히 여기가 어떤 문맥을 가지는 지 정의 필요->아마 구현 안해도 될것으로보임
    //예측 :: 부모 컴포넌트의 문맥을 가져오는 것으로 보임
    // const context = getContextForSubtree(parentComponent);
    // if (container.context === null) {
    //     container.context = context;
    // } else {
    //     container.pendingContext = context;
    // }
    //그렇게 되면 해당 파이버에 업데이틀 보관하고 있는 updateQueue에 업데이트를 추가해야합니다.
    //그에 들어갈 Update객체를 생성합니다
    const update = createUpdate(expirationTime);

    //그 Update객체에 우리가 원하는 element:(예: <App/>)를 추가합니다.
    //updateContainer가 추가로 받은 callback이 있다면 해당 callback도 추가합니다.
    update.payload = { element };
    update.callback = callback;

    //updateQueue에 해당 업데이트를 추가합니다.
    enqueueUpdate(current, update);

    //스케줄러에게 해당 파이버에 대한 작업을 스케줄링하라고 요청합니다.
    //이는 workLoop모듈에서 처리됩니다
    scheduleWork(current, expirationTime);

    return expirationTime;
};
