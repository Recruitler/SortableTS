import { ISortable } from '../core/sortable.interfaces';
import { IAnimationManager, IAnimationState } from './animation.interfaces';
/**
 * Manages animation states and transitions for sortable elements
 */
export declare class AnimationStateManager implements IAnimationManager {
    private animationStates;
    private animationCallbackId?;
    private sortable;
    private state;
    private cleanupManager;
    private instanceId;
    constructor(sortable: ISortable);
    /**
     * Captures the current state of all animated children
     */
    captureAnimationState(): void;
    /**
     * Adds a new animation state to track
     */
    addAnimationState(state: IAnimationState): void;
    /**
     * Removes an animation state for a specific target
     */
    removeAnimationState(target: HTMLElement): void;
    /**
     * Animates all tracked states
     */
    animateAll(callback?: () => void): void;
    /**
     * Animate a single element
     */
    animate(target: HTMLElement, currentRect: DOMRect, toRect: DOMRect, duration: number): void;
    /**
     * Compensates for any existing CSS transform matrix by adjusting the position coordinates of a DOMRect.
     * This is useful when you need the true position of an element ignoring its current transform.
     * @param element - The HTML element to check for transform matrix
     * @param rect - The original DOMRect to adjust
     * @returns A new DOMRect with position adjusted for transform matrix, or the original rect if no transform exists
     */
    private compensateForAnimation;
    /**
     * Process all animation states and calculate timings
     */
    private processAnimationStates;
    /**
     * Calculates the appropriate animation duration for a state transition.
     * If there's an ongoing animation, it may calculate real-time duration based on previous positions.
     * Otherwise, it uses the default animation duration from options.
     *
     * @param state - The animation state containing target and position information
     * @returns The calculated animation duration in milliseconds
     */
    private calculateAnimationDuration;
    /**
     * Determine if we should calculate real duration based on previous states
     */
    /**
     * Update animation tracking state for an element
     */
    private updateAnimationTracking;
    /**
     * Setup animation reset timer for an element
     */
    private setupAnimationReset;
    /**
     * Schedule the animation callback
     */
    private scheduleCallback;
    /**
     * Clear animation state and execute callback
     */
    private clearAnimation;
    destroy(): void;
}
