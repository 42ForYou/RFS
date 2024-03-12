import { RFS_CONTEXT_TYPE, RFS_PROVIDER_TYPE } from "../core/rfsSymbol.js";
import createContextInst from "./constructor/context.js";
import createProvider from "./constructor/provider.js";

/**
 *
 * @param {any} defaultValue
 * @param {Function | undefined} calculateChangedBits
 * @see ReactNewContext-test.internal.js 1055 line
 *
 * @description - 단순히 context 객체를 생성하는 함수입니다. 그 과정에서
 * Provider와 Consumer를 생성합니다.
 *
 * @description - calculateChangedBits
 *  비트 마스킹을 사용하여 변경되었다면 Context.consumer를 re-render합니다. 그것을
 *  클라이언트 코드에서 조정할 수 있도록 직접 second argument로 넘겨줄 수 있습니다.
 *  관련 링크는 아래에 있습니다.
 * @link https://dev.to/alexkhismatulin/react-context-a-hidden-power-3h8j
 * @returns
 */
const createContext = (defaultValue, calculateChangedBits) => {
    // client Code에서 calculateChangedBits를 넘겨주지 않았다면 null을 할당합니다.
    if (calculateChangedBits === undefined) {
        calculateChangedBits = null;
    }

    // context Object를 생성합니다.
    const context = createContextInst(
        RFS_CONTEXT_TYPE,
        calculateChangedBits,
        defaultValue,
        defaultValue,
        0,
        null,
        null
    );

    // Provider 객체 생성.
    const provider = createProvider(RFS_PROVIDER_TYPE, context);

    // 위에서 생성한 prvider 객체를 할당합니다.
    // e.g. <Context.Provider>...</Context.Provider>
    context.Provider = provider;

    // Consumer에서 context를 사용해야하기 때문에 context를 할당합니다.
    // e.g. <Context.Consumer>...</Context.Consumer>
    context.Consumer = context;

    return context;
};

export default createContext;
