import { ISortableDOMEvents } from '@/dom/event.interfaces';
import { ICoordinates } from '@/global.interfaces';

/**
 * Type guards for event types
 */
export function isTouchEvent(evt: Event): evt is TouchEvent {
  return 'touches' in evt;
}

export function isPointerEvent(evt: Event): evt is PointerEvent {
  return 'pointerType' in evt;
}

/**
 * Extract touch information from various event types
 * @param evt - Mouse, Touch, or Pointer event
 * @returns Touch object, PointerEvent, or null if no touch data available
 */
export function getTouchFromEvent(evt: ISortableDOMEvents): Touch | PointerEvent | null {
  if (isTouchEvent(evt) && evt.touches[0]) {
    return evt.touches[0];
  } else if (isPointerEvent(evt) && evt.pointerType === 'touch') {
    return evt;
  }
  return null;
}

/**
 * Extract coordinates from any supported event type
 * @param evt - Mouse, Touch, or Pointer event
 * @returns Coordinates object or null if no coordinate data available
 */
export function getEventCoordinates(evt: ISortableDOMEvents): ICoordinates | null {
  const touch = getTouchFromEvent(evt);
  if (touch) {
    return {
      clientX: touch.clientX,
      clientY: touch.clientY,
    };
  }

  // Handle non-touch mouse/pointer events
  if ('clientX' in evt) {
    return {
      clientX: evt.clientX,
      clientY: evt.clientY,
    };
  }

  return null;
}
