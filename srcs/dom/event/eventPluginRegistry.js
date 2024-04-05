/**
 * @description 이벤트 플러그인의 주입 가능한 순서.
 */
let eventPluginOrder = null;

/**
 * @description name으로 event plugin 모듈을 매핑합니다.
 */
const namesToPlugins = {};
/**
 *
 * @param {string} registrationName Registration name to add.
 * @param {object} PluginModule Plugin publishing the event.
 * @description 발행된 이벤트를 식별하는 데 사용되는 등록 이름을 publish합니다.
 */
const publishRegistrationName = (registrationName, pluginModule, eventName) => {
    registrationNameModules[registrationName] = pluginModule;
    registrationNameDependencies[registrationName] = pluginModule.eventTypes[eventName].dependencies;
};
/**
 *
 * @param {object} dispatchConfig Dispatch configuration for the event.
 * @param {object} PluginModule Plugin publishing the event.
 * @return {boolean} True if the event was successfully published.
 * @description 플러그인이 제공하는 이벤트를 publish합니다.
 */
const publishEventForPlugin = (dispatchConfig, pluginModule, eventName) => {
    eventNameDispatchConfigs[eventName] = dispatchConfig;

    const phasedRegistrationNames = dispatchConfig.phasedRegistrationNames;
    if (phasedRegistrationNames) {
        for (const phaseName in phasedRegistrationNames) {
            if (phasedRegistrationNames.hasOwnProperty(phaseName)) {
                const phasedRegistrationName = phasedRegistrationNames[phaseName];
                publishRegistrationName(phasedRegistrationName, pluginModule, eventName);
            }
        }
        return true;
    } else if (dispatchConfig.registrationName) {
        publishRegistrationName(dispatchConfig.registrationName, pluginModule, eventName);
        return true;
    }
    return false;
};
/**
 * @description 주입된 플러그인과 플러그인 순서를 사용하여 플러그인 목록을 다시 계산합니다.
 */
const recomputePluginOrdering = () => {
    if (!eventPluginOrder) {
        // `eventPluginOrder`가 주입될 때까지 기다립니다.
        return;
    }
    for (const pluginName in namesToPlugins) {
        const pluginModule = namesToPlugins[pluginName];
        const pluginIndex = eventPluginOrder.indexOf(pluginName);
        if (plugins[pluginIndex]) {
            continue;
        }
        plugins[pluginIndex] = pluginModule;
        const publishedEvents = pluginModule.eventTypes;
        for (const eventName in publishedEvents) {
            publishEventForPlugin(publishedEvents[eventName], pluginModule, eventName);
        }
    }
};

/**
 *  * 이벤트를 추출하고 발송할 수 있도록 플러그인을 등록합니다.
 *
 *
 * @see {EventPluginHub}
 */

/**
 * injected 플러그인의 순서 목록
 */
export const plugins = [];

/**
 * dispatchConfig에 대한 이벤트 이름 매핑
 */
export const eventNameDispatchConfigs = {};

/**
 * plugin 모듈로 등록 이름 매핑
 */
export const registrationNameModules = {};

/**
 * registrationName에서 이벤트 이름으로 매핑
 */
export const registrationNameDependencies = {};

export const possibleRegistrationNames = null;

/**
 *
 * @param {array} InjectedEventPluginOrder
 * @internal
 * @see {EventPluginHub.injection.injectEventPluginOrder}
 * @description  * 플러그인 순서를 주입합니다(플러그인 이름 기준). 이렇게 하면 주문
 * 실제 플러그인 인젝션과 분리되어 오더링이
 * 패키징, 즉석 삽입 등에 관계없이 항상 결정론적입니다.
 */
export const injectEventPluginOrder = (injectedEventPluginOrder) => {
    eventPluginOrder = Array.prototype.slice.call(injectedEventPluginOrder);
    recomputePluginOrdering();
};

/**
 *
 * @param {object} injectedNamesToPlugins Map from names to plugin modules.
 * @internal
 * @see {EventPluginHub.injection.injectEventPluginsByName}
 * @description  * 이벤트 플러그인 허브`에서 사용할 플러그인을 삽입합니다. 플러그인 이름은
 * 이벤트 플러그인 주문`에 의해 주입된 순서와 일치해야 합니다.
 *
 * 플러그인은 페이지 초기화의 일부로 또는 즉시 삽입할 수 있습니다.
 */
export const injectEventPluginsByName = (injectedNamesToPlugins) => {
    let isOrderingDirty = false;
    for (const pluginName in injectedNamesToPlugins) {
        if (!injectedNamesToPlugins.hasOwnProperty(pluginName)) {
            continue;
        }
        const pluginModule = injectedNamesToPlugins[pluginName];
        if (!namesToPlugins.hasOwnProperty(pluginName) || namesToPlugins[pluginName] !== pluginModule) {
            namesToPlugins[pluginName] = pluginModule;
            isOrderingDirty = true;
        }
    }
    if (isOrderingDirty) {
        recomputePluginOrdering();
    }
};
