import { animationRenderScheduler } from './animation-render-scheduler';
import type { RenderSchedule, RenderScheduleOptions } from './render-schedule';
import type { RenderScheduler } from './render-scheduler';

let defaultRenderScheduler = animationRenderScheduler;

/**
 * Assigns or resets the default render scheduler.
 *
 * An {@link animationRenderScheduler animation frame render scheduler} is used bu default.
 *
 * @param scheduler - New default render scheduler. {@link animationRenderScheduler animation frame render scheduler}
 * will be used if `null`, `undefined`, or omitted.
 *
 * @returns New default render scheduler.
 */
export function setRenderScheduler(scheduler?: RenderScheduler | null): RenderScheduler {
  return (defaultRenderScheduler = scheduler || animationRenderScheduler);
}

/**
 * Constructs {@link RenderSchedule render schedule} using {@link setRenderScheduler default render scheduler}.
 *
 * @param options - Options of constructed render schedule.
 *
 * @returns New render schedule.
 */
export function newRenderSchedule(options?: RenderScheduleOptions): RenderSchedule {
  return defaultRenderScheduler(options);
}
