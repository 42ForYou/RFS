const TEventSystemFlags = Number;
/**
 * @description  PLUGIN_EVENT_SYSTEM: 플러그인 이벤트 시스템을 사용하겠다는 것을 나타내는 플래그입니다. 리액트에서 다양한 이벤트 처리 플러그인을 지원할 때 사용됩니다.
 */
export const PLUGIN_EVENT_SYSTEM = 1;
// RESPONDER_EVENT_SYSTEM: 리액트의 실험적인 Responder Event System을 사용하겠다는 것을 나타내는 플래그입니다. Flare API의 일부로, 복잡한 이벤트 핸들링 로직을 구현할 때 사용됩니다. Flare API나 Responder Event System을 구현하지 않을 경우, 이 플래그는 필요하지 않습니다.

/**
 * @description IS_PASSIVE: 이벤트 리스너가 패시브 리스너로 등록되어야 함을 나타내는 플래그입니다. 패시브 리스너는 preventDefault를 호출할 수 없으며, 주로 스크롤 성능 향상을 위해 사용됩니다.
 */
export const IS_PASSIVE = 1 << 1;
/**
 * @description IS_ACTIVE: 이벤트 리스너가 액티브 모드로 동작해야 함을 나타내는 플래그입니다. preventDefault 호출이 가능한 상태를 의미합니다.
 */
export const IS_ACTIVE = 1 << 2;
/**
 * @description PASSIVE_NOT_SUPPORTED: 브라우저가 패시브 리스너를 지원하지 않을 경우를 대비한 플래그입니다. 이 플래그가 설정되면, 리액트는 패시브 리스너를 사용하지 않는 대체 로직을 적용할 수 있습니다.
 */
export const PASSIVE_NOT_SUPPORTED = 1 << 3;
/**
 * @description IS_REPLAYED: 이벤트가 재생된(replayed) 이벤트임을 나타내는 플래그입니다. 일부 이벤트 시스템에서는 이벤트를 저장했다가 나중에 다시 처리할 필요가 있을 때 이 플래그를 사용합니다.
 */
export const IS_REPLAYED = 1 << 4;
