import type { CxEntry } from '@proc7ts/context-values';
import { cxRenderScheduler } from './cx-render-scheduler';
import type { RenderSchedule, RenderScheduleOptions } from './render-schedule';
import type { RenderExecution } from './render-shot';

/**
 * Render scheduler signature.
 *
 * This function creates a {@link RenderSchedule render schedule} according to the given options.
 *
 * The default render scheduler is always available as {@link newRenderSchedule} function.
 *
 * There are several scheduler implementations exist:
 * - {@link animationRenderScheduler} (used by default),
 * - {@link asyncRenderScheduler},
 * - {@link immediateRenderScheduler},
 * - {@link queuedRenderScheduler},
 * - {@link ManualRenderScheduler},
 * - {@link noopRenderScheduler}.
 *
 * Custom scheduler implementations could be created using {@link customRenderScheduler} function.
 *
 * @typeParam TExecution - A type of supported render shot execution context.
 * @typeParam TOptions - A type of accepted render schedule options.
 * @param options - Created render schedule options.
 *
 * @returns New render schedule.
 */
export type RenderScheduler<
    TExecution extends RenderExecution = RenderExecution,
    TOptions extends RenderScheduleOptions = RenderScheduleOptions,
    > = (
    this: void,
    options?: TOptions,
) => RenderSchedule<TExecution>;

/**
 * Context entry containing {@link RenderScheduler} instance.
 *
 * Uses {@link newRenderSchedule default} render scheduler by default.
 */
export const RenderScheduler: CxEntry<RenderScheduler, RenderScheduler> = {
  perContext: (/*#__PURE__*/ cxRenderScheduler()),
  toString: () => '[RenderScheduler]',
};
