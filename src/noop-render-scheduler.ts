/**
 * @packageDocumentation
 * @module @proc7ts/render-scheduler
 */
import { RenderSchedule } from './render-schedule';
import { RenderScheduler } from './render-scheduler';

/**
 * @internal
 */
const noopRenderSchedule: RenderSchedule = () => {/* noop */};

/**
 * A render scheduler that neither schedules, nor executes render shots.
 */
export const noopRenderScheduler: RenderScheduler = () => noopRenderSchedule;
