/**
 * @module render-scheduler
 */
import { animationRenderScheduler } from './animation-render-scheduler';
import { RenderSchedule, RenderScheduleOptions } from './render-schedule';

export type RenderScheduler = (this: void, options?: RenderScheduleOptions) => RenderSchedule;

let defaultRenderScheduler = animationRenderScheduler;

export function setRenderScheduler(
    scheduler?: RenderScheduler | null,
): RenderScheduler {
  return defaultRenderScheduler = scheduler || animationRenderScheduler;
}

export function newRenderSchedule(options?: RenderScheduleOptions): RenderSchedule {
  return defaultRenderScheduler(options);
}
