/**
 * @packageDocumentation
 * @module @frontmeans/render-scheduler
 */
import { customRenderScheduler } from './custom-render-scheduler';
import { RenderQueue } from './render-queue';
import type { RenderScheduler } from './render-scheduler';

/**
 * @internal
 */
const animationRenderQueues = (/*#__PURE__*/ new WeakMap<Window, RenderQueue>());

/**
 * A render scheduler that executes scheduled render shots within animation frame.
 *
 * Utilizes [requestAnimationFrame()] function for that.
 *
 * The render shots scheduled by different schedules created for the same window are all executed in the same animation
 * frame. The {@link RenderExecution.postpone postponed} render shots are executed only after all scheduled ones
 * complete.
 *
 * [requestAnimationFrame()]: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
 */
export const animationRenderScheduler: RenderScheduler = (/*#__PURE__*/ customRenderScheduler({
  newQueue({ window }) {

    const existing = animationRenderQueues.get(window);

    if (existing) {
      return existing;
    }

    const newQueue = RenderQueue.by({
      schedule: task => window.requestAnimationFrame(task),
      replace: replacement => animationRenderQueues.set(window, replacement),
    });

    animationRenderQueues.set(window, newQueue);

    return newQueue;
  },
}));
