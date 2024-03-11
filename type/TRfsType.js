//jsx에 의해 생성된 객체의 타입을 정의한다
export const TRfsElement = {
    //보안을 위해서 Symbol을 사용한다
    //기본적으로 크로스오리진 공격에서는 craeteText라는 안전한 api를 사용하여 대처할 수 있으나
    //서버로 부터 받아오는 데이터에 구멍이 들어오는 경우에 대처가 힘들다. 이를 위해서 외부에서 받아오는 데이터는
    //Symbol이 같이 들어올 수 없음으로 이를 통해서 정말
    //ReactElement를 구분할 수 있다.
    $$typeof: any,
    type: any,
    key: any,
    ref: any,
    props: any,
};
export const TRfsEmpty = null | Boolean;
export const TRfsFragment = TRfsEmpty | Iterable(TRfsNode);
export const TRfsNodeList = TRfsEmpty | TRfsNode;
//host text를 관리하기 위한 객체이다
export const TRfsText = String | Number;
//Ref를 관리하기 위한 레퍼 객체이다
export const TRfsRefObject = {
    current: any,
};
//Todo: context관련 구조 설명 필요
export const TRfsProviderType = {
    $$typeof: Symbol | Number,
    _context: TRfsContext,
};
export const TRfsContext = {
    $$typeof: Symbol | Number,
    Consumer: TRfsContext,
    Provider: TRfsProviderType,
    // _calculateChangedBits: ((a: T, b: T) => Number) | null,
    _currentValue: T,
    _currentValue2: T,
    _threadCount: Number,
    _currentRenderer: Object | null,
};
export const TRfsProvider = {
    $$typeof: Symbol | Number,
    type: TRfsProviderType,
    key: null | String,
    ref: null,
    props: {
        value: any,
        children: TRfsNodeList,
    },
};
//
export const TRfsNode = TRfsElement || TRfsText || TRfsFragment || TRfsProvider;
