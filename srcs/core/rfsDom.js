import {
    batchedUpdates,
    setBatchingImplementation,
    discreteUpdates,
    batchedEventUpdates,
} from "../dom/event/genericBatching.js";
import { setRestoreImplementation } from "../dom/event/controlledComponent";
import { restoreControlledState } from "../dom/core/domComponent.js";
import { flushDiscreteUpdates } from "../work/workloop.js";
import { createRoot } from "../core/createRoot.js";

setRestoreImplementation(restoreControlledState);
setBatchingImplementation(batchedUpdates, discreteUpdates, flushDiscreteUpdates, batchedEventUpdates);
const rfsDOM = {
    unstableBatchedUpdates: batchedUpdates,
    createRoot: createRoot,
};
