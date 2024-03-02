import { RfsNodeList } from "./TRfsType";
import { TFiberRoot } from "./TFiberRoot";
export const DOMContainer =
    Element &
        {
            _rfsRootContainer: TDOMRootType,
        } ||
    Document &
        {
            _rfsRootContainer: TDOMRootType,
        };

export const TDOMRootType = {
    /**
     * @param {RfsNodeList} @type {RfsNodeList} -> ReactNodeList
     */
    render: (children) => {},
    unmount: () => {},
    _internalRoot: TFiberRoot,
};
