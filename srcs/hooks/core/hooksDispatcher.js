/**
 * @module hooksDispatcher
 * @description This module defines the hooksDispatcher object.
 */

import { mountReducer, updateReducer } from "../useReducer/useReducerImpl";

/**
 * @description This object is dispatcher for mount hooks.
 * @property {Function} useState
 * @property {Function} useReducer
 * @property {Function} useEffect
 * @property {Function} useMemo
 */
export const hookDispatcherOnMount = {
    // useState: mountState,
    useReducer: mountReducer,
    // useEffect: mountEffect,
    // useMemo: mountMemo,
};

/**
 * @decription This object is dispatcher for update hooks.
 * @property {Function} useState
 * @property {Function} useReducer
 * @property {Function} useEffect
 * @property {Function} useMemo
 */
export const hookDispatcherOnUpdate = {
    // useState: updateState,
    useReducer: updateReducer,
    // useEffect: updateEffect,
    // useMemo: updateMemo,
};
