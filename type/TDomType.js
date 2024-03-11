import { RfsNodeList } from "./TRfsType";
import { TFiberRoot } from "./TFiberRoot";

/**
 * @typedef {Element & {_rfsRootContainer: TDOMRootType}} DOMContainer
 */
export const DOMContainer =
    Element &
        {
            _rfsRootContainer: TDOMRootType,
        } ||
    Document &
        {
            _rfsRootContainer: TDOMRootType,
        };

/**
 * @typedef {Object} TDOMRootType
 */
export const TDOMRootType = {
    /**
     * @param {RfsNodeList} @type {RfsNodeList} -> ReactNodeList
     */
    render: (children) => {},
    unmount: () => {},
    _internalRoot: TFiberRoot,
};
