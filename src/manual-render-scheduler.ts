/**
 * @module render-scheduler
 */
import { customRenderScheduler, ScheduledRenderQueue } from './custom-render-scheduler';
import { RenderScheduler } from './render-scheduler';

/**
 * A render scheduler that executes scheduled renders on request.
 *
 * Can be constructed using [[newManualRenderScheduler]] function.
 */
export interface ManualRenderScheduler extends RenderScheduler {

  /**
   * Executes all scheduled renders.
   *
   * @returns `true` if some renders executed, or `false` when no renders scheduled.
   */
  render(): boolean;

}

/**
 * Creates new render scheduler that executes scheduled renders on request.
 *
 * Call its [[ManualRenderScheduler.render]] method to execute scheduled renders.
 *
 * @returns New manual render scheduler.
 */
export function newManualRenderScheduler(): ManualRenderScheduler {

  const emptyTask = (): boolean => false;
  let pendingTask = emptyTask;
  let queue = ScheduledRenderQueue.by({
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
