export function generate(ast) {
    let code = ast ? genElement(ast) : "c('div')";
    let fnCode = `with(this) {return ${code}}`;

    console.log(fnCode);

    return new Function(fnCode)
}


function genElement(el) {
    if (!el.tag) {
        return `c(undefined, undefined, '${el.children}')`
    }
    // let code = null;
    let data = el.data || '';
    if (data) {
        data = JSON.stringify(data);
    }
    let children = genChildren(el);

    return `c('${el.tag}'${
        data ? `, ${data}` : ','
    }${
        children ? `, ${children}` : ','
    })`
}

function genChildren(el) {
    let children = el.children || [];
    if (children.length) {
        return `[${children.map(c => genNode(c)).join(',')}]`
    }
    return '';
}

function genNode(el) {
    let children = el.children;

    if (typeof children === 'string' && el.tag) {
        let data = el.data || '';
        if (data) {
            data = JSON.stringify(data);
        }
        return `c('${el.tag}'${
            data ? `, ${data}` : ','
        }${
            ',' + children
        })`
    } else {
        return genElement(el)
    }
}
