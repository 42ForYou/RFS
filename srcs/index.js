import { RFS_FRAGMENT_TYPE } from "./core/rfsSymbol.js";
import { createElement } from "./core/rfsElement.js";
import createContext from "./context/createContext.js";
import forwardRef from "./core/forwardRef.js";
import memo from "./core/memo.js";
import useCallback from "./hooks/useCallback/useCallback.js";
import useContext from "./hooks/useContext/useContext.js";
import useEffect from "./hooks/useEffect/useEffect.js";
import useLayoutEffect from "./hooks/useLayoutEffect/useLayoutEffect.js";
import useMemo from "./hooks/useMemo/useMemo.js";
import useReducer from "./hooks/useReducer/useReducer.js";
import useRef from "./hooks/useRef/useRef.js";
import useState from "./hooks/useState/useState.js";
const Rfs = {
    createContext,
    forwardRef,
    memo,

    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useReducer,
    useRef,
    useState,

    Fragment: RFS_FRAGMENT_TYPE,

    createElement,
};

export {
    createContext,
    forwardRef,
    memo,

    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useReducer,
    useRef,
    useState,

    RFS_FRAGMENT_TYPE as Fragment,
    createElement,
}

export default Rfs;
