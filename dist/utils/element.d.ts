/**
 * Generates a unique identifier for an HTML element based on its properties
 * @param element The HTML element to generate an ID for
 * @returns A string hash of the element's properties
 */
export declare function generateElementId(element: HTMLElement): string;
/**
 * Gets an array of element IDs from a container based on a draggable selector
 * @param container The container element to search within
 * @param draggableSelector The selector to identify draggable elements
 * @param dataIdAttr The attribute to use for element IDs
 * @returns Array of element IDs
 */
export declare function getElementsArray(container: HTMLElement, draggableSelector: string, dataIdAttr: string): string[];
