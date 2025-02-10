(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.SortableTS = {}));
})(this, (function (exports) { 'use strict';

    /**
     * Type guards for event types
     */
    function isTouchEvent(evt) {
        return 'touches' in evt;
    }
    function isPointerEvent(evt) {
        return 'pointerType' in evt;
    }
    /**
     * Extract touch information from various event types
     * @param evt - Mouse, Touch, or Pointer event
     * @returns Touch object, PointerEvent, or null if no touch data available
     */
    function getTouchFromEvent(evt) {
        if (isTouchEvent(evt) && evt.touches[0]) {
            return evt.touches[0];
        }
        else if (isPointerEvent(evt) && evt.pointerType === 'touch') {
            return evt;
        }
        return null;
    }
    /**
     * Extract coordinates from any supported event type
     * @param evt - Mouse, Touch, or Pointer event
     * @returns Coordinates object or null if no coordinate data available
     */
    function getEventCoordinates(evt) {
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

    const captureMode = {
        capture: false,
        passive: false,
    };
    class CleanupManager {
        tasks = new Map();
        static instance;
        constructor() { }
        static getInstance() {
            if (!CleanupManager.instance) {
                CleanupManager.instance = new CleanupManager();
            }
            return CleanupManager.instance;
        }
        removeEventListener(el, event, fn) {
            el.removeEventListener(event, fn, captureMode);
        }
        registerEventListener(instanceId, element, event, handler) {
            element.addEventListener(event, handler, captureMode);
            this.addTask(instanceId, {
                type: 'event',
                cleanup: () => this.removeEventListener(element, event, handler),
            });
        }
        registerTimer(instanceId, timerId) {
            this.addTask(instanceId, {
                type: 'timer',
                cleanup: () => clearTimeout(timerId),
            });
        }
        registerAnimationCleanup(instanceId, cleanup) {
            this.addTask(instanceId, {
                type: 'animation',
                cleanup,
            });
        }
        registerCustomCleanup(instanceId, cleanup) {
            this.addTask(instanceId, {
                type: 'custom',
                cleanup,
            });
        }
        addTask(instanceId, task) {
            if (!this.tasks.has(instanceId)) {
                this.tasks.set(instanceId, new Set());
            }
            this.tasks.get(instanceId).add(task);
        }
        cleanup(instanceId) {
            const tasks = this.tasks.get(instanceId);
            if (!tasks)
                return;
            // Execute all cleanup tasks
            tasks.forEach((task) => task.cleanup());
            // Clear tasks for this instance
            this.tasks.delete(instanceId);
        }
        cleanupAll() {
            this.tasks.forEach((tasks, instanceId) => {
                this.cleanup(instanceId);
            });
            this.tasks.clear();
        }
    }

    // Symbol-based instance key
    const SORTABLE_INSTANCE_KEY = Symbol('SortableInstance');
    class SortableState {
        static instance;
        state;
        listeners = new Set();
        cleanupManager;
        constructor() {
            this.state = {
                activeSortable: null,
                instances: new Map(),
                dragOperation: {
                    active: false,
                    sourceEl: null,
                    dragEl: null,
                    ghostEl: null,
                    cloneEl: null,
                    parentEl: null,
                    nextEl: null,
                    lastDownEl: null,
                    oldIndex: null,
                    newIndex: null,
                    oldDraggableIndex: null,
                    newDraggableIndex: null,
                    moved: false,
                    position: {
                        clientX: 0,
                        clientY: 0,
                        initialX: 0,
                        initialY: 0,
                        dx: 0,
                        dy: 0,
                    },
                },
            };
            this.cleanupManager = CleanupManager.getInstance();
        }
        static getInstance() {
            if (!SortableState.instance) {
                SortableState.instance = new SortableState();
            }
            return SortableState.instance;
        }
        // Enhanced instance management with Symbol-based element binding
        registerInstance(el, instance) {
            if (this.state.instances.has(el)) {
                throw new Error('Instance already registered for element');
            }
            this.state.instances.set(el, instance);
            el[SORTABLE_INSTANCE_KEY] = instance;
            this.notifyListeners();
        }
        destroyInstance(instanceId) {
            // Execute all cleanup tasks
            this.cleanupManager.cleanup(instanceId);
            // Find and remove instance from state tracking
            let elementToRemove = null;
            this.state.instances.forEach((instance, el) => {
                if (instance.instanceId === instanceId) {
                    elementToRemove = el;
                }
            });
            if (elementToRemove) {
                this.removeInstance(elementToRemove);
            }
        }
        removeInstance(el) {
            this.state.instances.delete(el);
            delete el[SORTABLE_INSTANCE_KEY];
            this.notifyListeners();
        }
        getInstance(el) {
            // First try Map-based lookup
            const instance = this.state.instances.get(el);
            if (instance)
                return instance;
            // Fallback to Symbol-based lookup
            return el[SORTABLE_INSTANCE_KEY];
        }
        // State subscription management
        subscribe(listener) {
            this.listeners.add(listener);
            return () => this.listeners.delete(listener);
        }
        notifyListeners() {
            const state = this.getState();
            this.listeners.forEach((listener) => listener(state));
        }
        // Immutable state access
        getState() {
            return Object.freeze({ ...this.state });
        }
        // Drag operation state management
        startDrag(sourceEl, clientX = 0, clientY = 0) {
            if (this.state.dragOperation.active) {
                throw new Error('Drag operation already in progress');
            }
            const sortable = this.getInstance(sourceEl);
            if (!sortable) {
                throw new Error('No sortable instance found for element');
            }
            this.state.activeSortable = sortable;
            this.state.dragOperation = {
                ...this.state.dragOperation,
                active: true,
                sourceEl,
                oldIndex: this.getElementIndex(sourceEl),
                position: {
                    clientX,
                    clientY,
                    initialX: clientX,
                    initialY: clientY,
                    dx: 0,
                    dy: 0,
                },
            };
            this.notifyListeners();
        }
        updateDragPosition(clientX, clientY) {
            const oldPos = this.state.dragOperation.position;
            this.state.dragOperation.position = {
                clientX,
                clientY,
                initialX: oldPos.initialX,
                initialY: oldPos.initialY,
                dx: clientX - oldPos.clientX,
                dy: clientY - oldPos.clientY,
            };
            this.notifyListeners();
        }
        updateDragElements(elements) {
            this.state.dragOperation = {
                ...this.state.dragOperation,
                ...elements,
            };
            this.notifyListeners();
        }
        endDrag() {
            this.state.activeSortable = null;
            this.state.dragOperation = {
                ...this.state.dragOperation,
                active: false,
                sourceEl: null,
                dragEl: null,
                ghostEl: null,
                cloneEl: null,
                oldIndex: null,
                newIndex: null,
            };
            this.notifyListeners();
        }
        updateScrollPosition(scrollTop, scrollLeft) {
            // Update scroll position in state
            this.state.dragOperation.position = {
                ...this.state.dragOperation.position,
                dx: this.state.dragOperation.position.dx + scrollLeft,
                dy: this.state.dragOperation.position.dy + scrollTop,
            };
            this.notifyListeners();
        }
        // Element detection during drag
        getElementFromPoint(x, y) {
            const dragEl = this.state.dragOperation.dragEl;
            if (dragEl) {
                const prevDisplay = dragEl.style.display;
                dragEl.style.display = 'none';
                const element = document.elementFromPoint(x, y);
                dragEl.style.display = prevDisplay;
                return element;
            }
            return document.elementFromPoint(x, y);
        }
        // Event target resolution with shadow DOM support
        getEventTarget(evt) {
            const { target } = evt;
            if (!(target instanceof HTMLElement))
                return null;
            if (target.shadowRoot) {
                const touch = getTouchFromEvent(evt);
                if (touch) {
                    const shadowTarget = target.shadowRoot.elementFromPoint(touch.clientX, touch.clientY);
                    if (shadowTarget instanceof HTMLElement) {
                        return shadowTarget;
                    }
                }
            }
            return target;
        }
        // Utility methods
        getElementIndex(el) {
            return Array.from(el.parentElement?.children || []).indexOf(el);
        }
        // Getters for specific state slices
        getActiveSortable() {
            return this.state.activeSortable;
        }
        getDragOperation() {
            return Object.freeze({ ...this.state.dragOperation });
        }
        // Instance validation
        hasInstance(el) {
            return this.state.instances.has(el) || SORTABLE_INSTANCE_KEY in el;
        }
        // Debug helper
        getInstanceCount() {
            return this.state.instances.size;
        }
        // Cleanup utility
        reset() {
            this.state.instances.forEach((_, el) => this.removeInstance(el));
            this.endDrag();
            this.listeners.clear();
        }
    }

    const matches = (el, selector) => {
        if (!selector || !el)
            return false;
        if (selector[0] === '>') {
            selector = selector.substring(1);
        }
        try {
            return el.matches?.(selector) || false;
        }
        catch {
            return false;
        }
    };
    const getParentOrHost = (el) => (el.host && el !== document && el.host.nodeType ? el.host : el.parentNode);
    const closest = (el, selector, ctx = document, includeCTX = false) => {
        if (!el)
            return null;
        let current = el;
        do {
            if ((selector != null && (selector[0] === '>' ? current.parentNode === ctx && matches(current, selector) : matches(current, selector))) || (includeCTX && current === ctx)) {
                return current;
            }
            if (current === ctx)
                break;
        } while ((current = getParentOrHost(current)));
        return null;
    };
    const toggleClass = (el, name, state) => {
        if (!el || !name)
            return;
        el.classList?.[state ? 'add' : 'remove'](name);
    };
    const css = (el, prop, val) => {
        if (!el?.style)
            return;
        if (typeof prop === 'object') {
            Object.entries(prop).forEach(([key, value]) => {
                if (!(key in el.style) && !key.startsWith('webkit')) {
                    key = `-webkit-${key}`;
                }
                el.style[key] = `${value}${typeof value === 'string' ? '' : 'px'}`;
            });
            return;
        }
        if (val === undefined) {
            return getComputedStyle(el)[prop];
        }
        if (!(prop in el.style) && !prop.startsWith('webkit')) {
            prop = `-webkit-${prop}`;
        }
        el.style[prop] = `${val}${typeof val === 'string' ? '' : 'px'}`;
    };
    const matrix = (el, selfOnly = false) => {
        let transforms = '';
        if (typeof el === 'string') {
            transforms = el;
        }
        else {
            let current = el;
            do {
                const transform = css(current, 'transform');
                if (transform && transform !== 'none') {
                    transforms = `${transform} ${transforms}`;
                }
            } while (!selfOnly && (current = current.parentElement));
        }
        const MatrixConstructor = window.DOMMatrix || window.WebKitCSSMatrix || window.CSSMatrix || window.MSCSSMatrix;
        return MatrixConstructor ? new MatrixConstructor(transforms) : null;
    };
    const getRect = (el, relativeToContainingBlock = false, relativeToNonStaticParent = false, undoScale = false, container) => {
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
            };
        }
        const elRect = el.getBoundingClientRect();
        let top = elRect.top;
        let left = elRect.left;
        let bottom = elRect.bottom;
        let right = elRect.right;
        let { width, height } = elRect;
        if ((relativeToContainingBlock || relativeToNonStaticParent) && el !== window) {
            container = container || el.parentNode;
            do {
                if (container?.getBoundingClientRect && (css(container, 'transform') !== 'none' || (relativeToNonStaticParent && css(container, 'position') !== 'static'))) {
                    const containerRect = container.getBoundingClientRect();
                    const borderTop = parseInt(css(container, 'border-top-width')) || 0;
                    const borderLeft = parseInt(css(container, 'border-left-width')) || 0;
                    top -= containerRect.top + borderTop;
                    left -= containerRect.left + borderLeft;
                    bottom = top + elRect.height;
                    right = left + elRect.width;
                    break;
                }
            } while ((container = container.parentNode));
        }
        if (undoScale && el !== window) {
            const elMatrix = matrix(container || el);
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
        };
    };

    /**
     * Returns the index of an object in an array by matching object properties
     * @param arr Array to search in
     * @param obj Object with properties to match
     * @returns Index of the first matching object, or -1 if not found
     */
    function indexOfObject(arr, obj) {
        for (let i = 0; i < arr.length; i++) {
            const matches = Object.keys(obj).every((key) => {
                return obj[key] === arr[i][key];
            });
            if (matches)
                return i;
        }
        return -1;
    }

    /**
     * Checks if two DOMRects are equal within rounding tolerance
     */
    const isRectEqual = (rect1, rect2) => {
        return Math.round(rect1.top) === Math.round(rect2.top) && Math.round(rect1.left) === Math.round(rect2.left) && Math.round(rect1.height) === Math.round(rect2.height) && Math.round(rect1.width) === Math.round(rect2.width);
    };
    /**
     * Calculates the real animation time based on movement distances
     */
    const calculateRealTime = (animatingRect, fromRect, toRect, options) => {
        const dx1 = Math.pow(fromRect.top - animatingRect.top, 2);
        const dy1 = Math.pow(fromRect.left - animatingRect.left, 2);
        const dx2 = Math.pow(fromRect.top - toRect.top, 2);
        const dy2 = Math.pow(fromRect.left - toRect.left, 2);
        return (Math.sqrt(dx1 + dy1) / Math.sqrt(dx2 + dy2)) * (options.animation || 0);
    };
    /**
     * Forces a browser repaint by accessing offsetWidth
     */
    const forceRepaint = (target) => target.offsetWidth;
    /**
     * Animate an element from one position to another using transforms
     */
    const animate = (target, currentRect, toRect, duration, options) => {
        if (!duration)
            return;
        // Clear existing transitions and transforms
        css(target, 'transition', '');
        css(target, 'transform', '');
        // Calculate scaling
        const elMatrix = matrix(target);
        const scaleX = elMatrix?.a || 1;
        const scaleY = elMatrix?.d || 1;
        // Calculate translation distances
        const translateX = (currentRect.left - toRect.left) / scaleX;
        const translateY = (currentRect.top - toRect.top) / scaleY;
        // Set animation flags
        target.animatingX = !!translateX;
        target.animatingY = !!translateY;
        // Apply initial transform
        css(target, 'transform', `translate3d(${translateX}px,${translateY}px,0)`);
        // Force repaint before transition
        forceRepaint(target);
        // Start animation
        css(target, 'transition', `transform ${duration}ms${options.easing ? ' ' + options.easing : ''}`);
        css(target, 'transform', 'translate3d(0,0,0)');
        // Clear previous animation timeout
        if (target.animated) {
            clearTimeout(target.animated);
        }
        // Set cleanup timeout
        target.animated = window.setTimeout(() => {
            css(target, 'transition', '');
            css(target, 'transform', '');
            target.animated = false;
            target.animatingX = false;
            target.animatingY = false;
        }, duration);
    };

    /**
     * Manages animation states and transitions for sortable elements
     */
    class AnimationStateManager {
        animationStates = [];
        animationCallbackId;
        sortable;
        state;
        cleanupManager;
        instanceId;
        constructor(sortable) {
            this.sortable = sortable;
            this.state = SortableState.getInstance();
            this.cleanupManager = CleanupManager.getInstance();
            this.instanceId = Symbol('AnimationStateManager');
        }
        /**
         * Captures the current state of all animated children
         */
        captureAnimationState() {
            this.animationStates = [];
            if (!this.sortable.options.animation)
                return;
            const dragState = this.state.getDragOperation();
            const children = Array.from(this.sortable.el.children);
            children.forEach((child) => {
                if (!(child instanceof HTMLElement))
                    return;
                if (css(child, 'display') === 'none' || child === dragState.ghostEl)
                    return;
                const state = {
                    target: child,
                    rect: getRect(child),
                };
                this.animationStates.push(state);
                // Store original rect for reference
                const fromRect = { ...state.rect };
                // Compensate for ongoing animations
                if (child.thisAnimationDuration) {
                    this.compensateForAnimation(child, fromRect);
                }
                child.fromRect = fromRect;
            });
        }
        /**
         * Adds a new animation state to track
         */
        addAnimationState(state) {
            this.animationStates.push(state);
        }
        /**
         * Removes an animation state for a specific target
         */
        removeAnimationState(target) {
            const index = indexOfObject(this.animationStates, { target });
            if (index !== -1) {
                this.animationStates.splice(index, 1);
            }
        }
        /**
         * Animates all tracked states
         */
        animateAll(callback) {
            if (!this.sortable.options.animation) {
                this.clearAnimation(callback);
                return;
            }
            const { animating, maxDuration } = this.processAnimationStates();
            this.scheduleCallback(animating, maxDuration, callback);
            this.animationStates = [];
        }
        /**
         * Animate a single element
         */
        animate(target, currentRect, toRect, duration) {
            animate(target, currentRect, toRect, duration, this.sortable.options);
        }
        /**
         * Compensates for any existing CSS transform matrix by adjusting the position coordinates of a DOMRect.
         * This is useful when you need the true position of an element ignoring its current transform.
         * @param element - The HTML element to check for transform matrix
         * @param rect - The original DOMRect to adjust
         * @returns A new DOMRect with position adjusted for transform matrix, or the original rect if no transform exists
         */
        compensateForAnimation(element, rect) {
            const computedMatrix = getComputedStyle(element).transform;
            if (computedMatrix && computedMatrix !== 'none') {
                const matrix = new DOMMatrix(computedMatrix);
                // Create a mutable copy of the rect properties
                return new DOMRect(rect.x - matrix.m41, // Adjust x/left
                rect.y - matrix.m42, // Adjust y/top
                rect.width, rect.height);
            }
            return rect;
        }
        /**
         * Process all animation states and calculate timings
         */
        processAnimationStates() {
            let animating = false;
            let maxDuration = 0;
            this.animationStates.forEach((state) => {
                const duration = this.calculateAnimationDuration(state);
                if (duration) {
                    animating = true;
                    maxDuration = Math.max(maxDuration, duration);
                    this.setupAnimationReset(state.target, duration);
                }
            });
            return { animating, maxDuration };
        }
        /**
         * Calculates the appropriate animation duration for a state transition.
         * If there's an ongoing animation, it may calculate real-time duration based on previous positions.
         * Otherwise, it uses the default animation duration from options.
         *
         * @param state - The animation state containing target and position information
         * @returns The calculated animation duration in milliseconds
         */
        calculateAnimationDuration(state) {
            const { target } = state;
            const currentRect = getRect(target);
            let duration = 0;
            // If there's an ongoing animation, check if we need to calculate real-time duration
            if (target.thisAnimationDuration &&
                target.prevFromRect &&
                target.prevToRect &&
                isRectEqual(target.prevFromRect, currentRect)) {
                duration = calculateRealTime(state.rect, target.prevFromRect, target.prevToRect, this.sortable.options);
            }
            // If the position has changed from the initial position
            if (target.fromRect && !isRectEqual(currentRect, target.fromRect)) {
                // Update tracking for the next animation frame
                this.updateAnimationTracking(target, currentRect);
                // Use default animation duration if real-time duration wasn't calculated
                if (!duration) {
                    duration = this.sortable.options.animation || 0;
                }
                this.animate(target, state.rect, currentRect, duration);
            }
            return duration;
        }
        /**
         * Determine if we should calculate real duration based on previous states
         */
        // private shouldCalculateRealDuration(target: HTMLElement, currentRect: DOMRect): boolean {
        //   return target.prevFromRect && target.prevToRect && isRectEqual(target.prevFromRect, currentRect) && !isRectEqual(target.fromRect!, currentRect);
        // }
        /**
         * Update animation tracking state for an element
         */
        updateAnimationTracking(target, currentRect) {
            target.prevFromRect = target.fromRect;
            target.prevToRect = currentRect;
        }
        /**
         * Setup animation reset timer for an element
         */
        setupAnimationReset(target, duration) {
            if (target.animationResetTimer) {
                clearTimeout(target.animationResetTimer);
            }
            target.animationResetTimer = window.setTimeout(() => {
                target.animationTime = 0;
                target.prevFromRect = null;
                target.fromRect = null;
                target.prevToRect = null;
                target.thisAnimationDuration = null;
                target.animationResetTimer = undefined;
            }, duration);
            // Register timer for cleanup
            this.cleanupManager.registerTimer(this.instanceId, target.animationResetTimer);
            target.thisAnimationDuration = duration;
        }
        /**
         * Schedule the animation callback
         */
        scheduleCallback(animating, duration, callback) {
            if (this.animationCallbackId) {
                clearTimeout(this.animationCallbackId);
            }
            if (!animating) {
                callback?.();
                return;
            }
            this.animationCallbackId = window.setTimeout(() => {
                callback?.();
                this.animationCallbackId = undefined;
            }, duration);
            // Register timer for cleanup
            if (this.animationCallbackId) {
                this.cleanupManager.registerTimer(this.instanceId, this.animationCallbackId);
            }
        }
        /**
         * Clear animation state and execute callback
         */
        clearAnimation(callback) {
            clearTimeout(this.animationCallbackId);
            callback?.();
        }
        destroy() {
            // The cleanupManager.cleanup will handle all timer cleanup
            this.cleanupManager.cleanup(this.instanceId);
        }
    }

    /**
     * Generates a unique identifier for an HTML element based on its properties
     * @param element The HTML element to generate an ID for
     * @returns A string hash of the element's properties
     */
    function generateElementId(element) {
        // Get element properties safely with type checking
        const properties = [element.tagName || '', element.className || '', element.src || '', element.href || '', element.textContent || ''];
        // Join all properties and generate hash
        const str = properties.join('_');
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
    /**
     * Gets an array of element IDs from a container based on a draggable selector
     * @param container The container element to search within
     * @param draggableSelector The selector to identify draggable elements
     * @param dataIdAttr The attribute to use for element IDs
     * @returns Array of element IDs
     */
    function getElementsArray(container, draggableSelector, dataIdAttr) {
        const order = [];
        const children = container.children;
        for (let i = 0; i < children.length; i++) {
            const el = children[i];
            if (closest(el, draggableSelector, container, false)) {
                order.push(el.getAttribute(dataIdAttr) || generateElementId(el));
            }
        }
        return order;
    }

    /**
     * Check if an element is scrollable
     */
    /**
     * Get the closest scrollable parent of an element
     * @param el Element to find scrollable parent for
     * @param includeHidden Whether to include elements with overflow: hidden
     * @returns The closest scrollable parent element or null if none found
     */
    const getScrollParent = (el, includeHidden = false) => {
        let style;
        // Skip if element is not valid
        if (!el || !el.parentElement) {
            return null;
        }
        let parent = el.parentElement;
        while (parent) {
            style = window.getComputedStyle(parent);
            const overflow = style.overflow + style.overflowY + style.overflowX;
            // Check if parent is scrollable
            if (/auto|scroll|overlay/.test(overflow) || (includeHidden && overflow.includes('hidden'))) {
                return parent;
            }
            parent = parent.parentElement;
        }
        // If no scrollable parent found, return document.scrollingElement or body
        return document.scrollingElement || document.documentElement;
    };
    /**
     * Get scroll position of an element
     */
    const getScroll = (el) => {
        if (el === window) {
            return {
                scrollTop: window.pageYOffset || document.documentElement.scrollTop,
                scrollLeft: window.pageXOffset || document.documentElement.scrollLeft,
            };
        }
        return {
            scrollTop: el.scrollTop,
            scrollLeft: el.scrollLeft,
        };
    };

    class Sortable {
        static defaultOptions = {
            group: null,
            sort: true,
            disabled: false,
            store: null,
            handle: null,
            draggable: '>*',
            swapThreshold: 1,
            invertSwap: false,
            invertedSwapThreshold: null,
            removeCloneOnHide: true,
            direction: 'vertical',
            draggingClass: 'sortable-dragging',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            ignore: 'a, img',
            filter: null,
            preventOnFilter: true,
            animation: 0,
            easing: null,
            setData: function (dataTransfer, activeEl) {
                dataTransfer.setData('Text', activeEl.textContent || '');
            },
            dropBubble: false,
            dragoverBubble: false,
            dataIdAttr: 'data-id',
            delay: 0,
            touchStartThreshold: 1,
            forceFallback: false,
            fallbackClass: 'sortable-fallback',
            fallbackOnBody: false,
            fallbackTolerance: 0,
            fallbackOffset: { x: 0, y: 0 },
            supportPointer: true,
            emptyInsertThreshold: 5,
        };
        state;
        instanceId;
        cleanupManager;
        animationManager;
        dragStartTimer;
        normalizedGroup = null;
        options;
        el;
        constructor(el, options) {
            if (!el || !el.nodeType || el.nodeType !== 1) {
                throw new Error('Sortable: `el` must be HTMLElement, not null or undefined');
            }
            this.instanceId = Symbol('SortableInstance');
            this.cleanupManager = CleanupManager.getInstance();
            this.el = el;
            this.options = { ...Sortable.defaultOptions, ...options };
            this.state = SortableState.getInstance();
            // Initialize animation manager with cleanup
            this.animationManager = new AnimationStateManager(this);
            this.cleanupManager.registerAnimationCleanup(this.instanceId, () => {
                this.animationManager.destroy();
            });
            // Register this instance in state
            this.state.registerInstance(el, this);
            // Initialize event listeners
            this.initializeEventListeners();
            // Prepare group options if specified
            if (this.options.group) {
                this.prepareGroup();
            }
        }
        initializeEventListeners() {
            const verifyDragHandler = (evt) => {
                this.verifyDrag(evt);
            };
            // Register main event listeners
            if (this.options.supportPointer) {
                this.cleanupManager.registerEventListener(this.instanceId, this.el, 'pointerdown', verifyDragHandler);
            }
            else {
                this.cleanupManager.registerEventListener(this.instanceId, this.el, 'mousedown', verifyDragHandler);
                this.cleanupManager.registerEventListener(this.instanceId, this.el, 'touchstart', verifyDragHandler);
            }
            // Register scroll listeners if needed
            const scrollEl = getScrollParent(this.el);
            if (scrollEl && scrollEl !== document.documentElement && scrollEl !== document.scrollingElement) {
                const scrollHandler = (evt) => {
                    this.onScroll(evt);
                };
                this.cleanupManager.registerEventListener(this.instanceId, scrollEl, 'scroll', scrollHandler);
            }
        }
        // Helper method that calculates if elements should be swapped based on movement
        onMove = (dragRect, targetRect, direction, sibling) => {
            const options = this.options;
            const threshold = options.swapThreshold || 1;
            const invertSwap = options.invertSwap || false;
            const invertedThreshold = options.invertedSwapThreshold || threshold;
            const after = invertSwap ? false : threshold > 0.5;
            const dragState = this.state.getDragOperation();
            if (direction === 'vertical') {
                const dragCenter = dragRect.top + dragRect.height / 2;
                const targetCenter = targetRect.top + targetRect.height / 2;
                const isOverThreshold = after ? (dragCenter - targetCenter) / targetRect.height > threshold : (targetCenter - dragCenter) / targetRect.height > invertedThreshold;
                if (isOverThreshold) {
                    return this.dispatchMoveEvent(sibling, dragState.sourceEl, after);
                }
            }
            else {
                const dragCenter = dragRect.left + dragRect.width / 2;
                const targetCenter = targetRect.left + targetRect.width / 2;
                const isOverThreshold = after ? (dragCenter - targetCenter) / targetRect.width > threshold : (targetCenter - dragCenter) / targetRect.width > invertedThreshold;
                if (isOverThreshold) {
                    return this.dispatchMoveEvent(sibling, dragState.sourceEl, after);
                }
            }
            return false;
        };
        dispatchMoveEvent(target, related, willInsertAfter) {
            if (!target || !related)
                return false;
            const moveEvent = new CustomEvent('sortable:move', {
                bubbles: true,
                cancelable: true,
                detail: {
                    target,
                    related,
                    willInsertAfter,
                },
            });
            this.el.dispatchEvent(moveEvent);
            return !moveEvent.defaultPrevented;
        }
        // initial event handler: triggers when a user first interacts with a sortable element
        verifyDrag = (evt) => {
            if (!evt.cancelable)
                return;
            const target = this.state.getEventTarget(evt);
            if (!target)
                return;
            const validTarget = closest(target, this.getDraggableSelector(), this.el, false);
            if (!validTarget)
                return;
            // Get initial position from event
            const coordinates = getEventCoordinates(evt);
            if (!coordinates)
                return;
            const { clientX, clientY } = coordinates;
            // Start drag operation in state with initial position
            this.state.startDrag(validTarget, clientX, clientY);
            // Initialize drag position
            const touch = getTouchFromEvent(evt);
            if (touch) {
                this.state.updateDragPosition(touch.clientX, touch.clientY);
            }
            this.initializeDragOperation(touch, validTarget);
        };
        initDrag = () => {
            const dragState = this.state.getDragOperation();
            if (!dragState.sourceEl)
                return;
            // Create preview
            this.appendDraggingEl();
            // Setup document listeners
            const ownerDocument = this.el.ownerDocument;
            if (this.options.supportPointer) {
                this.cleanupManager.registerEventListener(this.instanceId, ownerDocument, 'pointermove', this.calculateDrag);
            }
            else {
                this.cleanupManager.registerEventListener(this.instanceId, ownerDocument, 'mousemove', this.calculateDrag);
                this.cleanupManager.registerEventListener(this.instanceId, ownerDocument, 'touchmove', this.calculateDrag);
            }
            this.cleanupManager.registerEventListener(this.instanceId, ownerDocument, 'dragover', this.onDragOver);
            // Update state and dispatch
            this.state.updateDragElements({
                dragEl: dragState.sourceEl,
                oldIndex: Array.from(this.el.children).indexOf(dragState.sourceEl),
            });
            this.dispatchSortEvent('dragstart');
        };
        initializeDragOperation(touch, target) {
            target.style.willChange = 'transform';
            this.bindDragListeners(!!touch);
            // Handle delay if needed
            const delay = this.options.delay;
            if (this.shouldApplyDelay()) {
                this.dragStartTimer = window.setTimeout(() => {
                    this.initDrag();
                    this.dragStartTimer = undefined;
                }, delay);
                // Register timer cleanup
                this.cleanupManager.registerTimer(this.instanceId, this.dragStartTimer);
            }
            else {
                this.initDrag();
            }
        }
        // Swap calculation logic: Tracks the dragging element
        calculateDrag = (evt) => {
            const dragState = this.state.getDragOperation();
            if (!dragState.active || !evt.cancelable)
                return;
            const coordinates = getEventCoordinates(evt);
            if (!coordinates)
                return;
            const { clientX, clientY } = coordinates;
            // Update position in state
            this.state.updateDragPosition(clientX, clientY);
            if (dragState.dragEl) {
                evt.preventDefault();
                this.emulateDragOver(evt);
                // Update preview position
                const mtx = matrix(dragState.dragEl) || { e: 0, f: 0 };
                const dx = clientX - dragState.position.clientX;
                const dy = clientY - dragState.position.clientY;
                dragState.dragEl.style.transform = `translate3d(${dx + (mtx.e || 0)}px,${dy + (mtx.f || 0)}px,0)`;
            }
            else if (!dragState.moved) {
                const threshold = this.options.touchStartThreshold || 1;
                const moveDistance = Math.max(Math.abs(clientX - dragState.position.clientX), Math.abs(clientY - dragState.position.clientY));
                if (moveDistance >= threshold) {
                    this.state.updateDragElements({ moved: true });
                    this.initDrag();
                }
            }
        };
        onDragOver = (evt) => {
            const dragState = this.state.getDragOperation();
            if (!dragState.active || !dragState.sourceEl)
                return;
            evt.preventDefault();
            evt.stopPropagation();
            let clientX;
            let clientY;
            // Extract coordinates based on event type
            if (this.isTouchEvent(evt)) {
                const touch = evt.touches[0];
                if (!touch)
                    return;
                clientX = touch.clientX;
                clientY = touch.clientY;
            }
            else if (this.isDragEvent(evt)) {
                clientX = evt.clientX;
                clientY = evt.clientY;
            }
            else {
                // MouseEvent
                clientX = evt.clientX;
                clientY = evt.clientY;
            }
            const targetEl = document.elementFromPoint(clientX, clientY);
            if (!targetEl)
                return;
            const validTarget = closest(targetEl, this.getDraggableSelector(), this.el, false);
            if (!validTarget || validTarget === dragState.sourceEl)
                return;
            const rect = getRect(validTarget);
            const direction = this.getDirection(evt, validTarget);
            // Calculate previous and next siblings for potential swapping
            const prevSibling = validTarget.previousElementSibling;
            const nextSibling = validTarget.nextElementSibling;
            // Calculate insertion point based on direction and position
            const centerY = rect.top + rect.height / 2;
            const centerX = rect.left + rect.width / 2;
            const isVertical = direction === 'vertical';
            const coordinate = isVertical ? clientY : clientX;
            const center = isVertical ? centerY : centerX;
            // Determine if we should insert before or after the target
            const insertBefore = coordinate < center;
            const sibling = insertBefore ? prevSibling : nextSibling;
            // Get drag element rect for comparison
            const dragRect = getRect(dragState.sourceEl);
            // Check if we should move the element
            if (this.onMove(dragRect, rect, direction, sibling)) {
                // Capture the current state for animation
                this.captureAnimationState();
                // Insert the dragged element
                if (insertBefore) {
                    validTarget.parentNode?.insertBefore(dragState.sourceEl, validTarget);
                }
                else {
                    validTarget.parentNode?.insertBefore(dragState.sourceEl, validTarget.nextSibling);
                }
                // Add animation state for the moved target
                this.addAnimationState({
                    target: validTarget,
                    rect: getRect(validTarget),
                });
                // Update drag state with new position
                this.state.updateDragPosition(clientX, clientY);
                // Dispatch sort event if needed
                const oldIndex = dragState.oldIndex ?? -1;
                const newIndex = Array.from(this.el.children).indexOf(dragState.sourceEl);
                if (oldIndex !== newIndex) {
                    this.dispatchSortEvent('sort', {
                        oldIndex,
                        newIndex,
                        dragEl: dragState.sourceEl,
                        target: validTarget,
                    });
                }
                // Animate elements if animation duration is set
                if (this.options.animation) {
                    this.animateAll();
                }
            }
        };
        onScroll = (evt) => {
            const dragState = this.state.getDragOperation();
            if (!dragState.active || !dragState.dragEl)
                return;
            // Get scroll coordinates
            const { scrollTop, scrollLeft } = evt.target;
            // Update drag element position based on scroll
            const mtx = matrix(dragState.dragEl) || { e: 0, f: 0 };
            const dx = dragState.position.clientX - dragState.position.initialX;
            const dy = dragState.position.clientY - dragState.position.initialY;
            dragState.dragEl.style.transform = `translate3d(${dx + (mtx.e || 0)}px,${dy + (mtx.f || 0)}px,0)`;
            // Update scroll position in state
            this.state.updateScrollPosition(scrollTop, scrollLeft);
        };
        emulateDragOver = (evt) => {
            // 1. Validate drag state
            const dragState = this.state.getDragOperation();
            if (!dragState.active || !dragState.dragEl)
                return;
            // 2. Get coordinates from event
            const coordinates = getEventCoordinates(evt);
            if (!coordinates)
                return;
            const { clientX, clientY } = coordinates;
            // 3. Handle drag preview visibility
            this.toggleDraggingElVisibility(false);
            // 4. Find target element at point
            const targetAtPoint = document.elementFromPoint(clientX, clientY);
            if (!targetAtPoint || !(targetAtPoint instanceof HTMLElement)) {
                this.toggleDraggingElVisibility(true);
                return;
            }
            // 5. Show drag preview
            this.toggleDraggingElVisibility(true);
            // 6. Handle dragging outside current sortable
            if (this.isOutsideThisEl(targetAtPoint)) {
                const targetSortable = this.getSortableParent(targetAtPoint);
                if (targetSortable && targetSortable !== this) {
                    targetSortable.handleDragOver(evt);
                    return;
                }
            }
            // 7. Get valid drag target
            const validTarget = closest(targetAtPoint, this.getDraggableSelector(), this.el, false);
            if (!validTarget || validTarget === dragState.sourceEl)
                return;
            // 8. Calculate rects and direction
            const dragRect = getRect(dragState.dragEl);
            const targetRect = getRect(validTarget);
            const direction = this.getDirection(evt, validTarget);
            // 9. Determine sibling based on direction
            const sibling = this.getTargetSibling(validTarget, direction);
            // 10. Check if move is valid and perform animation
            if (this.onMove(dragRect, targetRect, direction, sibling)) {
                this.captureAnimationState();
                this._animate(validTarget);
                this.addAnimationState({
                    target: validTarget,
                    rect: getRect(validTarget),
                });
            }
        };
        onDrop = (evt) => {
            if (evt) {
                evt.preventDefault();
            }
            const dragState = this.state.getDragOperation();
            if (!dragState.active || !dragState.dragEl)
                return;
            // Remove preview
            if (dragState.dragEl.parentNode) {
                dragState.dragEl.parentNode.removeChild(dragState.dragEl);
            }
            // Reset styles
            const draggingClass = this.options.draggingClass || 'sortable-dragging';
            const fallbackClass = this.options.fallbackClass || 'sortable-fallback';
            if (dragState.sourceEl) {
                toggleClass(dragState.sourceEl, draggingClass, false);
                toggleClass(dragState.sourceEl, fallbackClass, false);
            }
            // Dispatch drop event
            this.dispatchSortEvent('drop');
            // Reset state
            this.state.endDrag();
        };
        // Helper method to determine target sibling
        getTargetSibling(target, direction) {
            return direction === 'vertical' ? target.nextElementSibling : target.previousElementSibling;
        }
        getSortableParent = (el) => {
            let current = el;
            while (current && current !== document.body) {
                const instance = this.state.getInstance(current);
                if (instance)
                    return instance;
                current = current.parentElement;
            }
            return null;
        };
        toggleDraggingElVisibility(show) {
            const dragState = this.state.getDragOperation();
            if (dragState.dragEl) {
                css(dragState.dragEl, 'display', show ? '' : 'none');
            }
        }
        appendDraggingEl() {
            const dragState = this.state.getDragOperation();
            if (!dragState.sourceEl)
                return;
            // Early container resolution
            const container = this.options.fallbackOnBody ? document.body : this.el;
            const scrollParent = getScrollParent(this.el);
            const isAbsolutePositioning = (scrollParent && scrollParent !== document.body) ?? false;
            // Get initial rect with proper parameters
            const rect = getRect(dragState.sourceEl, true, this.options.fallbackOnBody, true, container);
            // Create drag element with all properties
            const dragEl = this.createDragElement(dragState.sourceEl, rect);
            // Position the element
            this.positionDragElement(dragEl, rect, isAbsolutePositioning, scrollParent);
            // Append and update state
            container.appendChild(dragEl);
            this.state.updateDragElements({ dragEl });
        }
        createDragElement(sourceEl, rect) {
            const dragEl = sourceEl.cloneNode(true);
            const { draggingClass = 'sortable-dragging', fallbackClass = 'sortable-fallback' } = this.options;
            // Add classes
            toggleClass(dragEl, fallbackClass, true);
            toggleClass(dragEl, draggingClass, true);
            // Apply base styles
            const baseStyles = {
                position: 'fixed',
                zIndex: '100000',
                pointerEvents: 'none',
                width: `${rect.width}px`,
                height: `${rect.height}px`,
                boxSizing: 'border-box',
                margin: '0',
                opacity: '0.8',
                transition: '',
                transform: '',
            };
            css(dragEl, baseStyles);
            return dragEl;
        }
        positionDragElement(dragEl, rect, isAbsolutePositioning, scrollParent) {
            if (!isAbsolutePositioning) {
                css(dragEl, {
                    top: `${rect.top}px`,
                    left: `${rect.left}px`,
                });
                return;
            }
            // Handle scroll parent positioning
            const scrollParentRect = getRect(scrollParent);
            const scroll = getScroll(scrollParent);
            css(dragEl, {
                position: 'absolute',
                top: `${rect.top - scrollParentRect.top + scroll.scrollTop}px`,
                left: `${rect.left - scrollParentRect.left + scroll.scrollLeft}px`,
            });
        }
        // Type guards for event types
        isTouchEvent(evt) {
            return 'touches' in evt;
        }
        isDragEvent(evt) {
            return 'dataTransfer' in evt;
        }
        shouldApplyDelay() {
            return !!(this.options.delay && this.options.delay > 0);
        }
        bindDragListeners(isTouch) {
            const doc = this.el.ownerDocument;
            if (this.options.supportPointer) {
                this.cleanupManager.registerEventListener(this.instanceId, doc, 'pointermove', this.calculateDrag);
                this.cleanupManager.registerEventListener(this.instanceId, doc, 'pointerup', this.onDrop);
                this.cleanupManager.registerEventListener(this.instanceId, doc, 'pointercancel', this.onDrop);
            }
            else {
                this.cleanupManager.registerEventListener(this.instanceId, doc, isTouch ? 'touchmove' : 'mousemove', this.calculateDrag);
                this.cleanupManager.registerEventListener(this.instanceId, doc, isTouch ? 'touchend' : 'mouseup', this.onDrop);
                if (isTouch) {
                    this.cleanupManager.registerEventListener(this.instanceId, doc, 'touchcancel', this.onDrop);
                }
            }
        }
        _animate(target) {
            const dragState = this.state.getDragOperation();
            if (!dragState.sourceEl)
                return;
            const oldIndex = Array.from(this.el.children).indexOf(dragState.sourceEl);
            const newIndex = Array.from(this.el.children).indexOf(target);
            if (oldIndex !== newIndex) {
                this.el.insertBefore(dragState.sourceEl, target);
                this.dispatchSortEvent('sort', {
                    oldIndex,
                    newIndex,
                    dragEl: dragState.sourceEl,
                    target,
                });
            }
        }
        dispatchSortEvent(name, detail = {}) {
            const evt = new CustomEvent(name, {
                bubbles: true,
                cancelable: true,
                detail: {
                    ...detail,
                    from: this.el,
                },
            });
            this.el.dispatchEvent(evt);
        }
        getDirection(evt, target) {
            const direction = this.options.direction;
            if (typeof direction === 'function') {
                return direction.call(this, evt, target, this.state.getDragOperation().sourceEl);
            }
            return direction || 'vertical';
        }
        isOutsideThisEl(target) {
            return !target || (!this.el.contains(target) && target !== this.el);
        }
        destroy() {
            this.state.destroyInstance(this.instanceId);
        }
        option(name, value) {
            if (value === undefined) {
                return this.options[name];
            }
            this.options[name] = value;
            if (name === 'group') {
                this.prepareGroup();
            }
            return value;
        }
        toArray() {
            return getElementsArray(this.el, this.getDraggableSelector(), this.options.dataIdAttr || 'data-id');
        }
        sort(order, useAnimation) {
            const items = {};
            const rootEl = this.el;
            this.toArray().forEach((id, i) => {
                const el = rootEl.children[i];
                if (closest(el, this.getDraggableSelector(), rootEl, false)) {
                    items[id] = el;
                }
            });
            useAnimation && this.captureAnimationState();
            order.forEach((id) => {
                if (items[id]) {
                    rootEl.removeChild(items[id]);
                    rootEl.appendChild(items[id]);
                }
            });
            useAnimation && this.animateAll();
        }
        // unused so far
        save() {
            const store = this.options.store;
            store?.set?.(this);
        }
        // Animation Methods
        captureAnimationState() {
            this.animationManager.captureAnimationState();
        }
        addAnimationState(state) {
            this.animationManager.addAnimationState(state);
        }
        removeAnimationState(target) {
            this.animationManager.removeAnimationState(target);
        }
        animateAll(callback) {
            this.animationManager.animateAll(callback);
        }
        animate(target, currentRect, toRect, duration) {
            this.animationManager.animate(target, currentRect, toRect, duration);
        }
        handleDragOver(evt) {
            this.onDragOver(evt);
        }
        getDraggableSelector() {
            return this.options.draggable;
        }
        prepareGroup() {
            const options = this.options;
            if (!options.group) {
                options.group = {
                    name: undefined,
                    pull: true,
                    put: true,
                    revertClone: false,
                };
            }
            if (typeof options.group === 'string') {
                options.group = { name: options.group };
            }
            const group = options.group;
            this.normalizedGroup = {
                name: group.name ?? null,
                checkPull: (to, from, dragEl, evt) => {
                    if (!group.pull)
                        return false;
                    if (typeof group.pull === 'function') {
                        return group.pull(to, from, dragEl, evt);
                    }
                    return group.pull;
                },
                checkPut: (to, from, dragEl, evt) => {
                    if (!group.put)
                        return false;
                    if (Array.isArray(group.put)) {
                        const fromGroup = from.normalizedGroup;
                        return group.put.includes(fromGroup?.name ?? '');
                    }
                    if (typeof group.put === 'function') {
                        return group.put(to, from, dragEl, evt);
                    }
                    return !!group.put;
                },
                revertClone: group.revertClone ?? false,
            };
            // Register group cleanup
            this.cleanupManager.registerCustomCleanup(this.instanceId, () => {
                this.normalizedGroup = null;
            });
        }
    }

    exports.AnimationStateManager = AnimationStateManager;
    exports.Sortable = Sortable;
    exports.animate = animate;
    exports.closest = closest;
    exports.getRect = getRect;

}));
//# sourceMappingURL=sortablets.js.map
