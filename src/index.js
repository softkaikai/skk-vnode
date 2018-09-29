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
        return vnode1 && vnode2 && (vnode1.sel === vnode2.sel) && (vnode1.key === vnode2.key);
    }

    function addVnode(parentElm, vnode, before) {
        let vnodes = Array.isArray(vnode) ? vnode : [vnode];

        vnodes.forEach(node => {
            api.insertBefore(parentElm, createElm(node), before);
        })
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

    function destroyVnodeAndDom(vnode) {
        if (Array.isArray(vnode)) {
            vnode.forEach(node => {
                destroyVnode(node);
                api.removeChild(node.elm.parentNode, node.elm);
            })
        } else {
            destroyVnode(vnode);
            api.removeChild(vnode.elm.parentNode, vnode.elm);
        }

    }

    function keyToIndexFn(vnode, start, end) {
        let obj = {};
        for (let i = start; i <= end; i++) {
            let key = vnode[i].key;
            if (key) {
                obj[key] = i;
            }
        }

        return obj;
    }

    function updateChildren(parentElm, oldVnode, vnode) {
        let oldStartIndex = 0;
        let oldEndIndex = oldVnode.length - 1;

        let oldStartVnode = oldVnode[0];
        let oldEndVnode = oldVnode[oldEndIndex];

        let newStartIndex = 0;
        let newEndIndex = vnode.length - 1;

        let newStartVnode = vnode[0];
        let newEndVnode = vnode[newEndIndex];

        while(oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
            if (oldStartVnode == null) {
                oldStartVnode = oldVnode[++oldStartIndex];
            } else if (oldEndVnode == null) {
                oldEndVnode = oldVnode[--oldEndIndex];
            } else if (newStartVnode == null) {
                newStartVnode = vnode[--newStartIndex];
            } else if (newEndVnode == null) {
                newEndVnode = vnode[--newEndIndex];
            } else if (sameVnode(oldStartVnode, newStartVnode)) {
                patchVnode(oldStartVnode, newStartVnode);
                oldStartVnode = oldVnode[++oldStartIndex];
                newStartVnode = vnode[++newStartIndex];
            } else if (sameVnode(oldEndVnode, newEndVnode)) {
                patchVnode(oldEndVnode, newEndVnode);
                oldEndVnode = oldVnode[--oldEndIndex];
                newEndVnode = vnode[--newEndIndex];
            } else if (sameVnode(oldStartVnode, newEndVnode)) {
                patchVnode(oldStartVnode, newEndVnode);
                api.insertBefore(parentElm, oldStartVnode.elm, oldStartVnode.elm.nextSibling);
                oldStartVnode = oldVnode[++oldStartIndex];
                newEndVnode = vnode[--newEndIndex];
            } else if (sameVnode(oldEndVnode, newStartVnode)) {
                patchVnode(oldEndVnode, newStartVnode);
                api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
                oldEndVnode = oldVnode[--oldEndIndex];
                newStartVnode = vnode[++newStartIndex];
            } else {
                let keyToIndex = keyToIndexFn(oldVnode, oldStartIndex, oldEndIndex);
                let startInOldIndex = keyToIndex[newStartVnode.key];

                if (isUnDef(startInOldIndex)) {
                    // create a new dom
                    api.insertBefore(parentElm, createElm(newStartVnode), oldStartVnode.elm);
                    newStartVnode = vnode[++newStartIndex];
                } else {
                    let moveVnode = oldVnode[startInOldIndex];

                    if (moveVnode.sel !== newStartVnode.sel) {
                        api.insertBefore(parentElm, createElm(newStartVnode), oldStartVnode.elm);
                    } else {
                        patchVnode(moveVnode, newStartVnode);
                        oldVnode[startInOldIndex] = undefined; // 标记已处理;
                        newStartVnode = vnode[++newStartIndex];
                    }
                }
            }

            if (newStartIndex > newEndIndex) {
                // 删除节点
                destroyVnodeAndDom(oldVnode.slice(oldStartIndex, oldEndIndex + 1));
            }
            if (oldStartIndex > oldEndIndex) {
                let before = vnode[newEndIndex + 1] == null ? null : vnode[newEndIndex + 1].elm;
                for (let i = newStartIndex; i <= newEndIndex; i++) {
                    addVnode(parentElm, vnode, before);
                }
            }
        }
    }

    function patchVnode(oldVnode, vnode) {
        if (oldVnode === vnode) return;

        let elm = vnode.elm = oldVnode.elm;
        let oldC = oldVnode.children;
        let c = vnode.children;
        let parentElm = elm.parentElm;


        if (vnode.data) {
            let updateHooks = cbs.update;
            updateHooks.forEach(update => {
                update(oldVnode, vnode)
            });
        }

        if (isDef(oldC) && isDef(c)) {
            updateChildren(vnode.elm, oldC, c);
        } else if (isDef(c)) {
            addVnode(parentElm, c);
        } else if (isDef(oldC)) {
            destroyVnodeAndDom(oldC);
        }

        // 更新文本
        if (oldVnode.text !== vnode.text) {
            elm.textContent = vnode.text;
        }
    }


    return function patch(oldVnode, vnode) {
        if (isVnode(oldVnode)) {
            if (sameVnode(oldVnode, vnode)) {
                patchVnode(oldVnode, vnode);
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
