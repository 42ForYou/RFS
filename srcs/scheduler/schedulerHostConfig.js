const performance = window.performance;
const Date = window.Date;
const setTimeout = window.setTimeout;
const clearTimeout = window.clearTimeout;

const getCurrentTime = () => performance.now();

const requestAnimationFrame = window.requestAnimationFrame;
const cancelAnimationFrame = window.cancelAnimationFrame;

let isMessageLoopRunning = false;
const scheduledHostCallback = null;
let taskTimeoutID = -1;

// 스케줄러는 메인 스레드에 다른 작업이 있을 경우 주기적으로 양보합니다.
// 스레드에 다른 작업이 있을 경우 주기적으로 산출합니다. 기본적으로 프레임당 여러 번 산출합니다.
//   대부분의 작업은 프레임 경계에 맞춰 정렬할 필요가 없으므로 // 프레임 경계에 맞춰 정렬을 시도하지 않습니다.
// 프레임에 맞춰 정렬할 필요가 없으므로 프레임에 맞춰 정렬할 필요가 있는 작업은 요청애니메이션프레임을 사용합니다.
const yieldInterval = 5;
const deadline = 0;

const maxYieldInterval = 300;
let needsPaint = false;

let shouldYieldToHost;

if (
    navigator !== undefined &&
    navigator.scheduling !== undefined &&
    navigator.scheduling.isInputPending !== undefined
) {
    const scheduling = navigator.scheduling;
    shouldYieldToHost = () => {
        const currentTime = getCurrentTime();
        if (currentTime >= deadline) {
            // 시간이 없습니다. 메인 스레드에 대한 제어권을 양보하고 싶을 수 있습니다.
            // 스레드의 제어권을 넘겨주어 브라우저가 우선순위가 높은 작업을 수행할 수 있도록 합니다. 주요 작업은
            // 페인팅과 사용자 입력입니다. 보류 중인 페인트가 있거나 대기 중인
            // 입력이 있다면 양보해야 합니다. 하지만 둘 다 없는 경우, 응답성을 유지하면서
            // 응답성을 유지하면서 양보하는 빈도를 줄일 수 있습니다. 결국에는 양보할 것입니다.
            // 보류 중인 페인트가 있을 수 있기 때문입니다.
            // 요청 페인트' 호출이나 다른 메인 스레드 작업과 함께 // 수반될 수 있기 때문에
            // 네트워크 이벤트와 같은 다른 메인 스레드 작업이 있을 수 있기 때문입니다.
            if (navigator.scheduling.isInputPending()) {
                return true;
            }
            // There's no pending input. We can yield.
            return currentTime >= maxYieldInterval;
        } else {
            // There's time left. No need to yield.
            return false;
        }
    };

    requestPaint = () => {
        needsPaint = true;
    };
} else {
    // `isInputPending` is not available. Since we have no way of knowing if
    // there's pending input, always yield at the end of the frame.
    shouldYieldToHost = () => {
        return getCurrentTime() >= deadline;
    };

    // Since we yield every frame regardless, `requestPaint` has no effect.
    requestPaint = () => {};
}

const performWorkUntilDeadline = () => {
    if (scheduledHostCallback !== null) {
        const currentTime = getCurrentTime();
        // vsync 주기의 위치에 관계없이 `yieldInterval` ms 이후에는 수율을 산출합니다.
        // 사이클의 어디에 있든 상관없습니다. 즉, 메시지 이벤트의 시작 부분에는 항상
        // 메시지 이벤트가 시작될 때까지 항상 시간이 남아 있습니다.
        deadline = currentTime + yieldInterval;
        const hasTimeRemaining = true;
        try {
            const hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
            if (!hasMoreWork) {
                isMessageLoopRunning = false;
                scheduledHostCallback = null;
            } else {
                // 여전히 예약된 작업이 남아 있습니다. 다음 메시지 이벤트에서 계속합니다.
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

const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;

const requestHostCallback = (callback) => {
    scheduledHostCallback = callback;
    if (!isMessageLoopRunning) {
        isMessageLoopRunning = true;
        port.postMessage(null);
    }
};

const cancelHostCallback = () => {
    scheduledHostCallback = null;
};

const requestHostTimeout = (callback, ms) => {
    taskTimeoutID = setTimeout(() => {
        callback(getCurrentTime());
    }, ms);
};

const cancelHostTimeout = () => {
    clearTimeout(taskTimeoutID);
    taskTimeoutID = -1;
};
