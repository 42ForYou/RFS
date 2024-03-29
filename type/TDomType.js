/**
 * @typedef {Element & {_rfsRootContainer: TDOMRootType}} DOMContainer
 */
const TDOMContainer =
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
const TDOMRootType = {
    /**
     * @param {RfsNodeList} @type {RfsNodeList} -> ReactNodeList
     */
    render: (children) => {},
    unmount: () => {},
    _internalRoot: TFiberRoot,
};
