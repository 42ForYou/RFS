/**
 * @module hooksDispatcher
 * @description This module defines the hooksDispatcher object.
 */

import { mountReducer, updateReducer } from "../useReducer/useReducerImpl";
import { mountEffect, updateEffect } from "../useEffect/useEffectImpl";
import { mountState, updateState } from "../useState/useStateImpl";
import { mountCallback, updateCallback } from "../useCallback/useCallbackImpl";
import { mountRef, updateRef } from "../useRef/useRefImpl";

/**
 * @description This object is dispatcher for mount hooks.
 * @property {Function} useState
 * @property {Function} useReducer
 * @property {Function} useEffect
 * @property {Function} useMemo
 */
export const hookDispatcherOnMount = {
    useState: mountState,
    useReducer: mountReducer,
    useEffect: mountEffect,
    useLayoutEffect: mountLayoutEffect,
    // useMemo: mountMemo,
    useCallback: mountCallback,
    useRef: mountRef,
};

/**
 * @decription This object is dispatcher for update hooks.
 * @property {Function} useState
 * @property {Function} useReducer
 * @property {Function} useEffect
 * @property {Function} useMemo
 */
export const hookDispatcherOnUpdate = {
    useState: updateState,
    useReducer: updateReducer,
    useEffect: updateEffect,
    useLayoutEffect: updateLayoutEffect,
    // useMemo: updateMemo,
    useCallback: updateCallback,
    useRef: updateRef,
};
