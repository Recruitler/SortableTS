import { ISortableDOMEvents } from '@/dom/event.interfaces';
import { CleanupManager } from '../cleanup.manager';
import { getTouchFromEvent } from '../utils/touch';
import { ISortable } from './sortable.interfaces';

// Symbol-based instance key
export const SORTABLE_INSTANCE_KEY = Symbol('SortableInstance');

export interface SortableElement extends HTMLElement {
  [SORTABLE_INSTANCE_KEY]?: ISortable;
}

export interface DragState {
  active: boolean;
  sourceEl: HTMLElement | null;
  dragEl: HTMLElement | null;
  ghostEl: HTMLElement | null;
  cloneEl: HTMLElement | null;
  parentEl: HTMLElement | null;
  nextEl: HTMLElement | null;
  lastDownEl: HTMLElement | null;
  oldIndex: number | null;
  newIndex: number | null;
  oldDraggableIndex: number | null;
  newDraggableIndex: number | null;
  moved: boolean;
  position: {
    clientX: number;
    clientY: number;
    initialX: number;
    initialY: number;
    dx: number;
    dy: number;
  };
}

export interface GlobalState {
  activeSortable: ISortable | null;
  dragOperation: DragState;
  instances: Map<HTMLElement, ISortable>;
}

type StateChangeListener = (state: Readonly<GlobalState>) => void;

export class SortableState {
  private static instance: SortableState;
  private state: GlobalState;
  private listeners: Set<StateChangeListener> = new Set();
  private cleanupManager: CleanupManager;

  private constructor() {
    this.state = {
      activeSortable: null,
      instances: new Map(),
      dragOperation: {
        active: false,
        sourceEl: null,
        dragEl: null,
        ghostEl: null,
        cloneEl: null,
        parentEl: null,
        nextEl: null,
        lastDownEl: null,
        oldIndex: null,
        newIndex: null,
        oldDraggableIndex: null,
        newDraggableIndex: null,
        moved: false,
        position: {
          clientX: 0,
          clientY: 0,
          initialX: 0,
          initialY: 0,
          dx: 0,
          dy: 0,
        },
      },
    };
    this.cleanupManager = CleanupManager.getInstance();
  }

  public static getInstance(): SortableState {
    if (!SortableState.instance) {
      SortableState.instance = new SortableState();
    }
    return SortableState.instance;
  }

  // Enhanced instance management with Symbol-based element binding
  public registerInstance(el: HTMLElement, instance: ISortable): void {
    if (this.state.instances.has(el)) {
      throw new Error('Instance already registered for element');
    }
    this.state.instances.set(el, instance);
    (el as SortableElement)[SORTABLE_INSTANCE_KEY] = instance;
    this.notifyListeners();
  }

  public destroyInstance(instanceId: symbol): void {
    // Execute all cleanup tasks
    this.cleanupManager.cleanup(instanceId);

    // Find and remove instance from state tracking
    let elementToRemove: HTMLElement | null = null;
    this.state.instances.forEach((instance, el) => {
      if ((instance as any).instanceId === instanceId) {
        elementToRemove = el;
      }
    });

    if (elementToRemove) {
      this.removeInstance(elementToRemove);
    }
  }

  public removeInstance(el: HTMLElement): void {
    this.state.instances.delete(el);
    delete (el as SortableElement)[SORTABLE_INSTANCE_KEY];
    this.notifyListeners();
  }

  public getInstance(el: HTMLElement): ISortable | undefined {
    // First try Map-based lookup
    const instance = this.state.instances.get(el);
    if (instance) return instance;

    // Fallback to Symbol-based lookup
    return (el as SortableElement)[SORTABLE_INSTANCE_KEY];
  }

  // State subscription management
  public subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  // Immutable state access
  public getState(): Readonly<GlobalState> {
    return Object.freeze({ ...this.state });
  }

