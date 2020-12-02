/**
 * @packageDocumentation
 * @module @frontmeans/render-scheduler
 */
import type { RenderSchedule } from './render-schedule';
import type { RenderScheduler } from './render-scheduler';

/**
 * @internal
 */
const noopRenderSchedule: RenderSchedule = () => {/* noop */};

/**
 * A render scheduler that neither schedules, nor executes render shots.
 */
export const noopRenderScheduler: RenderScheduler = () => noopRenderSchedule;
