/**
 * Check if an element is scrollable
 */
export const isScrollable = (el: HTMLElement): boolean => {
  const computedStyle = window.getComputedStyle(el);
  const overflowY = computedStyle.overflowY;
  const overflowX = computedStyle.overflowX;

  return /auto|scroll|overlay|hidden/.test(overflowY) || /auto|scroll|overlay|hidden/.test(overflowX);
};

/**
 * Get the closest scrollable parent of an element
 * @param el Element to find scrollable parent for
 * @param includeHidden Whether to include elements with overflow: hidden
 * @returns The closest scrollable parent element or null if none found
 */
export const getScrollParent = (el: HTMLElement, includeHidden: boolean = false): HTMLElement | null => {
  let style: CSSStyleDeclaration;

  // Skip if element is not valid
  if (!el || !el.parentElement) {
    return null;
  }

  let parent: HTMLElement | null = el.parentElement;

  while (parent) {
    style = window.getComputedStyle(parent);
    const overflow = style.overflow + style.overflowY + style.overflowX;

    // Check if parent is scrollable
    if (/auto|scroll|overlay/.test(overflow) || (includeHidden && overflow.includes('hidden'))) {
      return parent;
    }

    parent = parent.parentElement;
  }

  // If no scrollable parent found, return document.scrollingElement or body
  return (document.scrollingElement as HTMLElement) || document.documentElement;
};

/**
 * Get all scrolling ancestors of an element
 */
export const getScrollingAncestors = (el: HTMLElement): HTMLElement[] => {
  const ancestors: HTMLElement[] = [];
  let parent = getScrollParent(el);

  while (parent) {
    ancestors.push(parent);
    parent = getScrollParent(parent);
  }

  return ancestors;
};

/**
 * Get scroll position of an element
 */
export const getScroll = (el: HTMLElement | Window): { scrollTop: number; scrollLeft: number } => {
  if (el === window) {
    return {
      scrollTop: window.pageYOffset || document.documentElement.scrollTop,
      scrollLeft: window.pageXOffset || document.documentElement.scrollLeft,
    };
  }

  return {
    scrollTop: (el as HTMLElement).scrollTop,
    scrollLeft: (el as HTMLElement).scrollLeft,
  };
};
