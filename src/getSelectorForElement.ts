/**
 * Returns an array of element descriptors for the element and each of its parent's going up to the document element.
 * @param element
 * @returns
 */
export default function getSelectorForElement(element: HTMLElement | null): string[] {
  if (element === document.documentElement || element == null || typeof element.getAttribute !== 'function') {
    return []
  } else {
    // add id if present
    const id = element.getAttribute('id')

    if (id) {
      // if the element has an ID, we can assume it's unique and not continue walking up the DOM tree
      return [`#${id}`]
    } else {
      let selector = element.localName

      // add css classes if present
      const { classList } = element

      if (classList.length) {
        selector += '.' + Array.from(classList.values()).join('.')
      }
      return [...getSelectorForElement(element.parentElement), selector]
    }
  }
}
