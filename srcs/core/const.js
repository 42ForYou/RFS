/**
 * @file const.js
 * @description This file defines that HTML nodeType values that represent
 *  the type of the node
 * reference: https://developer.mozilla.org/en-US/docs/Web/API/Node
 */

// HTML node Type begins
export const ELEMENT_NODE = 1;
export const TEXT_NODE = 3;
export const DOCUMENT_NODE = 9;
export const DOCUMENT_TYPE_NODE = 10;
export const DOCUMENT_FRAGMENT_NODE = 11;
// HTML node Type ends

// RootTag begins
// RootTag는 렌더를 할때 어떤 모드로 렌더를 할지를 결정하는 태그입니다.
// 본 리액트 같은경우는 legacy모드와 concurrent모드가 있습니다.
// 우리 리액트는 오직 concurrent모드만을 지원합니다.
export const ConcurrentRoot = 1;
// RootTag ends
