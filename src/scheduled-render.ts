/**
 * @module render-scheduler
 */
import { RenderScheduleConfig } from './render-schedule';

export type ScheduledRender = (this: void, execution: ScheduledRenderExecution) => void;

export interface ScheduledRenderExecution {
  readonly config: RenderScheduleConfig;
  postpone(render: ScheduledRender): void;
}
