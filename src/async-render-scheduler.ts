import { customRenderScheduler } from './custom-render-scheduler';
import { RenderQueue } from './render-queue';
import type { RenderScheduler } from './render-scheduler';

/**
 * @internal
 */
let asyncRenderQueue = (/*#__PURE__*/ RenderQueue.by({
  schedule: task => Promise.resolve().then(task),
  replace: replacement => asyncRenderQueue = replacement,
}));

/**
 * A render scheduler that executes scheduled render shots asynchronously.
 */
export const asyncRenderScheduler: RenderScheduler = (/*#__PURE__*/ customRenderScheduler({
  newQueue: () => asyncRenderQueue,
}));
