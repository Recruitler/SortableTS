import { ISortableDOMEventListener, ISortableDOMEvents } from '@/dom/event.interfaces';
import { getEventCoordinates, getTouchFromEvent } from '@/utils/touch';
import { AnimationStateManager } from '@animation/animation';
import { IAnimationState } from '@animation/animation.interfaces';
import { ISortable, ISortableGroup, ISortableOptions, SortableDirection } from '@core/sortable.interfaces';
import { closest, css, getRect, matrix, toggleClass } from '@dom/dom.utils';
import { getElementsArray } from '@utils/element';
import { getScroll, getScrollParent } from '@utils/scroll';
import { CleanupManager } from '../cleanup.manager';
import { DragState, SortableState } from './state';

export class Sortable implements ISortable {
  private static defaultOptions: ISortableOptions = {
    group: null,
    sort: true,
    disabled: false,
    store: null,
    handle: null,
    draggable: '>*',
    swapThreshold: 1,
    invertSwap: false,
    invertedSwapThreshold: null,
    removeCloneOnHide: true,
    direction: 'vertical',
    draggingClass: 'sortable-dragging',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    ignore: 'a, img',
    filter: null,
    preventOnFilter: true,
    animation: 0,
    easing: null,
    setData: function (dataTransfer: DataTransfer, activeEl: HTMLElement) {
      dataTransfer.setData('Text', activeEl.textContent || '');
    },
    dropBubble: false,
    dragoverBubble: false,
    dataIdAttr: 'data-id',
    delay: 0,
    touchStartThreshold: 1,
    forceFallback: false,
    fallbackClass: 'sortable-fallback',
    fallbackOnBody: false,
    fallbackTolerance: 0,
    fallbackOffset: { x: 0, y: 0 },
    supportPointer: true,
    emptyInsertThreshold: 5,
  };

  private readonly state: SortableState;
  private readonly instanceId: symbol;
  private readonly cleanupManager: CleanupManager;
  private animationManager: AnimationStateManager;
  private dragStartTimer?: number;
  private normalizedGroup: ISortableGroup | null = null;

  public options: ISortableOptions;
  public el: HTMLElement;

  constructor(el: HTMLElement, options?: Partial<ISortableOptions>) {
    if (!el || !el.nodeType || el.nodeType !== 1) {
      throw new Error('Sortable: `el` must be HTMLElement, not null or undefined');
    }

    this.instanceId = Symbol('SortableInstance');
    this.cleanupManager = CleanupManager.getInstance();
    this.el = el;
    this.options = { ...Sortable.defaultOptions, ...options };
    this.state = SortableState.getInstance();

    // Initialize animation manager with cleanup
    this.animationManager = new AnimationStateManager(this);
    this.cleanupManager.registerAnimationCleanup(this.instanceId, () => {
      this.animationManager.destroy();
    });

    // Register this instance in state
    this.state.registerInstance(el, this);

    // Initialize event listeners
    this.initializeEventListeners();

    // Prepare group options if specified
    if (this.options.group) {
      this.prepareGroup();
    }
  }

  private initializeEventListeners(): void {
    const verifyDragHandler: ISortableDOMEventListener = (evt: ISortableDOMEvents): void => {
      this.verifyDrag(evt);
    };

    // Register main event listeners
    if (this.options.supportPointer) {
      this.cleanupManager.registerEventListener(this.instanceId, this.el, 'pointerdown', verifyDragHandler);
    } else {
      this.cleanupManager.registerEventListener(this.instanceId, this.el, 'mousedown', verifyDragHandler);
      this.cleanupManager.registerEventListener(this.instanceId, this.el, 'touchstart', verifyDragHandler);
    }

    // Register scroll listeners if needed
    const scrollEl = getScrollParent(this.el);
    if (scrollEl && scrollEl !== document.documentElement && scrollEl !== document.scrollingElement) {
      const scrollHandler: ISortableDOMEventListener = (evt: ISortableDOMEvents): void => {
        this.onScroll(evt);
      };

      this.cleanupManager.registerEventListener(this.instanceId, scrollEl, 'scroll', scrollHandler);
    }
  }

