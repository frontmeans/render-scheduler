/**
 * @module render-scheduler
 */
import { customRenderScheduler } from './custom-render-scheduler';
import { RenderScheduler } from './render-scheduler';

/**
 * @internal
 */
export const animationRenderScheduler: RenderScheduler =
    (/*#__PURE__*/ customRenderScheduler(
        ({ window }) => ({
          schedule(task) {
            window.requestAnimationFrame(task);
          },
        }),
    ));
