import { popHostContainer, popHostContext } from "../fiber/fiberHostContext.js";
import { popProvider } from "../context/newContext.js";
import { HostRoot, HostComponent, ContextProvider } from "../const/CWorkTag.js";
export const unwindInterruptedWork = (interruptedWork) => {
    switch (interruptedWork.tag) {
        case HostRoot: {
            popHostContainer();
            break;
        }
        case HostComponent: {
            popHostContext();
            break;
        }
        case ContextProvider:
            popProvider(interruptedWork);
            break;
        default:
            break;
    }
};
