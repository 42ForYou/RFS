/**
 * @file RfsSymbol.js
 * @description RfsElement의 $$typeof를 정의하기 위한 파일입니다.
 */
//기본적으로 jsx를 기본으로 ui를 정의할 떄 외부의 공격으로부터의 보안은 ui프레임워크에게 중요한 부분입니다.
//현재 브라우저에서 innerHTMl을 통한 공격은 막혀있지만,(최신 브라우저는 innerHTML을 통해서 들어오는 스크립트 태그를 실행하지 않는다.)
//여전히 서버나 외부 api환경으로 부터 받은 jsx내부의 구멍이 뚫려있는 경우가 있습니다.
//이와 마찬가지라 img로더나 이러한 이벤트헨들러를 통한 공격도 여전히 존재합니다. 이를 막기 위해서
//외부 jsx는 심볼을 넣을 수가 없음으로, 이는 해당 처음 브라우저 로딩시에만 정의되는 심볼을 넣어서 보안을 진행할 수 있습니다.
//그렇다면 rfs내부에서 객체를 만드는 시스템에 symbol을 검사하여 symbol이 맞는지 확인하여 보안을 진행할 수 있습니다.
export const RFS_ELEMENT_TYPE = Symbol.for("rfs.element");
export const RFS_FRAGMENT_TYPE = Symbol.for("rfs.fragment");
export const RFS_PROVIDER_TYPE = Symbol.for("rfs.provider");
export const RFS_CONTEXT_TYPE = Symbol.for("rfs.context");
export const RFS_MEMO_TYPE = Symbol.for("rfs.memo");

const MAYBE_ITERATOR_SYMBOL = typeof Symbol === "function" && Symbol.iterator;

/**
 *
 * @param {object} maybeIterable
 * @returns {Iterable}
 * @description 이 함수는 객체가 iterable이면 iterator를 반환하고, 아니면 null을 반환합니다.
 */
export const getIteratorFn = (maybeIterable) => {
    if (maybeIterable === null || typeof maybeIterable !== "object") {
        return null;
    }
    const maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL];
    if (typeof maybeIterator === "function") {
        return maybeIterator;
    }
    return null;
};
