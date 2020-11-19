/**
 * @packageDocumentation
 * @module @proc7ts/render-scheduler
 */
import { animationRenderScheduler } from './animation-render-scheduler';
import type { RenderSchedule, RenderScheduleOptions } from './render-schedule';

/**
 * Render scheduler signature.
 *
 * This function constructs a {@link RenderSchedule render schedule} according to the given options.
 *
 * The default render scheduler is always available as [[newRenderSchedule]] function.
 *
 * There are several scheduler implementations exist:
 * - [[animationRenderScheduler]] (used by default),
 * - [[asyncRenderScheduler]],
 * - [[immediateRenderScheduler]],
 * - [[ManualRenderScheduler]],
 * - [[noopRenderScheduler]].
 *
 * Custom scheduler implementations could be created using [[customRenderScheduler]] function.
 */
export type RenderScheduler =
/**
 * @param options  Options of constructed render schedule.
 *
 * @returns New render schedule.
 */
    (this: void, options?: RenderScheduleOptions) => RenderSchedule;

/**
 * @internal
 */
let defaultRenderScheduler = animationRenderScheduler;

/**
 * Assigns or resets the default render scheduler.
 *
 * An {@link animationRenderScheduler animation frame render scheduler} is used bu default.
 *
 * @param scheduler  New default render scheduler. {@link animationRenderScheduler animation frame render scheduler}
 * will be used if `null`, `undefined`, or omitted.
 *
 * @returns New default render scheduler.
 */
export function setRenderScheduler(
    scheduler?: RenderScheduler | null,
): RenderScheduler {
  return defaultRenderScheduler = scheduler || animationRenderScheduler;
}

/**
 * Constructs {@link RenderSchedule render schedule} using {@link setRenderScheduler default render scheduler}.
 *
 * @param options  Options of constructed render schedule.
 *
 * @returns New render schedule.
 */
export function newRenderSchedule(options?: RenderScheduleOptions): RenderSchedule {
  return defaultRenderScheduler(options);
}