  // Helper method that calculates if elements should be swapped based on movement
  private onMove = (dragRect: DOMRect, targetRect: DOMRect, direction: SortableDirection, sibling: HTMLElement | null): boolean => {
    const options = this.options;
    const threshold = options.swapThreshold || 1;
    const invertSwap = options.invertSwap || false;
    const invertedThreshold = options.invertedSwapThreshold || threshold;

    const after = invertSwap ? !invertedThreshold : threshold > 0.5;
    const dragState = this.state.getDragOperation();

    if (direction === 'vertical') {
      const dragCenter = dragRect.top + dragRect.height / 2;
      const targetCenter = targetRect.top + targetRect.height / 2;
      const isOverThreshold = after ? (dragCenter - targetCenter) / targetRect.height > threshold : (targetCenter - dragCenter) / targetRect.height > invertedThreshold;

      if (isOverThreshold) {
        return this.dispatchMoveEvent(sibling, dragState.sourceEl, after);
      }
    } else {
      const dragCenter = dragRect.left + dragRect.width / 2;
      const targetCenter = targetRect.left + targetRect.width / 2;
      const isOverThreshold = after ? (dragCenter - targetCenter) / targetRect.width > threshold : (targetCenter - dragCenter) / targetRect.width > invertedThreshold;

      if (isOverThreshold) {
        return this.dispatchMoveEvent(sibling, dragState.sourceEl, after);
      }
    }

    return false;
  };

  private dispatchMoveEvent(target: HTMLElement | null, related: HTMLElement | null, willInsertAfter: boolean): boolean {
    if (!target || !related) return false;

    const moveEvent = new CustomEvent('sortable:move', {
      bubbles: true,
      cancelable: true,
      detail: {
        target,
        related,
        willInsertAfter,
      },
    });

    this.el.dispatchEvent(moveEvent);
    return !moveEvent.defaultPrevented;
  }

  // initial event handler: triggers when a user first interacts with a sortable element
  private verifyDrag = (evt: ISortableDOMEvents): void => {
    if (!evt.cancelable) return;

    const target = this.state.getEventTarget(evt);
    if (!target) return;

    const validTarget = closest(target, this.getDraggableSelector(), this.el, false);
    if (!validTarget) return;

    // Get initial position from event
    const coordinates = getEventCoordinates(evt);
    if (!coordinates) return;

    const { clientX, clientY } = coordinates;

    // Start drag operation in state with initial position
    this.state.startDrag(validTarget, clientX, clientY);

    // Initialize drag position
    const touch = getTouchFromEvent(evt);
    if (touch) {
      this.state.updateDragPosition(touch.clientX, touch.clientY);
    }

    this.initializeDragOperation(touch, validTarget);
  };

  private initDrag = () => {
    const dragState = this.state.getDragOperation();
    if (!dragState.sourceEl) return;

    // Create preview
    this.appendDraggingEl();

    // Setup document listeners
    const ownerDocument = this.el.ownerDocument;
    if (this.options.supportPointer) {
      this.cleanupManager.registerEventListener(this.instanceId, ownerDocument, 'pointermove', this.calculateDrag as EventListener);
    } else {
      this.cleanupManager.registerEventListener(this.instanceId, ownerDocument, 'mousemove', this.calculateDrag as EventListener);
      this.cleanupManager.registerEventListener(this.instanceId, ownerDocument, 'touchmove', this.calculateDrag as EventListener);
    }
    this.cleanupManager.registerEventListener(this.instanceId, ownerDocument, 'dragover', this.onDragOver as EventListener);

    // Update state and dispatch
    this.state.updateDragElements({
      dragEl: dragState.sourceEl,
      oldIndex: Array.from(this.el.children).indexOf(dragState.sourceEl),
    });
    this.dispatchSortEvent('dragstart');
  };

  private initializeDragOperation(touch: Touch | PointerEvent | null, target: HTMLElement): void {
    target.style.willChange = 'transform';
    this.bindDragListeners(!!touch);

    // Handle delay if needed
    const delay = (this.options as ISortableOptions).delay;

    if (this.shouldApplyDelay()) {
      this.dragStartTimer = window.setTimeout(() => {
        this.initDrag();
        this.dragStartTimer = undefined;
      }, delay);

      // Register timer cleanup
      this.cleanupManager.registerTimer(this.instanceId, this.dragStartTimer);
    } else {
      this.initDrag();
    }
  }

