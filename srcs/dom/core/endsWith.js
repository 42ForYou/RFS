/**
 *
 * @param {*} subject
 * @param {*} search
 * @returns {string}
 * @description subject가 search로 끝나는지 확인하는 함수입니다.
 */
const endsWith = (subject, search) => {
    const length = subject.length;
    return subject.substring(length - search.length, length) === search;
};
export default endsWith;
