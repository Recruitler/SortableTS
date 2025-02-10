interface SortableOptions {
  group?: string | { name: string; pull?: boolean | 'clone' | string; put?: boolean | string[] | string };
  sort?: boolean;
  delay?: number;
  delayOnTouchOnly?: boolean;
  touchStartThreshold?: number;
  disabled?: boolean;
  store?: any;
  animation?: number;
  handle?: string;
  filter?: string;
  preventOnFilter?: boolean;
  draggable?: string;
  previewClass?: string;
  chosenClass?: string;
  dragClass?: string;
  swapThreshold?: number;
  invertSwap?: boolean;
  invertedSwapThreshold?: number;
  direction?: 'vertical' | 'horizontal';
  forceFallback?: boolean;
  fallbackClass?: string;
  fallbackOnBody?: boolean;
  fallbackTolerance?: number;
  dragoverBubble?: boolean;
  removeCloneOnHide?: boolean;
  emptyInsertThreshold?: number;
  onStart?: (evt: { item: HTMLElement; oldIndex: number }) => void;
  onEnd?: (evt: { item: HTMLElement; newIndex: number }) => void;
  onAdd?: (evt: { item: HTMLElement; newIndex: number; from: HTMLElement }) => void;
  onUpdate?: (evt: { item: HTMLElement; oldIndex: number; newIndex: number }) => void;
  onSort?: (evt: { item: HTMLElement; oldIndex: number; newIndex: number }) => void;
  onRemove?: (evt: { item: HTMLElement; oldIndex: number }) => void;
  onFilter?: (evt: { item: HTMLElement }) => void;
  onMove?: (evt: { item: HTMLElement; target: HTMLElement }) => boolean | -1 | 1;
  onClone?: (evt: { item: HTMLElement; clone: HTMLElement }) => void;
}

declare class Sortable {
  constructor(element: HTMLElement, options?: SortableOptions);
}

// declare global {
//   interface Window {
//     SortableTS: {
//       Sortable: typeof Sortable;
//     };
//   }
// }
