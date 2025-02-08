export { Sortable } from '@core/sortable';
export { type ISortableEvent as DragEvent, type IRect as Position, type ISortableEvent as SortableEvents, type ISortableOptions as SortableOptions } from '@core/sortable.interfaces';

// Export animation utilities and types
export { AnimationStateManager as animate } from '@animation/animation';
export { type IAnimationState as AnimationOptions, type IAnimationState as AnimationPoint } from '@animation/animation.interfaces';
export { animate as getTransform, animate as setTransform } from '@animation/animation.utils';

// Export DOM utilities if needed externally
export { closest, getRect } from '@dom/dom.utils';
export { off, on } from '@dom/event';
