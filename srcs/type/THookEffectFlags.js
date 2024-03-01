/**
 * @file THookEffectFlags.js
 * @module THookEffectFlags
 * @description This module contains the constants of Effect Tags used in the hooks.
 */

/**
 * @typedef {number} THookEffectFlags
 */
export const HookFlags = {};
export const NoEffect = /*             */ 0b00000000;

// Represents the phase in which the effect (not the clean-up) fires.
// for suspense & Class Component
// TODO: 정확한 명세필요.
// export const UnmountSnapshot = /*      */ 0b00000010;

export const UnmountMutation = /*      */ 0b00000100;
export const MountMutation = /*        */ 0b00001000;

export const UnmountLayout = /*        */ 0b00010000;
export const MountLayout = /*          */ 0b00100000;

export const MountPassive = /*         */ 0b01000000;
export const UnmountPassive = /*       */ 0b10000000;
