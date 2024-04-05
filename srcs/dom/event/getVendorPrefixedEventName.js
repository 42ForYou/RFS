//NOTE: ex)
// {
//     "transition": "transitionend",
//     "WebkitTransition": "webkittransitionend",
//     "MozTransition": "moztransitionend"
//   }
/**
 *
 * @param {*} styleProp
 * @param {*} eventName
 * @returns {}
 * @description venderPrefix문제를 위해 사용되는 함수입니다. 최신 브라우저는 접두사 없이 진행되는 경우도 많지만
 * @description 특히 css관련해서 해당 props가 브라우저 마다 다른 경우를 고려합니다. 예를들어 css Transition과 같은 예시가
 * @description 존재할 수 있습니다.
 */
const makePrefixMap = (styleProp, eventName) => {
    const prefixes = {};

    //general
    prefixes[styleProp.toLowerCase()] = eventName.toLowerCase();
    //chronium(safari, chrome, opera)
    prefixes["Webkit" + styleProp] = "webkit" + eventName;
    //mozilla(firefox)
    prefixes["Moz" + styleProp] = "moz" + eventName;

    return prefixes;
};

/**
 * @description 벤더 프리픽스로 문제되는 4가지 종류의 이벤트를 처리하기 위한 객체입니다.
 * @description 이는 만약 최신 브라우저가 접두사 없이 진행된다면 map에서 해당 이벤트를 제거합니다.
 */
const vendorPrefixes = {
    animationend: makePrefixMap("Animation", "AnimationEnd"),
    animationiteration: makePrefixMap("Animation", "AnimationIteration"),
    animationstart: makePrefixMap("Animation", "AnimationStart"),
    transitionend: makePrefixMap("Transition", "TransitionEnd"),
};

//prefixedEventNames는 이미 한번 계산 되어 처리되고 캐시된 이벤트 이름을 저장합니다.
const prefixedEventNames = {};

const style = document.createElement("div").style;
// AnimationEvent와 TransitionEvent 객체가 window 객체에 존재하는지 확인합니다.
//  이 객체들이 존재한다는 것은 브라우저가 해당 이벤트를 접두사 없이 지원한다는 의미입니다.
// 만약 이 객체들이 존재하지 않는다면, 즉 접두사 없는 이벤트를 지원하지 않는다면,
// vendorPrefixes 객체에서 관련 이벤트 핸들러 매핑을 제거합니다.
// 이는 실제 이벤트가 접두사를 포함하여 발생할 수 있음을 의미하며, 접두사 없는 이벤트 이름으로는 이벤트를 올바르게 처리할 수 없기 때문에 매핑에서 제거하는 것입니다.
if (!("AnimationEvent" in window)) {
    delete vendorPrefixes.animationend.animation;
    delete vendorPrefixes.animationiteration.animation;
    delete vendorPrefixes.animationstart.animation;
}

if (!("TransitionEvent" in window)) {
    delete vendorPrefixes.transitionend.transition;
}

/**
 *
 * @param {*} eventName
 * @returns {}
 * @description 이벤트 이름을 받아서 venderPrefix를 고려하여 알맞은 이벤트 이름을 반환합니다.
 */
export const getVendorPrefixedEventName = (eventName) => {
    if (prefixedEventNames[eventName]) {
        //prefixed에 캐시된 이벤트 이름이 있다면 반환합니다.
        return prefixedEventNames[eventName];
    } else if (!vendorPrefixes[eventName]) {
        //만약 vendorPrefixes에 이벤트 이름이 없다면 그냥 반환합니다.
        return eventName;
    }

    //캐시된 이벤트도 없고, venderPrefixes에 이벤트 이름이 있다면
    //캐시를 진행하고 해당 이벤트 이름을 반환합니다.
    const prefixMap = vendorPrefixes[eventName];

    for (const styleProp in prefixMap) {
        //맵에서 찾은 결과를 순회하면서 찾고 캐쉬하고 반환합니다.
        if (prefixMap.hasOwnProperty(styleProp) && styleProp in style) {
            return (prefixedEventNames[eventName] = prefixMap[styleProp]);
        }
    }
    //벤더 프리픽스로 생성해본 결과가 style에 없다면 그냥 반환합니다.
    return eventName;
};
