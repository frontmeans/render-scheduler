/**
 * @packageDocumentation
 * @module render-scheduler
 */
import { customRenderScheduler } from './custom-render-scheduler';
import { RenderQueue } from './render-queue';
import { RenderScheduler } from './render-scheduler';

/**
 * A render scheduler that executes scheduled render shots on request.
 *
 * Can be constructed using [[newManualRenderScheduler]] function.
 */
export interface ManualRenderScheduler extends RenderScheduler {

  /**
   * Executes all scheduled render shots.
   *
   * @returns `true` if some render shots executed, or `false` when no render shots scheduled.
   */
  render(): boolean;

}

/**
 * Creates new render scheduler that executes scheduled render shots on request.
 *
 * A [[ManualRenderScheduler.render]] method should be called to execute scheduled render shots.
 *
 * @returns New manual render scheduler.
 */
export function newManualRenderScheduler(): ManualRenderScheduler {

  const emptyTask = (): boolean => false;
  let pendingTask = emptyTask;
  let queue = RenderQueue.by({
    // Called at most once until reset
    schedule: task => pendingTask = () => {
      task();
      return true;
    },
    replace: replacement => {
      pendingTask = emptyTask;
      queue = replacement;
    },
  });
  const scheduler = customRenderScheduler({
    newQueue: () => queue,
  }) as ManualRenderScheduler;

  scheduler.render = () => pendingTask();

  return scheduler;
}
