import { ISortable } from '@core/sortable.interfaces';
import { SortableState } from '@core/state';
import { css, getRect } from '@dom/dom.utils';
import { indexOfObject } from '@utils/array';
import { CleanupManager } from '../cleanup.manager';
import { IAnimationManager, IAnimationState } from './animation.interfaces';
import { animate as animateElement, calculateRealTime, isRectEqual } from './animation.utils';

/**
 * Manages animation states and transitions for sortable elements
 */
export class AnimationStateManager implements IAnimationManager {
  private animationStates: IAnimationState[] = [];
  private animationCallbackId?: number;
  private sortable: ISortable;
  private state: SortableState;
  private cleanupManager: CleanupManager;
  private instanceId: symbol;

  constructor(sortable: ISortable) {
    this.sortable = sortable;
    this.state = SortableState.getInstance();
    this.cleanupManager = CleanupManager.getInstance();
    this.instanceId = Symbol('AnimationStateManager');
  }

  /**
   * Captures the current state of all animated children
   */
  public captureAnimationState(): void {
    this.animationStates = [];
    if (!this.sortable.options.animation) return;

    const dragState = this.state.getDragOperation();
    const children = Array.from(this.sortable.el.children);

    children.forEach((child) => {
      if (!(child instanceof HTMLElement)) return;
      if (css(child, 'display') === 'none' || child === dragState.ghostEl) return;

      const state: IAnimationState = {
        target: child,
        rect: getRect(child),
      };

      this.animationStates.push(state);

      // Store original rect for reference
      const fromRect = { ...state.rect };

      // Compensate for ongoing animations
      if (child.thisAnimationDuration) {
        this.compensateForAnimation(child, fromRect);
      }

      child.fromRect = fromRect;
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
    const index = indexOfObject(this.animationStates, { target });
    if (index !== -1) {
      this.animationStates.splice(index, 1);
    }
  }

  /**
   * Animates all tracked states
   */
  public animateAll(callback?: () => void): void {
    if (!this.sortable.options.animation) {
      this.clearAnimation(callback);
      return;
    }

    const { animating, maxDuration } = this.processAnimationStates();

    this.scheduleCallback(animating, maxDuration, callback);
    this.animationStates = [];
  }

  /**
   * Animate a single element
   */
  public animate(target: HTMLElement, currentRect: DOMRect, toRect: DOMRect, duration: number): void {
    animateElement(target, currentRect, toRect, duration, this.sortable.options);
  }

  /**
   * Compensates for any existing CSS transform matrix by adjusting the position coordinates of a DOMRect.
   * This is useful when you need the true position of an element ignoring its current transform.
   * @param element - The HTML element to check for transform matrix
   * @param rect - The original DOMRect to adjust
   * @returns A new DOMRect with position adjusted for transform matrix, or the original rect if no transform exists
   */
  private compensateForAnimation(element: HTMLElement, rect: DOMRect): DOMRect {
    const computedMatrix: string = getComputedStyle(element).transform;
    if (computedMatrix && computedMatrix !== 'none') {
      const matrix: DOMMatrix = new DOMMatrix(computedMatrix);
      // Create a mutable copy of the rect properties
      return new DOMRect(
        rect.x - matrix.m41, // Adjust x/left
        rect.y - matrix.m42, // Adjust y/top
        rect.width,
        rect.height
      );
    }
    return rect;
  }

  /**
   * Process all animation states and calculate timings
   */
  private processAnimationStates(): { animating: boolean; maxDuration: number } {
    let animating = false;
    let maxDuration = 0;

    this.animationStates.forEach((state) => {
      const duration = this.calculateAnimationDuration(state);
      if (duration) {
        animating = true;
        maxDuration = Math.max(maxDuration, duration);
        this.setupAnimationReset(state.target, duration);
      }
    });

    return { animating, maxDuration };
  }

  /**
   * Calculates the appropriate animation duration for a state transition.
   * If there's an ongoing animation, it may calculate real-time duration based on previous positions.
   * Otherwise, it uses the default animation duration from options.
   *
   * @param state - The animation state containing target and position information
   * @returns The calculated animation duration in milliseconds
   */
  private calculateAnimationDuration(state: IAnimationState): number {
    const { target } = state;
    const currentRect: DOMRect = getRect(target);
    let duration: number = 0;

    // If there's an ongoing animation, check if we need to calculate real-time duration
    if (target.thisAnimationDuration && target.prevFromRect && target.prevToRect && isRectEqual(target.prevFromRect, currentRect)) {
      duration = calculateRealTime(state.rect, target.prevFromRect, target.prevToRect, this.sortable.options);
    }

    // If the position has changed from the initial position
    if (target.fromRect && !isRectEqual(currentRect, target.fromRect)) {
      // Update tracking for the next animation frame
      this.updateAnimationTracking(target, currentRect);

      // Use default animation duration if real-time duration wasn't calculated
      if (!duration) {
        duration = this.sortable.options.animation || 0;
      }

      this.animate(target, state.rect, currentRect, duration);
    }

    return duration;
  }

  /**
   * Determine if we should calculate real duration based on previous states
   */
  // private shouldCalculateRealDuration(target: HTMLElement, currentRect: DOMRect): boolean {
  //   return target.prevFromRect && target.prevToRect && isRectEqual(target.prevFromRect, currentRect) && !isRectEqual(target.fromRect!, currentRect);
  // }

  /**
   * Update animation tracking state for an element
   */
  private updateAnimationTracking(target: HTMLElement, currentRect: DOMRect): void {
    target.prevFromRect = target.fromRect!;
    target.prevToRect = currentRect;
  }

  /**
   * Setup animation reset timer for an element
   */
  private setupAnimationReset(target: HTMLElement, duration: number): void {
    if (target.animationResetTimer) {
      clearTimeout(target.animationResetTimer);
    }

    target.animationResetTimer = window.setTimeout(() => {
      target.animationTime = 0;
      target.prevFromRect = null;
      target.fromRect = null;
      target.prevToRect = null;
      target.thisAnimationDuration = null;
      target.animationResetTimer = undefined;
    }, duration);

    // Register timer for cleanup
    this.cleanupManager.registerTimer(this.instanceId, target.animationResetTimer);
    target.thisAnimationDuration = duration;
  }

  /**
   * Schedule the animation callback
   */
  private scheduleCallback(animating: boolean, duration: number, callback?: () => void): void {
    if (this.animationCallbackId) {
      clearTimeout(this.animationCallbackId);
    }

    if (!animating) {
      callback?.();
      return;
    }

    this.animationCallbackId = window.setTimeout(() => {
      callback?.();
      this.animationCallbackId = undefined;
    }, duration);

    // Register timer for cleanup
    if (this.animationCallbackId) {
      this.cleanupManager.registerTimer(this.instanceId, this.animationCallbackId);
    }
  }

  /**
   * Clear animation state and execute callback
   */
  private clearAnimation(callback?: () => void): void {
    clearTimeout(this.animationCallbackId);
    callback?.();
  }

  public destroy(): void {
    // The cleanupManager.cleanup will handle all timer cleanup
    this.cleanupManager.cleanup(this.instanceId);
  }
}
