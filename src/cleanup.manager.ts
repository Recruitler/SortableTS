import { ISortableDOMEventListener } from '@dom/event.interfaces';

interface ICaptureMode {
  capture: boolean;
  passive: boolean;
}

const captureMode: ICaptureMode = {
  capture: false,
  passive: false,
};

interface ICleanupTask {
  type: 'event' | 'timer' | 'animation' | 'custom';
  cleanup: () => void;
}

export class CleanupManager {
  private tasks: Map<symbol, Set<ICleanupTask>> = new Map();
  private static instance: CleanupManager;

  private constructor() {}

  public static getInstance(): CleanupManager {
    if (!CleanupManager.instance) {
      CleanupManager.instance = new CleanupManager();
    }
    return CleanupManager.instance;
  }

  private removeEventListener(el: HTMLElement | Document, event: string, fn: ISortableDOMEventListener): void {
    el.removeEventListener(event, fn as EventListener, captureMode);
  }

  public registerEventListener(instanceId: symbol, element: HTMLElement | Document, event: string, handler: ISortableDOMEventListener): void {
    element.addEventListener(event, handler as EventListener, captureMode);
    this.addTask(instanceId, {
      type: 'event',
      cleanup: () => this.removeEventListener(element, event, handler),
    });
  }

  public registerTimer(instanceId: symbol, timerId: number): void {
    this.addTask(instanceId, {
      type: 'timer',
      cleanup: () => clearTimeout(timerId),
    });
  }

  public registerAnimationCleanup(instanceId: symbol, cleanup: () => void): void {
    this.addTask(instanceId, {
      type: 'animation',
      cleanup,
    });
  }

  public registerCustomCleanup(instanceId: symbol, cleanup: () => void): void {
    this.addTask(instanceId, {
      type: 'custom',
      cleanup,
    });
  }

  private addTask(instanceId: symbol, task: ICleanupTask): void {
    if (!this.tasks.has(instanceId)) {
      this.tasks.set(instanceId, new Set());
    }
    this.tasks.get(instanceId)!.add(task);
  }

  public cleanup(instanceId: symbol): void {
    const tasks = this.tasks.get(instanceId);
    if (!tasks) return;

    // Execute all cleanup tasks
    tasks.forEach((task) => task.cleanup());

    // Clear tasks for this instance
    this.tasks.delete(instanceId);
  }

  public cleanupAll(): void {
    this.tasks.forEach((_tasks: Set<ICleanupTask>, instanceId: symbol) => {
      this.cleanup(instanceId);
    });
    this.tasks.clear();
  }
}
