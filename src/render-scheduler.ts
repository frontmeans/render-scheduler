/**
 * @module render-scheduler
 */
import { animationRenderScheduler } from './animation-render-scheduler';

export type RenderScheduler = (this: void, config: RenderScheduleConfig) => RenderSchedule;

export type RenderSchedule = (this: void, render: ScheduledRender) => void;

export interface RenderScheduleConfig {
  window: Window;
}

export interface RenderScheduleOptions {
  window?: Window;
}

export type ScheduledRender = (this: void, execution: ScheduledRenderExecution) => void;

export interface ScheduledRenderExecution {
  readonly window: Window;
  postpone(render: ScheduledRender): void;
}

function currentWindow(): Window {
  return window;
}

let defaultRenderScheduler = animationRenderScheduler;

export function setRenderScheduler(
    scheduler?: RenderScheduler | null,
): RenderScheduler {
  return defaultRenderScheduler = scheduler || animationRenderScheduler;
}

export function newRenderSchedule(
    {
      window = currentWindow(),
    }: RenderScheduleOptions = {},
): RenderSchedule {
  return defaultRenderScheduler({ window });
}
