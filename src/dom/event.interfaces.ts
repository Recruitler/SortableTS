import { ISortable } from '../core/sortable.interfaces';

export interface IEventProps {
  sortable: ISortable;
  rootEl: HTMLElement;
  name: string;
  targetEl?: HTMLElement;
  cloneEl?: HTMLElement;
  toEl?: HTMLElement;
  fromEl?: HTMLElement;
  oldIndex?: number;
  newIndex?: number;
  oldDraggableIndex?: number;
  newDraggableIndex?: number;
  originalEvent?: Event;
  putSortable?: ISortable;
  extraEventProperties?: Record<string, unknown>;
}

export interface IEvent extends CustomEvent {
  to: HTMLElement;
  from: HTMLElement;
  item: HTMLElement;
  clone: HTMLElement;
  oldIndex: number | null;
  newIndex: number | null;
  oldDraggableIndex: number | null;
  newDraggableIndex: number | null;
  originalEvent: Event;
  pullMode?: 'clone' | boolean;
}

// Browser events that trigger Sortable functionality
export type ISortableDOMEvents = MouseEvent | TouchEvent | PointerEvent | DragEvent;
export type ISortableDOMEventListener = (evt: ISortableDOMEvents) => void;
