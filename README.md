# SortableTS

A modern (ESM) TypeScript library for drag-and-drop, sortable lists. This is a complete TypeScript rewrite of the popular Sortable.js library, offering better type safety and modern JavaScript features.

## Installation

```bash
npm install sortablets
# or
yarn add sortablets
# or
pnpm add sortablets
```

## Usage

```typescript
import { Sortable } from 'sortablets';

// Simple sortable list
new Sortable(document.getElementById('list'), {
  animation: 150,
  ghostClass: 'blue-background-class',
});

// Shared lists
new Sortable(document.getElementById('list1'), {
  animation: 150,
  group: 'shared', // set both lists to same group
});

new Sortable(document.getElementById('list2'), {
  animation: 150,
  group: 'shared',
});

// More examples in the /example directory
```

## Features

- Full TypeScript support with accurate type definitions
- Modern ES Module and CommonJS builds
- Tree-shakeable
- Zero dependencies
- Supports all modern drag and drop features:
  - Sorting within lists
  - Moving between lists
  - Nested lists
  - Drag handles
  - Filtering
  - Animations

## Modern Browsers (Primary Support):

All browsers that support the User-Agent Client Hints API (Chrome 89+, Edge 89+, Opera 75+)

- Modern Safari (12+)
- Modern Firefox (90+)
- Modern Mobile browsers (iOS Safari 12+, Chrome for Android 89+)

## Building the package

The build process is managed using Vite. To build the package, run the following command:

```bash
npm run build
```

## Running the example app

The example app is built and runs on Vite.

```bash
npm run example
```

## Code

- src/animation/: Contains animation-related functionality
- src/core/: Contains the main sortable implementation and its interfaces
- src/dom/: Contains DOM-related utilities and event handling
- src/utils/: Contains general utility functions for arrays and math operations
- index.ts: The main entry point of the library

The project also includes proper configuration files for TypeScript, ESLint, Prettier, and Vite for development and building.

ASCII tree diagram of the project structure:

```
SortableTS/
├── src/
│ ├── animation/
│ │ ├── animation.interfaces.ts
│ │ ├── animation.ts
│ │ └── animation.utils.ts
│ ├── core/
│ │ ├── state.ts
│ │ ├── sortable.interfaces.ts
│ │ ├── sortable.readme.md
│ │ ├── sortable.ts
│ │ └── store.ts
│ ├── dom/
│ │ ├── dom.utils.ts
│ │ ├── event.interfaces.ts
│ │ ├── event.ts
│ │ └── events.utils.ts
│ ├── utils/
│ │ ├── array.ts
│ │ ├── browser.ts
│ │ ├── element.utils.ts
│ │ └── math.ts
│ ├── global.interfaces.ts
│ └── index.ts
├── example/
├── .editorconfig
├── .eslintignore
├── .eslintrc.json
├── .gitignore
├── .prettierignore
├── .prettierrc
├── package.json
├── package-lock.json
├── readme.md
├── tsconfig.json
└── vite.config.ts
```

## Development

### The development build process

```bash
npm run dev
```

- The output is now using native ES modules with proper export statements
- We've separated type declaration generation from JavaScript bundling
- The build produces both regular and minified ESM versions
- Source maps are included for debugging
- All TypeScript type declarations are generated correctly
- The final output structure is:

  dist/index.js - Main ESM module
  dist/index.min.js - Minified ESM module
  dist/types/\*.d.ts - TypeScript type declarations
  Source maps for both JS files

The final output structure is:

- dist/index.js - Main ESM module
- dist/index.min.js - Minified ESM module
- dist/types/\*.d.ts - TypeScript type declarations
- Source maps for both JS files

Direct ESM imports in browsers:

<script type="module">
  import { Sortable } from './dist/index.js';
</script>

Or in other ESM projects:

javascript

```typescript
import { Sortable } from '@recruitler/sortable';
```

### The production build process

```bash
npm run build --production
```

## Differences from legacy SortableJS:

expando is now `instance` in src/core/store.ts

```typescript
const instance = sortable || getInstance(rootEl);
if (!instance) {
  throw new Error('No Sortable instance found');
}
```

Changed `static ghost` to `preview`
Renamed `_createGhost` to `_createPreview`
Changed ghost-related methods to `_hideDraggingEl`, `_showDraggingEl`, `_appendDraggingEl`
