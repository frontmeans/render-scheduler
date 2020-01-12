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
export type ManualRenderScheduler = RenderScheduler & {

  /**
   * Executes all scheduled renders.
   *
   * @returns `true` if some renders executed, or `false` when no renders scheduled.
   */
  render(): boolean;

};

/**
 * Creates new render scheduler that executes scheduled renders on request.
 *
 * Call its [[ManualRenderScheduler.render]] method to execute scheduled renders.
 *
 * @returns New manual render scheduler.
 */
export function newManualRenderScheduler(): ManualRenderScheduler {

  let pendingTask: (() => void) | undefined;
  let queue = ScheduledRenderQueue.by({
    schedule: task => {

      const prev = pendingTask;

      pendingTask = prev ? () => { prev(); task(); } : task;
    },
    replace: replacement => queue = replacement,
  });
  const scheduler = customRenderScheduler({
    newQueue: () => queue,
  }) as ManualRenderScheduler;

  scheduler.render = () => {

    const task = pendingTask;

    pendingTask = undefined;

    if (task) {
      task();
      return true;
    }

    return false;
  };

  return scheduler;
}
