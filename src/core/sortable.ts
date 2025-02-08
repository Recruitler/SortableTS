import { ISortable, ISortableGroup, ISortableOptions, SortableDirection } from '@core/sortable.interfaces';
import { getInstance, removeInstance, setInstance } from '@core/store';

import { AnimationStateManager } from '@animation/animation';
import { IAnimationState } from '@animation/animation.interfaces';
import { closest, css, getRect, matrix, toggleClass } from '@dom/dom.utils';
import { off, on } from '@dom/events.utils';
import { getElementsArray } from '@utils/element.utils';

export class Sortable implements ISortable {
  static active: ISortable | null = null;
  static dragged: HTMLElement | null = null;
  static ghost: HTMLElement | null = null;
  static clone: HTMLElement | null = null;

  private dragEl: HTMLElement | null = null;
  private parentEl: HTMLElement | null = null;
  private ghostEl: HTMLElement | null = null;
  private cloneEl: HTMLElement | null = null;
  private rootEl: HTMLElement;
  private nextEl: HTMLElement | null = null;
  private lastDownEl: HTMLElement | null = null;

  private oldIndex: number | null = null;
  private newIndex: number | null = null;
  private oldDraggableIndex: number | null = null;
  private newDraggableIndex: number | null = null;

  private awaitingDragStarted = false;
  private ignoreNextClick = false;
  private moved = false;

  public options: ISortableOptions;
  public el: HTMLElement;

  private animationManager: AnimationStateManager;
  private dragStartTimer?: number;
  private _lastX: number = 0;
  private _lastY: number = 0;

  private _normalizedGroup: ISortableGroup | null = null;

