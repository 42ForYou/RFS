import { isArray as isArr } from '../shared/isArray';

const RfsElement = (type, props, children) => {
    return {
    type: type === Fragment ? 'fragment' : type,
    key: props?.key,
    ref: props?.ref,
    props: {
      ...props,
      children
    }
    };
}  

export const createElement = (type, props = {}, ...children) => {
    return RfsElement(type, props, children.flat(Infinity));
}
  
export const Fragment = (props) => {
    return props.children;
  }
  

  
  