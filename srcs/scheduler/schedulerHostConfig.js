const performance = window.performance;
const Date = window.Date;
const setTimeout = window.setTimeout;
const clearTimeout = window.clearTimeout;

const getCurrentTime = () => performance.now();

const requestAnimationFrame = window.requestAnimationFrame;
const cancelAnimationFrame = window.cancelAnimationFrame;

let isMessageLoopRunning = false;
let scheduledHostCallback = null;
let taskTimeoutID = -1;

// 스케줄러는 메인 스레드에 다른 작업이 있을 경우 주기적으로 양보합니다.
// 스레드에 다른 작업이 있을 경우 주기적으로 산출합니다. 기본적으로 프레임당 여러 번 산출합니다.
//   대부분의 작업은 프레임 경계에 맞춰 정렬할 필요가 없으므로 // 프레임 경계에 맞춰 정렬을 시도하지 않습니다.
// 프레임에 맞춰 정렬할 필요가 없으므로 프레임에 맞춰 정렬할 필요가 있는 작업은 요청애니메이션프레임을 사용합니다.

//현재 시간으로써 yield까지의 시간을 나타냅니다. 여기선 5ms로 설정하는데
//이 시간에 의미는 리액트는 기본적으로 한 프레임 내에서 여러번 제어권을 양보할 수 있도록 제공하는데
//양보하는 interval을 의미합니다.
const yieldInterval = 5;

//양보를 요청할떄 isInputPending이 있는 경우 양보를 api를 통해 최대한 미루는데,
//이때 최대한 미루는 시간을 의미합니다.
const maxYieldInterval = 300;

//paint가 필요한지를 나타내는 변수입니다.
let needsPaint = false;

let startTime = -1;
//연속적인 입력을 받을때의 interval을 나타냅니다.
const continousInputInterval = 50;
//연속적인 입력을 받을때 inputIsPending을 통해 원하는 입력이 있는지 확인할때 사용되는 옵션입니다.
const continousOptions = { includeContinuous: true };
//일반적으로 isInputpending은 페이스북에서 만든 api로써 chronium기반의 브라우저에서만 사용가능합니다.
//만약 없으면 없는 버전의 shouldYieldToHost를 사용합니다.
const isInputPending =
    typeof navigator !== "undefined" &&
    navigator.scheduling !== undefined &&
    navigator.scheduling.isInputPending !== undefined
        ? navigator.scheduling.isInputPending.bind(navigator.scheduling)
        : null;

/**
 * @description 참고: https://engineering.fb.com/2019/04/22/developer-tools/isinputpending-api/
 * @description  메인 스레드에 대한 제어권을 양보할지 여부를 결정하는 함수입니다.
 * @description  스레드의 제어권을 넘겨주어 브라우저가 우선순위가 높은 작업을 수행할 수 있도록 합니다. 주요 작업은
 * @description  페인팅과 사용자 입력입니다. 보류 중인 페인트가 있거나 대기 중인
 * @description  입력이 있다면 양보해야 합니다. 하지만 둘 다 없는 경우, 응답성을 유지하면서
 * @description  응답성을 유지하면서 양보하는 빈도를 줄일 수 있습니다. 결국에는 양보할 것입니다.
 * @description  보류 중인 페인트가 있을 수 있기 때문입니다.
 * @description  요청 페인트' 호출이나 다른 메인 스레드 작업과 함께 // 수반될 수 있기 때문에
 * @description  네트워크 이벤트와 같은 다른 메인 스레드 작업이 있을 수 있기 때문입니다.
 * @returns {boolean}
 */
const shouldYieldToHost = () => {
    const timeElapsed = getCurrentTime() - startTime;
    if (timeElapsed < yieldInterval) {
        // The main thread has only been blocked for a really short amount of time;
        // smaller than a single frame. Don't yield yet.
        return false;
    }
    // 메인 스레드가 무시할 수 없는 시간 동안 차단되었습니다. We
    // 브라우저가 우선순위가 높은 작업을 수행할 수 있도록 메인 스레드에 대한 제어권을 양보할 수 있습니다.
    // 우선순위가 높은 작업을 수행할 수 있습니다. 주요 작업은 페인팅과 사용자 입력입니다. 만약
    // 보류 중인 페인트나 보류 중인 입력이 있다면 양보해야 합니다. 하지만
    // 둘 다 없다면 응답성을 유지하면서 양보하는 빈도를 줄일 수 있습니다. 우리는
    // 보류 중인 페인트가 있을 수 있으므로 결국 양보해야 합니다.
    // 요청 페인트' 호출이나 다른 메인 스레드 작업(예: 네트워크 이벤트)이 수반되지 않았거나
    // 네트워크 이벤트와 같은 다른 메인 스레드 작업이 있을 수 있기 때문입니다.
    if (needsPaint) {
        return true;
    }
    if (timeElapsed < continousInputInterval) {
        // 그렇게 오랫동안 스레드를 차단한 적이 없습니다. 보류 중인 개별 입력(예: 클릭)이 있는 경우에만
        // 보류 중인 개별 입력(예: 클릭)이 있는 경우에만 양보합니다. 보류 중인 연속 입력이 있어도 괜찮습니다.
        // 연속 입력(예: 마우스오버)이 있어도 괜찮습니다.
        if (isInputPending !== null) {
            return isInputPending();
        }
    } else if (timeElapsed < maxYieldInterval) {
        // Yield if there's either a pending discrete or continuous input.
        if (isInputPending !== null) {
            return isInputPending(continousOptions);
        }
    } else {
        // 오랫동안 스레드를 차단했습니다. 보류 중인 입력이 없더라도
        // 입력이 없더라도 우리가 모르는 다른 예정된 작업이 있을 수 있습니다,
        // 네트워크 이벤트와 같은 다른 작업이 있을 수 있습니다. 지금 양보하세요.
        return true;
    }
};

