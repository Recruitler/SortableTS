## Browser.ts

# Browser Features Module

A modern TypeScript utility for browser feature detection and platform information. This module provides a robust way to detect browser capabilities, device information, and platform details using the latest Web APIs with appropriate fallbacks.

## Key Features

This implementation is designed to be: - Future-proof (prioritizing modern APIs) - Privacy-conscious (using capability detection over user-agent sniffing) - Reliable (multiple fallback layers) - Performance-oriented (using passive events where supported)

Features: - Modern browser APIs with fallbacks - TypeScript support with full type definitions - Async platform detection using User Agent Client Hints - Touch and pointer event detection - Device capability detection - Performance optimization utilities - Accessibility features detection - Pointer Events (modern input handling) - Touch Events - Passive Event Listeners - Intersection Observer - Resize Observer - CSS Transforms/Transitions - Smooth Scrolling - High DPI Display Support

## Basic Usage

```typescript
import { BrowserFeatures, BrowserConfig } from '@sortablets/browser-features';

// Check for iOS device
if (BrowserFeatures.isIOS()) {
  // iOS specific code
}

// Check device capabilities
if (BrowserFeatures.supportsTouchEvents()) {
  // Touch device handling
}

// Use the configuration object
const { deviceType, isMobile, pixelRatio } = BrowserConfig;
```

## Advanced Usage

### Platform Detection

```typescript
// Async platform information
async function getPlatformDetails() {
  const platformInfo = await BrowserFeatures.getPlatformInfo();
  console.log(`Platform: ${platformInfo.platform}`);
  console.log(`Version: ${platformInfo.platformVersion}`);
  console.log(`Mobile: ${platformInfo.mobile}`);
  console.log(`Architecture: ${platformInfo.architecture}`);
}

// Browser specific checks
if (BrowserFeatures.isSafari()) {
  // Safari-specific code
}
```

### Event Handling

```typescript
// Get proper event options for performance
const eventOptions = BrowserFeatures.getEventListenerOptions(true);

element.addEventListener('scroll', handler, eventOptions);

// Check for pointer support
if (BrowserFeatures.supportsPointerEvents()) {
  element.addEventListener('pointerdown', handler);
} else if (BrowserFeatures.supportsTouchEvents()) {
  element.addEventListener('touchstart', handler);
} else {
  element.addEventListener('mousedown', handler);
}
```

### Device and Display

```typescript
// Handle high DPI displays
const pixelRatio = BrowserFeatures.getDevicePixelRatio();
if (pixelRatio > 1) {
  // Load high-resolution assets
}

// Check device type
const deviceType = BrowserFeatures.getDeviceType();
switch (deviceType) {
  case 'touch':
    // Touch optimization
    break;
  case 'pointer':
    // Pointer device handling
    break;
  case 'mouse':
    // Mouse-specific handling
    break;
}
```

### Accessibility

```typescript
// Check for reduced motion preference
if (BrowserFeatures.prefersReducedMotion()) {
  // Disable or reduce animations
}
```

### Feature Detection

```typescript
// Check for modern API support
if (BrowserFeatures.supportsIntersectionObserver()) {
  const observer = new IntersectionObserver(callback);
  // Use IntersectionObserver
} else {
  // Fallback behavior
}

// Check for CSS features
if (BrowserFeatures.supportsTransforms()) {
  element.style.transform = 'translate3d(0, 0, 0)';
} else {
  // Fallback animation method
}
```

### Using BrowserConfig

```typescript
import { BrowserConfig, type BrowserConfiguration } from '@sortablets/browser-features';

// Access all browser features at once
function initializeApp(config: BrowserConfiguration) {
  if (config.isMobile) {
    // Mobile setup
  }

  if (config.reducedMotion) {
    // Disable animations
  }

  // Use recommended event options
  element.addEventListener('scroll', handler, config.eventOptions);
}

// Initialize with current browser configuration
initializeApp(BrowserConfig);
```

## API Reference

### Browser Detection Methods

- `isIOS()`: Detects iOS devices
- `isSafari()`: Detects Safari browser
- `isFirefox()`: Detects Firefox browser
- `isMobileDevice()`: Detects mobile devices

### Feature Detection Methods

- `supportsPassiveEvents()`: Checks passive event listener support
- `supportsTouchEvents()`: Checks touch event support
- `supportsPointerEvents()`: Checks pointer event support
- `supportsSmoothScroll()`: Checks smooth scroll support
- `supportsTransforms()`: Checks CSS transform support
- `supportsTransitions()`: Checks CSS transition support
- `supportsIntersectionObserver()`: Checks Intersection Observer support
- `supportsResizeObserver()`: Checks Resize Observer support

### Device Information Methods

- `getPlatformInfo()`: Gets detailed platform information (async)
- `getDeviceType()`: Gets device input type
- `getDevicePixelRatio()`: Gets device pixel ratio
- `prefersReducedMotion()`: Checks reduced motion preference

### Utility Methods

- `getEventListenerOptions()`: Gets optimized event listener options

## Browser Support

The module uses modern Web APIs with fallbacks for older browsers. Supported browsers:

- Chrome 51+
- Firefox 55+
- Safari 11.1+
- Edge 79+
- iOS Safari 11.3+
- Android Browser 88+

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## License

MIT

## Support

For issues and feature requests, please use the GitHub issue tracker.
