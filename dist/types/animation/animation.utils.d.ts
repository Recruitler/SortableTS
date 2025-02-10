import type { ISortableOptions } from '@core/sortable.interfaces';
/**
 * Checks if two DOMRects are equal within rounding tolerance
 */
export declare const isRectEqual: (rect1: DOMRect, rect2: DOMRect) => boolean;
/**
 * Calculates the real animation time based on movement distances
 */
export declare const calculateRealTime: (animatingRect: DOMRect, fromRect: DOMRect, toRect: DOMRect, options: ISortableOptions) => number;
/**
 * Forces a browser repaint by accessing offsetWidth
 */
export declare const forceRepaint: (target: HTMLElement) => number;
/**
 * Animate an element from one position to another using transforms
 */
export declare const animate: (target: HTMLElement, currentRect: DOMRect, toRect: DOMRect, duration: number, options: ISortableOptions) => void;
