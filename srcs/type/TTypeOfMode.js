/**
 * @file TTypeOfMode
 * @description 해당 파일은 파이버의 모드를 나타내는 타입을 나타낸다
 * 어떠한 방식으로 현재 파이버가 작동하는지를 나타낸다
 * TRootTag와 구별되는 것은 현재 처음 render과정에서 동기방식짐입점인지 아닌지를 구별하는게
 * TRootTag이고 TTypeOfMode는 현재 파이버가 어떠한 모드로 작동하는지를 나타낸다
 */
export const TTypeOfMode = Number; // only for editor to recognize the type

export const NoMode = 0b00;
//suspense를 위한 것 ->  지원하지 않는다
// export const BlockingMode = 0b010;
export const ConcurrentMode = 0b10;
