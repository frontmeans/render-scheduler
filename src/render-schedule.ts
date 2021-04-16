import { nodeWindow } from '@frontmeans/dom-primitives';
import type { RenderExecution, RenderShot } from './render-shot';

/**
 * Render schedule signature.
 *
 * This function accepts a {@link RenderShot render shot} to schedule. All scheduled render shots are meant to update
 * the same rendering target. If multiple render shots scheduled before execution starts, only the last one will be
 * executed to limit rendering rate.
 *
 * The render shot execution may fail. This should not prevent other scheduled or postponed render shots from being
 * executed. The render shot execution failure reason is expected to be reported with {@link RenderScheduleConfig.error}
 * method.
 *
 * Render schedules are constructed by {@link RenderScheduler render schedulers}, or by {@link newRenderSchedule}
 * function that uses the {@link setRenderScheduler default scheduler} for that.
 *
 * @typeParam TExecution - A type of supported render shot execution context.
 */
export type RenderSchedule<TExecution extends RenderExecution = RenderExecution> =
/**
 * @param shot - A render shot to schedule.
 */
    (this: void, shot: RenderShot<TExecution>) => void;

/**
 * Options for render schedule.
 *
 * This is passed to {@link RenderScheduler render scheduler} when constructing new {@link RenderSchedule schedule}.
 *
 * A {@link RenderScheduleConfig render configuration} can be constructed based on the options with
 * {@link RenderScheduleConfig.by} function.
 */
export interface RenderScheduleOptions {

  /**
   * A window for constructed schedule.
   *
   * Detected by {@link nodeWindow} by default, if {@link node} is specified. Falls back to current `window`.
   *
   * The schedulers that don't need a window never access this option value.
   */
  window?: Window;

  /**
   * A DOM node for constructed schedule.
   *
   * Used to detect missing {@link window} option.
   */
  node?: Node;

  /**
   * Reports an error. E.g. a render shot execution failure.
   *
   * Reports errors with `console.error()` by default.
   *
   * @param messages - Error messages to report.
   */
  error?(this: void, ...messages: any[]): void;

}

/**
 * Render schedule configuration.
 *
 * This is based on {@link RenderScheduleOptions render options}, but has all properties present.
 *
 * The configuration ought to be constructed out of render options by {@link RenderScheduleConfig.by} function.
 */
export interface RenderScheduleConfig {

  /**
   * A window the schedule is constructed for.
   *
   * The schedulers that don't need a window should never access this option value.
   */
  window: Window;

  /**
   * A DOM node the schedule is constructed for.
   */
  node?: Node;

  /**
   * Reports an error. E.g. a render shot execution failure.
   *
   * @param messages - Error messages to report.
   */
  error(this: void, ...messages: any[]): void;

}

export const RenderScheduleConfig = {

  /**
   * Constructs a configuration of render schedule by its options.
   *
   * @param options - Render scheduler options the configuration should be base on.
   *
   * @returns Render schedule configuration.
   */
  by(this: void, options: RenderScheduleOptions = {}): RenderScheduleConfig {

    let win: Window | undefined;
    const { error = console.error } = options;

    return {
      get node(): Node | undefined {
        return options.node;
      },
      get window(): Window {
        return win || (win = options.window || (options.node ? nodeWindow(options.node) : window));
      },
      error,
    };
  },

};
