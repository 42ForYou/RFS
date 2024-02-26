/**
 * @module hooksDispatcher
 * @description This module defines the hooksDispatcher object.
 * @see useReducer
 * @see useEffect
 * @see useState
 * @see useCallback
 * @see useRef
 * @see useMemo
 * @see useLayoutEffect
 * @see throwInvalidHookError
 */

import { mountReducer, updateReducer } from "../useReducer/useReducerImpl.js";
import { mountEffect, updateEffect } from "../useEffect/useEffectImpl.js";
import { mountState, updateState } from "../useState/useStateImpl.js";
import { mountCallback, updateCallback } from "../useCallback/useCallbackImpl.js";
import { mountRef, updateRef } from "../useRef/useRefImpl.js";
import { mountMemo, updateMemo } from "../useMemo/useMemoImpl.js";
import { mountLayoutEffect, updateLayoutEffect } from "../useLayoutEffect/useLayoutEffectImpl.js";
import throwInvalidHookError from "../shared/throwInvalidHookError.js";

/**
 * @description This object is dispatcher for mount hooks.
 */
export const hookDispatcherOnMount = {
    useState: mountState,
    useReducer: mountReducer,
    useEffect: mountEffect,
    useMemo: mountMemo,
    useLayoutEffect: mountLayoutEffect,
    useCallback: mountCallback,
    useRef: mountRef,
};

/**
 * @decription This object is dispatcher for update hooks.
 */
export const hookDispatcherOnUpdate = {
    useState: updateState,
    useReducer: updateReducer,
    useEffect: updateEffect,
    useMemo: updateMemo,
    useLayoutEffect: updateLayoutEffect,
    useCallback: updateCallback,
    useRef: updateRef,
};

/**
 * @description This object is dispatcher for context only.
 */
export const ContextOnlyDispatcher = {
    useState: throwInvalidHookError,
    useReducer: throwInvalidHookError,
    useEffect: throwInvalidHookError,
    useMemo: throwInvalidHookError,
    useLayoutEffect: throwInvalidHookError,
    useCallback: throwInvalidHookError,
    useRef: throwInvalidHookError,
};
