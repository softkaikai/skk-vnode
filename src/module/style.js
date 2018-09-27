import {isDef, isUnDef, isPrimitive} from '../tool/tool';
import api from '../tool/api';

function updateStyle(oldVnode, vnode) {
    let oldStyle = oldVnode && oldVnode.data && oldVnode.data.style;
    let style = vnode && vnode.data && vnode.data.style;

    if (!oldStyle && !style) return;
    if (oldStyle === style) return;

    let newStyleObj = Object.assign({}, oldStyle || {}, style);

    // updateStyle
    api.setAttr(vnode.elm, 'style', getStyleStr(newStyleObj))
}

function getStyleStr(style) {
    let str = '';

    for (let [key, value] of Object.entries(style)) {
        str += `${key}:${value};`;
    }

    return str;
}

export default {
    create: updateStyle,
    update: updateStyle
}

