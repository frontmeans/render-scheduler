/**
 * @module render-scheduler
 */
import { RenderScheduleConfig } from './render-schedule';

/**
 * Scheduled render signature.
 *
 * This is a render task executed by {@link RenderSchedule rendering schedule}.
 */
export type ScheduledRender =
/**
 * @param execution  Rendering execution instance.
 */
    (this: void, execution: ScheduledRenderExecution) => void;

/**
 * Scheduled render execution.
 *
 * This is passed to {@link ScheduledRender render} when the latter executed.
 */
export interface ScheduledRenderExecution {

  /**
   * A configuration of rendering schedule the render is executed by.
   */
  readonly config: RenderScheduleConfig;

  // tslint:disable:max-line-length
  /**
   * Postpones another render, so that it is executed after all currently scheduled renders.
   *
   * This may be useful e.g. when the render issues a synchronous page reflow. In this case postponing it until after
   * the all DOM modifications done would help to reduce [layout thrashing].
   *
   * [layout thrashing]: https://developers.google.com/web/fundamentals/performance/rendering/avoid-large-complex-layouts-and-layout-thrashing
   *
   * @param render  A render to postpone.
   */
  // tslint:enable:max-line-length
  postpone(render: ScheduledRender): void;

}
