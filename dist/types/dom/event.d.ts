import { IEventProps } from '@dom/event.interfaces';
/**
 * Dispatches a sortable event and calls the corresponding event handler if defined
 * @param props - Event properties including sortable instance, elements, and indices
 */
export declare const dispatchSortableEvent: ({ sortable, rootEl, name, targetEl, cloneEl, toEl, fromEl, oldIndex, newIndex, oldDraggableIndex, newDraggableIndex, originalEvent, putSortable, extraEventProperties }: IEventProps) => void;
