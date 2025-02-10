/**
 * Check if an element is scrollable
 */
export declare const isScrollable: (el: HTMLElement) => boolean;
/**
 * Get the closest scrollable parent of an element
 * @param el Element to find scrollable parent for
 * @param includeHidden Whether to include elements with overflow: hidden
 * @returns The closest scrollable parent element or null if none found
 */
export declare const getScrollParent: (el: HTMLElement, includeHidden?: boolean) => HTMLElement | null;
/**
 * Get all scrolling ancestors of an element
 */
export declare const getScrollingAncestors: (el: HTMLElement) => HTMLElement[];
/**
 * Get scroll position of an element
 */
export declare const getScroll: (el: HTMLElement | Window) => {
    scrollTop: number;
    scrollLeft: number;
};
