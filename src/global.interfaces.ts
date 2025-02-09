// https://stackoverflow.com/a/56458070/1440240

export interface CSSMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  m11: number;
  m12: number;
  m13: number;
  m14: number;
  m21: number;
  m22: number;
  m23: number;
  m24: number;
  m31: number;
  m32: number;
  m33: number;
  m34: number;
  m41: number;
  m42: number;
  m43: number;
  m44: number;
}

declare global {
  interface Window {
    WebKitCSSMatrix?: CSSMatrix;
    MSCSSMatrix?: CSSMatrix;
    CSSMatrix?: CSSMatrix;
  }

  interface CSSStyleDeclaration {
    animatingX?: string;
    animatingY?: string;
  }
}

// This empty export makes this file a module
export {}