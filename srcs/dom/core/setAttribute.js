/**
 * @description /**
 * 노드에 대한 어트리뷰트를 설정합니다. 어트리뷰트 값은 문자열 또는
 * 신뢰할 수 있는 값(애플리케이션이 신뢰할 수 있는 유형을 사용하는 경우).
 */
export const setAttribute = (node, attributeName, attributeValue) => {
    node.setAttribute(attributeName, attributeValue);
};

/**
 * @description
 * 노드의 네임스페이스로 어트리뷰트를 설정합니다. 어트리뷰트 값은 문자열 또는
 * 신뢰할 수 있는 값(애플리케이션이 신뢰할 수 있는 유형을 사용하는 경우).
 */

export const setAttributeNS = (node, attributeNamespace, attributeName, attributeValue) => {
    node.setAttributeNS(attributeNamespace, attributeName, attributeValue);
};
