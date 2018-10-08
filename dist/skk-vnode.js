var skkVnode = (function () {
    'use strict';

    function isDef(data) {
        return data !== undefined && data !== null;
    }

    function isUnDef(data) {
        return data === undefined || data === null;
    }

    function isPrimitive(data) {
        return typeof data === 'string' || typeof data === 'number';
    }

    function isVnode(data) {
        return isDef(data) && isDef(data.sel);
    }

    function getIdClass(str) {
        let obj = {id: '', class: '', tag: ''};
        let idIndex = str.indexOf('#');
        let classIndex = str.indexOf('.');
        if (idIndex > -1 && classIndex > -1) {
            obj.tag = str.slice(0, idIndex);
            obj.id = str.slice(idIndex + 1, classIndex);
            obj.class = str.slice(classIndex + 1).replace('.', ' ');
        } else if (classIndex > -1) {
            obj.tag = str.slice(0, classIndex);
            obj.class = str.slice(classIndex + 1).replace('.', ' ');
        } else {
            obj.tag = str;
        }

        return obj;
    }

    function vnode(sel, data, children, text, elm) {
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

    function createVnode(sel, b, c) {
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

    function generate(ast) {
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

    function setAttr(elm, name, attr) {
        elm.setAttribute(name, attr);
    }

    function getParent(elm) {
        return elm.parentNode;
    }

    function appendChild(elm, child) {
        elm.appendChild(child);
    }

    function removeChild(elm, child) {
        elm.removeChild(child);
    }

    function replaceChild(elm, old, child) {
        elm.replaceChild(child, old);
    }

    function insertBefore(elm, child, old) {
        elm.insertBefore(child, old);
    }

    var api = {
        setAttr,
        getParent,
        appendChild,
        removeChild,
        replaceChild,
        insertBefore,
    };

    function updateStyle(oldVnode, vnode) {
        let oldStyle = oldVnode && oldVnode.data && oldVnode.data.style;
        let style = vnode && vnode.data && vnode.data.style;

        if (!oldStyle && !style) return;
        if (oldStyle === style) return;

        let newStyleObj = Object.assign({}, oldStyle || {}, style);

        // updateStyle
        api.setAttr(vnode.elm, 'style', getStyleStr(newStyleObj));
    }

    function getStyleStr(style) {
        let str = '';

        for (let [key, value] of Object.entries(style)) {
            str += `${key}:${value};`;
        }

        return str;
    }

    var style = {
        create: updateStyle,
        update: updateStyle
    };

    function invokeHandler(e, handler) {
        if (typeof handler === 'function') {
            handler(e);
        } else if (Array.isArray(handler)) {
            if (typeof handler[0] === 'function') {
                let fn = handler[0];
                let args = handler.slice(1) || [];
                args.push(e);

                fn.apply(null, args);
            } else {
                handler.forEach(fn => {
                    invokeHandler(e, fn);
                });
            }
        }
    }


    function createListener() {
        return function handler(e) {
            let eventName = e.type;
            let fn = handler.vnode.data.on[eventName];

            invokeHandler(e, fn);
        }
    }

    function updateEventListeners(oldVnode, vnode) {
        let oldOn = oldVnode && oldVnode.data && oldVnode.data.on;
        let on = vnode && vnode.data && vnode.data.on;

        if (oldOn === on) return;
        if (!oldOn && !on) return;

        if (on && !oldOn) {
            let listener = vnode.listener = createListener();
            listener.vnode = vnode;

            for(let name in on) {
                vnode.elm.addEventListener(name, listener, false);
            }
        } else if (!on && oldOn) {
            let listener = oldVnode.listener;
            for(let name in on) {
                oldVnode.elm.removeEventListener(name, listener, false);
            }
        } else {
            // reuse listener
            let listener = vnode.listener = oldVnode.listener || createListener();
            for(let name in on) {
                if (!oldOn[name]) {
                    vnode.elm.addEventListener(name, listener, false);
                }
            }
            for(let name in oldOn) {
                if (!on[name]) {
                    vnode.elm.removeEventListener(name, listener, false);
                }
            }
        }
    }

    var eventListener = {
        create: updateEventListeners,
        update: updateEventListeners,
        destroy: updateEventListeners
    };

    var modules = {
        style,
        eventListener
    };

    let hooks = ['create', 'update', 'destroy'];

    function init() {
        let cbs = [];
        let containerElm = null;

        for (let [i, hook] of hooks.entries()) {
            cbs[hook] = [];
            for (let [key, module] of Object.entries(modules)) {
                if (module[hook]) {
                    cbs[hook].push(module[hook]);
                }
            }
        }

        console.log(cbs);

        function createElm(vnode$$1) {
            if (isDef(vnode$$1.sel)) {
                let selObj = getIdClass(vnode$$1.sel);

                vnode$$1.elm = document.createElement(selObj.tag);
                if (selObj.id) vnode$$1.elm.id = selObj.id;
                if (selObj.class) vnode$$1.elm.className = selObj.class;
                let children = vnode$$1.children;
                if (children && children.length) {
                    children.forEach((child ,index) => {
                        api.appendChild(vnode$$1.elm, createElm(child));
                    });
                }

                let createHooks = cbs.create;
                createHooks.forEach(create => {
                    create(void 0, vnode$$1);
                });
                // if text is not empty, create a text node
                if (vnode$$1.text) {
                    api.appendChild(vnode$$1.elm, document.createTextNode(vnode$$1.text));
                }

                let ownHooks = vnode$$1.data && vnode$$1.data.hook;
                if (ownHooks) {
                    ownHooks.create && ownHooks.create(vnode$$1);
                }
            } else {
                vnode$$1.elm = document.createTextNode(vnode$$1.text);
            }

            return vnode$$1.elm
        }

        function sameVnode(vnode1, vnode2) {
            return vnode1 && vnode2 && (vnode1.sel === vnode2.sel) && (vnode1.key === vnode2.key);
        }

        function addVnode(parentElm, vnode$$1, before) {
            let vnodes = Array.isArray(vnode$$1) ? vnode$$1 : [vnode$$1];

            vnodes.forEach(node => {
                api.insertBefore(parentElm, createElm(node), before);
            });
        }

        function destroyVnode(vnode$$1) {
            let children = vnode$$1.children;
            if (children && children.length) {
                children.forEach(cVnode => {
                    destroyVnode(cVnode);
                });
            }
            cbs.destroy.forEach(destroy => {
                destroy(vnode$$1);
            });
            let hook = vnode$$1 && vnode$$1.data && vnode$$1.data.hook;
            if (hook && hook.destroy) {
                hook.destroy(vnode$$1);
            }
        }

        function destroyVnodeAndDom(vnode$$1) {
            if (Array.isArray(vnode$$1)) {
                vnode$$1.forEach(node => {
                    destroyVnode(node);
                    api.removeChild(node.elm.parentNode, node.elm);
                });
            } else {
                destroyVnode(vnode$$1);
                api.removeChild(vnode$$1.elm.parentNode, vnode$$1.elm);
            }

        }

        function keyToIndexFn(vnode$$1, start, end) {
            let obj = {};
            for (let i = start; i <= end; i++) {
                let key = vnode$$1[i].key;
                if (key) {
                    obj[key] = i;
                }
            }

            return obj;
        }

        function updateChildren(parentElm, oldVnode, vnode$$1) {
            let oldStartIndex = 0;
            let oldEndIndex = oldVnode.length - 1;

            let oldStartVnode = oldVnode[0];
            let oldEndVnode = oldVnode[oldEndIndex];

            let newStartIndex = 0;
            let newEndIndex = vnode$$1.length - 1;

            let newStartVnode = vnode$$1[0];
            let newEndVnode = vnode$$1[newEndIndex];

            while(oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
                if (oldStartVnode == null) {
                    oldStartVnode = oldVnode[++oldStartIndex];
                } else if (oldEndVnode == null) {
                    oldEndVnode = oldVnode[--oldEndIndex];
                } else if (newStartVnode == null) {
                    newStartVnode = vnode$$1[--newStartIndex];
                } else if (newEndVnode == null) {
                    newEndVnode = vnode$$1[--newEndIndex];
                } else if (sameVnode(oldStartVnode, newStartVnode)) {
                    patchVnode(oldStartVnode, newStartVnode);
                    oldStartVnode = oldVnode[++oldStartIndex];
                    newStartVnode = vnode$$1[++newStartIndex];
                } else if (sameVnode(oldEndVnode, newEndVnode)) {
                    patchVnode(oldEndVnode, newEndVnode);
                    oldEndVnode = oldVnode[--oldEndIndex];
                    newEndVnode = vnode$$1[--newEndIndex];
                } else if (sameVnode(oldStartVnode, newEndVnode)) {
                    patchVnode(oldStartVnode, newEndVnode);
                    api.insertBefore(parentElm, oldStartVnode.elm, oldStartVnode.elm.nextSibling);
                    oldStartVnode = oldVnode[++oldStartIndex];
                    newEndVnode = vnode$$1[--newEndIndex];
                } else if (sameVnode(oldEndVnode, newStartVnode)) {
                    patchVnode(oldEndVnode, newStartVnode);
                    api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
                    oldEndVnode = oldVnode[--oldEndIndex];
                    newStartVnode = vnode$$1[++newStartIndex];
                } else {
                    let keyToIndex = keyToIndexFn(oldVnode, oldStartIndex, oldEndIndex);
                    let startInOldIndex = keyToIndex[newStartVnode.key];

                    if (isUnDef(startInOldIndex)) {
                        // create a new dom
                        api.insertBefore(parentElm, createElm(newStartVnode), oldStartVnode.elm);
                        newStartVnode = vnode$$1[++newStartIndex];
                    } else {
                        let moveVnode = oldVnode[startInOldIndex];

                        if (moveVnode.sel !== newStartVnode.sel) {
                            api.insertBefore(parentElm, createElm(newStartVnode), oldStartVnode.elm);
                        } else {
                            patchVnode(moveVnode, newStartVnode);
                            oldVnode[startInOldIndex] = undefined; // 标记已处理;
                            newStartVnode = vnode$$1[++newStartIndex];
                        }
                    }
                }

                if (newStartIndex > newEndIndex) {
                    // 删除节点
                    destroyVnodeAndDom(oldVnode.slice(oldStartIndex, oldEndIndex + 1));
                }
                if (oldStartIndex > oldEndIndex) {
                    let before = vnode$$1[newEndIndex + 1] == null ? null : vnode$$1[newEndIndex + 1].elm;
                    for (let i = newStartIndex; i <= newEndIndex; i++) {
                        addVnode(parentElm, vnode$$1, before);
                    }
                }
            }
        }

        function patchVnode(oldVnode, vnode$$1) {
            if (oldVnode === vnode$$1) return;

            let elm = vnode$$1.elm = oldVnode.elm;
            let oldC = oldVnode.children;
            let c = vnode$$1.children;
            let parentElm = elm.parentElm;


            if (vnode$$1.data) {
                let updateHooks = cbs.update;
                updateHooks.forEach(update => {
                    update(oldVnode, vnode$$1);
                });
            }

            if (isDef(oldC) && isDef(c)) {
                updateChildren(vnode$$1.elm, oldC, c);
            } else if (isDef(c)) {
                addVnode(parentElm, c);
            } else if (isDef(oldC)) {
                destroyVnodeAndDom(oldC);
            }

            // 更新文本
            if (oldVnode.text !== vnode$$1.text) {
                elm.textContent = vnode$$1.text;
            }
        }


        return function patch(oldVnode, vnode$$1) {
            if (isVnode(oldVnode)) {
                if (sameVnode(oldVnode, vnode$$1)) {
                    patchVnode(oldVnode, vnode$$1);
                } else {
                    let parentNode = oldVnode.elm.parentNode;
                    destroyVnode(oldVnode);
                    api.replaceChild(parentNode, oldVnode.elm, createElm(vnode$$1));
                }
            } else {
                // create elm
                containerElm = oldVnode;

                api.appendChild(containerElm, createElm(vnode$$1));
            }

            return vnode$$1;
        }
    }


    var index = {
        createVnode,
        generate,
        init,
    };

    return index;

}());
