/**
 * @module render-scheduler
 */
import { customRenderScheduler } from './custom-render-scheduler';
import { RenderScheduler } from './render-scheduler';

/**
 * A render scheduler that executes renders immediately upon scheduling.
 *
 * The renders scheduled during render execution are executed immediately after current (and postponed) renders
 * execution.
 */
export const immediateRenderScheduler: RenderScheduler =
    (/*#__PURE__*/ customRenderScheduler({
      schedule(task) {
        task();
      },
    }));
