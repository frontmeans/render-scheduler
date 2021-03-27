import type { RenderScheduleConfig } from './render-schedule';

/**
 * Render shot signature.
 *
 * Render shots are scheduled in {@link RenderSchedule rendering schedule}. The latest render shot scheduled in the same
 * schedule should be able to update its rendering target to actual state. So that previously scheduled shots could be
 * skipped.
 *
 * @typeParam TExecution - A type of supported execution context.
 */
export type RenderShot<TExecution extends RenderExecution = RenderExecution> =
/**
 * @param execution - Render shot execution context instance.
 */
    (this: void, execution: TExecution) => void;

/**
 * Render shot execution context.
 *
 * This is passed to {@link RenderShot render shot} when the latter executed.
 */
export interface RenderExecution {

  /**
   * A configuration of rendering schedule the render shot is executed by.
   */
  readonly config: RenderScheduleConfig;

  /**
   * Postpones render shot so that it is executed after all currently executed render shots.
   *
   * This may be useful e.g. when the render shot issues a synchronous page reflow. In this case postponing it until
   * after all DOM modifications done would help reduce [layout thrashing].
   *
   * Postponed render shots are executed in reverse order.
   *
   * [layout thrashing]: https://developers.google.com/web/fundamentals/performance/rendering/avoid-large-complex-layouts-and-layout-thrashing
   *
   * @param postponed - A render shot to postpone.
   */
  postpone(postponed: RenderShot<this>): void;

}
