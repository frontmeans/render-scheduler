import { noopRenderSchedule } from './noop-render-schedule.impl';
import type { RenderScheduler } from './render-scheduler';

/**
 * A render scheduler that neither schedules, nor executes render shots.
 */
export const noopRenderScheduler: RenderScheduler<never> = _options => noopRenderSchedule;
