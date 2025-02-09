import { IAnimationManager, IAnimationState } from '@animation/animation.interfaces';
import { isRectEqual } from '@animation/animation.utils';
import { Sortable } from '@core/sortable';
import type { ISortable } from '@core/sortable.interfaces';
import { css, getRect, matrix } from '@dom/dom.utils';
import { indexOfObject } from '@utils/array';

/**
 * Manages animation states and transitions for sortable elements
 * Handles capturing, tracking, and executing animations during drag and drop operations
 */
export class AnimationStateManager implements IAnimationManager {
  private animationStates: IAnimationState[] = [];
  private animationCallbackId?: number;
  private sortable: ISortable;

  constructor(sortable: ISortable) {
    this.sortable = sortable;
  }

  /**
   * Captures the current state of all animated children
   * Creates a snapshot of positions and dimensions for animation tracking
   */
  public captureAnimationState(): void {
    this.animationStates = [];
    if (!this.sortable.options.animation) return;

    const children = Array.from(this.sortable.el.children);

    children.forEach((child) => {
      if (!(child instanceof HTMLElement)) return;
      if (css(child, 'display') === 'none' || child === Sortable.previewEl) return;

      const state: IAnimationState = {
        target: child,
        rect: getRect(child),
      };

      this.animationStates.push(state);

      const fromRect = { ...state.rect };

      // Compensate for any ongoing animations
      if ((child as any).thisAnimationDuration) {
        const childMatrix = matrix(child, true);
        if (childMatrix) {
          fromRect.top -= childMatrix.f;
          fromRect.left -= childMatrix.e;
        }
      }

      (child as any).fromRect = fromRect;
    });
  }

  /**
   * Adds a new animation state to track
   */
  public addAnimationState(state: IAnimationState): void {
    this.animationStates.push(state);
  }

  /**
   * Removes an animation state for a specific target
   */
  public removeAnimationState(target: HTMLElement): void {
    this.animationStates.splice(indexOfObject(this.animationStates, { target }), 1);
  }

  /**
   * Animates all tracked states and executes callback when complete
   */
  public animateAll(callback?: () => void): void {
    if (!this.sortable.options.animation) {
      clearTimeout(this.animationCallbackId);
      if (callback) callback();
      return;
    }

    let animating = false;
    let animationTime = 0;

    this.animationStates.forEach((state) => {
      const time = this.calculateAnimationTime(state);
      if (time) {
        animating = true;
        animationTime = Math.max(animationTime, time);
        this.animateStateWithTimer(state, time);
      }
    });

    clearTimeout(this.animationCallbackId);
    if (!animating) {
      if (callback) callback();
    } else {
      this.animationCallbackId = window.setTimeout(() => {
        if (callback) callback();
      }, animationTime);
    }
    this.animationStates = [];
  }

  /**
   * Calculates the appropriate animation duration for a state
   * Takes into account previous animations and element positions
   */
  private calculateAnimationTime(state: IAnimationState): number {
    const { target } = state;
    const targetRect = getRect(target);
    const fromRect = (target as any).fromRect;
    const prevFromRect = (target as any).prevFromRect;
    const prevToRect = (target as any).prevToRect;

    let time = 0;

    if ((target as any).thisAnimationDuration) {
      if (prevFromRect && prevToRect && isRectEqual(prevFromRect, targetRect) && !isRectEqual(fromRect, targetRect)) {
        // Calculate time for animations returning to original position
        time = this.calculateRealTime(state.rect, prevFromRect, prevToRect);
      }
    }

    if (!isRectEqual(targetRect, fromRect)) {
      (target as any).prevFromRect = fromRect;
      (target as any).prevToRect = targetRect;

      if (!time) {
        time = this.sortable.options.animation!;
      }

      this.animate(target, state.rect, targetRect, time);
    }

    return time;
  }

  /**
   * Calculates the real animation time based on movement distance
   */
  private calculateRealTime(animatingRect: DOMRect, fromRect: DOMRect, toRect: DOMRect): number {
    const duration = this.sortable.options.animation || 0;
    return (Math.sqrt(Math.pow(fromRect.top - animatingRect.top, 2) + Math.pow(fromRect.left - animatingRect.left, 2)) / Math.sqrt(Math.pow(fromRect.top - toRect.top, 2) + Math.pow(fromRect.left - toRect.left, 2))) * duration;
  }

  /**
   * Executes the animation for a single element
   * Handles transform transitions with proper browser repaints
   */
  public animate(target: HTMLElement, currentRect: DOMRect, toRect: DOMRect, duration: number): void {
    if (duration) {
      css(target, 'transition', '');
      css(target, 'transform', '');

      const elMatrix = matrix(this.sortable.el);
      const scaleX = elMatrix?.a || 1;
      const scaleY = elMatrix?.d || 1;

      const translateX = (currentRect.left - toRect.left) / scaleX;
      const translateY = (currentRect.top - toRect.top) / scaleY;

      (target as any).animatingX = !!translateX;
      (target as any).animatingY = !!translateY;

      css(target, 'transform', `translate3d(${translateX}px,${translateY}px,0)`);

      // Force a repaint before applying the transition
      this.forceRepaint(target);

      css(target, 'transition', `transform ${duration}ms${this.sortable.options.easing ? ' ' + this.sortable.options.easing : ''}`);
      css(target, 'transform', 'translate3d(0,0,0)');

      clearTimeout((target as any).animated);
      (target as any).animated = setTimeout(() => {
        css(target, 'transition', '');
        css(target, 'transform', '');
        (target as any).animated = false;
        (target as any).animatingX = false;
        (target as any).animatingY = false;
      }, duration);
    }
  }

  /**
   * Forces a browser repaint by accessing offsetWidth
   * This is necessary to ensure smooth transitions between transform states
   */
  private forceRepaint(target: HTMLElement): void {
    // Accessing offsetWidth forces a repaint
    // The value is intentionally not used - this call is purely to trigger a reflow
    void target.offsetWidth;
  }

  /**
   * Sets up animation reset timers for a state
   */
  private animateStateWithTimer(state: IAnimationState, time: number): void {
    const { target } = state;
    clearTimeout((target as any).animationResetTimer);
    (target as any).animationResetTimer = setTimeout(() => {
      (target as any).animationTime = 0;
      (target as any).prevFromRect = null;
      (target as any).fromRect = null;
      (target as any).prevToRect = null;
      (target as any).thisAnimationDuration = null;
    }, time);
    (target as any).thisAnimationDuration = time;
  }
}
