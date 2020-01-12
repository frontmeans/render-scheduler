/**
 * @module render-scheduler
 */
import { ScheduledRender } from './scheduled-render';

export type RenderSchedule = (this: void, render: ScheduledRender) => void;

export interface RenderScheduleOptions {
  window?: Window;
  error?(error: any): void;
}

export interface RenderScheduleConfig {
  window: Window;
  error(error: any): void;
}

export function renderScheduleConfig(options?: RenderScheduleOptions): RenderScheduleConfig {

  let win: Window | undefined;

  return {
    get window() {
      return win || (win = options && options.window || window);
    },
    error(error) {
      options && options.error ? options.error(error) : console.error(error);
    },
  };
}
