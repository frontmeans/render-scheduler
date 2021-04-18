import type { RenderSchedule } from './render-schedule';
import type { RenderExecution, RenderShot } from './render-shot';

/**
 * Creates a render schedule mapped from another one.
 *
 * The mapped schedule may support a render execution of another type.
 *
 * @typeParam TFromExecution - A type of render shot execution context supported by original schedule.
 * @typeParam TToExecution - A type of render shot execution context supported by mapped schedule.
 * @param schedule - A schedule to map from.
 * @param execute - Executes a render shot in mapped execution context.
 *
 * @returns Mapped render schedule instance.
 */
export function mapRenderSchedule<TFromExecution extends RenderExecution, TToExecution extends RenderExecution>(
    schedule: RenderSchedule<TFromExecution>,
    execute: (
        this: void,
        execution: TFromExecution,
        draft: DraftRenderExecution<TToExecution>,
        shot: RenderShot<TToExecution>,
    ) => void,
): RenderSchedule<TToExecution> {
  return shot => schedule((fromExec: TFromExecution): void => {

    let toExec!: TToExecution;
    const draft: DraftRenderExecution<TToExecution> = {
      postpone(postponed: RenderShot<TToExecution>) {
        fromExec.postpone(_exec => postponed(toExec));
      },
    };

    execute(
        fromExec,
        draft,
        exec => shot(toExec = exec),
    );
  });
}

/**
 * Mapped render executor signature.
 *
 * Executes a render shot in mapped execution context.
 *
 * @typeParam TFromExecution - A type of render shot execution context supported by original schedule.
 * @typeParam TToExecution - A type of render shot execution context supported by mapped schedule.
 */
export type MappedRenderExecutor<TFromExecution extends RenderExecution, TToExecution extends RenderExecution> =
/**
 * @param execution - Original render shot execution context.
 * @param draft - A draft of mapped render shot execution context.
 * @param shot - A render shot to execute.
 */
    (
        this: void,
        execution: TFromExecution,
        draft: DraftRenderExecution<TToExecution>,
        shot: RenderShot<TToExecution>,
    ) => void;

/**
 * A draft of the mapped render shot execution context.
 *
 * Contains a {@link RenderExecution.postpone} method implementation.
 *
 * Passed to the {@link MappedRenderExecutor mapped executor} to help it build a mapped render execution context.
 *
 * @typeParam TExecution - A type of render shot execution context supported by mapped schedule.
 */
export interface DraftRenderExecution<TExecution extends RenderExecution> {
  postpone(this: void, postponed: RenderShot<TExecution>): void;
}
