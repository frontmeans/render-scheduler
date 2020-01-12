/**
 * @module render-scheduler
 */
import { customRenderScheduler } from './custom-render-scheduler';
import { RenderScheduler } from './render-scheduler';

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
    (/*#__PURE__*/ customRenderScheduler(
        ({ window }) => ({
          schedule(task) {
            window.requestAnimationFrame(task);
          },
        }),
    ));
