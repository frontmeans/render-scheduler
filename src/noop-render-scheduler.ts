/**
 * @module render-scheduler
 */
import { RenderSchedule } from './render-schedule';
import { RenderScheduler } from './render-scheduler';

const noopRenderSchedule: RenderSchedule = () => {};

/**
 * A render scheduler that neither schedules, nor executes renders.
 */
export const noopRenderScheduler: RenderScheduler = () => noopRenderSchedule;
