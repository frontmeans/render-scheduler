/**
 * @packageDocumentation
 * @module render-scheduler
 */
import { customRenderScheduler, ScheduledRenderQueue } from './custom-render-scheduler';
import { RenderScheduler } from './render-scheduler';

/**
 * @internal
 */
let immediateRenderQueue = (/*#__PURE__*/ ScheduledRenderQueue.by({
  schedule: task => task(),
  replace: replacement => immediateRenderQueue = replacement,
}));

export const immediateRenderScheduler: RenderScheduler = (/*#__PURE__*/ customRenderScheduler({
  newQueue: () => immediateRenderQueue,
}));
