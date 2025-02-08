import { ISortable, ISortableOptions } from '@core/sortable.interfaces';
import { getInstance } from '@core/store';
import { IEventProps } from '@dom/event.interfaces';
import { dispatch } from '@dom/events.utils';

export { off, on } from '@dom/events.utils';

export const dispatchSortableEvent = ({ sortable, rootEl, name, targetEl, cloneEl, toEl, fromEl, oldIndex, newIndex, oldDraggableIndex, newDraggableIndex, originalEvent, putSortable, extraEventProperties = {} }: IEventProps): void => {
  const instance = sortable || getInstance(rootEl);
  if (!instance) {
    throw new Error('No Sortable instance found');
  }

  if (!sortable) return;

  const eventDetail = {
    to: toEl || rootEl || sortable.el,
    from: fromEl || rootEl || sortable.el,
    item: targetEl || rootEl || sortable.el,
    clone: cloneEl as HTMLElement,
    oldIndex: oldIndex ?? null,
    newIndex: newIndex ?? null,
    oldDraggableIndex: oldDraggableIndex ?? null,
    newDraggableIndex: newDraggableIndex ?? null,
    originalEvent: originalEvent as Event,
    pullMode: getPullMode(putSortable),
    ...extraEventProperties,
  };

  dispatch(sortable.el, name, eventDetail);

  const options: ISortableOptions = sortable.options;
  const eventHandlerName = `on${name.charAt(0).toUpperCase()}${name.substr(1)}` as keyof ISortableOptions;
  const eventHandler = options[eventHandlerName];
  if (typeof eventHandler === 'function') {
    (eventHandler as (this: ISortable, event: typeof eventDetail) => void).call(sortable, eventDetail);
  }
};

function getPullMode(putSortable?: ISortable): 'clone' | boolean | undefined {
  if (!putSortable) return undefined;

  const group = putSortable.options?.group;
  const pull = typeof group === 'object' ? group?.pull : undefined;
  return typeof pull === 'function' ? true : pull;
}
