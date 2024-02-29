import {
    MAX_SIGNED_31_BIT_INT,
    MAGIC_NUMBER_OFFSET,
} from "../type/TExpirationTime";

//(ms / UNIT_SIZE) | 0 == Floor(ms / UNIT_SIZE)
//자바 스크립트는 |0->비트Or연산자-> 피연산자 32비트 정수로 변환
//앞선 피 연산자가 32비트 정수로 변환됨 그리고 | 0을 하면 원하는 정수 나옴 -> 더 빠름
//음수에는 적용 안되는게 단점
//10ms이유 : Reference: https://web.dev/articles/rail?hl=ko#%EC%82%AC%EC%9A%A9%EC%9E%90%EC%97%90%EA%B2%8C-%EC%A7%91%EC%A4%91
//
// 0~16밀리초영역
//	사용자는 모션을 추적하는 데 매우 능숙하며, 애니메이션이 매끄럽지 않으면 싫어합니다. 초당 60개의 새로운 프레임이 렌더링된다면 애니메이션을 부드럽게 인식합니다.
// 프레임당 16ms이며 브라우저에서 새 프레임을 화면에 그리는 데 걸리는 시간을 포함하여 앱에서 프레임을 생성하는 데 약 10ms가 걸립니다.
// 하나의 앱에서 프레임을 생성하는데 약 10ms가 걸림으로 1유닛의 만료시간은 10ms이다.
// 1 unit of expiration time represents 10ms.
const UNIT_SIZE = 10;
export const msToExpirationTime = (ms) => {
    return MAGIC_NUMBER_OFFSET - ((ms / UNIT_SIZE) | 0);
};

export const expirationTimeToMs = (expirationTime) => {
    return (MAGIC_NUMBER_OFFSET - expirationTime) * UNIT_SIZE;
};

// 앞서서 와 같은원리로 number | 0 으로 floor를 구하고 + 1을 해서 올림을 구함
// 정밀도란 정밀도를 기준으로 올림을 할지 안할것을 정하는 것임으로 수에 정밀도를 나눠서 올림을 하고 다시
// 정밀도를 곱해서 수를 복원함
const ceiling = (num, precision) => {
    return (((num / precision) | 0) + 1) * precision;
};
