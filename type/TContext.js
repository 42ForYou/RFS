/**
 * @typedef {Object} TProvider
 * @description - React Context Type
 * @property {Symbol | number} $$typeof - React Context Type
 * @property {ReactProviderType<T>} Provider - React Provider Type
 * @property {ReactConsumer<T>} Consumer - React Consumer Type
 * @property {((a: T, b: T) => number) | null} _calculateChangedBits - Calculate Changed Bits
 * @property {T} _currentValue - Current Value
 * @property {T} _currentValue2 - Current Value 2
 * @property {number} _threadCount - Thread Count
 */
const TContext = {
    $$typeof: Symbol,
    _calculateChangedBits: Function,
    _currentValue: any,
    _currentValue2: any,

    // 사용해야 할까?
    // _threadCount: number,
    Provider: TProvider,
    Consumer: TConsumer,
};

/**
 * @description context가 없을떄 사용하는 타입을 정의합니다.
 */
const TNoContextT = {};
export default TContext;
