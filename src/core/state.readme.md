# SortableTS State Management

## Overview

SortableTS uses a centralized state management system based on the singleton pattern. This document explains the architecture and relationships between different components.

## Core Components

### SortableState (Singleton)

There is only ONE `SortableState` instance in the entire application. This singleton manages:

- All Sortable instances
- The current drag operation
- Global event coordination
- Cleanup and resource management

```typescript
class SortableState {
  private static instance: SortableState;
  private instances: Map<HTMLElement, ISortable>;
  private dragOperation: DragState;
}
```

### Sortable (Multiple Instances)

Multiple `Sortable` instances can exist simultaneously. Each instance:

- Represents one sortable container (like a list or grid)
- Manages its own configuration options
- Controls its own draggable elements
- Communicates with the central SortableState

```typescript
const list1 = new Sortable(document.getElementById('list1'), {
  draggable: 'li',
});

const list2 = new Sortable(document.getElementById('grid1'), {
  draggable: '.grid-item',
});
```

## Instance Management

### Registration

When a new Sortable instance is created:

1. The instance registers itself with SortableState
2. The container element is mapped to the instance
3. Event listeners are set up

```typescript
// Internal mapping in SortableState
instances.set(containerElement, sortableInstance);
```

### Lookup

The state can find any Sortable instance using its container element:

```typescript
const instance = state.getInstance(containerElement);
```

### Cleanup

When a Sortable instance is destroyed:

1. State looks up the instance by container element
2. All event listeners are removed
3. Animation states are cleaned up
4. Timers are cleared
5. Instance is removed from state tracking

## Drag Operation Management

The singleton SortableState manages the current drag operation across all instances:

```typescript
interface DragState {
  active: boolean;
  sourceEl: HTMLElement | null; // The element being dragged
  dragEl: HTMLElement | null; // The drag preview element
  parentEl: HTMLElement | null; // Original parent container
  // ... other drag state properties
}
```

Only one drag operation can be active at a time, even across multiple Sortable instances.

## Example Flow

1. Create Multiple Sortable Instances:

```typescript
// Creates two separate sortable lists
const todoList = new Sortable(todoContainer, { draggable: 'li' });
const doneList = new Sortable(doneContainer, { draggable: 'li' });
```

2. State Management:

```typescript
// Behind the scenes
const state = SortableState.getInstance();
state.instances.set(todoContainer, todoList);
state.instances.set(doneContainer, doneList);
```

3. During Drag Operations:

```typescript
// When dragging starts
state.startDrag(sourceElement); // Only one drag operation at a time

// During drag
state.updateDragPosition(x, y); // Updates centrally managed position

// When drag ends
state.endDrag(); // Cleans up drag state
```

4. Cleanup:

```typescript
// When destroying a sortable instance
todoList.destroy(); // Triggers state.destroyInstanceByElement(todoContainer)
```

## Best Practices

1. Always access state through SortableState.getInstance()
2. Never create multiple SortableState instances
3. Clean up Sortable instances when they're no longer needed
4. Use the state's methods for drag operations rather than managing them directly
5. Let the state handle cleanup and resource management

## Common Mistakes to Avoid

1. ❌ Creating multiple SortableState instances
2. ❌ Creating Sortable instances for individual draggable elements
3. ❌ Managing drag state outside of SortableState
4. ❌ Direct manipulation of instances map
5. ❌ Manual event listener cleanup

## Debugging Tips

1. Check instance registration:

```typescript
const state = SortableState.getInstance();
console.log(state.getInstanceCount()); // Should match number of containers
```

2. Verify instance lookup:

```typescript
const instance = state.getInstance(containerElement);
if (!instance) {
  console.warn('No instance found for container');
}
```

3. Monitor drag operations:

```typescript
console.log(state.getDragOperation()); // Current drag state
```
