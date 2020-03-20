/**
 * @packageDocumentation
 * @module @proc7ts/render-scheduler
 */
import { customRenderScheduler } from './custom-render-scheduler';
import { RenderQueue } from './render-queue';
import { RenderScheduler } from './render-scheduler';

/**
 * @internal
 */
let immediateRenderQueue = (/*#__PURE__*/ RenderQueue.by({
  schedule: task => task(),
  replace: replacement => immediateRenderQueue = replacement,
}));

/**
 * A render scheduler that executes scheduled render shots immediately.
 */
export const immediateRenderScheduler: RenderScheduler = (/*#__PURE__*/ customRenderScheduler({
  newQueue: () => immediateRenderQueue,
}));
