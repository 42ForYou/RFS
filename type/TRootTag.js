/**
 * @file TRootTag.js
 * @description 파이버루트의 렌더 방식을 나타내는 태그를 나타낸다
 * 현 RFS프로젝트에서는 ConcurrentRoot만 존재한다
 */

/**
 * @typedef {number} TRootTag
 */
const TRootTag = Number; // only for editor to recognize the type

//해당 부분은 구현을 안할 예정이다 -> 리액트의 레거시 모드를 지원하지 않기 때문이다.
//export const LegacyRoot = 0;
const ConcurrentRoot = 0;