  // Swap calculation logic: Tracks the dragging element
  private calculateDrag = (evt: ISortableDOMEvents): void => {
    const dragState = this.state.getDragOperation();
    if (!dragState.active || !evt.cancelable) return;

    const coordinates = getEventCoordinates(evt);
    if (!coordinates) return;

    const { clientX, clientY } = coordinates;

    // Update position in state
    this.state.updateDragPosition(clientX, clientY);

    if (dragState.dragEl) {
      evt.preventDefault();
      this.emulateDragOver(evt);

      // Update preview position
      const mtx = matrix(dragState.dragEl) || { e: 0, f: 0 };
      const dx = clientX - dragState.position.clientX;
      const dy = clientY - dragState.position.clientY;

      dragState.dragEl.style.transform = `translate3d(${dx + (mtx.e || 0)}px,${dy + (mtx.f || 0)}px,0)`;
    } else if (!dragState.moved) {
      const threshold = (this.options as ISortableOptions).touchStartThreshold || 1;
      const moveDistance = Math.max(Math.abs(clientX - dragState.position.clientX), Math.abs(clientY - dragState.position.clientY));

      if (moveDistance >= threshold) {
        this.state.updateDragElements({ moved: true });
        this.initDrag();
      }
    }
  };

  private onDragOver = (evt: ISortableDOMEvents): void => {
    const dragState = this.state.getDragOperation();
    if (!dragState.active || !dragState.sourceEl) return;

    evt.preventDefault();
    evt.stopPropagation();

    let clientX: number;
    let clientY: number;

    // Extract coordinates based on event type
    if (this.isTouchEvent(evt)) {
      const touch = evt.touches[0];
      if (!touch) return;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else if (this.isDragEvent(evt)) {
      clientX = evt.clientX;
      clientY = evt.clientY;
    } else {
      // MouseEvent
      clientX = evt.clientX;
      clientY = evt.clientY;
    }

    const targetEl = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    if (!targetEl) return;

    const validTarget = closest(targetEl, this.getDraggableSelector(), this.el, false);
    if (!validTarget || validTarget === dragState.sourceEl) return;

    const rect = getRect(validTarget);
    const direction = this.getDirection(evt, validTarget);

    // Calculate previous and next siblings for potential swapping
    const prevSibling = validTarget.previousElementSibling as HTMLElement | null;
    const nextSibling = validTarget.nextElementSibling as HTMLElement | null;

    // Calculate insertion point based on direction and position
    const centerY = rect.top + rect.height / 2;
    const centerX = rect.left + rect.width / 2;
    const isVertical = direction === 'vertical';
    const coordinate = isVertical ? clientY : clientX;
    const center = isVertical ? centerY : centerX;

    // Determine if we should insert before or after the target
    const insertBefore = coordinate < center;
    const sibling = insertBefore ? prevSibling : nextSibling;

    // Get drag element rect for comparison
    const dragRect = getRect(dragState.sourceEl);

    // Check if we should move the element
    if (this.onMove(dragRect, rect, direction, sibling)) {
      // Capture the current state for animation
      this.captureAnimationState();

      // Insert the dragged element
      if (insertBefore) {
        validTarget.parentNode?.insertBefore(dragState.sourceEl, validTarget);
      } else {
        validTarget.parentNode?.insertBefore(dragState.sourceEl, validTarget.nextSibling);
      }

      // Add animation state for the moved target
      this.addAnimationState({
        target: validTarget,
        rect: getRect(validTarget),
      });

      // Update drag state with new position
      this.state.updateDragPosition(clientX, clientY);

      // Dispatch sort event if needed
      const oldIndex = dragState.oldIndex ?? -1;
      const newIndex = Array.from(this.el.children).indexOf(dragState.sourceEl);

      if (oldIndex !== newIndex) {
        this.dispatchSortEvent('sort', {
          oldIndex,
          newIndex,
          dragEl: dragState.sourceEl,
          target: validTarget,
        });
      }

      // Animate elements if animation duration is set
      if ((this.options as ISortableOptions).animation) {
        this.animateAll();
      }
    }
  };

  private onScroll = (evt: ISortableDOMEvents): void => {
    const dragState = this.state.getDragOperation();
    if (!dragState.active || !dragState.dragEl) return;

    // Get scroll coordinates
    const { scrollTop, scrollLeft } = evt.target as HTMLElement;

    // Update drag element position based on scroll
    const mtx = matrix(dragState.dragEl) || { e: 0, f: 0 };
    const dx = dragState.position.clientX - dragState.position.initialX;
    const dy = dragState.position.clientY - dragState.position.initialY;

    dragState.dragEl.style.transform = `translate3d(${dx + (mtx.e || 0)}px,${dy + (mtx.f || 0)}px,0)`;

    // Update scroll position in state
    this.state.updateScrollPosition(scrollTop, scrollLeft);
  };

  private emulateDragOver = (evt: ISortableDOMEvents): void => {
    // 1. Validate drag state
    const dragState = this.state.getDragOperation();
    if (!dragState.active || !dragState.dragEl) return;

    // 2. Get coordinates from event
    const coordinates = getEventCoordinates(evt);
    if (!coordinates) return;

    const { clientX, clientY } = coordinates;

    // 3. Handle drag preview visibility
    this.toggleDraggingElVisibility(false);

    // 4. Find target element at point
    const targetAtPoint = document.elementFromPoint(clientX, clientY);
    if (!targetAtPoint || !(targetAtPoint instanceof HTMLElement)) {
      this.toggleDraggingElVisibility(true);
      return;
    }

    // 5. Show drag preview
    this.toggleDraggingElVisibility(true);

    // 6. Handle dragging outside current sortable
    if (this.isOutsideThisEl(targetAtPoint)) {
      const targetSortable = this.getSortableParent(targetAtPoint);
      if (targetSortable && targetSortable !== this) {
        targetSortable.handleDragOver(evt);
        return;
      }
    }

    // 7. Get valid drag target
    const validTarget = closest(targetAtPoint, this.getDraggableSelector(), this.el, false);
    if (!validTarget || validTarget === dragState.sourceEl) return;

    // 8. Calculate rects and direction
    const dragRect = getRect(dragState.dragEl);
    const targetRect = getRect(validTarget);
    const direction = this.getDirection(evt, validTarget);

    // 9. Determine sibling based on direction
    const sibling = this.getTargetSibling(validTarget, direction);

    // 10. Check if move is valid and perform animation
    if (this.onMove(dragRect, targetRect, direction, sibling)) {
      this.captureAnimationState();
      this._animate(validTarget);
      this.addAnimationState({
        target: validTarget,
        rect: getRect(validTarget),
      });
    }
  };

  private onDrop = (evt: Event): void => {
    if (evt) {
      evt.preventDefault();
    }

    const dragState = this.state.getDragOperation();
    if (!dragState.active || !dragState.dragEl) return;

    // Remove preview
    if (dragState.dragEl.parentNode) {
      dragState.dragEl.parentNode.removeChild(dragState.dragEl);
    }

    // Reset styles
    const draggingClass = (this.options as ISortableOptions).draggingClass || 'sortable-dragging';
    const fallbackClass = (this.options as ISortableOptions).fallbackClass || 'sortable-fallback';

    if (dragState.sourceEl) {
      toggleClass(dragState.sourceEl, draggingClass, false);
      toggleClass(dragState.sourceEl, fallbackClass, false);
    }

    // Dispatch drop event
    this.dispatchSortEvent('drop');

    // Reset state
    this.state.endDrag();
  };

  // Helper method to determine target sibling
  private getTargetSibling(target: HTMLElement, direction: SortableDirection): HTMLElement | null {
    return direction === 'vertical' ? (target.nextElementSibling as HTMLElement | null) : (target.previousElementSibling as HTMLElement | null);
  }

  private getSortableParent = (el: HTMLElement): ISortable | null => {
    let current: HTMLElement | null = el;

    while (current && current !== document.body) {
      const instance = this.state.getInstance(current);
      if (instance) return instance;
      current = current.parentElement;
    }

    return null;
  };

  private toggleDraggingElVisibility(show: boolean): void {
    const dragState = this.state.getDragOperation();
    if (dragState.dragEl) {
      css(dragState.dragEl, 'display', show ? '' : 'none');
    }
  }

  private appendDraggingEl(): void {
    const dragState: Readonly<DragState> = this.state.getDragOperation();
    if (!dragState.sourceEl) return;

    // Early container resolution
    const container: HTMLElement = (this.options as ISortableOptions).fallbackOnBody ? document.body : this.el;
    const scrollParent: HTMLElement | null = getScrollParent(this.el);
    const isAbsolutePositioning: boolean = (scrollParent && scrollParent !== document.body) ?? false;

    // Get initial rect with proper parameters
    const rect: DOMRect = getRect(dragState.sourceEl, true, (this.options as ISortableOptions).fallbackOnBody, true, container);

    // Create drag element with all properties
    const dragEl: HTMLElement = this.createDragElement(dragState.sourceEl, rect);

    // Position the element
    this.positionDragElement(dragEl, rect, isAbsolutePositioning, scrollParent);

    // Append and update state
    container.appendChild(dragEl);
    this.state.updateDragElements({ dragEl });
  }

  private createDragElement(sourceEl: HTMLElement, rect: DOMRect): HTMLElement {
    const dragEl: HTMLElement = sourceEl.cloneNode(true) as HTMLElement;
    const { draggingClass = 'sortable-dragging', fallbackClass = 'sortable-fallback' } = this.options;

    // Add classes
    toggleClass(dragEl, fallbackClass, true);
    toggleClass(dragEl, draggingClass, true);

    // Apply base styles
    const baseStyles: Record<string, string> = {
      position: 'fixed',
      zIndex: '100000',
      pointerEvents: 'none',
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      boxSizing: 'border-box',
      margin: '0',
      opacity: '0.8',
      transition: '',
      transform: '',
    };

    css(dragEl, baseStyles);
    return dragEl;
  }

  private positionDragElement(dragEl: HTMLElement, rect: DOMRect, isAbsolutePositioning: boolean, scrollParent: HTMLElement | null): void {
    if (!isAbsolutePositioning) {
      css(dragEl, {
        top: `${rect.top}px`,
        left: `${rect.left}px`,
      });
      return;
    }

    // Handle scroll parent positioning
    const scrollParentRect: DOMRect = getRect(scrollParent!);
    const scroll: { scrollTop: number; scrollLeft: number } = getScroll(scrollParent!);

    css(dragEl, {
      position: 'absolute',
      top: `${rect.top - scrollParentRect.top + scroll.scrollTop}px`,
      left: `${rect.left - scrollParentRect.left + scroll.scrollLeft}px`,
    });
  }

  // Type guards for event types
  private isTouchEvent(evt: Event): evt is TouchEvent {
    return 'touches' in evt;
  }

  private isDragEvent(evt: Event): evt is DragEvent {
    return 'dataTransfer' in evt;
  }

  private shouldApplyDelay(): boolean {
    return !!(this.options.delay && this.options.delay > 0);
  }

  private bindDragListeners(isTouch: boolean): void {
    const doc = this.el.ownerDocument;

    if ((this.options as ISortableOptions).supportPointer) {
      this.cleanupManager.registerEventListener(this.instanceId, doc, 'pointermove', this.calculateDrag as EventListener);
      this.cleanupManager.registerEventListener(this.instanceId, doc, 'pointerup', this.onDrop as EventListener);
      this.cleanupManager.registerEventListener(this.instanceId, doc, 'pointercancel', this.onDrop as EventListener);
    } else {
      this.cleanupManager.registerEventListener(this.instanceId, doc, isTouch ? 'touchmove' : 'mousemove', this.calculateDrag as EventListener);
      this.cleanupManager.registerEventListener(this.instanceId, doc, isTouch ? 'touchend' : 'mouseup', this.onDrop as EventListener);
      if (isTouch) {
        this.cleanupManager.registerEventListener(this.instanceId, doc, 'touchcancel', this.onDrop as EventListener);
      }
    }
  }

  private _animate(target: HTMLElement): void {
    const dragState = this.state.getDragOperation();
    if (!dragState.sourceEl) return;

    const oldIndex = Array.from(this.el.children).indexOf(dragState.sourceEl);
    const newIndex = Array.from(this.el.children).indexOf(target);

    if (oldIndex !== newIndex) {
      this.el.insertBefore(dragState.sourceEl, target);
      this.dispatchSortEvent('sort', {
        oldIndex,
        newIndex,
        dragEl: dragState.sourceEl,
        target,
      });
    }
  }

  private dispatchSortEvent(name: string, detail: Record<string, any> = {}): void {
    const evt = new CustomEvent(name, {
      bubbles: true,
      cancelable: true,
      detail: {
        ...detail,
        from: this.el,
      },
    });

    this.el.dispatchEvent(evt);
  }

  private getDirection(evt: Event, target: HTMLElement): SortableDirection {
    const direction = this.options.direction;
    if (typeof direction === 'function') {
      return direction.call(this, evt, target, this.state.getDragOperation().sourceEl);
    }
    return direction || 'vertical';
  }

  private isOutsideThisEl(target: HTMLElement | null): boolean {
    return !target || (!this.el.contains(target) && target !== this.el);
  }

  public destroy(): void {
    this.state.destroyInstance(this.instanceId);
  }

  public option<K extends keyof ISortableOptions>(name: K, value?: ISortableOptions[K]): ISortableOptions[K] {
    if (value === undefined) {
      return this.options[name];
    }

    this.options[name] = value;
    if (name === 'group') {
      this.prepareGroup();
    }
    return value;
  }

  public toArray(): string[] {
    return getElementsArray(this.el, this.getDraggableSelector(), (this.options as ISortableOptions).dataIdAttr || 'data-id');
  }

  public sort(order: string[], useAnimation?: boolean): void {
    const items: { [key: string]: HTMLElement } = {};
    const rootEl = this.el;

    this.toArray().forEach((id, i) => {
      const el = rootEl.children[i] as HTMLElement;
      if (closest(el, this.getDraggableSelector(), rootEl, false)) {
        items[id] = el;
      }
    });

    useAnimation && this.captureAnimationState();

    order.forEach((id) => {
      if (items[id]) {
        rootEl.removeChild(items[id]);
        rootEl.appendChild(items[id]);
      }
    });

    useAnimation && this.animateAll();
  }

  // unused so far
  public save(): void {
    const store = (this.options as ISortableOptions).store;
    store?.set?.(this);
  }

  // Animation Methods
  public captureAnimationState(): void {
    this.animationManager.captureAnimationState();
  }

  public addAnimationState(state: IAnimationState): void {
    this.animationManager.addAnimationState(state);
  }

  public removeAnimationState(target: HTMLElement): void {
    this.animationManager.removeAnimationState(target);
  }

  public animateAll(callback?: () => void): void {
    this.animationManager.animateAll(callback);
  }

  public animate(target: HTMLElement, currentRect: DOMRect, toRect: DOMRect, duration: number): void {
    this.animationManager.animate(target, currentRect, toRect, duration);
  }

  public handleDragOver(evt: ISortableDOMEvents): void {
    this.onDragOver(evt);
  }

  private getDraggableSelector(): string {
    return (this.options as ISortableOptions).draggable;
  }

  private prepareGroup(): void {
    const options = this.options;

    if (!options.group) {
      options.group = {
        name: undefined,
        pull: true,
        put: true,
        revertClone: false,
      };
    }

    if (typeof options.group === 'string') {
      options.group = { name: options.group };
    }

    const group = options.group as {
      name?: string;
      pull?: boolean | 'clone' | ((to: ISortable, from: ISortable, dragEl: HTMLElement, event: Event) => boolean);
      put?: boolean | string[] | ((to: ISortable, from: ISortable, dragEl: HTMLElement, event: Event) => boolean);
      revertClone?: boolean;
    };

    this.normalizedGroup = {
      name: group.name ?? null,
      checkPull: (to: ISortable, from: ISortable, dragEl: HTMLElement, evt: Event): boolean | 'clone' => {
        if (!group.pull) return false;
        if (typeof group.pull === 'function') {
          return group.pull(to, from, dragEl, evt);
        }
        return group.pull;
      },
      checkPut: (to: ISortable, from: ISortable, dragEl: HTMLElement, evt: Event): boolean => {
        if (!group.put) return false;
        if (Array.isArray(group.put)) {
          const fromGroup = (from as Sortable).normalizedGroup;
          return group.put.includes(fromGroup?.name ?? '');
        }
        if (typeof group.put === 'function') {
          return group.put(to, from, dragEl, evt);
        }
        return !!group.put;
      },
      revertClone: group.revertClone ?? false,
    };

    // Register group cleanup
    this.cleanupManager.registerCustomCleanup(this.instanceId, () => {
      this.normalizedGroup = null;
    });
  }
}
