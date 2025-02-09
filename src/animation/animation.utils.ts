import type { ISortableOptions } from '@core/sortable.interfaces';
import { css, matrix } from '@dom/dom.utils';

/**
 * Checks if two DOMRects are equal within rounding tolerance
 */
export const isRectEqual = (rect1: DOMRect, rect2: DOMRect): boolean => {
  return Math.round(rect1.top) === Math.round(rect2.top) && Math.round(rect1.left) === Math.round(rect2.left) && Math.round(rect1.height) === Math.round(rect2.height) && Math.round(rect1.width) === Math.round(rect2.width);
};

/**
 * Calculates the real animation time based on movement distances
 */
export const calculateRealTime = (animatingRect: DOMRect, fromRect: DOMRect, toRect: DOMRect, options: ISortableOptions): number => {
  const dx1 = Math.pow(fromRect.top - animatingRect.top, 2);
  const dy1 = Math.pow(fromRect.left - animatingRect.left, 2);
  const dx2 = Math.pow(fromRect.top - toRect.top, 2);
  const dy2 = Math.pow(fromRect.left - toRect.left, 2);

  return (Math.sqrt(dx1 + dy1) / Math.sqrt(dx2 + dy2)) * (options.animation || 0);
};

/**
 * Forces a browser repaint by accessing offsetWidth
 */
export const forceRepaint = (target: HTMLElement): number => target.offsetWidth;

/**
 * Animate an element from one position to another using transforms
 */
export const animate = (target: HTMLElement, currentRect: DOMRect, toRect: DOMRect, duration: number, options: ISortableOptions): void => {
  if (!duration) return;

  // Clear existing transitions and transforms
  css(target, 'transition', '');
  css(target, 'transform', '');

  // Calculate scaling
  const elMatrix = matrix(target);
  const scaleX = elMatrix?.a || 1;
  const scaleY = elMatrix?.d || 1;

  // Calculate translation distances
  const translateX = (currentRect.left - toRect.left) / scaleX;
  const translateY = (currentRect.top - toRect.top) / scaleY;

  // Set animation flags
  target.animatingX = !!translateX;
  target.animatingY = !!translateY;

  // Apply initial transform
  css(target, 'transform', `translate3d(${translateX}px,${translateY}px,0)`);

  // Force repaint before transition
  forceRepaint(target);

  // Start animation
  css(target, 'transition', `transform ${duration}ms${options.easing ? ' ' + options.easing : ''}`);
  css(target, 'transform', 'translate3d(0,0,0)');

  // Clear previous animation timeout
  if (target.animated) {
    clearTimeout(target.animated as number);
  }

  // Set cleanup timeout
  target.animated = window.setTimeout(() => {
    css(target, 'transition', '');
    css(target, 'transform', '');
    target.animated = false;
    target.animatingX = false;
    target.animatingY = false;
  }, duration) as unknown as number;
};
