/**
 * @packageDocumentation
 * @module render-scheduler
 */
import { RenderSchedule } from './render-schedule';
import { RenderScheduler } from './render-scheduler';

/**
 * @internal
 */
const noopRenderSchedule: RenderSchedule = () => {/* noop */};

/**
 * A render scheduler that neither schedules, nor executes renders.
 */
export const noopRenderScheduler: RenderScheduler = () => noopRenderSchedule;
