/**
 * @typedef {Object} TRfsElement
 * @property {null | string | number?} key
 * @property {string | function} type
 * @property {any} props
 * @property {any} ref
 */
const TRfsElement = {
    type: null | String | Function,
    // props can cantain children array. and properties.
    props: null | any,
    key: null | String | Number,
    ref: null | any,
};
