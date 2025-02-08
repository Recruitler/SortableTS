import type { ISortable } from '@core/sortable.interfaces';

// Originally "expando" rewritten for compatibility
export const SORTABLE_INSTANCE_KEY = Symbol('SortableInstance');

export interface SortableElement extends HTMLElement {
  [SORTABLE_INSTANCE_KEY]?: ISortable;
}

export function setInstance(el: HTMLElement, instance: ISortable): void {
  (el as SortableElement)[SORTABLE_INSTANCE_KEY] = instance;
}

export function getInstance(el: HTMLElement): ISortable | undefined {
  return (el as SortableElement)[SORTABLE_INSTANCE_KEY];
}

export function removeInstance(el: HTMLElement): void {
  delete (el as SortableElement)[SORTABLE_INSTANCE_KEY];
}

// export function hasInstance(el: HTMLElement): boolean {
//   return SORTABLE_INSTANCE_KEY in el;
// }