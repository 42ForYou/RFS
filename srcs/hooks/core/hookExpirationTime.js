/**
 * @module hookExpirationTime
 */

import { NoWork } from "../../const/CExpirationTime.js";

/**
 * @constant {number} NoWork - No expiration time.
 * @property {number} renderExpirationTime - The expiration time of the render.
 * @property {number} remainingExpirationTime - The remaining expiration time.
 *
 * @see https://goidle.github.io/react/in-depth-react-hooks_1/#expirationtime
 */
export default {
    renderExpirationTime: NoWork,
    remainingExpirationTime: NoWork,
};
