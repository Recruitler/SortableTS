import { ISortableDOMEvents } from '@/dom/event.interfaces';
import { ICoordinates } from '@/global.interfaces';
/**
 * Type guards for event types
 */
export declare function isTouchEvent(evt: Event): evt is TouchEvent;
export declare function isPointerEvent(evt: Event): evt is PointerEvent;
/**
 * Extract touch information from various event types
 * @param evt - Mouse, Touch, or Pointer event
 * @returns Touch object, PointerEvent, or null if no touch data available
 */
export declare function getTouchFromEvent(evt: ISortableDOMEvents): Touch | PointerEvent | null;
/**
 * Extract coordinates from any supported event type
 * @param evt - Mouse, Touch, or Pointer event
 * @returns Coordinates object or null if no coordinate data available
 */
export declare function getEventCoordinates(evt: ISortableDOMEvents): ICoordinates | null;