  // Drag operation state management
  public startDrag(sourceEl: HTMLElement, clientX: number = 0, clientY: number = 0): void {
    if (this.state.dragOperation.active) {
      throw new Error('Drag operation already in progress');
    }

    const sortable = this.getInstance(sourceEl);
    if (!sortable) {
      throw new Error('No sortable instance found for element');
    }

    this.state.activeSortable = sortable;
    this.state.dragOperation = {
      ...this.state.dragOperation,
      active: true,
      sourceEl,
      oldIndex: this.getElementIndex(sourceEl),
      position: {
        clientX,
        clientY,
        initialX: clientX,
        initialY: clientY,
        dx: 0,
        dy: 0,
      },
    };
    this.notifyListeners();
  }

  public updateDragPosition(clientX: number, clientY: number): void {
    const oldPos = this.state.dragOperation.position;
    this.state.dragOperation.position = {
      clientX,
      clientY,
      initialX: oldPos.initialX,
      initialY: oldPos.initialY,
      dx: clientX - oldPos.clientX,
      dy: clientY - oldPos.clientY,
    };
    this.notifyListeners();
  }

  public updateDragElements(elements: Partial<Pick<DragState, 'dragEl' | 'ghostEl' | 'cloneEl' | 'parentEl' | 'nextEl' | 'oldIndex' | 'moved'>>): void {
    this.state.dragOperation = {
      ...this.state.dragOperation,
      ...elements,
    };
    this.notifyListeners();
  }

  public endDrag(): void {
    this.state.activeSortable = null;
    this.state.dragOperation = {
      ...this.state.dragOperation,
      active: false,
      sourceEl: null,
      dragEl: null,
      ghostEl: null,
      cloneEl: null,
      oldIndex: null,
      newIndex: null,
    };
    this.notifyListeners();
  }

  public updateScrollPosition(scrollTop: number, scrollLeft: number): void {
    // Update scroll position in state
    this.state.dragOperation.position = {
      ...this.state.dragOperation.position,
      dx: this.state.dragOperation.position.dx + scrollLeft,
      dy: this.state.dragOperation.position.dy + scrollTop,
    };
    this.notifyListeners();
  }

  // Element detection during drag
  public getElementFromPoint(x: number, y: number): HTMLElement | null {
    const dragEl = this.state.dragOperation.dragEl;
    if (dragEl) {
      const prevDisplay = dragEl.style.display;
      dragEl.style.display = 'none';
      const element = document.elementFromPoint(x, y) as HTMLElement | null;
      dragEl.style.display = prevDisplay;
      return element;
    }
    return document.elementFromPoint(x, y) as HTMLElement | null;
  }

  // Event target resolution with shadow DOM support
  public getEventTarget(evt: Event): HTMLElement | null {
    const { target } = evt;
    if (!(target instanceof HTMLElement)) return null;

    if (target.shadowRoot) {
      const touch = getTouchFromEvent(evt as ISortableDOMEvents);
      if (touch) {
        const shadowTarget = target.shadowRoot.elementFromPoint(touch.clientX, touch.clientY);
        if (shadowTarget instanceof HTMLElement) {
          return shadowTarget;
        }
      }
    }

    return target;
  }

  // Utility methods
  private getElementIndex(el: HTMLElement): number {
    return Array.from(el.parentElement?.children || []).indexOf(el);
  }

  // Getters for specific state slices
  public getActiveSortable(): ISortable | null {
    return this.state.activeSortable;
  }

  public getDragOperation(): Readonly<DragState> {
    return Object.freeze({ ...this.state.dragOperation });
  }

  // Instance validation
  public hasInstance(el: HTMLElement): boolean {
    return this.state.instances.has(el) || SORTABLE_INSTANCE_KEY in el;
  }

  // Debug helper
  public getInstanceCount(): number {
    return this.state.instances.size;
  }

  // Cleanup utility
  public reset(): void {
    this.state.instances.forEach((_, el) => this.removeInstance(el));
    this.endDrag();
    this.listeners.clear();
  }
}
