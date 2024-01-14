/**
 *
 * @param {Number} n
 * @returns {Number}
 */
export default fibbonacci = (n) => {
    if (n < 2) return n;
    return fibbonacci(n - 1) + fibbonacci(n - 2);
};
