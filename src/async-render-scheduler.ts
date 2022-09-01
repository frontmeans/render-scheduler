import { customRenderScheduler } from './custom-render-scheduler';
import { RenderQueue } from './render-queue';
import type { RenderScheduler } from './render-scheduler';

function asyncRenderQueue$schedule(task: () => void): void {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  Promise.resolve().then(task);
}

let asyncRenderQueue = /*#__PURE__*/ RenderQueue.by({
  schedule: asyncRenderQueue$schedule,
  recur: asyncRenderQueue$schedule,
  replace: replacement => (asyncRenderQueue = replacement),
});

/**
 * A render scheduler that executes scheduled render shots asynchronously.
 *
 * Recurrent render shots are also executed asynchronously.
 */
export const asyncRenderScheduler: RenderScheduler = /*#__PURE__*/ customRenderScheduler({
  newQueue: () => asyncRenderQueue,
});
