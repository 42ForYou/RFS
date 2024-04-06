import { injection as EventPluginHubInjection } from "../event/eventPluginHub.js";
import { setComponentTree } from "../event/eventPluginUtil.js";

import {
    getFiberCurrentPropsFromNode,
    getInstanceFromNode,
    getNodeFromInstance,
} from "../core/domComponentConnection.js";
import BeforeInputEventPlugin from "../event/EventPlugin/beforeInputEventPlugin.js";
import ChangeEventPlugin from "../event/EventPlugin/changeEventPlugin.js";
import DOMEventPluginOrder from "../event/EventPlugin/eventPluginOrder.js";
import EnterLeaveEventPlugin from "../event/EventPlugin/enterLeaveEventPlugin.js";
import SelectEventPlugin from "../event/EventPlugin/selectEventPlugin.js";
import SimpleEventPlugin from "../event/EventPlugin/simpleEventPlugin.js";

/**
 * Inject modules for resolving DOM hierarchy and plugin ordering.
 */
EventPluginHubInjection.injectEventPluginOrder(DOMEventPluginOrder);
setComponentTree(getFiberCurrentPropsFromNode, getInstanceFromNode, getNodeFromInstance);

/**
 * Some important event plugins included by default (without having to require
 * them).
 */
EventPluginHubInjection.injectEventPluginsByName({
    SimpleEventPlugin: SimpleEventPlugin,
    EnterLeaveEventPlugin: EnterLeaveEventPlugin,
    ChangeEventPlugin: ChangeEventPlugin,
    SelectEventPlugin: SelectEventPlugin,
    BeforeInputEventPlugin: BeforeInputEventPlugin,
});
