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

const schedulers = new WeakMap<Window, RenderScheduler>();

function currentWindow(): Window {
  return window;
}

export function setRenderScheduler(
    scheduler?: RenderScheduler | null,
    window: Window = currentWindow(),
): RenderScheduler {
  scheduler = scheduler || animationRenderScheduler;
  schedulers.set(window, scheduler);
  return scheduler;
}

export function newRenderSchedule(
    {
      window = currentWindow(),
    }: RenderScheduleOptions = {},
): RenderSchedule {

  const existing = schedulers.get(window);
  const scheduler = existing ? existing : setRenderScheduler(null, window);

  return scheduler({ window });
}
