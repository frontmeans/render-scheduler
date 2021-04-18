import { Supply } from '@proc7ts/supply';
import { DraftRenderExecution, mapRenderSchedule } from './map-render-schedule';
import type { RenderSchedule, RenderScheduleOptions } from './render-schedule';
import { RenderScheduleConfig } from './render-schedule';
import type { RenderScheduler } from './render-scheduler';
import type { RenderExecution, RenderShot } from './render-shot';

/**
 * Options for abortable render schedule.
 */
export interface AbortableRenderScheduleOptions extends RenderScheduleOptions {

  /**
   * Render schedule supply.
   *
   * Stops rendering in created schedule once cut off.
   *
   * A new supply will be created when omitted.
   */
  readonly supply?: Supply;

}

/**
 * Abortable render shot execution context.
 *
 * This is passed to {@link RenderShot render shot} when the latter executed by {@link AbortableRenderScheduler
 * abortable} render scheduler.
 */
export interface AbortableRenderExecution extends RenderExecution {

  /**
   * Render schedule supply.
   *
   * Stops rendering in current schedule once cut off.
   *
   * This is the same as {@link AbortableRenderSchedule.supply}.
   */
  readonly supply: Supply;

}

/**
 * A render schedule that can be aborted.
 *
 * Created by {@link AbortableRenderScheduler abortable render scheduler}.
 *
 * @typeParam TExecution - A type of supported render shot execution context.
 */
export interface AbortableRenderSchedule<TExecution extends RenderExecution = RenderExecution>
    extends RenderSchedule<TExecution & AbortableRenderExecution> {

  /**
   * A supply of this render schedule.
   *
   * Stops rendering in this schedule once cut off.
   *
   * This is either a supply passed as an {@link AbortableRenderScheduleOptions.supply option}, or the one created for
   * this schedule when omitted.
   */
  readonly supply: Supply;

}

/**
 * A render scheduler that allows to abort scheduling and execution.
 *
 * Can be created by {@link newAbortableRenderScheduler} function.
 *
 * @typeParam TExecution - A type of supported render shot execution context.
 * @typeParam TOptions - A type of accepted render schedule options.
 */
export interface AbortableRenderScheduler<
    TExecution extends RenderExecution = RenderExecution,
    TOptions extends RenderScheduleOptions = RenderScheduleOptions> {

  /**
   * Creates an {@link AbortableRenderSchedule abortable} render schedule according to the given options.
   *
   * @param options - Created render schedule options.
   *
   * @returns New render schedule.
   */
  (this: void, options?: TOptions & AbortableRenderScheduleOptions): AbortableRenderSchedule<TExecution>;

  /**
   * A supply of this render scheduler.
   *
   * Once cut off, stops rendering in all schedules created by this scheduler.
   *
   * This is either a supply passed to {@link newAbortableRenderScheduler} function, or the one created for this
   * scheduler when omitted.
   */
  readonly supply: Supply;

}

/**
 * Creates an abortable render schedule.
 *
 * @typeParam TExecution - A type of supported render shot execution context.
 * @typeParam TOptions - A type of accepted render schedule options.
 * @param scheduler - A render scheduler to schedule rendering by.
 * @param supply - Schedule supply. Once cut off, stops rendering in all schedules created by new scheduler.
 * A new supply will be created if omitted.
 *
 * @returns New abortable render scheduler instance.
 */
export function newAbortableRenderScheduler<
    TExecution extends RenderExecution,
    TOptions extends RenderScheduleOptions,
    >(
    scheduler: RenderScheduler<TExecution, TOptions>,
    supply = new Supply(),
): AbortableRenderScheduler<TExecution, TOptions> {

  const abortableScheduler = ((
      options?: TOptions & AbortableRenderScheduleOptions,
  ): AbortableRenderSchedule<TExecution> => {

    const scheduleSupply = options?.supply || new Supply();

    scheduleSupply.needs(supply);

    let execute = (
        exec: TExecution,
        draft: DraftRenderExecution<TExecution & AbortableRenderExecution>,
        shot: RenderShot<TExecution & AbortableRenderExecution>,
    ): void => shot({
      ...exec,
      ...draft,
      supply: scheduleSupply,
    });
    let schedule = mapRenderSchedule<TExecution, TExecution & AbortableRenderExecution>(
        scheduler(options),
        (
            exec,
            draft,
            shot,
        ) => execute(exec, draft, shot),
    );
    const abortableSchedule = ((
        shot: RenderShot<TExecution & AbortableRenderExecution>,
    ): void => schedule(shot)) as AbortableRenderSchedule<TExecution>;

    (abortableSchedule as { supply: Supply }).supply = scheduleSupply;
    scheduleSupply.whenOff(reason => {
      execute = AbortableRenderSchedule$doNotExecute;
      schedule = AbortableRenderSchedule$abort(reason, options);
    });

    return abortableSchedule;
  }) as AbortableRenderScheduler<TExecution, TOptions>;

  (abortableScheduler as { supply: Supply }).supply = supply;

  return abortableScheduler;
}

function AbortableRenderSchedule$abort(
    reason: unknown,
    options: RenderScheduleOptions | undefined,
): (_shot: RenderShot<never>) => void {

  const { error } = RenderScheduleConfig.by(options);

  return _shot => {
    error('Rendering aborted', reason);
  };
}

function AbortableRenderSchedule$doNotExecute(
    _exec: RenderExecution,
    _draft: DraftRenderExecution<AbortableRenderExecution>,
    _shot: RenderShot<never>,
): void {
  // Do not execute in aborted schedule
}
