import { ISortable, ISortableOptions, IGroupOptions } from '@core/sortable.interfaces';
import { IEventProps } from '@dom/event.interfaces';
import { dispatch } from '@dom/events.utils';

export { off, on } from '@dom/events.utils';

type EventDetail = {
  to: HTMLElement;
  from: HTMLElement;
  item: HTMLElement;
  clone: HTMLElement | null;
  oldIndex: number | null;
  newIndex: number | null;
  oldDraggableIndex: number | null;
  newDraggableIndex: number | null;
  originalEvent: Event | null;
  pullMode: 'clone' | boolean | undefined;
  [key: string]: any; // For extra properties
};

type SortableEventHandler = (this: ISortable, event: EventDetail) => void;

/**
 * Dispatches a sortable event and calls the corresponding event handler if defined
 * @param props - Event properties including sortable instance, elements, and indices
 */
export const dispatchSortableEvent = ({
  sortable,
  rootEl,
  name,
  targetEl,
  cloneEl,
  toEl,
  fromEl,
  oldIndex,
  newIndex,
  oldDraggableIndex,
  newDraggableIndex,
  originalEvent,
  putSortable,
  extraEventProperties = {} as Record<string, any>
}: IEventProps): void => {
  if (!sortable) {
    throw new Error('Sortable instance is required');
  }

  const eventDetail: EventDetail = {
    to: toEl || rootEl || sortable.el,
    from: fromEl || rootEl || sortable.el,
    item: targetEl || rootEl || sortable.el,
    clone: cloneEl || null,
    oldIndex: oldIndex ?? null,
    newIndex: newIndex ?? null,
    oldDraggableIndex: oldDraggableIndex ?? null,
    newDraggableIndex: newDraggableIndex ?? null,
    originalEvent: originalEvent || null,
    pullMode: getPullMode(putSortable),
    ...extraEventProperties
  };

  // Dispatch DOM event
  dispatch(sortable.el, name, eventDetail);

  // Call event handler if defined
  const eventHandlerName = `on${name.charAt(0).toUpperCase()}${name.slice(1)}` as keyof ISortableOptions;
  const eventHandler: SortableEventHandler | undefined = sortable.options[eventHandlerName] as SortableEventHandler;
  
  if (typeof eventHandler === 'function') {
    eventHandler.call(sortable, eventDetail);
  }
};

/**
 * Gets the pull mode from a sortable instance's group options
 * @param putSortable - The sortable instance to get pull mode from
 * @returns The pull mode ('clone', true, false, or undefined)
 */
function getPullMode(putSortable?: ISortable): 'clone' | boolean | undefined {
  if (!putSortable?.options?.group) {
    return undefined;
  }

  const group = putSortable.options.group as IGroupOptions;
  if (typeof group === 'string' || group === null) {
    return undefined;
  }

  return typeof group.pull === 'function' ? true : group.pull;
}
