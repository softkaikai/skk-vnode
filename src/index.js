import { createVnode } from './vnode';
import modules from './module/index';
import { isDef, isUnDef, isPrimitive, isVnode, getIdClass } from './tool/tool';
import api from './tool/api';

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

    function createElm(vnode) {
        if (isDef(vnode.sel)) {
            let selObj = getIdClass(vnode.sel);

            vnode.elm = document.createElement(selObj.tag);
            if (selObj.id) vnode.elm.id = selObj.id;
            if (selObj.class) vnode.elm.className = selObj.class;
            let children = vnode.children;
            if (children && children.length) {
                children.forEach((child ,index) => {
                    api.appendChild(vnode.elm, createElm(child));
                })
            }

            let createHooks = cbs.create;
            createHooks.forEach(create => {
                create(void 0, vnode)
            });
            // if text is not empty, create a text node
            if (vnode.text) {
                api.appendChild(vnode.elm, document.createTextNode(vnode.text));
            }

            let ownHooks = vnode.data && vnode.data.hook;
            if (ownHooks) {
                ownHooks.create && ownHooks.create(vnode);
            }
        } else {
            vnode.elm = document.createTextNode(vnode.text);
        }

        return vnode.elm
    }

    function sameVnode(vnode1, vnode2) {
        return vnode1 && vnode2 && vnode1.sel && vnode2.sel && vnode1.key && vnode2.key;
    }

    function destroyVnode(vnode) {
        let children = vnode.children;
        if (children && children.length) {
            children.forEach(cVnode => {
                destroyVnode(cVnode);
            })
        }
        cbs.destroy.forEach(destroy => {
            destroy(vnode);
        });
        let hook = vnode && vnode.data && vnode.data.hook;
        if (hook && hook.destroy) {
            hook.destroy(vnode);
        }
    }

    function patchVnode(oldVnode, vnode) {
        if (oldVnode === vnode) return;

        let elm = vnode.elm = oldVnode.elm;
        let oldC = oldVnode.children;
        let c = vnode.children;


        if (vnode.data) {
            let createHooks = cbs.create;
            createHooks.forEach(create => {
                create(oldVnode, vnode)
            });
        }

        // 更新文本
        if (oldVnode.text !== vnode.text) {
            elm.textContent = vnode.text;
        }
    }


    return function patch(oldVnode, vnode) {
        if (isVnode(oldVnode)) {
            if (sameVnode(oldVnode, vnode)) {

            } else {
                let parentNode = oldVnode.elm.parentNode;
                destroyVnode(oldVnode);
                api.replaceChild(parentNode, oldVnode.elm, createElm(vnode));
            }
        } else {
            // create elm
            containerElm = oldVnode;

            api.appendChild(containerElm, createElm(vnode))
        }

        return vnode;
    }
}


export default {
    createVnode,
    init,
}
