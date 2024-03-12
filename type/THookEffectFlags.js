/**
 * @file THookEffectFlags.js
 * @module THookEffectFlags
 * @description This module contains the constants of Effect Tags used in the hooks.
 */

/**
 * @typedef {number} THookEffectFlags
 */
const HookFlags = {};
const NoEffect = /*             */ 0b00000000;

// Represents the phase in which the effect (not the clean-up) fires.
// for suspense & Class Component
// TODO: 정확한 명세필요.
// const UnmountSnapshot = /*      */ 0b00000010;

const UnmountMutation = /*      */ 0b00000100;
const MountMutation = /*        */ 0b00001000;

const UnmountLayout = /*        */ 0b00010000;
const MountLayout = /*          */ 0b00100000;

const MountPassive = /*         */ 0b01000000;
const UnmountPassive = /*       */ 0b10000000;
