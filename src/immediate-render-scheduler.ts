/**
 * @module render-scheduler
 */
import { ScheduledRenderQueue } from './custom-render-scheduler';
import { CustomRenderScheduler } from './custom-render-scheduler.impl';
import { RenderScheduleConfig } from './render-schedule';
import { RenderScheduler } from './render-scheduler';

const _immediateRenderScheduler = new CustomRenderScheduler(ScheduledRenderQueue.by({
  schedule: task => task(),
}));

/**
 * A render scheduler that executes renders immediately upon scheduling.
 *
 * The renders scheduled during render execution are executed immediately after current (and postponed) renders
 * execution.
 */
export const immediateRenderScheduler: RenderScheduler = scheduleOptions => {
  return render => _immediateRenderScheduler.render(render, RenderScheduleConfig.by(scheduleOptions));
};
