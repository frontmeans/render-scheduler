/**
 * @module render-scheduler
 */
import { customRenderScheduler, ScheduledRenderQueue } from './custom-render-scheduler';
import { RenderScheduler } from './render-scheduler';

/**
 * @internal
 */
let asyncRenderQueue = (/*#__PURE__*/ ScheduledRenderQueue.by({
  schedule: task => Promise.resolve().then(task),
  replace: replacement => asyncRenderQueue = replacement,
}));

/**
 * A render scheduler that executes the scheduled renders asynchronously.
 */
export const asyncRenderScheduler: RenderScheduler =
    (/*#__PURE__*/ customRenderScheduler({
      newQueue: () => asyncRenderQueue,
    }));
