/**
 * Browser feature detection utilities for SortableTS
 * @module BrowserFeatures
 */
export declare namespace BrowserFeatures {
    /**
     * Detect iOS device using modern APIs with fallbacks
     */
    function isIOS(): boolean;
    /**
     * Get detailed platform information using modern APIs
     */
    function getPlatformInfo(): Promise<{
        platform: string;
        mobile: boolean;
        brands: Array<{
            brand: string;
            version: string;
        }>;
        platformVersion?: string;
        architecture?: string;
        model?: string;
    }>;
    /**
     * Detect Safari browser (excluding Chrome/Firefox)
     */
    function isSafari(): boolean;
    /**
     * Detect Firefox browser
     */
    function isFirefox(): boolean;
    /**
     * Check if the browser supports passive event listeners
     */
    function supportsPassiveEvents(): boolean;
    /**
     * Check if touch events are supported
     */
    function supportsTouchEvents(): boolean;
    /**
     * Check if pointer events are supported
     */
    function supportsPointerEvents(): boolean;
    /**
     * Check if the browser supports smooth scrolling
     */
    function supportsSmoothScroll(): boolean;
    /**
     * Check if the browser supports CSS transforms
     */
    function supportsTransforms(): boolean;
    /**
     * Check if the browser supports CSS transitions
     */
    function supportsTransitions(): boolean;
    /**
     * Get the browser's preferred reduced motion setting
     */
    function prefersReducedMotion(): boolean;
    /**
     * Get device type based on capabilities
     */
    function getDeviceType(): 'touch' | 'pointer' | 'mouse';
    /**
     * Check if the device is a mobile device
     */
    function isMobileDevice(): boolean;
    /**
     * Get the current pixel ratio of the device
     */
    function getDevicePixelRatio(): number;
    /**
     * Check if the browser supports the Intersection Observer API
     */
    function supportsIntersectionObserver(): boolean;
    /**
     * Check if the browser supports the ResizeObserver API
     */
    function supportsResizeObserver(): boolean;
    /**
     * Get event options based on browser capabilities
     */
    function getEventListenerOptions(wantsPassive: boolean): AddEventListenerOptions;
}
export declare const BrowserConfig: {
    readonly deviceType: "touch" | "pointer" | "mouse";
    readonly isMobile: boolean;
    readonly pixelRatio: number;
    readonly reducedMotion: boolean;
    readonly supportsPassive: boolean;
    readonly eventOptions: AddEventListenerOptions;
};
export type BrowserConfiguration = typeof BrowserConfig;
