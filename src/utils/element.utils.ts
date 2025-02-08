import { closest } from '@dom/dom.utils';

/**
 * Generates a unique identifier for an HTML element based on its properties
 * @param element The HTML element to generate an ID for
 * @returns A string hash of the element's properties
 */
export function generateElementId(element: HTMLElement): string {
  // Get element properties safely with type checking
  const properties: string[] = [element.tagName || '', element.className || '', (element as HTMLImageElement).src || '', (element as HTMLAnchorElement).href || '', element.textContent || ''];

  // Join all properties and generate hash
  const str = properties.join('_');
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
}

/**
 * Gets an array of element IDs from a container based on a draggable selector
 * @param container The container element to search within
 * @param draggableSelector The selector to identify draggable elements
 * @param dataIdAttr The attribute to use for element IDs
 * @returns Array of element IDs
 */
export function getElementsArray(container: HTMLElement, draggableSelector: string, dataIdAttr: string): string[] {
  const order: string[] = [];
  const children = container.children;

  for (let i = 0; i < children.length; i++) {
    const el = children[i] as HTMLElement;
    if (closest(el, draggableSelector, container, false)) {
      order.push(el.getAttribute(dataIdAttr) || generateElementId(el));
    }
  }

  return order;
}
