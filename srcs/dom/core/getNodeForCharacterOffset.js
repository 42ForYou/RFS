import { TEXT_NODE } from "../../const/CDomNodeType";

/**
 *
 * @param {*} node
 * @returns {DOMElement|DOMTextNode}
 * @description node가 자식을 가지지 않은 첫 번째 리프 노드를 반환합니다.
 */
const getLeafNode = (node) => {
    while (node && node.firstChild) {
        node = node.firstChild;
    }
    return node;
};

/**
 *
 * @param {*} node
 * @returns {DOMElement|DOMTextNode|null}
 * @description 컨테이너 내에서 다음 형제 노드를 가져옵니다. 노드의 형제가 고갈되면 DOM을 탐색합니다.
 */
const getSiblingNode = (node) => {
    while (node) {
        if (node.nextSibling) {
            return node.nextSibling;
        }
        node = node.parentNode;
    }
};

/**
 *
 * @param {*} root
 * @param {*} offset
 * @returns {object|null}
 * @description offset에 문자를 포함하는 노드를 설명하는 객체를 가져옵니다.
 * @description root 노드 내에서 주어진 offset에 해당하는 문자의 위치를 찾아
 * 그 위치에 해당하는 노드와 노드 내의 오프셋을 객체로 반환합니다.
 * 이 함수는 텍스트 노드들을 순회하면서 각 노드의 문자열 길이를
 * 기준으로 전체 문자열 내에서의 위치를 계산합니다.
 */
const getNodeForCharacterOffset = (root, offset) => {
    let node = getLeafNode(root);
    let nodeStart = 0;
    let nodeEnd = 0;

    while (node) {
        if (node.nodeType === TEXT_NODE) {
            nodeEnd = nodeStart + node.textContent.length;

            if (nodeStart <= offset && nodeEnd >= offset) {
                return {
                    node: node,
                    offset: offset - nodeStart,
                };
            }

            nodeStart = nodeEnd;
        }

        node = getLeafNode(getSiblingNode(node));
    }
};
//NOTE: 예시
// 예를 들어, 다음과 같은 HTML 구조가 있다고 가정.

// html
// <div id="example">Hello <strong>world</strong></div>

// javascript
// const root = document.getElementById('example');
// 여기서, 문자열 "Hello world"에 대한 오프셋을 찾고 싶다고 가정하고,
// "w"의 위치를 찾고자 할 때의 오프셋을 6으로 가정("Hello "의 길이가 6이고, 0부터 시작하므로 "w"는 6번째 위치.)

// 이제, getNodeForCharacterOffset(root, 6)을 호출했을 때의 작동 과정:

// 함수는 root로부터 시작하여 첫 번째 리프 노드를 찾음. 이 경우 "Hello ".

// 이 노드는 텍스트 노드이며, 길이는 6.
// 오프셋 6은 이 노드의 끝에 해당.
// 하지만 정확히 이 노드의 범위 내에 포함되지 않으므로(범위는 0에서 5까지임), 다음 노드로 넘어가ㅏㅁ.

// 다음 리프 노드, 즉 <strong> 태그 내부의 "world"로 넘어감,.

// 이 텍스트 노드의 시작 오프셋은 이전 노드의 끝나는 지점인 6이 되고. "world"는 길이가 5이므로, 이 노드의 끝 오프셋은 11이 됨.

// 주어진 오프셋 6은 이 노드("world")의 시작과 끝 오프셋(6~11) 사이에 있고, 따라서 이 노드와, 노드 내에서의 오프셋(0, "w"의 위치)를 반환.

// 결과: getNodeForCharacterOffset(root, 6)은 다음 객체를 반환:

// js Object
// {
//   node: // "world" 텍스트 노드를 가리키는 참조,
//   offset: 0 // "world" 문자열 내에서 "w"의 위치
// }

export default getNodeForCharacterOffset;
