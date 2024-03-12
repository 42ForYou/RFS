/**
 * @typedef {Array<THeapNode>} THeapType
 * @typedef {Object} THeapNode
 */

import { TExpirationTime } from "./TExpirationTime";

const THeapNode = {
    id: Number,
    sortIndex: TExpirationTime,
};
const THeapType = Array(THeapNode);