  constructor(el: HTMLElement, options?: Partial<ISortableOptions>) {
    if (!el || !el.nodeType || el.nodeType !== 1) {
      throw new Error('Sortable: `el` must be HTMLElement, not null or undefined');
    }

    this.el = el;
    this.options = { ...Sortable.defaultOptions, ...options };
    this.rootEl = el;

    // Export instance
    setInstance(el, this);

    // Initialize animation state manager
    this.animationManager = new AnimationStateManager(this);

    // Bind all private methods
    this.bindMethods();

    // Setup drag mode
    this.setupDragMode();

    // Bind events
    this.bindEvents();
  }

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
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    ignore: 'a, img',
    filter: null,
    preventOnFilter: true,
    animation: 0,
    easing: null,
    setData: function (dataTransfer: DataTransfer, dragEl: HTMLElement) {
      dataTransfer.setData('Text', dragEl.textContent || '');
    },
    dropBubble: false,
    dragoverBubble: false,
    dataIdAttr: 'data-id',
    delay: 0,
    delayOnTouchOnly: false,
    touchStartThreshold: 1,
    forceFallback: false,
    fallbackClass: 'sortable-fallback',
    fallbackOnBody: false,
    fallbackTolerance: 0,
    fallbackOffset: { x: 0, y: 0 },
    supportPointer: true,
    emptyInsertThreshold: 5,
  };

  private bindMethods(): void {
    // Define methods that need binding with proper type checking
    const methodsToBind = ['_onDragStart', '_onDragOver', '_onDrop', '_onTapStart', '_onTouchMove', '_delayedDragTouchMoveHandler'] as const;

    type MethodNames = (typeof methodsToBind)[number];

    methodsToBind.forEach((method: MethodNames) => {
      const boundMethod = this[method];
      if (typeof boundMethod === 'function') {
        (this[method] as any) = boundMethod.bind(this);
      }
    });
  }

  private setupDragMode(): void {
    // Implementation
  }

  private bindEvents(): void {
    const el = this.el;
    const options = this.options;

    if (options.supportPointer) {
      on(el, 'pointerdown', this._onTapStart);
    } else {
      on(el, 'mousedown', this._onTapStart);
      on(el, 'touchstart', this._onTapStart);
    }
  }

  public destroy(): void {
    // Remove event listeners
    off(this.el, 'dragstart', this._onDragStart);
    off(this.el, 'dragover', this._onDragOver);
    off(this.el, 'dragenter', this._onDragOver);

    off(this.el, 'drop', this._onDrop);
    off(this.el, 'dragend', this._onDrop);

    this._onDrop();

    // Clear references from the store
    removeInstance(this.el);

    // Clear other references without nulling el and rootEl
    this.dragEl = null;
    this.parentEl = null;
    this.ghostEl = null;
    this.cloneEl = null;
    this.nextEl = null;
  }

  public option<K extends keyof ISortableOptions>(name: K, value?: ISortableOptions[K]): ISortableOptions[K] {
    let options = this.options;

    if (value === undefined) {
      return options[name];
    } else {
      options[name] = value;
      if (name === 'group') {
        this._prepareGroup();
      }
      return value;
    }
  }

  public toArray(): string[] {
    return getElementsArray(this.el, this.getDraggableSelector(), this.options.dataIdAttr ?? 'data-id');
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

  public save(): void {
    const store = this.options.store;
    store?.set?.(this);
  }

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

  private _onTapStart(evt: MouseEvent | TouchEvent | PointerEvent): void {
    if (!evt.cancelable) return;

    const { el } = this;
    let { target } = evt;

    if (target && (target as HTMLElement)?.shadowRoot) {
      let touchPoint: { clientX: number; clientY: number };
      
      if ('touches' in evt && evt.touches[0]) {
        touchPoint = evt.touches[0];
      } else if ('pointerType' in evt && evt.pointerType === 'touch') {
        touchPoint = evt;
      } else {
        touchPoint = evt as MouseEvent;
      }
      
      const shadowTarget = (target as HTMLElement)?.shadowRoot?.elementFromPoint(touchPoint.clientX, touchPoint.clientY);
      if (shadowTarget) {
        target = shadowTarget;
      }
    }

    if (!target) return;

    const validTarget = closest(target as HTMLElement, this.getDraggableSelector(), el, false);
    if (!validTarget) return;

    let touch: Touch | PointerEvent | null;
    if ('touches' in evt && evt.touches[0]) {
      touch = evt.touches[0];
    } else if ('pointerType' in evt && evt.pointerType === 'touch') {
      touch = evt;
    } else {
      touch = null;
    }

    this._prepareDragStart(evt, touch, validTarget as HTMLElement);
  }

  private _prepareDragStart(evt: Event, touch: Touch | PointerEvent | null, target: HTMLElement): void {
    if (!target || !this.el) return;

    const dragRect = getRect(target);
    this.dragEl = target;
    this.parentEl = target.parentNode as HTMLElement;
    this.nextEl = target.nextElementSibling as HTMLElement;

    const options = this.options;
    const ownerDocument = this.el.ownerDocument;

    this._lastX = (touch || (evt as MouseEvent)).clientX;
    this._lastY = (touch || (evt as MouseEvent)).clientY;

    target.style.willChange = 'all';

    // Setup event handlers
    const touchMoveHandler = ((e: Event) => {
      this._onTouchMove(e as MouseEvent | TouchEvent | PointerEvent);
    }) as EventListener;

    const dropHandler = ((e: Event) => {
      this._onDrop(e);
    }) as EventListener;

    // Bind events
    if (options.supportPointer) {
      on(ownerDocument, 'pointermove', touchMoveHandler);
      on(ownerDocument, 'pointerup', dropHandler);
      on(ownerDocument, 'pointercancel', dropHandler);
    } else {
      on(ownerDocument, touch ? 'touchmove' : 'mousemove', touchMoveHandler);
      on(ownerDocument, touch ? 'touchend' : 'mouseup', dropHandler);
      if (touch) {
        on(ownerDocument, 'touchcancel', dropHandler);
      }
    }

    // Handle delay
    if (options.delay && (!options.delayOnTouchOnly || touch)) {
      this.dragStartTimer = window.setTimeout(() => {
        this._dragStarted();
      }, options.delay);

      // Bind delayed drag movement detection
      if (options.supportPointer) {
        on(ownerDocument, 'pointermove', this._delayedDragTouchMoveHandler);
      } else {
        on(ownerDocument, 'mousemove', this._delayedDragTouchMoveHandler);
        on(ownerDocument, 'touchmove', this._delayedDragTouchMoveHandler);
      }
    } else {
      this._dragStarted();
    }

    // Disable native drag
    if (target) {
      target.draggable = false;
    }
  }

  private _onTouchMove(evt: MouseEvent | TouchEvent | PointerEvent): void {
    if (!this.dragEl || !evt.cancelable) return;

    let touch: { clientX: number; clientY: number };

    if ('touches' in evt && evt.touches[0]) {
      touch = evt.touches[0];
    } else if ('pointerType' in evt && evt.pointerType === 'touch') {
      touch = evt;
    } else {
      touch = evt as MouseEvent;
    }

    const options = this.options;

    if (this.ghostEl) {
      const dx = touch.clientX - this._lastX;
      const dy = touch.clientY - this._lastY;

      evt.preventDefault();
      this._emulateDragOver(evt);

      // Update ghost position
      if (this.ghostEl) {
        const mtx = this.ghostEl.style.transform ? matrix(this.ghostEl) : { e: 0, f: 0 };

        this.ghostEl.style.transform = `translate3d(${dx + (mtx?.e || 0)}px,${dy + (mtx?.f || 0)}px,0)`;
      }
    } else if (!this.moved) {
      const threshold = options.touchStartThreshold || 1;
      const moveDistance = Math.max(Math.abs(touch.clientX - this._lastX), Math.abs(touch.clientY - this._lastY));

      if (moveDistance >= threshold) {
        this.moved = true;
        this._dragStarted();
      }
    }

    this._lastX = touch.clientX;
    this._lastY = touch.clientY;
  }

  private _onDragStart(evt: Event): void {
    if (!this.dragEl) return;

    const options = this.options;
    const dataTransfer = (evt as DragEvent).dataTransfer;

    // Set data
    if (dataTransfer) {
      dataTransfer.effectAllowed = 'move';
      options.setData?.(dataTransfer, this.dragEl);
    }

    // Create ghost
    this._createGhost();

    // Add ghost class
    const ghostClass = this.options.ghostClass || 'sortable-ghost';
    const fallbackClass = this.options.fallbackClass || 'sortable-fallback';
    if (this.dragEl) {
      toggleClass(this.dragEl, ghostClass, true);
    }

    Sortable.active = this;
    Sortable.dragged = this.dragEl;
  }

  private _createGhost(): void {
    if (!this.dragEl) return;

    const ghost = this.dragEl.cloneNode(true) as HTMLElement;
    const ghostClass = this.options.ghostClass || 'sortable-ghost';
    const fallbackClass = this.options.fallbackClass || 'sortable-fallback';
    ghost.classList.remove(ghostClass);
    ghost.classList.add(fallbackClass);
    const rect = getRect(this.dragEl);
    css(ghost, {
      transition: '',
      transform: '',
      boxSizing: 'border-box',
      margin: '0',
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      opacity: '0.8',
      position: 'fixed',
      zIndex: '100000',
      pointerEvents: 'none',
      display: '',
    });

    this.ghostEl = ghost;
    document.body.appendChild(ghost);
  }

  private _emulateDragOver(evt: Event): void {
    if (!this.dragEl || !this.ghostEl) return;

    const touch = (evt as TouchEvent).touches?.[0] || evt;
    const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;

    if (target) {
      const sortable = this._getSortableParent(target);
      if (sortable && sortable !== this) {
        this._onDragOver(evt);
      }
    }
  }

  private _getSortableParent(el: HTMLElement): ISortable | null {
    let currentEl: HTMLElement | null = el;

    while (currentEl && currentEl !== document.body) {
      const instance = getInstance(currentEl);
      if (instance) return instance;
      currentEl = currentEl.parentElement;
    }

    return null;
  }

  private _onDragOver(evt: Event): void {
    if (!this.dragEl) return;

    evt.preventDefault();
    evt.stopPropagation();

    const target = (evt as DragEvent).target as HTMLElement;
    const dragRect = getRect(this.dragEl);
    const targetRect = getRect(target);

    const direction = this._getDirection(evt, target);
    const sibling = direction === 'vertical' ? target.nextElementSibling : target.previousElementSibling;

    if (this._onMove(dragRect, targetRect, direction, sibling as HTMLElement)) {
      this._animate(target);
    }
  }

  private _onMove(dragRect: DOMRect, targetRect: DOMRect, direction: string, sibling: HTMLElement): boolean {
    const options = this.options;

    if (direction === 'vertical') {
      if (dragRect.top < targetRect.top) {
        return true;
      }
    } else {
      if (dragRect.left < targetRect.left) {
        return true;
      }
    }

    return false;
  }

  private _animate(target: HTMLElement): void {
    if (!this.dragEl) return; // Early return if dragEl is null

    const oldIndex = Array.from(this.el.children).indexOf(this.dragEl);
    const newIndex = Array.from(this.el.children).indexOf(target);

    if (oldIndex !== newIndex) {
      this.el.insertBefore(this.dragEl, target);
      this._dispatchSortEvent('sort', { oldIndex, newIndex });
    }
  }

  private _onDrop(evt?: Event): void {
    if (evt) {
      evt.preventDefault();
    }

    if (this.dragEl && this.ghostEl) {
      // Remove ghost
      this.ghostEl.parentNode?.removeChild(this.ghostEl);

      // Reset dragEl styles
      const ghostClass = this.options.ghostClass || 'sortable-ghost';
      const fallbackClass = this.options.fallbackClass || 'sortable-fallback';
      if (this.dragEl) {
        toggleClass(this.dragEl, ghostClass, false);
        toggleClass(this.dragEl, fallbackClass, false);
      }

      // Dispatch drop event
      this._dispatchSortEvent('drop');

      // Reset state
      this._nulling();
    }
  }

  private _nulling(): void {
    // Reset all state
    this.dragEl = null;
    this.ghostEl = null;
    this.parentEl = null;
    this.nextEl = null;
    this.cloneEl = null;

    this.oldIndex = null;
    this.newIndex = null;

    this.moved = false;
    this.awaitingDragStarted = false;

    Sortable.active = null;
    Sortable.dragged = null;
    Sortable.ghost = null;
  }

  private _dispatchSortEvent(name: string, detail: any = {}): void {
    const evt = new CustomEvent(name, {
      bubbles: true,
      cancelable: true,
      detail: {
        ...detail,
        oldIndex: this.oldIndex,
        newIndex: this.newIndex,
        from: this.el,
      },
    });

    this.el.dispatchEvent(evt);
  }

  private _prepareGroup(): void {
    const options = this.options;

    if (!options.group) {
      // Create default group options
      options.group = {
        name: undefined,
        pull: true,
        put: true,
        revertClone: false,
      };
    }

    // Convert string to object format
    if (typeof options.group === 'string') {
      options.group = { name: options.group };
    }

    // At this point options.group is an object
    const group = options.group as {
      name?: string;
      pull?: boolean | 'clone' | ((to: ISortable, from: ISortable, dragEl: HTMLElement, event: Event) => boolean);
      put?: boolean | string[] | ((to: ISortable, from: ISortable, dragEl: HTMLElement, event: Event) => boolean);
      revertClone?: boolean;
    };

    // Create normalized internal group
    this._normalizedGroup = {
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
          const fromGroup = (from as Sortable)._normalizedGroup;
          return group.put.includes(fromGroup?.name ?? '');
        }
        if (typeof group.put === 'function') {
          return group.put(to, from, dragEl, evt);
        }
        return !!group.put;
      },
      revertClone: group.revertClone ?? false,
    };
  }

  private _toFn(value: any, pull: boolean): (to: ISortable, from: ISortable, dragEl: HTMLElement, evt: Event) => boolean | 'clone' {
    return (to: ISortable, from: ISortable, dragEl: HTMLElement, evt: Event): boolean | 'clone' => {
      const toGroup = (to as Sortable)._normalizedGroup;
      const fromGroup = (from as Sortable)._normalizedGroup;
      const sameGroup = toGroup?.name && fromGroup?.name && toGroup.name === fromGroup.name;

      // Handle default cases
      if (value == null) {
        return !!(pull || sameGroup);
      }

      if (value === false) {
        return false;
      }

      if (pull && value === 'clone') {
        return 'clone';
      }

      // Handle function case
      if (typeof value === 'function') {
        return this._toFn(value(to, from, dragEl, evt), pull)(to, from, dragEl, evt);
      }

      // Handle string/array case
      const otherGroup = (pull ? toGroup : fromGroup)?.name ?? '';

      return !!(value === true || (typeof value === 'string' && value === otherGroup) || (Array.isArray(value) && value.includes(otherGroup)));
    };
  }

  private _getDirection(evt: Event, target: HTMLElement): SortableDirection {
    const directionOption = this.options.direction || 'vertical';

    if (typeof directionOption === 'function') {
      return directionOption.call(this, evt, target, this.dragEl);
    }

    return directionOption;
  }

  private _hideGhost(): void {
    if (this.ghostEl) {
      css(this.ghostEl, 'display', 'none');
    }
  }

  private _showGhost(): void {
    if (this.ghostEl) {
      css(this.ghostEl, 'display', '');
    }
  }

  private _appendGhost(): void {
    if (!this.dragEl) return;

    const container = this.options.fallbackOnBody ? document.body : this.rootEl;
    const rect = getRect(this.dragEl, true, this.options.fallbackOnBody, true, container);

    this.ghostEl = this.dragEl.cloneNode(true) as HTMLElement;
    const ghostClass = this.options.ghostClass || 'sortable-ghost';
    const fallbackClass = this.options.fallbackClass || 'sortable-fallback';
    if (this.ghostEl) {
      toggleClass(this.ghostEl, fallbackClass, true);
      toggleClass(this.ghostEl, ghostClass, true);
    }

    css(this.ghostEl, {
      transition: '',
      transform: '',
      boxSizing: 'border-box',
      margin: '0',
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      opacity: '0.8',
      position: 'fixed',
      zIndex: '100000',
      pointerEvents: 'none',
      display: '',
    });

    container.appendChild(this.ghostEl);
  }

  private _dragStarted(): void {
    if (!this.dragEl || !this.ghostEl) return;
    this.awaitingDragStarted = false;
    const ghostClass = this.options.ghostClass || 'sortable-ghost';
    if (this.dragEl) {
      toggleClass(this.dragEl, ghostClass, true);
    }
    Sortable.active = this;
    Sortable.dragged = this.dragEl;
    this._dispatchSortEvent('start');
  }

  private _delayedDragTouchMoveHandler: EventListener = ((e: Event): void => {
    const touch = (e as TouchEvent).touches?.[0] || (e as PointerEvent);
    if (!touch) return;

    const threshold = this.options.touchStartThreshold || 1;
    const deltaX = Math.abs(touch.clientX - this._lastX);
    const deltaY = Math.abs(touch.clientY - this._lastY);

    if (Math.max(deltaX, deltaY) >= threshold) {
      this._disableDelayedDrag();
    }
  }).bind(this);

  private _disableDelayedDrag(): void {
    if (!this.dragEl) return;

    css(this.dragEl, 'transform', '');
    clearTimeout(this.dragStartTimer);
    this._disableDelayedDragEvents();
    this._nulling(); // Reset state when drag is disabled
  }

  private _disableDelayedDragEvents(): void {
    const ownerDocument = this.el.ownerDocument;
    off(ownerDocument, 'mousemove', this._delayedDragTouchMoveHandler);
    off(ownerDocument, 'touchmove', this._delayedDragTouchMoveHandler);
    off(ownerDocument, 'pointermove', this._delayedDragTouchMoveHandler);
  }

  private _offMoveEvents(): void {
    off(document, 'mousemove', this._onTouchMove);
    off(document, 'touchmove', this._onTouchMove);
    off(document, 'pointermove', this._onTouchMove);
    off(document, 'dragover', this._onDragOver);
  }

  private _offUpEvents(): void {
    const ownerDocument = this.el.ownerDocument;
    off(ownerDocument, 'mouseup', this._onDrop.bind(this));
    off(ownerDocument, 'touchend', this._onDrop.bind(this));
    off(ownerDocument, 'touchcancel', this._onDrop.bind(this));
    off(ownerDocument, 'selectstart', this._onDrop.bind(this));
    off(document, 'selectstart', this._onDrop.bind(this));
  }

  private _isOutsideThisEl(target: HTMLElement): boolean {
    return !this.el.contains(target) && target !== this.el;
  }

  private _ignoreWhileAnimating = null;

  private getDraggableSelector(): string {
    return this.options.draggable;
  }
}