/**
 * @description paint를 해야된다라고 요청합니다.
 */
const requestPaint = () => {
    if (isInputPending) {
        needsPaint = true;
    }
};

/**
 * @description flushWork를 deadline까지 수행합니다.
 * @description 해당 함수가 브라우저와 리액트간의 시분할 수행을 가능하게 하는 메인 로직입니다.
 * @description 해당 내에서 불러지는 workLoop내에서 shouldYieldToHost를 통해 브라우저간의 제어권 시분할을 수행합니다.
 * @descrption scheduleCallback에 들어가는 함수는 flushWork입니다.
 */
const performWorkUntilDeadline = () => {
    if (scheduledHostCallback !== null) {
        const currentTime = getCurrentTime();
        // vsync 주기의 위치에 관계없이 `yieldInterval` ms 이후에는 수율을 산출합니다.
        // 사이클의 어디에 있든 상관없습니다. 즉, 메시지 이벤트의 시작 부분에는 항상
        // 메시지 이벤트가 시작될 때까지 항상 시간이 남아 있습니다.
        startTime = currentTime;
        const hasTimeRemaining = true;
        try {
            const hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
            if (!hasMoreWork) {
                isMessageLoopRunning = false;
                scheduledHostCallback = null;
            } else {
                // 여전히 예약된 작업이 남아 있습니다. 다음 메시지 이벤트에서 계속합니다.
                //이 수행은 다시 performWorkUntilDeadline를 호출합니다. 이 비동기 요청은
                //매크로 태스크큐에 들어가게 되고 해당 매크로 태스크큐는 paint보다 우선순위가 낮아
                //paint에게 제어권을 양보가능합니다.
                // There's still work remaining. Reschedule the next message event to
                // keep working.
                port.postMessage(null);
            }
        } catch (error) {
            // If a scheduler task throws, exit the current browser task so the
            // error can be observed.
            port.postMessage(null);
            throw error;
        }
    } else {
        isMessageLoopRunning = false;
    }
    // Yielding to the browser will give it a chance to paint, so we can
    // reset this.
    //사이클이 돌았음으로  needsPaint를 false로 초기화합니다.
    needsPaint = false;
};

//해당 부분에서 setTimeout이 아닌 MessageChannel을 사용하는 이유는
//일반적인 setTimeout에게는 4ms의 지연시간이 있기 때문에 단순히 매크로 태스크큐에 일을 요청하는
//부분에는 좀 더 빠른 매크로태스큐에 푸시하기위해 MessageChannel을 사용합니다.
const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;

/**
 * @description scheduleHostCallback에 해당 callback을 집어넣고
 * @description messageChannel을 통해 performWorkuntilDeadline이 해당 callback(flushwork)를 수행하게 합니다.
 * @param {Function} callback
 */
const requestHostCallback = (callback) => {
    scheduledHostCallback = callback;
    if (!isMessageLoopRunning) {
        isMessageLoopRunning = true;
        port.postMessage(null);
    }
};

/**
 * @description 해당 callback을 null로 초기화합니다.
 * @description 기본적인 태스크를 peek할시 callback이 null이면 해당 태스크를 수행하지 않는것을 이용하여 취소합니다.
 */

const cancelHostCallback = () => {
    scheduledHostCallback = null;
};

/**
 * @description 해당 host에게 해당 콜백을 ms만큼의 시간이 지난후에 수행하라고 요청합니다.
 * @param {Function} callback
 * @param {number} ms
 */
const requestHostTimeout = (callback, ms) => {
    taskTimeoutID = setTimeout(() => {
        callback(getCurrentTime());
    }, ms);
};

/**
 * @description 해당 host에게 가장 최근에 요청한 타임아웃을 취소합니다.
 */
const cancelHostTimeout = () => {
    clearTimeout(taskTimeoutID);
    taskTimeoutID = -1;
};
