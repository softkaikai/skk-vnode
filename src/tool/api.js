
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
    elm.removeChild(child)
}

function replaceChild(elm, old, child) {
    elm.replaceChild(child, old)
}

export default {
    setAttr,
    getParent,
    appendChild,
    removeChild,
    replaceChild,
}

