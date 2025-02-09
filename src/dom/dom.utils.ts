import { IMatrix } from '@core/sortable.interfaces';

const captureMode = {
  capture: false,
  passive: false,
} as const;

export const addEvent = (el: HTMLElement, event: string, fn: (evt: Event) => void): void => {
  el.addEventListener(event, fn, captureMode);
};

export const removeEvent = (el: HTMLElement, event: string, fn: (evt: Event) => void): void => {
  el.removeEventListener(event, fn, captureMode);
};

export const matches = (el: HTMLElement | null, selector: string): boolean => {
  if (!selector || !el) return false;

  if (selector[0] === '>') {
    selector = selector.substring(1);
  }

  try {
    return el.matches?.(selector) || false;
  } catch {
    return false;
  }
};

export const getParentOrHost = (el: Node): Node => ((el as any).host && el !== document && (el as any).host.nodeType ? (el as any).host : (el.parentNode as Node));

export const closest = (el: HTMLElement | null, selector: string, ctx: Node = document, includeCTX = false): HTMLElement | null => {
  if (!el) return null;

  let current: Node | null = el;
  do {
    if ((selector != null && (selector[0] === '>' ? current.parentNode === ctx && matches(current as HTMLElement, selector) : matches(current as HTMLElement, selector))) || (includeCTX && current === ctx)) {
      return current as HTMLElement;
    }

    if (current === ctx) break;
  } while ((current = getParentOrHost(current)));

  return null;
};

export const toggleClass = (el: HTMLElement, name: string, state: boolean): void => {
  if (!el || !name) return;
  el.classList?.[state ? 'add' : 'remove'](name);
};

export type CSSProperties = Partial<CSSStyleDeclaration>;

export const css = (el: HTMLElement, prop: string | CSSProperties, val?: string | number): string | void => {
  if (!el?.style) return;

  if (typeof prop === 'object') {
    Object.entries(prop).forEach(([key, value]) => {
      if (!(key in el.style) && !key.startsWith('webkit')) {
        key = `-webkit-${key}`;
      }
      el.style[key as any] = `${value}${typeof value === 'string' ? '' : 'px'}`;
    });
    return;
  }

  if (val === undefined) {
    return getComputedStyle(el)[prop as any];
  }

  if (!(prop in el.style) && !prop.startsWith('webkit')) {
    prop = `-webkit-${prop}`;
  }

  el.style[prop as any] = `${val}${typeof val === 'string' ? '' : 'px'}`;
};

export const matrix = (el: HTMLElement | string, selfOnly = false): IMatrix | null => {
  let transforms = '';

  if (typeof el === 'string') {
    transforms = el;
  } else {
    let current: HTMLElement | null = el;
    do {
      const transform = css(current, 'transform');
      if (transform && transform !== 'none') {
        transforms = `${transform} ${transforms}`;
      }
    } while (!selfOnly && (current = current.parentElement));
  }

  const MatrixConstructor = window.DOMMatrix || window.WebKitCSSMatrix || window.CSSMatrix || window.MSCSSMatrix;
  return MatrixConstructor ? (new MatrixConstructor(transforms) as IMatrix) : null;
};

export const getRect = (el: HTMLElement | Window, relativeToContainingBlock = false, relativeToNonStaticParent = false, undoScale = false, container?: HTMLElement): DOMRect => {
  if (el === window) {
    return {
      top: 0,
      left: 0,
      bottom: window.innerHeight,
      right: window.innerWidth,
      width: window.innerWidth,
      height: window.innerHeight,
      x: 0,
      y: 0,
      toJSON() {
        return {
          x: this.x,
          y: this.y,
          top: this.top,
          right: this.right,
          bottom: this.bottom,
          left: this.left,
          width: this.width,
          height: this.height,
        };
      },
    } as DOMRect;
  }

  const elRect = (el as HTMLElement).getBoundingClientRect();
  let top = elRect.top;
  let left = elRect.left;
  let bottom = elRect.bottom;
  let right = elRect.right;
  let { width, height } = elRect;

  if ((relativeToContainingBlock || relativeToNonStaticParent) && el !== window) {
    container = container || ((el as HTMLElement).parentNode as HTMLElement);

    do {
      if (container?.getBoundingClientRect && (css(container, 'transform') !== 'none' || (relativeToNonStaticParent && css(container, 'position') !== 'static'))) {
        const containerRect = container.getBoundingClientRect();
        const borderTop = parseInt(css(container, 'border-top-width') as string) || 0;
        const borderLeft = parseInt(css(container, 'border-left-width') as string) || 0;

        top -= containerRect.top + borderTop;
        left -= containerRect.left + borderLeft;
        bottom = top + elRect.height;
        right = left + elRect.width;
        break;
      }
    } while ((container = container.parentNode as HTMLElement));
  }

  if (undoScale && el !== window) {
    const elMatrix = matrix(container || (el as HTMLElement));
    if (elMatrix) {
      const { a: scaleX, d: scaleY } = elMatrix;
      top /= scaleY;
      left /= scaleX;
      width /= scaleX;
      height /= scaleY;
      bottom = top + height;
      right = left + width;
    }
  }

  return {
    top,
    left,
    bottom,
    right,
    width,
    height,
    x: left,
    y: top,
    toJSON() {
      return {
        x: this.x,
        y: this.y,
        top: this.top,
        right: this.right,
        bottom: this.bottom,
        left: this.left,
        width: this.width,
        height: this.height,
      };
    },
  } as DOMRect;
};

export const getScrollingElement = (): HTMLElement => (document.scrollingElement as HTMLElement) || document.documentElement;

export const clone = <T extends Node>(el: T): T => el.cloneNode(true) as T;
