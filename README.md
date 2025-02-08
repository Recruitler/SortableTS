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
├── node_modules/
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

## Differences from legacy SortableJS:

expando is now `instance` in src/core/store.ts

```typescript
const instance = sortable || getInstance(rootEl);
if (!instance) {
  throw new Error('No Sortable instance found');
}
```
