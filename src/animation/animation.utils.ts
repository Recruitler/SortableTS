import { css, matrix } from '@dom/dom.utils';
import type { IRect, ISortableOptions } from '@core/sortable.interfaces';

// Augment HTMLElement type to include animation properties
declare global {
  interface HTMLElement {
    animated: boolean | number;
    animatingX: boolean;
    animatingY: boolean;
    fromRect: IRect | null;
    prevFromRect: IRect | null;
    prevToRect: IRect | null;
    thisAnimationDuration: number | null;
  }
}

export const isRectEqual = (rect1: IRect, rect2: IRect): boolean => 
  Math.round(rect1.top) === Math.round(rect2.top) &&
  Math.round(rect1.left) === Math.round(rect2.left) &&
  Math.round(rect1.height) === Math.round(rect2.height) &&
  Math.round(rect1.width) === Math.round(rect2.width);

export const calculateRealTime = (
  animatingRect: IRect,
  fromRect: IRect,
  toRect: IRect,
  options: ISortableOptions
): number => {
  const dx1 = Math.pow(fromRect.top - animatingRect.top, 2);
  const dy1 = Math.pow(fromRect.left - animatingRect.left, 2);
  const dx2 = Math.pow(fromRect.top - toRect.top, 2);
  const dy2 = Math.pow(fromRect.left - toRect.left, 2);

  return (Math.sqrt(dx1 + dy1) / Math.sqrt(dx2 + dy2)) * (options.animation || 0);
};

export const repaint = (target: HTMLElement): number => target.offsetWidth;

export const animate = (
  target: HTMLElement,
  currentRect: IRect,
  toRect: IRect,
  duration: number,
  options: ISortableOptions
): void => {
  if (!duration) return;

  css(target, 'transition', '');
  css(target, 'transform', '');

  const elMatrix = matrix(target);
  const scaleX = elMatrix?.a || 1;
  const scaleY = elMatrix?.d || 1;

  const translateX = (currentRect.left - toRect.left) / scaleX;
  const translateY = (currentRect.top - toRect.top) / scaleY;

  target.style.animatingX = !!translateX + '';
  target.style.animatingY = !!translateY + '';

  css(target, 'transform', `translate3d(${translateX}px,${translateY}px,0)`);
  repaint(target);

  css(target, 'transition', `transform ${duration}ms${options.easing ? ' ' + options.easing : ''}`);
  css(target, 'transform', 'translate3d(0,0,0)');

  clearTimeout(target.animated as any);
  target.animated = setTimeout(() => {
    css(target, 'transition', '');
    css(target, 'transform', '');
    target.animated = false;
    target.animatingX = false;
    target.animatingY = false;
  }, duration) as any;
};
