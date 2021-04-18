import type { RenderSchedule, RenderScheduleOptions } from './render-schedule';
import type { RenderScheduler } from './render-scheduler';
import type { RenderExecution } from './render-shot';

/**
 * A render scheduler that schedules rendering by another one.
 *
 * The target scheduler can be switched at any time.
 *
 * Can be constructed by {@link newDelegateRenderScheduler} function.
 *
 * @typeParam TExecution - A type of supported render shot execution context.
 * @typeParam TOptions - A type of accepted render schedule options.
 */
export interface DelegateRenderScheduler<
    TExecution extends RenderExecution = RenderExecution,
    TOptions extends RenderScheduleOptions = RenderScheduleOptions>
    extends RenderScheduler<TExecution, TOptions> {

  /**
   * Switches a render scheduler to schedule rendering by.
   *
   * The previously scheduled render shots would still be executed by previous scheduler.
   *
   * Does nothing if the target scheduler is the same as previous one.
   *
   * @param scheduler - A render scheduler to delegate scheduling to from now on.
   *
   * @returns `this` instance.
   */
  scheduleBy(this: void, scheduler: RenderScheduler<TExecution>): this;

}

/**
 * Creates a render scheduler that delegates scheduling to the given one.
 *
 * @param scheduler - A A render scheduler to delegate scheduling to.
 *
 * @typeParam TExecution - A type of supported render shot execution context.
 * @typeParam TOptions - A type of accepted render schedule options.
 */
export function newDelegateRenderScheduler<
    TExecution extends RenderExecution,
    TOptions extends RenderScheduleOptions = RenderScheduleOptions>(
    scheduler: RenderScheduler<TExecution>,
): DelegateRenderScheduler<TExecution, TOptions> {

  const result = ((options: TOptions): RenderSchedule<TExecution> => {

    let usedScheduler = scheduler;
    let schedule = scheduler(options);

    return shot => {
      if (usedScheduler !== scheduler) {
        usedScheduler = scheduler;
        schedule = scheduler(options);
      }

      schedule(shot);
    };
  }) as DelegateRenderScheduler<TExecution, TOptions>;

  result.scheduleBy = newScheduler => {
    scheduler = newScheduler;
    return result;
  };

  return result;
}
