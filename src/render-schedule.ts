/**
 * @module render-scheduler
 */
import { ScheduledRender } from './scheduled-render';

/**
 * Render schedule signature.
 *
 * This function accepts {@link ScheduledRender renders} to schedule.
 *
 * If multiple renders scheduled before execution starts, only the last one will be executed to limit their execution
 * rate.
 *
 * The render execution may fail. This should not prevent other scheduled or postponed renders from being executed.
 * The render execution failure reason is expected to be reported with [[RenderScheduleConfig.error]] method.
 *
 * Render schedules are constructed by {@link RenderScheduler render schedulers}, or by [[newRenderSchedule]] function
 * that uses the {@link setRenderScheduler default scheduler} for that.
 */
export type RenderSchedule =
/**
 * @param render  A render to schedule.
 */
    (this: void, render: ScheduledRender) => void;

/**
 * Options for render schedule.
 *
 * This is passed to {@link RenderScheduler render scheduler} when constructing new {@link RenderSchedule schedule}.
 *
 * A {@link RenderScheduleConfig render configuration} can be constructed based on the options with
 * [[RenderScheduleConfig.by]] function.
 */
export interface RenderScheduleOptions {

  /**
   * A window object for constructed schedule.
   *
   * Current `window` by default.
   *
   * The schedulers that don't need a window never access this option value.
   */
  window?: Window;

  /**
   * Reports an error. E.g. a render execution failure.
   *
   * Reports errors with `console.error()` by default.
   *
   * @param messages  Error messages to report.
   */
  error?(...messages: any[]): void;

}

/**
 * Render schedule configuration.
 *
 * This is based on {@link RenderScheduleOptions render options}, but has all properties present.
 *
 * The configuration ought to be constructed out of render options by [[RenderScheduleConfig.by]] function.
 */
export interface RenderScheduleConfig {

  /**
   * A window object the schedule is constructed for.
   *
   * The schedulers that don't need a window should never access this option value.
   */
  window: Window;

  /**
   * Reports an error. E.g. a render execution failure.
   *
   * @param messages  Error messages to report.
   */
  error(...messages: any[]): void;

}

export const RenderScheduleConfig = {

  /**
   * Constructs a configuration of render scheduler by its options.
   *
   * @param options  Render scheduler options the configuration should be base on.
   */
  by(options?: RenderScheduleOptions): RenderScheduleConfig {

    let win: Window | undefined;

    return {
      get window() {
        return win || (win = options && options.window || window);
      },
      error(...messages) {
        options && options.error ? options.error(...messages) : console.error(...messages);
      },
    };
  },

};
