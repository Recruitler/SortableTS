/**
 * Browser feature detection utilities for SortableTS
 * @module BrowserFeatures
 */

// Types for User Agent Client Hints API
interface UserAgentData {
  platform: string;
  mobile: boolean;
  brands: Array<{ brand: string; version: string }>;
  getHighEntropyValues(hints: string[]): Promise<{
    platform: string;
    platformVersion: string;
    architecture: string;
    model: string;
    [key: string]: any;
  }>;
}

export namespace BrowserFeatures {
  /**
   * Detect iOS device using modern APIs with fallbacks
   */
  export function isIOS(): boolean {
    // Modern approach - User Agent Client Hints
    if ('userAgentData' in navigator) {
      const uaData = navigator.userAgentData as unknown as UserAgentData;
      return uaData.platform === 'iOS';
    }

    // Fallback approach using multiple checks
    return (
      ('maxTouchPoints' in navigator &&
        navigator.maxTouchPoints > 0 &&
        // Check for iOS-specific APIs
        /iPhone|iPad|iPod/.test(navigator.userAgent)) ||
      // Check for iPad specifically (newer iPads)
      (/Mac/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
    );
  }

  /**
   * Get detailed platform information using modern APIs
   */
  export async function getPlatformInfo(): Promise<{
    platform: string;
    mobile: boolean;
    brands: Array<{ brand: string; version: string }>;
    platformVersion?: string;
    architecture?: string;
    model?: string;
  }> {
    if ('userAgentData' in navigator) {
      const uaData = navigator.userAgentData as unknown as UserAgentData;

      try {
        const highEntropyValues = await uaData.getHighEntropyValues(['platform', 'platformVersion', 'architecture', 'model']);

        return {
          ...highEntropyValues,
          platform: uaData.platform,
          mobile: uaData.mobile,
          brands: uaData.brands,
        };
      } catch {
        return {
          platform: uaData.platform,
          mobile: uaData.mobile,
          brands: uaData.brands,
        };
      }
    }

    // Fallback for browsers that don't support userAgentData
    return {
      platform: 'unknown',
      mobile: isMobileDevice(),
      brands: [],
    };
  }

  /**
   * Detect Safari browser (excluding Chrome/Firefox)
   */
  export function isSafari(): boolean {
    // Use brand checks for modern browsers
    if ('userAgentData' in navigator) {
      const uaData = navigator.userAgentData as unknown as UserAgentData;
      return uaData.brands.some(({ brand }) => brand === 'Safari');
    }
    // Fallback to user agent for older browsers
    return navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Firefox');
  }

  /**
   * Detect Firefox browser
   */
  export function isFirefox(): boolean {
    // Use brand checks for modern browsers
    if ('userAgentData' in navigator) {
      const uaData = navigator.userAgentData as unknown as UserAgentData;
      return uaData.brands.some(({ brand }) => brand === 'Firefox');
    }
    // Fallback to user agent
    return navigator.userAgent.includes('Firefox');
  }

  /**
   * Check if the browser supports passive event listeners
   */
  export function supportsPassiveEvents(): boolean {
    let supportsPassive = false;
    try {
      const opts = Object.defineProperty({}, 'passive', {
        get: () => {
          supportsPassive = true;
          return true;
        },
      });
      window.addEventListener('testPassive', null!, opts);
      window.removeEventListener('testPassive', null!, opts);
    } catch {
      // Passive events not supported
    }
    return supportsPassive;
  }

  /**
   * Check if touch events are supported
   */
  export function supportsTouchEvents(): boolean {
    return 'ontouchstart' in window || 'TouchEvent' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Check if pointer events are supported
   */
  export function supportsPointerEvents(): boolean {
    return window.PointerEvent !== undefined;
  }

  /**
   * Check if the browser supports smooth scrolling
   */
  export function supportsSmoothScroll(): boolean {
    return 'scrollBehavior' in document.documentElement.style;
  }

  /**
   * Check if the browser supports CSS transforms
   */
  export function supportsTransforms(): boolean {
    const style = document.documentElement.style;
    return 'transform' in style || 'webkitTransform' in style || 'mozTransform' in style;
  }

  /**
   * Check if the browser supports CSS transitions
   */
  export function supportsTransitions(): boolean {
    const style = document.documentElement.style;
    return 'transition' in style || 'webkitTransition' in style || 'mozTransition' in style;
  }

  /**
   * Get the browser's preferred reduced motion setting
   */
  export function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Get device type based on capabilities
   */
  export function getDeviceType(): 'touch' | 'pointer' | 'mouse' {
    if (supportsTouchEvents()) {
      return 'touch';
    }
    if (supportsPointerEvents()) {
      return 'pointer';
    }
    return 'mouse';
  }

  /**
   * Check if the device is a mobile device
   */
  export function isMobileDevice(): boolean {
    if ('userAgentData' in navigator) {
      return (navigator.userAgentData as unknown as UserAgentData).mobile;
    }
    // Fallback to traditional checks
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Get the current pixel ratio of the device
   */
  export function getDevicePixelRatio(): number {
    return window.devicePixelRatio || 1;
  }

  /**
   * Check if the browser supports the Intersection Observer API
   */
  export function supportsIntersectionObserver(): boolean {
    return 'IntersectionObserver' in window;
  }

  /**
   * Check if the browser supports the ResizeObserver API
   */
  export function supportsResizeObserver(): boolean {
    return 'ResizeObserver' in window;
  }

  /**
   * Get event options based on browser capabilities
   */
  export function getEventListenerOptions(wantsPassive: boolean): AddEventListenerOptions {
    return {
      passive: wantsPassive && supportsPassiveEvents(),
      capture: false,
    };
  }
}

// Export a default configuration object based on detected features
export const BrowserConfig = {
  deviceType: BrowserFeatures.getDeviceType(),
  isMobile: BrowserFeatures.isMobileDevice(),
  pixelRatio: BrowserFeatures.getDevicePixelRatio(),
  reducedMotion: BrowserFeatures.prefersReducedMotion(),
  supportsPassive: BrowserFeatures.supportsPassiveEvents(),
  eventOptions: BrowserFeatures.getEventListenerOptions(true),
} as const;

// Type for the browser configuration
export type BrowserConfiguration = typeof BrowserConfig;
