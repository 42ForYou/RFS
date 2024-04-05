/**
 * @description
 * 항목들의 "축적물"인 배열 arr을 처리합니다. 이는 배열 또는 단일 항목일 수 있습니다.
 * `accumulate` 모듈과 함께 사용될 때 유용합니다. 이 간단한 유틸리티를 통해
 * 항목들의 컬렉션에 대해 추론할 수 있으며, 정확히 하나의 항목이 있는 경우를 처리할 수 있습니다
 * (배열을 할당할 필요가 없습니다).
 * @param {array} arr 항목들의 "축적물"로, 배열 또는 단일 항목입니다.
 * @param {function} cb 각 요소 또는 컬렉션과 함께 호출되는 콜백 함수.
 * @param {?} [scope] 콜백에서 `this`로 사용될 범위.
 */
const forEachAccumulated = (arr, cb, scope) => {
    if (Array.isArray(arr)) {
        arr.forEach(function (elem) {
            cb.call(scope, elem);
        });
    } else if (arr) {
        cb.call(scope, arr);
    }
};

export default forEachAccumulated;
