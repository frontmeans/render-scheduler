/**
 * @packageDocumentation
 * @module @proc7ts/render-scheduler
 */
import { RenderShot } from './render-shot';

/**
 * Render schedule signature.
 *
 * This function accepts a {@link RenderShot render shot} to schedule. All scheduled render shots are meant to update
 * the same rendering target. If multiple render shots scheduled before execution starts, only the last one will be
 * executed to limit rendering rate.
 *
 * The render shot execution may fail. This should not prevent other scheduled or postponed render shots from being
 * executed. The render shot execution failure reason is expected to be reported with [[RenderScheduleConfig.error]]
 * method.
 *
 * Render schedules are constructed by {@link RenderScheduler render schedulers}, or by [[newRenderSchedule]] function
 * that uses the {@link setRenderScheduler default scheduler} for that.
 */
export type RenderSchedule =
/**
 * @param shot  A render shot to schedule.
 */
    (this: void, shot: RenderShot) => void;

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
   * A window for constructed schedule.
   *
   * Detected by [[nodeWindow]] by default, if [[node]] is specified. Falls back to current `window`.
   *
   * The schedulers that don't need a window never access this option value.
   */
  window?: Window;

  /**
   * A DOM node for constructed schedule.
   *
   * Used to detect missing [[window]] option.
   */
  node?: Node;

  /**
   * Reports an error. E.g. a render shot execution failure.
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
  by(this: void, options: RenderScheduleOptions = {}): RenderScheduleConfig {

    let win: Window | undefined;

    return {
      get node() {
        return options.node;
      },
      get window() {
        return win || (win = options.window || (options.node && nodeWindow(options.node)) || window);
      },
      error(...messages) {
        if (options && options.error) {
          options.error(...messages);
        } else {
          console.error(...messages);
        }
      },
    };
  },

};

/**
 * Detects a window the given DOM node is attached to.
 *
 * @param node  Target DOM node.
 *
 * @returns A window of the owner document, or `null` if absent.
 */
export function nodeWindow(node: Node): Window | null {

  const document = node.ownerDocument || node as Document;

  return document.defaultView;
}
