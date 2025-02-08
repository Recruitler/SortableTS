import { IAnimationState } from '@animation/animation.interfaces';

// Static members definition
export type SortableStatic = {
  active: ISortable | null;
  dragged: HTMLElement | null;
  ghost: HTMLElement | null;
  clone: HTMLElement | null;
};

export interface ISortableGroup {
  name: string | null;
  checkPull: (to: ISortable, from: ISortable, dragEl: HTMLElement, event: Event) => boolean | 'clone';
  checkPut: (to: ISortable, from: ISortable, dragEl: HTMLElement, event: Event) => boolean;
  revertClone?: boolean;
}

export type IGroupOptions =
  | {
      name?: string;
      pull?: boolean | 'clone' | ((to: ISortable, from: ISortable, dragEl: HTMLElement, event: Event) => boolean);
      put?: boolean | string[] | ((to: ISortable, from: ISortable, dragEl: HTMLElement, event: Event) => boolean);
      revertClone?: boolean;
    }
  | string
  | null;

export type SortableDirection = 'vertical' | 'horizontal';
export type DirectionFunction = (evt: Event, target: HTMLElement, dragEl: HTMLElement | null) => SortableDirection;

/**
 * Options for the Sortable instance.
 */
export interface ISortableOptions {
  /**
   * Group options.
   */
  group?: IGroupOptions;
  /**
   * Whether the list is sortable or not.
   */
  sort?: boolean;
  /**
   * Whether the sortable is disabled or not.
   */
  disabled?: boolean;
  /**
   * Store options.
   */
  store?: {
    get: (sortable: ISortable) => string[];
    set: (sortable: ISortable) => void;
  } | null;
  /**
   * Selector for the handle element.
   */
  handle?: string | null;
  /**
   * Selector for draggable elements within the container.
   */
  draggable: string;
  /**
   * Swap threshold.
   */
  swapThreshold?: number;
  /**
   * Whether to invert swap or not.
   */
  invertSwap?: boolean;
  /**
   * Inverted swap threshold.
   */
  invertedSwapThreshold?: number | null;
  /**
   * Whether to remove clone on hide or not.
   */
  removeCloneOnHide?: boolean;
  /**
   * Direction of the sortable.
   */
  direction?: SortableDirection | DirectionFunction;
  /**
   * Class for the ghost element.
   */
  ghostClass?: string;
  /**
   * Class for the chosen element.
   */
  chosenClass?: string;
  /**
   * Class for the drag element.
   */
  dragClass?: string;
  /**
   * Selector for elements to ignore.
   */
  ignore?: string;
  /**
   * Filter for the sortable.
   */
  filter?: string | ((evt: Event, target: HTMLElement, sortable: ISortable) => boolean) | null;
  /**
   * Whether to prevent on filter or not.
   */
  preventOnFilter?: boolean;
  /**
   * Animation duration.
   */
  animation?: number;
  /**
   * Easing function for the animation.
   */
  easing?: string | null;
  /**
   * Function to set data for the data transfer.
   */
  setData?: (dataTransfer: DataTransfer, dragEl: HTMLElement) => void;
  /**
   * Whether to bubble the drop event or not.
   */
  dropBubble?: boolean;
  /**
   * Whether to bubble the dragover event or not.
   */
  dragoverBubble?: boolean;
  /**
   * Data ID attribute.
   */
  dataIdAttr?: string;
  /**
   * Delay for the touch start event.
   */
  delay?: number;
  /**
   * Whether to delay on touch only or not.
   */
  delayOnTouchOnly?: boolean;
  /**
   * Touch start threshold.
   */
  touchStartThreshold?: number;
  /**
   * Whether to force fallback or not.
   */
  forceFallback?: boolean;
  /**
   * Class for the fallback element.
   */
  fallbackClass?: string;
  /**
   * Whether to append the fallback element to the body or not.
   */
  fallbackOnBody?: boolean;
  /**
   * Fallback tolerance.
   */
  fallbackTolerance?: number;
  /**
   * Fallback offset.
   */
  fallbackOffset?: { x: number; y: number };
  /**
   * Whether to support pointer events or not.
   */
  supportPointer?: boolean;
  /**
   * Empty insert threshold.
   */
  emptyInsertThreshold?: number;
  // Event handlers
  /**
   * Called when an item is chosen.
   */
  onChoose?: (evt: ISortableEvent) => void;
  /**
   * Called when an item is unchosen.
   */
  onUnchoose?: (evt: ISortableEvent) => void;
  /**
   * Called when the sortable is started.
   */
  onStart?: (evt: ISortableEvent) => void;
  /**
   * Called when the sortable is ended.
   */
  onEnd?: (evt: ISortableEvent) => void;
  /**
   * Called when an item is added.
   */
  onAdd?: (evt: ISortableEvent) => void;
  /**
   * Called when the sortable is updated.
   */
  onUpdate?: (evt: ISortableEvent) => void;
  /**
   * Called when the sortable is sorted.
   */
  onSort?: (evt: ISortableEvent) => void;
  /**
   * Called when an item is removed.
   */
  onRemove?: (evt: ISortableEvent) => void;
  /**
   * Called when the filter is applied.
   */
  onFilter?: (evt: ISortableEvent) => void;
  /**
   * Called when an item is moved.
   */
  onMove?: (evt: ISortableMoveEvent, originalEvent: Event) => boolean | -1 | 1;
  /**
   * Called when an item is cloned.
   */
  onClone?: (evt: ISortableEvent) => void;
}

export interface ISortableEvent {
  to: HTMLElement;
  from: HTMLElement;
  item: HTMLElement;
  clone: HTMLElement;
  oldIndex: number | null;
  newIndex: number | null;
  oldDraggableIndex: number | null;
  newDraggableIndex: number | null;
  originalEvent: Event;
  pullMode: 'clone' | boolean | undefined;
}

export interface ISortableMoveEvent {
  to: HTMLElement;
  from: HTMLElement;
  dragged: HTMLElement;
  draggedRect: DOMRect;
  related: HTMLElement;
  relatedRect: DOMRect;
  willInsertAfter: boolean;
  originalEvent: Event;
}

export interface IDragOverEvent {
  evt: Event;
  isOwner: boolean;
  axis: 'vertical' | 'horizontal';
  revert: boolean;
  dragRect: DOMRect;
  targetRect: DOMRect;
  canSort: boolean;
  fromSortable: ISortable;
  target: HTMLElement;
  completed: (insertion: boolean) => void;
  onMove: (target: HTMLElement, after: boolean) => number;
  changed: () => void;
}

export interface ISortable {
  options: ISortableOptions;
  el: HTMLElement;

  destroy(): void;
  option<K extends keyof ISortableOptions>(name: K, value?: ISortableOptions[K]): ISortableOptions[K];
  toArray(): string[];
  sort(order: string[], useAnimation?: boolean): void;
  save(): void;

  captureAnimationState(): void;
  addAnimationState(state: IAnimationState): void;
  removeAnimationState(target: HTMLElement): void;
  animateAll(callback?: () => void): void;
  animate(target: HTMLElement, currentRect: DOMRect, toRect: DOMRect, duration: number): void;
}

export interface IMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

// Remember: SortableJS uses a custom Rect type shaped like this, but we're using DOMRect now
export interface IRect {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
}
