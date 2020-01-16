/**
 * @module render-scheduler
 */
import { customRenderScheduler, ScheduledRenderQueue } from './custom-render-scheduler';
import { RenderScheduler } from './render-scheduler';

/**
 * @internal
 */
const animationRenderQueues = (/*#__PURE__*/ new WeakMap<Window, ScheduledRenderQueue>());

/**
 * A render scheduler that executes the scheduled renders within animation frame.
 *
 * Utilizes [requestAnimationFrame()] function for that.
 *
 * The renders scheduled by different schedules created for the same window are all executed in the same animation
 * frame. The {@link ScheduledRenderExecution.postpone postponed} renders are executed only after all scheduled ones
 * complete.
 *
 * [requestAnimationFrame()]: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
 */
export const animationRenderScheduler: RenderScheduler =
    (/*#__PURE__*/ customRenderScheduler({
      newQueue({ window}) {

        const existing = animationRenderQueues.get(window);

        if (existing) {
          return existing;
        }

        const newQueue = ScheduledRenderQueue.by({
          schedule: task => window.requestAnimationFrame(task),
          replace: replacement => animationRenderQueues.set(window, replacement),
        });

        animationRenderQueues.set(window, newQueue);

        return newQueue;
      },
    }));
