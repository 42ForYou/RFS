import { RFS_CONTEXT_TYPE, RFS_PROVIDER_TYPE } from "../core/rfsSymbol.js";
import createContextInst from "./constructor/context.js";
import createProvider from "./constructor/provider.js";

/**
 *
 * @param {any} defaultValue
 * @see ReactNewContext-test.internal.js 1055 line
 *
 * @description - 단순히 context 객체를 생성하는 함수입니다. 그 과정에서
 * Provider와 Consumer를 생성합니다.
 *
 * @link https://dev.to/alexkhismatulin/react-context-a-hidden-power-3h8j
 * @returns
 */
const createContext = (defaultValue) => {
    // context Object를 생성합니다.
    const context = createContextInst(RFS_CONTEXT_TYPE, defaultValue, defaultValue, 0, null, null);

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
