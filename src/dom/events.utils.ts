/**
 * Base event utilities with modern browser support
 */

import { ISortableEventListener } from './event.interfaces';

interface CaptureMode {
  capture: boolean;
  passive: boolean;
}

const captureMode: CaptureMode = {
  capture: false,
  passive: false,
};

/**
 * Add/Remove event listener to HTMLElement and Document with modern options
 */
export const on = (el: HTMLElement | Document, event: string, fn: ISortableEventListener): void => {
  el.addEventListener(event, fn as EventListener, captureMode);
};
export const off = (el: HTMLElement | Document, event: string, fn: ISortableEventListener): void => {
  el.removeEventListener(event, fn as EventListener, captureMode);
};

/**
 * Dispatches a custom event with type-safe detail
 */
export const dispatch = <T extends object>(el: HTMLElement, eventName: string, detail?: T): boolean => {
  const event = new CustomEvent<T>(eventName, {
    bubbles: true,
    cancelable: true,
    detail,
  });
  return el.dispatchEvent(event);
};
