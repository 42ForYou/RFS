import { TExpirationTime } from "./TExpirationTime.js";
//TODO: 해당 부분에 대한 명세가 필요하다
//context와 이벤트에 대한 의존성을 나타내는 것으로 보인다
const TDependencies = {
    expirationTime: TExpirationTime,
    firstContext: TContextDependency | null,
    responders: Map(ReactEventResponder, ReactEventResponderInstance | null),
};
