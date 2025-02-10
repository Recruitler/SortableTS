import { ISortable } from './sortable.interfaces';
export declare const SORTABLE_INSTANCE_KEY: unique symbol;
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
export declare class SortableState {
    private static instance;
    private state;
    private listeners;
    private cleanupManager;
    private constructor();
    static getInstance(): SortableState;
    registerInstance(el: HTMLElement, instance: ISortable): void;
    destroyInstance(instanceId: symbol): void;
    removeInstance(el: HTMLElement): void;
    getInstance(el: HTMLElement): ISortable | undefined;
    subscribe(listener: StateChangeListener): () => void;
    private notifyListeners;
    getState(): Readonly<GlobalState>;
    startDrag(sourceEl: HTMLElement, clientX?: number, clientY?: number): void;
    updateDragPosition(clientX: number, clientY: number): void;
    updateDragElements(elements: Partial<Pick<DragState, 'dragEl' | 'ghostEl' | 'cloneEl' | 'parentEl' | 'nextEl' | 'oldIndex' | 'moved'>>): void;
    endDrag(): void;
    updateScrollPosition(scrollTop: number, scrollLeft: number): void;
    getElementFromPoint(x: number, y: number): HTMLElement | null;
    getEventTarget(evt: Event): HTMLElement | null;
    private getElementIndex;
    getActiveSortable(): ISortable | null;
    getDragOperation(): Readonly<DragState>;
    hasInstance(el: HTMLElement): boolean;
    getInstanceCount(): number;
    reset(): void;
}
export {};
