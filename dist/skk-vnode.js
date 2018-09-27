var skkVnode = (function () {
    'use strict';

    function isDef(data) {
        return data !== undefined && data !== null;
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

    var api = {
        setAttr,
        getParent,
        appendChild,
        removeChild,
        replaceChild,
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
            return vnode1 && vnode2 && vnode1.sel && vnode2.sel && vnode1.key && vnode2.key;
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


        return function patch(oldVnode, vnode$$1) {
            if (isVnode(oldVnode)) {
                if (sameVnode(oldVnode, vnode$$1)) ; else {
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
        init,
    };

    return index;

}());
