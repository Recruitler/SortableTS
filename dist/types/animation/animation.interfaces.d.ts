/**
 * Represents the state of an animation for a sortable element
 */
export interface IAnimationState {
    /** The HTML element being animated */
    target: HTMLElement;
    /** The current geometric rectangle of the element */
    rect: DOMRect;
}
/**
 * Animation properties that can be attached to HTMLElements
 */
export interface IAnimationProperties {
    /** Timer ID for animation reset */
    animationResetTimer?: number;
    /** Current animation duration */
    animationTime?: number;
    /** Whether element is animating on X axis */
    animatingX?: boolean;
    /** Whether element is animating on Y axis */
    animatingY?: boolean;
    /** Original rectangle before animation */
    fromRect?: DOMRect | null;
    /** Previous from rectangle */
    prevFromRect?: DOMRect | null;
    /** Previous to rectangle */
    prevToRect?: DOMRect | null;
    /** Current animation duration */
    thisAnimationDuration?: number | null;
    /** Animation timeout ID */
    animated?: number | boolean;
}
/**
 * Core animation management interface
 */
export interface IAnimationManager {
    /** Captures current animation state of all relevant children */
    captureAnimationState(): void;
    /** Add a new animation state to track */
    addAnimationState(state: IAnimationState): void;
    /** Remove animation state for target */
    removeAnimationState(target: HTMLElement): void;
    /** Animate all tracked states */
    animateAll(callback?: () => void): void;
    /** Animate a single element */
    animate(target: HTMLElement, currentRect: DOMRect, toRect: DOMRect, duration: number): void;
}
declare global {
    interface HTMLElement extends IAnimationProperties {
    }
}
