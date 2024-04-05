/**
 *
 * @param {document} doc
 * @returns {Element || null}
 * @description getActiveElement 함수: 주어진 document의 활성 요소를 반환합니다.
 */
const getActiveElement = (doc) => {
    doc = doc || (typeof document !== "undefined" ? document : undefined);
    if (typeof doc === "undefined") {
        return null;
    }
    try {
        return doc.activeElement || doc.body;
    } catch (e) {
        return doc.body;
    }
};

export default getActiveElement;
