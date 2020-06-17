export function getParentElement(child, search) {
    if (child.parentElement.classList.contains(search)) {
        return child.parentElement;
    }

    return getParentElement(child.parentElement, search);
}
