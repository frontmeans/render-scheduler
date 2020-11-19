/**
 * @packageDocumentation
 * @module @proc7ts/render-scheduler
 */
import { customRenderScheduler } from './custom-render-scheduler';
import { RenderQueue } from './render-queue';
import type { RenderScheduler } from './render-scheduler';

/**
 * @internal
 */
let immediateRenderQueue = (/*#__PURE__*/ RenderQueue.by({
  schedule: task => task(),
  replace: replacement => immediateRenderQueue = replacement,
}));

/**
 * A render scheduler that schedules render shots for immediate execution.
 *
 * In contrast to [[immediateRenderScheduler]] this one utilizes {@link RenderQueue render queue}. So it acts handles
 * scheduled render shots to other schedulers, such as [[animationRenderScheduler]]. In particular, it adds recurrent
 * render shots to render queue instead of executing them immediately.
 */
export const queuedRenderScheduler: RenderScheduler = (/*#__PURE__*/ customRenderScheduler({
  newQueue: () => immediateRenderQueue,
}));
