import {isDef, isUnDef, isPrimitive} from './tool/tool';


export function vnode(sel, data, children, text, elm) {
    let key = isDef(data) && isDef(data.key) ? data.key : void 0;

    return {
        sel: sel,
        data: data,
        children: children,
        text: text,
        elm: elm,
        key: key
    }
}

export function createVnode(sel, b, c) {
    let data = b || {};
    let children = null;
    let text = '';

    if (isPrimitive(c)) {
        text = c;
    } else if (Array.isArray(c)) {
        children = c;
    }

    if (text) {
        return vnode(sel, data, undefined, text, undefined);
    }
    if (children) {
        return vnode(sel, data, children, '', undefined);
    }

    return vnode(sel, data, undefined, '', undefined);
}
