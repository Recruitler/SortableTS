import { ISortableDOMEventListener } from './dom/event.interfaces';
export declare class CleanupManager {
    private tasks;
    private static instance;
    private constructor();
    static getInstance(): CleanupManager;
    private removeEventListener;
    registerEventListener(instanceId: symbol, element: HTMLElement | Document, event: string, handler: ISortableDOMEventListener): void;
    registerTimer(instanceId: symbol, timerId: number): void;
    registerAnimationCleanup(instanceId: symbol, cleanup: () => void): void;
    registerCustomCleanup(instanceId: symbol, cleanup: () => void): void;
    private addTask;
    cleanup(instanceId: symbol): void;
    cleanupAll(): void;
}
