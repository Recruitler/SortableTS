export interface IAnimationState {
    target: HTMLElement;
    rect: DOMRect; // SortableTS uses DOMRect
  }
  
  export interface IAnimationManager {
    captureAnimationState(): void;
    addAnimationState(state: IAnimationState): void;
    removeAnimationState(target: HTMLElement): void;
    animateAll(callback?: () => void): void;
    animate(target: HTMLElement, currentRect: DOMRect, toRect: DOMRect, duration: number): void;
  }