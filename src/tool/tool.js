export function isDef(data) {
    return data !== undefined && data !== null;
}

export function isUnDef(data) {
    return data === undefined || data === null;
}

export function isPrimitive(data) {
    return typeof data === 'string' || typeof data === 'number';
}

export function isVnode(data) {
    return isDef(data) && isDef(data.sel);
}

export function getIdClass(str) {
    let obj = {id: '', class: '', tag: ''};
    let idIndex = str.indexOf('#');
    let classIndex = str.indexOf('.');
    if (idIndex > -1 && classIndex > -1) {
        obj.tag = str.slice(0, idIndex);
        obj.id = str.slice(idIndex + 1, classIndex);
        obj.class = str.slice(classIndex + 1).replace('.', ' ')
    } else if (classIndex > -1) {
        obj.tag = str.slice(0, classIndex);
        obj.class = str.slice(classIndex + 1).replace('.', ' ')
    } else {
        obj.tag = str;
    }

    return obj;
}

