
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
            })
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

export default {
    create: updateEventListeners,
    update: updateEventListeners,
    destroy: updateEventListeners
}
